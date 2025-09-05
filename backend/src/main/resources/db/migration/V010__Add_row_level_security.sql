-- V010__Add_row_level_security.sql
-- Implement Row Level Security (RLS) for multi-tenant data isolation

-- ========================================
-- 1. Helper Functions for Session Management
-- ========================================

-- Get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', TRUE)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;  -- Return NULL if not set (safe default)
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_user_id', TRUE)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;  -- Return NULL if not set (safe default)
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user is admin in current tenant
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM tenant_users tu
        JOIN user_roles ur ON tu.id = ur.tenant_user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE tu.user_id = current_user_id()
          AND tu.tenant_id = current_tenant_id()
          AND tu.is_active = TRUE
          AND r.name = 'admin'
    ) INTO v_is_admin;
    
    RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user is member of current tenant
CREATE OR REPLACE FUNCTION is_tenant_member()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_member BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM tenant_users
        WHERE user_id = current_user_id()
          AND tenant_id = current_tenant_id()
          AND is_active = TRUE
    ) INTO v_is_member;
    
    RETURN COALESCE(v_is_member, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- 2. Enable RLS on Tenant-Specific Tables
-- ========================================

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Note: We don't enable RLS on these tables:
-- - users: Cross-tenant, managed by Auth0
-- - tenants: Public information
-- - user_profiles: User-specific, not tenant-specific

-- ========================================
-- 3. Create Application Database User
-- ========================================

-- Check if user exists before creating (for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE USER app_user WITH PASSWORD 'changeme_in_production';
    END IF;
END
$$;

-- Grant necessary permissions
DO $$
DECLARE
    v_dbname TEXT;
BEGIN
    SELECT current_database() INTO v_dbname;
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO app_user', v_dbname);
END $$;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Grant permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO app_user;

-- ========================================
-- 4. RLS Policies for tenant_users
-- ========================================

-- SELECT: Can only see members of current tenant
CREATE POLICY tenant_users_select ON tenant_users
    FOR SELECT
    TO PUBLIC
    USING (tenant_id = current_tenant_id());

-- INSERT: Only admins can add users to tenant
CREATE POLICY tenant_users_insert ON tenant_users
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        tenant_id = current_tenant_id() 
        AND is_tenant_admin()
    );

-- UPDATE: Only admins can update memberships
CREATE POLICY tenant_users_update ON tenant_users
    FOR UPDATE
    TO PUBLIC
    USING (tenant_id = current_tenant_id())
    WITH CHECK (
        tenant_id = current_tenant_id() 
        AND is_tenant_admin()
    );

-- DELETE: Only admins can remove users from tenant
CREATE POLICY tenant_users_delete ON tenant_users
    FOR DELETE
    TO PUBLIC
    USING (
        tenant_id = current_tenant_id() 
        AND is_tenant_admin()
    );

-- ========================================
-- 5. RLS Policies for roles
-- ========================================

-- SELECT: Can see roles in current tenant
CREATE POLICY roles_select ON roles
    FOR SELECT
    TO PUBLIC
    USING (tenant_id = current_tenant_id());

-- INSERT: Only admins can create roles
CREATE POLICY roles_insert ON roles
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        tenant_id = current_tenant_id() 
        AND is_tenant_admin()
    );

-- UPDATE: Only admins can modify roles (except system roles)
CREATE POLICY roles_update ON roles
    FOR UPDATE
    TO PUBLIC
    USING (
        tenant_id = current_tenant_id() 
        AND is_tenant_admin()
    )
    WITH CHECK (
        tenant_id = current_tenant_id() 
        AND is_tenant_admin()
        AND is_system = FALSE  -- Cannot modify system roles
    );

-- DELETE: Only admins can delete roles (except system roles)
CREATE POLICY roles_delete ON roles
    FOR DELETE
    TO PUBLIC
    USING (
        tenant_id = current_tenant_id() 
        AND is_tenant_admin()
        AND is_system = FALSE  -- Cannot delete system roles
    );

-- ========================================
-- 6. RLS Policies for user_roles
-- ========================================

-- SELECT: Can see role assignments in current tenant
CREATE POLICY user_roles_select ON user_roles
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM tenant_users tu
            WHERE tu.id = user_roles.tenant_user_id
              AND tu.tenant_id = current_tenant_id()
        )
    );

-- INSERT: Only admins can assign roles
CREATE POLICY user_roles_insert ON user_roles
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tenant_users tu
            WHERE tu.id = tenant_user_id
              AND tu.tenant_id = current_tenant_id()
        )
        AND is_tenant_admin()
    );

-- DELETE: Only admins can remove role assignments
CREATE POLICY user_roles_delete ON user_roles
    FOR DELETE
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM tenant_users tu
            WHERE tu.id = user_roles.tenant_user_id
              AND tu.tenant_id = current_tenant_id()
        )
        AND is_tenant_admin()
    );

-- Note: No UPDATE policy as role assignments should be immutable

-- ========================================
-- 7. RLS Policies for role_permissions
-- ========================================

-- SELECT: Can see permissions for roles in current tenant
CREATE POLICY role_permissions_select ON role_permissions
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = role_permissions.role_id
              AND r.tenant_id = current_tenant_id()
        )
    );

-- INSERT: Only admins can add permissions
CREATE POLICY role_permissions_insert ON role_permissions
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = role_id
              AND r.tenant_id = current_tenant_id()
              AND r.is_system = FALSE  -- Cannot modify system role permissions
        )
        AND is_tenant_admin()
    );

-- DELETE: Only admins can remove permissions
CREATE POLICY role_permissions_delete ON role_permissions
    FOR DELETE
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = role_permissions.role_id
              AND r.tenant_id = current_tenant_id()
              AND r.is_system = FALSE  -- Cannot modify system role permissions
        )
        AND is_tenant_admin()
    );

-- ========================================
-- 8. Testing Helper Functions
-- ========================================

-- Set current tenant (for testing/development)
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Set current user (for testing/development)  
CREATE OR REPLACE FUNCTION set_current_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Clear session variables (for testing)
CREATE OR REPLACE FUNCTION clear_session()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', '', FALSE);
    PERFORM set_config('app.current_user_id', '', FALSE);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. Add Comments and Documentation
-- ========================================

COMMENT ON FUNCTION current_tenant_id() IS 
'Returns the current tenant ID from session context. Returns NULL if not set.';

COMMENT ON FUNCTION current_user_id() IS 
'Returns the current user ID from session context. Returns NULL if not set.';

COMMENT ON FUNCTION is_tenant_admin() IS 
'Checks if the current user has admin role in the current tenant.';

COMMENT ON FUNCTION is_tenant_member() IS 
'Checks if the current user is an active member of the current tenant.';

COMMENT ON FUNCTION set_current_tenant(UUID) IS 
'[DEVELOPMENT ONLY] Sets the current tenant ID in session context.';

COMMENT ON FUNCTION set_current_user(UUID) IS 
'[DEVELOPMENT ONLY] Sets the current user ID in session context.';

COMMENT ON FUNCTION clear_session() IS 
'[DEVELOPMENT ONLY] Clears all session variables.';

-- ========================================
-- 10. Usage Instructions
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Implementation Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Application Usage:';
    RAISE NOTICE '1. Connect as "app_user" (not postgres)';
    RAISE NOTICE '2. Set session variables on each request:';
    RAISE NOTICE '   SET app.current_tenant_id = ''tenant-uuid'';';
    RAISE NOTICE '   SET app.current_user_id = ''user-uuid'';';
    RAISE NOTICE '3. Queries will automatically filter by tenant';
    RAISE NOTICE '';
    RAISE NOTICE 'Testing:';
    RAISE NOTICE '   SELECT set_current_tenant(''uuid'');';
    RAISE NOTICE '   SELECT set_current_user(''uuid'');';
    RAISE NOTICE '   SELECT * FROM tenant_users; -- Only shows current tenant';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Note:';
    RAISE NOTICE 'Remember to change app_user password in production!';
    RAISE NOTICE '========================================';
END $$;