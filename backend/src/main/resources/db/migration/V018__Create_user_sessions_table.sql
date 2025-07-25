-- V018__Create_user_sessions_table.sql
-- Create user sessions table for JWT token management and session tracking
-- Supports secure token storage, refresh token management, and session auditing

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Token information
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash of JWT token
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash of refresh token
    token_type VARCHAR(20) NOT NULL DEFAULT 'jwt' CHECK (
        token_type IN ('jwt', 'api_key', 'oauth')
    ),
    
    -- Session lifecycle
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255), -- For device tracking
    device_type VARCHAR(50) CHECK (
        device_type IN ('desktop', 'mobile', 'tablet', 'api_client', 'unknown')
    ),
    
    -- Geographic information
    geo_location JSONB, -- {"country": "JP", "city": "Tokyo", "lat": 35.6762, "lng": 139.6503}
    timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
    
    -- Security flags
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    revocation_reason VARCHAR(255),
    
    -- Two-factor authentication status
    is_mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Session security
    concurrent_session_limit INTEGER DEFAULT 5,
    force_logout_other_sessions BOOLEAN DEFAULT FALSE,
    
    -- Risk assessment
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    security_flags JSONB DEFAULT '{}', -- Store security-related metadata
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sessions_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sessions_revoked_by FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Business logic constraints
    CONSTRAINT chk_expires_at_future CHECK (expires_at > issued_at),
    CONSTRAINT chk_refresh_expires_future CHECK (refresh_expires_at > expires_at),
    CONSTRAINT chk_revoked_consistency CHECK (
        (is_revoked = FALSE AND revoked_at IS NULL AND revoked_by IS NULL) OR
        (is_revoked = TRUE AND revoked_at IS NOT NULL)
    ),
    CONSTRAINT chk_mfa_consistency CHECK (
        (is_mfa_verified = FALSE AND mfa_verified_at IS NULL) OR
        (is_mfa_verified = TRUE AND mfa_verified_at IS NOT NULL)
    )
);

-- Create indexes for performance and security
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_tenant_id ON user_sessions(tenant_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_refresh_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_used_at ON user_sessions(last_used_at);
CREATE INDEX idx_user_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX idx_user_sessions_device_type ON user_sessions(device_type);
CREATE INDEX idx_user_sessions_is_revoked ON user_sessions(is_revoked) WHERE is_revoked = FALSE;
CREATE INDEX idx_user_sessions_risk_score ON user_sessions(risk_score) WHERE risk_score > 50;

-- Composite indexes for common query patterns
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_tenant_active ON user_sessions(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_user_device ON user_sessions(user_id, device_type, is_active);
CREATE INDEX idx_user_sessions_expires_active ON user_sessions(expires_at, is_active) WHERE is_active = TRUE;

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
CREATE POLICY tenant_isolation_user_sessions ON user_sessions
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create trigger to automatically set tenant_id
CREATE TRIGGER set_tenant_id_user_sessions
    BEFORE INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create updated_at trigger
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Delete sessions that are fully expired (both access and refresh tokens)
    DELETE FROM user_sessions 
    WHERE 
        refresh_expires_at < CURRENT_TIMESTAMP
        AND (last_used_at < CURRENT_TIMESTAMP - INTERVAL '30 days' OR last_used_at IS NULL);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Revoke sessions that are access-token expired but refresh-token still valid
    UPDATE user_sessions 
    SET 
        is_revoked = TRUE,
        revoked_at = CURRENT_TIMESTAMP,
        revocation_reason = 'Automatic cleanup - access token expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        expires_at < CURRENT_TIMESTAMP
        AND refresh_expires_at >= CURRENT_TIMESTAMP
        AND is_revoked = FALSE
        AND last_used_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Create function to revoke all sessions for a user
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(target_user_id UUID, reason VARCHAR(255) DEFAULT 'User logout')
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE user_sessions 
    SET 
        is_revoked = TRUE,
        is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revocation_reason = reason,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        user_id = target_user_id
        AND is_revoked = FALSE;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the session revocation
    INSERT INTO audit_logs (event_type, resource_type, resource_id, user_id, details, created_at)
    VALUES (
        'SESSION_REVOCATION',
        'USER_SESSION',
        target_user_id,
        target_user_id,
        FORMAT('Revoked %s active sessions. Reason: %s', affected_rows, reason),
        CURRENT_TIMESTAMP
    );
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Create function to enforce concurrent session limits
CREATE OR REPLACE FUNCTION enforce_session_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_active_sessions INTEGER;
    session_limit INTEGER;
    oldest_session_id UUID;
BEGIN
    -- Get the session limit for this user (default 5)
    session_limit := COALESCE(NEW.concurrent_session_limit, 5);
    
    -- Count current active sessions for this user
    SELECT COUNT(*) INTO current_active_sessions
    FROM user_sessions 
    WHERE 
        user_id = NEW.user_id 
        AND is_active = TRUE 
        AND is_revoked = FALSE
        AND expires_at > CURRENT_TIMESTAMP;
    
    -- If we're at or over the limit, revoke the oldest session
    IF current_active_sessions >= session_limit THEN
        -- Find the oldest active session for this user
        SELECT id INTO oldest_session_id
        FROM user_sessions 
        WHERE 
            user_id = NEW.user_id 
            AND is_active = TRUE 
            AND is_revoked = FALSE
            AND expires_at > CURRENT_TIMESTAMP
        ORDER BY last_used_at ASC, created_at ASC
        LIMIT 1;
        
        -- Revoke the oldest session
        IF oldest_session_id IS NOT NULL THEN
            UPDATE user_sessions 
            SET 
                is_revoked = TRUE,
                is_active = FALSE,
                revoked_at = CURRENT_TIMESTAMP,
                revocation_reason = 'Concurrent session limit exceeded',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = oldest_session_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce session limits
CREATE TRIGGER enforce_session_limit_trigger
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION enforce_session_limit();

-- Create function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(session_token_hash VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_sessions 
    SET 
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        token_hash = session_token_hash
        AND is_active = TRUE
        AND is_revoked = FALSE
        AND expires_at > CURRENT_TIMESTAMP;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create view for active user sessions
CREATE VIEW active_user_sessions AS
SELECT 
    us.id,
    us.user_id,
    us.tenant_id,
    u.email,
    u.first_name,
    u.last_name,
    us.device_type,
    us.ip_address,
    us.user_agent,
    us.issued_at,
    us.expires_at,
    us.last_used_at,
    us.is_mfa_verified,
    us.risk_score,
    us.geo_location,
    EXTRACT(EPOCH FROM (us.expires_at - CURRENT_TIMESTAMP)) / 60 as minutes_until_expiry
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE 
    us.is_active = TRUE 
    AND us.is_revoked = FALSE 
    AND us.expires_at > CURRENT_TIMESTAMP;

-- Create view for session statistics by tenant
CREATE VIEW tenant_session_statistics AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE us.is_active = TRUE AND us.is_revoked = FALSE AND us.expires_at > CURRENT_TIMESTAMP) as active_sessions,
    COUNT(DISTINCT us.user_id) as unique_users_with_sessions,
    AVG(us.risk_score) as average_risk_score,
    COUNT(*) FILTER (WHERE us.device_type = 'mobile') as mobile_sessions,
    COUNT(*) FILTER (WHERE us.device_type = 'desktop') as desktop_sessions,
    COUNT(*) FILTER (WHERE us.is_mfa_verified = TRUE) as mfa_verified_sessions
FROM tenants t
LEFT JOIN user_sessions us ON t.id = us.tenant_id
GROUP BY t.id, t.name;

-- Add table comments
COMMENT ON TABLE user_sessions IS 'JWT token sessions with security tracking and multi-tenant isolation';
COMMENT ON COLUMN user_sessions.token_hash IS 'SHA-256 hash of the JWT access token for secure storage';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS 'SHA-256 hash of the refresh token for renewal';
COMMENT ON COLUMN user_sessions.risk_score IS 'Security risk score (0-100) based on login patterns and behavior';
COMMENT ON COLUMN user_sessions.security_flags IS 'JSON metadata for security-related information';
COMMENT ON COLUMN user_sessions.concurrent_session_limit IS 'Maximum allowed concurrent sessions for this user';
COMMENT ON COLUMN user_sessions.geo_location IS 'Geographic location data for security monitoring';

COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired and inactive sessions to maintain database hygiene';
COMMENT ON FUNCTION revoke_all_user_sessions(UUID, VARCHAR) IS 'Revokes all active sessions for a specific user';
COMMENT ON FUNCTION enforce_session_limit() IS 'Ensures users do not exceed their concurrent session limit';
COMMENT ON FUNCTION update_session_activity(VARCHAR) IS 'Updates the last_used_at timestamp for session activity tracking';

COMMENT ON VIEW active_user_sessions IS 'View of currently active user sessions with user details';
COMMENT ON VIEW tenant_session_statistics IS 'Statistical overview of session usage by tenant';