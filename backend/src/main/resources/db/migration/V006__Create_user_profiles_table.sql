-- V006__Create_user_profiles_table.sql
-- Minimal user profile table for MVP
-- Separates display information from authentication data

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Display information
    display_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data from users table
INSERT INTO user_profiles (user_id, display_name, avatar_url, created_at, updated_at)
SELECT 
    id as user_id,
    name as display_name,
    profile_picture_url as avatar_url,
    created_at,
    updated_at
FROM users
WHERE name IS NOT NULL OR profile_picture_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Minimal user profile information for MVP';
COMMENT ON COLUMN user_profiles.display_name IS 'Name displayed in the UI';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to user avatar image';

-- Note: The old columns (users.name and users.profile_picture_url) are kept for backward compatibility
-- They will be removed in a future migration after all code is updated