-- V008__Add_performance_indexes.sql
-- Adds performance optimization indexes for matter queries

-- Analyze current statistics
ANALYZE matters;
ANALYZE users;
ANALYZE matter_status_history;
ANALYZE audit_logs;

-- Index for matter status and priority queries
CREATE INDEX IF NOT EXISTS idx_matters_status_priority 
ON matters(status, priority DESC, updated_at DESC);

-- Index for matter queries by assigned lawyer
CREATE INDEX IF NOT EXISTS idx_matters_lawyer_status 
ON matters(assigned_lawyer_id, status);

-- Index for matter queries by assigned clerk
CREATE INDEX IF NOT EXISTS idx_matters_clerk_status
ON matters(assigned_clerk_id, status);

-- Index for audit log queries by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs(entity_type, entity_id, created_at DESC);

-- Partial index for active matters (frequently queried)
CREATE INDEX IF NOT EXISTS idx_active_matters 
ON matters(updated_at DESC)
WHERE status NOT IN ('CLOSED', 'CANCELLED');

-- Index for case number lookup (should be unique anyway)
CREATE INDEX IF NOT EXISTS idx_matters_case_number
ON matters(case_number);

-- Index for client name search (using lower for case-insensitive)
CREATE INDEX IF NOT EXISTS idx_matters_client_name_lower
ON matters(LOWER(client_name));

-- Index for overdue matters query
CREATE INDEX IF NOT EXISTS idx_matters_completion_date
ON matters(estimated_completion_date, status)
WHERE actual_completion_date IS NULL;

-- Index for matter created date range queries
CREATE INDEX IF NOT EXISTS idx_matters_created_at
ON matters(created_at DESC);

-- Index for tags array queries (GIN index for array contains)
CREATE INDEX IF NOT EXISTS idx_matters_tags
ON matters USING GIN(tags);

-- Composite index for matter status history queries
CREATE INDEX IF NOT EXISTS idx_matter_status_history_composite
ON matter_status_history(matter_id, created_at DESC);

-- Index for user role queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- Index for audit log user queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
ON audit_logs(user_id, created_at DESC);

-- Index for audit configuration queries (skipped - table has different structure)

-- Update table statistics after index creation
ANALYZE matters;
ANALYZE users;
ANALYZE matter_status_history;
ANALYZE audit_logs;
ANALYZE audit_configuration;