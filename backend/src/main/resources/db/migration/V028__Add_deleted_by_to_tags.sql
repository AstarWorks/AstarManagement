-- V028__Add_deleted_by_to_tags.sql
-- Add missing deleted_by column to tags table for complete AuditInfo support
-- This column was missing from V026 and is required by the @Embedded AuditInfo

-- Add deleted_by column to tags table
ALTER TABLE tags
ADD COLUMN deleted_by UUID;

-- Add foreign key constraint for deleted_by
ALTER TABLE tags 
ADD CONSTRAINT fk_tags_deleted_by 
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add table comment
COMMENT ON COLUMN tags.deleted_by IS 'User who performed the soft delete operation';