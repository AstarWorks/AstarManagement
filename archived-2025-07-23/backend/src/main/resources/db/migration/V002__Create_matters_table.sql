-- V002__Create_matters_table.sql
-- Create matters table for legal case management
-- Supports FR-010 (Matter CRUD) and FR-011 (Kanban Board)

CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(255) NOT NULL UNIQUE, -- Format: YYYY-TT-NNNN
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Client information
    client_name VARCHAR(255) NOT NULL,
    client_contact TEXT, -- JSON or structured contact info
    opposing_party VARCHAR(255),
    court_name VARCHAR(255),
    
    -- Dates
    filing_date DATE,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    
    -- Status and priority
    status VARCHAR(50) NOT NULL DEFAULT 'INTAKE' CHECK (
        status IN (
            'INTAKE', 'INITIAL_REVIEW', 'INVESTIGATION', 'RESEARCH',
            'DRAFT_PLEADINGS', 'FILED', 'DISCOVERY', 'MEDIATION',
            'TRIAL_PREP', 'TRIAL', 'SETTLEMENT', 'CLOSED'
        )
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    ),
    
    -- Assignment
    assigned_lawyer_id UUID NOT NULL REFERENCES users(id),
    assigned_clerk_id UUID REFERENCES users(id),
    
    -- Additional metadata
    notes TEXT,
    tags TEXT[], -- PostgreSQL array for tags
    
    -- Full-text search
    search_vector tsvector,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_matters_case_number ON matters(case_number);
CREATE INDEX idx_matters_client_name ON matters(client_name);
CREATE INDEX idx_matters_status ON matters(status);
CREATE INDEX idx_matters_priority ON matters(priority);
CREATE INDEX idx_matters_assigned_lawyer ON matters(assigned_lawyer_id);
CREATE INDEX idx_matters_assigned_clerk ON matters(assigned_clerk_id);
CREATE INDEX idx_matters_filing_date ON matters(filing_date);
CREATE INDEX idx_matters_created_at ON matters(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_matters_lawyer_status ON matters(assigned_lawyer_id, status);
CREATE INDEX idx_matters_status_priority ON matters(status, priority);
CREATE INDEX idx_matters_client_status ON matters(client_name, status);

-- Full-text search index
CREATE INDEX idx_matters_search_vector ON matters USING GIN(search_vector);

-- Create trigger for updated_at
CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for search_vector
CREATE OR REPLACE FUNCTION update_matters_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.case_number, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.client_name, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.notes, '')), 'D');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_matters_search_vector BEFORE INSERT OR UPDATE ON matters
    FOR EACH ROW EXECUTE FUNCTION update_matters_search_vector();

-- Add comments for documentation
COMMENT ON TABLE matters IS 'Legal matters/cases managed by the firm';
COMMENT ON COLUMN matters.case_number IS 'Unique case identifier in format YYYY-TT-NNNN';
COMMENT ON COLUMN matters.status IS 'Current stage of the matter in the workflow';
COMMENT ON COLUMN matters.priority IS 'Priority level for task scheduling';
COMMENT ON COLUMN matters.client_contact IS 'Structured client contact information';
COMMENT ON COLUMN matters.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN matters.search_vector IS 'Full-text search vector for matter content';