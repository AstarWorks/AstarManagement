-- =====================================================
-- V018: Add Resource Groups for Fine-Grained Permissions
-- =====================================================
-- Implements ResourceGroup concept as "UserRole for resources"
-- Allows grouping resources for simplified permission management
-- Example: "Project A Tables", "Sales Department Documents"

-- 1. Create resource_groups table
CREATE TABLE resource_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    resource_type VARCHAR(50) NOT NULL, -- TABLE, DOCUMENT, DIRECTORY, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Unique name per tenant
    CONSTRAINT uk_resource_groups_tenant_name UNIQUE (tenant_id, name)
);

-- 2. Create resource_group_memberships table (M:N between groups and resources)
CREATE TABLE resource_group_memberships (
    group_id UUID NOT NULL REFERENCES resource_groups(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL, -- The actual resource ID (table_id, document_id, etc.)
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    added_by UUID NOT NULL REFERENCES users(id),
    
    PRIMARY KEY (group_id, resource_id)
);

-- 3. Create resource_group_permissions table (permissions for groups)
CREATE TABLE resource_group_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES resource_groups(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- VIEW, CREATE, EDIT, DELETE, MANAGE, etc.
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    granted_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for temporary permissions
    
    PRIMARY KEY (role_id, group_id, action)
);

-- 4. Create indexes for performance
CREATE INDEX idx_resource_groups_tenant ON resource_groups(tenant_id);
CREATE INDEX idx_resource_groups_type ON resource_groups(resource_type);
CREATE INDEX idx_resource_groups_active ON resource_groups(tenant_id, is_active);

CREATE INDEX idx_group_memberships_group ON resource_group_memberships(group_id);
CREATE INDEX idx_group_memberships_resource ON resource_group_memberships(resource_id);

CREATE INDEX idx_group_permissions_role ON resource_group_permissions(role_id);
CREATE INDEX idx_group_permissions_group ON resource_group_permissions(group_id);
CREATE INDEX idx_group_permissions_expires ON resource_group_permissions(expires_at) 
    WHERE expires_at IS NOT NULL;

-- 5. Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_resource_groups_updated_at 
    BEFORE UPDATE ON resource_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Add RLS policies for resource_groups
ALTER TABLE resource_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY resource_groups_tenant_isolation ON resource_groups
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 7. Add RLS policies for resource_group_memberships
ALTER TABLE resource_group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_memberships_tenant_isolation ON resource_group_memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM resource_groups rg
            WHERE rg.id = group_id
            AND rg.tenant_id = current_setting('app.current_tenant')::UUID
        )
    );

-- 8. Add RLS policies for resource_group_permissions
ALTER TABLE resource_group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_permissions_tenant_isolation ON resource_group_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM resource_groups rg
            WHERE rg.id = group_id
            AND rg.tenant_id = current_setting('app.current_tenant')::UUID
        )
    );

-- 9. Add documentation comments
COMMENT ON TABLE resource_groups IS 'Groups of resources for simplified permission management';
COMMENT ON TABLE resource_group_memberships IS 'M:N relationship between resource groups and actual resources';
COMMENT ON TABLE resource_group_permissions IS 'Permissions granted to roles for specific resource groups';

COMMENT ON COLUMN resource_groups.resource_type IS 'Type of resources in this group (TABLE, DOCUMENT, etc.)';
COMMENT ON COLUMN resource_group_memberships.resource_id IS 'UUID of the actual resource (table_id, document_id, etc.)';
COMMENT ON COLUMN resource_group_permissions.action IS 'Action permitted on the group (VIEW, EDIT, DELETE, etc.)';
COMMENT ON COLUMN resource_group_permissions.expires_at IS 'Optional expiration timestamp for temporary permissions';

-- 10. Create helper functions for permission checking

-- Function to check if a user has permission to a resource via group membership
CREATE OR REPLACE FUNCTION has_resource_group_permission(
    p_user_id UUID,
    p_resource_id UUID,
    p_resource_type VARCHAR(50),
    p_action VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM resource_group_permissions rgp
        JOIN resource_groups rg ON rgp.group_id = rg.id
        JOIN resource_group_memberships rgm ON rg.id = rgm.group_id
        JOIN user_roles ur ON rgp.role_id = ur.role_id
        JOIN tenant_users tu ON ur.tenant_user_id = tu.id
        WHERE tu.user_id = p_user_id
          AND tu.is_active = TRUE
          AND rg.is_active = TRUE
          AND rg.resource_type = p_resource_type
          AND rgm.resource_id = p_resource_id
          AND (rgp.action = p_action OR rgp.action = 'MANAGE')
          AND (rgp.expires_at IS NULL OR rgp.expires_at > CURRENT_TIMESTAMP)
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all resource groups for a user
CREATE OR REPLACE FUNCTION get_user_resource_groups(
    p_user_id UUID,
    p_tenant_id UUID
) RETURNS TABLE(
    group_id UUID,
    group_name VARCHAR(255),
    resource_type VARCHAR(50),
    actions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rg.id as group_id,
        rg.name as group_name,
        rg.resource_type,
        ARRAY_AGG(DISTINCT rgp.action ORDER BY rgp.action) as actions
    FROM resource_groups rg
    JOIN resource_group_permissions rgp ON rg.id = rgp.group_id
    JOIN user_roles ur ON rgp.role_id = ur.role_id
    JOIN tenant_users tu ON ur.tenant_user_id = tu.id
    WHERE tu.user_id = p_user_id
      AND tu.tenant_id = p_tenant_id
      AND tu.is_active = TRUE
      AND rg.is_active = TRUE
      AND rg.tenant_id = p_tenant_id
      AND (rgp.expires_at IS NULL OR rgp.expires_at > CURRENT_TIMESTAMP)
    GROUP BY rg.id, rg.name, rg.resource_type
    ORDER BY rg.name;
END;
$$ LANGUAGE plpgsql STABLE;