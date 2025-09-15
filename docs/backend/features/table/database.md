# テーブル機能 - データベース設計

## テーブル定義

### tables
テーブル定義を格納

```sql
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    properties JSONB NOT NULL DEFAULT '{}',
    property_order TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tables_workspace 
        FOREIGN KEY (workspace_id) 
        REFERENCES workspaces(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_tables_workspace_name 
        UNIQUE (workspace_id, name)
);

CREATE INDEX idx_tables_workspace_id ON tables(workspace_id);
CREATE INDEX idx_tables_created_at ON tables(created_at DESC);
```

### records
レコードデータを格納

```sql
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_records_table 
        FOREIGN KEY (table_id) 
        REFERENCES tables(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_records_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT fk_records_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_records_table_id ON records(table_id);
CREATE INDEX idx_records_created_at ON records(created_at DESC);
CREATE INDEX idx_records_data ON records USING GIN (data);
```

## JSONBスキーマ

### properties (tables.properties)
```json
{
  "title": {
    "type": "TEXT",
    "name": "タイトル",
    "required": true,
    "description": "タスクのタイトル"
  },
  "status": {
    "type": "SELECT",
    "name": "ステータス",
    "options": ["TODO", "進行中", "レビュー", "完了"],
    "defaultValue": "TODO"
  },
  "assignee": {
    "type": "USER",
    "name": "担当者",
    "required": false
  },
  "dueDate": {
    "type": "DATE",
    "name": "期限",
    "format": "YYYY-MM-DD"
  },
  "priority": {
    "type": "SELECT",
    "name": "優先度",
    "options": ["低", "中", "高"],
    "defaultValue": "中"
  },
  "tags": {
    "type": "MULTI_SELECT",
    "name": "タグ",
    "options": ["バグ", "機能", "改善", "ドキュメント"]
  }
}
```

### data (records.data)
```json
{
  "title": "新機能の実装",
  "status": "進行中",
  "assignee": "user-123",
  "dueDate": "2024-12-31",
  "priority": "高",
  "tags": ["機能", "改善"]
}
```

## インデックス戦略

### パフォーマンス最適化
```sql
-- プロパティ検索用
CREATE INDEX idx_tables_properties_keys 
ON tables USING GIN ((properties -> 'keys'));

-- レコードのプロパティ値検索用
CREATE INDEX idx_records_data_title 
ON records ((data->>'title'));

CREATE INDEX idx_records_data_status 
ON records ((data->>'status'));

CREATE INDEX idx_records_data_assignee 
ON records ((data->>'assignee'));

-- 複合インデックス
CREATE INDEX idx_records_table_status 
ON records(table_id, (data->>'status'));
```

## クエリ例

### テーブル作成
```sql
INSERT INTO tables (
    workspace_id,
    name,
    description,
    properties,
    property_order
) VALUES (
    'workspace-123',
    'タスク管理',
    'チームのタスク管理テーブル',
    '{"title": {"type": "TEXT", "name": "タイトル", "required": true}}'::jsonb,
    ARRAY['title', 'status', 'assignee']
);
```

### レコード検索
```sql
-- ステータスが「進行中」のレコードを検索
SELECT * FROM records
WHERE table_id = 'table-123'
  AND data->>'status' = '進行中'
ORDER BY created_at DESC;

-- 担当者でフィルタリング
SELECT * FROM records
WHERE table_id = 'table-123'
  AND data->>'assignee' = 'user-456'
ORDER BY data->>'priority' DESC;

-- 複数条件での検索
SELECT * FROM records
WHERE table_id = 'table-123'
  AND data @> '{"status": "進行中"}'::jsonb
  AND (data->>'dueDate')::date < CURRENT_DATE
ORDER BY (data->>'priority'), created_at;
```

### 集計クエリ
```sql
-- ステータス別のレコード数
SELECT 
    data->>'status' as status,
    COUNT(*) as count
FROM records
WHERE table_id = 'table-123'
GROUP BY data->>'status';

-- 担当者別のタスク数
SELECT 
    u.name as assignee_name,
    COUNT(r.id) as task_count,
    COUNT(CASE WHEN r.data->>'status' = '完了' THEN 1 END) as completed_count
FROM records r
LEFT JOIN users u ON u.id = (r.data->>'assignee')::uuid
WHERE r.table_id = 'table-123'
GROUP BY u.name;
```

## マイグレーション

### V001__create_table_tables.sql
```sql
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    properties JSONB NOT NULL DEFAULT '{}',
    property_order TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### V002__create_table_records.sql
```sql
CREATE TABLE IF NOT EXISTS records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## パーティショニング戦略（将来）

大規模データ対応のためのパーティショニング設計:

```sql
-- テーブルIDによるパーティショニング
CREATE TABLE records_partitioned (
    LIKE records INCLUDING ALL
) PARTITION BY HASH (table_id);

-- パーティション作成
CREATE TABLE records_part_0 PARTITION OF records_partitioned
    FOR VALUES WITH (modulus 4, remainder 0);
CREATE TABLE records_part_1 PARTITION OF records_partitioned
    FOR VALUES WITH (modulus 4, remainder 1);
-- ...
```