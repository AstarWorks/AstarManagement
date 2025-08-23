-- V007__Cleanup_for_auth0_only.sql
-- Remove local authentication support and cleanup users table
-- This migration completes the transition to Auth0-only authentication

-- 1. Drop the auth method check constraint (no longer needed)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_method_check;

-- 2. Remove password_hash column (Auth0 manages passwords)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- 3. Remove profile columns (moved to user_profiles table)
ALTER TABLE users DROP COLUMN IF EXISTS name;
ALTER TABLE users DROP COLUMN IF EXISTS profile_picture_url;

-- 4. Remove role column if still exists (already handled by user_roles table)
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- 5. Make auth0_sub NOT NULL (all users must be from Auth0)
-- First, delete any users without auth0_sub (should not exist in production)
DELETE FROM users WHERE auth0_sub IS NULL;

-- Then make the column NOT NULL
ALTER TABLE users ALTER COLUMN auth0_sub SET NOT NULL;

-- 6. Add a unique constraint on email within a tenant
-- Drop existing constraint if exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS uk_users_tenant_email;
-- Add new constraint
ALTER TABLE users ADD CONSTRAINT uk_users_tenant_email UNIQUE (tenant_id, email);

-- 7. Update table comment to reflect Auth0-only approach
COMMENT ON TABLE users IS 'User references for Auth0 authentication. All authentication is handled by Auth0.';
COMMENT ON COLUMN users.auth0_sub IS 'Auth0 user identifier (sub claim from JWT) - required for all users';
COMMENT ON COLUMN users.email IS 'User email from Auth0 (cached for quick lookup)';
COMMENT ON COLUMN users.tenant_id IS 'Associated tenant for multi-tenancy';

-- 8. Final state check: users table should now only have these columns:
-- id, auth0_sub (NOT NULL), email, tenant_id, created_at, updated_at

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Users table cleaned up for Auth0-only authentication';
    RAISE NOTICE 'Removed: password_hash, name, profile_picture_url, role';
    RAISE NOTICE 'Auth0 is now the sole authentication provider';
END $$;