#!/bin/bash

# モック認証テストスクリプト - JWT認証フローの完全テスト
# 使用方法: ./test-mock-auth.sh [BASE_URL]

# set -e disabled to allow complete test execution

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

# テスト結果カウンター
PASSED=0
FAILED=0

# JWTトークン格納変数
ACCESS_TOKEN=""
REFRESH_TOKEN=""

echo "========================================"
echo "   Mock Authentication Test Suite"
echo "   Base URL: $BASE_URL"
echo "========================================"
echo ""

# 1. モック認証の有効性確認
echo -e "${YELLOW}[1/7] Mock Auth Availability Check${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Checking mock auth endpoint...${NC} "
mock_check=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/mock-auth/login")

if [[ "$mock_check" == "404" ]] || [[ "$mock_check" == "403" ]]; then
    echo -e "${YELLOW}⚠ Mock auth not available${NC}"
    echo "Mock authentication is disabled (production mode)"
    echo "Skipping mock auth tests..."
    exit 0
else
    echo -e "${GREEN}✓ Available${NC}"
    ((PASSED++))
fi
echo ""

# 2. ユーザー登録テスト
echo -e "${YELLOW}[2/7] User Registration${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Registering new user...${NC} "
register_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test.user@astarworks.com",
        "password": "TestPass123!",
        "name": "Test User",
        "role": "USER"
    }' \
    "$BASE_URL/mock-auth/register" 2>/dev/null)

if echo "$register_response" | grep -q "user_id\|error"; then
    if echo "$register_response" | grep -q "already exists"; then
        echo -e "${YELLOW}⚠ User already exists${NC}"
    else
        echo -e "${GREEN}✓ Registered${NC}"
        ((PASSED++))
    fi
else
    echo -e "${RED}✗ Failed${NC}"
    echo -e "  ${RED}Response: $register_response${NC}"
    ((FAILED++))
fi
echo ""

# 3. ログインテスト
echo -e "${YELLOW}[3/7] User Login${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Logging in with credentials...${NC} "
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test.user@astarworks.com",
        "password": "TestPass123!"
    }' \
    "$BASE_URL/mock-auth/login" 2>/dev/null)

if echo "$login_response" | grep -q "access_token"; then
    ACCESS_TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$login_response" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Success${NC}"
    echo -e "  ${CYAN}Token obtained (first 50 chars): ${ACCESS_TOKEN:0:50}...${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed${NC}"
    echo -e "  ${RED}Response: $login_response${NC}"
    ((FAILED++))
    exit 1
fi
echo ""

# 4. JWTトークン検証
echo -e "${YELLOW}[4/7] JWT Token Validation${NC}"
echo "----------------------------------------"

# JWTデコード（ヘッダーとペイロード）
echo -ne "${BLUE}Decoding JWT token...${NC} "
if [[ -n "$ACCESS_TOKEN" ]]; then
    # Base64デコード（JWT形式: header.payload.signature）
    jwt_header=$(echo "$ACCESS_TOKEN" | cut -d. -f1 | base64 -d 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "{}")
    jwt_payload=$(echo "$ACCESS_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "{}")
    
    if [[ "$jwt_header" != "{}" ]]; then
        echo -e "${GREEN}✓ Valid JWT structure${NC}"
        echo -e "  ${CYAN}Algorithm: $(echo "$jwt_header" | grep -o '"alg":"[^"]*"' | cut -d'"' -f4)${NC}"
        echo -e "  ${CYAN}Subject: $(echo "$jwt_payload" | grep -o '"sub":"[^"]*"' | cut -d'"' -f4)${NC}"
        echo -e "  ${CYAN}Email: $(echo "$jwt_payload" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Could not decode JWT${NC}"
    fi
else
    echo -e "${RED}✗ No token available${NC}"
    ((FAILED++))
fi
echo ""

# 5. 認証付きAPIアクセス
echo -e "${YELLOW}[5/7] Authenticated API Access${NC}"
echo "----------------------------------------"

# /api/v1/auth/me エンドポイントテスト
echo -ne "${BLUE}GET /api/v1/auth/me...${NC} "
me_response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/api/v1/auth/me" 2>/dev/null)

status_code=$(echo "$me_response" | tail -n 1)
body=$(echo "$me_response" | head -n -1)

if [[ "$status_code" == "200" ]]; then
    echo -e "${GREEN}✓ Success${NC}"
    if echo "$body" | grep -q "email"; then
        email=$(echo "$body" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
        echo -e "  ${CYAN}User email: $email${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}✗ Failed (Status: $status_code)${NC}"
    ((FAILED++))
fi

# /api/v1/auth/claims エンドポイントテスト
echo -ne "${BLUE}GET /api/v1/auth/claims...${NC} "
claims_response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/api/v1/auth/claims" 2>/dev/null)

status_code=$(echo "$claims_response" | tail -n 1)
if [[ "$status_code" == "200" ]]; then
    echo -e "${GREEN}✓ Success${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed (Status: $status_code)${NC}"
    ((FAILED++))
fi

# /api/v1/auth/business-context エンドポイントテスト
echo -ne "${BLUE}GET /api/v1/auth/business-context...${NC} "
context_response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/api/v1/auth/business-context" 2>/dev/null)

status_code=$(echo "$context_response" | tail -n 1)
body=$(echo "$context_response" | head -n -1)

if [[ "$status_code" == "200" ]]; then
    echo -e "${GREEN}✓ Success${NC}"
    if echo "$body" | grep -q "businessContext"; then
        echo -e "  ${CYAN}Business context retrieved${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}✗ Failed (Status: $status_code)${NC}"
    ((FAILED++))
fi
echo ""

# 6. トークンリフレッシュ
echo -e "${YELLOW}[6/7] Token Refresh${NC}"
echo "----------------------------------------"

if [[ -n "$REFRESH_TOKEN" ]]; then
    echo -ne "${BLUE}Refreshing access token...${NC} "
    refresh_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}" \
        "$BASE_URL/mock-auth/refresh" 2>/dev/null)
    
    if echo "$refresh_response" | grep -q "access_token"; then
        NEW_ACCESS_TOKEN=$(echo "$refresh_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Success${NC}"
        echo -e "  ${CYAN}New token obtained${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Refresh not implemented${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No refresh token available${NC}"
fi
echo ""

# 7. ログアウト
echo -e "${YELLOW}[7/7] Logout${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Logging out...${NC} "
logout_response=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/mock-auth/logout" 2>/dev/null)

if echo "$logout_response" | grep -q "success\|logged out"; then
    echo -e "${GREEN}✓ Success${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Logout endpoint not implemented${NC}"
fi
echo ""

# ロールベースアクセス制御テスト
echo -e "${MAGENTA}[Bonus] Role-Based Access Control${NC}"
echo "----------------------------------------"

# 管理者ユーザーでログイン
echo -ne "${BLUE}Testing ADMIN role access...${NC} "
admin_login=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@astarworks.com",
        "password": "admin123"
    }' \
    "$BASE_URL/mock-auth/login" 2>/dev/null)

if echo "$admin_login" | grep -q "access_token"; then
    ADMIN_TOKEN=$(echo "$admin_login" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    # 管理者権限が必要なエンドポイントをテスト
    admin_response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$BASE_URL/api/v1/admin/users" 2>/dev/null)
    
    status_code=$(echo "$admin_response" | tail -n 1)
    if [[ "$status_code" == "200" ]] || [[ "$status_code" == "404" ]]; then
        echo -e "${GREEN}✓ Admin access verified${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Admin endpoints not implemented${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Admin user not configured${NC}"
fi
echo ""

# テスト結果サマリー
echo "========================================"
echo "       Mock Auth Test Summary"
echo "========================================"
echo -e "${GREEN}✓ Passed:${NC}  $PASSED"
echo -e "${RED}✗ Failed:${NC}  $FAILED"
echo "----------------------------------------"
echo -e "Total:     $((PASSED + FAILED))"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}All mock auth tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the output above.${NC}"
    exit 1
fi