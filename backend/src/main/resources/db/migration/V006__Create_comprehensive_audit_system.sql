-- V006__Create_general_audit_system.sql
-- Create general audit logging system that complements the existing matter_audit_log table
-- This provides high-level audit events while matter_audit_log handles detailed field changes

-- Create audit event types enum
CREATE TYPE audit_event_type AS ENUM (
    'MATTER_CREATED', 'MATTER_UPDATED', 'MATTER_STATUS_CHANGED', 'MATTER_DELETED',
    'DOCUMENT_UPLOADED', 'DOCUMENT_ACCESSED', 'DOCUMENT_MODIFIED', 'DOCUMENT_DELETED',
    'USER_LOGIN', 'USER_LOGOUT', 'AUTHENTICATION_FAILED', 'AUTHORIZATION_DENIED',
    'MEMO_CREATED', 'MEMO_UPDATED', 'MEMO_DELETED',
    'EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED',
    'SECURITY_EVENT', 'SYSTEM_EVENT', 'DATA_EXPORT', 'BULK_OPERATION'
);

-- Create document access types enum
CREATE TYPE document_access_type AS ENUM ('VIEW', 'DOWNLOAD', 'PRINT', 'EXPORT');

-- Create security event types enum  
CREATE TYPE security_event_type AS ENUM (
    'LOGIN_SUCCESS', 'LOGIN_FAILED', 'TOKEN_REFRESH', 'PERMISSION_DENIED',
    'PASSWORD_CHANGED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY'
);

-- Create general audit logs table (complements matter_audit_log)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_type audit_event_type NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'Matter', 'Document', 'User', 'Security', etc.
    entity_id VARCHAR(255) NOT NULL, -- ID of the affected entity
    
    -- User context
    user_id VARCHAR(255) NOT NULL, -- ID of user performing action
    user_name VARCHAR(255), -- Username for readability
    
    -- Temporal information
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Request context
    ip_address VARCHAR(45), -- Client IP address as string (consistent with matter_audit_log)
    user_agent TEXT, -- Browser/client information  
    session_id VARCHAR(255), -- Session identifier
    request_id VARCHAR(255), -- Request correlation ID
    
    -- Event details (flexible JSON storage)
    event_details JSONB DEFAULT '{}', -- Flexible event-specific data
    old_values JSONB, -- Previous state (for updates)
    new_values JSONB, -- New state (for updates/creates)
    
    -- Business context
    correlation_id VARCHAR(255), -- For tracking related operations
    transaction_id VARCHAR(255), -- Database transaction ID
    
    -- Compliance and legal
    retention_until DATE, -- When this audit record can be archived
    legal_hold BOOLEAN DEFAULT FALSE, -- Mark for legal hold
    
    -- Immutable audit record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create performance indexes
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, event_timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(event_timestamp DESC);
CREATE INDEX idx_audit_logs_correlation ON audit_logs(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_audit_logs_transaction ON audit_logs(transaction_id) WHERE transaction_id IS NOT NULL;

-- JSONB indexes for flexible querying
CREATE INDEX idx_audit_logs_event_details_gin ON audit_logs USING GIN(event_details);
CREATE INDEX idx_audit_logs_old_values_gin ON audit_logs USING GIN(old_values) WHERE old_values IS NOT NULL;
CREATE INDEX idx_audit_logs_new_values_gin ON audit_logs USING GIN(new_values) WHERE new_values IS NOT NULL;

-- Composite indexes for common audit queries
CREATE INDEX idx_audit_logs_entity_timestamp ON audit_logs(entity_type, entity_id, event_timestamp DESC);
CREATE INDEX idx_audit_logs_user_entity ON audit_logs(user_id, entity_type, event_timestamp DESC);
CREATE INDEX idx_audit_logs_event_user ON audit_logs(event_type, user_id, event_timestamp DESC);

-- Partitioning support for large audit datasets (by year)
-- This table can be partitioned monthly or yearly based on event_timestamp for performance
-- Example: CREATE TABLE audit_logs_2025 PARTITION OF audit_logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Create audit metadata table for system configuration
CREATE TABLE audit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration settings
    retention_policy_days INTEGER DEFAULT 2555, -- ~7 years default
    cleanup_enabled BOOLEAN DEFAULT TRUE,
    batch_size INTEGER DEFAULT 1000,
    async_enabled BOOLEAN DEFAULT TRUE,
    
    -- Legal compliance settings
    immutable_records BOOLEAN DEFAULT TRUE,
    legal_hold_default_days INTEGER DEFAULT 3650, -- 10 years
    
    -- Performance settings
    partition_enabled BOOLEAN DEFAULT FALSE,
    partition_interval VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, YEARLY
    
    -- Monitoring
    alert_on_failures BOOLEAN DEFAULT TRUE,
    max_failed_audits_per_hour INTEGER DEFAULT 100,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by UUID
);

-- Insert default configuration
INSERT INTO audit_configuration (retention_policy_days, cleanup_enabled, async_enabled, immutable_records)
VALUES (2555, TRUE, TRUE, TRUE);

-- Create audit statistics view for monitoring
CREATE VIEW audit_statistics AS
SELECT 
    DATE_TRUNC('day', event_timestamp) as audit_date,
    event_type,
    entity_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_id) as unique_entities
FROM audit_logs 
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', event_timestamp), event_type, entity_type
ORDER BY audit_date DESC, event_count DESC;

-- Create audit trail view for easy querying
CREATE VIEW audit_trail AS
SELECT 
    al.id,
    al.event_type,
    al.entity_type,
    al.entity_id,
    al.event_timestamp,
    al.user_id,
    al.user_name,
    al.ip_address,
    al.event_details,
    al.correlation_id,
    -- Matter-specific enrichment (when entity_type = 'Matter')
    CASE WHEN al.entity_type = 'Matter' THEN m.case_number END as matter_case_number,
    CASE WHEN al.entity_type = 'Matter' THEN m.title END as matter_title,
    CASE WHEN al.entity_type = 'Matter' THEN m.client_name END as matter_client
FROM audit_logs al
LEFT JOIN matters m ON al.entity_type = 'Matter' AND al.entity_id = m.id::text
ORDER BY al.event_timestamp DESC;

-- Function to prevent audit log modifications (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Audit logs are immutable and cannot be updated. Operation: %, Table: %', TG_OP, TG_TABLE_NAME;
    END IF;
    
    -- Prevent DELETE operations (except for automated cleanup)
    IF TG_OP = 'DELETE' THEN
        -- Only allow DELETE if it's from the cleanup process (check if called by specific role/function)
        -- This is a simplified check - in production, you might want more sophisticated logic
        IF current_setting('application_name', true) != 'audit_cleanup_process' THEN
            RAISE EXCEPTION 'Audit logs cannot be deleted except through automated retention policy. Operation: %, Table: %', TG_OP, TG_TABLE_NAME;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create immutability triggers
CREATE TRIGGER prevent_audit_log_updates
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_changes();

-- Function for automated audit cleanup (respects retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    retention_days INTEGER;
    cleanup_enabled BOOLEAN;
    deleted_count INTEGER := 0;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current retention policy
    SELECT ac.retention_policy_days, ac.cleanup_enabled 
    INTO retention_days, cleanup_enabled
    FROM audit_configuration ac 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Exit if cleanup is disabled
    IF NOT cleanup_enabled THEN
        RETURN 0;
    END IF;
    
    -- Calculate cutoff date
    cutoff_date := CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    
    -- Set application name for trigger bypass
    PERFORM set_config('application_name', 'audit_cleanup_process', true);
    
    -- Delete old audit logs (excluding those on legal hold)
    DELETE FROM audit_logs 
    WHERE event_timestamp < cutoff_date 
    AND (legal_hold = FALSE OR legal_hold IS NULL)
    AND (retention_until IS NULL OR retention_until < CURRENT_DATE);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Reset application name
    PERFORM set_config('application_name', '', true);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add table comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all business operations and security events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of audit event from predefined enum';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity being audited (Matter, Document, User, etc.)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the specific entity being audited';
COMMENT ON COLUMN audit_logs.event_details IS 'Flexible JSONB field for event-specific data';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Links related audit events together';
COMMENT ON COLUMN audit_logs.legal_hold IS 'Prevents deletion for legal compliance';
COMMENT ON COLUMN audit_logs.retention_until IS 'Overrides default retention policy for specific records';

COMMENT ON TABLE audit_configuration IS 'System configuration for audit logging behavior';
COMMENT ON VIEW audit_statistics IS 'Daily statistics for audit event monitoring';
COMMENT ON VIEW audit_trail IS 'Enriched audit view with entity details for easy querying';

COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Automated cleanup function respecting retention policies and legal holds';
COMMENT ON FUNCTION prevent_audit_log_changes() IS 'Ensures audit log immutability except for authorized cleanup';