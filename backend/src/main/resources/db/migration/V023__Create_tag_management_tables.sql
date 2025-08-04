-- V023__Create_tag_management_tables.sql
-- Create tag management tables for expense categorization with multi-tenant support

-- Create tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Tag properties
    name VARCHAR(50) NOT NULL,
    name_normalized VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    
    -- Tag scope
    scope VARCHAR(20) NOT NULL DEFAULT 'TENANT' CHECK (scope IN ('TENANT', 'PERSONAL')),
    owner_id UUID REFERENCES users(id),
    
    -- Usage tracking
    usage_count INT NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT tags_personal_must_have_owner CHECK (
        (scope = 'PERSONAL' AND owner_id IS NOT NULL) OR scope = 'TENANT'
    ),
    UNIQUE(tenant_id, name_normalized, scope, owner_id)
);

-- Create expense_tags junction table
CREATE TABLE expense_tags (
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    PRIMARY KEY (expense_id, tag_id),
    -- Foreign key to ensure both expense and tag belong to same tenant
    FOREIGN KEY (expense_id, tenant_id) REFERENCES expenses(id, tenant_id),
    FOREIGN KEY (tag_id, tenant_id) REFERENCES tags(id, tenant_id)
);

-- Create indexes for tags table
CREATE INDEX idx_tags_tenant_scope ON tags(tenant_id, scope);
CREATE INDEX idx_tags_normalized ON tags(name_normalized);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX idx_tags_owner_id ON tags(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_tags_last_used ON tags(last_used_at DESC) WHERE last_used_at IS NOT NULL;

-- Create indexes for expense_tags table
CREATE INDEX idx_expense_tags_expense_id ON expense_tags(expense_id);
CREATE INDEX idx_expense_tags_tag_id ON expense_tags(tag_id);
CREATE INDEX idx_expense_tags_tenant_id ON expense_tags(tenant_id);

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags table
-- Policy for TENANT scope tags (accessible by all tenant users)
CREATE POLICY tenant_tags_access ON tags
    FOR ALL 
    TO authenticated_users
    USING (
        tenant_id = current_tenant_id() AND
        (scope = 'TENANT' OR (scope = 'PERSONAL' AND owner_id = current_user_id()))
    )
    WITH CHECK (
        tenant_id = current_tenant_id() AND
        (scope = 'TENANT' OR (scope = 'PERSONAL' AND owner_id = current_user_id()))
    );

-- Create RLS policies for expense_tags table
CREATE POLICY tenant_isolation_expense_tags ON expense_tags
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create trigger to automatically set tenant_id on tags insert
CREATE TRIGGER set_tenant_id_tags
    BEFORE INSERT ON tags
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create trigger to automatically set tenant_id on expense_tags insert
CREATE TRIGGER set_tenant_id_expense_tags
    BEFORE INSERT ON expense_tags
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create updated_at trigger for tags
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE tags IS 'Tags for categorizing expenses with support for tenant-wide and personal tags';
COMMENT ON COLUMN tags.name IS 'Display name of the tag';
COMMENT ON COLUMN tags.name_normalized IS 'Normalized tag name for search and uniqueness (lowercase, trimmed)';
COMMENT ON COLUMN tags.color IS 'Hex color code for tag display (e.g., #FF5733)';
COMMENT ON COLUMN tags.scope IS 'Tag visibility scope: TENANT (shared) or PERSONAL (user-specific)';
COMMENT ON COLUMN tags.owner_id IS 'User ID for personal tags, NULL for tenant-wide tags';
COMMENT ON COLUMN tags.usage_count IS 'Number of times this tag has been used';
COMMENT ON COLUMN tags.last_used_at IS 'Timestamp of last usage for sorting frequently used tags';

COMMENT ON TABLE expense_tags IS 'Many-to-many relationship between expenses and tags';
COMMENT ON COLUMN expense_tags.tenant_id IS 'Denormalized tenant_id for efficient RLS checks';

-- Create some default tags for demo tenant (development only)
-- Remove or customize for production deployment
INSERT INTO tags (
    id, tenant_id, name, name_normalized, color, scope, 
    created_by, updated_by
)
SELECT 
    gen_random_uuid(),
    'demo0000-0000-0000-0000-000000000001',
    tag_name,
    LOWER(TRIM(tag_name)),
    tag_color,
    'TENANT',
    (SELECT id FROM users WHERE email = 'admin@demo.Astarmanagement.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@demo.Astarmanagement.com' LIMIT 1)
FROM (VALUES 
    ('交通費', '#FF6B6B'),
    ('宿泊費', '#4ECDC4'),
    ('会議費', '#45B7D1'),
    ('通信費', '#96CEB4'),
    ('事務用品', '#FECA57'),
    ('書籍・資料', '#48C9B0'),
    ('郵送料', '#FD79A8'),
    ('印刷費', '#A29BFE'),
    ('顧問料', '#FD79A8'),
    ('その他', '#636E72')
) AS default_tags(tag_name, tag_color)
WHERE EXISTS (SELECT 1 FROM tenants WHERE id = 'demo0000-0000-0000-0000-000000000001');