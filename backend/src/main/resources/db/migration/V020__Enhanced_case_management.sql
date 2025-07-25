-- V020__Enhanced_case_management.sql
-- Create enhanced case management tables with Japanese legal workflow support
-- Extends existing matters table with comprehensive case tracking capabilities

-- Create case_statuses table to track status history (complementing existing matter_status_history)
CREATE TABLE IF NOT EXISTS case_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL, -- Will reference matters.id
    tenant_id UUID NOT NULL,
    
    -- Status information
    status VARCHAR(50) NOT NULL CHECK (
        status IN (
            'PRE_CONSULTATION',    -- 受任前相談
            'INTAKE_PROCESS',      -- 受任手続中  
            'PREPARATION',         -- 準備中
            'IN_PROGRESS',         -- 進行中
            'SETTLEMENT',          -- 和解交渉中
            'AWAITING_JUDGMENT',   -- 判決待ち
            'COMPLETED',           -- 完了
            'ON_HOLD',            -- 保留
            'ARCHIVED'            -- アーカイブ
        )
    ),
    previous_status VARCHAR(50),
    
    -- Change metadata
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID NOT NULL,
    change_reason VARCHAR(500),
    notes TEXT,
    
    -- Legal workflow specific
    court_date DATE, -- Associated court date if applicable
    deadline_date DATE, -- Legal deadline for this status
    is_court_mandated BOOLEAN DEFAULT FALSE,
    requires_client_approval BOOLEAN DEFAULT FALSE,
    client_approved_at TIMESTAMP WITH TIME ZONE,
    client_approved_by UUID,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_case_statuses_case_id FOREIGN KEY (case_id) REFERENCES matters(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_statuses_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_case_statuses_changed_by FOREIGN KEY (changed_by) REFERENCES users(id),
    CONSTRAINT fk_case_statuses_client_approved_by FOREIGN KEY (client_approved_by) REFERENCES users(id)
);

-- Create case_assignments table for multi-user case assignments
CREATE TABLE case_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Assignment details
    role VARCHAR(50) NOT NULL CHECK (
        role IN ('PRIMARY_LAWYER', 'SECONDARY_LAWYER', 'PARALEGAL', 'CLERK', 'CONSULTANT')
    ),
    is_primary BOOLEAN DEFAULT FALSE,
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assignment_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Responsibility and permissions
    responsibilities TEXT[],  -- Array of responsibilities
    billing_rate DECIMAL(10,2), -- Hourly rate for this assignment
    can_modify_case BOOLEAN DEFAULT FALSE,
    can_view_financial BOOLEAN DEFAULT FALSE,
    can_communicate_client BOOLEAN DEFAULT FALSE,
    
    -- Assignment metadata
    assigned_by UUID,
    assignment_reason VARCHAR(500),
    notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_case_assignments_case_id FOREIGN KEY (case_id) REFERENCES matters(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_assignments_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_case_assignments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id),
    CONSTRAINT uk_case_user_role UNIQUE (case_id, user_id, role),
    CONSTRAINT chk_assignment_dates CHECK (assignment_end_date IS NULL OR assignment_end_date > assignment_date)
);

-- Create clients table for better client management (separate from case data)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Basic information
    client_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (
        client_type IN ('individual', 'corporate', 'government', 'nonprofit')
    ),
    
    -- Individual client data
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    middle_name VARCHAR(255),
    full_name_kanji VARCHAR(255),
    full_name_kana VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'not_specified')),
    nationality VARCHAR(100),
    
    -- Corporate client data
    company_name VARCHAR(500),
    company_name_kanji VARCHAR(500),
    company_name_kana VARCHAR(500),
    registration_number VARCHAR(100), -- Corporate registration number
    industry VARCHAR(200),
    
    -- Contact information
    primary_email VARCHAR(255),
    secondary_email VARCHAR(255),
    primary_phone VARCHAR(50),
    secondary_phone VARCHAR(50),
    fax_number VARCHAR(50),
    
    -- Address (using JSONB for flexibility)
    primary_address JSONB, -- Structured address data
    mailing_address JSONB,
    emergency_contact JSONB,
    
    -- Legal specific information
    preferred_language VARCHAR(50) DEFAULT 'ja',
    requires_interpreter BOOLEAN DEFAULT FALSE,
    interpreter_language VARCHAR(50),
    communication_preferences JSONB DEFAULT '{}',
    
    -- Privacy and consent
    privacy_consent_given BOOLEAN DEFAULT FALSE,
    privacy_consent_date TIMESTAMP WITH TIME ZONE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    data_retention_consent BOOLEAN DEFAULT TRUE,
    
    -- Client status
    is_active BOOLEAN DEFAULT TRUE,
    client_since DATE DEFAULT CURRENT_DATE,
    last_contact_date DATE,
    
    -- Risk assessment
    conflict_check_status VARCHAR(50) DEFAULT 'pending' CHECK (
        conflict_check_status IN ('pending', 'cleared', 'conflict_found', 'waived')
    ),
    conflict_check_date TIMESTAMP WITH TIME ZONE,
    conflict_check_by UUID,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (
        risk_level IN ('low', 'medium', 'high', 'critical')
    ),
    
    -- Financial information
    billing_address JSONB,
    preferred_billing_method VARCHAR(50) DEFAULT 'invoice',
    credit_limit DECIMAL(12,2),
    payment_terms VARCHAR(100),
    
    -- Notes and tags
    notes TEXT,
    tags TEXT[],
    
    -- Full-text search
    search_vector tsvector,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_clients_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_clients_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_clients_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_clients_conflict_check_by FOREIGN KEY (conflict_check_by) REFERENCES users(id),
    CONSTRAINT chk_client_name_required CHECK (
        (client_type = 'individual' AND (first_name IS NOT NULL OR full_name_kanji IS NOT NULL)) OR
        (client_type != 'individual' AND company_name IS NOT NULL)
    )
);

-- Create case_clients junction table for many-to-many relationship
CREATE TABLE case_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    client_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Relationship details
    client_role VARCHAR(50) NOT NULL DEFAULT 'primary' CHECK (
        client_role IN ('primary', 'secondary', 'co_plaintiff', 'co_defendant', 'third_party')
    ),
    is_primary BOOLEAN DEFAULT FALSE,
    relationship_start_date DATE DEFAULT CURRENT_DATE,
    relationship_end_date DATE,
    
    -- Legal status
    legal_standing VARCHAR(100), -- Legal capacity in this case
    representation_scope TEXT, -- Scope of representation
    retainer_agreement_signed BOOLEAN DEFAULT FALSE,
    retainer_agreement_date DATE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_case_clients_case_id FOREIGN KEY (case_id) REFERENCES matters(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_clients_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_clients_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT uk_case_client_role UNIQUE (case_id, client_id, client_role)
);

-- Create indexes for performance
CREATE INDEX idx_case_statuses_case_id ON case_statuses(case_id);
CREATE INDEX idx_case_statuses_tenant_id ON case_statuses(tenant_id);
CREATE INDEX idx_case_statuses_status ON case_statuses(status);
CREATE INDEX idx_case_statuses_changed_at ON case_statuses(changed_at);
CREATE INDEX idx_case_statuses_court_date ON case_statuses(court_date) WHERE court_date IS NOT NULL;
CREATE INDEX idx_case_statuses_deadline_date ON case_statuses(deadline_date) WHERE deadline_date IS NOT NULL;

CREATE INDEX idx_case_assignments_case_id ON case_assignments(case_id);
CREATE INDEX idx_case_assignments_tenant_id ON case_assignments(tenant_id);
CREATE INDEX idx_case_assignments_user_id ON case_assignments(user_id);
CREATE INDEX idx_case_assignments_role ON case_assignments(role);
CREATE INDEX idx_case_assignments_is_primary ON case_assignments(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_case_assignments_is_active ON case_assignments(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_client_type ON clients(client_type);
CREATE INDEX idx_clients_primary_email ON clients(primary_email);
CREATE INDEX idx_clients_company_name ON clients(company_name);
CREATE INDEX idx_clients_is_active ON clients(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_clients_conflict_check_status ON clients(conflict_check_status);
CREATE INDEX idx_clients_search_vector ON clients USING GIN(search_vector);

CREATE INDEX idx_case_clients_case_id ON case_clients(case_id);
CREATE INDEX idx_case_clients_client_id ON case_clients(client_id);
CREATE INDEX idx_case_clients_tenant_id ON case_clients(tenant_id);
CREATE INDEX idx_case_clients_client_role ON case_clients(client_role);
CREATE INDEX idx_case_clients_is_primary ON case_clients(is_primary) WHERE is_primary = TRUE;

-- Enable Row Level Security
ALTER TABLE case_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_case_statuses ON case_statuses
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_case_assignments ON case_assignments
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_clients ON clients
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_case_clients ON case_clients
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create triggers for tenant_id auto-population
CREATE TRIGGER set_tenant_id_case_statuses
    BEFORE INSERT ON case_statuses
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_case_assignments
    BEFORE INSERT ON case_assignments
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_clients
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_case_clients
    BEFORE INSERT ON case_clients
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create updated_at triggers
CREATE TRIGGER update_case_statuses_updated_at BEFORE UPDATE ON case_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_assignments_updated_at BEFORE UPDATE ON case_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_clients_updated_at BEFORE UPDATE ON case_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create search vector triggers for clients
CREATE OR REPLACE FUNCTION update_clients_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.full_name_kanji, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.full_name_kana, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.company_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.company_name_kanji, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.primary_email, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.primary_phone, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_search_vector BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_clients_search_vector();

-- Create function to ensure only one primary assignment per case
CREATE OR REPLACE FUNCTION ensure_single_primary_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting an assignment as primary, deactivate other primary assignments for the same case
    IF NEW.is_primary = TRUE THEN
        UPDATE case_assignments 
        SET 
            is_primary = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE 
            case_id = NEW.case_id 
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
            AND is_primary = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_assignment_trigger
    BEFORE INSERT OR UPDATE ON case_assignments
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_assignment();

-- Create comprehensive case view joining all related data
CREATE VIEW case_overview AS
SELECT 
    m.id as case_id,
    m.case_number,
    m.title,
    m.status as current_status,
    m.priority,
    m.filing_date,
    m.estimated_completion_date,
    m.tenant_id,
    
    -- Primary client information
    pc.id as primary_client_id,
    COALESCE(pc.company_name, pc.first_name || ' ' || pc.last_name) as primary_client_name,
    pc.client_type,
    pc.primary_email as client_email,
    pc.primary_phone as client_phone,
    
    -- Primary lawyer information
    pl.id as primary_lawyer_id,
    pl.first_name || ' ' || pl.last_name as primary_lawyer_name,
    pl.email as lawyer_email,
    
    -- Case metrics
    COUNT(DISTINCT ca.id) as total_assignments,
    COUNT(DISTINCT cc.id) as total_clients,
    COUNT(DISTINCT d.id) as total_documents,
    COUNT(DISTINCT e.id) as total_expenses,
    
    -- Recent activity
    MAX(cs.changed_at) as last_status_change,
    MAX(d.created_at) as last_document_added,
    
    m.created_at,
    m.updated_at
FROM matters m
LEFT JOIN case_clients cc ON m.id = cc.case_id AND cc.is_primary = TRUE
LEFT JOIN clients pc ON cc.client_id = pc.id
LEFT JOIN case_assignments ca_primary ON m.id = ca_primary.case_id AND ca_primary.is_primary = TRUE
LEFT JOIN users pl ON ca_primary.user_id = pl.id
LEFT JOIN case_assignments ca ON m.id = ca.case_id AND ca.is_active = TRUE
LEFT JOIN case_statuses cs ON m.id = cs.case_id
LEFT JOIN documents d ON m.id = d.matter_id
LEFT JOIN expenses e ON m.id = e.matter_id
GROUP BY 
    m.id, m.case_number, m.title, m.status, m.priority, m.filing_date,
    m.estimated_completion_date, m.tenant_id, pc.id, pc.company_name,
    pc.first_name, pc.last_name, pc.client_type, pc.primary_email,
    pc.primary_phone, pl.id, pl.first_name, pl.last_name, pl.email,
    m.created_at, m.updated_at;

-- Add table comments
COMMENT ON TABLE case_statuses IS 'Detailed status transition history for legal cases with court dates and deadlines';
COMMENT ON TABLE case_assignments IS 'Multi-user assignments to cases with role-based permissions and billing rates';
COMMENT ON TABLE clients IS 'Comprehensive client information supporting both individual and corporate clients';
COMMENT ON TABLE case_clients IS 'Many-to-many relationship between cases and clients with role specifications';

COMMENT ON VIEW case_overview IS 'Comprehensive view of cases with primary client, lawyer, and activity metrics';

-- Add column comments
COMMENT ON COLUMN case_statuses.is_court_mandated IS 'Whether this status change was mandated by court order';
COMMENT ON COLUMN case_assignments.responsibilities IS 'Array of specific responsibilities for this assignment';
COMMENT ON COLUMN clients.conflict_check_status IS 'Status of conflict of interest check for legal compliance';
COMMENT ON COLUMN clients.data_retention_consent IS 'Client consent for data retention beyond case completion';