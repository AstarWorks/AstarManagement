# 認証機能 - Backend API

## エンドポイント

### 認証

#### ログイン
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["ADMIN", "USER"]
  },
  "workspace": {
    "id": "uuid",
    "name": "Workspace Name"
  }
}
```

#### リフレッシュトークン
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### ログアウト
```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}

Response: 204 No Content
```

### ユーザー情報

#### 現在のユーザー取得
```http
GET /api/v1/auth/me
Authorization: Bearer {accessToken}

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "workspaces": [
    {
      "id": "uuid",
      "name": "Workspace 1",
      "roles": ["ADMIN"]
    }
  ]
}
```

### セットアップモード

#### セットアップ状態確認
```http
GET /api/v1/auth/setup/status

Response:
{
  "isSetupComplete": false,
  "requiresSetup": true
}
```

#### 初期セットアップ
```http
POST /api/v1/auth/setup
Content-Type: application/json

{
  "admin": {
    "email": "admin@example.com",
    "password": "securePassword123",
    "name": "Admin User"
  },
  "workspace": {
    "name": "My Company",
    "description": "Company workspace"
  }
}

Response:
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "workspace": {
    "id": "uuid",
    "name": "My Company"
  }
}
```

## エラーレスポンス

### 認証失敗
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### トークン期限切れ
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Access token has expired",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 権限不足
```json
{
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "You don't have permission to access this resource",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## セキュリティヘッダー

### リクエストヘッダー
```http
Authorization: Bearer {accessToken}
X-Tenant-Id: {tenantId}  # マルチテナント時
```

### レスポンスヘッダー
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```