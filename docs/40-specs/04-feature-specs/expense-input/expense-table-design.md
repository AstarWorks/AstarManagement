# 実費テーブル詳細設計書

## 1. テーブル設計

### 1.1 expenses（実費テーブル）
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
  
  -- 金額（分離型）
  income_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (income_amount >= 0),
  expense_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (expense_amount >= 0),
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- 関連情報
  case_id UUID REFERENCES cases(id),
  memo TEXT,
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  -- 論理削除
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  
  -- 制約
  CONSTRAINT expense_income_or_expense CHECK (
    (income_amount > 0 AND expense_amount = 0) OR 
    (income_amount = 0 AND expense_amount > 0) OR
    (income_amount = 0 AND expense_amount = 0)
  )
);

-- インデックス
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_tenant_case ON expenses(tenant_id, case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_tenant_category ON expenses(tenant_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_created_by ON expenses(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_tenant_created_at ON expenses(tenant_id, created_at DESC) WHERE deleted_at IS NULL;

-- RLS設定
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON expenses
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND deleted_at IS NULL
  );

CREATE POLICY "soft_delete_protection" ON expenses
  FOR DELETE
  USING (false);  -- 物理削除を禁止
```

### 1.2 expense_attachments（裏付け資料）
```sql
CREATE TABLE expense_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id),
  
  -- ファイル情報
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- メタデータ
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  
  -- 論理削除
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- インデックス
CREATE INDEX idx_expense_attachments_expense_id ON expense_attachments(expense_id) WHERE deleted_at IS NULL;

-- RLS設定
ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_attachment_access" ON expense_attachments
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_attachments.expense_id
      AND e.tenant_id = current_setting('app.current_tenant_id')::uuid
      AND e.deleted_at IS NULL
    )
  );
```

### 1.3 expense_audit_logs（監査ログ）
```sql
CREATE TABLE expense_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 対象
  expense_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- アクション
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'restore'
  
  -- 変更内容
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- 実行情報
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- インデックス
  PRIMARY KEY (id, performed_at)
) PARTITION BY RANGE (performed_at);

-- 月次パーティション作成（自動化スクリプトで管理）
CREATE TABLE expense_audit_logs_2024_01 PARTITION OF expense_audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- インデックス
CREATE INDEX idx_expense_audit_logs_expense_id ON expense_audit_logs(expense_id);
CREATE INDEX idx_expense_audit_logs_tenant_performed ON expense_audit_logs(tenant_id, performed_at DESC);
```

## 2. トリガー関数

### 2.1 残高計算トリガー
```sql
CREATE OR REPLACE FUNCTION calculate_expense_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_balance DECIMAL(12, 2);
  v_tenant_id UUID;
BEGIN
  -- テナントIDを取得
  v_tenant_id := NEW.tenant_id;
  
  -- 前の残高を取得（同じ日付の場合は作成時刻も考慮）
  SELECT balance INTO v_prev_balance
  FROM expenses
  WHERE tenant_id = v_tenant_id
    AND deleted_at IS NULL
    AND (
      date < NEW.date 
      OR (date = NEW.date AND created_at < NEW.created_at)
      OR (date = NEW.date AND created_at = NEW.created_at AND id < NEW.id)
    )
  ORDER BY date DESC, created_at DESC, id DESC
  LIMIT 1;
  
  -- 残高計算
  NEW.balance = COALESCE(v_prev_balance, 0) + NEW.income_amount - NEW.expense_amount;
  
  -- 後続レコードの残高も更新（非同期ジョブで実行することも検討）
  IF TG_OP = 'UPDATE' AND (OLD.income_amount != NEW.income_amount OR OLD.expense_amount != NEW.expense_amount) THEN
    PERFORM pg_notify('expense_balance_update', json_build_object(
      'tenant_id', v_tenant_id,
      'from_date', NEW.date,
      'expense_id', NEW.id
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_expense_balance
  BEFORE INSERT OR UPDATE OF income_amount, expense_amount ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_expense_balance();
```

### 2.2 監査ログ記録トリガー
```sql
CREATE OR REPLACE FUNCTION record_expense_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(50);
  v_old_values JSONB;
  v_new_values JSONB;
  v_changed_fields TEXT[];
BEGIN
  -- アクション判定
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    
    -- 変更フィールドの検出
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_old_values) o
    FULL OUTER JOIN jsonb_each(v_new_values) n ON o.key = n.key
    WHERE o.value IS DISTINCT FROM n.value;
    
    -- 論理削除の場合
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'delete';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := 'restore';
    END IF;
  END IF;
  
  -- 監査ログ記録
  INSERT INTO expense_audit_logs (
    expense_id,
    tenant_id,
    action,
    old_values,
    new_values,
    changed_fields,
    performed_by,
    ip_address,
    user_agent
  ) VALUES (
    NEW.id,
    NEW.tenant_id,
    v_action,
    v_old_values,
    v_new_values,
    v_changed_fields,
    COALESCE(NEW.updated_by, NEW.created_by),
    current_setting('app.current_ip_address', true)::inet,
    current_setting('app.current_user_agent', true)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expense_audit
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION record_expense_audit();
```

## 3. ビューとマテリアライズドビュー

### 3.1 実費詳細ビュー
```sql
CREATE VIEW v_expense_details AS
SELECT 
  e.id,
  e.tenant_id,
  e.date,
  e.category,
  ec.name_key as category_name_key,
  e.description,
  e.income_amount,
  e.expense_amount,
  e.balance,
  e.case_id,
  c.name as case_name,
  e.memo,
  e.created_at,
  e.created_by,
  u1.name as created_by_name,
  e.updated_at,
  e.updated_by,
  u2.name as updated_by_name,
  COALESCE(
    json_agg(
      json_build_object(
        'id', a.id,
        'file_name', a.file_name,
        'original_name', a.original_name,
        'file_size', a.file_size,
        'mime_type', a.mime_type
      ) ORDER BY a.uploaded_at
    ) FILTER (WHERE a.id IS NOT NULL),
    '[]'::json
  ) as attachments
FROM expenses e
LEFT JOIN expense_categories ec ON e.category = ec.code AND e.tenant_id = ec.tenant_id
LEFT JOIN cases c ON e.case_id = c.id
LEFT JOIN users u1 ON e.created_by = u1.id
LEFT JOIN users u2 ON e.updated_by = u2.id
LEFT JOIN expense_attachments a ON e.id = a.expense_id AND a.deleted_at IS NULL
WHERE e.deleted_at IS NULL
GROUP BY 
  e.id, e.tenant_id, e.date, e.category, ec.name_key,
  e.description, e.income_amount, e.expense_amount, e.balance,
  e.case_id, c.name, e.memo, e.created_at, e.created_by,
  u1.name, e.updated_at, e.updated_by, u2.name;
```

### 3.2 月次集計マテリアライズドビュー
```sql
CREATE MATERIALIZED VIEW mv_expense_monthly_summary AS
WITH monthly_data AS (
  SELECT 
    tenant_id,
    DATE_TRUNC('month', date) as month,
    category,
    case_id,
    COUNT(*) as transaction_count,
    SUM(income_amount) as total_income,
    SUM(expense_amount) as total_expense,
    COUNT(DISTINCT created_by) as unique_users
  FROM expenses
  WHERE deleted_at IS NULL
  GROUP BY tenant_id, DATE_TRUNC('month', date), category, case_id
)
SELECT 
  md.*,
  c.name as case_name,
  ec.name_key as category_name_key,
  (md.total_income - md.total_expense) as net_amount
FROM monthly_data md
LEFT JOIN cases c ON md.case_id = c.id
LEFT JOIN expense_categories ec ON md.category = ec.code AND md.tenant_id = ec.tenant_id;

-- インデックス
CREATE INDEX idx_mv_expense_monthly_tenant_month 
  ON mv_expense_monthly_summary(tenant_id, month DESC);
CREATE INDEX idx_mv_expense_monthly_tenant_category 
  ON mv_expense_monthly_summary(tenant_id, category);

-- リフレッシュ関数
CREATE OR REPLACE FUNCTION refresh_expense_monthly_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_expense_monthly_summary;
END;
$$ LANGUAGE plpgsql;
```

## 4. API用関数

### 4.1 実費一覧取得関数
```sql
CREATE OR REPLACE FUNCTION get_expenses(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_category VARCHAR(50) DEFAULT NULL,
  p_case_id UUID DEFAULT NULL,
  p_search_text TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  data JSON
) AS $$
DECLARE
  v_total_count BIGINT;
  v_data JSON;
BEGIN
  -- 総件数取得
  SELECT COUNT(*) INTO v_total_count
  FROM expenses e
  WHERE e.tenant_id = p_tenant_id
    AND e.deleted_at IS NULL
    AND (p_date_from IS NULL OR e.date >= p_date_from)
    AND (p_date_to IS NULL OR e.date <= p_date_to)
    AND (p_category IS NULL OR e.category = p_category)
    AND (p_case_id IS NULL OR e.case_id = p_case_id)
    AND (p_search_text IS NULL OR 
         e.description ILIKE '%' || p_search_text || '%' OR
         e.memo ILIKE '%' || p_search_text || '%');
  
  -- データ取得
  SELECT json_agg(row_to_json(t)) INTO v_data
  FROM (
    SELECT * FROM v_expense_details e
    WHERE e.tenant_id = p_tenant_id
      AND (p_date_from IS NULL OR e.date >= p_date_from)
      AND (p_date_to IS NULL OR e.date <= p_date_to)
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_case_id IS NULL OR e.case_id = p_case_id)
      AND (p_search_text IS NULL OR 
           e.description ILIKE '%' || p_search_text || '%' OR
           e.memo ILIKE '%' || p_search_text || '%')
    ORDER BY e.date DESC, e.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;
  
  RETURN QUERY SELECT v_total_count, COALESCE(v_data, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 5. セキュリティ考慮事項

1. **マルチテナント分離**: 全クエリでtenant_idフィルター必須
2. **論理削除**: deleted_atがNULLのレコードのみ表示
3. **監査ログ**: 全ての変更を記録
4. **権限チェック**: APIレベルで実施

## 6. パフォーマンス最適化

1. **インデックス戦略**
   - 頻繁に使用される検索条件にインデックス
   - 部分インデックスで削除済みデータを除外

2. **マテリアライズドビュー**
   - 集計データは事前計算
   - 定期的なリフレッシュ（1時間ごと）

3. **パーティショニング**
   - 監査ログは月次パーティション
   - 将来的に実費テーブルも検討