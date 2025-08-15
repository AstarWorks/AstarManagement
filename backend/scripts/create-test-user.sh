#!/bin/bash
# Create test user directly in database

set -e

echo "Creating test user in database..."

# Configuration
DB_HOST="172.17.0.1"
DB_PORT="5433"
DB_USER="postgres"
DB_NAME="astarmanagement_dev"
TENANT_ID="aaaaaaaa-bbbb-cccc-dddd-000000000001"

# BCrypt hash for password "password123" 
# Generated using: https://bcrypt-generator.com/
PASSWORD_HASH='$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l4bVeQgDL6aZCPFgPRmfwh5mYnS'

PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- First check if user exists
SELECT id, email, first_name, last_name, role FROM users WHERE email = 'test@example.com';

-- Delete existing user if exists
DELETE FROM users WHERE email = 'test@example.com';

-- Create test user
INSERT INTO users (
    id,
    tenant_id,
    username,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '$TENANT_ID'::UUID,
    'testuser',
    'test@example.com',
    '$PASSWORD_HASH',
    'Test',
    'User',
    'LAWYER',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Verify user was created
SELECT id, email, first_name, last_name, role FROM users WHERE email = 'test@example.com';

-- Also create an admin user
INSERT INTO users (
    id,
    tenant_id,
    username,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '$TENANT_ID'::UUID,
    'adminuser',
    'admin@example.com',
    '$PASSWORD_HASH',
    'Admin',
    'User',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create some test expenses
DO \$\$
DECLARE
    user_id UUID;
    expense_id UUID;
BEGIN
    SELECT id INTO user_id FROM users WHERE email = 'test@example.com';
    
    -- Create expense 1
    INSERT INTO expenses (
        id, tenant_id, created_by, updated_by, date, description, 
        expense_amount, income_amount, balance, category, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), '$TENANT_ID'::UUID, user_id, user_id, CURRENT_DATE - INTERVAL '2 days', 
        '電車代（東京→横浜）', 1500.00, 0, -1500.00, 'TRANSPORTATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
    
    -- Create expense 2
    INSERT INTO expenses (
        id, tenant_id, created_by, updated_by, date, description, 
        expense_amount, income_amount, balance, category, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), '$TENANT_ID'::UUID, user_id, user_id, CURRENT_DATE - INTERVAL '1 day', 
        'タクシー代', 3200.00, 0, -4700.00, 'TRANSPORTATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
    
    -- Create income
    INSERT INTO expenses (
        id, tenant_id, created_by, updated_by, date, description, 
        expense_amount, income_amount, balance, category, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), '$TENANT_ID'::UUID, user_id, user_id, CURRENT_DATE, 
        '顧問料入金', 0, 50000.00, 45300.00, 'INCOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Created test expenses for user %', user_id;
END\$\$;

-- Show summary
SELECT 
    'Users created' as type,
    COUNT(*) as count
FROM users
WHERE tenant_id = '$TENANT_ID'::UUID
UNION ALL
SELECT 
    'Expenses created' as type,
    COUNT(*) as count
FROM expenses
WHERE tenant_id = '$TENANT_ID'::UUID;

EOF

echo "Test data created successfully!"