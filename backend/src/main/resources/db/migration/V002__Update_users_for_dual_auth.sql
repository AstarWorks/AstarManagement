-- V002__Update_users_for_dual_auth.sql
-- Update users table to support both Auth0 and local authentication

-- Rename auth0_id to auth0_sub to match JWT standard claim
ALTER TABLE users RENAME COLUMN auth0_id TO auth0_sub;

-- Make auth0_sub nullable to support local-only users
ALTER TABLE users ALTER COLUMN auth0_sub DROP NOT NULL;

-- Add password_hash for local authentication
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Add profile fields
ALTER TABLE users ADD COLUMN profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN last_auth0_sync_at TIMESTAMP WITH TIME ZONE;

-- Add role for RBAC
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';

-- Add constraint to ensure user has at least one auth method
ALTER TABLE users ADD CONSTRAINT users_auth_method_check 
    CHECK (
        (password_hash IS NOT NULL AND password_hash != '') OR 
        (auth0_sub IS NOT NULL AND auth0_sub != '')
    );

-- Update index name to match column rename
ALTER INDEX idx_users_auth0_id RENAME TO idx_users_auth0_sub;

-- Update comment
COMMENT ON COLUMN users.auth0_sub IS 'Auth0 user identifier (sub claim from JWT)';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password (nullable for OAuth-only users)';
COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture from Auth0';
COMMENT ON COLUMN users.last_auth0_sync_at IS 'Last synchronization timestamp with Auth0 profile data';
COMMENT ON COLUMN users.role IS 'User role for RBAC (USER, ADMIN, etc.)';