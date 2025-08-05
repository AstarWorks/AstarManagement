-- V026__Add_deleted_at_to_tags.sql
-- Add audit columns to tags table for soft delete support
-- This migration adds both deleted_at and deleted_by columns required by the AuditInfo embedded object

ALTER TABLE tags
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by UUID;

-- Add foreign key constraint for deleted_by
ALTER TABLE tags 
ADD CONSTRAINT fk_tags_deleted_by 
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for efficient queries on non-deleted tags
CREATE INDEX idx_tags_deleted_at ON tags(deleted_at) 
WHERE deleted_at IS NULL;

-- Update existing tags to have NULL deleted_at (they are not deleted)
-- This is a no-op since the default is NULL, but included for clarity
UPDATE tags SET deleted_at = NULL WHERE deleted_at IS NULL;

COMMENT ON COLUMN tags.deleted_at IS 'Soft delete timestamp for tag lifecycle management';
COMMENT ON COLUMN tags.deleted_by IS 'User who performed the soft delete operation';