#!/bin/bash
# E2E Test Script for S02_M002 Backend
# Tests authentication and basic API functionality

set -e

echo "=== S02_M002 Backend E2E Test ==="
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:8080/api/v1"
DB_HOST="172.17.0.1"
DB_PORT="5433"
DB_USER="postgres"
DB_NAME="astarmanagement_dev"
TENANT_ID="aaaaaaaa-bbbb-cccc-dddd-000000000001"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to check HTTP status
check_status() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$actual" = "$expected" ]; then
        print_result 0 "$test_name (Status: $actual)"
        return 0
    else
        print_result 1 "$test_name (Expected: $expected, Got: $actual)"
        return 1
    fi
}

echo "1. Authentication Tests"
echo "----------------------"

# Test 1.1: Register new user (with correct field names including username)
echo -n "1.1 Register new user: "
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2etest'$TIMESTAMP'@astarworks.com",
    "username": "e2etestuser'$TIMESTAMP'",
    "password": "Test1234",
    "firstName": "E2E",
    "lastName": "Test User",
    "tenantId": "'$TENANT_ID'"
  }' 2>/dev/null || echo "000")

REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n1)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

if [ "$REGISTER_STATUS" = "201" ] || [ "$REGISTER_STATUS" = "409" ]; then
    print_result 0 "User registration (Status: $REGISTER_STATUS)"
else
    print_result 1 "User registration failed (Status: $REGISTER_STATUS)"
    echo "Response: $REGISTER_BODY" | head -n3
fi

# Test 1.2: Login with test user (if registration failed, try existing user)
echo -n "1.2 Login test user: "
if [ "$REGISTER_STATUS" = "201" ] || [ "$REGISTER_STATUS" = "200" ]; then
    # Try to login with the newly registered user
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "e2etest'$TIMESTAMP'@astarworks.com",
        "password": "Test1234"
      }' 2>/dev/null || echo "000")
else
    # Try to login with existing test user (created by our script)
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "password123"
      }' 2>/dev/null || echo "000")
fi

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$LOGIN_STATUS" = "200" ]; then
    TOKEN=$(echo "$LOGIN_BODY" | jq -r '.accessToken // .token // ""' 2>/dev/null || echo "")
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        print_result 0 "Login successful"
        echo "  Token received: ${TOKEN:0:20}..."
    else
        print_result 1 "Login successful but no token received"
        echo "Response: $LOGIN_BODY" | head -n3
    fi
else
    print_result 1 "Login failed (Status: $LOGIN_STATUS)"
    echo "Response: $LOGIN_BODY" | head -n3
fi

echo ""
echo "2. API Endpoint Tests"
echo "--------------------"

# Test 2.1: Expenses API without auth
echo -n "2.1 Expenses API (no auth): "
EXPENSE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/expenses 2>/dev/null || echo "000")
check_status "403" "$EXPENSE_STATUS" "Unauthorized access blocked"

# Test 2.2: Swagger UI
echo -n "2.2 Swagger UI availability: "
SWAGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui/index.html 2>/dev/null || echo "000")
check_status "200" "$SWAGGER_STATUS" "Swagger UI accessible"

# Test 2.3: Actuator health
echo -n "2.3 Actuator health: "
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null || echo "000")
check_status "200" "$HEALTH_STATUS" "Health endpoint"

# Test 2.4: Expense API with authentication (if we have a token)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -n "2.4 Expenses API (with auth): "
    EXPENSE_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $API_BASE/expenses \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo -e "\n000")
    EXPENSE_AUTH_STATUS=$(echo "$EXPENSE_AUTH_RESPONSE" | tail -n1)
    if [ "$EXPENSE_AUTH_STATUS" = "200" ]; then
        print_result 0 "Authenticated expense list access"
        EXPENSE_COUNT=$(echo "$EXPENSE_AUTH_RESPONSE" | head -n-1 | jq -r '.content | length' 2>/dev/null || echo "0")
        echo "  Found $EXPENSE_COUNT expenses"
    else
        print_result 1 "Authenticated expense access failed (Status: $EXPENSE_AUTH_STATUS)"
        echo "$EXPENSE_AUTH_RESPONSE" | head -n-1 | head -n3
    fi
    
    # Test 2.5: Create new expense
    echo -n "2.5 Create expense (with auth): "
    CREATE_EXPENSE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/expenses \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "date": "'$(date +%Y-%m-%d)'",
        "description": "E2E Test Expense",
        "category": "OFFICE",
        "expenseAmount": 2500.00
      }' 2>/dev/null || echo -e "\n000")
    CREATE_STATUS=$(echo "$CREATE_EXPENSE_RESPONSE" | tail -n1)
    if [ "$CREATE_STATUS" = "201" ] || [ "$CREATE_STATUS" = "200" ]; then
        print_result 0 "Expense creation"
        EXPENSE_ID=$(echo "$CREATE_EXPENSE_RESPONSE" | head -n-1 | jq -r '.id' 2>/dev/null || echo "")
        echo "  Created expense ID: $EXPENSE_ID"
    else
        print_result 1 "Expense creation failed (Status: $CREATE_STATUS)"
        echo "$CREATE_EXPENSE_RESPONSE" | head -n-1 | head -n3
    fi
else
    echo "2.4-2.5 Skipping authenticated API tests (no valid token)"
fi

echo ""
echo "3. Database Verification"
echo "-----------------------"

# Test 3.1: Check tables exist
echo "3.1 Checking expense-related tables:"
TABLE_CHECK=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('expenses', 'tags', 'attachments', 'expense_tags', 'expense_attachments');" 2>/dev/null || echo "0")

TABLE_COUNT=$(echo $TABLE_CHECK | tr -d ' ')
if [ "$TABLE_COUNT" = "5" ]; then
    print_result 0 "All expense tables exist ($TABLE_COUNT/5)"
else
    print_result 1 "Missing tables (Found: $TABLE_COUNT/5)"
fi

# Test 3.2: Check RLS policies
echo "3.2 Checking RLS policies:"
RLS_CHECK=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM pg_policies 
     WHERE tablename IN ('expenses', 'tags', 'attachments');" 2>/dev/null || echo "0")

RLS_COUNT=$(echo $RLS_CHECK | tr -d ' ')
if [ "$RLS_COUNT" -gt "0" ]; then
    print_result 0 "RLS policies exist (Count: $RLS_COUNT)"
else
    print_result 1 "No RLS policies found"
fi

# Test 3.3: Check indexes
echo "3.3 Checking performance indexes:"
INDEX_CHECK=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename IN ('expenses', 'tags', 'attachments') 
     AND indexname LIKE 'idx_%';" 2>/dev/null || echo "0")

INDEX_COUNT=$(echo $INDEX_CHECK | tr -d ' ')
if [ "$INDEX_COUNT" -gt "0" ]; then
    print_result 0 "Performance indexes exist (Count: $INDEX_COUNT)"
else
    print_result 1 "No performance indexes found"
fi

echo ""
echo "4. Integration Test Summary"
echo "--------------------------"

# Run Spring Boot integration tests
echo "4.1 Running backend integration tests:"
cd /IdeaProjects/AstarManagement/backend

# Check if we can run tests
if command -v ./gradlew &> /dev/null; then
    echo "  Executing AttachmentRepositoryIntegrationTest..."
    ./gradlew test --tests "*.AttachmentRepositoryIntegrationTest" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        print_result 0 "AttachmentRepository tests passed"
    else
        print_result 1 "AttachmentRepository tests failed"
    fi
    
    echo "  Executing TagRepositoryIntegrationTest..."
    ./gradlew test --tests "*.TagRepositoryIntegrationTest" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        print_result 0 "TagRepository tests passed"
    else
        print_result 1 "TagRepository tests failed"
    fi
else
    echo -e "${YELLOW}  Skipping Gradle tests (gradlew not found)${NC}"
fi

echo ""
echo "================================="
echo "E2E Test Complete"
echo "================================="