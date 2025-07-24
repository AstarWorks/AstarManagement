-- V016__Create_enhanced_document_tags_table.sql
-- Create enhanced document tags table for advanced tag management
-- Supports color coding, usage statistics, and categorization

CREATE TABLE document_tags_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tag identification
    name VARCHAR(50) NOT NULL UNIQUE,
    display_label VARCHAR(100),
    name_ja VARCHAR(50), -- Japanese translation
    description TEXT,
    
    -- Visual properties
    color_hex VARCHAR(7) NOT NULL DEFAULT '#808080' CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    icon_name VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Usage tracking
    usage_count BIGINT NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Tag categorization
    tag_category VARCHAR(20) NOT NULL DEFAULT 'USER_DEFINED' CHECK (
        tag_category IN (
            'SYSTEM', 'USER_DEFINED', 'LEGAL_TERM', 'COURT_SPECIFIC',
            'CLIENT_RELATED', 'PRIORITY', 'STATUS', 'DOCUMENT_TYPE'
        )
    ),
    
    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Create many-to-many relationship table for documents and enhanced tags
CREATE TABLE document_tag_associations (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES document_tags_enhanced(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (document_id, tag_id)
);

-- Performance indexes for document_tags_enhanced
CREATE INDEX idx_document_tags_name ON document_tags_enhanced(name);
CREATE INDEX idx_document_tags_category ON document_tags_enhanced(tag_category);
CREATE INDEX idx_document_tags_usage ON document_tags_enhanced(usage_count DESC);
CREATE INDEX idx_document_tags_active ON document_tags_enhanced(active);
CREATE INDEX idx_document_tags_last_used ON document_tags_enhanced(last_used_at DESC)
    WHERE last_used_at IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX idx_document_tags_category_active ON document_tags_enhanced(tag_category, active)
    WHERE active = TRUE;
CREATE INDEX idx_document_tags_usage_active ON document_tags_enhanced(usage_count DESC, name)
    WHERE active = TRUE;
CREATE INDEX idx_document_tags_name_lower ON document_tags_enhanced(LOWER(name))
    WHERE active = TRUE;

-- Indexes for document_tag_associations
CREATE INDEX idx_document_tag_assoc_document ON document_tag_associations(document_id);
CREATE INDEX idx_document_tag_assoc_tag ON document_tag_associations(tag_id);
CREATE INDEX idx_document_tag_assoc_created ON document_tag_associations(created_at);

-- Create trigger for updated_at automation
CREATE TRIGGER update_document_tags_enhanced_updated_at BEFORE UPDATE ON document_tags_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically increment tag usage when associated with document
CREATE OR REPLACE FUNCTION increment_tag_usage() RETURNS trigger AS $$
BEGIN
    -- Increment usage count and update last used timestamp
    UPDATE document_tags_enhanced 
    SET usage_count = usage_count + 1,
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tag_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment usage when tag is associated with document
CREATE TRIGGER increment_tag_usage_trigger
AFTER INSERT ON document_tag_associations
FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

-- Function to decrement tag usage when association is removed
CREATE OR REPLACE FUNCTION decrement_tag_usage() RETURNS trigger AS $$
BEGIN
    -- Decrement usage count (but not below 0)
    UPDATE document_tags_enhanced 
    SET usage_count = GREATEST(usage_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.tag_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to decrement usage when tag association is removed
CREATE TRIGGER decrement_tag_usage_trigger
AFTER DELETE ON document_tag_associations
FOR EACH ROW EXECUTE FUNCTION decrement_tag_usage();

-- Add table and column comments
COMMENT ON TABLE document_tags_enhanced IS 'Enhanced tag system with usage statistics and categorization';
COMMENT ON COLUMN document_tags_enhanced.name IS 'Unique tag identifier name';
COMMENT ON COLUMN document_tags_enhanced.display_label IS 'Human-readable label for display';
COMMENT ON COLUMN document_tags_enhanced.name_ja IS 'Japanese translation of the tag name';
COMMENT ON COLUMN document_tags_enhanced.color_hex IS 'Hex color code for visual representation';
COMMENT ON COLUMN document_tags_enhanced.usage_count IS 'Number of times this tag has been used';
COMMENT ON COLUMN document_tags_enhanced.tag_category IS 'Category for organizing tags by type';
COMMENT ON COLUMN document_tags_enhanced.last_used_at IS 'Timestamp when tag was last associated with a document';

COMMENT ON TABLE document_tag_associations IS 'Many-to-many relationship between documents and enhanced tags';

-- Insert default system tags for legal document management
INSERT INTO document_tags_enhanced (name, display_label, name_ja, description, tag_category, color_hex, icon_name, sort_order, created_by, updated_by) VALUES
    -- Priority tags
    ('urgent', 'Urgent', '緊急', 'Requires immediate attention', 'PRIORITY', '#EF4444', 'AlertTriangle', 10,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('high-priority', 'High Priority', '高優先度', 'High priority document', 'PRIORITY', '#F59E0B', 'ArrowUp', 20,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('normal', 'Normal', '通常', 'Normal priority document', 'PRIORITY', '#10B981', 'Minus', 30,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    -- Status tags
    ('draft', 'Draft', '下書き', 'Document is in draft status', 'STATUS', '#6B7280', 'Edit', 40,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('review', 'Under Review', 'レビュー中', 'Document is under review', 'STATUS', '#3B82F6', 'Eye', 50,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('approved', 'Approved', '承認済み', 'Document has been approved', 'STATUS', '#10B981', 'CheckCircle', 60,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    -- Document type tags
    ('evidence', 'Evidence', '証拠', 'Evidence document for case', 'DOCUMENT_TYPE', '#8B5CF6', 'FileSearch', 70,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('correspondence', 'Correspondence', '通信', 'Communication document', 'DOCUMENT_TYPE', '#EC4899', 'Mail', 80,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('filing', 'Court Filing', '裁判所提出書類', 'Document filed with court', 'COURT_SPECIFIC', '#DC2626', 'Scale', 90,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    -- Legal term tags
    ('confidential', 'Confidential', '機密', 'Confidential document with restricted access', 'LEGAL_TERM', '#7C2D12', 'Lock', 100,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    
    ('privileged', 'Attorney-Client Privileged', '弁護士依頼者秘匿特権', 'Protected by attorney-client privilege', 'LEGAL_TERM', '#991B1B', 'Shield', 110,
     (SELECT id FROM users WHERE username = 'system' LIMIT 1), 
     (SELECT id FROM users WHERE username = 'system' LIMIT 1));