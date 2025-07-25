-- V021__Enhanced_document_management.sql
-- Create enhanced document management system with version control, permissions, and metadata
-- Extends existing documents table with comprehensive document lifecycle management

-- Enhance existing documents table with missing columns for comprehensive document management
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS checksum VARCHAR(64), -- SHA-256 for file integrity
ADD COLUMN IF NOT EXISTS encryption_status VARCHAR(20) DEFAULT 'none' CHECK (
    encryption_status IN ('none', 'client_side', 'server_side', 'both')
),
ADD COLUMN IF NOT EXISTS confidentiality_level VARCHAR(20) DEFAULT 'internal' CHECK (
    confidentiality_level IN ('public', 'internal', 'confidential', 'attorney_client_privileged')
),
ADD COLUMN IF NOT EXISTS retention_policy VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_accessed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending' CHECK (
    processing_status IN ('pending', 'processing', 'completed', 'failed', 'quarantined')
),
ADD COLUMN IF NOT EXISTS virus_scan_status VARCHAR(20) DEFAULT 'pending' CHECK (
    virus_scan_status IN ('pending', 'scanning', 'clean', 'infected', 'quarantined')
),
ADD COLUMN IF NOT EXISTS virus_scan_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR(1000),
ADD COLUMN IF NOT EXISTS preview_path VARCHAR(1000);

-- Create document_versions table for detailed version control
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Version information
    version_number INTEGER NOT NULL,
    version_label VARCHAR(100), -- e.g., "Draft", "Final", "Approved"
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- File information (snapshot at this version)
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(200) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    
    -- Version metadata
    change_summary TEXT,
    version_notes TEXT,
    
    -- Processing results for this version
    ocr_content TEXT,
    ocr_confidence DECIMAL(5,2),
    extracted_metadata JSONB DEFAULT '{}',
    
    -- Security
    encryption_key_id VARCHAR(255), -- Reference to encryption key
    virus_scan_result JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_document_versions_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_versions_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_versions_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uk_document_version_number UNIQUE (document_id, version_number)
);

-- Create document_permissions table for granular access control
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Permission target
    user_id UUID,
    role_id UUID,
    permission_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (
        permission_type IN ('user', 'role', 'public')
    ),
    
    -- Permission levels
    can_view BOOLEAN NOT NULL DEFAULT FALSE,
    can_download BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    can_share BOOLEAN NOT NULL DEFAULT FALSE,
    can_comment BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Access restrictions
    ip_restrictions TEXT[], -- Array of allowed IP addresses/ranges
    time_restrictions JSONB, -- Time-based access rules
    device_restrictions TEXT[], -- Allowed device types
    
    -- Permission metadata
    granted_by UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    permission_reason VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_document_permissions_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_permissions_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_permissions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id),
    CONSTRAINT chk_permission_target CHECK (
        (permission_type = 'user' AND user_id IS NOT NULL AND role_id IS NULL) OR
        (permission_type = 'role' AND role_id IS NOT NULL AND user_id IS NULL) OR
        (permission_type = 'public' AND user_id IS NULL AND role_id IS NULL)
    )
);

-- Create document_tags table for flexible tagging system
CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Tag information
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#808080', -- Hex color code
    description VARCHAR(500),
    
    -- Tag categorization
    category VARCHAR(100), -- e.g., "case_type", "document_type", "priority"
    is_system_tag BOOLEAN DEFAULT FALSE, -- System-defined vs user-defined
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_document_tags_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_tags_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uk_document_tag_name_tenant UNIQUE (tenant_id, name),
    CONSTRAINT chk_color_hex_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create document_tag_assignments junction table
CREATE TABLE document_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Assignment metadata
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_document_tag_assignments_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_tag_assignments_tag_id FOREIGN KEY (tag_id) REFERENCES document_tags(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_tag_assignments_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_tag_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id),
    CONSTRAINT uk_document_tag_assignment UNIQUE (document_id, tag_id)
);

-- Create document_folders table for hierarchical organization
CREATE TABLE document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Folder hierarchy
    name VARCHAR(255) NOT NULL,
    parent_folder_id UUID REFERENCES document_folders(id),
    path VARCHAR(1000), -- Computed path like "/parent/child/grandchild"
    level INTEGER DEFAULT 0, -- Depth level for efficient querying
    
    -- Folder metadata
    description TEXT,
    folder_type VARCHAR(50) DEFAULT 'general' CHECK (
        folder_type IN ('general', 'case_specific', 'template', 'archive', 'shared')
    ),
    
    -- Permissions (inherited by documents)
    default_permissions JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Associated case (if case_specific)
    case_id UUID REFERENCES matters(id),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_document_folders_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_folders_case_id FOREIGN KEY (case_id) REFERENCES matters(id) ON DELETE SET NULL,
    CONSTRAINT fk_document_folders_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_document_folders_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT uk_folder_name_parent UNIQUE (tenant_id, name, parent_folder_id)
);

-- Add folder_id to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES document_folders(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_version ON documents(version);
CREATE INDEX IF NOT EXISTS idx_documents_is_latest_version ON documents(is_latest_version) WHERE is_latest_version = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_confidentiality_level ON documents(confidentiality_level);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_virus_scan_status ON documents(virus_scan_status);
CREATE INDEX IF NOT EXISTS idx_documents_last_accessed_at ON documents(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_tenant_id ON document_versions(tenant_id);
CREATE INDEX idx_document_versions_version_number ON document_versions(version_number);
CREATE INDEX idx_document_versions_is_current ON document_versions(is_current) WHERE is_current = TRUE;

CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_tenant_id ON document_permissions(tenant_id);
CREATE INDEX idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX idx_document_permissions_role_id ON document_permissions(role_id);
CREATE INDEX idx_document_permissions_is_active ON document_permissions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_document_permissions_expires_at ON document_permissions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_document_tags_tenant_id ON document_tags(tenant_id);
CREATE INDEX idx_document_tags_name ON document_tags(name);
CREATE INDEX idx_document_tags_category ON document_tags(category);
CREATE INDEX idx_document_tags_usage_count ON document_tags(usage_count);

CREATE INDEX idx_document_tag_assignments_document_id ON document_tag_assignments(document_id);
CREATE INDEX idx_document_tag_assignments_tag_id ON document_tag_assignments(tag_id);
CREATE INDEX idx_document_tag_assignments_tenant_id ON document_tag_assignments(tenant_id);

CREATE INDEX idx_document_folders_tenant_id ON document_folders(tenant_id);
CREATE INDEX idx_document_folders_parent_folder_id ON document_folders(parent_folder_id);
CREATE INDEX idx_document_folders_case_id ON document_folders(case_id);
CREATE INDEX idx_document_folders_folder_type ON document_folders(folder_type);
CREATE INDEX idx_document_folders_path ON document_folders(path);
CREATE INDEX idx_document_folders_level ON document_folders(level);

-- Enable Row Level Security for new tables
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_document_versions ON document_versions
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_document_permissions ON document_permissions
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_document_tags ON document_tags
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_document_tag_assignments ON document_tag_assignments
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_document_folders ON document_folders
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create triggers for tenant_id auto-population
CREATE TRIGGER set_tenant_id_document_versions
    BEFORE INSERT ON document_versions
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_document_permissions
    BEFORE INSERT ON document_permissions
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_document_tags
    BEFORE INSERT ON document_tags
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_document_tag_assignments
    BEFORE INSERT ON document_tag_assignments
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_document_folders
    BEFORE INSERT ON document_folders
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create updated_at triggers
CREATE TRIGGER update_document_permissions_updated_at BEFORE UPDATE ON document_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_tags_updated_at BEFORE UPDATE ON document_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_folders_updated_at BEFORE UPDATE ON document_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update folder path automatically
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate the path and level based on parent folder
    IF NEW.parent_folder_id IS NULL THEN
        NEW.path := '/' || NEW.name;
        NEW.level := 0;
    ELSE
        SELECT 
            path || '/' || NEW.name,
            level + 1
        INTO NEW.path, NEW.level
        FROM document_folders 
        WHERE id = NEW.parent_folder_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folder_path_trigger
    BEFORE INSERT OR UPDATE ON document_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_path();

-- Create function to track document access
CREATE OR REPLACE FUNCTION track_document_access(doc_id UUID, accessing_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE documents 
    SET 
        access_count = access_count + 1,
        last_accessed_at = CURRENT_TIMESTAMP,
        last_accessed_by = accessing_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = doc_id;
    
    -- Log the access for audit purposes
    PERFORM log_audit_event(
        'DOCUMENT_ACCESS',
        'DOCUMENT',
        doc_id,
        accessing_user_id,
        json_build_object('access_timestamp', CURRENT_TIMESTAMP),
        NULL, NULL, NULL, NULL, NULL, 'GET', NULL, NULL,
        'confidential', 'data_access', 'info'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to create new document version
CREATE OR REPLACE FUNCTION create_document_version(
    p_document_id UUID,
    p_version_label VARCHAR(100),
    p_filename VARCHAR(500),
    p_file_path VARCHAR(1000),
    p_file_size BIGINT,
    p_mime_type VARCHAR(200),
    p_checksum VARCHAR(64),
    p_change_summary TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_version_number INTEGER;
    version_id UUID;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO new_version_number
    FROM document_versions 
    WHERE document_id = p_document_id;
    
    -- Mark all existing versions as not current
    UPDATE document_versions 
    SET is_current = FALSE
    WHERE document_id = p_document_id;
    
    -- Create new version
    INSERT INTO document_versions (
        document_id, version_number, version_label, is_current,
        filename, file_path, file_size, mime_type, checksum,
        change_summary, created_by
    ) VALUES (
        p_document_id, new_version_number, p_version_label, TRUE,
        p_filename, p_file_path, p_file_size, p_mime_type, p_checksum,
        p_change_summary, p_created_by
    ) RETURNING id INTO version_id;
    
    -- Update main document record
    UPDATE documents 
    SET 
        version = new_version_number,
        filename = p_filename,
        file_path = p_file_path,
        file_size = p_file_size,
        mime_type = p_mime_type,
        checksum = p_checksum,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = p_created_by
    WHERE id = p_document_id;
    
    RETURN version_id;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive document view with all related data
CREATE VIEW document_details AS
SELECT 
    d.id,
    d.filename,
    d.original_filename,
    d.file_path,
    d.file_size,
    d.mime_type,
    d.document_type,
    d.version,
    d.is_latest_version,
    d.confidentiality_level,
    d.processing_status,
    d.virus_scan_status,
    d.access_count,
    d.last_accessed_at,
    d.tenant_id,
    d.matter_id,
    
    -- Case information
    m.case_number,
    m.title as case_title,
    
    -- Folder information
    df.name as folder_name,
    df.path as folder_path,
    
    -- Creator information
    u_created.first_name || ' ' || u_created.last_name as created_by_name,
    u_updated.first_name || ' ' || u_updated.last_name as updated_by_name,
    
    -- Tags
    ARRAY_AGG(DISTINCT dt.name) FILTER (WHERE dt.name IS NOT NULL) as tags,
    
    -- Version information
    dv.version_label,
    dv.change_summary,
    
    d.created_at,
    d.updated_at
FROM documents d
LEFT JOIN matters m ON d.matter_id = m.id
LEFT JOIN document_folders df ON d.folder_id = df.id
LEFT JOIN users u_created ON d.created_by = u_created.id
LEFT JOIN users u_updated ON d.updated_by = u_updated.id
LEFT JOIN document_tag_assignments dta ON d.id = dta.document_id
LEFT JOIN document_tags dt ON dta.tag_id = dt.id
LEFT JOIN document_versions dv ON d.id = dv.document_id AND dv.is_current = TRUE
GROUP BY 
    d.id, d.filename, d.original_filename, d.file_path, d.file_size,
    d.mime_type, d.document_type, d.version, d.is_latest_version,
    d.confidentiality_level, d.processing_status, d.virus_scan_status,
    d.access_count, d.last_accessed_at, d.tenant_id, d.matter_id,
    m.case_number, m.title, df.name, df.path,
    u_created.first_name, u_created.last_name,
    u_updated.first_name, u_updated.last_name,
    dv.version_label, dv.change_summary,
    d.created_at, d.updated_at;

-- Insert default system tags
INSERT INTO document_tags (tenant_id, name, color, description, category, is_system_tag, created_by)
SELECT 
    'demo0000-0000-0000-0000-000000000001',
    tag_name,
    tag_color,
    tag_description,
    tag_category,
    TRUE,
    (SELECT id FROM users WHERE tenant_id = 'demo0000-0000-0000-0000-000000000001' LIMIT 1)
FROM (VALUES
    ('Contract', '#3B82F6', 'Legal contracts and agreements', 'document_type'),
    ('Evidence', '#EF4444', 'Evidence and supporting materials', 'document_type'),
    ('Correspondence', '#10B981', 'Client and court correspondence', 'document_type'),
    ('Draft', '#F59E0B', 'Draft documents', 'status'),
    ('Final', '#059669', 'Finalized documents', 'status'),
    ('Confidential', '#DC2626', 'Confidential attorney-client privileged documents', 'classification'),
    ('Public', '#6B7280', 'Public documents', 'classification'),
    ('High Priority', '#EF4444', 'High priority documents requiring immediate attention', 'priority'),
    ('Template', '#8B5CF6', 'Document templates', 'type')
) AS default_tags (tag_name, tag_color, tag_description, tag_category)
WHERE EXISTS (SELECT 1 FROM tenants WHERE id = 'demo0000-0000-0000-0000-000000000001');

-- Add table comments
COMMENT ON TABLE document_versions IS 'Version control system for document revisions with full audit trail';
COMMENT ON TABLE document_permissions IS 'Granular access control for documents with role and user-based permissions';
COMMENT ON TABLE document_tags IS 'Flexible tagging system for document categorization and search';
COMMENT ON TABLE document_folders IS 'Hierarchical folder structure for document organization';

COMMENT ON FUNCTION track_document_access(UUID, UUID) IS 'Records document access for audit and usage analytics';
COMMENT ON FUNCTION create_document_version IS 'Creates a new version of a document with proper version management';
COMMENT ON VIEW document_details IS 'Comprehensive view of documents with all related metadata and relationships';