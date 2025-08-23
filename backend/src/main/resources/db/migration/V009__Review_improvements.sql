-- V009__Review_improvements.sql
-- Implement review feedback: remove unnecessary indexes and functions, add useful view

-- 1. Drop unnecessary indexes on created_at columns
-- These are rarely used for sorting in MVP
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_tenants_created_at;

-- 2. Drop helper functions in favor of simpler views
-- Views are more compatible with ORMs and easier to test
DROP FUNCTION IF EXISTS get_user_tenants(UUID);
DROP FUNCTION IF EXISTS get_user_roles_in_tenant(UUID, UUID);

-- 3. Create a useful view for common JOIN pattern
-- This view combines the most frequently accessed user-tenant-role information
CREATE OR REPLACE VIEW v_user_tenant_roles AS
SELECT 
    -- User information
    u.id as user_id,
    u.auth0_sub,
    u.email,
    up.display_name,
    up.avatar_url,
    
    -- Tenant information
    t.id as tenant_id,
    t.slug as tenant_slug,
    t.name as tenant_name,
    t.is_active as tenant_active,
    
    -- Membership information
    tu.id as tenant_user_id,
    tu.joined_at,
    tu.last_accessed_at,
    tu.is_active as membership_active,
    
    -- Role information
    r.id as role_id,
    r.name as role_name,
    r.display_name as role_display_name,
    r.color as role_color,
    r.position as role_position,
    r.is_system as role_is_system,
    
    -- Combined active status (both tenant and membership must be active)
    (t.is_active AND tu.is_active) as is_fully_active
FROM tenant_users tu
JOIN users u ON tu.user_id = u.id
JOIN tenants t ON tu.tenant_id = t.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_roles ur ON tu.id = ur.tenant_user_id
LEFT JOIN roles r ON ur.role_id = r.id;

-- 4. Create index for the view's common WHERE clauses
-- This replaces the function-based approach with index-backed queries

-- Index for "get all active tenants for a user"
CREATE INDEX IF NOT EXISTS idx_tenant_users_by_user_active 
ON tenant_users(user_id, tenant_id) 
WHERE is_active = TRUE;

-- Index for "get all active users in a tenant"
CREATE INDEX IF NOT EXISTS idx_tenant_users_by_tenant_active 
ON tenant_users(tenant_id, user_id) 
WHERE is_active = TRUE;

-- 5. Add helpful comments to clarify the two types of is_active
COMMENT ON COLUMN tenants.is_active IS 
'Whether the entire tenant/organization is active (e.g., paid subscription, not suspended)';

COMMENT ON COLUMN tenant_users.is_active IS 
'Whether this specific user membership is active (e.g., not removed from organization)';

COMMENT ON VIEW v_user_tenant_roles IS 
'Consolidated view of user-tenant-role relationships. Use this for most user permission queries.';

COMMENT ON COLUMN v_user_tenant_roles.is_fully_active IS 
'TRUE only when both tenant is active AND user membership is active';

-- 6. Add a simple function to check if user has permission in tenant
-- This is the only function we keep, as it encapsulates important business logic
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_tenant_id UUID,
    p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    -- Check if user has the specific permission in the tenant
    SELECT EXISTS (
        SELECT 1
        FROM tenant_users tu
        JOIN user_roles ur ON tu.id = ur.tenant_user_id
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        WHERE tu.user_id = p_user_id
          AND tu.tenant_id = p_tenant_id
          AND tu.is_active = TRUE
          AND (
              rp.permission_rule = p_permission
              OR rp.permission_rule = SPLIT_PART(p_permission, '.', 1) || '.*'
              OR rp.permission_rule = '*'
          )
    ) INTO v_has_permission;
    
    RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_has_permission(UUID, UUID, TEXT) IS 
'Check if a user has a specific permission in a tenant context. Handles wildcards.';

-- 7. Log the improvements
DO $$
BEGIN
    RAISE NOTICE 'Review improvements applied:';
    RAISE NOTICE '- Removed unnecessary created_at indexes';
    RAISE NOTICE '- Replaced helper functions with v_user_tenant_roles view';
    RAISE NOTICE '- Added clarifying comments for is_active columns';
    RAISE NOTICE '- Added user_has_permission() for permission checks';
    RAISE NOTICE 'Note: New users have NO roles by default (Discord-style)';
END $$;