#!/bin/bash

# APIテストスクリプト - バックエンドAPIの基本動作確認
# 使用方法: ./test-api.sh [BASE_URL]

# set -e disabled to allow complete test execution

# デフォルトのベースURL
BASE_URL=${1:-"http://localhost:8080"}

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# テスト結果カウンター
PASSED=0
FAILED=0
SKIPPED=0

# テスト実行関数
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    echo -ne "${BLUE}Testing:${NC} $test_name... "
    
    # HTTPステータスコードを取得
    response=$(eval "$command" 2>/dev/null || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        echo -e "${RED}✗ Failed${NC}"
        echo -e "  ${RED}Error: Could not execute request${NC}"
        ((FAILED++))
        return 1
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [[ "$status_code" == "$expected_status" ]]; then
        echo -e "${GREEN}✓ Passed${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        echo -e "  ${RED}Expected: $expected_status, Got: $status_code${NC}"
        echo -e "  ${RED}Response: $body${NC}"
        ((FAILED++))
        return 1
    fi
}

# レスポンス内容検証関数
validate_response() {
    local test_name="$1"
    local url="$2"
    local expected_field="$3"
    
    echo -ne "${BLUE}Testing:${NC} $test_name... "
    
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ Passed${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        echo -e "  ${RED}Field '$expected_field' not found in response${NC}"
        echo -e "  ${RED}Response: $response${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "========================================"
echo "   Astar Management API Test Suite"
echo "   Base URL: $BASE_URL"
echo "========================================"
echo ""

# 1. ヘルスチェックエンドポイントのテスト
echo -e "${YELLOW}[1/6] Health Check Endpoints${NC}"
echo "----------------------------------------"

run_test "GET /api/v1/health" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/api/v1/health'" \
    "200"

validate_response "Health Response Content" \
    "$BASE_URL/api/v1/health" \
    "status"

run_test "GET /api/v1/health/ping" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/api/v1/health/ping'" \
    "200"

echo ""

# 2. 認証エンドポイントのテスト（認証なし）
echo -e "${YELLOW}[2/6] Authentication Endpoints (No Auth)${NC}"
echo "----------------------------------------"

run_test "GET /api/v1/auth/me (No Auth)" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/api/v1/auth/me'" \
    "401"

run_test "GET /api/v1/auth/claims (No Auth)" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/api/v1/auth/claims'" \
    "401"

run_test "GET /api/v1/auth/business-context (No Auth)" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/api/v1/auth/business-context'" \
    "401"

echo ""

# 3. Actuatorエンドポイントのテスト
echo -e "${YELLOW}[3/6] Actuator Endpoints${NC}"
echo "----------------------------------------"

run_test "GET /actuator/health" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/actuator/health'" \
    "200"

run_test "GET /actuator/info" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/actuator/info'" \
    "200"

echo ""

# 4. CORS設定のテスト
echo -e "${YELLOW}[4/6] CORS Configuration${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Testing:${NC} CORS Preflight Request... "
cors_response=$(curl -s -I -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization" \
    "$BASE_URL/api/v1/health" 2>/dev/null)

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ Passed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed${NC}"
    echo -e "  ${RED}CORS headers not found${NC}"
    ((FAILED++))
fi

echo ""

# 5. エラーハンドリングのテスト
echo -e "${YELLOW}[5/6] Error Handling${NC}"
echo "----------------------------------------"

run_test "GET /api/v1/nonexistent (404)" \
    "curl -s -o /dev/null -w '%{http_code}' '$BASE_URL/api/v1/nonexistent'" \
    "404"

run_test "POST /api/v1/health (Method Not Allowed)" \
    "curl -s -X POST -o /dev/null -w '%{http_code}' '$BASE_URL/api/v1/health'" \
    "405"

echo ""

# 6. モック認証エンドポイントのテスト（開発環境）
echo -e "${YELLOW}[6/6] Mock Auth Endpoints (Development)${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Testing:${NC} Mock Auth Login... "
mock_login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}' \
    "$BASE_URL/mock-auth/login" 2>/dev/null)

if echo "$mock_login_response" | grep -q "access_token\|error"; then
    if echo "$mock_login_response" | grep -q "access_token"; then
        echo -e "${GREEN}✓ Passed${NC} (Mock auth enabled)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⊗ Skipped${NC} (Mock auth disabled - Production mode)"
        ((SKIPPED++))
    fi
else
    echo -e "${RED}✗ Failed${NC}"
    echo -e "  ${RED}Unexpected response: $mock_login_response${NC}"
    ((FAILED++))
fi

echo ""

# モックトークンでの認証テスト（モック認証が有効な場合）
if echo "$mock_login_response" | grep -q "access_token"; then
    echo -e "${YELLOW}[Bonus] Testing with Mock Token${NC}"
    echo "----------------------------------------"
    
    # トークン抽出
    mock_token=$(echo "$mock_login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [[ -n "$mock_token" ]]; then
        echo -ne "${BLUE}Testing:${NC} GET /api/v1/auth/me (With Mock Token)... "
        
        auth_response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $mock_token" \
            "$BASE_URL/api/v1/auth/me" 2>/dev/null)
        
        status_code=$(echo "$auth_response" | tail -n 1)
        
        if [[ "$status_code" == "200" ]]; then
            echo -e "${GREEN}✓ Passed${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ Failed${NC} (Status: $status_code)"
            ((FAILED++))
        fi
    fi
    echo ""
fi

# テスト結果サマリー
echo "========================================"
echo "          Test Results Summary"
echo "========================================"
echo -e "${GREEN}✓ Passed:${NC}  $PASSED"
echo -e "${RED}✗ Failed:${NC}  $FAILED"
echo -e "${YELLOW}⊗ Skipped:${NC} $SKIPPED"
echo "----------------------------------------"
echo -e "Total:     $((PASSED + FAILED + SKIPPED))"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi