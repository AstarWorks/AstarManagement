-- V031__Update_users_role_constraint.sql
-- Update users table role CHECK constraint to match application UserRole enum

-- First, update existing roles to match new values
UPDATE users SET role = 'USER' WHERE role = 'CLIENT';
UPDATE users SET role = 'STAFF' WHERE role = 'CLERK';

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with values matching UserRole enum
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('USER', 'ADMIN', 'LAWYER', 'STAFF'));

-- Add comment to document the change
COMMENT ON COLUMN users.role IS 'User role: USER (general user/client), ADMIN (system administrator), LAWYER (licensed attorney), STAFF (law firm staff/clerk)';