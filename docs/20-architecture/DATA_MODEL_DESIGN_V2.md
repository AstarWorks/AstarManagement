# データモデル設計 v2.0

## 1. 概要

Aster Management システムのデータベース設計。PostgreSQL 15を使用し、マルチテナント対応、監査ログ、論理削除を実装します。

### 設計原則

1. **マルチテナント対応**: すべてのテーブルに`tenant_id`を持ち、Row Level Security (RLS) で分離
2. **監査対応**: 全テーブルに作成者・更新者・削除者と日時を記録
3. **論理削除**: 物理削除は行わず、`deleted_at`で管理
4. **UUID使用**: 主キーは全てUUID v4を使用
5. **楽観的ロック**: `version`カラムで同時更新を制御

### 標準カラム

すべてのテーブル（システムテーブルを除く）に以下のカラムを含む：

```sql
-- 監査カラム
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
created_by UUID NOT NULL,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_by UUID NOT NULL,
deleted_at TIMESTAMP,
deleted_by UUID,
version INTEGER NOT NULL DEFAULT 0,

-- マルチテナント
tenant_id UUID NOT NULL,

-- 外部キー制約
FOREIGN KEY (created_by) REFERENCES users(id),
FOREIGN KEY (updated_by) REFERENCES users(id),
FOREIGN KEY (deleted_by) REFERENCES users(id),
FOREIGN KEY (tenant_id) REFERENCES tenants(id)
```

## 2. システムテーブル

### 2.1 テナント（tenants）

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain) WHERE is_active = TRUE;
```

## 3. ユーザー管理

### 3.1 ユーザー（users）

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'lawyer',
    is_active BOOLEAN DEFAULT TRUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_email_per_tenant UNIQUE(email, tenant_id)
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
```

### 3.2 ユーザーセッション（user_sessions）

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

## 4. 案件管理

### 4.1 クライアント（clients）

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    client_type VARCHAR(50) NOT NULL, -- 'individual' or 'corporate'
    email VARCHAR(255),
    phone VARCHAR(50),
    postal_code VARCHAR(10),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_clients_name ON clients(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_tenant ON clients(tenant_id) WHERE deleted_at IS NULL;
```

### 4.2 案件タイプ（case_types）

```sql
CREATE TABLE case_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_code_per_tenant UNIQUE(code, tenant_id)
);

CREATE INDEX idx_case_types_code ON case_types(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_types_tenant ON case_types(tenant_id) WHERE deleted_at IS NULL;
```

### 4.3 案件（cases）

```sql
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number_year INTEGER NOT NULL,
    case_number_month INTEGER NOT NULL,
    case_number_sequence INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL,
    opponent_name VARCHAR(255),
    case_type_id UUID,
    amount DECIMAL(12, 2),
    court_name VARCHAR(255),
    judge_name VARCHAR(100),
    next_hearing_date DATE,
    final_deadline DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (case_type_id) REFERENCES case_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_case_number_per_tenant UNIQUE(case_number_year, case_number_month, case_number_sequence, tenant_id)
);

CREATE INDEX idx_cases_number ON cases(case_number_year, case_number_month, case_number_sequence) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_client ON cases(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_tenant ON cases(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_hearing ON cases(next_hearing_date) WHERE deleted_at IS NULL AND next_hearing_date IS NOT NULL;
```

### 4.4 案件担当者（case_assignees）

```sql
CREATE TABLE case_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID NOT NULL,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_case_user_per_tenant UNIQUE(case_id, user_id)
);

CREATE INDEX idx_assignees_case ON case_assignees(case_id);
CREATE INDEX idx_assignees_user ON case_assignees(user_id);
CREATE INDEX idx_assignees_tenant ON case_assignees(tenant_id);
```

## 5. タグシステム

### 5.1 タグカテゴリー（tag_categories）

```sql
CREATE TABLE tag_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_category_code_per_tenant UNIQUE(code, tenant_id)
);

CREATE INDEX idx_tag_categories_code ON tag_categories(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_tag_categories_tenant ON tag_categories(tenant_id) WHERE deleted_at IS NULL;
```

### 5.2 タグ（tags）

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color VARCHAR(7),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (category_id) REFERENCES tag_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_tag_code_per_category UNIQUE(category_id, code)
);

CREATE INDEX idx_tags_category ON tags(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_code ON tags(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_usage ON tags(usage_count DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_tenant ON tags(tenant_id) WHERE deleted_at IS NULL;
```

### 5.3 案件タグ（case_tags）

```sql
CREATE TABLE case_tags (
    case_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attached_by UUID NOT NULL,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (case_id, tag_id),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    FOREIGN KEY (attached_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_case_tags_case ON case_tags(case_id);
CREATE INDEX idx_case_tags_tag ON case_tags(tag_id);
CREATE INDEX idx_case_tags_tenant ON case_tags(tenant_id);
```

## 6. タスク管理

### 6.1 タスク（tasks）

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    assignee_id UUID,
    parent_task_id UUID,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    completed_at TIMESTAMP,
    completed_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id),
    FOREIGN KEY (completed_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_tasks_case ON tasks(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE deleted_at IS NULL AND status != 'completed';
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id) WHERE deleted_at IS NULL;
```

## 7. 書類管理

### 7.1 書類（documents）

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_date DATE,
    document_type VARCHAR(50),
    description TEXT,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_documents_case ON documents(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_date ON documents(document_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_tenant ON documents(tenant_id) WHERE deleted_at IS NULL;
```

### 7.2 書類タグ（document_tags）

```sql
CREATE TABLE document_tags (
    document_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attached_by UUID NOT NULL,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (document_id, tag_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    FOREIGN KEY (attached_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_document_tags_document ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag ON document_tags(tag_id);
CREATE INDEX idx_document_tags_tenant ON document_tags(tenant_id);
```

### 7.3 法的書類（legal_documents）

```sql
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(50),
    template_id UUID,
    variables JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (template_id) REFERENCES document_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_legal_documents_case ON legal_documents(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_legal_documents_template ON legal_documents(template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_legal_documents_tenant ON legal_documents(tenant_id) WHERE deleted_at IS NULL;
```

### 7.4 書類バージョン（document_versions）

```sql
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    change_summary VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_version_per_document UNIQUE(document_id, version)
);

CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_tenant ON document_versions(tenant_id);
```

## 8. テンプレート管理

### 8.1 書類テンプレート（document_templates）

```sql
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    document_type VARCHAR(50),
    content TEXT NOT NULL,
    variables JSONB,
    is_system BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_templates_category ON document_templates(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_usage ON document_templates(usage_count DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_tenant ON document_templates(tenant_id) WHERE deleted_at IS NULL;
```

## 9. コミュニケーション

### 9.1 コミュニケーション履歴（communications）

```sql
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    communication_type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    participants UUID[] NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    channel VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_communications_case ON communications(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_communications_occurred ON communications(occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_communications_participants ON communications USING GIN(participants);
CREATE INDEX idx_communications_tenant ON communications(tenant_id) WHERE deleted_at IS NULL;
```

## 10. 報酬・請求管理

### 10.1 報酬設定（fee_settings）

```sql
CREATE TABLE fee_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL UNIQUE,
    retainer_fee DECIMAL(12, 2),
    retainer_withholding BOOLEAN DEFAULT FALSE,
    retainer_paid_date DATE,
    success_fee_type VARCHAR(20),
    success_fee_amount DECIMAL(12, 2),
    success_fee_rate DECIMAL(5, 2),
    success_fee_minimum DECIMAL(12, 2),
    success_withholding BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(12, 2),
    hourly_unit INTEGER,
    expense_markup DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_fee_settings_case ON fee_settings(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_fee_settings_tenant ON fee_settings(tenant_id) WHERE deleted_at IS NULL;
```

### 10.2 請求書（invoices）

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(20) NOT NULL,
    case_id UUID NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    withholding_amount DECIMAL(12, 2),
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_invoice_number_per_tenant UNIQUE(invoice_number, tenant_id)
);

CREATE INDEX idx_invoices_case ON invoices(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due ON invoices(due_date) WHERE deleted_at IS NULL AND status != 'paid';
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id) WHERE deleted_at IS NULL;
```

### 10.3 請求書項目（invoice_items）

```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    has_withholding BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_tenant ON invoice_items(tenant_id);
```

### 10.4 入金（payments）

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    memo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_date ON payments(payment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_tenant ON payments(tenant_id) WHERE deleted_at IS NULL;
```

## 11. 経費管理

### 11.1 経費（expenses）

```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_type VARCHAR(20) NOT NULL,
    case_id UUID,
    lawyer_id UUID,
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    receipt_url VARCHAR(500),
    payment_method VARCHAR(20),
    has_withholding BOOLEAN DEFAULT FALSE,
    withholding_amount DECIMAL(12, 2),
    tax_rate DECIMAL(5, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (lawyer_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_expenses_case ON expenses(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_lawyer ON expenses(lawyer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_date ON expenses(date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_type ON expenses(expense_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_tenant ON expenses(tenant_id) WHERE deleted_at IS NULL;
```

### 11.2 勘定科目（account_codes）

```sql
CREATE TABLE account_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_account_code_per_tenant UNIQUE(code, tenant_id)
);

CREATE INDEX idx_account_codes_category ON account_codes(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_account_codes_tenant ON account_codes(tenant_id) WHERE deleted_at IS NULL;
```

### 11.3 経費テンプレート（expense_templates）

```sql
CREATE TABLE expense_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    amount DECIMAL(12, 2) NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_expense_templates_usage ON expense_templates(usage_count DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_expense_templates_tenant ON expense_templates(tenant_id) WHERE deleted_at IS NULL;
```

## 12. 会計管理

### 12.1 預り金（deposits）

```sql
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL,
    description VARCHAR(200) NOT NULL,
    related_expense_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (related_expense_id) REFERENCES expenses(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_deposits_case ON deposits(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deposits_date ON deposits(transaction_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_deposits_tenant ON deposits(tenant_id) WHERE deleted_at IS NULL;
```

### 12.2 売掛金（receivables）

```sql
CREATE TABLE receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    case_id UUID NOT NULL,
    client_id UUID NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    last_reminder_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_receivables_invoice ON receivables(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_receivables_case ON receivables(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_receivables_client ON receivables(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_receivables_status ON receivables(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_receivables_due ON receivables(due_date) WHERE deleted_at IS NULL AND status != 'paid';
CREATE INDEX idx_receivables_tenant ON receivables(tenant_id) WHERE deleted_at IS NULL;
```

## 13. AI機能

### 13.1 AIチャット履歴（ai_chat_history）

```sql
CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    selected_text TEXT,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_ai_chat_document ON ai_chat_history(document_id);
CREATE INDEX idx_ai_chat_tenant ON ai_chat_history(tenant_id);
```

## 14. 権限管理

### 14.1 権限（permissions）

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_permission UNIQUE(resource, action)
);

-- システム全体の権限定義（テナント非依存）
```

### 14.2 ロール（roles）

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_role_name_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_roles_name ON roles(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_tenant ON roles(tenant_id) WHERE deleted_at IS NULL;
```

### 14.3 ロール権限（role_permissions）

```sql
CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID NOT NULL,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id),
    FOREIGN KEY (granted_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_role_permissions_tenant ON role_permissions(tenant_id);
```

### 14.4 ユーザーロール（user_roles）

```sql
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID NOT NULL,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
```

## 15. 監査ログ

### 15.1 監査ログ（audit_logs）

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- パーティショニング（月単位）
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 16. システム設定

### 16.1 システム設定（system_settings）

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT unique_key_per_tenant UNIQUE(key, tenant_id)
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_tenant ON system_settings(tenant_id);
```

## 17. Row Level Security (RLS) ポリシー

```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- 他のすべてのテーブルに対しても同様に設定

-- テナント分離ポリシー（例：cases テーブル）
CREATE POLICY tenant_isolation_policy ON cases
    FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- ユーザーアクセスポリシー（例：自分が担当する案件のみ）
CREATE POLICY user_access_policy ON cases
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM case_assignees ca
            WHERE ca.case_id = cases.id
            AND ca.user_id = current_setting('app.current_user')::uuid
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user')::uuid
            AND r.name = 'admin'
        )
    );
```

## 18. インデックス戦略

### 複合インデックス
```sql
-- よく使われるJOIN用
CREATE INDEX idx_cases_client_tenant ON cases(client_id, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_case_tenant ON documents(case_id, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_case_assignee ON tasks(case_id, assignee_id) WHERE deleted_at IS NULL;

-- 検索最適化
CREATE INDEX idx_cases_search ON cases USING GIN(
    to_tsvector('japanese', title || ' ' || COALESCE(description, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX idx_documents_search ON documents USING GIN(
    to_tsvector('japanese', title || ' ' || COALESCE(description, ''))
) WHERE deleted_at IS NULL;
```

## 19. トリガー

### 更新日時自動更新
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- すべてのテーブルに適用
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### タグ使用回数更新
```sql
CREATE OR REPLACE FUNCTION update_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags 
        SET usage_count = usage_count + 1,
            last_used_at = CURRENT_TIMESTAMP
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags 
        SET usage_count = usage_count - 1
        WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_case_tag_usage
    AFTER INSERT OR DELETE ON case_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage();
```

## 20. ビュー

### 案件サマリービュー
```sql
CREATE VIEW v_case_summary AS
SELECT 
    c.id,
    c.case_number_year || '-' || 
        LPAD(c.case_number_month::text, 2, '0') || '-' || 
        LPAD(c.case_number_sequence::text, 3, '0') as case_number,
    c.title,
    c.client_id,
    cl.name as client_name,
    c.amount,
    c.next_hearing_date,
    c.final_deadline,
    COALESCE(
        (SELECT t.code 
         FROM case_tags ct 
         JOIN tags t ON ct.tag_id = t.id 
         JOIN tag_categories tc ON t.category_id = tc.id
         WHERE ct.case_id = c.id AND tc.code = 'status'
         LIMIT 1),
        'draft'
    ) as status,
    c.created_at,
    c.tenant_id
FROM cases c
JOIN clients cl ON c.client_id = cl.id
WHERE c.deleted_at IS NULL;
```

## マイグレーション戦略

1. **初期セットアップ**: システムテーブルとマスターデータ
2. **コアテーブル**: ユーザー、クライアント、案件
3. **関連テーブル**: タグ、タスク、書類
4. **財務テーブル**: 請求、経費、会計
5. **インデックスとRLS**: パフォーマンスとセキュリティ
6. **ビューとトリガー**: 利便性機能

各マイグレーションは独立して実行可能で、ロールバック可能な設計とします。