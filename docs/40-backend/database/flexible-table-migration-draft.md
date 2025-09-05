# Flexible Table System - Migration Draft

## 概要
Notionライクな柔軟なテーブルシステムを段階的に構築するためのマイグレーション設計ドキュメント。
各フェーズごとに必要最小限の機能から始めて、徐々に拡張していく。

## 実装状態
- [ ] Phase 1: 基盤構築（V012）
- [ ] Phase 2: レコード機能（V013）
- [ ] Phase 3: ビュー機能（V014）
- [ ] Phase 4: 最適化とインデックス（V015）
- [ ] Phase 5: ドキュメント機能（V016以降）

---

## V012 - 最小基盤構築（作業中）

### 目的
- ワークスペースとデータベース（テーブル定義）の最小構成を作成
- プロパティ型カタログによる型管理基盤の構築
- 必須フィールドのみで開始し、後から拡張可能な設計

### テーブル: property_type_catalog

#### 型カタログ（Phase 1）
```sql
-- プロパティ型の定義カタログ
CREATE TABLE property_type_catalog (
    id VARCHAR(50) PRIMARY KEY,  -- 'text', 'number', 'select' など
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    category VARCHAR(50),  -- 'basic', 'advanced', 'relation', 'system'
    validation_schema JSONB,  -- 型ごとのバリデーションルール
    default_config JSONB,  -- デフォルト設定
    ui_component VARCHAR(100),  -- フロントエンドコンポーネント名
    icon VARCHAR(50),  -- アイコン識別子
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 初期データ投入
INSERT INTO property_type_catalog (id, name, category, default_config) VALUES
-- 基本型
('text', 'Text', 'basic', '{"maxLength": 500}'),
('long_text', 'Long Text', 'basic', '{"maxLength": 5000}'),
('number', 'Number', 'basic', '{"precision": 2}'),
('checkbox', 'Checkbox', 'basic', '{}'),
('date', 'Date', 'basic', '{}'),
('datetime', 'Date & Time', 'basic', '{}'),

-- 選択型
('select', 'Select', 'basic', '{"options": []}'),
('multi_select', 'Multi-select', 'basic', '{"options": []}'),
('status', 'Status', 'basic', '{"options": []}'),

-- 高度な型
('url', 'URL', 'advanced', '{}'),
('email', 'Email', 'advanced', '{}'),
('phone', 'Phone', 'advanced', '{}'),
('currency', 'Currency', 'advanced', '{"currency": "JPY"}'),
('percent', 'Percent', 'advanced', '{}'),

-- リレーション型
('user', 'User', 'relation', '{"multiple": false}'),
('relation', 'Relation', 'relation', '{}'),

-- システム型
('created_time', 'Created time', 'system', '{}'),
('created_by', 'Created by', 'system', '{}'),
('updated_time', 'Last edited time', 'system', '{}'),
('updated_by', 'Last edited by', 'system', '{}');

-- インデックス
CREATE INDEX idx_property_type_catalog_category ON property_type_catalog(category) WHERE is_active = TRUE;
```

### テーブル: workspaces

#### 基本フィールド（Phase 1）
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- 最初はNULL許可、後でNOT NULL化 & FK追加
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_workspace_name_per_tenant UNIQUE(tenant_id, name)
);
```

**設計判断**:
- `tenant_id`は最初NULL許可（後から制約追加の方が簡単）
- `updated_at`は最初から実装（後から追加すると過去データがNULL）

#### 拡張フィールド（Phase 2以降で追加予定）
```sql
-- TODO: 以下のフィールドを後で追加
-- description TEXT,
-- icon VARCHAR(50),  -- emoji or icon identifier
-- settings JSONB DEFAULT '{}',
-- created_by UUID NOT NULL REFERENCES users(id),
-- updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
-- updated_by UUID NOT NULL REFERENCES users(id),
-- deleted_at TIMESTAMP WITH TIME ZONE,
-- deleted_by UUID REFERENCES users(id),
-- version INTEGER NOT NULL DEFAULT 0
```

### テーブル: databases

#### 基本フィールド（Phase 1）
```sql
CREATE TABLE databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    property_order TEXT[] DEFAULT '{}',  -- プロパティの表示順序
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_database_name_per_workspace UNIQUE(workspace_id, name)
);
```

**設計判断**:
- `property_order`は最初から実装（UIでの表示順序管理に必須）
- `updated_at`は最初から実装（監査ログ用）

#### プロパティ構造の例（ハイブリッド方式）
```json
{
  "title": {
    "type_id": "text",  // property_type_catalogのIDを参照
    "display_name": "タイトル",
    "config": {
      "required": true,
      "maxLength": 200  // 型固有の設定でデフォルトを上書き
    }
  },
  "status": {
    "type_id": "select",
    "display_name": "ステータス",
    "config": {
      "options": [
        {"value": "todo", "label": "To Do", "color": "#gray"},
        {"value": "in_progress", "label": "作業中", "color": "#blue"},
        {"value": "done", "label": "完了", "color": "#green"}
      ]
    }
  },
  "assignee": {
    "type_id": "user",
    "display_name": "担当者",
    "config": {
      "multiple": false,
      "required": false
    }
  }
}
```

**ポイント**:
- `type_id`でカタログの型を参照（バリデーションルールを継承）
- `config`で型固有の設定を上書き・追加
- JOINは不要（プロパティ情報はJSONBに完結）
- カタログは参照とバリデーションのみに使用

#### 拡張フィールド（Phase 2以降で追加予定）
```sql
-- TODO: 以下のフィールドを後で追加
-- description TEXT,
-- icon VARCHAR(50),
-- color VARCHAR(7),
-- default_view_id UUID,
-- default_view_type VARCHAR(50) DEFAULT 'table',
-- settings JSONB DEFAULT '{}',
-- is_template BOOLEAN DEFAULT FALSE,
-- template_category VARCHAR(100),
-- 監査フィールド群
```

### RLS設定（Phase 1）
```sql
-- 基本的なRLS有効化
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE databases ENABLE ROW LEVEL SECURITY;

-- ワークスペースのテナント分離
CREATE POLICY workspaces_tenant_isolation ON workspaces
    FOR ALL USING (tenant_id = current_tenant_id());

-- データベースのテナント分離（ワークスペース経由）
CREATE POLICY databases_tenant_isolation ON databases
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces 
            WHERE tenant_id = current_tenant_id()
        )
    );
```

### 自動更新トリガー（Phase 1）
```sql
-- updated_atの自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER databases_updated_at
    BEFORE UPDATE ON databases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### インデックス（Phase 1）
```sql
-- 最小限のインデックスのみ
CREATE INDEX idx_workspaces_tenant ON workspaces(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_databases_workspace ON databases(workspace_id);
```

### ハイブリッド設計のメリット
1. **型の一貫性**: カタログで全システム共通の型定義
2. **JSONBの柔軟性**: 実データは引き続きJSONBで管理
3. **パフォーマンス**: JOINが不要でクエリが単純
4. **段階的移行**: 最初はカタログ参照のみ、徐々に活用拡大
5. **移行コストゼロ**: 最初から正しい設計で実装

---

## V013 - レコード機能追加（計画中）

### 目的
- 実際のデータを格納するrecordsテーブルを追加
- JSONBで柔軟なデータ構造を実現
- 並び替えと監査機能を最初から実装

### テーブル: records

#### 基本フィールド（Phase 2）
```sql
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    position FLOAT DEFAULT 65536,  -- 手動ソート用（最初から実装）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- updated_atトリガー
CREATE TRIGGER records_updated_at
    BEFORE UPDATE ON records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**設計判断**:
- `position`をFLOAT型で最初から実装（要素間への挿入が容易）
- 初期値65536で十分な挿入余地を確保
- `updated_at`と自動更新トリガーを最初から実装

#### データ構造の例
```json
{
  "title": "タスクA",
  "status": "in_progress",
  "assignee": "user_uuid",
  "priority": "high",
  "due_date": "2024-03-15",
  "tags": ["urgent", "customer"]
}
```

#### 拡張フィールド（Phase 3以降で追加予定）
```sql
-- TODO: 以下のフィールドを後で追加
-- created_by UUID NOT NULL REFERENCES users(id),
-- updated_by UUID NOT NULL REFERENCES users(id),
-- deleted_at TIMESTAMP WITH TIME ZONE,
-- deleted_by UUID REFERENCES users(id),
-- version INTEGER NOT NULL DEFAULT 0
```

### インデックス（Phase 2）
```sql
-- 基本インデックス
CREATE INDEX idx_records_database ON records(database_id);
CREATE INDEX idx_records_position ON records(database_id, position);

-- JSONB検索用（後で追加）
-- CREATE INDEX idx_records_data_gin ON records USING gin(data);
```

---

## V014 - ビュー機能（計画中）

### テーブル: views
```sql
-- TODO: ビュー定義テーブル
-- テーブルビュー、カンバンビュー、カレンダービューなど
```

---

## V015 - 最適化とインデックス（計画中）

### パフォーマンス最適化
```sql
-- TODO: 追加インデックス
-- GINインデックス
-- 特定フィールドの部分インデックス
-- 複合インデックス
```

---

## 移行困難度による設計判断

### 🔴 絶対に最初から実装（後から変更が極めて困難）
- ✅ UUID主キー（SERIAL→UUIDは地獄）
- ✅ 基本的なテーブル構造とリレーション
- ✅ JSONBのデータ構造規約（type_id方式）
- ✅ positionフィールド（後から追加すると順序が失われる）
- ✅ updated_at（後から追加すると過去データがNULL）

### 🟡 早めに実装（後から可能だが面倒）
- ✅ property_type_catalog（簡易版でも作る）
- ✅ 自動更新トリガー
- ⏳ viewsテーブル（Phase 2で実装）

### 🟢 後から追加可能（MVPでは省略OK）
- RLSとポリシー
- 追加のインデックス（GIN等）
- ソフトデリート（deleted_at）
- バージョニング（version）
- 作成者/更新者の記録

## 設計上の検討事項

### 1. プロパティタイプ
- [ ] text - テキスト
- [ ] number - 数値
- [ ] select - 単一選択
- [ ] multi_select - 複数選択
- [ ] date - 日付
- [ ] checkbox - チェックボックス
- [ ] user - ユーザー参照
- [ ] url - URL
- [ ] email - メールアドレス
- [ ] phone - 電話番号
- [ ] formula - 計算式
- [ ] relation - リレーション
- [ ] rollup - 集計

### 2. ビュータイプ
- [ ] table - テーブルビュー
- [ ] kanban - カンバンビュー
- [ ] calendar - カレンダービュー
- [ ] gallery - ギャラリービュー
- [ ] list - リストビュー
- [ ] gantt - ガントチャート

### 3. 権限管理
- [ ] ワークスペースレベルの権限
- [ ] データベースレベルの権限
- [ ] レコードレベルの権限
- [ ] ビューレベルの権限

### 4. パフォーマンス考慮事項
- JSONBのインデックス戦略
- 頻繁にアクセスされるフィールドの部分インデックス
- パーティショニングの必要性検討
- キャッシュ戦略

### 5. 将来の拡張性
- ドキュメント機能との統合
- 双方向リンク
- バージョン管理
- リアルタイム同期

---

## メモ・アイデア

### 実装順序の理由
1. **workspaces**: すべての基盤となる論理的な区分け
2. **databases**: テーブル定義の格納
3. **records**: 実データの格納
4. **views**: データの見せ方
5. **最適化**: パフォーマンスチューニング

### 技術的な決定事項
- JSONBを使用する理由: スキーマレスで柔軟な構造
- UUIDを使用する理由: 分散環境での一意性保証
- ソフトデリート採用: データの完全削除を避ける

### 参考資料
- Notion API: https://developers.notion.com/
- PostgreSQL JSONB: https://www.postgresql.org/docs/current/datatype-json.html
- Row Level Security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html