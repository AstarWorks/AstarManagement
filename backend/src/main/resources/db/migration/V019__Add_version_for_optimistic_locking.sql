-- V019__Add_version_for_optimistic_locking.sql
-- Add version columns only to tables that require optimistic locking
-- Based on analysis of update frequency and concurrent modification risk

-- 1. Users table (frequent updates: profile, settings, last login time)
ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE users SET version = 0 WHERE version IS NULL;
COMMENT ON COLUMN users.version IS 'Version for optimistic locking - frequent profile and login updates';

-- 2. Tenants table (concurrent edits by multiple admins possible)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE tenants SET version = 0 WHERE version IS NULL;
COMMENT ON COLUMN tenants.version IS 'Version for optimistic locking - multiple admin concurrent edits';

-- The following tables do NOT need version columns:
-- - roles: mostly read-only after creation, permissions managed in separate table
-- - workspaces: low update frequency, low concurrent edit risk
-- - tenant_users: association table, low concurrent update risk
-- - user_roles: association table, low concurrent update risk
-- - role_permissions: association table, low concurrent update risk
-- - tables: managed through structured operations, not direct updates
-- - records: child entities managed through parent operations

-- Log the changes
DO $$
BEGIN
    RAISE NOTICE 'Added version columns for optimistic locking:';
    RAISE NOTICE '- users.version (frequent profile and authentication updates)';
    RAISE NOTICE '- tenants.version (multiple admin concurrent edit prevention)';
    RAISE NOTICE 'Other tables use Spring Data JDBC SELECT-based existence checking';
END $$;