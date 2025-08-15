#!/bin/bash
# Direct Expense API Test Script
# Tests expense-related endpoints and database functionality

set -e

echo "=== Direct Expense API Test ==="
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DB_HOST="172.17.0.1"
DB_PORT="5433"
DB_USER="postgres"
DB_NAME="astarmanagement_dev"
TENANT_ID="aaaaaaaa-bbbb-cccc-dddd-000000000001"

echo "1. Database Direct Tests"
echo "-----------------------"

# Test database schema
PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Set output format
\echo '1.1 Expense Tables Structure:'
\echo '----------------------------'

-- Check expenses table
\d expenses

\echo ''
\echo '1.2 Tag Tables Structure:'
\echo '------------------------'

-- Check tags table
\d tags

\echo ''
\echo '1.3 Attachment Tables Structure:'
\echo '-------------------------------'

-- Check attachments table
\d attachments

\echo ''
\echo '1.4 RLS Policies:'
\echo '----------------'

-- List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('expenses', 'tags', 'attachments')
ORDER BY tablename, policyname;

\echo ''
\echo '1.5 Performance Indexes:'
\echo '-----------------------'

-- List all indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('expenses', 'tags', 'attachments')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''
\echo '1.6 Test Data Check:'
\echo '-------------------'

-- Set tenant context
SELECT set_config('app.current_tenant_id', '$TENANT_ID', false);

-- Count existing data
SELECT 
    'expenses' as table_name,
    COUNT(*) as row_count
FROM expenses
UNION ALL
SELECT 
    'tags' as table_name,
    COUNT(*) as row_count
FROM tags
UNION ALL
SELECT 
    'attachments' as table_name,
    COUNT(*) as row_count
FROM attachments;

\echo ''
\echo '1.7 Tenant Isolation Test:'
\echo '-------------------------'

-- Test with different tenant
SELECT set_config('app.current_tenant_id', 'ffffffff-ffff-ffff-ffff-ffffffffffff', false);
SELECT 'Different tenant expenses count: ' || COUNT(*) FROM expenses;

-- Reset to default tenant
SELECT set_config('app.current_tenant_id', '$TENANT_ID', false);
SELECT 'Default tenant expenses count: ' || COUNT(*) FROM expenses;

EOF

echo ""
echo "2. API Endpoint Discovery"
echo "------------------------"

# Check available endpoints via actuator
echo "2.1 Checking Spring Boot Actuator mappings:"
MAPPINGS=$(curl -s http://localhost:8080/actuator/mappings 2>/dev/null || echo "{}")

if [ "$MAPPINGS" != "{}" ]; then
    echo "$MAPPINGS" | jq -r '.contexts.application.mappings.dispatcherServlets.dispatcherServlet[] | 
        select(.predicate.methods != null) | 
        "\(.predicate.methods[0] // "GET") \(.predicate.patterns[0])"' 2>/dev/null | 
        grep -E "(expense|tag|attachment)" | sort -u || echo "No expense endpoints found in actuator"
else
    echo -e "${YELLOW}Actuator mappings not available${NC}"
fi

echo ""
echo "3. Sample Data Creation Test"
echo "---------------------------"

# Create sample data directly in database
echo "3.1 Creating test expense data:"
PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Set tenant context
SELECT set_config('app.current_tenant_id', '$TENANT_ID', false);

-- Get a valid user ID
DO \$\$
DECLARE
    user_id UUID;
    expense_id UUID;
    tag_id UUID;
BEGIN
    -- Get first user in tenant
    SELECT id INTO user_id FROM users WHERE tenant_id = '$TENANT_ID'::UUID LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        -- Create test expense
        INSERT INTO expenses (
            id, tenant_id, user_id, expense_date, description, 
            expense_amount, income_amount, balance, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), '$TENANT_ID'::UUID, user_id, CURRENT_DATE, 
            'E2E Test Expense', 1500.00, NULL, -1500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id INTO expense_id;
        
        RAISE NOTICE 'Created expense with ID: %', expense_id;
        
        -- Create test tag
        INSERT INTO tags (
            id, tenant_id, name, color, scope, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), '$TENANT_ID'::UUID, '🧪 Test Tag', '#FF5733', 
            'TENANT', user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id INTO tag_id;
        
        RAISE NOTICE 'Created tag with ID: %', tag_id;
        
        -- Link tag to expense
        INSERT INTO expense_tags (expense_id, tag_id, tagged_at, tagged_by)
        VALUES (expense_id, tag_id, CURRENT_TIMESTAMP, user_id);
        
        RAISE NOTICE 'Linked tag to expense';
    ELSE
        RAISE NOTICE 'No user found in tenant';
    END IF;
END\$\$;

-- Verify the data
SELECT 
    e.id,
    e.description,
    e.expense_amount,
    e.balance,
    COUNT(et.tag_id) as tag_count
FROM expenses e
LEFT JOIN expense_tags et ON e.id = et.expense_id
WHERE e.description = 'E2E Test Expense'
GROUP BY e.id, e.description, e.expense_amount, e.balance;

EOF

echo ""
echo "4. Performance Check"
echo "-------------------"

echo "4.1 Testing query performance:"
PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Set tenant context
SELECT set_config('app.current_tenant_id', '$TENANT_ID', false);

-- Test expense query with indexes
EXPLAIN ANALYZE
SELECT * FROM expenses 
WHERE tenant_id = '$TENANT_ID'::UUID 
ORDER BY expense_date DESC 
LIMIT 10;

EOF

echo ""
echo "==============================="
echo "Direct API Test Complete"
echo "==============================="