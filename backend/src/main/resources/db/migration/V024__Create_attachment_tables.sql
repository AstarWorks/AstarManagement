-- V024__Create_attachment_tables.sql
-- Create attachment management tables for expense receipts and documents with tenant isolation
-- Supports file metadata tracking, temporary uploads, and many-to-many relationships with expenses

-- Create attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- File identification and metadata
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    
    -- Attachment lifecycle and status
    status VARCHAR(20) NOT NULL DEFAULT 'TEMPORARY' CHECK (
        status IN ('TEMPORARY', 'LINKED', 'DELETED', 'FAILED')
    ),
    linked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Optional thumbnail support
    thumbnail_path TEXT,
    thumbnail_size BIGINT,
    
    -- Audit fields
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT chk_linked_at_for_linked_status CHECK (
        (status = 'LINKED' AND linked_at IS NOT NULL) OR status != 'LINKED'
    ),
    CONSTRAINT chk_deleted_fields_consistency CHECK (
        (status = 'DELETED' AND deleted_at IS NOT NULL AND deleted_by IS NOT NULL) OR
        status != 'DELETED'
    ),
    CONSTRAINT chk_thumbnail_size_with_path CHECK (
        (thumbnail_path IS NOT NULL AND thumbnail_size > 0) OR
        (thumbnail_path IS NULL AND thumbnail_size IS NULL)
    )
);

-- Create expense_attachments junction table
CREATE TABLE expense_attachments (
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Junction metadata
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    linked_by UUID NOT NULL REFERENCES users(id),
    display_order INTEGER NOT NULL DEFAULT 0,
    description VARCHAR(255),
    
    PRIMARY KEY (expense_id, attachment_id)
);

-- Create indexes for attachments table (matching JPA entity annotations)
CREATE INDEX idx_attachments_status ON attachments(status, expires_at);
CREATE INDEX idx_attachments_tenant ON attachments(tenant_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
-- Additional performance indexes
CREATE INDEX idx_attachments_linked_at ON attachments(linked_at) 
    WHERE linked_at IS NOT NULL;
CREATE INDEX idx_attachments_uploaded_at ON attachments(uploaded_at);
CREATE INDEX idx_attachments_temp_expires ON attachments(status, expires_at) 
    WHERE status = 'TEMPORARY' AND expires_at IS NOT NULL;

-- Create indexes for expense_attachments table (matching JPA entity annotations)
CREATE INDEX idx_expense_attachments_expense ON expense_attachments(expense_id);
CREATE INDEX idx_expense_attachments_attachment ON expense_attachments(attachment_id);
CREATE INDEX idx_expense_attachments_linked_at ON expense_attachments(linked_at);
-- Additional performance indexes
CREATE INDEX idx_expense_attachments_tenant_id ON expense_attachments(tenant_id);
CREATE INDEX idx_expense_attachments_linked_by ON expense_attachments(linked_by);
CREATE INDEX idx_expense_attachments_display_order ON expense_attachments(expense_id, display_order);

-- Enable Row Level Security
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attachments table
-- Main tenant isolation policy (simplified, owner access functionality removed for now)
CREATE POLICY tenant_isolation_attachments ON attachments
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create RLS policies for expense_attachments table
CREATE POLICY tenant_isolation_expense_attachments ON expense_attachments
    FOR ALL 
    TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create trigger to automatically set tenant_id on attachments insert
CREATE TRIGGER set_tenant_id_attachments
    BEFORE INSERT ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create trigger to automatically set tenant_id on expense_attachments insert
CREATE TRIGGER set_tenant_id_expense_attachments
    BEFORE INSERT ON expense_attachments
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Add table comments for documentation
COMMENT ON TABLE attachments IS 'File attachment metadata for expenses with tenant isolation and lifecycle management';
COMMENT ON COLUMN attachments.file_name IS 'Current filename in storage system';
COMMENT ON COLUMN attachments.original_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN attachments.mime_type IS 'MIME type of the file (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN attachments.storage_path IS 'Relative path within storage system (MinIO/local filesystem)';
COMMENT ON COLUMN attachments.status IS 'Attachment lifecycle status: TEMPORARY (just uploaded), LINKED (attached to expense), DELETED (marked for removal), FAILED (upload/processing error)';
COMMENT ON COLUMN attachments.linked_at IS 'Timestamp when attachment was first linked to an expense';
COMMENT ON COLUMN attachments.expires_at IS 'Expiration timestamp for temporary files (automatic cleanup)';
COMMENT ON COLUMN attachments.thumbnail_path IS 'Optional path to generated thumbnail image';
COMMENT ON COLUMN attachments.thumbnail_size IS 'Thumbnail file size in bytes';
COMMENT ON COLUMN attachments.uploaded_by IS 'User who uploaded the attachment';
COMMENT ON COLUMN attachments.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN attachments.deleted_by IS 'User who deleted the attachment';

COMMENT ON TABLE expense_attachments IS 'Many-to-many relationship between expenses and attachments';
COMMENT ON COLUMN expense_attachments.tenant_id IS 'Denormalized tenant_id for efficient RLS checks';
COMMENT ON COLUMN expense_attachments.linked_at IS 'Timestamp when attachment was linked to this expense';
COMMENT ON COLUMN expense_attachments.linked_by IS 'User who linked the attachment to the expense';
COMMENT ON COLUMN expense_attachments.display_order IS 'Display order for UI sorting (0-based)';
COMMENT ON COLUMN expense_attachments.description IS 'Optional description or caption for the attachment';