-- V003__Create_matter_status_history_table.sql
-- Create matter status history table for audit trail
-- Supports FR-011 (Status transitions with audit trail) and FR-003 (Audit logs)

CREATE TABLE matter_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- Status transition details
    old_status VARCHAR(50), -- NULL for initial status
    new_status VARCHAR(50) NOT NULL CHECK (
        new_status IN (
            'INTAKE', 'INITIAL_REVIEW', 'INVESTIGATION', 'RESEARCH',
            'DRAFT_PLEADINGS', 'FILED', 'DISCOVERY', 'MEDIATION',
            'TRIAL_PREP', 'TRIAL', 'SETTLEMENT', 'CLOSED'
        )
    ),
    
    -- Change metadata
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes TEXT, -- Optional notes explaining the status change
    
    -- Business context
    reason VARCHAR(100), -- Why the status changed
    estimated_completion_date DATE, -- Updated estimate if applicable
    
    -- Immutable audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_matter_status_history_matter_id ON matter_status_history(matter_id);
CREATE INDEX idx_matter_status_history_changed_at ON matter_status_history(changed_at);
CREATE INDEX idx_matter_status_history_changed_by ON matter_status_history(changed_by);
CREATE INDEX idx_matter_status_history_new_status ON matter_status_history(new_status);

-- Composite indexes for common queries
CREATE INDEX idx_matter_status_history_matter_date ON matter_status_history(matter_id, changed_at DESC);
CREATE INDEX idx_matter_status_history_user_date ON matter_status_history(changed_by, changed_at DESC);

-- Create a function to automatically log status changes
CREATE OR REPLACE FUNCTION log_matter_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO matter_status_history (
            matter_id,
            old_status,
            new_status,
            changed_by,
            changed_at,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.updated_by,
            NEW.updated_at,
            'Status updated via application'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically log status changes on matters table
CREATE TRIGGER log_matter_status_changes 
    AFTER UPDATE ON matters
    FOR EACH ROW 
    EXECUTE FUNCTION log_matter_status_change();

-- Add comments for documentation
COMMENT ON TABLE matter_status_history IS 'Immutable audit trail of all matter status changes';
COMMENT ON COLUMN matter_status_history.old_status IS 'Previous status (NULL for initial status)';
COMMENT ON COLUMN matter_status_history.new_status IS 'New status after change';
COMMENT ON COLUMN matter_status_history.reason IS 'Business reason for the status change';
COMMENT ON COLUMN matter_status_history.notes IS 'Optional notes explaining the change';
COMMENT ON TRIGGER log_matter_status_changes ON matters IS 'Automatically logs status changes when matters are updated';