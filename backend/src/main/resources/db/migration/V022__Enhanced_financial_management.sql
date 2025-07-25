-- V022__Enhanced_financial_management.sql
-- Create comprehensive financial management system for legal practice billing
-- Extends existing expenses table with invoicing, time tracking, and payment management

-- Create time_entries table for detailed time tracking
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Associated records
    case_id UUID REFERENCES matters(id),
    user_id UUID NOT NULL,
    
    -- Time tracking
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER, -- Calculated or manually entered
    
    -- Work description
    description TEXT NOT NULL,
    work_type VARCHAR(100) NOT NULL CHECK (
        work_type IN (
            'CONSULTATION', 'RESEARCH', 'DOCUMENT_DRAFTING', 'COURT_APPEARANCE',
            'CLIENT_MEETING', 'PHONE_CALL', 'EMAIL_CORRESPONDENCE', 'TRAVEL',
            'ADMINISTRATIVE', 'NEGOTIATION', 'INVESTIGATION', 'OTHER'
        )
    ),
    
    -- Billing information
    is_billable BOOLEAN DEFAULT TRUE,
    hourly_rate DECIMAL(10,2), -- Rate at time of entry
    billable_amount DECIMAL(10,2), -- Calculated amount
    
    -- Status and approval
    entry_status VARCHAR(20) DEFAULT 'draft' CHECK (
        entry_status IN ('draft', 'submitted', 'approved', 'rejected', 'billed')
    ),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    -- Billing status
    is_billed BOOLEAN DEFAULT FALSE,
    invoice_id UUID, -- Will reference invoices table
    billed_at TIMESTAMP WITH TIME ZONE,
    
    -- Entry metadata
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_method VARCHAR(20) DEFAULT 'manual' CHECK (
        entry_method IN ('manual', 'timer', 'import', 'mobile_app')
    ),
    
    -- Time adjustments
    original_duration_minutes INTEGER, -- Original tracked time
    adjustment_reason TEXT, -- Reason for any time adjustments
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_time_entries_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_time_entries_case_id FOREIGN KEY (case_id) REFERENCES matters(id) ON DELETE SET NULL,
    CONSTRAINT fk_time_entries_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_time_entries_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_time_entries_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_time_entries_approved_by FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_time_entries_end_after_start CHECK (end_time IS NULL OR end_time > start_time),
    CONSTRAINT chk_time_entries_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT chk_time_entries_billable_amount CHECK (billable_amount IS NULL OR billable_amount >= 0)
);

-- Create invoices table for client billing
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Invoice identification
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    
    -- Client information
    case_id UUID REFERENCES matters(id),
    client_id UUID REFERENCES clients(id),
    bill_to_name VARCHAR(500) NOT NULL,
    bill_to_address JSONB NOT NULL,
    bill_to_email VARCHAR(255),
    
    -- Invoice amounts
    subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'JPY' NOT NULL,
    
    -- Tax information
    tax_rate DECIMAL(5,2) DEFAULT 0, -- Percentage (e.g., 10.0 for 10%)
    tax_type VARCHAR(50) DEFAULT 'consumption_tax',
    
    -- Payment terms
    payment_terms VARCHAR(200) DEFAULT 'Net 30 days',
    payment_method VARCHAR(100),
    bank_details JSONB, -- Bank account information for payments
    
    -- Invoice status
    status VARCHAR(20) DEFAULT 'draft' CHECK (
        status IN ('draft', 'sent', 'viewed', 'partial_paid', 'paid', 'overdue', 'cancelled', 'refunded')
    ),
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_method VARCHAR(50), -- email, mail, hand_delivery
    
    -- Payment tracking
    paid_amount DECIMAL(12,2) DEFAULT 0,
    payment_date DATE,
    last_payment_date DATE,
    
    -- Invoice content
    invoice_notes TEXT,
    terms_and_conditions TEXT,
    footer_text TEXT,
    
    -- Generation metadata
    generated_by UUID NOT NULL,
    template_id UUID, -- Reference to invoice template
    language VARCHAR(10) DEFAULT 'ja',
    
    -- PDF generation
    pdf_path VARCHAR(1000),
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_invoices_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_case_id FOREIGN KEY (case_id) REFERENCES matters(id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_generated_by FOREIGN KEY (generated_by) REFERENCES users(id),
    CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_invoices_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT uk_invoice_number_tenant UNIQUE (tenant_id, invoice_number),
    CONSTRAINT chk_invoices_due_date CHECK (due_date >= invoice_date),
    CONSTRAINT chk_invoices_amounts_positive CHECK (
        subtotal_amount >= 0 AND tax_amount >= 0 AND 
        discount_amount >= 0 AND total_amount >= 0 AND paid_amount >= 0
    ),
    CONSTRAINT chk_invoices_paid_not_exceed_total CHECK (paid_amount <= total_amount)
);

-- Create invoice_line_items table for detailed billing
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    -- Line item details
    line_number INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (
        item_type IN ('time_entry', 'expense', 'flat_fee', 'discount', 'adjustment')
    ),
    
    -- Item identification
    time_entry_id UUID REFERENCES time_entries(id),
    expense_id UUID REFERENCES expenses(id),
    
    -- Line item content
    description TEXT NOT NULL,
    work_date DATE,
    quantity DECIMAL(10,3) DEFAULT 1, -- Hours for time entries, count for expenses
    unit_rate DECIMAL(10,2), -- Rate per unit
    line_total DECIMAL(10,2) NOT NULL,
    
    -- Billing details
    attorney_name VARCHAR(255), -- Name of attorney who performed work
    is_taxable BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_invoice_line_items_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_line_items_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_line_items_time_entry_id FOREIGN KEY (time_entry_id) REFERENCES time_entries(id),
    CONSTRAINT fk_invoice_line_items_expense_id FOREIGN KEY (expense_id) REFERENCES expenses(id),
    CONSTRAINT chk_line_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_line_items_line_total CHECK (
        (item_type = 'discount' AND line_total <= 0) OR 
        (item_type != 'discount' AND line_total >= 0)
    )
);

-- Create payments table for payment tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Associated invoice
    invoice_id UUID NOT NULL,
    
    -- Payment details
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(100) NOT NULL CHECK (
        payment_method IN (
            'bank_transfer', 'cash', 'check', 'credit_card', 
            'debit_card', 'electronic_payment', 'other'
        )
    ),
    
    -- Payment reference
    reference_number VARCHAR(255),
    transaction_id VARCHAR(255),
    
    -- Payment status
    payment_status VARCHAR(50) DEFAULT 'completed' CHECK (
        payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')
    ),
    
    -- Bank details
    payer_bank_info JSONB,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2), -- Amount after fees
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID REFERENCES users(id),
    
    -- Notes
    payment_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_payments_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_payments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_payments_reconciled_by FOREIGN KEY (reconciled_by) REFERENCES users(id),
    CONSTRAINT chk_payments_amount_positive CHECK (payment_amount > 0),
    CONSTRAINT chk_payments_net_amount CHECK (net_amount IS NULL OR net_amount <= payment_amount)
);

-- Create billing_rates table for rate management
CREATE TABLE billing_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Rate identification
    rate_name VARCHAR(255) NOT NULL,
    rate_type VARCHAR(50) NOT NULL CHECK (
        rate_type IN ('hourly', 'flat_fee', 'contingency', 'retainer')
    ),
    
    -- Rate details
    hourly_rate DECIMAL(10,2),
    flat_fee_amount DECIMAL(10,2),
    contingency_percentage DECIMAL(5,2), -- For contingency fees
    minimum_fee DECIMAL(10,2),
    maximum_fee DECIMAL(10,2),
    
    -- Applicability
    applies_to_users UUID[], -- Array of user IDs
    applies_to_work_types VARCHAR(100)[], -- Array of work types
    applies_to_case_types VARCHAR(100)[], -- Array of case types
    
    -- Client-specific rates
    client_id UUID REFERENCES clients(id),
    case_id UUID REFERENCES matters(id),
    
    -- Effective period
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Rate calculation settings
    billing_increment_minutes INTEGER DEFAULT 15, -- Round up to 15-minute increments
    minimum_billable_time_minutes INTEGER DEFAULT 15,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'JPY',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_billing_rates_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_billing_rates_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_billing_rates_case_id FOREIGN KEY (case_id) REFERENCES matters(id) ON DELETE CASCADE,
    CONSTRAINT fk_billing_rates_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_billing_rates_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT chk_billing_rates_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
    CONSTRAINT chk_billing_rates_positive_amounts CHECK (
        (hourly_rate IS NULL OR hourly_rate > 0) AND
        (flat_fee_amount IS NULL OR flat_fee_amount > 0) AND
        (minimum_fee IS NULL OR minimum_fee >= 0) AND
        (maximum_fee IS NULL OR maximum_fee >= 0)
    )
);

-- Add foreign key constraint to time_entries for invoice_id
ALTER TABLE time_entries ADD CONSTRAINT fk_time_entries_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_time_entries_tenant_id ON time_entries(tenant_id);
CREATE INDEX idx_time_entries_case_id ON time_entries(case_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_entry_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entries_is_billable ON time_entries(is_billable) WHERE is_billable = TRUE;
CREATE INDEX idx_time_entries_entry_status ON time_entries(entry_status);
CREATE INDEX idx_time_entries_is_billed ON time_entries(is_billed);
CREATE INDEX idx_time_entries_invoice_id ON time_entries(invoice_id);

CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_case_id ON invoices(case_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_date ON invoices(payment_date);

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_tenant_id ON invoice_line_items(tenant_id);
CREATE INDEX idx_invoice_line_items_time_entry_id ON invoice_line_items(time_entry_id);
CREATE INDEX idx_invoice_line_items_expense_id ON invoice_line_items(expense_id);
CREATE INDEX idx_invoice_line_items_item_type ON invoice_line_items(item_type);

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_is_reconciled ON payments(is_reconciled);

CREATE INDEX idx_billing_rates_tenant_id ON billing_rates(tenant_id);
CREATE INDEX idx_billing_rates_client_id ON billing_rates(client_id);
CREATE INDEX idx_billing_rates_case_id ON billing_rates(case_id);
CREATE INDEX idx_billing_rates_is_active ON billing_rates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_billing_rates_effective_from ON billing_rates(effective_from);
CREATE INDEX idx_billing_rates_effective_to ON billing_rates(effective_to);

-- Enable Row Level Security
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_time_entries ON time_entries
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_invoices ON invoices
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_invoice_line_items ON invoice_line_items
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_payments ON payments
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_billing_rates ON billing_rates
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Create triggers for tenant_id auto-population
CREATE TRIGGER set_tenant_id_time_entries
    BEFORE INSERT ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_invoices
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_invoice_line_items
    BEFORE INSERT ON invoice_line_items
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_payments
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_billing_rates
    BEFORE INSERT ON billing_rates
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_on_insert();

-- Create updated_at triggers
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_rates_updated_at BEFORE UPDATE ON billing_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate time entry billing amount
CREATE OR REPLACE FUNCTION calculate_time_entry_billing()
RETURNS TRIGGER AS $$
DECLARE
    applicable_rate DECIMAL(10,2);
    billing_increment INTEGER;
    adjusted_minutes INTEGER;
BEGIN
    -- Only calculate for billable entries
    IF NEW.is_billable AND NEW.duration_minutes IS NOT NULL THEN
        -- Get applicable billing rate
        SELECT br.hourly_rate, br.billing_increment_minutes
        INTO applicable_rate, billing_increment
        FROM billing_rates br
        WHERE br.tenant_id = NEW.tenant_id
        AND br.is_active = TRUE
        AND (br.case_id = NEW.case_id OR br.case_id IS NULL)
        AND (NEW.work_type = ANY(br.applies_to_work_types) OR br.applies_to_work_types IS NULL)
        AND (NEW.user_id = ANY(br.applies_to_users) OR br.applies_to_users IS NULL)
        AND br.effective_from <= NEW.entry_date
        AND (br.effective_to IS NULL OR br.effective_to >= NEW.entry_date)
        ORDER BY 
            CASE WHEN br.case_id IS NOT NULL THEN 1 ELSE 2 END,
            br.effective_from DESC
        LIMIT 1;
        
        -- Use provided rate if no billing rate found
        IF applicable_rate IS NULL THEN
            applicable_rate := NEW.hourly_rate;
        ELSE
            NEW.hourly_rate := applicable_rate;
        END IF;
        
        -- Apply billing increment rounding (default 15 minutes)
        billing_increment := COALESCE(billing_increment, 15);
        adjusted_minutes := CEILING(NEW.duration_minutes::DECIMAL / billing_increment) * billing_increment;
        
        -- Calculate billable amount
        IF applicable_rate IS NOT NULL THEN
            NEW.billable_amount := (adjusted_minutes::DECIMAL / 60) * applicable_rate;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic billing calculation
CREATE TRIGGER calculate_time_entry_billing_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_entry_billing();

-- Create function to update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_subtotal DECIMAL(12,2);
    invoice_tax DECIMAL(12,2);
    invoice_total DECIMAL(12,2);
    tax_rate DECIMAL(5,2);
BEGIN
    -- Get the invoice tax rate
    SELECT i.tax_rate INTO tax_rate
    FROM invoices i
    WHERE i.id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Calculate subtotal from line items
    SELECT COALESCE(SUM(line_total), 0)
    INTO invoice_subtotal
    FROM invoice_line_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    AND is_taxable = TRUE;
    
    -- Calculate tax amount
    invoice_tax := invoice_subtotal * (COALESCE(tax_rate, 0) / 100);
    
    -- Calculate total
    invoice_total := invoice_subtotal + invoice_tax;
    
    -- Update invoice totals
    UPDATE invoices
    SET 
        subtotal_amount = invoice_subtotal,
        tax_amount = invoice_tax,
        total_amount = invoice_total,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic invoice total calculation
CREATE TRIGGER update_invoice_totals_on_line_item_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

-- Create comprehensive financial dashboard view
CREATE VIEW financial_dashboard AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    
    -- Time tracking metrics
    COUNT(DISTINCT te.id) as total_time_entries,
    COALESCE(SUM(te.duration_minutes), 0) as total_minutes_tracked,
    COALESCE(SUM(te.billable_amount) FILTER (WHERE te.is_billable = TRUE), 0) as total_billable_amount,
    COALESCE(SUM(te.billable_amount) FILTER (WHERE te.is_billed = TRUE), 0) as total_billed_amount,
    
    -- Invoice metrics
    COUNT(DISTINCT i.id) as total_invoices,
    COALESCE(SUM(i.total_amount), 0) as total_invoiced_amount,
    COALESCE(SUM(i.paid_amount), 0) as total_paid_amount,
    COALESCE(SUM(i.total_amount - i.paid_amount) FILTER (WHERE i.status != 'paid'), 0) as outstanding_amount,
    
    -- Expense metrics
    COUNT(DISTINCT e.id) as total_expenses,
    COALESCE(SUM(e.amount), 0) as total_expense_amount,
    COALESCE(SUM(e.amount) FILTER (WHERE e.billable = TRUE), 0) as billable_expenses,
    COALESCE(SUM(e.amount) FILTER (WHERE e.billed = TRUE), 0) as billed_expenses,
    
    -- Payment metrics
    COUNT(DISTINCT p.id) as total_payments,
    COALESCE(SUM(p.payment_amount), 0) as total_payment_amount,
    
    -- Current month metrics
    COALESCE(SUM(te.billable_amount) FILTER (WHERE te.entry_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_billable,
    COALESCE(SUM(i.total_amount) FILTER (WHERE i.invoice_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_invoiced,
    COALESCE(SUM(p.payment_amount) FILTER (WHERE p.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_collected
    
FROM tenants t
LEFT JOIN time_entries te ON t.id = te.tenant_id
LEFT JOIN invoices i ON t.id = i.tenant_id
LEFT JOIN expenses e ON t.id = e.tenant_id
LEFT JOIN payments p ON t.id = p.tenant_id
GROUP BY t.id, t.name;

-- Add table comments
COMMENT ON TABLE time_entries IS 'Detailed time tracking for legal work with billing integration';
COMMENT ON TABLE invoices IS 'Client invoicing system with Japanese legal practice billing standards';
COMMENT ON TABLE invoice_line_items IS 'Detailed line items for invoices including time entries and expenses';
COMMENT ON TABLE payments IS 'Payment tracking and reconciliation for invoices';
COMMENT ON TABLE billing_rates IS 'Flexible billing rate management for different clients, cases, and work types';

COMMENT ON FUNCTION calculate_time_entry_billing() IS 'Automatically calculates billing amounts for time entries based on applicable rates';
COMMENT ON FUNCTION update_invoice_totals() IS 'Maintains accurate invoice totals when line items change';
COMMENT ON VIEW financial_dashboard IS 'Comprehensive financial metrics and KPIs for law firm management';

-- Insert default billing rates for demo tenant
INSERT INTO billing_rates (
    tenant_id, rate_name, rate_type, hourly_rate, 
    billing_increment_minutes, minimum_billable_time_minutes,
    is_default, created_by, updated_by
)
SELECT 
    'demo0000-0000-0000-0000-000000000001',
    'Standard Attorney Rate',
    'hourly',
    20000.00, -- 20,000 JPY per hour
    15,       -- 15-minute increments
    15,       -- Minimum 15 minutes
    TRUE,
    u.id,
    u.id
FROM users u 
WHERE u.tenant_id = 'demo0000-0000-0000-0000-000000000001' 
LIMIT 1;