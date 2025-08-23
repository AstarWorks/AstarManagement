-- V005__Add_multiple_roles_support.sql
-- Discord-style multiple roles support - Breaking change (MVP stage)
-- This migration creates a flexible role-based permission system

-- 1. Create roles table for Discord-style role management
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    color VARCHAR(7),  -- Discord-style color (#FF5733 format)
    position INT DEFAULT 0,  -- Display order (higher value = higher position)
    is_system BOOLEAN DEFAULT FALSE NOT NULL,  -- System roles cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_roles_tenant_name UNIQUE (tenant_id, name)
);

-- 2. Create user_roles table for many-to-many relationship
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- 3. Create role_permissions table for permission management
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_rule TEXT NOT NULL,  -- Format: "resource.action.scope" (e.g., "table.view.all")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (role_id, permission_rule)
);

-- 4. Create indexes for performance optimization
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_position ON roles(tenant_id, position DESC);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- 5. Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Create default roles for each tenant
-- Admin role with full permissions
INSERT INTO roles (tenant_id, name, display_name, color, position, is_system)
SELECT 
    id as tenant_id,
    'admin' as name,
    'Administrator' as display_name,
    '#FF5733' as color,
    100 as position,
    true as is_system
FROM tenants;

-- User role with standard permissions
INSERT INTO roles (tenant_id, name, display_name, color, position, is_system)
SELECT 
    id as tenant_id,
    'user' as name,
    'User' as display_name,
    '#33FF57' as color,
    50 as position,
    true as is_system
FROM tenants;

-- Viewer role with read-only permissions
INSERT INTO roles (tenant_id, name, display_name, color, position, is_system)
SELECT 
    id as tenant_id,
    'viewer' as name,
    'Viewer' as display_name,
    '#3357FF' as color,
    10 as position,
    true as is_system
FROM tenants;

-- 7. Assign default permissions to roles
-- Admin permissions (MANAGE includes all CRUD operations)
INSERT INTO role_permissions (role_id, permission_rule)
SELECT r.id, perm.permission
FROM roles r
CROSS JOIN (
    VALUES 
        ('table.manage.all'),
        ('document.manage.all'),
        ('directory.manage.all'),
        ('settings.manage.all')
) as perm(permission)
WHERE r.name = 'admin';

-- User permissions (standard CRUD operations with scope restrictions)
INSERT INTO role_permissions (role_id, permission_rule)
SELECT r.id, perm.permission
FROM roles r
CROSS JOIN (
    VALUES 
        ('table.view.all'),
        ('table.create.all'),
        ('table.edit.own'),
        ('table.delete.own'),
        ('document.view.team'),
        ('document.create.all'),
        ('document.edit.own'),
        ('document.delete.own'),
        ('directory.view.team'),
        ('directory.create.all')
) as perm(permission)
WHERE r.name = 'user';

-- Viewer permissions (read-only access)
INSERT INTO role_permissions (role_id, permission_rule)
SELECT r.id, perm.permission
FROM roles r
CROSS JOIN (
    VALUES 
        ('table.view.team'),
        ('document.view.team'),
        ('directory.view.team')
) as perm(permission)
WHERE r.name = 'viewer';

-- 8. Migrate existing role data before dropping the column
-- Assign roles to users based on their existing role column
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
    u.id as user_id,
    r.id as role_id,
    CURRENT_TIMESTAMP as assigned_at
FROM users u
JOIN roles r ON LOWER(u.role) = r.name AND r.tenant_id = u.tenant_id
WHERE u.role IS NOT NULL;

-- 9. Drop the old role column from users table (breaking change)
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- 10. Add documentation comments
COMMENT ON TABLE roles IS 'Discord-style roles for flexible permission management';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles';
COMMENT ON TABLE role_permissions IS 'Permission rules assigned to each role';
COMMENT ON COLUMN roles.color IS 'Hex color code for Discord-style role display';
COMMENT ON COLUMN roles.position IS 'Display order (higher value = higher position)';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted by users';
COMMENT ON COLUMN role_permissions.permission_rule IS 'Permission in format: resource.action.scope (e.g., table.view.all)';