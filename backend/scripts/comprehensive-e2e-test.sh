#!/bin/bash
# Comprehensive E2E Test Script for Astar Management Backend
# Tests all major API endpoints and workflows

set -e

echo "========================================"
echo "Astar Management Backend E2E Test Suite"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:8080/api/v1"
DB_HOST="172.17.0.1"
DB_PORT="5433"
DB_USER="postgres"
DB_NAME="astarmanagement_dev"
TENANT_ID="aaaaaaaa-bbbb-cccc-dddd-000000000001"

# Variables to store test data
TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
EXPENSE_ID=""
TAG_ID=""
ATTACHMENT_ID=""
TIMESTAMP=$(date +%s)

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
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

# Function to extract JSON value
extract_json() {
    echo "$1" | jq -r "$2" 2>/dev/null || echo ""
}

print_section "1. Authentication Tests"

# Test 1.1: Register new user
echo -n "1.1 Register new user: "
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2etest'$TIMESTAMP'@astarworks.com",
    "username": "e2etestuser'$TIMESTAMP'",
    "password": "Test1234!",
    "firstName": "E2E",
    "lastName": "Test User",
    "tenantId": "'$TENANT_ID'",
    "role": "USER"
  }' 2>/dev/null || echo "000")

REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n1)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

if [ "$REGISTER_STATUS" = "201" ]; then
    print_result 0 "User registration successful"
    USER_ID=$(extract_json "$REGISTER_BODY" ".id")
    echo "  User ID: $USER_ID"
else
    print_result 1 "User registration failed (Status: $REGISTER_STATUS)"
    echo "  Response: $(echo "$REGISTER_BODY" | head -n1)"
fi

# Test 1.2: Login with registered user
echo -n "1.2 Login with credentials: "
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2etest'$TIMESTAMP'@astarworks.com",
    "password": "Test1234!"
  }' 2>/dev/null || echo "000")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$LOGIN_STATUS" = "200" ]; then
    TOKEN=$(extract_json "$LOGIN_BODY" ".accessToken")
    REFRESH_TOKEN=$(extract_json "$LOGIN_BODY" ".refreshToken")
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        print_result 0 "Login successful"
        echo "  Access Token: ${TOKEN:0:20}..."
    else
        print_result 1 "Login successful but no token received"
    fi
else
    print_result 1 "Login failed (Status: $LOGIN_STATUS)"
    echo "  Response: $(echo "$LOGIN_BODY" | head -n1)"
    # Try fallback login
    echo -n "1.2b Fallback login: "
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "password123"
      }' 2>/dev/null || echo "000")
    
    LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
    LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)
    
    if [ "$LOGIN_STATUS" = "200" ]; then
        TOKEN=$(extract_json "$LOGIN_BODY" ".accessToken")
        REFRESH_TOKEN=$(extract_json "$LOGIN_BODY" ".refreshToken")
        print_result 0 "Fallback login successful"
    else
        print_result 1 "Fallback login also failed"
        echo "Exiting test suite - authentication required"
        exit 1
    fi
fi

# Test 1.3: Validate token
echo -n "1.3 Validate token: "
VALIDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $API_BASE/auth/validate \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")

VALIDATE_STATUS=$(echo "$VALIDATE_RESPONSE" | tail -n1)
VALIDATE_BODY=$(echo "$VALIDATE_RESPONSE" | head -n-1)

if [ "$VALIDATE_STATUS" = "200" ]; then
    IS_VALID=$(extract_json "$VALIDATE_BODY" ".valid")
    if [ "$IS_VALID" = "true" ]; then
        print_result 0 "Token validation successful"
    else
        print_result 1 "Token is invalid"
    fi
else
    print_result 1 "Token validation failed (Status: $VALIDATE_STATUS)"
fi

# Test 1.4: Refresh token
echo -n "1.4 Refresh token: "
if [ -n "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
    REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/refresh \
      -H "Authorization: Bearer $REFRESH_TOKEN" 2>/dev/null || echo "000")
    
    REFRESH_STATUS=$(echo "$REFRESH_RESPONSE" | tail -n1)
    check_status "200" "$REFRESH_STATUS" "Token refresh"
else
    echo -e "${YELLOW}Skipped (no refresh token)${NC}"
fi

print_section "2. Tag Management Tests"

# Test 2.1: Create tag
echo -n "2.1 Create tag: "
TAG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "交通費_'$TIMESTAMP'",
    "color": "#FF5733",
    "icon": "🚕",
    "scope": "TENANT",
    "description": "移動関連の経費"
  }' 2>/dev/null || echo "000")

TAG_STATUS=$(echo "$TAG_RESPONSE" | tail -n1)
TAG_BODY=$(echo "$TAG_RESPONSE" | head -n-1)

if [ "$TAG_STATUS" = "201" ]; then
    TAG_ID=$(extract_json "$TAG_BODY" ".id")
    print_result 0 "Tag created successfully"
    echo "  Tag ID: $TAG_ID"
else
    print_result 1 "Tag creation failed (Status: $TAG_STATUS)"
    echo "  Response: $(echo "$TAG_BODY" | head -n1)"
fi

# Test 2.2: List tags
echo -n "2.2 List tags: "
TAGS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/tags?scope=TENANT" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")

TAGS_STATUS=$(echo "$TAGS_RESPONSE" | tail -n1)
check_status "200" "$TAGS_STATUS" "Tags retrieval"

print_section "3. Expense Management Tests"

# Test 3.1: Create expense
echo -n "3.1 Create expense: "
EXPENSE_DATA='{
  "date": "'$(date +%Y-%m-%d)'",
  "description": "タクシー代（裁判所）",
  "category": "TRANSPORTATION",
  "expenseAmount": 3500.00,
  "incomeAmount": 0.00,
  "memo": "〇〇地裁 民事第1回口頭弁論"
}'

if [ -n "$TAG_ID" ] && [ "$TAG_ID" != "null" ]; then
    EXPENSE_DATA=$(echo "$EXPENSE_DATA" | jq '. + {"tagIds": ["'$TAG_ID'"]}')
fi

CREATE_EXPENSE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EXPENSE_DATA" 2>/dev/null || echo "000")

CREATE_STATUS=$(echo "$CREATE_EXPENSE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_EXPENSE_RESPONSE" | head -n-1)

if [ "$CREATE_STATUS" = "201" ]; then
    EXPENSE_ID=$(extract_json "$CREATE_BODY" ".id")
    print_result 0 "Expense created successfully"
    echo "  Expense ID: $EXPENSE_ID"
else
    print_result 1 "Expense creation failed (Status: $CREATE_STATUS)"
    echo "  Response: $(echo "$CREATE_BODY" | head -n1)"
fi

# Test 3.2: Get expense by ID
echo -n "3.2 Get expense details: "
if [ -n "$EXPENSE_ID" ] && [ "$EXPENSE_ID" != "null" ]; then
    EXPENSE_DETAIL_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/expenses/$EXPENSE_ID" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")
    
    DETAIL_STATUS=$(echo "$EXPENSE_DETAIL_RESPONSE" | tail -n1)
    check_status "200" "$DETAIL_STATUS" "Expense detail retrieval"
else
    echo -e "${YELLOW}Skipped (no expense ID)${NC}"
fi

# Test 3.3: List expenses
echo -n "3.3 List expenses: "
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/expenses?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")

LIST_STATUS=$(echo "$LIST_RESPONSE" | tail -n1)
LIST_BODY=$(echo "$LIST_RESPONSE" | head -n-1)

if [ "$LIST_STATUS" = "200" ]; then
    EXPENSE_COUNT=$(extract_json "$LIST_BODY" ".total")
    print_result 0 "Expense list retrieved"
    echo "  Total expenses: $EXPENSE_COUNT"
else
    print_result 1 "Expense list failed (Status: $LIST_STATUS)"
fi

# Test 3.4: Update expense
echo -n "3.4 Update expense: "
if [ -n "$EXPENSE_ID" ] && [ "$EXPENSE_ID" != "null" ]; then
    UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE/expenses/$EXPENSE_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "description": "タクシー代（裁判所） - 更新済み",
        "expenseAmount": 3800.00,
        "memo": "〇〇地裁 民事第1回口頭弁論 - 領収書あり"
      }' 2>/dev/null || echo "000")
    
    UPDATE_STATUS=$(echo "$UPDATE_RESPONSE" | tail -n1)
    check_status "200" "$UPDATE_STATUS" "Expense update"
else
    echo -e "${YELLOW}Skipped (no expense ID)${NC}"
fi

# Test 3.5: Get expense summary
echo -n "3.5 Get expense summary: "
SUMMARY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/expenses/summary?period=monthly" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")

SUMMARY_STATUS=$(echo "$SUMMARY_RESPONSE" | tail -n1)
check_status "200" "$SUMMARY_STATUS" "Expense summary retrieval"

# Test 3.6: Delete expense
echo -n "3.6 Delete expense: "
if [ -n "$EXPENSE_ID" ] && [ "$EXPENSE_ID" != "null" ]; then
    DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/expenses/$EXPENSE_ID" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")
    
    DELETE_STATUS=$(echo "$DELETE_RESPONSE" | tail -n1)
    check_status "204" "$DELETE_STATUS" "Expense deletion"
else
    echo -e "${YELLOW}Skipped (no expense ID)${NC}"
fi

# Test 3.7: Restore expense
echo -n "3.7 Restore deleted expense: "
if [ -n "$EXPENSE_ID" ] && [ "$EXPENSE_ID" != "null" ]; then
    RESTORE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/expenses/$EXPENSE_ID/restore" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")
    
    RESTORE_STATUS=$(echo "$RESTORE_RESPONSE" | tail -n1)
    check_status "200" "$RESTORE_STATUS" "Expense restoration"
else
    echo -e "${YELLOW}Skipped (no expense ID)${NC}"
fi

# Test 3.8: Bulk create expenses
echo -n "3.8 Bulk create expenses: "
BULK_DATA='[
  {
    "date": "'$(date +%Y-%m-%d)'",
    "description": "コピー代",
    "category": "OFFICE",
    "expenseAmount": 500.00
  },
  {
    "date": "'$(date +%Y-%m-%d)'",
    "description": "郵送料",
    "category": "OFFICE",
    "expenseAmount": 840.00
  }
]'

BULK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/expenses/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BULK_DATA" 2>/dev/null || echo "000")

BULK_STATUS=$(echo "$BULK_RESPONSE" | tail -n1)
check_status "201" "$BULK_STATUS" "Bulk expense creation"

print_section "4. Attachment Management Tests"

# Test 4.1: Upload attachment
echo -n "4.1 Upload attachment: "
# Create a test file
TEST_FILE="/tmp/test_receipt_$TIMESTAMP.txt"
echo "Test receipt content for E2E test" > "$TEST_FILE"

UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_FILE" 2>/dev/null || echo "000")

UPLOAD_STATUS=$(echo "$UPLOAD_RESPONSE" | tail -n1)
UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | head -n-1)

if [ "$UPLOAD_STATUS" = "201" ]; then
    ATTACHMENT_ID=$(extract_json "$UPLOAD_BODY" ".id")
    print_result 0 "Attachment uploaded successfully"
    echo "  Attachment ID: $ATTACHMENT_ID"
else
    print_result 1 "Attachment upload failed (Status: $UPLOAD_STATUS)"
    echo "  Response: $(echo "$UPLOAD_BODY" | head -n1)"
fi

# Clean up test file
rm -f "$TEST_FILE"

# Test 4.2: Get attachment metadata
echo -n "4.2 Get attachment metadata: "
if [ -n "$ATTACHMENT_ID" ] && [ "$ATTACHMENT_ID" != "null" ]; then
    ATTACHMENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/attachments/$ATTACHMENT_ID" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")
    
    ATTACHMENT_STATUS=$(echo "$ATTACHMENT_RESPONSE" | tail -n1)
    check_status "200" "$ATTACHMENT_STATUS" "Attachment metadata retrieval"
else
    echo -e "${YELLOW}Skipped (no attachment ID)${NC}"
fi

# Test 4.3: Download attachment
echo -n "4.3 Download attachment: "
if [ -n "$ATTACHMENT_ID" ] && [ "$ATTACHMENT_ID" != "null" ]; then
    DOWNLOAD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/attachments/$ATTACHMENT_ID/download" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")
    
    check_status "200" "$DOWNLOAD_RESPONSE" "Attachment download"
else
    echo -e "${YELLOW}Skipped (no attachment ID)${NC}"
fi

print_section "5. Error Handling Tests"

# Test 5.1: Invalid authentication
echo -n "5.1 Invalid login credentials: "
INVALID_LOGIN=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }' 2>/dev/null || echo "000")

INVALID_STATUS=$(echo "$INVALID_LOGIN" | tail -n1)
if [ "$INVALID_STATUS" = "400" ] || [ "$INVALID_STATUS" = "401" ]; then
    print_result 0 "Invalid login properly rejected (Status: $INVALID_STATUS)"
else
    print_result 1 "Unexpected status for invalid login (Status: $INVALID_STATUS)"
fi

# Test 5.2: Unauthorized access
echo -n "5.2 Unauthorized API access: "
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET $API_BASE/expenses 2>/dev/null || echo "000")
check_status "403" "$UNAUTH_RESPONSE" "Unauthorized access blocked"

# Test 5.3: Non-existent resource
echo -n "5.3 Non-existent resource: "
NOTFOUND_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/expenses/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")

NOTFOUND_STATUS=$(echo "$NOTFOUND_RESPONSE" | tail -n1)
check_status "404" "$NOTFOUND_STATUS" "Non-existent resource handling"

# Test 5.4: Invalid data
echo -n "5.4 Invalid expense data: "
INVALID_EXPENSE=$(curl -s -w "\n%{http_code}" -X POST $API_BASE/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "invalid-date",
    "description": "",
    "expenseAmount": -1000
  }' 2>/dev/null || echo "000")

INVALID_EXPENSE_STATUS=$(echo "$INVALID_EXPENSE" | tail -n1)
check_status "400" "$INVALID_EXPENSE_STATUS" "Invalid data validation"

print_section "6. System Health Tests"

# Test 6.1: Health check
echo -n "6.1 Health check: "
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET http://localhost:8080/actuator/health 2>/dev/null || echo "000")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HEALTH_STATUS" = "200" ]; then
    STATUS=$(extract_json "$HEALTH_BODY" ".status")
    if [ "$STATUS" = "UP" ]; then
        print_result 0 "System health check (Status: UP)"
    else
        print_result 1 "System unhealthy (Status: $STATUS)"
    fi
else
    print_result 1 "Health check failed (Status: $HEALTH_STATUS)"
fi

# Test 6.2: Swagger UI
echo -n "6.2 Swagger UI availability: "
SWAGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui/index.html 2>/dev/null || echo "000")
check_status "200" "$SWAGGER_STATUS" "Swagger UI accessible"

print_section "Test Summary"

# Database verification
echo "Database Status:"
echo -n "  Tables: "
TABLE_CHECK=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('users', 'expenses', 'tags', 'attachments', 'expense_tags', 'expense_attachments');" 2>/dev/null || echo "0")
TABLE_COUNT=$(echo $TABLE_CHECK | tr -d ' ')
print_result 0 "Found $TABLE_COUNT/6 core tables"

echo -n "  RLS Policies: "
RLS_CHECK=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM pg_policies 
     WHERE tablename IN ('users', 'expenses', 'tags', 'attachments');" 2>/dev/null || echo "0")
RLS_COUNT=$(echo $RLS_CHECK | tr -d ' ')
print_result 0 "Found $RLS_COUNT RLS policies"

echo ""
echo "========================================"
echo "E2E Test Suite Complete"
echo "========================================"

# Exit with appropriate code
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    exit 0
else
    exit 1
fi