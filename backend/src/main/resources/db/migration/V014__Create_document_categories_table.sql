-- V014__Create_document_categories_table.sql
-- Create document categories table for hierarchical document organization
-- Supports self-referencing structure for nested categories

CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Category identification
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_ja VARCHAR(100), -- Japanese translation
    description TEXT,
    
    -- Hierarchical structure
    parent_category_id UUID REFERENCES document_categories(id),
    
    -- Display properties
    sort_order INTEGER NOT NULL DEFAULT 0,
    color_hex VARCHAR(7) DEFAULT '#808080',
    icon_name VARCHAR(50),
    
    -- Category metadata
    category_type VARCHAR(20) NOT NULL DEFAULT 'USER_DEFINED' CHECK (
        category_type IN ('SYSTEM', 'USER_DEFINED', 'LEGAL_SPECIFIC', 'TEMPLATE')
    ),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Performance indexes for primary access patterns
CREATE INDEX idx_document_categories_parent ON document_categories(parent_category_id);
CREATE INDEX idx_document_categories_name ON document_categories(name);
CREATE INDEX idx_document_categories_code ON document_categories(code);
CREATE INDEX idx_document_categories_active ON document_categories(active);

-- Composite indexes for common query patterns
CREATE INDEX idx_document_categories_parent_active ON document_categories(parent_category_id, active)
    WHERE active = TRUE;
CREATE INDEX idx_document_categories_type_active ON document_categories(category_type, active)
    WHERE active = TRUE;
CREATE INDEX idx_document_categories_sort_name ON document_categories(sort_order, name)
    WHERE active = TRUE;

-- Unique constraint for active categories
CREATE UNIQUE INDEX idx_document_categories_code_unique ON document_categories(code);

-- Create trigger for updated_at automation
CREATE TRIGGER update_document_categories_updated_at BEFORE UPDATE ON document_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add table and column comments
COMMENT ON TABLE document_categories IS 'Hierarchical categorization system for legal documents';
COMMENT ON COLUMN document_categories.code IS 'Unique identifier code for the category';
COMMENT ON COLUMN document_categories.name IS 'Display name of the category';
COMMENT ON COLUMN document_categories.name_ja IS 'Japanese translation of the category name';
COMMENT ON COLUMN document_categories.parent_category_id IS 'Self-reference for hierarchical structure';
COMMENT ON COLUMN document_categories.category_type IS 'Type of category (system, user-defined, etc.)';
COMMENT ON COLUMN document_categories.sort_order IS 'Display order within the same level';
COMMENT ON COLUMN document_categories.color_hex IS 'Color code for visual representation in UI';
COMMENT ON COLUMN document_categories.active IS 'Whether category is active and should be displayed';

-- Insert default legal document categories
INSERT INTO document_categories (code, name, name_ja, description, category_type, sort_order, color_hex, icon_name, created_by, updated_by) VALUES
    -- Root categories
    ('CIVIL_LITIGATION', 'Civil Litigation', '民事訴訟', 'Civil court proceedings and related documents', 'SYSTEM', 10, '#3B82F6', 'Scale', 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('CORPORATE_LAW', 'Corporate Law', '企業法務', 'Corporate legal matters and business documents', 'SYSTEM', 20, '#10B981', 'Building', 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('REAL_ESTATE', 'Real Estate', '不動産', 'Property and real estate related documents', 'SYSTEM', 30, '#F59E0B', 'Home', 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('FAMILY_LAW', 'Family Law', '家族法', 'Family and domestic relations legal documents', 'SYSTEM', 40, '#EF4444', 'Users', 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('CONTRACTS', 'Contracts', '契約書', 'Legal agreements and contract documents', 'SYSTEM', 50, '#8B5CF6', 'FileText', 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('CORRESPONDENCE', 'Correspondence', '通信文書', 'Letters, emails, and communication documents', 'SYSTEM', 60, '#6B7280', 'Mail', 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('ADMINISTRATIVE', 'Administrative', '管理文書', 'Administrative and procedural documents', 'SYSTEM', 70, '#14B8A6', 'Settings', 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1));

-- Insert subcategories for Civil Litigation
INSERT INTO document_categories (code, name, name_ja, description, category_type, sort_order, color_hex, parent_category_id, created_by, updated_by) VALUES
    ('PLEADINGS', 'Pleadings', '訴答書面', 'Complaints, answers, and motion documents', 'SYSTEM', 10, '#3B82F6',
     (SELECT id FROM document_categories WHERE code = 'CIVIL_LITIGATION'),
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('DISCOVERY', 'Discovery', '証拠開示', 'Discovery requests, responses, and evidence', 'SYSTEM', 20, '#3B82F6',
     (SELECT id FROM document_categories WHERE code = 'CIVIL_LITIGATION'),
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('SETTLEMENT', 'Settlement', '和解', 'Settlement agreements and related documents', 'SYSTEM', 30, '#3B82F6',
     (SELECT id FROM document_categories WHERE code = 'CIVIL_LITIGATION'),
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1));

-- Insert subcategories for Corporate Law
INSERT INTO document_categories (code, name, name_ja, description, category_type, sort_order, color_hex, parent_category_id, created_by, updated_by) VALUES
    ('BYLAWS', 'Bylaws', '定款', 'Corporate bylaws and governance documents', 'SYSTEM', 10, '#10B981',
     (SELECT id FROM document_categories WHERE code = 'CORPORATE_LAW'),
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('MINUTES', 'Meeting Minutes', '議事録', 'Board meeting and shareholder meeting minutes', 'SYSTEM', 20, '#10B981',
     (SELECT id FROM document_categories WHERE code = 'CORPORATE_LAW'),
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('COMPLIANCE', 'Compliance', '法令遵守', 'Regulatory compliance and filing documents', 'SYSTEM', 30, '#10B981',
     (SELECT id FROM document_categories WHERE code = 'CORPORATE_LAW'),
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1));

-- Add foreign key constraint for documents.category_id now that the table exists
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_category_id 
FOREIGN KEY (category_id) REFERENCES document_categories(id);