-- V017__Add_workspace_ownership.sql
-- Add ownership and team support to workspaces table

-- ========================================
-- 1. Add ownership columns to workspaces
-- ========================================

ALTER TABLE workspaces 
ADD COLUMN created_by UUID REFERENCES users(id),
ADD COLUMN team_id UUID;

-- ========================================  
-- 2. Migrate existing data
-- ========================================

-- Set created_by to the first admin user of each tenant
-- This provides a reasonable default for existing workspaces
UPDATE workspaces SET created_by = (
    SELECT u.id 
    FROM users u 
    JOIN tenant_users tu ON tu.user_id = u.id 
    JOIN user_roles ur ON tu.id = ur.tenant_user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE tu.tenant_id = workspaces.tenant_id 
    AND r.name = 'admin'
    ORDER BY tu.joined_at ASC
    LIMIT 1
) WHERE created_by IS NULL;

-- For workspaces without admin users, use the first user in the tenant
UPDATE workspaces SET created_by = (
    SELECT u.id 
    FROM users u 
    JOIN tenant_users tu ON tu.user_id = u.id 
    WHERE tu.tenant_id = workspaces.tenant_id 
    ORDER BY tu.joined_at ASC
    LIMIT 1
) WHERE created_by IS NULL;

-- ========================================
-- 3. Create indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_workspaces_created_by 
    ON workspaces(created_by);

CREATE INDEX IF NOT EXISTS idx_workspaces_team_id 
    ON workspaces(team_id) 
    WHERE team_id IS NOT NULL;

-- ========================================
-- 4. Add comments
-- ========================================

COMMENT ON COLUMN workspaces.created_by IS 
'作成者のユーザーID。所有権管理とアクセス制御に使用';

COMMENT ON COLUMN workspaces.team_id IS 
'チームID（将来実装用）。現在はNULL許可、チーム機能実装時に使用';

-- ========================================
-- 5. Verification and completion message
-- ========================================

DO $$
DECLARE
    workspace_count INTEGER;
    owned_workspace_count INTEGER;
BEGIN
    -- Count total workspaces
    SELECT COUNT(*) INTO workspace_count FROM workspaces;
    
    -- Count workspaces with ownership
    SELECT COUNT(*) INTO owned_workspace_count FROM workspaces WHERE created_by IS NOT NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Workspace Ownership Migration Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE '• Total workspaces: %', workspace_count;
    RAISE NOTICE '• Workspaces with owners: %', owned_workspace_count;
    
    -- Handle division by zero case
    IF workspace_count > 0 THEN
        RAISE NOTICE '• Success rate: %%%', ROUND((owned_workspace_count::DECIMAL / workspace_count * 100), 2);
    ELSE
        RAISE NOTICE '• Success rate: N/A (no workspaces found)';
    END IF;
    RAISE NOTICE '';
    
    IF owned_workspace_count < workspace_count THEN
        RAISE WARNING 'Some workspaces still have NULL created_by. Manual review may be needed.';
    ELSE
        RAISE NOTICE '✓ All workspaces have been assigned owners successfully';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;