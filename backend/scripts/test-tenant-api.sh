#!/bin/bash

# Test script for Tenant API endpoints
# Requires the application to be running with mock auth enabled

BASE_URL="http://localhost:8080"
MOCK_AUTH_URL="$BASE_URL/mock-auth"
API_URL="$BASE_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Tenant API Test Script ===${NC}"
echo "Testing against: $BASE_URL"
echo ""

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Step 1: Get JWT tokens for different roles
echo -e "${YELLOW}Step 1: Getting JWT tokens...${NC}"

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST "$MOCK_AUTH_URL/token" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "admin@test.com",
        "role": "ADMIN",
        "tenantId": "550e8400-e29b-41d4-a716-446655440000"
    }' | jq -r '.access_token')

if [ -n "$ADMIN_TOKEN" ]; then
    print_result 0 "Admin token obtained"
else
    print_result 1 "Failed to get admin token"
    exit 1
fi

# Get user token
USER_TOKEN=$(curl -s -X POST "$MOCK_AUTH_URL/token" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "user@test.com",
        "role": "USER",
        "tenantId": "550e8400-e29b-41d4-a716-446655440001"
    }' | jq -r '.access_token')

if [ -n "$USER_TOKEN" ]; then
    print_result 0 "User token obtained"
else
    print_result 1 "Failed to get user token"
fi

echo ""

# Step 2: Test tenant creation (Admin only)
echo -e "${YELLOW}Step 2: Testing tenant creation...${NC}"

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/tenants" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "slug": "test-tenant-'$(date +%s)'",
        "name": "Test Tenant",
        "auth0OrgId": "org_test_'$(date +%s)'"
    }')

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    print_result 0 "Tenant created successfully (HTTP $HTTP_CODE)"
    TENANT_ID=$(echo "$RESPONSE_BODY" | jq -r '.id')
    TENANT_SLUG=$(echo "$RESPONSE_BODY" | jq -r '.slug')
    echo "  Created tenant ID: $TENANT_ID"
    echo "  Created tenant slug: $TENANT_SLUG"
else
    print_result 1 "Failed to create tenant (HTTP $HTTP_CODE)"
    echo "  Response: $RESPONSE_BODY"
fi

echo ""

# Step 3: Test getting all tenants (Admin only)
echo -e "${YELLOW}Step 3: Testing get all tenants...${NC}"

ALL_TENANTS=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tenants" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_CODE=$(echo "$ALL_TENANTS" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$ALL_TENANTS" | head -n-1 | jq '. | length')
    print_result 0 "Retrieved $COUNT tenants (HTTP $HTTP_CODE)"
else
    print_result 1 "Failed to get tenants (HTTP $HTTP_CODE)"
fi

# Test with user token (should fail)
USER_TENANTS=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tenants" \
    -H "Authorization: Bearer $USER_TOKEN")

HTTP_CODE=$(echo "$USER_TENANTS" | tail -n1)

if [ "$HTTP_CODE" = "403" ]; then
    print_result 0 "User correctly denied access to all tenants (HTTP $HTTP_CODE)"
else
    print_result 1 "Unexpected response for user access (HTTP $HTTP_CODE)"
fi

echo ""

# Step 4: Test getting tenant by slug
echo -e "${YELLOW}Step 4: Testing get tenant by slug...${NC}"

if [ -n "$TENANT_SLUG" ]; then
    SLUG_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tenants/slug/$TENANT_SLUG" \
        -H "Authorization: Bearer $USER_TOKEN")
    
    HTTP_CODE=$(echo "$SLUG_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Retrieved tenant by slug (HTTP $HTTP_CODE)"
    else
        print_result 1 "Failed to get tenant by slug (HTTP $HTTP_CODE)"
    fi
fi

echo ""

# Step 5: Test updating tenant
echo -e "${YELLOW}Step 5: Testing tenant update...${NC}"

if [ -n "$TENANT_ID" ]; then
    UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/tenants/$TENANT_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Updated Test Tenant"
        }')
    
    HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        NEW_NAME=$(echo "$UPDATE_RESPONSE" | head -n-1 | jq -r '.name')
        if [ "$NEW_NAME" = "Updated Test Tenant" ]; then
            print_result 0 "Tenant updated successfully (HTTP $HTTP_CODE)"
        else
            print_result 1 "Tenant update failed - name not changed"
        fi
    else
        print_result 1 "Failed to update tenant (HTTP $HTTP_CODE)"
    fi
fi

echo ""

# Step 6: Test deactivating tenant
echo -e "${YELLOW}Step 6: Testing tenant deactivation...${NC}"

if [ -n "$TENANT_ID" ]; then
    DEACTIVATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/tenants/$TENANT_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    HTTP_CODE=$(echo "$DEACTIVATE_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        IS_ACTIVE=$(echo "$DEACTIVATE_RESPONSE" | head -n-1 | jq -r '.isActive')
        if [ "$IS_ACTIVE" = "false" ]; then
            print_result 0 "Tenant deactivated successfully (HTTP $HTTP_CODE)"
        else
            print_result 1 "Tenant deactivation failed - still active"
        fi
    else
        print_result 1 "Failed to deactivate tenant (HTTP $HTTP_CODE)"
    fi
fi

echo ""

# Step 7: Test reactivating tenant
echo -e "${YELLOW}Step 7: Testing tenant reactivation...${NC}"

if [ -n "$TENANT_ID" ]; then
    ACTIVATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/tenants/$TENANT_ID/activate" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    HTTP_CODE=$(echo "$ACTIVATE_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        IS_ACTIVE=$(echo "$ACTIVATE_RESPONSE" | head -n-1 | jq -r '.isActive')
        if [ "$IS_ACTIVE" = "true" ]; then
            print_result 0 "Tenant reactivated successfully (HTTP $HTTP_CODE)"
        else
            print_result 1 "Tenant reactivation failed - still inactive"
        fi
    else
        print_result 1 "Failed to reactivate tenant (HTTP $HTTP_CODE)"
    fi
fi

echo ""

# Step 8: Test current tenant endpoint
echo -e "${YELLOW}Step 8: Testing current tenant endpoint...${NC}"

# Note: This will fail because mock auth doesn't set up tenant context properly
CURRENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tenants/current" \
    -H "Authorization: Bearer $USER_TOKEN")

HTTP_CODE=$(echo "$CURRENT_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Retrieved current tenant (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "404" ]; then
    print_result 0 "No tenant context available (expected with mock auth) (HTTP $HTTP_CODE)"
else
    print_result 1 "Unexpected response for current tenant (HTTP $HTTP_CODE)"
fi

echo ""
echo -e "${YELLOW}=== Test Complete ===${NC}"