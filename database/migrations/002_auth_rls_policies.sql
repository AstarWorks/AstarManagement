-- Row Level Security (RLS) ポリシー設定
-- 認証テーブルへのアクセス制御

-- 1. RLSを有効化
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 2. tenants テーブルのポリシー
-- 2.1 自分のテナント情報のみ参照可能
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- 2.2 管理者のみテナント情報を更新可能
CREATE POLICY "Admins can update tenant" ON tenants
  FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. users テーブルのポリシー
-- 3.1 同じテナントのユーザー情報を参照可能
CREATE POLICY "Users can view same tenant users" ON users
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- 3.2 自分の情報は更新可能（一部フィールドのみ）
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND role = (SELECT role FROM users WHERE id = auth.uid()) -- roleは変更不可
  );

-- 3.3 管理者は同じテナントのユーザーを管理可能
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND id != auth.uid() -- 自分自身は別ポリシーで管理
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. invitations テーブルのポリシー
-- 4.1 管理者のみ招待を作成可能
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND invited_by = auth.uid()
  );

-- 4.2 同じテナントの招待を参照可能
CREATE POLICY "Users can view tenant invitations" ON invitations
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- 4.3 管理者は招待を削除可能（キャンセル）
CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND status = 'pending'
  );

-- 5. カスタム関数：現在のユーザー情報を取得
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE (
  user_id UUID,
  tenant_id UUID,
  role VARCHAR(50),
  email VARCHAR(255),
  name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.tenant_id,
    u.role,
    u.email,
    u.name
  FROM users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. カスタム関数：テナントのユーザー一覧を取得
CREATE OR REPLACE FUNCTION get_tenant_users()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50),
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_active,
    u.created_at
  FROM users u
  WHERE u.tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ポリシーのテスト用コメント
-- テスト方法：
-- 1. 異なるロールのユーザーでログイン
-- 2. 各テーブルへのCRUD操作を試行
-- 3. RLSが正しく動作することを確認

COMMENT ON POLICY "Users can view own tenant" ON tenants IS 
  'ユーザーは自分が所属するテナントの情報のみ参照可能';

COMMENT ON POLICY "Admins can update tenant" ON tenants IS 
  '管理者のみがテナント情報を更新可能';

COMMENT ON POLICY "Users can view same tenant users" ON users IS 
  '同じテナントのユーザー情報を参照可能';

COMMENT ON POLICY "Users can update own profile" ON users IS 
  'ユーザーは自分のプロフィールを更新可能（roleは変更不可）';

COMMENT ON POLICY "Admins can create invitations" ON invitations IS 
  '管理者のみが新規ユーザーを招待可能';