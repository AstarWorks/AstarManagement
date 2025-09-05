#!/bin/bash

# 認可（Authorization）テストスクリプト
# 使用方法: ./test-authorization.sh [BASE_URL]

# デフォルトのベースURL
BASE_URL=${1:-"http://localhost:8080"}

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo "========================================"
echo -e "${MAGENTA}      Authorization Test Suite${NC}"
echo "   Base URL: $BASE_URL"
echo "========================================"
echo ""

# テスト結果カウンター
total_tests=0
passed_tests=0
failed_tests=0

# テスト実行関数
run_authorization_test() {
    local description=$1
    local role=$2
    local endpoint=$3
    local expected_status=$4
    
    total_tests=$((total_tests + 1))
    echo -ne "${BLUE}[$total_tests] $description...${NC} "
    
    # トークン生成
    local token_response
    if [[ "$role" == "NONE" ]]; then
        token_response=""
    else
        token_response=$(curl -s -X POST "http://localhost:8080/mock-auth/token" -H "Content-Type: application/json" -d "{\"roles\": [\"$role\"]}" 2>/dev/null)
        if ! echo "$token_response" | jq -e '.access_token' > /dev/null 2>&1; then
            echo -e "${RED}✗ Token generation failed${NC}"
            failed_tests=$((failed_tests + 1))
            return 1
        fi
    fi
    
    # APIアクセステスト
    local status_code
    if [[ "$role" == "NONE" ]]; then
        # 認証なしでアクセス
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    else
        # 認証付きでアクセス
        local token=$(echo "$token_response" | jq -r '.access_token')
        status_code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    if [[ "$status_code" == "$expected_status" ]]; then
        echo -e "${GREEN}✓ Pass${NC} (${status_code})"
        passed_tests=$((passed_tests + 1))
    else
        echo -e "${RED}✗ Fail${NC} (Expected: ${expected_status}, Got: ${status_code})"
        failed_tests=$((failed_tests + 1))
    fi
}

# 1. 公開エンドポイントのテスト
echo -e "${YELLOW}[Section 1/7] Public Endpoint Tests${NC}"
echo "----------------------------------------"
run_authorization_test "Public endpoint (no auth)" "NONE" "/api/v1/auth/test/public" "200"
echo ""

# 2. 認証が必要なエンドポイント（ロール不問）のテスト
echo -e "${YELLOW}[Section 2/7] Authentication Required Tests${NC}"
echo "----------------------------------------"
run_authorization_test "Authenticated endpoint (no auth)" "NONE" "/api/v1/auth/test/authenticated" "401"
run_authorization_test "Authenticated endpoint (with ADMIN)" "ADMIN" "/api/v1/auth/test/authenticated" "200"
run_authorization_test "Authenticated endpoint (with USER)" "USER" "/api/v1/auth/test/authenticated" "200"
run_authorization_test "Authenticated endpoint (with VIEWER)" "VIEWER" "/api/v1/auth/test/authenticated" "200"
echo ""

# 3. ADMIN専用エンドポイントのテスト
echo -e "${YELLOW}[Section 3/7] ADMIN Role Authorization Tests${NC}"
echo "----------------------------------------"
run_authorization_test "Admin-only (no auth)" "NONE" "/api/v1/auth/test/admin-only" "401"
run_authorization_test "Admin-only (ADMIN role)" "ADMIN" "/api/v1/auth/test/admin-only" "200"
run_authorization_test "Admin-only (USER role)" "USER" "/api/v1/auth/test/admin-only" "403"
run_authorization_test "Admin-only (VIEWER role)" "VIEWER" "/api/v1/auth/test/admin-only" "403"
echo ""

# 4. USER専用エンドポイントのテスト
echo -e "${YELLOW}[Section 4/7] USER Role Authorization Tests${NC}"
echo "----------------------------------------"
run_authorization_test "User-only (no auth)" "NONE" "/api/v1/auth/test/user-only" "401"
run_authorization_test "User-only (USER role)" "USER" "/api/v1/auth/test/user-only" "200"
run_authorization_test "User-only (ADMIN role)" "ADMIN" "/api/v1/auth/test/user-only" "403"
run_authorization_test "User-only (VIEWER role)" "VIEWER" "/api/v1/auth/test/user-only" "403"
echo ""

# 5. VIEWER専用エンドポイントのテスト
echo -e "${YELLOW}[Section 5/7] VIEWER Role Authorization Tests${NC}"
echo "----------------------------------------"
run_authorization_test "Viewer-only (no auth)" "NONE" "/api/v1/auth/test/viewer-only" "401"
run_authorization_test "Viewer-only (VIEWER role)" "VIEWER" "/api/v1/auth/test/viewer-only" "200"
run_authorization_test "Viewer-only (ADMIN role)" "ADMIN" "/api/v1/auth/test/viewer-only" "403"
run_authorization_test "Viewer-only (USER role)" "USER" "/api/v1/auth/test/viewer-only" "403"
echo ""

# 6. 複数ロール許可エンドポイントのテスト
echo -e "${YELLOW}[Section 6/7] Multiple Role Authorization Tests${NC}"
echo "----------------------------------------"
run_authorization_test "Admin-or-User (no auth)" "NONE" "/api/v1/auth/test/admin-or-user" "401"
run_authorization_test "Admin-or-User (ADMIN role)" "ADMIN" "/api/v1/auth/test/admin-or-user" "200"
run_authorization_test "Admin-or-User (USER role)" "USER" "/api/v1/auth/test/admin-or-user" "200"
run_authorization_test "Admin-or-User (VIEWER role)" "VIEWER" "/api/v1/auth/test/admin-or-user" "403"
echo ""

# 7. トークン生成機能のテスト
echo -e "${YELLOW}[Section 7/7] Token Generation Tests${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Testing ADMIN token generation...${NC} "
admin_token_response=$(curl -s -X POST "http://localhost:8080/mock-auth/token" -H "Content-Type: application/json" -d '{"roles": ["ADMIN"]}' 2>/dev/null)
if echo "$admin_token_response" | jq -e '.roles | contains(["ADMIN"])' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Success${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ Failed${NC}"
    failed_tests=$((failed_tests + 1))
fi
total_tests=$((total_tests + 1))

echo -ne "${BLUE}Testing USER token generation...${NC} "
user_token_response=$(curl -s -X POST "http://localhost:8080/mock-auth/token" -H "Content-Type: application/json" -d '{"roles": ["USER"]}' 2>/dev/null)
if echo "$user_token_response" | jq -e '.roles | contains(["USER"])' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Success${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ Failed${NC}"
    failed_tests=$((failed_tests + 1))
fi
total_tests=$((total_tests + 1))

echo -ne "${BLUE}Testing VIEWER token generation...${NC} "
viewer_token_response=$(curl -s -X POST "http://localhost:8080/mock-auth/token" -H "Content-Type: application/json" -d '{"roles": ["VIEWER"]}' 2>/dev/null)
if echo "$viewer_token_response" | jq -e '.roles | contains(["VIEWER"])' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Success${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ Failed${NC}"
    failed_tests=$((failed_tests + 1))
fi
total_tests=$((total_tests + 1))

echo ""

# テスト結果サマリー
echo "========================================"
echo -e "${MAGENTA}        Test Results Summary${NC}"
echo "========================================"
echo -e "${CYAN}Total Tests:${NC}  $total_tests"
echo -e "${GREEN}Passed:${NC}      $passed_tests"
echo -e "${RED}Failed:${NC}       $failed_tests"
echo ""

if [[ $failed_tests -eq 0 ]]; then
    echo -e "${GREEN}🎉 All authorization tests passed!${NC}"
    echo "✅ Authentication works correctly"
    echo "✅ Role-based authorization works correctly"
    echo "✅ Access control is properly enforced"
    exit 0
else
    echo -e "${RED}❌ Some authorization tests failed.${NC}"
    echo "Please check the following:"
    echo "1. Backend is running with 'local' profile"
    echo "2. Mock authentication is enabled"
    echo "3. Spring Security @PreAuthorize annotations are working"
    exit 1
fi