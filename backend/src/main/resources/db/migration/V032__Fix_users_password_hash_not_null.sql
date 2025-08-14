-- Fix users table: password_hash should be NOT NULL
-- This addresses a design flaw where password hash could be nullable

ALTER TABLE users 
ALTER COLUMN password_hash SET NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password - required for all users';