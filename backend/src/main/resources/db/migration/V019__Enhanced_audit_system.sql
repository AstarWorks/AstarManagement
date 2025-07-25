-- V019__Enhanced_audit_system.sql
-- Create comprehensive audit system for legal compliance
-- Implements immutable audit trails, security event logging, and compliance reporting

-- Enhanced audit_logs table (check if it exists from V006)
-- If the table exists, we'll add missing columns, otherwise create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_type VARCHAR(100) NOT NULL,
            resource_type VARCHAR(100) NOT NULL,
            resource_id UUID,
            user_id UUID,
            details JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    END IF;
END
$$;

-- Add new columns for enhanced audit capabilities
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS api_endpoint VARCHAR(255),
ADD COLUMN IF NOT EXISTS http_method VARCHAR(10),
ADD COLUMN IF NOT EXISTS before_data JSONB,
ADD COLUMN IF NOT EXISTS after_data JSONB,
ADD COLUMN IF NOT EXISTS data_classification VARCHAR(50) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS compliance_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS severity_level VARCHAR(20) DEFAULT 'info',
ADD COLUMN IF NOT EXISTS geo_location JSONB,
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS checksum VARCHAR(64); -- For audit log integrity

-- Add constraints for new columns
ALTER TABLE audit_logs 
ADD CONSTRAINT IF NOT EXISTS chk_severity_level CHECK (
    severity_level IN ('debug', 'info', 'warning', 'error', 'critical')
),
ADD CONSTRAINT IF NOT EXISTS chk_data_classification CHECK (
    data_classification IN ('public', 'internal', 'confidential', 'restricted')
),
ADD CONSTRAINT IF NOT EXISTS chk_http_method CHECK (
    http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')
);

-- Add foreign key constraints for new columns
ALTER TABLE audit_logs 
ADD CONSTRAINT IF NOT EXISTS fk_audit_logs_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
ADD CONSTRAINT IF NOT EXISTS fk_audit_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT IF NOT EXISTS fk_audit_logs_session_id 
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_level ON audit_logs(severity_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_category ON audit_logs(compliance_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_data_classification ON audit_logs(data_classification);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success) WHERE success = FALSE;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_event_date ON audit_logs(tenant_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_date ON audit_logs(resource_type, resource_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_date ON audit_logs(compliance_category, created_at);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
CREATE POLICY IF NOT EXISTS tenant_isolation_audit_logs ON audit_logs
    FOR SELECT 
    TO authenticated_users
    USING (tenant_id = current_tenant_id() OR tenant_id IS NULL);

-- Audit logs are append-only, no UPDATE/DELETE policies needed for security

-- Create function to generate audit log checksum for integrity
CREATE OR REPLACE FUNCTION generate_audit_checksum(
    p_event_type VARCHAR(100),
    p_resource_type VARCHAR(100), 
    p_resource_id UUID,
    p_user_id UUID,
    p_details JSONB,
    p_created_at TIMESTAMP WITH TIME ZONE
) RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(
        digest(
            COALESCE(p_event_type, '') || '|' ||
            COALESCE(p_resource_type, '') || '|' ||
            COALESCE(p_resource_id::TEXT, '') || '|' ||
            COALESCE(p_user_id::TEXT, '') || '|' ||
            COALESCE(p_details::TEXT, '{}') || '|' ||
            p_created_at::TEXT,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically generate checksums
CREATE OR REPLACE FUNCTION set_audit_checksum()
RETURNS TRIGGER AS $$
BEGIN
    NEW.checksum := generate_audit_checksum(
        NEW.event_type,
        NEW.resource_type,
        NEW.resource_id,
        NEW.user_id,
        NEW.details,
        NEW.created_at
    );
    
    -- Auto-populate tenant_id if not provided
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := current_tenant_id();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit log checksums
DROP TRIGGER IF EXISTS set_audit_checksum_trigger ON audit_logs;
CREATE TRIGGER set_audit_checksum_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_audit_checksum();

-- Create function to log audit events (public API for application use)
CREATE OR REPLACE FUNCTION log_audit_event(
    p_event_type VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_session_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id VARCHAR(255) DEFAULT NULL,
    p_api_endpoint VARCHAR(255) DEFAULT NULL,
    p_http_method VARCHAR(10) DEFAULT NULL,
    p_before_data JSONB DEFAULT NULL,
    p_after_data JSONB DEFAULT NULL,
    p_data_classification VARCHAR(50) DEFAULT 'internal',
    p_compliance_category VARCHAR(100) DEFAULT NULL,
    p_severity_level VARCHAR(20) DEFAULT 'info',
    p_geo_location JSONB DEFAULT NULL,
    p_device_type VARCHAR(50) DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        event_type, resource_type, resource_id, user_id, details,
        session_id, ip_address, user_agent, request_id, api_endpoint,
        http_method, before_data, after_data, data_classification,
        compliance_category, severity_level, geo_location, device_type,
        success, error_message, duration_ms
    ) VALUES (
        p_event_type, p_resource_type, p_resource_id, p_user_id, p_details,
        p_session_id, p_ip_address, p_user_agent, p_request_id, p_api_endpoint,
        p_http_method, p_before_data, p_after_data, p_data_classification,
        p_compliance_category, p_severity_level, p_geo_location, p_device_type,
        p_success, p_error_message, p_duration_ms
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_integrity(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '1 day',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) RETURNS TABLE (
    audit_id UUID,
    is_valid BOOLEAN,
    stored_checksum VARCHAR(64),
    calculated_checksum VARCHAR(64)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.checksum = generate_audit_checksum(
            al.event_type, al.resource_type, al.resource_id,
            al.user_id, al.details, al.created_at
        ) as is_valid,
        al.checksum as stored_checksum,
        generate_audit_checksum(
            al.event_type, al.resource_type, al.resource_id,
            al.user_id, al.details, al.created_at
        ) as calculated_checksum
    FROM audit_logs al
    WHERE al.created_at BETWEEN start_date AND end_date
    ORDER BY al.created_at;
END;
$$ LANGUAGE plpgsql;

-- Create table for audit log archival
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    LIKE audit_logs INCLUDING ALL
);

-- Create function for audit log archival
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
    archive_before_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '2 years'
) RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move old audit logs to archive table
    WITH moved_rows AS (
        DELETE FROM audit_logs 
        WHERE created_at < archive_before_date
        RETURNING *
    )
    INSERT INTO audit_logs_archive 
    SELECT * FROM moved_rows;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Log the archival operation
    PERFORM log_audit_event(
        'AUDIT_ARCHIVAL',
        'AUDIT_LOG',
        NULL,
        NULL,
        json_build_object(
            'archived_count', archived_count,
            'archive_before_date', archive_before_date
        ),
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        'internal', 'data_retention', 'info'
    );
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create specialized audit views for legal compliance

-- View for data access audit (for client data protection)
CREATE VIEW data_access_audit AS
SELECT 
    al.id,
    al.tenant_id,
    al.event_type,
    al.resource_type,
    al.resource_id,
    al.user_id,
    u.email as user_email,
    u.first_name || ' ' || u.last_name as user_name,
    al.ip_address,
    al.device_type,
    al.geo_location,
    al.details,
    al.before_data,
    al.after_data,
    al.created_at,
    al.success
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.event_type IN (
    'DATA_ACCESS', 'DATA_EXPORT', 'DATA_DOWNLOAD', 'DOCUMENT_VIEW',
    'MATTER_VIEW', 'CLIENT_DATA_ACCESS', 'SEARCH_QUERY'
)
AND al.data_classification IN ('confidential', 'restricted');

-- View for security events audit
CREATE VIEW security_events_audit AS
SELECT 
    al.id,
    al.tenant_id,
    al.event_type,
    al.user_id,
    u.email as user_email,
    al.ip_address,
    al.user_agent,
    al.session_id,
    al.severity_level,
    al.success,
    al.error_message,
    al.details,
    al.geo_location,
    al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.event_type IN (
    'LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILURE',
    'LOGOUT', 'PASSWORD_CHANGE', 'MFA_CHALLENGE',
    'UNAUTHORIZED_ACCESS', 'PERMISSION_DENIED',
    'SUSPICIOUS_ACTIVITY', 'SECURITY_VIOLATION'
)
ORDER BY al.created_at DESC;

-- View for compliance reporting
CREATE VIEW compliance_audit_summary AS
SELECT 
    al.tenant_id,
    t.name as tenant_name,
    al.compliance_category,
    al.data_classification,
    COUNT(*) as event_count,
    COUNT(*) FILTER (WHERE al.success = FALSE) as failed_events,
    MIN(al.created_at) as first_event,
    MAX(al.created_at) as last_event,
    COUNT(DISTINCT al.user_id) as unique_users,
    COUNT(DISTINCT al.resource_id) as unique_resources
FROM audit_logs al
LEFT JOIN tenants t ON al.tenant_id = t.id
WHERE al.compliance_category IS NOT NULL
GROUP BY al.tenant_id, t.name, al.compliance_category, al.data_classification
ORDER BY al.tenant_id, al.compliance_category;

-- Add table comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for legal compliance and security monitoring';
COMMENT ON COLUMN audit_logs.checksum IS 'SHA-256 checksum for audit log integrity verification';
COMMENT ON COLUMN audit_logs.compliance_category IS 'Legal compliance category (e.g., data_protection, attorney_client_privilege)';
COMMENT ON COLUMN audit_logs.data_classification IS 'Data sensitivity classification for audit purposes';
COMMENT ON COLUMN audit_logs.before_data IS 'JSON snapshot of data before the operation';
COMMENT ON COLUMN audit_logs.after_data IS 'JSON snapshot of data after the operation';

COMMENT ON FUNCTION log_audit_event IS 'Primary function for creating audit log entries from application code';
COMMENT ON FUNCTION verify_audit_integrity IS 'Verifies the integrity of audit logs using checksums';
COMMENT ON FUNCTION archive_old_audit_logs IS 'Archives old audit logs to maintain performance while preserving compliance history';

COMMENT ON VIEW data_access_audit IS 'Filtered view of audit logs for sensitive data access monitoring';
COMMENT ON VIEW security_events_audit IS 'Security-focused audit view for threat monitoring';
COMMENT ON VIEW compliance_audit_summary IS 'Summary view for compliance reporting and analysis';