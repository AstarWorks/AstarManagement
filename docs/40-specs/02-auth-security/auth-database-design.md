# 認証・権限システム データベース設計書

## 1. 設計方針

### 1.1 基本方針
- **Supabase Auth**を認証基盤として使用
- **マルチテナント対応**（事務所ごとにデータ分離）
- **Row Level Security (RLS)**でデータアクセス制御
- **シンプルな権限モデル**（MVP段階）

### 1.2 認証フロー
```
1. ユーザーがメールアドレスでサインアップ
2. Supabase Authでユーザー作成
3. アプリ側DBにユーザー情報を同期
4. テナント（事務所）に紐付け
5. JWTトークンにテナント情報を含める
```

## 2. テーブル設計

### 2.1 auth.users（Supabase Auth管理）
```sql
-- Supabaseが自動的に管理するテーブル
-- 直接操作せず、Supabase AuthのAPIを使用
```

### 2.2 public.tenants（事務所）
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本情報
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  
  -- 連絡先
  email VARCHAR(255),
  phone VARCHAR(50),
  postal_code VARCHAR(10),
  address TEXT,
  
  -- 設定
  settings JSONB DEFAULT '{}',
  
  -- 状態
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
```

### 2.3 public.users（アプリケーションユーザー）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 基本情報
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  
  -- 役職・権限
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- admin, lawyer, paralegal, member
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- プロフィール
  avatar_url TEXT,
  phone VARCHAR(50),
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2.4 public.invitations（招待）
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 招待情報
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  token VARCHAR(255) NOT NULL UNIQUE,
  
  -- 状態
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- 招待者情報
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- ユニーク制約（同じメールアドレスへの重複招待を防ぐ）
  UNIQUE(tenant_id, email, status)
);

-- インデックス
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
```

### 2.5 public.user_sessions（セッション管理）
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- セッション情報
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  
  -- 有効期限
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 作成情報
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

## 3. Row Level Security (RLS) 設定

### 3.1 tenants テーブル
```sql
-- RLSを有効化
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 自分のテナント情報のみ参照可能
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT
  USING (id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- 管理者のみテナント情報を更新可能
CREATE POLICY "Admins can update tenant" ON tenants
  FOR UPDATE
  USING (id IN (
    SELECT tenant_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));
```

### 3.2 users テーブル
```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 同じテナントのユーザー情報を参照可能
CREATE POLICY "Users can view same tenant users" ON users
  FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- 自分の情報は更新可能
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- 管理者は同じテナントのユーザーを管理可能
CREATE POLICY "Admins can manage tenant users" ON users
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## 4. 関数とトリガー

### 4.1 ユーザー作成時の自動処理
```sql
-- Supabase Authでユーザー作成時に呼ばれる関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- 招待トークンから情報を取得
  SELECT * INTO invitation_record
  FROM invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
  LIMIT 1;
  
  IF invitation_record IS NOT NULL THEN
    -- 招待からの登録
    INSERT INTO users (id, tenant_id, email, name, role)
    VALUES (
      NEW.id,
      invitation_record.tenant_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      invitation_record.role
    );
    
    -- 招待を承認済みに更新
    UPDATE invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation_record.id;
  ELSE
    -- 新規テナントとして登録（最初のユーザー）
    WITH new_tenant AS (
      INSERT INTO tenants (name)
      VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Office'))
      RETURNING id
    )
    INSERT INTO users (id, tenant_id, email, name, role)
    SELECT 
      NEW.id,
      new_tenant.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'admin' -- 最初のユーザーは管理者
    FROM new_tenant;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー設定
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 4.2 JWTカスタムクレーム追加
```sql
-- JWTにテナント情報を追加する関数
CREATE OR REPLACE FUNCTION add_custom_claims()
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    u.tenant_id,
    u.role,
    t.name as tenant_name
  INTO user_record
  FROM users u
  JOIN tenants t ON u.tenant_id = t.id
  WHERE u.id = auth.uid();
  
  RETURN jsonb_build_object(
    'tenant_id', user_record.tenant_id,
    'role', user_record.role,
    'tenant_name', user_record.tenant_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 5. 初期データ投入

```sql
-- デモ用テナントとユーザー
INSERT INTO tenants (id, name, name_kana) VALUES
  ('11111111-1111-1111-1111-111111111111', '山田法律事務所', 'ヤマダホウリツジムショ');

-- Supabase Authでユーザーを作成後、以下を実行
-- INSERT INTO users (id, tenant_id, email, name, role) VALUES
--   ('{auth_user_id}', '11111111-1111-1111-1111-111111111111', 'admin@example.com', '山田太郎', 'admin');
```

## 6. セキュリティ考慮事項

1. **パスワード管理**: Supabase Authに委譲
2. **セッション管理**: JWTの有効期限を適切に設定
3. **招待リンク**: 有効期限を設定（デフォルト7日間）
4. **監査ログ**: 重要な操作は別途ログテーブルに記録

## 7. MVP以降の拡張予定

1. **詳細な権限管理**: 機能単位でのアクセス制御
2. **複数事務所対応**: 1ユーザーが複数テナントに所属
3. **外部認証連携**: Google、Microsoft等のSSO
4. **二要素認証**: セキュリティ強化