-- V003__Simplify_auth0_integration.sql
-- Remove unnecessary Auth0 synchronization columns
-- Align with simplified architecture where Auth0 manages users

-- Remove last_auth0_sync_at column - no synchronization needed
ALTER TABLE users DROP COLUMN IF EXISTS last_auth0_sync_at;

-- Remove overly complex constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth0_sub_format_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth0_sub_unique;

-- Remove unnecessary indexes for complex queries
DROP INDEX IF EXISTS idx_users_tenant_auth0_sub;
DROP INDEX IF EXISTS idx_users_tenant_email;

-- Update comments to reflect simplified approach
COMMENT ON COLUMN users.auth0_sub IS 'Reference to Auth0 user (sub claim) - no provisioning or sync';
COMMENT ON COLUMN users.profile_picture_url IS 'Cached profile URL for display - Auth0 is source of truth';

-- Simplify auth method check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_method_check;
ALTER TABLE users ADD CONSTRAINT users_auth_method_check 
    CHECK (
        password_hash IS NOT NULL OR 
        auth0_sub IS NOT NULL
    );

-- Final state documentation
COMMENT ON TABLE users IS 'User references for business data association. Auth0 manages authentication and user profiles.';