-- =====================================================
-- V020: Add version columns for Spring Data JDBC
-- =====================================================
-- Spring Data JDBC requires version columns for entities with:
-- 1. Single UUID/String primary keys (provided IDs)
-- 2. Composite primary keys
-- Without @Version, Spring Data JDBC cannot distinguish between
-- new and existing entities when IDs are provided.
-- =====================================================

-- 1. Roles table (single UUID primary key)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE roles SET version = 0 WHERE version IS NULL;

-- 2. Workspaces table (single UUID primary key)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE workspaces SET version = 0 WHERE version IS NULL;

-- 3. User profiles table (single UUID primary key)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE user_profiles SET version = 0 WHERE version IS NULL;

-- 4. Records table (single UUID primary key)
ALTER TABLE records ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE records SET version = 0 WHERE version IS NULL;

-- 5. Property type catalog table (String primary key)
ALTER TABLE property_type_catalog ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE property_type_catalog SET version = 0 WHERE version IS NULL;

-- 6. Tenant users table (composite primary key)
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE tenant_users SET version = 0 WHERE version IS NULL;

-- 7. User roles table (composite primary key)
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE user_roles SET version = 0 WHERE version IS NULL;

-- 8. Role permissions table (composite primary key)
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE role_permissions SET version = 0 WHERE version IS NULL;