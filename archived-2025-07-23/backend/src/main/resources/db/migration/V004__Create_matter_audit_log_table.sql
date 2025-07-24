-- V004__Create_matter_audit_log_table.sql
-- Create comprehensive audit log table for all matter changes
-- Supports legal compliance and detailed change tracking

CREATE TABLE matter_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- Change tracking
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    field_name VARCHAR(100) NOT NULL, -- Which field was changed
    old_value TEXT, -- Previous value (NULL for INSERT)
    new_value TEXT, -- New value (NULL for DELETE)
    
    -- Change metadata
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Request context
    ip_address INET, -- IP address of the user making the change
    user_agent TEXT, -- Browser/client information
    session_id VARCHAR(255), -- Session identifier
    
    -- Business context
    change_reason VARCHAR(255), -- Why the change was made
    
    -- Immutable audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance and audit queries
CREATE INDEX idx_matter_audit_log_matter_id ON matter_audit_log(matter_id);
CREATE INDEX idx_matter_audit_log_changed_at ON matter_audit_log(changed_at);
CREATE INDEX idx_matter_audit_log_changed_by ON matter_audit_log(changed_by);
CREATE INDEX idx_matter_audit_log_operation ON matter_audit_log(operation);
CREATE INDEX idx_matter_audit_log_field_name ON matter_audit_log(field_name);

-- Composite indexes for audit reports
CREATE INDEX idx_matter_audit_log_matter_date ON matter_audit_log(matter_id, changed_at DESC);
CREATE INDEX idx_matter_audit_log_user_date ON matter_audit_log(changed_by, changed_at DESC);
CREATE INDEX idx_matter_audit_log_field_date ON matter_audit_log(field_name, changed_at DESC);

-- Create function to log detailed field changes
CREATE OR REPLACE FUNCTION log_matter_field_changes()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
BEGIN
    -- Get the user making the change (from updated_by field or current user)
    IF TG_OP = 'DELETE' THEN
        audit_user_id := OLD.updated_by;
    ELSE
        audit_user_id := NEW.updated_by;
    END IF;
    
    -- Log INSERT operation
    IF TG_OP = 'INSERT' THEN
        -- Log key fields for new records
        INSERT INTO matter_audit_log (matter_id, operation, field_name, new_value, changed_by)
        VALUES 
            (NEW.id, 'INSERT', 'case_number', NEW.case_number, audit_user_id),
            (NEW.id, 'INSERT', 'title', NEW.title, audit_user_id),
            (NEW.id, 'INSERT', 'client_name', NEW.client_name, audit_user_id),
            (NEW.id, 'INSERT', 'status', NEW.status, audit_user_id),
            (NEW.id, 'INSERT', 'assigned_lawyer_id', NEW.assigned_lawyer_id::text, audit_user_id);
        
        RETURN NEW;
    END IF;
    
    -- Log UPDATE operations (field by field)
    IF TG_OP = 'UPDATE' THEN
        -- Check each field for changes and log them
        IF OLD.case_number IS DISTINCT FROM NEW.case_number THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'case_number', OLD.case_number, NEW.case_number, audit_user_id);
        END IF;
        
        IF OLD.title IS DISTINCT FROM NEW.title THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'title', OLD.title, NEW.title, audit_user_id);
        END IF;
        
        IF OLD.description IS DISTINCT FROM NEW.description THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'description', OLD.description, NEW.description, audit_user_id);
        END IF;
        
        IF OLD.client_name IS DISTINCT FROM NEW.client_name THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'client_name', OLD.client_name, NEW.client_name, audit_user_id);
        END IF;
        
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'status', OLD.status, NEW.status, audit_user_id);
        END IF;
        
        IF OLD.priority IS DISTINCT FROM NEW.priority THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'priority', OLD.priority, NEW.priority, audit_user_id);
        END IF;
        
        IF OLD.assigned_lawyer_id IS DISTINCT FROM NEW.assigned_lawyer_id THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'assigned_lawyer_id', OLD.assigned_lawyer_id::text, NEW.assigned_lawyer_id::text, audit_user_id);
        END IF;
        
        IF OLD.assigned_clerk_id IS DISTINCT FROM NEW.assigned_clerk_id THEN
            INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, new_value, changed_by)
            VALUES (NEW.id, 'UPDATE', 'assigned_clerk_id', OLD.assigned_clerk_id::text, NEW.assigned_clerk_id::text, audit_user_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Log DELETE operation
    IF TG_OP = 'DELETE' THEN
        INSERT INTO matter_audit_log (matter_id, operation, field_name, old_value, changed_by)
        VALUES (OLD.id, 'DELETE', 'matter_deleted', OLD.case_number, audit_user_id);
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for detailed audit logging
CREATE TRIGGER log_matter_field_changes 
    AFTER INSERT OR UPDATE OR DELETE ON matters
    FOR EACH ROW 
    EXECUTE FUNCTION log_matter_field_changes();

-- Add comments for documentation
COMMENT ON TABLE matter_audit_log IS 'Comprehensive audit log tracking all field-level changes to matters';
COMMENT ON COLUMN matter_audit_log.operation IS 'Type of database operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN matter_audit_log.field_name IS 'Name of the field that was changed';
COMMENT ON COLUMN matter_audit_log.old_value IS 'Previous value before change (NULL for INSERT)';
COMMENT ON COLUMN matter_audit_log.new_value IS 'New value after change (NULL for DELETE)';
COMMENT ON COLUMN matter_audit_log.ip_address IS 'IP address of user making the change';
COMMENT ON COLUMN matter_audit_log.user_agent IS 'Browser or client information';
COMMENT ON TRIGGER log_matter_field_changes ON matters IS 'Automatically logs all field-level changes to matters table';