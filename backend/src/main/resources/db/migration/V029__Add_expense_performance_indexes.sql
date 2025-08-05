-- V029__Add_expense_performance_indexes.sql
-- Adds comprehensive performance indexes for expense-related tables
-- Based on query patterns from JpaExpenseRepository and JpaTagRepository

-- Analyze current statistics before creating indexes
ANALYZE expenses;
ANALYZE tags;
ANALYZE expense_tags;
ANALYZE attachments;
ANALYZE expense_attachments;

-- =======================
-- 1. EXPENSE TABLE INDEXES
-- =======================

-- Composite index for filtered queries (date range, case, category)
-- Used by: findByFilters()
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_filters 
ON expenses(tenant_id, date, case_id, category)
WHERE deleted_at IS NULL;

-- Composite index for date range queries with ordering
-- Used by: findByTenantId(), findByFilters()
-- Note: idx_expenses_tenant_date already exists from V017_1, but let's enhance it
DROP INDEX IF EXISTS idx_expenses_tenant_date;
CREATE INDEX idx_expenses_tenant_date_created 
ON expenses(tenant_id, date DESC, created_at DESC)
WHERE deleted_at IS NULL;

-- Partial index for case-related expenses (commonly filtered)
-- Used by: findByFilters() when filtering by case_id
-- Note: idx_expenses_case already exists from V017_1, but let's enhance it
DROP INDEX IF EXISTS idx_expenses_case;
CREATE INDEX idx_expenses_case_active 
ON expenses(case_id, date DESC)
WHERE case_id IS NOT NULL AND deleted_at IS NULL;

-- Index for category-based filtering
-- Used by: findByFilters() when filtering by category
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_category 
ON expenses(tenant_id, category, date DESC)
WHERE deleted_at IS NULL;

-- Index for balance calculation queries
-- Used by: calculatePreviousBalance()
CREATE INDEX IF NOT EXISTS idx_expenses_balance_calc 
ON expenses(tenant_id, date, id)
WHERE deleted_at IS NULL;

-- Index for income vs expense filtering (future enhancement)
CREATE INDEX IF NOT EXISTS idx_expenses_type_filter
ON expenses(tenant_id, date DESC)
WHERE deleted_at IS NULL AND income_amount > 0;

-- =======================
-- 2. TAG PERFORMANCE INDEXES
-- =======================

-- Case-insensitive name search optimization
-- Used by: existsByTenantIdAndNameIgnoreCase(), findByNamePattern()
-- Note: This supplements idx_tags_normalized from V023
CREATE INDEX IF NOT EXISTS idx_tags_name_lower 
ON tags(tenant_id, LOWER(name))
WHERE deleted_at IS NULL;

-- Scope-based access patterns
-- Used by: findByTenantIdAndScope()
-- Note: idx_tags_tenant_scope exists from V023, but let's add name ordering
DROP INDEX IF EXISTS idx_tags_tenant_scope;
CREATE INDEX idx_tags_tenant_scope_name 
ON tags(tenant_id, scope, name)
WHERE deleted_at IS NULL;

-- Personal tag owner lookup
-- Used by: personal tag queries
-- Note: idx_tags_owner_id exists from V023, but let's enhance it
DROP INDEX IF EXISTS idx_tags_owner_id;
CREATE INDEX idx_tags_owner_scope 
ON tags(owner_id, scope)
WHERE scope = 'PERSONAL' AND deleted_at IS NULL;

-- Tag autocomplete pattern matching
-- Used by: findByNamePattern()
CREATE INDEX IF NOT EXISTS idx_tags_name_pattern
ON tags(tenant_id, name varchar_pattern_ops)
WHERE deleted_at IS NULL;

-- =======================================
-- 3. EXPENSE-TAGS JUNCTION OPTIMIZATION
-- =======================================

-- Optimize tag-based expense queries
-- Used by: findByTagIds()
-- Note: idx_expense_tags_tag_id exists from V023, but let's create composite
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag_expense 
ON expense_tags(tag_id, expense_id);

-- Tenant-based junction queries
-- Used by: tag usage counting in findMostUsedTags()
-- Note: idx_expense_tags_tenant_id exists from V023, but let's add tag_id
DROP INDEX IF EXISTS idx_expense_tags_tenant_id;
CREATE INDEX idx_expense_tags_tenant_tag 
ON expense_tags(tenant_id, tag_id);

-- Optimize expense deletion cleanup
-- Used for cascading operations when deleting expenses
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense_cleanup 
ON expense_tags(expense_id, tenant_id);

-- =====================================
-- 4. ATTACHMENT PERFORMANCE INDEXES
-- =====================================

-- Note: Most attachment indexes already exist from V024, but let's add a few optimizations

-- Expense attachment lookups (composite for better performance)
-- Used when loading expenses with attachments
-- Note: idx_expense_attachments_expense exists from V024, but let's enhance
DROP INDEX IF EXISTS idx_expense_attachments_expense;
CREATE INDEX idx_expense_attachments_expense 
ON expense_attachments(expense_id, attachment_id);

-- Tenant-based attachment queries
-- Used for tenant-scoped attachment operations
-- Note: idx_attachments_tenant exists from V024, but let's add date ordering
CREATE INDEX IF NOT EXISTS idx_attachments_tenant_created 
ON attachments(tenant_id, uploaded_at DESC)
WHERE deleted_at IS NULL;

-- File type based filtering (for reporting and analytics)
-- Used when filtering attachments by type
CREATE INDEX IF NOT EXISTS idx_attachments_type_size 
ON attachments(mime_type, file_size)
WHERE deleted_at IS NULL;

-- File metadata search
-- Used for filename searches
CREATE INDEX IF NOT EXISTS idx_attachments_filename_search
ON attachments(tenant_id, LOWER(original_name))
WHERE deleted_at IS NULL;

-- =======================
-- 5. COVERING INDEXES
-- =======================

-- Covering index for expense list queries (includes commonly selected columns)
-- This can eliminate table lookups for simple list queries
CREATE INDEX IF NOT EXISTS idx_expenses_covering_list
ON expenses(tenant_id, date DESC, created_at DESC)
INCLUDE (id, category, income_amount, expense_amount, balance, memo)
WHERE deleted_at IS NULL;

-- =======================
-- 6. UPDATE STATISTICS
-- =======================

-- Update table statistics after index creation
ANALYZE expenses;
ANALYZE tags;
ANALYZE expense_tags;
ANALYZE attachments;
ANALYZE expense_attachments;

-- =======================
-- 7. INDEX DOCUMENTATION
-- =======================

-- Add comments for documentation
COMMENT ON INDEX idx_expenses_tenant_filters IS 'Composite index for complex expense filtering queries';
COMMENT ON INDEX idx_expenses_tenant_date_created IS 'Primary index for expense list queries with date ordering';
COMMENT ON INDEX idx_expenses_case_active IS 'Partial index for case-related expense queries';
COMMENT ON INDEX idx_expenses_tenant_category IS 'Index for category-based expense filtering';
COMMENT ON INDEX idx_expenses_balance_calc IS 'Optimized index for running balance calculations';
COMMENT ON INDEX idx_expenses_type_filter IS 'Partial index for income-only expense queries';

COMMENT ON INDEX idx_tags_name_lower IS 'Case-insensitive tag name search optimization';
COMMENT ON INDEX idx_tags_tenant_scope_name IS 'Composite index for scope-based tag access';
COMMENT ON INDEX idx_tags_owner_scope IS 'Partial index for personal tag lookups';
COMMENT ON INDEX idx_tags_name_pattern IS 'Pattern matching index for tag autocomplete';

COMMENT ON INDEX idx_expense_tags_tag_expense IS 'Optimized index for tag-based expense queries';
COMMENT ON INDEX idx_expense_tags_tenant_tag IS 'Composite index for tag usage analytics';
COMMENT ON INDEX idx_expense_tags_expense_cleanup IS 'Index for efficient expense deletion cleanup';

COMMENT ON INDEX idx_attachments_tenant_created IS 'Tenant-scoped attachment queries with date ordering';
COMMENT ON INDEX idx_attachments_type_size IS 'File type and size filtering for analytics';
COMMENT ON INDEX idx_attachments_filename_search IS 'Case-insensitive filename search optimization';

COMMENT ON INDEX idx_expenses_covering_list IS 'Covering index for expense list queries to avoid table lookups';