-- V021__Add_RLS_to_workspace_tables.sql
-- Add Row Level Security to workspace-related tables
-- Extends RLS protection from auth tables to core data tables

-- ========================================
-- 1. Enable RLS on Workspace Tables
-- ========================================

-- Enable RLS on workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tables table
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Enable RLS on records table
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. RLS Policies for workspaces
-- ========================================

-- SELECT: Can only see workspaces in current tenant
CREATE POLICY workspaces_tenant_isolation_select ON workspaces
    FOR SELECT
    TO PUBLIC
    USING (tenant_id = current_tenant_id());

-- INSERT: Can only create workspaces in current tenant
CREATE POLICY workspaces_tenant_isolation_insert ON workspaces
    FOR INSERT
    TO PUBLIC
    WITH CHECK (tenant_id = current_tenant_id());

-- UPDATE: Can only update workspaces in current tenant
CREATE POLICY workspaces_tenant_isolation_update ON workspaces
    FOR UPDATE
    TO PUBLIC
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- DELETE: Can only delete workspaces in current tenant
CREATE POLICY workspaces_tenant_isolation_delete ON workspaces
    FOR DELETE
    TO PUBLIC
    USING (tenant_id = current_tenant_id());

-- ========================================
-- 3. RLS Policies for tables
-- ========================================

-- SELECT: Can only see tables in workspaces that belong to current tenant
CREATE POLICY tables_tenant_isolation_select ON tables
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = tables.workspace_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- INSERT: Can only create tables in workspaces that belong to current tenant
CREATE POLICY tables_tenant_isolation_insert ON tables
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- UPDATE: Can only update tables in workspaces that belong to current tenant
CREATE POLICY tables_tenant_isolation_update ON tables
    FOR UPDATE
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = tables.workspace_id
              AND w.tenant_id = current_tenant_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- DELETE: Can only delete tables in workspaces that belong to current tenant
CREATE POLICY tables_tenant_isolation_delete ON tables
    FOR DELETE
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = tables.workspace_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- ========================================
-- 4. RLS Policies for records
-- ========================================

-- SELECT: Can only see records in tables that belong to workspaces in current tenant
CREATE POLICY records_tenant_isolation_select ON records
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM tables t
            JOIN workspaces w ON w.id = t.workspace_id
            WHERE t.id = records.table_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- INSERT: Can only create records in tables that belong to workspaces in current tenant
CREATE POLICY records_tenant_isolation_insert ON records
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tables t
            JOIN workspaces w ON w.id = t.workspace_id
            WHERE t.id = table_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- UPDATE: Can only update records in tables that belong to workspaces in current tenant
CREATE POLICY records_tenant_isolation_update ON records
    FOR UPDATE
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM tables t
            JOIN workspaces w ON w.id = t.workspace_id
            WHERE t.id = records.table_id
              AND w.tenant_id = current_tenant_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tables t
            JOIN workspaces w ON w.id = t.workspace_id
            WHERE t.id = table_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- DELETE: Can only delete records in tables that belong to workspaces in current tenant
CREATE POLICY records_tenant_isolation_delete ON records
    FOR DELETE
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM tables t
            JOIN workspaces w ON w.id = t.workspace_id
            WHERE t.id = records.table_id
              AND w.tenant_id = current_tenant_id()
        )
    );

-- ========================================
-- 5. Performance Indexes for RLS
-- ========================================

-- Index for workspace-table joins in RLS policies
CREATE INDEX IF NOT EXISTS idx_tables_workspace_rls
ON tables(workspace_id)
WHERE workspace_id IS NOT NULL;

-- Index for table-record joins in RLS policies
CREATE INDEX IF NOT EXISTS idx_records_table_rls  
ON records(table_id)
WHERE table_id IS NOT NULL;

-- Composite index for workspace tenant filtering
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant_rls
ON workspaces(tenant_id)
WHERE tenant_id IS NOT NULL;

-- ========================================
-- 6. Testing Helper Functions
-- ========================================

-- Function to test RLS isolation (for testing only)
CREATE OR REPLACE FUNCTION test_rls_workspace_isolation(p_tenant_id UUID)
RETURNS TABLE(
    workspace_count BIGINT,
    table_count BIGINT, 
    record_count BIGINT
) AS $$
BEGIN
    -- Set test context
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, FALSE);
    
    -- Return counts that should only show data for the specified tenant
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM workspaces)::BIGINT as workspace_count,
        (SELECT COUNT(*) FROM tables)::BIGINT as table_count,
        (SELECT COUNT(*) FROM records)::BIGINT as record_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate RLS is working correctly
CREATE OR REPLACE FUNCTION validate_rls_protection()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::INTEGER
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            tablename,
            COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
      AND t.tablename IN ('workspaces', 'tables', 'records', 'tenant_users', 'roles', 'user_roles', 'role_permissions')
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Comments and Documentation
-- ========================================

COMMENT ON POLICY workspaces_tenant_isolation_select ON workspaces IS 
'Ensures users can only see workspaces within their current tenant context';

COMMENT ON POLICY tables_tenant_isolation_select ON tables IS 
'Ensures users can only see tables in workspaces that belong to their current tenant';

COMMENT ON POLICY records_tenant_isolation_select ON records IS 
'Ensures users can only see records in tables that belong to workspaces in their current tenant';

COMMENT ON FUNCTION test_rls_workspace_isolation(UUID) IS 
'[TESTING ONLY] Sets tenant context and returns visible record counts for testing RLS isolation';

COMMENT ON FUNCTION validate_rls_protection() IS 
'Returns RLS status and policy counts for key tables to validate security setup';

-- ========================================
-- 8. Verification and Status Report
-- ========================================

DO $$
DECLARE
    v_workspace_policies INTEGER;
    v_table_policies INTEGER;
    v_record_policies INTEGER;
BEGIN
    -- Count policies created
    SELECT COUNT(*) INTO v_workspace_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'workspaces';
    
    SELECT COUNT(*) INTO v_table_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tables';
    
    SELECT COUNT(*) INTO v_record_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'records';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Extended to Workspace Tables!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Status:';
    RAISE NOTICE '✓ workspaces table: RLS enabled, % policies', v_workspace_policies;
    RAISE NOTICE '✓ tables table: RLS enabled, % policies', v_table_policies;
    RAISE NOTICE '✓ records table: RLS enabled, % policies', v_record_policies;
    RAISE NOTICE '';
    RAISE NOTICE 'Security Features:';
    RAISE NOTICE '• Multi-level tenant isolation (workspace→table→record)';
    RAISE NOTICE '• Performance indexes for RLS queries';
    RAISE NOTICE '• Testing helper functions included';
    RAISE NOTICE '';
    RAISE NOTICE 'Testing:';
    RAISE NOTICE '  SELECT * FROM validate_rls_protection();';
    RAISE NOTICE '  SELECT * FROM test_rls_workspace_isolation(''tenant-uuid'');';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Test RLS isolation thoroughly before production!';
    RAISE NOTICE '========================================';
END $$;