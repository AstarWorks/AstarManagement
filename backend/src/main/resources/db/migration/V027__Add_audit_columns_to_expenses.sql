-- V025__Add_audit_columns_to_expenses.sql
-- Add missing audit columns to expenses table for soft delete functionality
-- This migration adds deleted_at and deleted_by columns required by the AuditInfo embedded object

-- Add audit columns to expenses table
ALTER TABLE expenses 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by UUID;

-- Add foreign key constraint for deleted_by
ALTER TABLE expenses 
ADD CONSTRAINT fk_expenses_deleted_by 
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for soft delete queries
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add table comment
COMMENT ON COLUMN expenses.deleted_at IS 'Soft delete timestamp, NULL means not deleted';
COMMENT ON COLUMN expenses.deleted_by IS 'User who performed the soft delete operation';