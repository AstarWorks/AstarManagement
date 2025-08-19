#!/bin/bash

# Test script for backend API with mock authentication

echo "=== Testing Mock Auth Endpoints ==="

# 1. Get JWT token
echo "1. Getting JWT token from mock auth..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8080/mock-auth/token)
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token obtained successfully"
echo "Token (first 50 chars): ${TOKEN:0:50}..."

# 2. Get JWKS
echo ""
echo "2. Getting JWKS from mock auth..."
JWKS=$(curl -s http://localhost:8080/mock-auth/.well-known/jwks.json)
echo "✅ JWKS endpoint accessible"
echo "JWKS: $(echo $JWKS | jq -c '.keys[0] | {kid: .kid, use: .use, alg: .alg}')"

# 3. Test protected endpoint
echo ""
echo "3. Testing protected endpoint with token..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8080/api/v1/expenses)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
    echo "✅ Authentication successful"
else
    echo "❌ Authentication failed"
fi
echo "Response body: $BODY"

# 4. Test without token (should fail)
echo ""
echo "4. Testing protected endpoint WITHOUT token (should fail)..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    http://localhost:8080/api/v1/expenses)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo "✅ Correctly rejected unauthorized request"
else
    echo "❌ Security issue: Request should have been rejected"
fi

# 5. Test Swagger UI
echo ""
echo "5. Testing Swagger UI access..."
SWAGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui/index.html)
if [ "$SWAGGER_STATUS" = "200" ]; then
    echo "✅ Swagger UI accessible at http://localhost:8080/swagger-ui/index.html"
else
    echo "❌ Swagger UI not accessible"
fi

echo ""
echo "=== Test Complete ==="