-- V017_1__Update_expenses_table.sql
-- Update existing expenses table (created in V005) to match current domain model
-- Migrates from single amount field to separated income/expense amounts

-- Step 1: Add new columns to existing expenses table
ALTER TABLE expenses
-- Multi-tenant support
ADD COLUMN IF NOT EXISTS tenant_id UUID,

-- New amount fields to replace single amount field
ADD COLUMN IF NOT EXISTS income_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS expense_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0,

-- Related information
ADD COLUMN IF NOT EXISTS case_id UUID,
ADD COLUMN IF NOT EXISTS memo TEXT,

-- Version control
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0,

-- Rename existing columns to match new schema
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS date DATE;

-- Step 2: Migrate data from old schema to new schema
-- Copy expense_date to date column
UPDATE expenses SET date = expense_date WHERE date IS NULL AND expense_date IS NOT NULL;

-- Copy expense_type to category column
UPDATE expenses SET category = expense_type WHERE category IS NULL AND expense_type IS NOT NULL;

-- Migrate amount to expense_amount (assuming all existing entries are expenses)
UPDATE expenses SET 
    expense_amount = amount,
    income_amount = 0
WHERE expense_amount = 0 AND amount IS NOT NULL AND amount > 0;

-- Set tenant_id based on existing matter relationships
UPDATE expenses e SET 
    tenant_id = m.tenant_id
FROM matters m 
WHERE e.matter_id = m.id AND e.tenant_id IS NULL;

-- For expenses without matters, use the creating user's tenant
UPDATE expenses e SET
    tenant_id = u.tenant_id  
FROM users u
WHERE e.created_by = u.id AND e.tenant_id IS NULL;

-- Step 3: Add NOT NULL constraints after data migration
ALTER TABLE expenses
ALTER COLUMN tenant_id SET NOT NULL,
ALTER COLUMN date SET NOT NULL,
ALTER COLUMN category SET NOT NULL,
ALTER COLUMN income_amount SET NOT NULL,
ALTER COLUMN expense_amount SET NOT NULL,
ALTER COLUMN balance SET NOT NULL,
ALTER COLUMN version SET NOT NULL;

-- Step 4: Add CHECK constraints
ALTER TABLE expenses
ADD CONSTRAINT income_amount_positive CHECK (income_amount >= 0),
ADD CONSTRAINT expense_amount_positive CHECK (expense_amount >= 0),
ADD CONSTRAINT expense_income_or_expense CHECK (
    (income_amount > 0 AND expense_amount = 0) OR 
    (income_amount = 0 AND expense_amount > 0) OR
    (income_amount = 0 AND expense_amount = 0)
);

-- Step 5: Add foreign key constraint for tenant_id
ALTER TABLE expenses
ADD CONSTRAINT expenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Step 6: Drop old columns that have been migrated
ALTER TABLE expenses
DROP COLUMN IF EXISTS expense_date,
DROP COLUMN IF EXISTS expense_type,
DROP COLUMN IF EXISTS amount,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS receipt_filename,
DROP COLUMN IF EXISTS receipt_required,
DROP COLUMN IF EXISTS approval_status,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS billable,
DROP COLUMN IF EXISTS billed,
DROP COLUMN IF EXISTS billing_rate,
DROP COLUMN IF EXISTS notes;

-- Step 7: Drop old indexes that reference removed columns
DROP INDEX IF EXISTS idx_expenses_expense_type;
DROP INDEX IF EXISTS idx_expenses_expense_date;
DROP INDEX IF EXISTS idx_expenses_approval_status;
DROP INDEX IF EXISTS idx_expenses_approved_by;
DROP INDEX IF EXISTS idx_expenses_billable;
DROP INDEX IF EXISTS idx_expenses_billed;

-- Step 8: Create new indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON expenses(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_case ON expenses(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_created_at ON expenses(tenant_id, created_at DESC);

-- The trigger should already exist from V005, but ensure it's there
-- (CREATE TRIGGER ... IF NOT EXISTS is not supported, so we don't recreate)

-- Step 9: Update table and column comments
COMMENT ON TABLE expenses IS 'Multi-tenant expense and income tracking for legal practice';
COMMENT ON COLUMN expenses.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN expenses.date IS 'Date of the expense or income transaction';
COMMENT ON COLUMN expenses.category IS 'Category of the transaction';
COMMENT ON COLUMN expenses.income_amount IS 'Income amount (mutually exclusive with expense_amount)';
COMMENT ON COLUMN expenses.expense_amount IS 'Expense amount (mutually exclusive with income_amount)';
COMMENT ON COLUMN expenses.balance IS 'Running balance calculated by application';
COMMENT ON COLUMN expenses.case_id IS 'Optional reference to related legal case';
COMMENT ON COLUMN expenses.memo IS 'Additional notes or memo for the transaction';
COMMENT ON COLUMN expenses.version IS 'Optimistic locking version';