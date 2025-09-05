-- V025__Add_description_to_tables.sql
-- ========================================
-- Add description column to tables
-- ========================================

-- Add description column to tables table
ALTER TABLE tables ADD COLUMN description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN tables.description IS 'テーブルの説明文（最大1000文字）';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added description column to tables';
    RAISE NOTICE '========================================';
END $$;