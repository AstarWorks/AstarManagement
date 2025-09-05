-- V999__Setup_test_data.sql
-- Test data setup for integration tests
-- This migration is only executed in test environments

-- Clear all test data using TRUNCATE CASCADE for clean slate
-- This ensures no foreign key constraint issues and is faster than DELETE
-- Add CASCADE to handle foreign key dependencies properly


-- Update existing data with version for Spring Data JDBC compatibility
-- (This is applied after inserts to handle existing test data)
-- Note: This UPDATE section will be placed at the end of the file

-- Insert test users (with test auth0_sub values)
INSERT INTO users (id, auth0_sub, email, created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'auth0|test_11111111-1111-1111-1111-111111111111', 'tenant1-admin@test.com', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'auth0|test_22222222-2222-2222-2222-222222222222', 'tenant1-user@test.com', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'auth0|test_33333333-3333-3333-3333-333333333333', 'tenant1-viewer@test.com', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'auth0|test_44444444-4444-4444-4444-444444444444', 'tenant2-admin@test.com', NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'auth0|test_55555555-5555-5555-5555-555555555555', 'tenant2-user@test.com', NOW(), NOW());

-- Insert test tenants with Auth0 organization IDs for JWT testing
INSERT INTO tenants (id, slug, name, auth0_org_id, is_active, created_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tenant-a', 'Tenant A', 'org_tenant_a_test', TRUE, NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'tenant-b', 'Tenant B', 'org_tenant_b_test', TRUE, NOW(), NOW());


-- Insert test roles with comprehensive permission structure
INSERT INTO roles (id, tenant_id, name, display_name, color, position, created_at, updated_at) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', 'Administrator', '#FF0000', 10, NOW(), NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user', 'User', '#00FF00', 5, NOW(), NOW()),
    ('d2333333-2333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'viewer', 'Viewer', '#0000FF', 1, NOW(), NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin', 'Administrator', '#FF0000', 10, NOW(), NOW()),
    ('d4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user', 'User', '#00FF00', 5, NOW(), NOW());

-- Insert role permissions
INSERT INTO role_permissions (role_id, permission_rule, created_at) VALUES
    -- Tenant A ADMIN permissions
    ('d1111111-1111-1111-1111-111111111111', 'workspace.create.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'workspace.edit.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'workspace.delete.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'workspace.view.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'user.manage.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'role.manage.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'table.create.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'table.edit.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'table.view.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'table.delete.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'table.export.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'table.import.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'record.create.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'record.edit.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'record.view.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'record.delete.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'property_type.create.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'property_type.edit.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'property_type.delete.all', NOW()),
    ('d1111111-1111-1111-1111-111111111111', 'property_type.view.all', NOW()),
    
    -- Tenant A USER permissions (updated for integration tests)
    ('d2222222-2222-2222-2222-222222222222', 'workspace.create.own', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'workspace.edit.all', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'workspace.view.all', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'document.create.own', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'document.edit.own', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'table.create.all', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'table.edit.own', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'table.view.all', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'table.export.own', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'record.create.own', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'record.edit.own', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'record.view.all', NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'record.delete.own', NOW()),
    
    -- Tenant A VIEWER permissions
    ('d2333333-2333-3333-3333-333333333333', 'workspace.view.all', NOW()),
    ('d2333333-2333-3333-3333-333333333333', 'document.view.all', NOW()),
    ('d2333333-2333-3333-3333-333333333333', 'table.view.all', NOW()),
    ('d2333333-2333-3333-3333-333333333333', 'record.view.all', NOW()),
    
    -- Tenant B ADMIN permissions
    ('d3333333-3333-3333-3333-333333333333', 'workspace.create.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'workspace.edit.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'workspace.view.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'user.manage.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'table.create.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'table.edit.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'table.view.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'table.delete.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'record.create.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'record.edit.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'record.view.all', NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'record.delete.all', NOW()),
    
    -- Tenant B USER permissions  
    ('d4444444-4444-4444-4444-444444444444', 'workspace.view.all', NOW()),
    ('d4444444-4444-4444-4444-444444444444', 'document.create.own', NOW()),
    ('d4444444-4444-4444-4444-444444444444', 'table.view.all', NOW()),
    ('d4444444-4444-4444-4444-444444444444', 'record.view.all', NOW());

-- Insert tenant users (joined_at instead of created_at per V008 schema)
INSERT INTO tenant_users (id, tenant_id, user_id, is_active, joined_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', TRUE, NOW()),
    ('a2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', TRUE, NOW()),
    ('a3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', TRUE, NOW()),
    ('b4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', TRUE, NOW()),
    ('b5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', TRUE, NOW()),
    -- Add default user to Tenant B for multi-tenant test support
    ('b1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', TRUE, NOW());

-- Insert user roles (assigned_at instead of created_at per V008 schema)
INSERT INTO user_roles (tenant_user_id, role_id, assigned_at) VALUES
    -- Tenant A users
    ('a1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', NOW()), -- Tenant A Admin -> admin role
    ('a1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', NOW()), -- Tenant A Admin -> user role (multiple roles)
    ('a2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', NOW()), -- Tenant A User -> user role
    ('a3333333-3333-3333-3333-333333333333', 'd2333333-2333-3333-3333-333333333333', NOW()), -- Tenant A Viewer -> viewer role
    
    -- Tenant B users  
    ('b4444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', NOW()), -- Tenant B Admin -> admin role
    ('b5555555-5555-5555-5555-555555555555', 'd4444444-4444-4444-4444-444444444444', NOW()), -- Tenant B User -> user role
    -- Default user with admin role in Tenant B
    ('b1111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', NOW()); -- Default user -> Tenant B admin role

-- Insert test workspaces with proper ownership
INSERT INTO workspaces (id, tenant_id, name, created_by, created_at) VALUES
    ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenant A Workspace', '11111111-1111-1111-1111-111111111111', NOW()),
    ('e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tenant B Workspace', '44444444-4444-4444-4444-444444444444', NOW());

-- Update version column for Spring Data JDBC compatibility
-- Set version = 1 for all existing test data (indicates persisted entities)
UPDATE roles SET version = 1 WHERE version IS NULL;
UPDATE users SET version = 1 WHERE version IS NULL;
UPDATE tenants SET version = 1 WHERE version IS NULL;
UPDATE workspaces SET version = 1 WHERE version IS NULL;
UPDATE tables SET version = 1 WHERE version IS NULL;
