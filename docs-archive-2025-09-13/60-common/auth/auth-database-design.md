# 認証・権限システム データベース設計書

## 1. 設計方針

### 1.1 基本原則
**汎用ビジネス管理プラットフォーム対応** - 業界非依存の認証基盤
- **ベンダー中立**: 特定認証サービスに依存しない設計
- **ハイブリッドマルチテナンシー**: 3段階の分離レベル対応
- **動的ロールシステム**: 事前定義ロールなし、完全カスタマイズ
- **柔軟権限管理**: リソースベース動的権限生成

### 1.2 ハイブリッドマルチテナント対応
```yaml
分離レベル:
  Starter: "Shared DB + Row Level Security"
  Professional: "Dedicated Schema per Tenant"  
  Enterprise: "Dedicated Container per Tenant"
```

### 1.3 認証フロー
```
1. ユーザーが認証情報を送信（Email/OAuth2/SAML）
2. 認証プロバイダーが認証実行
3. 成功時にJWT発行（テナント・ロール情報含む）
4. 後続リクエストでJWT検証・権限チェック
5. RLS + 動的権限でデータアクセス制御
```

## 2. コアテーブル設計

### 2.1 テナント管理（Auth0委託対応）
```sql
-- テナント（組織）マスタ
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本情報
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,     -- URL識別子
  
  -- プラン・分離レベル
  plan_type VARCHAR(20) DEFAULT 'starter', -- starter, professional, enterprise
  isolation_level VARCHAR(20) DEFAULT 'shared', -- shared, schema, container
  
  -- Auth0統合設定
  auth0_domain VARCHAR(255),             -- Auth0ドメイン（カスタムドメイン対応）
  email_domains JSONB DEFAULT '[]',      -- 許可メールドメイン ["company.com", "subsidiary.com"]
  
  -- 設定
  settings JSONB DEFAULT '{}',
  
  -- 状態
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_status VARCHAR(50) DEFAULT 'trial',
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_plan_type ON tenants(plan_type);
CREATE INDEX idx_tenants_email_domains ON tenants USING GIN (email_domains);
```

### 2.2 ワークスペース管理
```sql
-- ワークスペース（テナント内の作業領域）
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- 基本情報
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- 設定
  settings JSONB DEFAULT '{}',
  
  -- 状態
  is_active BOOLEAN DEFAULT true,
  
  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- 後でユーザーテーブル作成後に外部キー追加
  
  UNIQUE(tenant_id, name)
);
```

### 2.3 ユーザー管理（Auth0委託対応・大幅簡素化）
```sql
-- アプリケーションユーザー（Auth0委託版）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Auth0識別子
  auth0_user_id VARCHAR(255) UNIQUE NOT NULL, -- "auth0|64f2e..." 形式
  
  -- 基本情報
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  
  -- プロフィール
  avatar_url TEXT,
  phone VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
  language VARCHAR(10) DEFAULT 'ja',
  
  -- 状態
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ユニーク制約
  UNIQUE(tenant_id, email)
);

-- インデックス
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth0_user_id ON users(auth0_user_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ワークスペースへの外部キー追加
ALTER TABLE workspaces ADD CONSTRAINT fk_workspaces_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id);

-- 削除されたカラム（Auth0が管理）:
-- - password_hash (Auth0のUser Management)
-- - oauth2_provider, oauth2_subject (Auth0のIdentity Providers)
-- - saml_subject (Auth0のEnterprise Connections)
-- - mfa_enabled, mfa_secret (Auth0のMFA機能)
-- - email_verified (Auth0のEmail Verification)
-- - last_login_at (Auth0のLogs機能で確認可能)
```

## 3. 動的ロール・権限システム

### 3.1 ロール管理（完全動的）
```sql
-- 動的ロール（事前定義なし）
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ロール情報
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6b7280',    -- Discord風カラー
  display_order INTEGER DEFAULT 0,
  
  -- テンプレート情報
  is_template_imported BOOLEAN DEFAULT false,
  template_role_id VARCHAR(100),         -- 元テンプレートロールID
  
  -- 状態
  is_active BOOLEAN DEFAULT true,
  
  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(tenant_id, name)
);

-- ユーザーロール割り当て（複数ロール対応）
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  
  -- 割り当て情報
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,               -- 期限付きロール
  
  -- 割り当て理由
  assignment_reason TEXT,
  
  PRIMARY KEY (user_id, role_id)
);
```

### 3.2 動的権限システム
```sql
-- リソースベース動的権限
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- リソース識別
  resource_type VARCHAR(50) NOT NULL,    -- database, document, folder, workspace
  resource_id UUID,                     -- 具体的なリソースID（NULLなら全体）
  resource_name VARCHAR(255),           -- リソース名（表示用）
  
  -- アクション・スコープ
  action VARCHAR(50) NOT NULL,          -- read, write, delete, share, export
  scope VARCHAR(20) DEFAULT 'own',      -- own, team, workspace, all
  
  -- 権限詳細
  name VARCHAR(255) NOT NULL,           -- 表示用権限名
  description TEXT,
  
  -- 条件指定
  conditions JSONB DEFAULT '{}',        -- フィールド制限・値フィルター等
  
  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, resource_type, resource_id, action, scope)
);

-- ロール権限マッピング
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  
  PRIMARY KEY (role_id, permission_id)
);
```

## 4. テナント分離実装

### 4.1 Row Level Security (Starter プラン)
```sql
-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- テナント分離ポリシー
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_roles ON roles
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_permissions ON permissions
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- テナントコンテキスト設定関数
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 スキーマ分離 (Professional プラン)
```sql
-- テナント専用スキーマ作成
CREATE OR REPLACE FUNCTION create_tenant_schema(p_tenant_id UUID)
RETURNS void AS $$
DECLARE
  schema_name TEXT := 'tenant_' || replace(p_tenant_id::text, '-', '_');
BEGIN
  -- スキーマ作成
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- テーブル作成
  EXECUTE format('
    CREATE TABLE %I.users (LIKE public.users INCLUDING ALL);
    CREATE TABLE %I.roles (LIKE public.roles INCLUDING ALL);
    CREATE TABLE %I.permissions (LIKE public.permissions INCLUDING ALL);
    CREATE TABLE %I.user_roles (LIKE public.user_roles INCLUDING ALL);
    CREATE TABLE %I.role_permissions (LIKE public.role_permissions INCLUDING ALL);
  ', schema_name, schema_name, schema_name, schema_name, schema_name);
  
  -- 外部キー制約追加
  EXECUTE format('
    ALTER TABLE %I.user_roles ADD FOREIGN KEY (user_id) REFERENCES %I.users(id);
    ALTER TABLE %I.user_roles ADD FOREIGN KEY (role_id) REFERENCES %I.roles(id);
    ALTER TABLE %I.role_permissions ADD FOREIGN KEY (role_id) REFERENCES %I.roles(id);
    ALTER TABLE %I.role_permissions ADD FOREIGN KEY (permission_id) REFERENCES %I.permissions(id);
  ', schema_name, schema_name, schema_name, schema_name, schema_name, schema_name, schema_name, schema_name);
END;
$$ LANGUAGE plpgsql;
```

## 5. Auth0委託による削除テーブル

### 5.1 削除されたテーブル（Auth0が管理）

```sql
-- 以下のテーブルはAuth0委託により削除
-- Auth0の機能で代替される

/*
-- ユーザーセッション → Auth0のSession Management
DROP TABLE IF EXISTS user_sessions;

-- 多要素認証設定 → Auth0のMFA機能
DROP TABLE IF EXISTS user_mfa;

-- パスワードリセット → Auth0のPassword Reset
DROP TABLE IF EXISTS password_resets;

-- 認証イベントログ（一部） → Auth0のLogs機能
-- 注意: アプリケーション固有のログは継続
*/
```

### 5.2 JWT Blacklist（必要に応じて）
```sql
-- JWT無効化管理（オプション）
-- 通常はJWT有効期限で管理するが、緊急無効化が必要な場合
CREATE TABLE jwt_blacklist (
  jti VARCHAR(255) PRIMARY KEY,        -- JWT ID
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,     -- 元のJWT有効期限
  revoked_by UUID REFERENCES users(id),
  reason VARCHAR(255)
);

-- 期限切れエントリの自動削除
CREATE INDEX idx_jwt_blacklist_expires_at ON jwt_blacklist(expires_at);

-- クリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist()
RETURNS void AS $$
BEGIN
  DELETE FROM jwt_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 定期実行（1日1回）
SELECT cron.schedule('cleanup-jwt-blacklist', '0 2 * * *', 'SELECT cleanup_expired_blacklist();');
```

## 6. 監査・セキュリティログ（Auth0委託対応）

### 6.1 アプリケーション固有イベントログ
```sql
-- アプリケーション固有の権限・操作イベント
-- Auth0のログは認証のみ、アプリケーション操作は自社で管理
CREATE TABLE app_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  
  -- イベント情報
  event_type VARCHAR(50) NOT NULL,      -- permission_change, role_assign, data_access
  event_result VARCHAR(20) NOT NULL,    -- success, failure, blocked
  resource_type VARCHAR(50),            -- database, document, role
  resource_id UUID,
  
  -- 操作詳細
  action VARCHAR(50) NOT NULL,          -- read, write, delete, create, assign
  old_values JSONB,                     -- 変更前の値
  new_values JSONB,                     -- 変更後の値
  
  -- コンテキスト情報
  ip_address INET,
  user_agent TEXT,
  session_info JSONB,                   -- Auth0セッション情報
  
  -- リスク評価
  risk_score INTEGER,                   -- 0-100
  risk_factors JSONB,                   -- リスク要因
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_app_audit_events_tenant_id ON app_audit_events(tenant_id);
CREATE INDEX idx_app_audit_events_user_id ON app_audit_events(user_id);
CREATE INDEX idx_app_audit_events_created_at ON app_audit_events(created_at);
CREATE INDEX idx_app_audit_events_event_type ON app_audit_events(event_type);
CREATE INDEX idx_app_audit_events_resource ON app_audit_events(resource_type, resource_id);

-- Auth0認証ログとの連携用ビュー
CREATE VIEW auth_audit_combined AS
SELECT 
  'auth0' as source,
  id,
  tenant_id,
  user_id,
  'auth' as event_category,
  event_type,
  event_result,
  ip_address,
  user_agent,
  created_at
FROM app_audit_events 
WHERE event_type IN ('login_callback', 'token_refresh')
UNION ALL
SELECT 
  'app' as source,
  id,
  tenant_id,
  user_id,
  'application' as event_category,
  event_type,
  event_result,
  ip_address,
  user_agent,
  created_at
FROM app_audit_events 
WHERE event_type NOT IN ('login_callback', 'token_refresh');
```

### 6.2 権限変更監査
```sql
-- 権限変更履歴
CREATE TABLE permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 変更対象
  target_type VARCHAR(20) NOT NULL,     -- role, user, permission
  target_id UUID NOT NULL,
  target_name VARCHAR(255),
  
  -- 変更内容
  change_type VARCHAR(20) NOT NULL,     -- create, update, delete, assign, revoke
  old_values JSONB,
  new_values JSONB,
  
  -- 実行者
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- コンテキスト
  ip_address INET,
  user_agent TEXT,
  reason TEXT
);
```

## 7. 初期化・マイグレーション

### 7.1 テナント初期化
```sql
-- 新規テナント初期化関数
CREATE OR REPLACE FUNCTION initialize_tenant(
  p_tenant_name VARCHAR(255),
  p_tenant_slug VARCHAR(100),
  p_plan_type VARCHAR(20) DEFAULT 'starter',
  p_admin_email VARCHAR(255),
  p_admin_name VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_admin_role_id UUID;
  v_workspace_id UUID;
BEGIN
  -- テナント作成
  INSERT INTO tenants (name, slug, plan_type)
  VALUES (p_tenant_name, p_tenant_slug, p_plan_type)
  RETURNING id INTO v_tenant_id;
  
  -- デフォルトワークスペース作成
  INSERT INTO workspaces (tenant_id, name, description)
  VALUES (v_tenant_id, 'メインワークスペース', 'デフォルトワークスペース')
  RETURNING id INTO v_workspace_id;
  
  -- 管理者ユーザー作成
  INSERT INTO users (tenant_id, email, name, is_active, email_verified)
  VALUES (v_tenant_id, p_admin_email, p_admin_name, true, true)
  RETURNING id INTO v_user_id;
  
  -- 管理者ロール作成
  INSERT INTO roles (tenant_id, name, description, color, created_by)
  VALUES (v_tenant_id, 'システム管理者', '全権限を持つ管理者', '#dc2626', v_user_id)
  RETURNING id INTO v_admin_role_id;
  
  -- 管理者権限付与（全権限）
  INSERT INTO permissions (tenant_id, resource_type, action, scope, name)
  VALUES (v_tenant_id, '*', '*', 'all', '全権限');
  
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id
  FROM permissions p
  WHERE p.tenant_id = v_tenant_id AND p.resource_type = '*';
  
  -- ユーザーにロール割り当て
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (v_user_id, v_admin_role_id, v_user_id);
  
  -- プラン別初期化
  CASE p_plan_type
    WHEN 'professional' THEN
      PERFORM create_tenant_schema(v_tenant_id);
    WHEN 'enterprise' THEN
      PERFORM create_tenant_container(v_tenant_id);
    ELSE
      -- Starter: RLS設定のみ（既に設定済み）
      NULL;
  END CASE;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;
```

## 8. パフォーマンス最適化

### 8.1 インデックス戦略
```sql
-- 複合インデックス
CREATE INDEX idx_user_roles_composite ON user_roles(user_id, role_id) 
  WHERE expires_at IS NULL OR expires_at > NOW();

CREATE INDEX idx_role_permissions_composite ON role_permissions(role_id, permission_id);

CREATE INDEX idx_permissions_resource ON permissions(tenant_id, resource_type, resource_id);

-- 部分インデックス
CREATE INDEX idx_users_active ON users(tenant_id, id) WHERE is_active = true;
CREATE INDEX idx_sessions_active ON user_sessions(user_id) WHERE expires_at > NOW();
```

### 8.2 権限チェック最適化
```sql
-- 権限チェック高速化関数
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_action VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
BEGIN
  -- キャッシュ機能付きの高速権限チェック
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND (p.resource_type = p_resource_type OR p.resource_type = '*')
      AND (p.resource_id = p_resource_id OR p.resource_id IS NULL)
      AND (p.action = p_action OR p.action = '*')
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql STABLE;
```

## 9. Auth0委託による簡素化効果

### 9.1 削除されたテーブル・カラム
```sql
-- 削除されたテーブル（5個）
-- user_sessions (セッション管理)
-- user_mfa (多要素認証)
-- password_resets (パスワードリセット)
-- auth_events (認証イベント - 一部はapp_audit_eventsに統合)
-- oauth_states (OAuth状態管理)

-- usersテーブルから削除されたカラム（7個）
-- password_hash
-- oauth2_provider, oauth2_subject
-- saml_subject  
-- mfa_enabled, mfa_secret
-- email_verified
-- last_login_at
```

### 9.2 追加されたAuth0統合要素
```sql
-- tenantsテーブルに追加
-- auth0_domain (カスタムドメイン対応)
-- email_domains (メールドメインベーステナント識別)

-- usersテーブルに追加  
-- auth0_user_id (Auth0ユーザー識別子)

-- 新規テーブル（オプション）
-- jwt_blacklist (JWT無効化管理)
```

## 10. まとめ

この**Auth0委託対応データベース設計**により：

1. **大幅な簡素化**: テーブル5個削除、カラム7個削除
2. **開発速度向上**: 認証機能開発3-4週間短縮
3. **セキュリティ向上**: Auth0の専門的セキュリティ対策に委託
4. **運用コスト削減**: 認証基盤の保守・監査が不要
5. **権限システム継続**: 動的ロール・リソースベース権限は維持

**技術的メリット**:
- Spring Bootコード約30%削減
- データベーススキーマ大幅簡素化
- JWT検証のみに特化した軽量認証層

**ビジネスメリット**:
- 迅速なMVP開発
- エンタープライズレベルのセキュリティ
- 汎用プラットフォームとしての拡張性維持

**結果**: Auth0の力を活用して開発速度を最優先としながら、汎用ビジネス管理プラットフォームの柔軟性を保持した最適なデータベース設計を実現