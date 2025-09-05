-- ========================================
-- V022: Test Data Setup Functions for RLS
-- ========================================
-- Purpose: Provide SECURITY DEFINER functions to create test data
--          while bypassing RLS policies for initial setup.
--          These functions are essential for integration testing
--          where we need to create complete tenant environments.
-- ========================================

-- ========================================
-- 1. Test Tenant Setup Function
-- ========================================

-- Function to set up a complete test tenant with admin user and role
-- Uses SECURITY DEFINER to bypass RLS policies during initial setup
CREATE OR REPLACE FUNCTION setup_test_tenant_with_roles(
    p_tenant_name TEXT,
    p_org_id TEXT,
    p_admin_email TEXT,
    p_admin_auth0_sub TEXT DEFAULT NULL
) RETURNS TABLE(
    tenant_id UUID,
    admin_user_id UUID,
    admin_role_id UUID,
    tenant_user_id UUID
)
SECURITY DEFINER  -- Execute with owner's privileges (bypasses RLS)
SET search_path = public  -- Prevent search_path injection attacks
AS $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_role_id UUID;
    v_tenant_user_id UUID;
    v_auth0_sub TEXT;
BEGIN
    -- Generate auth0_sub if not provided
    v_auth0_sub := COALESCE(p_admin_auth0_sub, 'auth0|test_' || gen_random_uuid());
    
    -- Create tenant
    INSERT INTO tenants (
        name, 
        auth0_org_id, 
        slug, 
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_tenant_name,
        p_org_id,
        lower(regexp_replace(p_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')),
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO v_tenant_id;
    
    -- Create admin user
    INSERT INTO users (
        email,
        auth0_sub,
        created_at,
        updated_at
    ) VALUES (
        p_admin_email,
        v_auth0_sub,
        NOW(),
        NOW()
    ) RETURNING id INTO v_user_id;
    
    -- Create tenant_users relationship
    INSERT INTO tenant_users (
        tenant_id,
        user_id,
        is_active,
        joined_at
    ) VALUES (
        v_tenant_id,
        v_user_id,
        true,
        NOW()
    ) RETURNING id INTO v_tenant_user_id;
    
    -- Create initial admin role for the tenant
    -- This bypasses the is_tenant_admin() check in RLS policy
    INSERT INTO roles (
        tenant_id,
        name,
        display_name,
        color,
        position,
        created_at,
        updated_at
    ) VALUES (
        v_tenant_id,
        'admin',
        'Administrator',
        '#FF0000',
        10,
        NOW(),
        NOW()
    ) RETURNING id INTO v_role_id;
    
    -- Assign admin role to the user
    INSERT INTO user_roles (
        tenant_user_id,
        role_id,
        assigned_at
    ) VALUES (
        v_tenant_user_id,
        v_role_id,
        NOW()
    );
    
    -- Add basic admin permissions
    INSERT INTO role_permissions (role_id, permission_rule, created_at)
    VALUES 
        (v_role_id, 'workspace.create.all', NOW()),
        (v_role_id, 'workspace.edit.all', NOW()),
        (v_role_id, 'workspace.delete.all', NOW()),
        (v_role_id, 'workspace.view.all', NOW()),
        (v_role_id, 'user.manage.all', NOW()),
        (v_role_id, 'role.manage.all', NOW()),
        (v_role_id, 'table.create.all', NOW()),
        (v_role_id, 'table.edit.all', NOW()),
        (v_role_id, 'table.delete.all', NOW()),
        (v_role_id, 'table.view.all', NOW());
    
    -- Return the created IDs
    RETURN QUERY SELECT v_tenant_id, v_user_id, v_role_id, v_tenant_user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. Additional Test User Creation
-- ========================================

-- Function to add additional users to an existing tenant
CREATE OR REPLACE FUNCTION add_test_user_to_tenant(
    p_tenant_id UUID,
    p_email TEXT,
    p_role_name TEXT DEFAULT 'user',
    p_auth0_sub TEXT DEFAULT NULL
) RETURNS TABLE(
    user_id UUID,
    tenant_user_id UUID
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_tenant_user_id UUID;
    v_role_id UUID;
    v_auth0_sub TEXT;
BEGIN
    -- Generate auth0_sub if not provided
    v_auth0_sub := COALESCE(p_auth0_sub, 'auth0|test_' || gen_random_uuid());
    
    -- Create user
    INSERT INTO users (email, auth0_sub, created_at, updated_at)
    VALUES (p_email, v_auth0_sub, NOW(), NOW())
    RETURNING id INTO v_user_id;
    
    -- Add to tenant
    INSERT INTO tenant_users (tenant_id, user_id, is_active, joined_at)
    VALUES (p_tenant_id, v_user_id, true, NOW())
    RETURNING id INTO v_tenant_user_id;
    
    -- Find and assign role if it exists
    SELECT id INTO v_role_id
    FROM roles
    WHERE tenant_id = p_tenant_id AND name = p_role_name
    LIMIT 1;
    
    IF v_role_id IS NOT NULL THEN
        INSERT INTO user_roles (tenant_user_id, role_id, assigned_at)
        VALUES (v_tenant_user_id, v_role_id, NOW());
    END IF;
    
    RETURN QUERY SELECT v_user_id, v_tenant_user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. Test Data Cleanup Function
-- ========================================

-- Function to clean up test tenant data completely
CREATE OR REPLACE FUNCTION cleanup_test_tenant(
    p_tenant_id UUID
) RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete tenant (CASCADE will handle all related data)
    DELETE FROM tenants WHERE id = p_tenant_id;
    
    -- Clean up orphaned users (users not in any tenant)
    DELETE FROM users u
    WHERE NOT EXISTS (
        SELECT 1 FROM tenant_users tu WHERE tu.user_id = u.id
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. Permission Grants
-- ========================================

-- Grant execute permissions to app_user role
REVOKE EXECUTE ON FUNCTION setup_test_tenant_with_roles FROM PUBLIC;
GRANT EXECUTE ON FUNCTION setup_test_tenant_with_roles TO app_user;

REVOKE EXECUTE ON FUNCTION add_test_user_to_tenant FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_test_user_to_tenant TO app_user;

REVOKE EXECUTE ON FUNCTION cleanup_test_tenant FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_test_tenant TO app_user;

-- ========================================
-- 5. Environment-based Protection
-- ========================================

-- In production, these functions should be disabled or removed
-- This can be handled by deployment scripts or conditional logic
DO $$
BEGIN
    -- Check if we're in production (this would be set by deployment)
    IF current_setting('app.environment', true) = 'production' THEN
        RAISE NOTICE 'Production environment detected - test functions will be restricted';
        -- Option 1: Revoke all permissions
        REVOKE ALL ON FUNCTION setup_test_tenant_with_roles FROM app_user;
        REVOKE ALL ON FUNCTION add_test_user_to_tenant FROM app_user;
        REVOKE ALL ON FUNCTION cleanup_test_tenant FROM app_user;
        
        -- Option 2: Drop the functions entirely (uncomment if preferred)
        -- DROP FUNCTION IF EXISTS setup_test_tenant_with_roles;
        -- DROP FUNCTION IF EXISTS add_test_user_to_tenant;
        -- DROP FUNCTION IF EXISTS cleanup_test_tenant;
    END IF;
END $$;

-- ========================================
-- 6. Documentation
-- ========================================

COMMENT ON FUNCTION setup_test_tenant_with_roles IS 
'Creates a complete test tenant environment with admin user and role. 
Uses SECURITY DEFINER to bypass RLS for initial setup. 
Should only be used in test environments.';

COMMENT ON FUNCTION add_test_user_to_tenant IS 
'Adds additional test users to an existing tenant. 
Uses SECURITY DEFINER to bypass RLS. 
Should only be used in test environments.';

COMMENT ON FUNCTION cleanup_test_tenant IS 
'Completely removes a test tenant and all associated data. 
Cleans up orphaned users. 
Should only be used in test environments.';