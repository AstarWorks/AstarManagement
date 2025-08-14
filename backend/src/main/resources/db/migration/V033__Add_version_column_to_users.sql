-- Add version column to users table for optimistic locking
-- This resolves ObjectOptimisticLockingFailureException issues

ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 0 NOT NULL;

-- Create index for version column for performance
CREATE INDEX idx_users_version ON users(version);

-- Add comment for clarity
COMMENT ON COLUMN users.version IS 'Version number for optimistic locking concurrency control';