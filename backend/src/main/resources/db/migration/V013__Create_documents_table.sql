-- V013__Create_documents_table.sql
-- Create documents table for document management system
-- Supports document metadata, versioning, categorization, and full-text search

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File identification and storage
    file_id VARCHAR(255) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64), -- SHA-256 hash for integrity verification
    
    -- Document metadata
    title VARCHAR(500),
    description TEXT,
    extracted_text TEXT,
    page_count INTEGER,
    word_count INTEGER,
    
    -- Security and access
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Document status and processing
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING', 'UPLOADING', 'SCANNING', 'AVAILABLE', 
            'QUARANTINED', 'DELETED', 'FAILED'
        )
    ),
    
    -- Virus scanning
    virus_scan_result VARCHAR(255),
    virus_scan_date TIMESTAMP WITH TIME ZONE,
    
    -- Version control
    version_number INTEGER NOT NULL DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id),
    
    -- Relationships
    matter_id UUID REFERENCES matters(id),
    category_id UUID, -- Will add FK constraint after document_categories table is created in V014
    uploaded_by UUID NOT NULL REFERENCES users(id),
    
    -- Audit fields (following BaseEntity pattern)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Create document_tags table for ElementCollection mapping
CREATE TABLE document_tags (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (document_id, tag)
);

-- Performance indexes for primary access patterns
CREATE INDEX idx_documents_file_id ON documents(file_id);
CREATE INDEX idx_documents_matter_id ON documents(matter_id);
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_content_type ON documents(content_type);

-- Composite indexes for common query patterns
CREATE INDEX idx_documents_matter_status ON documents(matter_id, status) 
    WHERE status != 'DELETED';
CREATE INDEX idx_documents_parent_version ON documents(parent_document_id, version_number)
    WHERE parent_document_id IS NOT NULL;
CREATE INDEX idx_documents_active ON documents(matter_id, created_at DESC)
    WHERE status IN ('AVAILABLE', 'SCANNING', 'UPLOADING');

-- Unique constraints
CREATE UNIQUE INDEX idx_documents_file_id_unique ON documents(file_id);
CREATE INDEX idx_documents_checksum ON documents(checksum)
    WHERE checksum IS NOT NULL;

-- Tag indexes
CREATE INDEX idx_document_tags_tag ON document_tags(tag);
CREATE INDEX idx_document_tags_document ON document_tags(document_id);

-- Create trigger for updated_at automation
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add table comments for documentation
COMMENT ON TABLE documents IS 'Document metadata and file tracking for legal case management';
COMMENT ON COLUMN documents.file_id IS 'Unique identifier for storage service integration';
COMMENT ON COLUMN documents.storage_path IS 'Full path in storage system (MinIO/GCS)';
COMMENT ON COLUMN documents.checksum IS 'SHA-256 hash for file integrity verification';
COMMENT ON COLUMN documents.status IS 'Document processing lifecycle status';
COMMENT ON COLUMN documents.virus_scan_result IS 'Result of virus scanning process';
COMMENT ON COLUMN documents.version_number IS 'Document version for revision tracking';
COMMENT ON COLUMN documents.parent_document_id IS 'Reference to original document for versioning';

COMMENT ON TABLE document_tags IS 'Document tagging system for categorization and search';