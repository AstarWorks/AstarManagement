# 実費入力画面 データモデル設計書

## 1. データベース設計概要

### 1.1 使用技術
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **マルチテナント**: Row Level Security (RLS)

### 1.2 設計方針
- テナント分離を前提とした設計
- 論理削除の採用（データ保護）
- 監査ログの記録
- 適切なインデックス設定

## 2. テーブル設計

### 2.1 expenses（実費テーブル）

```sql
CREATE TABLE expenses (
  -- 基本情報
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 実費データ
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  income_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- 関連情報
  case_id UUID REFERENCES cases(id),
  memo TEXT,
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  
  -- インデックス
  CONSTRAINT expense_amount_check CHECK (expense_amount >= 0),
  CONSTRAINT income_amount_check CHECK (income_amount >= 0)
);

-- インデックス
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, date DESC);
CREATE INDEX idx_expenses_tenant_case ON expenses(tenant_id, case_id);
CREATE INDEX idx_expenses_tenant_category ON expenses(tenant_id, category);
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at);
```

### 2.2 expense_attachments（裏付け資料テーブル）

```sql
CREATE TABLE expense_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  
  -- ファイル情報
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- メタデータ
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- インデックス
CREATE INDEX idx_expense_attachments_expense_id ON expense_attachments(expense_id);
```

### 2.3 expense_categories（科目マスタ）

```sql
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- カテゴリ情報
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- 使用頻度追跡
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- ユニーク制約
  UNIQUE(tenant_id, code)
);

-- デフォルトカテゴリ
INSERT INTO expense_categories (tenant_id, code, name, display_order) VALUES
  (tenant_id, 'transportation', '交通費', 1),
  (tenant_id, 'stamp_fee', '印紙代', 2),
  (tenant_id, 'copy_fee', 'コピー代', 3),
  (tenant_id, 'postage', '郵送費', 4),
  (tenant_id, 'other', 'その他', 99);
```

### 2.4 expense_import_settings（インポート設定）

```sql
CREATE TABLE expense_import_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 設定情報
  bank_name VARCHAR(100) NOT NULL,
  column_mapping JSONB NOT NULL,
  date_format VARCHAR(50) NOT NULL DEFAULT 'YYYY-MM-DD',
  encoding VARCHAR(50) NOT NULL DEFAULT 'UTF-8',
  
  -- 使用状況
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ユニーク制約
  UNIQUE(tenant_id, bank_name)
);

-- カラムマッピングの例
-- {
--   "date": "日付",
--   "description": "摘要",
--   "expense_amount": "出金額",
--   "income_amount": "入金額"
-- }
```

### 2.5 expense_audit_logs（監査ログ）

```sql
CREATE TABLE expense_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 対象情報
  expense_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  
  -- 変更内容
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- 実行情報
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID NOT NULL REFERENCES users(id),
  ip_address INET,
  user_agent TEXT
);

-- インデックス
CREATE INDEX idx_audit_logs_expense_id ON expense_audit_logs(expense_id);
CREATE INDEX idx_audit_logs_performed_at ON expense_audit_logs(performed_at DESC);
```

## 3. Row Level Security (RLS) 設定

### 3.1 expenses テーブルのRLS

```sql
-- RLSを有効化
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー: 自テナントのデータのみ参照可能
CREATE POLICY "expenses_select_policy" ON expenses
  FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id' AND deleted_at IS NULL);

-- INSERTポリシー: 自テナントにのみ追加可能
CREATE POLICY "expenses_insert_policy" ON expenses
  FOR INSERT
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

-- UPDATEポリシー: 自テナントのデータのみ更新可能
CREATE POLICY "expenses_update_policy" ON expenses
  FOR UPDATE
  USING (tenant_id = auth.jwt() ->> 'tenant_id' AND deleted_at IS NULL);

-- DELETEポリシー: 物理削除は禁止（論理削除のみ）
-- DELETEは管理者権限でのみ実行可能
```

## 4. ビューとマテリアライズドビュー

### 4.1 実費一覧ビュー

```sql
CREATE VIEW v_expenses_with_details AS
SELECT 
  e.*,
  c.name as case_name,
  u1.name as created_by_name,
  u2.name as updated_by_name,
  COALESCE(
    ARRAY_AGG(
      JSON_BUILD_OBJECT(
        'id', a.id,
        'file_name', a.file_name,
        'file_size', a.file_size,
        'mime_type', a.mime_type
      ) ORDER BY a.uploaded_at
    ) FILTER (WHERE a.id IS NOT NULL),
    '{}'::json[]
  ) as attachments
FROM expenses e
LEFT JOIN cases c ON e.case_id = c.id
LEFT JOIN users u1 ON e.created_by = u1.id
LEFT JOIN users u2 ON e.updated_by = u2.id
LEFT JOIN expense_attachments a ON e.id = a.expense_id
WHERE e.deleted_at IS NULL
GROUP BY e.id, c.name, u1.name, u2.name;
```

### 4.2 月次集計ビュー

```sql
CREATE MATERIALIZED VIEW mv_expense_monthly_summary AS
SELECT 
  tenant_id,
  DATE_TRUNC('month', date) as month,
  category,
  case_id,
  COUNT(*) as count,
  SUM(income_amount) as total_income,
  SUM(expense_amount) as total_expense,
  SUM(income_amount - expense_amount) as net_amount
FROM expenses
WHERE deleted_at IS NULL
GROUP BY tenant_id, DATE_TRUNC('month', date), category, case_id;

-- リフレッシュ用インデックス
CREATE INDEX idx_mv_expense_monthly_tenant_month 
  ON mv_expense_monthly_summary(tenant_id, month DESC);
```

## 5. トリガーとストアドプロシージャ

### 5.1 更新日時自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_update_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 5.2 差引残高計算トリガー

```sql
CREATE OR REPLACE FUNCTION calculate_balance()
RETURNS TRIGGER AS $$
DECLARE
  prev_balance DECIMAL(12, 2);
BEGIN
  -- 前のレコードの残高を取得
  SELECT balance INTO prev_balance
  FROM expenses
  WHERE tenant_id = NEW.tenant_id
    AND date <= NEW.date
    AND id != NEW.id
    AND deleted_at IS NULL
  ORDER BY date DESC, created_at DESC
  LIMIT 1;
  
  -- 残高を計算
  NEW.balance = COALESCE(prev_balance, 0) + NEW.income_amount - NEW.expense_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_calculate_balance
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_balance();
```

### 5.3 監査ログ記録トリガー

```sql
CREATE OR REPLACE FUNCTION record_expense_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO expense_audit_logs (
    tenant_id,
    expense_id,
    action,
    old_values,
    new_values,
    changed_fields,
    performed_by
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW),
    CASE WHEN TG_OP = 'UPDATE' 
      THEN ARRAY(
        SELECT jsonb_object_keys(row_to_json(NEW)::jsonb - row_to_json(OLD)::jsonb)
      )
      ELSE NULL 
    END,
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_audit_trigger
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION record_expense_audit();
```

## 6. パフォーマンス最適化

### 6.1 パーティショニング（将来対応）

```sql
-- 年月でパーティショニング（データ量が多くなった場合）
CREATE TABLE expenses_2024_01 PARTITION OF expenses
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 6.2 統計情報の更新

```sql
-- 定期的な統計情報更新
ANALYZE expenses;
ANALYZE expense_attachments;
```

## 7. Prismaスキーマ

```prisma
model Expense {
  id            String   @id @default(uuid())
  tenantId      String   @map("tenant_id")
  
  date          DateTime @db.Date
  category      String
  description   String
  incomeAmount  Decimal  @map("income_amount") @db.Decimal(12, 2)
  expenseAmount Decimal  @map("expense_amount") @db.Decimal(12, 2)
  balance       Decimal  @db.Decimal(12, 2)
  
  caseId        String?  @map("case_id")
  memo          String?
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  createdBy     String   @map("created_by")
  updatedBy     String   @map("updated_by")
  deletedAt     DateTime? @map("deleted_at")
  
  // Relations
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  case          Case?    @relation(fields: [caseId], references: [id])
  creator       User     @relation("expense_creator", fields: [createdBy], references: [id])
  updater       User     @relation("expense_updater", fields: [updatedBy], references: [id])
  attachments   ExpenseAttachment[]
  auditLogs     ExpenseAuditLog[]
  
  @@index([tenantId, date(sort: Desc)])
  @@index([tenantId, caseId])
  @@index([tenantId, category])
  @@index([deletedAt])
  @@map("expenses")
}

model ExpenseAttachment {
  id          String   @id @default(uuid())
  expenseId   String   @map("expense_id")
  
  fileName    String   @map("file_name")
  fileSize    Int      @map("file_size")
  mimeType    String   @map("mime_type")
  storagePath String   @map("storage_path")
  
  uploadedAt  DateTime @default(now()) @map("uploaded_at")
  uploadedBy  String   @map("uploaded_by")
  
  // Relations
  expense     Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  uploader    User     @relation(fields: [uploadedBy], references: [id])
  
  @@index([expenseId])
  @@map("expense_attachments")
}
```

## 8. データ移行とバックアップ戦略

### 8.1 初期データ投入

```sql
-- テナント作成時の初期カテゴリ投入
CREATE OR REPLACE FUNCTION setup_tenant_expense_categories(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO expense_categories (tenant_id, code, name, display_order)
  VALUES
    (p_tenant_id, 'transportation', '交通費', 1),
    (p_tenant_id, 'stamp_fee', '印紙代', 2),
    (p_tenant_id, 'copy_fee', 'コピー代', 3),
    (p_tenant_id, 'postage', '郵送費', 4),
    (p_tenant_id, 'other', 'その他', 99);
END;
$$ LANGUAGE plpgsql;
```

### 8.2 バックアップ方針

- 日次バックアップ（Supabase自動バックアップ）
- 論理削除による誤削除防止
- 監査ログによる変更履歴の保持