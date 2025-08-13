-- V028__Add_deleted_by_to_tags.sql
-- Add missing deleted_by column to tags table for complete AuditInfo support
-- This column was already added in V026, so this migration is no longer needed
-- Kept for backwards compatibility with environments that may have already executed it

-- Check if deleted_by column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tags' AND column_name = 'deleted_by'
    ) THEN
        -- Add deleted_by column to tags table
        ALTER TABLE tags ADD COLUMN deleted_by UUID;
        
        -- Add foreign key constraint for deleted_by
        ALTER TABLE tags 
        ADD CONSTRAINT fk_tags_deleted_by 
            FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
        
        -- Add table comment
        COMMENT ON COLUMN tags.deleted_by IS 'User who performed the soft delete operation';
    END IF;
END
$$;