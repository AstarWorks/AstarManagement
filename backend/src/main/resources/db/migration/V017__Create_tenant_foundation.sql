-- V017__Create_tenant_foundation.sql
-- Create multi-tenant foundation with Row Level Security (RLS)
-- Implements comprehensive tenant isolation for legal practice management

-- Create tenants table (this must exist before other tables can reference it)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    
    -- Legal practice specific settings
    law_firm_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100), -- Bar association registration
    jurisdiction VARCHAR(255), -- Operating jurisdiction
    primary_contact_email VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(50),
    business_address JSONB, -- Structured address data
    
    -- Billing and subscription
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (
        subscription_status IN ('active', 'suspended', 'cancelled', 'trial')
    ),
    subscription_plan VARCHAR(50) DEFAULT 'basic' CHECK (
        subscription_plan IN ('basic', 'professional', 'enterprise')
    ),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    billing_email VARCHAR(255),
    
    -- Legal compliance
    data_retention_policy JSONB DEFAULT '{"case_data": "10_years", "audit_logs": "7_years"}',
    compliance_settings JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for tenants
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain) WHERE is_active = TRUE;
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX idx_tenants_subscription_plan ON tenants(subscription_plan);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- Create updated_at trigger for tenants
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add tenant_id to existing tables that need multi-tenancy
-- This is a critical migration that adds tenant isolation to all business data

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN tenant_id UUID;

-- Add tenant_id to matters table  
ALTER TABLE matters ADD COLUMN tenant_id UUID;

-- Add tenant_id to documents table
ALTER TABLE documents ADD COLUMN tenant_id UUID;

-- Add tenant_id to memos table
ALTER TABLE memos ADD COLUMN tenant_id UUID;

-- Add tenant_id to expenses table
ALTER TABLE expenses ADD COLUMN tenant_id UUID;

-- Add tenant_id to roles table (roles can be tenant-specific)
ALTER TABLE roles ADD COLUMN tenant_id UUID;

-- Add tenant_id to user_roles table
ALTER TABLE user_roles ADD COLUMN tenant_id UUID;

-- Create foreign key constraints to tenants table
ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE matters ADD CONSTRAINT fk_matters_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE memos ADD CONSTRAINT fk_memos_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE roles ADD CONSTRAINT fk_roles_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

-- Add indexes for tenant_id on all tables for RLS performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_matters_tenant_id ON matters(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_memos_tenant_id ON memos(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_expenses_tenant_id ON expenses(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_roles_tenant_id ON roles(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id) WHERE tenant_id IS NOT NULL;

-- Create function to get current tenant ID from application context
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    -- Get tenant_id from session variable set by application
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        NULL
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to set current tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID) RETURNS VOID AS $$
BEGIN
    -- Verify tenant exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM tenants 
        WHERE id = tenant_uuid AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid or inactive tenant: %', tenant_uuid;
    END IF;
    
    -- Set the tenant context for the session
    PERFORM set_config('app.current_tenant_id', tenant_uuid::TEXT, true);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation

-- Users table RLS policy
CREATE POLICY tenant_isolation_users ON users
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Matters table RLS policy
CREATE POLICY tenant_isolation_matters ON matters
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Documents table RLS policy
CREATE POLICY tenant_isolation_documents ON documents
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Memos table RLS policy
CREATE POLICY tenant_isolation_memos ON memos
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Expenses table RLS policy
CREATE POLICY tenant_isolation_expenses ON expenses
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Roles table RLS policy (roles can be global or tenant-specific)
CREATE POLICY tenant_isolation_roles ON roles
    FOR ALL 
    TO authenticated_users
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- User_roles table RLS policy
CREATE POLICY tenant_isolation_user_roles ON user_roles
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create application database user role for RLS
CREATE ROLE authenticated_users;

-- Grant necessary permissions to authenticated_users role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated_users;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated_users;

-- Create function to automatically set tenant_id on INSERT
CREATE OR REPLACE FUNCTION set_tenant_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate tenant_id if not provided
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := current_tenant_id();
    END IF;
    
    -- Verify the tenant_id matches current context (security check)
    IF NEW.tenant_id != current_tenant_id() THEN
        RAISE EXCEPTION 'Attempted to insert data with tenant_id % but current context is %', 
            NEW.tenant_id, current_tenant_id();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set tenant_id on all tenant-scoped tables
CREATE TRIGGER set_tenant_id_users
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_matters
    BEFORE INSERT ON matters
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_documents
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_memos
    BEFORE INSERT ON memos
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_expenses
    BEFORE INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_roles
    BEFORE INSERT ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_user_roles
    BEFORE INSERT ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create a view to help with tenant administration
CREATE VIEW tenant_statistics AS
SELECT 
    t.id,
    t.name,
    t.subdomain,
    t.subscription_plan,
    t.subscription_status,
    t.is_active,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT m.id) as matter_count,
    COUNT(DISTINCT d.id) as document_count,
    t.created_at,
    t.updated_at
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
LEFT JOIN matters m ON t.id = m.tenant_id
LEFT JOIN documents d ON t.id = d.tenant_id
GROUP BY t.id, t.name, t.subdomain, t.subscription_plan, t.subscription_status, t.is_active, t.created_at, t.updated_at;

-- Add table comments
COMMENT ON TABLE tenants IS 'Multi-tenant organization table for law firm isolation';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain for tenant access (e.g., lawfirm.Astarmanagement.com)';
COMMENT ON COLUMN tenants.settings IS 'JSON configuration settings for tenant customization';
COMMENT ON COLUMN tenants.law_firm_name IS 'Official legal name of the law firm';
COMMENT ON COLUMN tenants.registration_number IS 'Bar association or legal practice registration number';
COMMENT ON COLUMN tenants.data_retention_policy IS 'JSON policy defining data retention periods for compliance';

COMMENT ON FUNCTION current_tenant_id() IS 'Returns the current tenant ID from application session context';
COMMENT ON FUNCTION set_tenant_context(UUID) IS 'Sets the tenant context for Row Level Security enforcement';
COMMENT ON VIEW tenant_statistics IS 'Administrative view showing tenant usage statistics';

-- Create initial demo tenant for development (remove in production)
INSERT INTO tenants (
    id,
    name, 
    subdomain, 
    law_firm_name,
    primary_contact_email,
    subscription_plan,
    subscription_status
) VALUES (
    'demo0000-0000-0000-0000-000000000001',
    'Demo Law Firm',
    'demo',
    '田中法律事務所',
    'admin@demo.Astarmanagement.com',
    'professional',
    'active'
);

-- Update existing data to belong to demo tenant (development only)
-- In production, this would need careful data migration planning
UPDATE users SET tenant_id = 'demo0000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE matters SET tenant_id = 'demo0000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE documents SET tenant_id = 'demo0000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE memos SET tenant_id = 'demo0000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE expenses SET tenant_id = 'demo0000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE roles SET tenant_id = 'demo0000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL AND is_system_role = false;
UPDATE user_roles SET tenant_id = 'demo0000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after populating existing data
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE matters ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE memos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_roles ALTER COLUMN tenant_id SET NOT NULL;
-- Note: roles.tenant_id can be NULL for system roles