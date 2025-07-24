-- SQL validation script to verify database schema structure
-- This can be run directly against PostgreSQL to validate the migrations

-- Check that all expected tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'matters', 'matter_status_history', 'matter_audit_log', 'documents', 'memos', 'expenses')
ORDER BY table_name;

-- Check user table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check matters table structure  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'matters'
ORDER BY ordinal_position;

-- Check indexes exist
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'matters', 'matter_status_history')
ORDER BY tablename, indexname;

-- Check constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'matters', 'matter_status_history')
ORDER BY tc.table_name, tc.constraint_type;

-- Check foreign key relationships
SELECT 
    kcu1.table_name AS foreign_table,
    kcu1.column_name AS foreign_column,
    kcu2.table_name AS primary_table,
    kcu2.column_name AS primary_column,
    rc.constraint_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu1 
    ON rc.constraint_name = kcu1.constraint_name
JOIN information_schema.key_column_usage kcu2 
    ON rc.unique_constraint_name = kcu2.constraint_name
WHERE kcu1.table_schema = 'public'
ORDER BY kcu1.table_name, kcu1.column_name;