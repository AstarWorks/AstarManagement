# 柔軟データモデル設計

## 1. 設計思想

### 1.1 基本原則
- **スキーマレス**: ビジネスデータは固定スキーマを持たない
- **2つのデータモデル**: 柔軟テーブル（Notion風）と階層ドキュメント（Obsidian風）
- **完全な汎用性**: 業界特化要素はテンプレートで提供
- **マルチテナント**: ハイブリッド型アーキテクチャ対応

### 1.2 データ分類

```yaml
システムデータ（固定スキーマ）:
  - tenants: テナント管理
  - users: ユーザー管理
  - roles: ロール管理
  - audit_logs: 監査ログ

アプリケーションデータ（柔軟スキーマ）:
  - databases: テーブル定義
  - records: レコードデータ（JSONB）
  - documents: ドキュメント
  - folders: フォルダ階層
```

## 2. システムテーブル（固定スキーマ）

### 2.1 テナント管理

```sql
-- テナント
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'starter',
    -- starter: Shared DB + RLS
    -- professional: Dedicated Schema
    -- enterprise: Dedicated Container
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0
);

-- インデックス
CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE is_active = TRUE;
CREATE INDEX idx_tenants_plan_type ON tenants(plan_type);
```

### 2.2 ユーザー管理

```sql
-- ユーザー
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_email_per_tenant UNIQUE(tenant_id, email)
);

-- インデックス
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

### 2.3 ロール管理（Discord風）

```sql
-- ロール
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- #RRGGBB形式
    icon VARCHAR(50),
    permissions JSONB NOT NULL DEFAULT '[]',
    priority INTEGER DEFAULT 0, -- 表示順序
    is_mentionable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_role_name_per_tenant UNIQUE(tenant_id, name)
);

-- ユーザーロール（多対多）
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT unique_user_role UNIQUE(user_id, role_id)
);

-- インデックス
CREATE INDEX idx_roles_tenant ON roles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

### 2.4 ワークスペース

```sql
-- ワークスペース
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0
);

-- インデックス
CREATE INDEX idx_workspaces_tenant ON workspaces(tenant_id) WHERE deleted_at IS NULL;
```

## 3. 柔軟テーブルシステム（Notion風）

### 3.1 データベース定義

```sql
-- データベース（テーブル定義）
CREATE TABLE databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    properties JSONB NOT NULL DEFAULT '{}',
    -- {
    --   "title": {"type": "text", "config": {...}},
    --   "status": {"type": "select", "config": {...}},
    --   "owner": {"type": "user", "config": {...}}
    -- }
    default_view_id UUID,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0
);

-- インデックス
CREATE INDEX idx_databases_workspace ON databases(workspace_id) WHERE deleted_at IS NULL;
```

### 3.2 レコードデータ

```sql
-- レコード（実データ）
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES databases(id),
    data JSONB NOT NULL DEFAULT '{}',
    -- {
    --   "title": "プロジェクトA",
    --   "status": "in_progress",
    --   "owner": "user_id_123",
    --   "custom_field": "value"
    -- }
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0
);

-- インデックス
CREATE INDEX idx_records_database ON records(database_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_records_created_at ON records(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_records_data_gin ON records USING gin(data);
```

### 3.3 ビュー定義

```sql
-- ビュー
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES databases(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- table, kanban, calendar, gallery, gantt
    config JSONB NOT NULL DEFAULT '{}',
    -- {
    --   "filters": [...],
    --   "sorts": [...],
    --   "groups": [...],
    --   "visible_properties": [...]
    -- }
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0
);

-- インデックス
CREATE INDEX idx_views_database ON views(database_id) WHERE deleted_at IS NULL;
```

## 4. 階層ドキュメントシステム（Obsidian風）

### 4.1 フォルダ階層

```sql
-- フォルダ
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    parent_id UUID REFERENCES folders(id),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    path TEXT NOT NULL, -- /root/folder1/subfolder
    depth INTEGER NOT NULL DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_folder_path UNIQUE(workspace_id, path)
);

-- インデックス
CREATE INDEX idx_folders_workspace ON folders(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_folders_parent ON folders(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_folders_path ON folders(path) WHERE deleted_at IS NULL;
```

### 4.2 ドキュメント

```sql
-- ドキュメント
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    folder_id UUID REFERENCES folders(id),
    title VARCHAR(500) NOT NULL,
    path TEXT NOT NULL, -- /folder/document.md
    content TEXT,
    content_type VARCHAR(50) DEFAULT 'markdown',
    variables JSONB DEFAULT '{}', -- 変数システム
    tags TEXT[], -- タグ配列
    is_template BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_document_path UNIQUE(workspace_id, path)
);

-- インデックス
CREATE INDEX idx_documents_workspace ON documents(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_folder ON documents(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_tags ON documents USING gin(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_fulltext ON documents USING gin(to_tsvector('japanese', title || ' ' || content));
```

### 4.3 双方向リンク

```sql
-- ドキュメントリンク
CREATE TABLE document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id UUID NOT NULL REFERENCES documents(id),
    target_document_id UUID NOT NULL REFERENCES documents(id),
    link_type VARCHAR(50) DEFAULT 'reference', -- reference, embed, mention
    context TEXT, -- リンク周辺のテキスト
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_document_link UNIQUE(source_document_id, target_document_id, link_type)
);

-- インデックス
CREATE INDEX idx_document_links_source ON document_links(source_document_id);
CREATE INDEX idx_document_links_target ON document_links(target_document_id);
```

## 5. バージョン管理

```sql
-- ドキュメント履歴
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    version_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    variables JSONB,
    change_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT unique_document_version UNIQUE(document_id, version_number)
);

-- インデックス
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_created_at ON document_versions(created_at DESC);
```

## 6. 監査ログ

```sql
-- 監査ログ
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

## 7. Row Level Security (RLS)

### 7.1 Starterプラン（Shared DB + RLS）

```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ポリシー例：ユーザーは自分のテナントのデータのみアクセス可能
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_databases ON databases
    FOR ALL
    USING (
        workspace_id IN (
            SELECT id FROM workspaces 
            WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );
```

### 7.2 Professionalプラン（Dedicated Schema）

```sql
-- テナントごとに専用スキーマを作成
CREATE SCHEMA tenant_abc123;

-- スキーマ内に同じテーブル構造を作成
-- （システムテーブルは共有、アプリケーションテーブルは専用）
```

### 7.3 Enterpriseプラン（Dedicated Container）

```yaml
# 専用データベースインスタンス
# Kubernetes上で独立したPostgreSQLコンテナをデプロイ
```

## 8. パフォーマンス最適化

### 8.1 インデックス戦略

```sql
-- JSONBデータへの高速アクセス
CREATE INDEX idx_records_data_title ON records ((data->>'title')) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_records_data_status ON records ((data->>'status')) 
    WHERE deleted_at IS NULL;

-- 複合インデックス
CREATE INDEX idx_records_database_created ON records(database_id, created_at DESC) 
    WHERE deleted_at IS NULL;
```

### 8.2 パーティショニング（大規模データ対応）

```sql
-- 月単位でパーティション分割（Enterprise向け）
CREATE TABLE records_2024_01 PARTITION OF records
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## まとめ

このデータモデルは：
1. **完全に汎用的**: 業界特化の固定スキーマなし
2. **2つのデータモデル**: Notion風テーブル + Obsidian風ドキュメント
3. **ハイブリッドマルチテナンシー**: 3つのプランで異なる分離レベル
4. **Discord風ロール**: 動的で柔軟な権限管理

これにより、あらゆる業界・規模の組織に対応できる汎用ビジネス管理プラットフォームを実現します。