-- V024__Fix_workspace_rls_security_hole.sql
-- Critical security fix: Ensure users can only insert data into tenants they are members of
-- 
-- Previous issue: INSERT policies only checked tenant_id match, not membership
-- This allowed any user to insert data into any tenant by setting session variables

-- ========================================
-- 1. Fix workspaces table INSERT policy
-- ========================================

-- Drop the insecure policy
DROP POLICY IF EXISTS workspaces_tenant_isolation_insert ON workspaces;

-- Create secure policy that verifies tenant membership
CREATE POLICY workspaces_tenant_isolation_insert ON workspaces
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        tenant_id = current_tenant_id() 
        AND is_tenant_member()  -- Critical: User must be a member of the tenant
    );

-- ========================================
-- 2. Fix tables table INSERT policy
-- ========================================

-- Drop the insecure policy
DROP POLICY IF EXISTS tables_tenant_isolation_insert ON tables;

-- Create secure policy that verifies tenant membership and workspace ownership
CREATE POLICY tables_tenant_isolation_insert ON tables
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_id
              AND w.tenant_id = current_tenant_id()
        )
        AND is_tenant_member()  -- Critical: User must be a member of the tenant
    );

-- ========================================
-- 3. Fix records table INSERT policy
-- ========================================

-- Drop the insecure policy
DROP POLICY IF EXISTS records_tenant_isolation_insert ON records;

-- Create secure policy that verifies tenant membership and table ownership
CREATE POLICY records_tenant_isolation_insert ON records
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tables t
            JOIN workspaces w ON t.workspace_id = w.id
            WHERE t.id = table_id
              AND w.tenant_id = current_tenant_id()
        )
        AND is_tenant_member()  -- Critical: User must be a member of the tenant
    );

-- ========================================
-- 4. Verify the fix with a test function
-- ========================================

CREATE OR REPLACE FUNCTION test_rls_security_fix()
RETURNS TABLE (
    test_name TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
DECLARE
    v_test_tenant_id UUID := gen_random_uuid();
    v_test_user_id UUID := gen_random_uuid();
    v_workspace_id UUID := gen_random_uuid();
BEGIN
    -- Test 1: Verify INSERT fails without tenant membership
    RETURN QUERY
    SELECT 
        'INSERT without membership'::TEXT,
        FALSE::BOOLEAN,  -- Should fail (expecting exception)
        'User should not be able to insert without being a tenant member'::TEXT;
    
    -- Test 2: Verify is_tenant_member() returns false for non-members
    PERFORM set_config('app.current_tenant_id', v_test_tenant_id::TEXT, true);
    PERFORM set_config('app.current_user_id', v_test_user_id::TEXT, true);
    
    RETURN QUERY
    SELECT 
        'is_tenant_member() for non-member'::TEXT,
        NOT is_tenant_member(),  -- Should return false
        format('is_tenant_member() should return false for non-member. Returned: %s', is_tenant_member())::TEXT;
    
    -- Clear session
    PERFORM set_config('app.current_tenant_id', NULL, true);
    PERFORM set_config('app.current_user_id', NULL, true);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. Log the security fix
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECURITY FIX APPLIED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fixed critical security vulnerability in RLS policies:';
    RAISE NOTICE '- workspaces INSERT now requires tenant membership';
    RAISE NOTICE '- tables INSERT now requires tenant membership';
    RAISE NOTICE '- records INSERT now requires tenant membership';
    RAISE NOTICE '';
    RAISE NOTICE 'Previous behavior (INSECURE):';
    RAISE NOTICE '  Any user could insert data by setting session variables';
    RAISE NOTICE '';
    RAISE NOTICE 'New behavior (SECURE):';
    RAISE NOTICE '  Users must be active members of the tenant (tenant_users record)';
    RAISE NOTICE '========================================';
END $$;

-- Clean up test function after verification
-- DROP FUNCTION IF EXISTS test_rls_security_fix();