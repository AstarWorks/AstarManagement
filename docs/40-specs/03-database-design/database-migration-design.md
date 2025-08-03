# データベースマイグレーション設計書

## 1. マイグレーション戦略

### 1.1 MVP段階の方針
```yaml
開発初期（MVP）:
  - Supabase Migrationsで素早く開始
  - SQLファイルを直接管理
  - 開発速度を優先

本格開発移行時:
  - Flywayに移行
  - 既存のSQLを再利用
  - CI/CDパイプラインに統合
```

### 1.2 移行パス
```
MVP: Supabase Dashboard → SQL Export → Git管理
 ↓
Phase 2: SQL → Flyway形式に変換
 ↓
Production: Flyway完全管理
```

## 2. Flyway設定

### 2.1 ディレクトリ構造
```
backend/
├── src/main/resources/
│   ├── db/migration/          # 本番用マイグレーション
│   │   ├── V1__create_auth_tables.sql
│   │   ├── V2__create_expense_tables.sql
│   │   ├── V3__create_attachment_tables.sql
│   │   └── V4__create_tag_tables.sql
│   │
│   ├── db/testdata/          # テストデータ（別管理）
│   │   ├── R__test_users.sql
│   │   └── R__test_expenses.sql
│   │
│   └── db/seed/              # 初期マスタデータ
│       └── R__mAstar_data.sql
```

### 2.2 Flyway設定（application.yml）
```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations:
      - classpath:db/migration
      - classpath:db/seed
    # 環境別設定
    placeholders:
      environment: ${ENVIRONMENT:development}
    
    # 開発環境のみテストデータ追加
    # locations: classpath:db/migration,classpath:db/seed,classpath:db/testdata

flyway:
  # バージョン管理テーブル
  table: flyway_schema_history
  
  # 失敗時の挙動
  clean-on-validation-error: false  # 本番は必ずfalse
  
  # エンコーディング
  encoding: UTF-8
```

## 3. マイグレーションファイル

### 3.1 V1__create_auth_tables.sql
```sql
-- 認証・権限システムの基本テーブル

-- 1. テナント
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  postal_code VARCHAR(10),
  address TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_status VARCHAR(50) DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ユーザー
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- Supabase Auth IDを使用
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'lawyer', 'paralegal', 'member'))
);

-- 3. インデックス
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);

-- 4. RLS設定
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. 更新日時トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.2 V2__create_expense_tables.sql
```sql
-- 実費管理テーブル

-- 1. 案件（最小限）
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 実費
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 基本情報
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  income_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (income_amount >= 0),
  expense_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (expense_amount >= 0),
  
  -- 関連情報
  case_id UUID REFERENCES cases(id),
  user_id UUID NOT NULL REFERENCES users(id),
  memo TEXT,
  
  -- 承認
  approval_status VARCHAR(20) DEFAULT 'approved',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  
  -- 制約
  CONSTRAINT expense_amount_check CHECK (
    (income_amount > 0 AND expense_amount = 0) OR 
    (income_amount = 0 AND expense_amount > 0) OR
    (income_amount = 0 AND expense_amount = 0)
  )
);

-- 3. 月次残高
CREATE TABLE IF NOT EXISTS expense_monthly_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  year_month DATE NOT NULL,
  case_id UUID REFERENCES cases(id),
  user_id UUID REFERENCES users(id),
  category VARCHAR(50),
  opening_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_income DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_expense DECIMAL(12, 2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, year_month, case_id, user_id, category)
);

-- 4. インデックス
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, date DESC) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_tenant_case ON expenses(tenant_id, case_id) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_tenant ON cases(tenant_id);

-- 5. RLS設定
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_monthly_balances ENABLE ROW LEVEL SECURITY;
```

### 3.3 環境別マイグレーション管理
```kotlin
// FlywayConfig.kt
@Configuration
class FlywayConfig(
    @Value("\${spring.profiles.active:development}")
    private val activeProfile: String
) {
    
    @Bean
    fun flywayMigrationStrategy(): FlywayMigrationStrategy {
        return FlywayMigrationStrategy { flyway ->
            when (activeProfile) {
                "development" -> {
                    // 開発環境：クリーン許可
                    flyway.clean()
                    flyway.migrate()
                }
                "staging" -> {
                    // ステージング：本番同様
                    flyway.migrate()
                }
                "production" -> {
                    // 本番：検証後マイグレーション
                    flyway.validate()
                    flyway.migrate()
                }
                "test" -> {
                    // テスト：毎回クリーン
                    flyway.clean()
                    flyway.migrate()
                }
            }
        }
    }
}
```

## 4. マイグレーション運用手順

### 4.1 新規マイグレーション作成
```bash
# 1. SQLファイル作成
touch src/main/resources/db/migration/V5__add_expense_tags.sql

# 2. ローカルでテスト
./gradlew flywayMigrate

# 3. ロールバック確認（開発環境のみ）
./gradlew flywayClean flywayMigrate
```

### 4.2 本番適用フロー
```yaml
1. ステージング環境でテスト
2. マイグレーションのDry Run
3. バックアップ取得
4. 本番適用
5. ヘルスチェック
```

## 5. Supabaseとの統合戦略

### 5.1 MVP段階（Supabase優先）
```bash
# Supabase CLIでマイグレーション管理
supabase migration new create_expense_tables
supabase db push
supabase db dump -f initial_schema.sql

# Flywayへの移行準備
cp initial_schema.sql src/main/resources/db/migration/V1__initial_schema.sql
```

### 5.2 Flyway移行時の注意点
```sql
-- Supabaseの既存テーブルをスキップ
INSERT INTO flyway_schema_history (
  installed_rank, version, description, type, script, checksum,
  installed_by, installed_on, execution_time, success
) VALUES (
  1, '0', 'Supabase Initial Schema', 'SQL', 'manual', 0,
  'migration', NOW(), 0, true
);
```

## 6. ベストプラクティス

### 6.1 命名規則
```
V{番号}__{説明}.sql

良い例：
- V1__create_user_tables.sql
- V2__add_expense_category_column.sql
- V3__create_index_on_expenses.sql

悪い例：
- V1__initial.sql（曖昧）
- V2__fix.sql（内容不明）
```

### 6.2 マイグレーションの粒度
```sql
-- 良い：1つの目的
-- V4__add_attachment_support.sql
CREATE TABLE attachments (...);
CREATE INDEX idx_attachments_expense ON attachments(expense_id);

-- 悪い：複数の無関係な変更
-- V4__various_changes.sql
ALTER TABLE expenses ADD COLUMN foo;
CREATE TABLE unrelated_table (...);
UPDATE some_data SET ...;
```

### 6.3 安全なマイグレーション
```sql
-- 1. NOT NULL追加は2段階で
-- V5__add_category_column.sql
ALTER TABLE expenses ADD COLUMN category VARCHAR(50);
UPDATE expenses SET category = 'other' WHERE category IS NULL;

-- V6__make_category_required.sql
ALTER TABLE expenses ALTER COLUMN category SET NOT NULL;

-- 2. インデックス作成は並行実行
CREATE INDEX CONCURRENTLY idx_expenses_date ON expenses(date);

-- 3. 大量データ更新は分割
DO $$
BEGIN
  FOR i IN 0..9 LOOP
    UPDATE expenses 
    SET new_field = calculate_value(old_field)
    WHERE id % 10 = i;
    COMMIT;
  END LOOP;
END $$;
```

## 7. トラブルシューティング

### 7.1 マイグレーション失敗時
```bash
# 状態確認
./gradlew flywayInfo

# 失敗したマイグレーションを修復
./gradlew flywayRepair

# 開発環境のみ：クリーンスタート
./gradlew flywayClean flywayMigrate
```

### 7.2 チェックサム不一致
```sql
-- 開発環境のみ：履歴テーブルを更新
UPDATE flyway_schema_history 
SET checksum = NULL 
WHERE version = '2';
```

この設計により、MVPから本番まで段階的に成長できるマイグレーション体制が整います。