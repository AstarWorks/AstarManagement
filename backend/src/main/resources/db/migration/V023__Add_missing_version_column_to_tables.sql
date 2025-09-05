-- =====================================================
-- V023: Add missing version column to tables table
-- =====================================================
-- The tables table was missed in V020 migration.
-- Spring Data JDBC requires version columns for entities with
-- provided IDs to distinguish between new and existing entities.
-- =====================================================

-- Add version column to tables table (single UUID primary key)
ALTER TABLE tables ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE tables SET version = 0 WHERE version IS NULL;