-- V004__Create_tenants_table.sql
-- Create tenants table for multi-tenancy support with Auth0 Organizations integration

-- Clean up existing orphaned tenant_id references
UPDATE users SET tenant_id = NULL WHERE tenant_id IS NOT NULL;

-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    auth0_org_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_auth0_org_id ON tenants(auth0_org_id);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to users table
ALTER TABLE users 
    ADD CONSTRAINT fk_users_tenant_id 
    FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) 
    ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON TABLE tenants IS 'Tenant organizations for multi-tenancy';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN tenants.name IS 'Display name of the organization';
COMMENT ON COLUMN tenants.auth0_org_id IS 'Auth0 Organizations ID for SSO integration';
COMMENT ON COLUMN tenants.is_active IS 'Whether the tenant is active';