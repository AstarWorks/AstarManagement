# 認証機能 - Database Schema

## テーブル構造

### users テーブル
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### refresh_tokens テーブル
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_refresh_tokens_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### login_attempts テーブル
```sql
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    user_agent TEXT,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT idx_login_attempts_email_ip 
        INDEX (email, ip_address, attempted_at)
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);
```

### password_reset_tokens テーブル
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_password_reset_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_password_reset_token UNIQUE (token_hash)
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);
```

### audit_logs テーブル
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    workspace_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_logs_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT fk_audit_logs_workspace 
        FOREIGN KEY (workspace_id) 
        REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

## インデックス戦略

### パフォーマンス最適化
```sql
-- 認証時の高速検索
CREATE INDEX idx_users_email_password_active 
    ON users(email, is_active) 
    WHERE is_active = true;

-- トークン検証の高速化
CREATE INDEX idx_refresh_tokens_valid 
    ON refresh_tokens(token_hash, expires_at) 
    WHERE revoked_at IS NULL;

-- ログイン試行の監視
CREATE INDEX idx_login_attempts_recent 
    ON login_attempts(email, attempted_at) 
    WHERE attempted_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';
```

## Row Level Security (RLS)

### users テーブルのRLS
```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分のデータのみ読み取り可能
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (id = current_user_id());

-- ポリシー: 自分のデータのみ更新可能
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (id = current_user_id())
    WITH CHECK (id = current_user_id());

-- ポリシー: 管理者は全ユーザーを読み取り可能
CREATE POLICY users_admin_select ON users
    FOR SELECT
    USING (current_user_has_role('ADMIN'));
```

### audit_logs テーブルのRLS
```sql
-- RLSを有効化
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分のワークスペースのログのみ表示
CREATE POLICY audit_logs_workspace ON audit_logs
    FOR SELECT
    USING (workspace_id = current_workspace_id());

-- ポリシー: 管理者は全ログを表示可能
CREATE POLICY audit_logs_admin ON audit_logs
    FOR SELECT
    USING (current_user_has_permission('audit:read'));
```

## データ保持ポリシー

### 自動削除設定
```sql
-- 古いリフレッシュトークンの削除（30日経過）
CREATE OR REPLACE FUNCTION cleanup_old_refresh_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
        OR revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 古いログイン試行の削除（90日経過）
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts
    WHERE attempted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 定期実行ジョブ設定
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('cleanup-tokens', '0 2 * * *', 
    'SELECT cleanup_old_refresh_tokens();');

SELECT cron.schedule('cleanup-login-attempts', '0 3 * * *', 
    'SELECT cleanup_old_login_attempts();');
```