-- 認証・権限システムのデータベース構築
-- 実行順序が重要なので、番号付きで管理

-- 1. テナント（事務所）テーブル
CREATE TABLE IF NOT EXISTS tenants (
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
  subscription_status VARCHAR(50) DEFAULT 'trial',
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ユーザーテーブル（Supabase Authと連携）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 基本情報
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  
  -- 役職・権限
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- プロフィール
  avatar_url TEXT,
  phone VARCHAR(50),
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 3. 招待テーブル
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 招待情報
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  token VARCHAR(255) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- 状態
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- 招待者情報
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- ユニーク制約
  UNIQUE(tenant_id, email, status)
);

-- 4. インデックス作成
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- 5. 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. トリガー設定
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. Supabase Auth連携用の関数
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
  ORDER BY invited_at DESC
  LIMIT 1;
  
  IF invitation_record IS NOT NULL THEN
    -- 招待からの登録
    INSERT INTO public.users (id, tenant_id, email, name, role)
    VALUES (
      NEW.id,
      invitation_record.tenant_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
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
      VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', '新規事務所'))
      RETURNING id
    )
    INSERT INTO public.users (id, tenant_id, email, name, role)
    SELECT 
      NEW.id,
      new_tenant.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      'admin'
    FROM new_tenant;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. トリガー設定（Supabase Auth連携）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();