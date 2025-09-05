-- V011__Improve_rls_security.sql
-- Security and performance improvements for RLS implementation

-- ========================================
-- 1. Improve Password Management
-- ========================================

-- Update app_user password from environment variable or generate for dev
DO $$
DECLARE
    v_password TEXT;
    v_user_exists BOOLEAN;
BEGIN
    -- Check if app_user exists
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') INTO v_user_exists;
    
    IF v_user_exists THEN
        -- Try to get password from environment variable
        v_password := current_setting('app.db_password', TRUE);
        
        IF v_password IS NULL OR v_password = '' THEN
            -- Generate random password for development
            v_password := 'dev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
            
            RAISE WARNING '========================================';
            RAISE WARNING 'SECURITY WARNING';
            RAISE WARNING '========================================';
            RAISE WARNING 'Using generated development password for app_user.';
            RAISE WARNING 'For production, set password using:';
            RAISE WARNING '  SET app.db_password = ''your_secure_password'';';
            RAISE WARNING 'Before running this migration.';
            RAISE WARNING 'Generated password: %', v_password;
            RAISE WARNING '========================================';
        ELSE
            RAISE NOTICE 'Updating app_user password from app.db_password setting.';
        END IF;
        
        -- Update the password
        EXECUTE format('ALTER USER app_user WITH PASSWORD %L', v_password);
    ELSE
        RAISE EXCEPTION 'app_user does not exist. Run V010 migration first.';
    END IF;
END $$;

-- ========================================
-- 2. Add Performance Indexes
-- ========================================

-- Index for efficient admin check in is_tenant_admin()
CREATE INDEX IF NOT EXISTS idx_tenant_users_admin_lookup 
ON tenant_users(user_id, tenant_id) 
WHERE is_active = TRUE;

-- Index for user_roles lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_check 
ON user_roles(tenant_user_id);

-- Index for finding admin role quickly
CREATE INDEX IF NOT EXISTS idx_roles_admin_name 
ON roles(tenant_id, name) 
WHERE name = 'admin';

-- Composite index for permission checks
CREATE INDEX IF NOT EXISTS idx_role_permissions_composite
ON role_permissions(role_id, permission_rule);

-- ========================================
-- 3. Add Debug/Development View
-- ========================================

-- View to check current session context (useful for debugging)
CREATE OR REPLACE VIEW v_current_context AS
SELECT 
    current_tenant_id() as tenant_id,
    (SELECT name FROM tenants WHERE id = current_tenant_id()) as tenant_name,
    current_user_id() as user_id,
    (SELECT email FROM users WHERE id = current_user_id()) as user_email,
    is_tenant_admin() as is_admin,
    is_tenant_member() as is_member,
    current_database() as database_name,
    current_user as database_user,
    inet_client_addr() as client_ip,
    current_timestamp as query_time;

COMMENT ON VIEW v_current_context IS 
'Debug view to check current RLS context. Use: SELECT * FROM v_current_context;';

-- ========================================
-- 4. Add Connection Validation Function
-- ========================================

-- Function to validate that session is properly configured
CREATE OR REPLACE FUNCTION validate_session()
RETURNS BOOLEAN AS $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    v_tenant_id := current_tenant_id();
    v_user_id := current_user_id();
    
    -- Check if both are set
    IF v_tenant_id IS NULL THEN
        RAISE WARNING 'Session validation failed: tenant_id not set';
        RETURN FALSE;
    END IF;
    
    IF v_user_id IS NULL THEN
        RAISE WARNING 'Session validation failed: user_id not set';
        RETURN FALSE;
    END IF;
    
    -- Check if user is member of tenant
    IF NOT is_tenant_member() THEN
        RAISE WARNING 'Session validation failed: user % is not member of tenant %', 
                     v_user_id, v_tenant_id;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validate_session() IS 
'Validates that the current session has proper tenant and user context set. Returns TRUE if valid.';

-- ========================================
-- 5. Improve is_tenant_admin() Performance
-- ========================================

-- Optimized version of is_tenant_admin using the new indexes
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Get session variables once
    v_tenant_id := current_tenant_id();
    v_user_id := current_user_id();
    
    -- Return false if session not set
    IF v_tenant_id IS NULL OR v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Optimized query using indexes
    SELECT EXISTS (
        SELECT 1
        FROM tenant_users tu
        INNER JOIN user_roles ur ON tu.id = ur.tenant_user_id
        INNER JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
        WHERE tu.user_id = v_user_id
          AND tu.tenant_id = v_tenant_id
          AND tu.is_active = TRUE
        LIMIT 1  -- Stop at first match
    ) INTO v_is_admin;
    
    RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- 6. Add Session Info Table (Optional)
-- ========================================

-- Table to track active sessions (for monitoring/debugging)
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_active_sessions_cleanup 
ON active_sessions(last_activity_at) 
WHERE is_active = TRUE;

-- Function to register session (optional, for tracking)
CREATE OR REPLACE FUNCTION register_session(
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO active_sessions (tenant_id, user_id, ip_address, user_agent)
    VALUES (current_tenant_id(), current_user_id(), p_ip_address, p_user_agent)
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE active_sessions 
    SET last_activity_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Statistics and Monitoring
-- ========================================

-- View for monitoring RLS usage
CREATE OR REPLACE VIEW v_rls_statistics AS
SELECT 
    t.name as tenant_name,
    COUNT(DISTINCT tu.user_id) as user_count,
    COUNT(DISTINCT ur.tenant_user_id) as users_with_roles,
    COUNT(DISTINCT CASE WHEN r.name = 'admin' THEN ur.tenant_user_id END) as admin_count,
    COUNT(DISTINCT r.id) as role_count,
    t.is_active as tenant_active
FROM tenants t
LEFT JOIN tenant_users tu ON t.id = tu.tenant_id AND tu.is_active = TRUE
LEFT JOIN user_roles ur ON tu.id = ur.tenant_user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY t.id, t.name, t.is_active;

COMMENT ON VIEW v_rls_statistics IS 
'Statistics view for monitoring tenant usage and role distribution';

-- ========================================
-- 8. Documentation and Usage Instructions
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Improvements Applied Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'New Features:';
    RAISE NOTICE '1. Secure password management (set app.db_password)';
    RAISE NOTICE '2. Performance indexes for admin checks';
    RAISE NOTICE '3. Debug view: SELECT * FROM v_current_context;';
    RAISE NOTICE '4. Session validation: SELECT validate_session();';
    RAISE NOTICE '5. Statistics view: SELECT * FROM v_rls_statistics;';
    RAISE NOTICE '';
    RAISE NOTICE 'Production Checklist:';
    RAISE NOTICE '□ Set secure password for app_user';
    RAISE NOTICE '□ Configure connection pooling properly';
    RAISE NOTICE '□ Monitor active_sessions table';
    RAISE NOTICE '□ Review v_rls_statistics regularly';
    RAISE NOTICE '========================================';
END $$;