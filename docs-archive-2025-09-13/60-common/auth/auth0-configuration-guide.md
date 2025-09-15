# Auth0設定ガイド

## 1. 概要

本ガイドでは、Astar Management汎用ビジネス管理プラットフォームでAuth0を統合するための詳細な設定手順を説明します。

### 1.1 設定目標
- マルチテナント対応の認証システム
- カスタムクレームによるロール・テナント情報の連携
- 開発・ステージング・本番環境の分離
- 業界テンプレートとの統合

### 1.2 前提条件
- Auth0アカウント（Professional以上推奨）
- Spring Boot API実装済み
- Nuxt.js フロントエンド準備完了

## 2. Auth0基本設定

### 2.1 テナント作成
```bash
# Auth0 CLI インストール
npm install -g @auth0/cli

# Auth0ログイン
auth0 login

# 新規テナント作成（開発用）
auth0 tenants create astar-development

# 本番用テナント作成
auth0 tenants create astar-production
```

### 2.2 Application設定

#### 2.2.1 SPA Application (フロントエンド用)
```javascript
// Auth0 Dashboard > Applications > Create Application
{
  "name": "Astar Management SPA",
  "type": "SPA",
  "settings": {
    "allowed_callback_urls": [
      "http://localhost:3000/callback",
      "https://dev.astar-management.com/callback",
      "https://app.astar-management.com/callback"
    ],
    "allowed_logout_urls": [
      "http://localhost:3000",
      "https://dev.astar-management.com",
      "https://app.astar-management.com"
    ],
    "allowed_web_origins": [
      "http://localhost:3000",
      "https://dev.astar-management.com",
      "https://app.astar-management.com"
    ],
    "allowed_origins": [
      "http://localhost:3000",
      "https://dev.astar-management.com", 
      "https://app.astar-management.com"
    ]
  }
}
```

#### 2.2.2 API Identifier 作成
```javascript
// Auth0 Dashboard > APIs > Create API
{
  "name": "Astar Management API",
  "identifier": "https://api.astar-management.com",
  "signing_algorithm": "RS256",
  "scopes": [
    {
      "value": "read:expenses",
      "description": "実費データの読み取り"
    },
    {
      "value": "write:expenses", 
      "description": "実費データの書き込み"
    },
    {
      "value": "manage:roles",
      "description": "ロール管理"
    },
    {
      "value": "manage:users",
      "description": "ユーザー管理"
    }
  ]
}
```

## 3. カスタムドメイン設定

### 3.1 カスタムドメイン追加
```bash
# DNS設定
# CNAME: auth.astar-management.com -> {your-tenant}.auth0.com

# Auth0 Dashboard > Branding > Custom Domains
{
  "domain": "auth.astar-management.com",
  "type": "auth0_managed_certs",
  "verification_method": "txt"
}
```

### 3.2 SSL証明書設定
```bash
# Let's Encrypt証明書を自動取得
# Auth0が自動的に管理
```

## 4. Actions実装

### 4.1 Post-Login Action
```javascript
// Auth0 Dashboard > Actions > Library > Build Custom
// Action名: astar-tenant-integration

/**
 * Handler that will be called during the execution of a PostLogin flow.
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://astar-management.com/';
  
  try {
    // 環境設定
    const API_BASE_URL = event.secrets.API_BASE_URL; // https://api.astar-management.com
    const MANAGEMENT_API_TOKEN = event.secrets.MANAGEMENT_API_TOKEN;
    
    const email = event.user.email;
    const auth0UserId = event.user.user_id;
    
    console.log(`Processing login for user: ${email}`);
    
    // 1. テナント特定（メールドメインベース）
    const domain = email.split('@')[1];
    const tenantResponse = await fetch(`${API_BASE_URL}/api/auth/tenant-by-domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`
      },
      body: JSON.stringify({ domain })
    });
    
    if (!tenantResponse.ok) {
      console.error(`Tenant not found for domain: ${domain}`);
      api.access.deny('テナントが見つかりません。管理者にお問い合わせください。');
      return;
    }
    
    const tenant = await tenantResponse.json();
    console.log(`Found tenant: ${tenant.slug} (${tenant.name})`);
    
    // 2. ユーザー情報取得・作成
    const userResponse = await fetch(`${API_BASE_URL}/api/auth/user-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`
      },
      body: JSON.stringify({
        auth0UserId,
        tenantId: tenant.id,
        email,
        name: event.user.name || event.user.nickname || email.split('@')[0],
        picture: event.user.picture
      })
    });
    
    if (!userResponse.ok) {
      console.error('User sync failed:', await userResponse.text());
      api.access.deny('ユーザー情報の同期に失敗しました。');
      return;
    }
    
    const user = await userResponse.json();
    console.log(`User synced: ${user.id}`);
    
    // 3. ユーザーロール取得
    const rolesResponse = await fetch(`${API_BASE_URL}/api/auth/user-roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`
      },
      body: JSON.stringify({
        userId: user.id,
        tenantId: tenant.id
      })
    });
    
    let roles = [];
    if (rolesResponse.ok) {
      roles = await rolesResponse.json();
    } else {
      console.warn('Failed to fetch user roles, using default empty roles');
    }
    
    console.log(`User roles: ${roles.map(r => r.name).join(', ')}`);
    
    // 4. カスタムクレーム設定
    api.accessToken.setCustomClaim(`${namespace}tenant_id`, tenant.id);
    api.accessToken.setCustomClaim(`${namespace}tenant_slug`, tenant.slug);
    api.accessToken.setCustomClaim(`${namespace}user_id`, user.id);
    api.accessToken.setCustomClaim(`${namespace}roles`, roles.map(r => r.name));
    api.accessToken.setCustomClaim(`${namespace}plan`, tenant.planType);
    
    // ID Token にも基本情報を追加（フロントエンド用）
    api.idToken.setCustomClaim(`${namespace}tenant_slug`, tenant.slug);
    api.idToken.setCustomClaim(`${namespace}tenant_name`, tenant.name);
    api.idToken.setCustomClaim(`${namespace}display_name`, user.displayName || user.name);
    api.idToken.setCustomClaim(`${namespace}plan`, tenant.planType);
    
    // 5. ログイン成功ログ
    await fetch(`${API_BASE_URL}/api/auth/signin-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`
      },
      body: JSON.stringify({
        userId: user.id,
        tenantId: tenant.id,
        auth0UserId,
        ipAddress: event.request.ip,
        userAgent: event.request.userAgent,
        connection: event.connection.name
      })
    });
    
    console.log('Login processing completed successfully');
    
  } catch (error) {
    console.error('Auth0 Action Error:', error.message);
    console.error('Stack trace:', error.stack);
    
    // 開発環境では詳細エラー、本番では一般的なメッセージ
    const isDevelopment = event.secrets.ENVIRONMENT === 'development';
    const errorMessage = isDevelopment 
      ? `認証処理中にエラーが発生しました: ${error.message}`
      : '認証処理中にエラーが発生しました。しばらく時間をおいてから再度お試しください。';
    
    api.access.deny(errorMessage);
  }
};
```

### 4.2 Secrets設定
```javascript
// Auth0 Dashboard > Actions > Library > {Action} > Settings > Secrets
{
  "API_BASE_URL": "https://api.astar-management.com",
  "MANAGEMENT_API_TOKEN": "your-management-api-token",
  "ENVIRONMENT": "production" // or "development"
}
```

### 4.3 Flow設定
```javascript
// Auth0 Dashboard > Actions > Flows > Login
// Post-Login に astar-tenant-integration を追加
```

## 5. Management API設定

### 5.1 Machine to Machine Application
```javascript
// Auth0 Dashboard > Applications > Create Application
{
  "name": "Astar Management M2M",
  "type": "Machine to Machine",
  "authorized_apis": ["Auth0 Management API"],
  "scopes": [
    "read:users",
    "update:users",
    "create:users",
    "read:user_metadata",
    "update:user_metadata"
  ]
}
```

### 5.2 Management API Token取得
```bash
# API呼び出し用トークン取得
curl -X POST 'https://your-domain.auth0.com/oauth/token' \
  -H 'Content-Type: application/json' \
  -d '{
    "client_id": "your-m2m-client-id",
    "client_secret": "your-m2m-client-secret", 
    "audience": "https://your-domain.auth0.com/api/v2/",
    "grant_type": "client_credentials"
  }'
```

## 6. 環境別設定

### 6.1 開発環境（Sidebase Auth対応）
```bash
# .env.development
# Sidebase Auth設定
NUXT_AUTH_SECRET=your-32-character-random-string
NUXT_PUBLIC_AUTH_URL=http://localhost:3000/api/auth

# Auth0設定
AUTH0_CLIENT_ID=dev-spa-client-id  
AUTH0_CLIENT_SECRET=dev-spa-client-secret
AUTH0_DOMAIN=astar-dev.auth0.com
AUTH0_AUDIENCE=https://api.astar-management.com

# Spring Boot application-dev.yml
auth0:
  domain: astar-dev.auth0.com
  audience: https://api.astar-management.com
  namespace: https://astar-management.com/
```

### 6.2 ステージング環境
```bash
# .env.staging
# Sidebase Auth設定
NUXT_AUTH_SECRET=staging-32-character-random-string
NUXT_PUBLIC_AUTH_URL=https://staging.astar-management.com/api/auth

# Auth0設定
AUTH0_CLIENT_ID=staging-spa-client-id
AUTH0_CLIENT_SECRET=staging-spa-client-secret
AUTH0_DOMAIN=astar-staging.auth0.com
AUTH0_AUDIENCE=https://api.astar-management.com

# Spring Boot application-staging.yml
auth0:
  domain: astar-staging.auth0.com
  audience: https://api.astar-management.com
  namespace: https://astar-management.com/
```

### 6.3 本番環境
```bash
# .env.production
# Sidebase Auth設定
NUXT_AUTH_SECRET=production-32-character-random-string
NUXT_PUBLIC_AUTH_URL=https://app.astar-management.com/api/auth

# Auth0設定
AUTH0_CLIENT_ID=prod-spa-client-id
AUTH0_CLIENT_SECRET=prod-spa-client-secret
AUTH0_DOMAIN=auth.astar-management.com
AUTH0_AUDIENCE=https://api.astar-management.com

# Spring Boot application-prod.yml
auth0:
  domain: auth.astar-management.com
  audience: https://api.astar-management.com
  namespace: https://astar-management.com/
```

### 6.4 Sidebase Auth 追加設定手順
```bash
# 1. Sidebase Authモジュールインストール
npm install @sidebase/nuxt-auth

# 2. AUTH_SECRETの生成
npx auth secret

# 3. Auth0プロバイダー用の依存関係
npm install next-auth @auth/core

# 4. 型定義ファイル作成
touch types/auth.d.ts

# 5. Nuxt設定でモジュール有効化
# nuxt.config.ts に '@sidebase/nuxt-auth' を追加
```

## 7. 企業向けSSO設定

### 7.1 SAML Connection
```javascript
// Auth0 Dashboard > Authentication > Enterprise > SAML
{
  "name": "enterprise-customer-saml",
  "strategy": "samlp",
  "options": {
    "signInEndpoint": "https://customer-idp.com/sso/saml",
    "signOutEndpoint": "https://customer-idp.com/sso/logout",
    "cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "emailAttribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "nameAttribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
  },
  "enabled_clients": ["your-spa-client-id"]
}
```

### 7.2 Azure AD Connection
```javascript
// Auth0 Dashboard > Authentication > Social > Microsoft Azure AD
{
  "name": "azure-ad-connection",
  "strategy": "waad",
  "options": {
    "tenant_domain": "customer.onmicrosoft.com",
    "client_id": "azure-app-client-id",
    "client_secret": "azure-app-client-secret",
    "basic_profile": true,
    "ext_profile": true
  }
}
```

## 8. セキュリティ設定

### 8.1 Attack Protection
```javascript
// Auth0 Dashboard > Security > Attack Protection
{
  "brute_force_protection": {
    "enabled": true,
    "max_attempts": 5,
    "block_duration": 900 // 15分
  },
  "suspicious_ip_throttling": {
    "enabled": true,
    "allowlist": ["192.168.1.0/24"], // オフィスIP等
    "pre_login": {
      "max_attempts": 100,
      "rate": 864000 // 24時間
    },
    "pre_user_registration": {
      "max_attempts": 50,
      "rate": 1200 // 20分
    }
  }
}
```

### 8.2 MFA設定
```javascript
// Auth0 Dashboard > Security > Multi-factor Auth
{
  "policies": [{
    "name": "enterprise-mfa-policy",
    "condition": "context.connection.strategy === 'auth0'",
    "factors": [
      { "type": "otp" },
      { "type": "sms" },
      { "type": "email" }
    ]
  }]
}
```

## 9. 監視・ログ設定

### 9.1 Log Streams
```javascript
// Auth0 Dashboard > Monitoring > Logs > Log Streams
{
  "name": "cloudwatch-logs",
  "type": "aws-cloudwatch",
  "settings": {
    "aws_region": "ap-northeast-1",
    "aws_log_group": "auth0-logs",
    "aws_access_key_id": "your-access-key",
    "aws_secret_access_key": "your-secret-key"
  },
  "filters": [
    { "type": "category", "name": "auth.login" },
    { "type": "category", "name": "auth.login_failure" },
    { "type": "category", "name": "auth.logout" }
  ]
}
```

### 9.2 Real-time Webtask Logs
```javascript
// webtask-logs.js
module.exports = function(ctx, cb) {
  console.log('Auth event:', JSON.stringify(ctx.body, null, 2));
  
  // カスタムログ処理
  if (ctx.body.type === 'slo' || ctx.body.type === 'flo') {
    // ログイン失敗時の追加処理
    sendAlert(ctx.body);
  }
  
  cb(null, { status: 'ok' });
};
```

## 10. テスト・デバッグ

### 10.1 Real-time Logs
```bash
# Auth0 CLI でリアルタイムログ監視
auth0 logs tail

# 特定のユーザーのログ監視
auth0 logs tail --filter "user_id:auth0|user-id"
```

### 10.2 Action Debug
```javascript
// Action内でのデバッグログ
console.log('Debug info:', {
  user_id: event.user.user_id,
  email: event.user.email,
  connection: event.connection.name,
  request: {
    ip: event.request.ip,
    user_agent: event.request.userAgent
  }
});
```

### 10.3 JWT Debug
```bash
# JWT内容確認
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.astar-management.com/api/auth/debug-token
```

## 11. 運用手順

### 11.1 バックアップ
```bash
# 設定のエクスポート
auth0 tf export

# Actions のバックアップ
auth0 actions export
```

### 11.2 デプロイ手順
```bash
# 1. Terraform でインフラ更新
terraform plan -var-file="production.tfvars"
terraform apply

# 2. Actions 更新
auth0 actions deploy

# 3. 設定検証
auth0 test login
```

### 11.3 障害対応
```bash
# 緊急時の認証バイパス（管理者のみ）
# Auth0 Dashboard > Actions > Flows > Login
# Actionを一時的に無効化

# ログ確認
auth0 logs list --filter "type:f*" # 失敗ログのみ
```

## 12. まとめ

この設定により以下が実現されます：

1. **マルチテナント認証**: メールドメインベースの自動テナント識別
2. **動的ロール連携**: Auth0 Custom Claimsによるシームレスな権限管理
3. **エンタープライズ対応**: SAML/Azure AD等の企業認証との統合
4. **セキュリティ強化**: Attack Protection、MFA等の高度なセキュリティ機能
5. **運用監視**: リアルタイムログ、アラート等の包括的な監視

**開発効率**: 認証機能開発3-4週間短縮
**セキュリティ**: エンタープライズレベルのセキュリティを即座に獲得
**拡張性**: 新規テナント・認証方式への容易な対応