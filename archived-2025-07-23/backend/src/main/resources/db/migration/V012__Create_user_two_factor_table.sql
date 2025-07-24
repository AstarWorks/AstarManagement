-- V012: Create user_two_factor table for TOTP-based 2FA
-- Stores encrypted TOTP secrets and backup codes for two-factor authentication

CREATE TABLE user_two_factor (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL UNIQUE,
    encrypted_secret        VARCHAR(500)    NOT NULL,
    enabled                 BOOLEAN         NOT NULL DEFAULT false,
    backup_codes            TEXT,           -- JSON array of hashed backup codes
    used_backup_codes_count INTEGER         NOT NULL DEFAULT 0,
    last_used_at            TIMESTAMPTZ,
    failed_attempts         INTEGER         NOT NULL DEFAULT 0,
    last_failed_attempt_at  TIMESTAMPTZ,
    method                  VARCHAR(20)     NOT NULL DEFAULT 'TOTP',
    configuration           TEXT,           -- JSON for future extensibility
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    updated_by              UUID,
    
    -- Foreign key constraint
    CONSTRAINT fk_two_factor_user      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_method_valid        CHECK (method IN ('TOTP', 'SMS', 'EMAIL')),
    CONSTRAINT chk_failed_attempts     CHECK (failed_attempts >= 0),
    CONSTRAINT chk_used_codes_count    CHECK (used_backup_codes_count >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_two_factor_user_id           ON user_two_factor(user_id);
CREATE INDEX idx_two_factor_enabled           ON user_two_factor(enabled);
CREATE INDEX idx_two_factor_last_used         ON user_two_factor(last_used_at);
CREATE INDEX idx_two_factor_failed_attempts   ON user_two_factor(failed_attempts);

-- Add comments for documentation
COMMENT ON TABLE user_two_factor IS 'Stores two-factor authentication configuration for users';
COMMENT ON COLUMN user_two_factor.user_id IS 'Reference to the user this 2FA config belongs to';
COMMENT ON COLUMN user_two_factor.encrypted_secret IS 'AES-256 encrypted TOTP secret';
COMMENT ON COLUMN user_two_factor.enabled IS 'Whether 2FA is currently active for this user';
COMMENT ON COLUMN user_two_factor.backup_codes IS 'JSON array of bcrypt hashed backup codes';
COMMENT ON COLUMN user_two_factor.used_backup_codes_count IS 'Number of backup codes that have been used';
COMMENT ON COLUMN user_two_factor.last_used_at IS 'Timestamp of last successful 2FA verification';
COMMENT ON COLUMN user_two_factor.failed_attempts IS 'Counter for rate limiting failed attempts';
COMMENT ON COLUMN user_two_factor.last_failed_attempt_at IS 'Timestamp of last failed attempt';
COMMENT ON COLUMN user_two_factor.method IS 'Type of 2FA method (currently only TOTP supported)';
COMMENT ON COLUMN user_two_factor.configuration IS 'JSON configuration for future extensibility';

-- Create function to automatically clean up old failed attempts
CREATE OR REPLACE FUNCTION reset_expired_two_factor_attempts()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
    threshold TIMESTAMPTZ;
BEGIN
    -- Reset attempts older than 15 minutes
    threshold := CURRENT_TIMESTAMP - INTERVAL '15 minutes';
    
    UPDATE user_two_factor 
    SET 
        failed_attempts = 0,
        last_failed_attempt_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        failed_attempts > 0 
        AND last_failed_attempt_at < threshold;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_two_factor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_two_factor_timestamp
    BEFORE UPDATE ON user_two_factor
    FOR EACH ROW
    EXECUTE FUNCTION update_two_factor_updated_at();

-- Add 2FA statistics view
CREATE VIEW two_factor_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_users,
    COUNT(CASE WHEN enabled = true AND last_used_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as active_users,
    COUNT(CASE WHEN enabled = true AND used_backup_codes_count >= 6 THEN 1 END) as users_low_backup_codes,
    COUNT(CASE WHEN failed_attempts >= 3 THEN 1 END) as users_with_failed_attempts,
    ROUND(100.0 * COUNT(CASE WHEN enabled = true THEN 1 END) / NULLIF(COUNT(*), 0), 2) as enabled_percentage
FROM user_two_factor;

COMMENT ON VIEW two_factor_statistics IS 'Aggregated statistics for two-factor authentication usage';

-- Grant permissions (adjust based on your application user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_two_factor TO application_user;
-- GRANT SELECT ON two_factor_statistics TO application_user;
-- GRANT EXECUTE ON FUNCTION reset_expired_two_factor_attempts() TO application_user;