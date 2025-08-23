-- V008__Fix_multi_tenant_structure.sql
-- Fix multi-tenant structure to allow one Auth0 user to belong to multiple tenants
-- Similar to Slack where one account can join multiple workspaces

-- 1. Remove email UNIQUE constraint (keep it only as reference from Auth0)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uk_users_tenant_email;

-- 2. Create tenant_users table for many-to-many relationship
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status and timestamps
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one user can only join a tenant once
    CONSTRAINT uk_tenant_users UNIQUE (tenant_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_active ON tenant_users(tenant_id, user_id) WHERE is_active = TRUE;

-- 3. Migrate existing user-tenant relationships
INSERT INTO tenant_users (tenant_id, user_id, joined_at)
SELECT DISTINCT tenant_id, id as user_id, created_at as joined_at
FROM users
WHERE tenant_id IS NOT NULL;

-- 4. Create new user_roles structure (linking to tenant_users instead of users directly)
-- First, preserve existing role assignments
CREATE TABLE user_roles_new (
    tenant_user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    PRIMARY KEY (tenant_user_id, role_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_new_tenant_user ON user_roles_new(tenant_user_id);
CREATE INDEX idx_user_roles_new_role ON user_roles_new(role_id);

-- 5. Migrate existing role assignments
INSERT INTO user_roles_new (tenant_user_id, role_id, assigned_at, assigned_by)
SELECT 
    tu.id as tenant_user_id,
    ur.role_id,
    ur.assigned_at,
    ur.assigned_by
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = u.tenant_id
WHERE u.tenant_id IS NOT NULL;

-- 6. Drop old user_roles table and rename new one
DROP TABLE user_roles;
ALTER TABLE user_roles_new RENAME TO user_roles;

-- Rename indexes
ALTER INDEX idx_user_roles_new_tenant_user RENAME TO idx_user_roles_tenant_user;
ALTER INDEX idx_user_roles_new_role RENAME TO idx_user_roles_role;

-- 7. Drop tenant_id from users table (no longer needed)
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;

-- 8. Add helpful functions for the new structure

-- Function to get user's tenants
CREATE OR REPLACE FUNCTION get_user_tenants(p_user_id UUID)
RETURNS TABLE(
    tenant_id UUID,
    tenant_name VARCHAR(255),
    tenant_slug VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        tu.joined_at,
        tu.last_accessed_at
    FROM tenant_users tu
    JOIN tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = p_user_id
      AND tu.is_active = TRUE
      AND t.is_active = TRUE
    ORDER BY tu.last_accessed_at DESC NULLS LAST, tu.joined_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user's roles in a tenant
CREATE OR REPLACE FUNCTION get_user_roles_in_tenant(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(
    role_id UUID,
    role_name VARCHAR(100),
    permissions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as role_id,
        r.name as role_name,
        ARRAY_AGG(DISTINCT rp.permission_rule) as permissions
    FROM tenant_users tu
    JOIN user_roles ur ON tu.id = ur.tenant_user_id
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    WHERE tu.user_id = p_user_id
      AND tu.tenant_id = p_tenant_id
      AND tu.is_active = TRUE
    GROUP BY r.id, r.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Update comments
COMMENT ON TABLE tenant_users IS 'Many-to-many relationship between users and tenants';
COMMENT ON COLUMN tenant_users.last_accessed_at IS 'Last time user accessed this tenant';
COMMENT ON TABLE users IS 'Auth0 user accounts - can belong to multiple tenants';
COMMENT ON COLUMN users.email IS 'Email from Auth0 (not unique - same email can be in multiple tenants)';
COMMENT ON TABLE user_roles IS 'Role assignments within a specific tenant context';
COMMENT ON FUNCTION get_user_tenants(UUID) IS 'Get all tenants a user belongs to';
COMMENT ON FUNCTION get_user_roles_in_tenant(UUID, UUID) IS 'Get user roles and permissions in a specific tenant';

-- 10. Log the changes
DO $$
BEGIN
    RAISE NOTICE 'Multi-tenant structure fixed:';
    RAISE NOTICE '- Users can now belong to multiple tenants';
    RAISE NOTICE '- Email is no longer unique (managed by Auth0)';
    RAISE NOTICE '- Created tenant_users table for many-to-many relationship';
    RAISE NOTICE '- User roles are now scoped to tenant context';
END $$;