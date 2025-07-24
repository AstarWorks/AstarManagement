-- V007__Update_matter_audit_log_for_R03_compliance.sql
-- Update existing matter_audit_log table to comply with R03 specifications
-- Align field names and add missing required fields

-- Step 1: Add missing R03 required fields
ALTER TABLE matter_audit_log 
ADD COLUMN IF NOT EXISTS performed_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS action VARCHAR(20);

-- Step 2: Migrate existing data to new R03-compliant fields
-- Update action field based on existing operation values
UPDATE matter_audit_log 
SET action = CASE 
    WHEN operation = 'INSERT' THEN 'CREATE'
    WHEN operation = 'UPDATE' THEN 'UPDATE' 
    WHEN operation = 'DELETE' THEN 'DELETE'
    ELSE 'UPDATE'
END
WHERE action IS NULL;

-- Step 3: Populate performed_by_name from users table (best effort)
UPDATE matter_audit_log mal
SET performed_by_name = COALESCE(u.username, u.email, 'Unknown User')
FROM users u 
WHERE mal.changed_by = u.id 
AND mal.performed_by_name IS NULL;

-- Set fallback for any remaining null values
UPDATE matter_audit_log 
SET performed_by_name = 'System User' 
WHERE performed_by_name IS NULL;

-- Step 4: Make required fields NOT NULL now that they're populated
ALTER TABLE matter_audit_log 
ALTER COLUMN action SET NOT NULL,
ALTER COLUMN performed_by_name SET NOT NULL;

-- Step 5: Add check constraint for action enum values
ALTER TABLE matter_audit_log 
ADD CONSTRAINT chk_matter_audit_action 
CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ASSIGN', 'UNASSIGN', 'VIEW', 'EXPORT', 'PRINT'));

-- Step 6: Update existing indexes to use new field names
-- Drop old indexes that reference 'operation'
DROP INDEX IF EXISTS idx_matter_audit_log_operation;

-- Create new indexes for 'action' field
CREATE INDEX idx_matter_audit_log_action ON matter_audit_log(action);

-- Step 7: Add new R03-compliant columns with proper data types
-- Change ip_address from INET to VARCHAR to match R03 specification
ALTER TABLE matter_audit_log 
ADD COLUMN IF NOT EXISTS ip_address_temp VARCHAR(45);

-- Migrate data from INET to VARCHAR
UPDATE matter_audit_log 
SET ip_address_temp = CAST(ip_address AS VARCHAR)
WHERE ip_address IS NOT NULL;

-- Step 8: Rename columns to match R03 specification
-- Add new columns with R03 names
ALTER TABLE matter_audit_log 
ADD COLUMN IF NOT EXISTS performed_by UUID,
ADD COLUMN IF NOT EXISTS performed_at TIMESTAMP WITH TIME ZONE;

-- Migrate data to new column names
UPDATE matter_audit_log 
SET performed_by = changed_by,
    performed_at = changed_at
WHERE performed_by IS NULL OR performed_at IS NULL;

-- Make new required fields NOT NULL
ALTER TABLE matter_audit_log 
ALTER COLUMN performed_by SET NOT NULL,
ALTER COLUMN performed_at SET NOT NULL;

-- Step 9: Add foreign key constraint for performed_by
ALTER TABLE matter_audit_log 
ADD CONSTRAINT fk_matter_audit_log_performed_by 
FOREIGN KEY (performed_by) REFERENCES users(id);

-- Step 10: Create additional indexes for new R03 fields
CREATE INDEX idx_matter_audit_log_performed_by ON matter_audit_log(performed_by);
CREATE INDEX idx_matter_audit_log_performed_at ON matter_audit_log(performed_at DESC);
CREATE INDEX idx_matter_audit_log_performed_by_name ON matter_audit_log(performed_by_name);

-- Composite indexes for R03 compliance queries
CREATE INDEX idx_matter_audit_log_matter_performed_at ON matter_audit_log(matter_id, performed_at DESC);
CREATE INDEX idx_matter_audit_log_user_performed_at ON matter_audit_log(performed_by, performed_at DESC);

-- Step 11: Update trigger function to use R03 field names
CREATE OR REPLACE FUNCTION log_matter_field_changes_r03()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_user_name VARCHAR(255);
    request_ip VARCHAR(45);
    request_user_agent TEXT;
    request_session_id VARCHAR(255);
BEGIN
    -- Get the user making the change
    IF TG_OP = 'DELETE' THEN
        audit_user_id := OLD.updated_by;
    ELSE
        audit_user_id := NEW.updated_by;
    END IF;
    
    -- Get user name (fallback to 'System User' if not found)
    SELECT COALESCE(username, email, 'System User') INTO audit_user_name 
    FROM users WHERE id = audit_user_id;
    
    IF audit_user_name IS NULL THEN
        audit_user_name := 'System User';
    END IF;
    
    -- Default request context (will be overridden by application layer)
    request_ip := '127.0.0.1';
    request_user_agent := 'Database Trigger';
    request_session_id := 'system-trigger-' || gen_random_uuid()::text;
    
    -- Log INSERT operation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO matter_audit_log (
            matter_id, action, field_name, new_value, 
            performed_by, performed_by_name, performed_at,
            ip_address_temp, user_agent, session_id
        ) VALUES 
            (NEW.id, 'CREATE', 'case_number', NEW.case_number, audit_user_id, audit_user_name, CURRENT_TIMESTAMP, request_ip, request_user_agent, request_session_id),
            (NEW.id, 'CREATE', 'title', NEW.title, audit_user_id, audit_user_name, CURRENT_TIMESTAMP, request_ip, request_user_agent, request_session_id),
            (NEW.id, 'CREATE', 'client_name', NEW.client_name, audit_user_id, audit_user_name, CURRENT_TIMESTAMP, request_ip, request_user_agent, request_session_id),
            (NEW.id, 'CREATE', 'status', NEW.status, audit_user_id, audit_user_name, CURRENT_TIMESTAMP, request_ip, request_user_agent, request_session_id);
        
        RETURN NEW;
    END IF;
    
    -- Log UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- Status changes get special action type
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO matter_audit_log (
                matter_id, action, field_name, old_value, new_value, 
                performed_by, performed_by_name, performed_at,
                ip_address_temp, user_agent, session_id
            ) VALUES (
                NEW.id, 'STATUS_CHANGE', 'status', OLD.status, NEW.status, 
                audit_user_id, audit_user_name, CURRENT_TIMESTAMP,
                request_ip, request_user_agent, request_session_id
            );
        END IF;
        
        -- Log other field changes
        IF OLD.case_number IS DISTINCT FROM NEW.case_number THEN
            INSERT INTO matter_audit_log (
                matter_id, action, field_name, old_value, new_value, 
                performed_by, performed_by_name, performed_at,
                ip_address_temp, user_agent, session_id
            ) VALUES (
                NEW.id, 'UPDATE', 'case_number', OLD.case_number, NEW.case_number, 
                audit_user_id, audit_user_name, CURRENT_TIMESTAMP,
                request_ip, request_user_agent, request_session_id
            );
        END IF;
        
        IF OLD.title IS DISTINCT FROM NEW.title THEN
            INSERT INTO matter_audit_log (
                matter_id, action, field_name, old_value, new_value, 
                performed_by, performed_by_name, performed_at,
                ip_address_temp, user_agent, session_id
            ) VALUES (
                NEW.id, 'UPDATE', 'title', OLD.title, NEW.title, 
                audit_user_id, audit_user_name, CURRENT_TIMESTAMP,
                request_ip, request_user_agent, request_session_id
            );
        END IF;
        
        -- Assignment changes get special action type
        IF OLD.assigned_lawyer_id IS DISTINCT FROM NEW.assigned_lawyer_id THEN
            INSERT INTO matter_audit_log (
                matter_id, action, field_name, old_value, new_value, 
                performed_by, performed_by_name, performed_at,
                ip_address_temp, user_agent, session_id
            ) VALUES (
                NEW.id, 'ASSIGN', 'assigned_lawyer_id', OLD.assigned_lawyer_id::text, NEW.assigned_lawyer_id::text, 
                audit_user_id, audit_user_name, CURRENT_TIMESTAMP,
                request_ip, request_user_agent, request_session_id
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Log DELETE operation
    IF TG_OP = 'DELETE' THEN
        INSERT INTO matter_audit_log (
            matter_id, action, field_name, old_value, 
            performed_by, performed_by_name, performed_at,
            ip_address_temp, user_agent, session_id
        ) VALUES (
            OLD.id, 'DELETE', 'matter_deleted', OLD.case_number, 
            audit_user_id, audit_user_name, CURRENT_TIMESTAMP,
            request_ip, request_user_agent, request_session_id
        );
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Step 12: Update trigger to use new function
DROP TRIGGER IF EXISTS log_matter_field_changes ON matters;
CREATE TRIGGER log_matter_field_changes_r03
    AFTER INSERT OR UPDATE OR DELETE ON matters
    FOR EACH ROW 
    EXECUTE FUNCTION log_matter_field_changes_r03();

-- Step 13: Create matter_status_history table as required by R03
-- Add missing columns to existing matter_status_history table
ALTER TABLE matter_status_history 
ADD COLUMN IF NOT EXISTS changed_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update changed_by_name for existing records
UPDATE matter_status_history msh
SET changed_by_name = u.username
FROM users u
WHERE msh.changed_by = u.id
AND msh.changed_by_name IS NULL;

-- Indexes for matter_status_history
CREATE INDEX IF NOT EXISTS idx_matter_status_history_matter_id ON matter_status_history(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_status_history_changed_at ON matter_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_matter_status_history_changed_by ON matter_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_matter_status_history_new_status ON matter_status_history(new_status);

-- Step 14: Add comments for R03 compliance documentation
COMMENT ON COLUMN matter_audit_log.action IS 'R03-compliant audit action: CREATE, UPDATE, DELETE, STATUS_CHANGE, ASSIGN, UNASSIGN, VIEW, EXPORT, PRINT';
COMMENT ON COLUMN matter_audit_log.performed_by IS 'R03-compliant: UUID of user who performed the action';
COMMENT ON COLUMN matter_audit_log.performed_by_name IS 'R03-compliant: Denormalized username for audit trail integrity';
COMMENT ON COLUMN matter_audit_log.performed_at IS 'R03-compliant: Timestamp when the action was performed';
COMMENT ON COLUMN matter_audit_log.ip_address_temp IS 'R03-compliant: IP address as string (replacing INET type)';

COMMENT ON TABLE matter_status_history IS 'R03-required: Dedicated table for tracking matter status transitions';
COMMENT ON COLUMN matter_status_history.metadata IS 'R03-compliant: Additional context data stored as JSONB';

-- Step 15: Create view for backward compatibility with existing queries
CREATE OR REPLACE VIEW matter_audit_log_legacy AS 
SELECT 
    id,
    matter_id,
    CASE 
        WHEN action = 'CREATE' THEN 'INSERT'
        WHEN action IN ('UPDATE', 'STATUS_CHANGE', 'ASSIGN', 'UNASSIGN') THEN 'UPDATE'
        WHEN action = 'DELETE' THEN 'DELETE'
        ELSE 'UPDATE'
    END as operation,
    field_name,
    old_value,
    new_value,
    performed_by as changed_by,
    performed_at as changed_at,
    CAST(ip_address_temp AS INET) as ip_address,
    user_agent,
    session_id,
    change_reason,
    created_at
FROM matter_audit_log;

COMMENT ON VIEW matter_audit_log_legacy IS 'Backward compatibility view for existing code using old column names';