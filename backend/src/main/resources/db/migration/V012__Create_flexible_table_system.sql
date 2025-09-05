-- V012__Create_flexible_table_system.sql
-- ========================================
-- Flexible Table System - 完全なシステム構築
-- Notionライクな動的テーブルシステムの完全な基盤を構築
-- ハイブリッド設計：型カタログ + JSONB
-- recordsテーブルを含む動作可能なMVP
-- PostgreSQL 11+ 互換
-- ========================================

-- ========================================
-- 1. 自動更新関数の定義
-- ========================================

-- updated_at自動更新関数（既存の場合は再作成）
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. プロパティ型カタログ
-- ========================================

-- プロパティ型の定義カタログ
CREATE TABLE IF NOT EXISTS property_type_catalog (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    category VARCHAR(50),  -- 'basic', 'advanced', 'relation', 'system'
    validation_schema JSONB,  -- 型ごとのバリデーションルール
    default_config JSONB DEFAULT '{}',  -- デフォルト設定
    ui_component VARCHAR(100),  -- フロントエンドコンポーネント名
    icon VARCHAR(50),  -- アイコン識別子
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. ワークスペース
-- ========================================

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- 最初はNULL許可、後でNOT NULL化 & FK追加
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- UNIQUEはインデックスで実装（PostgreSQL 11+互換のため）
    CONSTRAINT check_workspace_name_not_empty CHECK (name != '')
);

-- ========================================
-- 4. テーブル定義
-- ========================================

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    -- プロパティ構造例:
    -- {
    --   "title": {
    --     "type_id": "text",
    --     "display_name": "タイトル",
    --     "config": {"required": true, "maxLength": 200}
    --   },
    --   "status": {
    --     "type_id": "select",
    --     "display_name": "ステータス",
    --     "config": {"options": [...]}
    --   }
    -- }
    property_order TEXT[] DEFAULT '{}',  -- プロパティの表示順序
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_table_name_per_workspace UNIQUE(workspace_id, name)
);

-- ========================================
-- 5. レコードテーブル（実データ格納）
-- ========================================

CREATE TABLE IF NOT EXISTS records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    -- データ構造例:
    -- {
    --   "title": "タスクA",
    --   "status": "in_progress",
    --   "assignee": "user_uuid",
    --   "due_date": "2024-03-15"
    -- }
    position FLOAT DEFAULT 65536,  -- 手動ソート用（後から追加すると順序が失われるため最初から実装）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 6. 初期データ投入（基本的な型定義）
-- ========================================

-- よく使う基本型を投入
INSERT INTO property_type_catalog (id, name, category, default_config, description)
VALUES 
    ('text', 'Text', 'basic', '{"maxLength": 500}', 'Single line text input'),
    ('long_text', 'Long Text', 'basic', '{"maxLength": 5000}', 'Multi-line text input'),
    ('number', 'Number', 'basic', '{"precision": 2}', 'Numeric value input'),
    ('checkbox', 'Checkbox', 'basic', '{"default": false}', 'Boolean checkbox'),
    ('date', 'Date', 'basic', '{}', 'Date picker'),
    ('select', 'Select', 'basic', '{"options": []}', 'Single selection from options')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. インデックス作成
-- ========================================

-- 型カタログのインデックス
CREATE INDEX IF NOT EXISTS idx_property_type_catalog_category 
    ON property_type_catalog(category) 
    WHERE is_active = TRUE;

-- ワークスペースのインデックス
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant 
    ON workspaces(tenant_id) 
    WHERE tenant_id IS NOT NULL;

-- ワークスペース名のユニーク制約（PostgreSQL 11+互換）
CREATE UNIQUE INDEX IF NOT EXISTS uk_workspace_name_per_tenant 
    ON workspaces(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID), name);

-- テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_tables_workspace 
    ON tables(workspace_id);

-- レコードのインデックス
CREATE INDEX IF NOT EXISTS idx_records_table 
    ON records(table_id);

CREATE INDEX IF NOT EXISTS idx_records_position 
    ON records(table_id, position);

-- ========================================
-- 8. トリガー設定
-- ========================================

-- ワークスペースのupdated_atトリガー
DROP TRIGGER IF EXISTS workspaces_updated_at ON workspaces;
CREATE TRIGGER workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- テーブルのupdated_atトリガー
DROP TRIGGER IF EXISTS tables_updated_at ON tables;
CREATE TRIGGER tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- レコードのupdated_atトリガー
DROP TRIGGER IF EXISTS records_updated_at ON records;
CREATE TRIGGER records_updated_at
    BEFORE UPDATE ON records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- 9. コメント追加
-- ========================================

COMMENT ON TABLE property_type_catalog IS 
'プロパティ型の定義カタログ。Notionライクな柔軟な型システムの基盤';

COMMENT ON TABLE workspaces IS 
'ワークスペース。テナント内の論理的な作業空間';

COMMENT ON TABLE tables IS 
'テーブル定義。Notionのデータベースに相当する動的テーブル定義';

COMMENT ON TABLE records IS 
'レコード。データベースの実データを格納。JSONBで柔軟なデータ構造を実現';

COMMENT ON COLUMN tables.properties IS 
'プロパティ定義。type_idで型カタログを参照し、configで個別設定を上書き';

COMMENT ON COLUMN tables.property_order IS 
'プロパティの表示順序。UIでの列の並び順を制御';

COMMENT ON COLUMN records.data IS 
'レコードの実データ。プロパティ定義に従ったJSONB形式';

COMMENT ON COLUMN records.position IS 
'手動ソート用の位置情報。FLOAT型で要素間への挿入が容易';

-- ========================================
-- 10. 実行完了メッセージ
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Flexible Table System Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Tables:';
    RAISE NOTICE '✓ property_type_catalog - Type definitions (6 types)';
    RAISE NOTICE '✓ workspaces - Logical workspaces';
    RAISE NOTICE '✓ tables - Dynamic table definitions';
    RAISE NOTICE '✓ records - Actual data storage with position';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '✓ PostgreSQL 11+ compatible';
    RAISE NOTICE '✓ Auto-update triggers for all tables';
    RAISE NOTICE '✓ Position field for manual sorting';
    RAISE NOTICE '✓ JSONB for flexible data structure';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for:';
    RAISE NOTICE '• Immediate data entry and retrieval';
    RAISE NOTICE '• Add tenant constraints when needed';
    RAISE NOTICE '• Enable RLS for multi-tenancy';
    RAISE NOTICE '========================================';
END $$;