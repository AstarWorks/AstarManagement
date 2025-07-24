-- V005__Create_supporting_tables.sql
-- Create supporting tables for documents, memos, and expenses
-- Supports FR-020 (Document Management), FR-030 (Memos), FR-031 (Expenses)

-- Documents table for file management and OCR content
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- File information
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(200) NOT NULL,
    
    -- OCR and content
    ocr_content TEXT, -- Extracted text from OCR
    ocr_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        ocr_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
    ),
    ocr_confidence DECIMAL(5,2), -- OCR confidence score (0-100)
    
    -- Categorization
    document_type VARCHAR(50) DEFAULT 'GENERAL' CHECK (
        document_type IN (
            'GENERAL', 'PLEADING', 'EVIDENCE', 'CORRESPONDENCE', 
            'CONTRACT', 'COURT_ORDER', 'INVOICE', 'RECEIPT'
        )
    ),
    tags TEXT[], -- PostgreSQL array for tags
    
    -- Full-text search
    search_vector tsvector,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Memos table for client and internal communications
CREATE TABLE memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE, -- NULL for general memos
    
    -- Memo content
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    memo_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL' CHECK (
        memo_type IN ('INTERNAL', 'CLIENT', 'COURT', 'OPPOSING_COUNSEL')
    ),
    
    -- Communication details
    participants TEXT[], -- Array of participant names/emails
    communication_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Priority and categorization
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    ),
    tags TEXT[], -- PostgreSQL array for tags
    
    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_assigned_to UUID REFERENCES users(id),
    
    -- Full-text search
    search_vector tsvector,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Expenses table for tracking costs and billing
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL, -- NULL for general firm expenses
    
    -- Expense details
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'JPY' NOT NULL,
    expense_date DATE NOT NULL,
    
    -- Categorization
    expense_type VARCHAR(50) NOT NULL CHECK (
        expense_type IN (
            'TRAVEL', 'MEALS', 'ACCOMMODATION', 'COURT_FEES', 
            'FILING_FEES', 'COPYING', 'POSTAGE', 'TELEPHONE',
            'RESEARCH', 'EXPERT_WITNESS', 'OTHER'
        )
    ),
    
    -- Receipt and approval
    receipt_filename VARCHAR(500), -- Path to receipt image/document
    receipt_required BOOLEAN DEFAULT true,
    approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED')
    ),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Billing
    billable BOOLEAN DEFAULT true,
    billed BOOLEAN DEFAULT false,
    billing_rate DECIMAL(10,2), -- If different from standard rate
    
    -- Notes
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for documents table
CREATE INDEX idx_documents_matter_id ON documents(matter_id);
CREATE INDEX idx_documents_file_type ON documents(file_type);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_ocr_status ON documents(ocr_status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);

-- Create indexes for memos table
CREATE INDEX idx_memos_matter_id ON memos(matter_id);
CREATE INDEX idx_memos_memo_type ON memos(memo_type);
CREATE INDEX idx_memos_priority ON memos(priority);
CREATE INDEX idx_memos_communication_date ON memos(communication_date);
CREATE INDEX idx_memos_follow_up_date ON memos(follow_up_date);
CREATE INDEX idx_memos_follow_up_assigned_to ON memos(follow_up_assigned_to);
CREATE INDEX idx_memos_requires_follow_up ON memos(requires_follow_up);
CREATE INDEX idx_memos_search_vector ON memos USING GIN(search_vector);

-- Create indexes for expenses table
CREATE INDEX idx_expenses_matter_id ON expenses(matter_id);
CREATE INDEX idx_expenses_expense_type ON expenses(expense_type);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_approval_status ON expenses(approval_status);
CREATE INDEX idx_expenses_approved_by ON expenses(approved_by);
CREATE INDEX idx_expenses_billable ON expenses(billable);
CREATE INDEX idx_expenses_billed ON expenses(billed);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);

-- Create updated_at triggers
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memos_updated_at BEFORE UPDATE ON memos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create search vector triggers for documents
CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.filename, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.original_filename, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.ocr_content, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.document_type, '')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_search_vector BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_documents_search_vector();

-- Create search vector triggers for memos
CREATE OR REPLACE FUNCTION update_memos_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.participants, ' '), '')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_memos_search_vector BEFORE INSERT OR UPDATE ON memos
    FOR EACH ROW EXECUTE FUNCTION update_memos_search_vector();

-- Add table comments
COMMENT ON TABLE documents IS 'Document storage with OCR content and full-text search';
COMMENT ON TABLE memos IS 'Internal and client communications with follow-up tracking';
COMMENT ON TABLE expenses IS 'Expense tracking with approval workflow and billing integration';

COMMENT ON COLUMN documents.ocr_content IS 'Text extracted from document via OCR processing';
COMMENT ON COLUMN documents.search_vector IS 'Full-text search vector for document content';
COMMENT ON COLUMN memos.participants IS 'Array of people involved in the communication';
COMMENT ON COLUMN memos.search_vector IS 'Full-text search vector for memo content';
COMMENT ON COLUMN expenses.billable IS 'Whether this expense can be billed to client';
COMMENT ON COLUMN expenses.receipt_required IS 'Whether a receipt is required for this expense type';