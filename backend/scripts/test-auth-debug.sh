#!/bin/bash

# JWT認証デバッグテストスクリプト
# 使用方法: ./test-auth-debug.sh [BASE_URL]

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

echo "========================================"
echo -e "${BOLD}   JWT Authentication Debug Test${NC}"
echo "   Base URL: $BASE_URL"
echo "========================================"
echo ""

# 1. デバッグ設定の確認
echo -e "${YELLOW}[Step 1/7] Configuration Check${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Checking debug configuration...${NC} "
debug_config=$(curl -s "$BASE_URL/api/v1/debug/config" 2>/dev/null)

if [[ -n "$debug_config" ]] && [[ "$debug_config" != *"error"* ]]; then
    echo -e "${GREEN}✓ Success${NC}"
    echo ""
    echo -e "${CYAN}Active Profiles:${NC}"
    echo "$debug_config" | jq -r '.activeProfiles[]' 2>/dev/null | sed 's/^/  - /'
    echo ""
    echo -e "${CYAN}JWT Configuration:${NC}"
    echo "$debug_config" | jq '.jwtConfig' 2>/dev/null | sed 's/^/  /'
    echo ""
else
    echo -e "${YELLOW}⚠ Debug endpoint not available${NC}"
    echo "  Debug endpoints are only available when mock auth is enabled"
fi
echo ""

# 2. モック認証エンドポイントの確認
echo -e "${YELLOW}[Step 2/7] Mock Auth Endpoints Check${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Testing JWKS endpoint...${NC} "
jwks_response=$(curl -s "$BASE_URL/mock-auth/.well-known/jwks.json" 2>/dev/null)

if echo "$jwks_response" | jq -e '.keys[0].kid' > /dev/null 2>&1; then
    kid=$(echo "$jwks_response" | jq -r '.keys[0].kid')
    echo -e "${GREEN}✓ Available${NC} (kid: $kid)"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "  Response: $jwks_response"
    exit 1
fi
echo ""

# 3. トークン生成
echo -e "${YELLOW}[Step 3/7] Token Generation${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Generating JWT token...${NC} "
token_response=$(curl -s -X POST "$BASE_URL/mock-auth/token" 2>/dev/null)

if echo "$token_response" | jq -e '.access_token' > /dev/null 2>&1; then
    TOKEN=$(echo "$token_response" | jq -r '.access_token')
    echo -e "${GREEN}✓ Success${NC}"
    echo -e "  ${CYAN}Token length: ${#TOKEN} characters${NC}"
    
    # トークンをファイルに保存
    echo "$TOKEN" > /tmp/debug_token.txt
else
    echo -e "${RED}✗ Failed${NC}"
    echo "  Response: $token_response"
    exit 1
fi
echo ""

# 4. トークン構造の検証
echo -e "${YELLOW}[Step 4/7] Token Structure Analysis${NC}"
echo "----------------------------------------"

# ヘッダー
echo -e "${CYAN}JWT Header:${NC}"
echo "$TOKEN" | cut -d. -f1 | base64 -d 2>/dev/null | jq 2>/dev/null | sed 's/^/  /'

# ペイロード
echo -e "${CYAN}JWT Payload:${NC}"
payload=$(echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null)
echo "$payload" | jq 2>/dev/null | sed 's/^/  /'

# 重要なclaim値の抽出
issuer=$(echo "$payload" | jq -r '.iss' 2>/dev/null)
audience=$(echo "$payload" | jq -r '.aud' 2>/dev/null)
subject=$(echo "$payload" | jq -r '.sub' 2>/dev/null)

echo ""
echo -e "${CYAN}Key Claims:${NC}"
echo "  Issuer:   $issuer"
echo "  Audience: $audience"
echo "  Subject:  $subject"
echo ""

# 5. トークン検証エンドポイントのテスト
echo -e "${YELLOW}[Step 5/7] Token Validation (Mock)${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Validating token structure...${NC} "
validate_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/mock-auth/validate" 2>/dev/null)

if echo "$validate_response" | jq -e '.valid' 2>/dev/null | grep -q "true"; then
    echo -e "${GREEN}✓ Valid${NC}"
else
    echo -e "${RED}✗ Invalid${NC}"
    echo "  Response: $validate_response"
fi
echo ""

# 6. 認証付きAPIアクセス（詳細エラー情報付き）
echo -e "${YELLOW}[Step 6/7] Authenticated API Access${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Testing /api/v1/auth/me...${NC} "
auth_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/auth/me" 2>/dev/null)

status_code=$(echo "$auth_response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$auth_response" | sed '/HTTP_STATUS/d')

if [[ "$status_code" == "200" ]]; then
    echo -e "${GREEN}✓ Success${NC}"
    echo -e "${CYAN}Response:${NC}"
    echo "$body" | jq 2>/dev/null | sed 's/^/  /'
else
    echo -e "${RED}✗ Failed (Status: $status_code)${NC}"
    echo -e "${CYAN}Error Response:${NC}"
    echo "$body" | jq 2>/dev/null | sed 's/^/  /'
    
    # 詳細なエラー情報を表示
    if echo "$body" | jq -e '.detail' 2>/dev/null > /dev/null; then
        detail=$(echo "$body" | jq -r '.detail' 2>/dev/null)
        echo -e "${YELLOW}Error Detail:${NC} $detail"
    fi
fi
echo ""

# 7. ログインエンドポイントのテスト
echo -e "${YELLOW}[Step 7/7] Login Endpoint Test${NC}"
echo "----------------------------------------"

echo -ne "${BLUE}Testing login with credentials...${NC} "
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}' \
    "$BASE_URL/mock-auth/login" 2>/dev/null)

if echo "$login_response" | jq -e '.access_token' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Success${NC}"
    echo -e "${CYAN}Login Response:${NC}"
    echo "$login_response" | jq '.user' 2>/dev/null | sed 's/^/  /'
    
    # 新しいトークンでAPIアクセステスト
    LOGIN_TOKEN=$(echo "$login_response" | jq -r '.access_token')
    echo ""
    echo -ne "${BLUE}Testing API with login token...${NC} "
    
    login_api_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer $LOGIN_TOKEN" \
        "$BASE_URL/api/v1/auth/me" 2>/dev/null)
    
    login_status=$(echo "$login_api_response" | grep "HTTP_STATUS" | cut -d: -f2)
    
    if [[ "$login_status" == "200" ]]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed (Status: $login_status)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not implemented${NC}"
fi
echo ""

# 診断サマリー
echo "========================================"
echo -e "${MAGENTA}       Diagnostic Summary${NC}"
echo "========================================"

echo -e "${CYAN}Token Information:${NC}"
echo "  Issuer:   $issuer"
echo "  Audience: $audience"
echo "  Kid:      $kid"
echo ""

if [[ "$status_code" != "200" ]]; then
    echo -e "${YELLOW}Possible Issues:${NC}"
    
    # issuer不一致のチェック
    if [[ "$issuer" != *"localhost:8080"* ]]; then
        echo -e "  ${RED}✗${NC} Issuer mismatch - Token: $issuer"
    fi
    
    # audience不一致のチェック
    if [[ "$audience" != "local-dev-api" ]]; then
        echo -e "  ${RED}✗${NC} Audience mismatch - Token: $audience"
    fi
    
    # 設定の推奨事項
    echo ""
    echo -e "${CYAN}Recommendations:${NC}"
    echo "  1. Restart the backend after configuration changes"
    echo "  2. Ensure SPRING_PROFILES_ACTIVE=local or not set"
    echo "  3. Check application.yml for correct JWKS URI"
fi

echo ""
echo "========================================"

# 終了コード
if [[ "$status_code" == "200" ]]; then
    echo -e "${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}Authentication issues detected. See details above.${NC}"
    exit 1
fi