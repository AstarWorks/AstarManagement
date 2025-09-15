# 実費残高管理の再設計

## 1. 残高管理の方式比較

### 方式A: レコードごとに残高を持つ（現在の設計）
```sql
expenses table:
id | date       | amount | balance
1  | 2024-01-01 | 1000   | 1000
2  | 2024-01-02 | -500   | 500
3  | 2024-01-03 | 2000   | 2500
```

**問題：**
- 2番目のレコードを修正すると、3番目も再計算必要
- 案件別の残高計算が困難

### 方式B: 残高を別テーブルで管理（推奨）
```sql
-- 実費テーブル（残高カラムなし）
expenses table:
id | date       | case_id | user_id | income | expense

-- 残高サマリーテーブル
expense_balances table:
tenant_id | case_id | user_id | period  | total_income | total_expense | balance
```

### 方式C: 都度計算（残高を保存しない）
```sql
-- 必要時にSUMで計算
SELECT 
  SUM(income_amount - expense_amount) as balance
FROM expenses
WHERE case_id = ? AND date <= ?
```

## 2. 推奨設計：ハイブリッド方式

### 2.1 実費テーブル（改訂版）
```sql
CREATE TABLE expenses (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- マルチテナント
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 基本情報
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  
  -- 金額（残高カラムを削除）
  income_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (income_amount >= 0),
  expense_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (expense_amount >= 0),
  
  -- 関連情報
  case_id UUID REFERENCES cases(id),
  user_id UUID NOT NULL REFERENCES users(id),  -- 記録者
  memo TEXT,
  
  -- 承認（将来拡張用）
  approval_status VARCHAR(20) DEFAULT 'approved',  -- draft, pending, approved, rejected
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  -- 論理削除
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);
```

### 2.2 実費タグテーブル（新規）
```sql
CREATE TABLE expense_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  name VARCHAR(100) NOT NULL,
  name_key VARCHAR(255) NOT NULL,  -- i18n対応
  color VARCHAR(7),  -- #RRGGBB
  icon VARCHAR(50),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  
  UNIQUE(tenant_id, name)
);

-- 実費とタグの関連
CREATE TABLE expense_tag_relations (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES expense_tags(id) ON DELETE CASCADE,
  
  attached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attached_by UUID NOT NULL REFERENCES users(id),
  
  PRIMARY KEY (expense_id, tag_id)
);
```

### 2.3 月次残高サマリーテーブル（集計用）
```sql
CREATE TABLE expense_monthly_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- 集計軸
  year_month DATE NOT NULL,  -- 月初日で保存
  case_id UUID,  -- NULLなら全案件
  user_id UUID,  -- NULLなら全ユーザー
  category VARCHAR(50),  -- NULLなら全科目
  
  -- 集計値
  opening_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,  -- 月初残高
  total_income DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_expense DECIMAL(12, 2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,  -- 月末残高
  transaction_count INTEGER NOT NULL DEFAULT 0,
  
  -- 更新管理
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, year_month, case_id, user_id, category)
);

-- 集計更新関数
CREATE OR REPLACE FUNCTION update_monthly_balance(
  p_tenant_id UUID,
  p_year_month DATE,
  p_case_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- 前月の残高を取得
  WITH prev_balance AS (
    SELECT closing_balance
    FROM expense_monthly_balances
    WHERE tenant_id = p_tenant_id
      AND year_month = p_year_month - INTERVAL '1 month'
      AND case_id IS NOT DISTINCT FROM p_case_id
      AND user_id IS NOT DISTINCT FROM p_user_id
  ),
  current_month AS (
    SELECT 
      COALESCE(SUM(income_amount), 0) as income,
      COALESCE(SUM(expense_amount), 0) as expense,
      COUNT(*) as count
    FROM expenses
    WHERE tenant_id = p_tenant_id
      AND date >= p_year_month
      AND date < p_year_month + INTERVAL '1 month'
      AND (p_case_id IS NULL OR case_id = p_case_id)
      AND (p_user_id IS NULL OR user_id = p_user_id)
      AND deleted_at IS NULL
  )
  INSERT INTO expense_monthly_balances (
    tenant_id, year_month, case_id, user_id,
    opening_balance, total_income, total_expense, closing_balance,
    transaction_count
  )
  SELECT 
    p_tenant_id,
    p_year_month,
    p_case_id,
    p_user_id,
    COALESCE(pb.closing_balance, 0),
    cm.income,
    cm.expense,
    COALESCE(pb.closing_balance, 0) + cm.income - cm.expense,
    cm.count
  FROM current_month cm, prev_balance pb
  ON CONFLICT (tenant_id, year_month, case_id, user_id, category)
  DO UPDATE SET
    total_income = EXCLUDED.total_income,
    total_expense = EXCLUDED.total_expense,
    closing_balance = EXCLUDED.closing_balance,
    transaction_count = EXCLUDED.transaction_count,
    last_calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

## 3. 残高取得方法

### 3.1 リアルタイム残高（少量データ用）
```sql
-- 特定日時点の残高を計算
CREATE OR REPLACE FUNCTION get_balance_at_date(
  p_tenant_id UUID,
  p_date DATE,
  p_case_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(income_amount - expense_amount), 0)
  FROM expenses
  WHERE tenant_id = p_tenant_id
    AND date <= p_date
    AND (p_case_id IS NULL OR case_id = p_case_id)
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND deleted_at IS NULL;
$$ LANGUAGE sql STABLE;
```

### 3.2 高速残高取得（大量データ用）
```sql
-- 月次サマリーを使った高速計算
CREATE OR REPLACE FUNCTION get_balance_fast(
  p_tenant_id UUID,
  p_date DATE,
  p_case_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_year_month DATE;
  v_base_balance DECIMAL;
  v_current_month_diff DECIMAL;
BEGIN
  -- 対象月の月初を取得
  v_year_month := DATE_TRUNC('month', p_date);
  
  -- 前月末の残高を取得
  SELECT closing_balance INTO v_base_balance
  FROM expense_monthly_balances
  WHERE tenant_id = p_tenant_id
    AND year_month = v_year_month - INTERVAL '1 month'
    AND case_id IS NOT DISTINCT FROM p_case_id
    AND user_id IS NOT DISTINCT FROM p_user_id;
  
  -- 当月の差分を計算
  SELECT COALESCE(SUM(income_amount - expense_amount), 0) INTO v_current_month_diff
  FROM expenses
  WHERE tenant_id = p_tenant_id
    AND date >= v_year_month
    AND date <= p_date
    AND (p_case_id IS NULL OR case_id = p_case_id)
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND deleted_at IS NULL;
  
  RETURN COALESCE(v_base_balance, 0) + v_current_month_diff;
END;
$$ LANGUAGE plpgsql STABLE;
```

## 4. 裏付け資料の設定

```yaml
添付ファイル制限:
  最大ファイル数: 5個/実費
  最大ファイルサイズ: 10MB/ファイル
  合計最大サイズ: 30MB/実費
  
対応形式:
  画像: [jpg, jpeg, png, gif, webp]
  文書: [pdf, doc, docx, xls, xlsx]
  その他: [txt, csv]
  
サムネイル:
  生成対象: 画像ファイルのみ
  サイズ: 200x200px
  形式: webp
```

## 5. CSVインポートの重複チェック

```sql
-- 重複チェック用のハッシュカラムを追加
ALTER TABLE expenses ADD COLUMN 
  import_hash VARCHAR(64) GENERATED ALWAYS AS (
    MD5(
      COALESCE(date::text, '') || '|' ||
      COALESCE(description, '') || '|' ||
      COALESCE(income_amount::text, '0') || '|' ||
      COALESCE(expense_amount::text, '0')
    )
  ) STORED;

CREATE INDEX idx_expenses_import_hash ON expenses(tenant_id, import_hash);

-- 重複チェック関数
CREATE OR REPLACE FUNCTION check_expense_duplicate(
  p_tenant_id UUID,
  p_date DATE,
  p_description TEXT,
  p_income_amount DECIMAL,
  p_expense_amount DECIMAL
) RETURNS TABLE (
  is_duplicate BOOLEAN,
  existing_id UUID,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH hash_check AS (
    SELECT id, 1.0::float as score
    FROM expenses
    WHERE tenant_id = p_tenant_id
      AND import_hash = MD5(
        p_date::text || '|' ||
        p_description || '|' ||
        p_income_amount::text || '|' ||
        p_expense_amount::text
      )
      AND deleted_at IS NULL
    LIMIT 1
  )
  SELECT 
    EXISTS(SELECT 1 FROM hash_check),
    h.id,
    h.score
  FROM hash_check h
  UNION ALL
  SELECT false, NULL::uuid, 0.0
  WHERE NOT EXISTS(SELECT 1 FROM hash_check);
END;
$$ LANGUAGE plpgsql;
```

## 6. メリット

1. **パフォーマンス向上**
   - 残高計算が月次サマリーで高速化
   - 過去データ修正時の影響を最小化

2. **柔軟な集計**
   - 案件別、ユーザー別、全体の残高を管理
   - タグによる自由なグループ化

3. **拡張性**
   - 承認ワークフロー対応済み
   - 将来の要件に対応しやすい