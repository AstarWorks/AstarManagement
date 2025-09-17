-- V026__Create_editor_documents.sql
-- ========================================
-- Editor document service schema (plaintext milestone)
-- Provides folder/document tree, revisions, and metadata tables
-- Encryption columns included as placeholders (unused until M2)
-- ========================================

-- Document nodes represent both folders and documents.
CREATE TABLE IF NOT EXISTS document_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES document_nodes(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    materialized_path TEXT NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    position DOUBLE PRECISION NOT NULL DEFAULT 65536,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_document_nodes_type CHECK (type IN ('FOLDER', 'DOCUMENT')),
    CONSTRAINT chk_document_nodes_title_not_blank CHECK (btrim(title) <> ''),
    CONSTRAINT chk_document_nodes_slug_not_blank CHECK (btrim(slug) <> ''),
    CONSTRAINT chk_document_nodes_path_not_blank CHECK (btrim(materialized_path) <> ''),
    CONSTRAINT chk_document_nodes_path_format CHECK (materialized_path ~ '^(/[a-zA-Z0-9_-]+)+$'),
    CONSTRAINT chk_document_nodes_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

COMMENT ON TABLE document_nodes IS 'Editor document tree nodes (folders + documents).';
COMMENT ON COLUMN document_nodes.type IS 'Node type: FOLDER or DOCUMENT';
COMMENT ON COLUMN document_nodes.slug IS 'URL-friendly identifier unique per parent within a workspace';
COMMENT ON COLUMN document_nodes.materialized_path IS 'Absolute path from root ("/root/child" format).';
COMMENT ON COLUMN document_nodes.position IS 'Ordering hint for siblings (double precision to allow gaps).';
COMMENT ON COLUMN document_nodes.is_archived IS 'Soft-delete flag; archived nodes excluded from default queries.';

-- Ensure unique slug per parent & path uniqueness per workspace/tenant.
CREATE UNIQUE INDEX IF NOT EXISTS uk_document_nodes_slug_per_parent
    ON document_nodes(tenant_id, workspace_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::UUID), slug);
CREATE UNIQUE INDEX IF NOT EXISTS uk_document_nodes_path
    ON document_nodes(tenant_id, workspace_id, materialized_path);
CREATE INDEX IF NOT EXISTS idx_document_nodes_parent
    ON document_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_document_nodes_workspace
    ON document_nodes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_nodes_tenant_archived
    ON document_nodes(tenant_id, is_archived) WHERE is_archived = FALSE;

-- Auto-manage updated_at timestamp.
DROP TRIGGER IF EXISTS document_nodes_updated_at ON document_nodes;
CREATE TRIGGER document_nodes_updated_at
    BEFORE UPDATE ON document_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Document revisions store plaintext content for now along with future encryption metadata columns.
CREATE TABLE IF NOT EXISTS document_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES document_nodes(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    title_snapshot VARCHAR(255) NOT NULL,
    author_id UUID NOT NULL,
    summary TEXT,
    content_plaintext TEXT,
    content_type VARCHAR(100) NOT NULL DEFAULT 'text/markdown',
    size_bytes BIGINT,
    checksum VARCHAR(128),
    ciphertext BYTEA,
    dek_ciphertext BYTEA,
    nonce BYTEA,
    compression VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_document_revisions_revision_positive CHECK (revision_number > 0)
);

COMMENT ON TABLE document_revisions IS 'Versioned document payload snapshots (plaintext in M1, encryption columns reserved for M2).';
COMMENT ON COLUMN document_revisions.title_snapshot IS 'Document title at the time of the revision (immutable snapshot).';
COMMENT ON COLUMN document_revisions.content_plaintext IS 'Plaintext Markdown/JSON body; will be replaced by encrypted payload in M2.';
COMMENT ON COLUMN document_revisions.ciphertext IS 'Encrypted payload placeholder (null until encryption milestone).';
COMMENT ON COLUMN document_revisions.dek_ciphertext IS 'Encrypted data encryption key (placeholder).';
COMMENT ON COLUMN document_revisions.nonce IS 'AES-GCM nonce placeholder.';

CREATE UNIQUE INDEX IF NOT EXISTS uk_document_revisions_document_number
    ON document_revisions(document_id, revision_number);
CREATE INDEX IF NOT EXISTS idx_document_revisions_document_created
    ON document_revisions(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_revisions_tenant
    ON document_revisions(tenant_id, workspace_id);

-- Document metadata stores denormalized properties & tags for quick lookup.
CREATE TABLE IF NOT EXISTS document_metadata (
    document_id UUID PRIMARY KEY REFERENCES document_nodes(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_favorited BOOLEAN NOT NULL DEFAULT FALSE,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    last_indexed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

COMMENT ON TABLE document_metadata IS 'Supplemental metadata (tags, flags, denormalized properties) for document nodes.';
COMMENT ON COLUMN document_metadata.metadata IS 'Arbitrary JSON payload for per-document settings (plaintext).';
COMMENT ON COLUMN document_metadata.tags IS 'Tag labels array; used for filtering.';
COMMENT ON COLUMN document_metadata.last_indexed_at IS 'Timestamp of the last search index refresh (unused until search milestone).';

CREATE INDEX IF NOT EXISTS idx_document_metadata_tenant
    ON document_metadata(tenant_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_tags
    ON document_metadata USING GIN (tags);

DROP TRIGGER IF EXISTS document_metadata_updated_at ON document_metadata;
CREATE TRIGGER document_metadata_updated_at
    BEFORE UPDATE ON document_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Migration log for visibility.
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created editor document tables (V026)';
    RAISE NOTICE '========================================';
END $$;
