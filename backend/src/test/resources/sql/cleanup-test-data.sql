-- Cleanup test data between integration tests
-- This script truncates all tables except system tables and resets sequences
-- Note: TRUNCATE with CASCADE handles foreign key dependencies automatically

-- Truncate all data tables with CASCADE to handle dependencies
TRUNCATE TABLE 
    records,
    tables,
    workspaces,
    resource_group_memberships,
    resource_group_permissions,
    resource_groups,
    role_permissions,
    user_roles,
    roles,
    tenant_users,
    user_profiles,
    users,
    tenants,
    active_sessions
RESTART IDENTITY CASCADE;