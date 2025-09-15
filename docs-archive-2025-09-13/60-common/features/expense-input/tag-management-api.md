# タグ管理API設計書

## 1. 設計方針

### 1.1 タグの種類
- **テナントタグ**: 事務所全体で共有するタグ
- **個人タグ**: 個人専用のプライベートタグ

### 1.2 タグの特徴
- フラット構造（階層なし）
- 色分け対応
- 絵文字対応（タグ名に含める）
- 柔軟な権限管理

## 2. データベース設計

### 2.1 タグテーブル（改訂版）
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- タグ情報
  name VARCHAR(50) NOT NULL,           -- 絵文字含む（例: "🚄 出張"）
  name_normalized VARCHAR(50) NOT NULL, -- 検索用正規化名
  color VARCHAR(7) NOT NULL,           -- #RRGGBB形式
  
  -- スコープ
  scope VARCHAR(20) NOT NULL DEFAULT 'tenant', -- 'tenant' or 'personal'
  owner_id UUID REFERENCES users(id),          -- personal時のみ必須
  
  -- 使用統計
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  -- 論理削除
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  
  -- 制約
  CONSTRAINT unique_tenant_tag UNIQUE(tenant_id, scope, name_normalized, owner_id),
  CONSTRAINT personal_tag_owner CHECK (
    (scope = 'personal' AND owner_id IS NOT NULL) OR
    (scope = 'tenant' AND owner_id IS NULL)
  )
);

-- インデックス
CREATE INDEX idx_tags_tenant_scope ON tags(tenant_id, scope) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_owner ON tags(owner_id) WHERE scope = 'personal' AND deleted_at IS NULL;
CREATE INDEX idx_tags_usage ON tags(tenant_id, usage_count DESC) WHERE deleted_at IS NULL;

-- 正規化関数
CREATE OR REPLACE FUNCTION normalize_tag_name(name TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- 小文字化、前後の空白削除、連続空白を1つに
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- トリガー：正規化名の自動設定
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized = normalize_tag_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_tag_name
  BEFORE INSERT OR UPDATE OF name ON tags
  FOR EACH ROW
  EXECUTE FUNCTION set_normalized_name();
```

### 2.2 権限設定
```sql
-- タグ関連のパーミッション
INSERT INTO permissions (code, name_key, resource, action, scope) VALUES
-- テナントタグ
('tag.create.tenant', 'permissions.tag.create_tenant', 'tag', 'create', 'tenant'),
('tag.read', 'permissions.tag.read', 'tag', 'read', 'tenant'),
('tag.update.tenant', 'permissions.tag.update_tenant', 'tag', 'update', 'tenant'),
('tag.delete.tenant', 'permissions.tag.delete_tenant', 'tag', 'delete', 'tenant'),

-- 個人タグ
('tag.create.personal', 'permissions.tag.create_personal', 'tag', 'create', 'personal'),
('tag.update.personal', 'permissions.tag.update_personal', 'tag', 'update', 'own'),
('tag.delete.personal', 'permissions.tag.delete_personal', 'tag', 'delete', 'own');

-- デフォルトの権限割り当て
-- Admin: 全権限
-- Lawyer: テナントタグ作成、個人タグ全権限
-- Paralegal: 個人タグのみ
-- Member: 読み取りのみ
```

### 2.3 デフォルトカラーパレット
```sql
CREATE TABLE tag_color_presets (
  id SERIAL PRIMARY KEY,
  color VARCHAR(7) NOT NULL,
  name VARCHAR(50) NOT NULL,
  display_order INTEGER NOT NULL
);

INSERT INTO tag_color_presets (color, name, display_order) VALUES
('#F44336', 'Red', 1),        -- 赤（重要）
('#E91E63', 'Pink', 2),       -- ピンク
('#9C27B0', 'Purple', 3),     -- 紫
('#673AB7', 'Deep Purple', 4), -- 深紫
('#3F51B5', 'Indigo', 5),     -- 藍
('#2196F3', 'Blue', 6),       -- 青（標準）
('#03A9F4', 'Light Blue', 7), -- 水色
('#00BCD4', 'Cyan', 8),       -- シアン
('#009688', 'Teal', 9),       -- ティール
('#4CAF50', 'Green', 10),     -- 緑（完了）
('#8BC34A', 'Light Green', 11), -- 黄緑
('#CDDC39', 'Lime', 12),      -- ライム
('#FFC107', 'Amber', 13),     -- 琥珀
('#FF9800', 'Orange', 14),    -- オレンジ
('#795548', 'Brown', 15),     -- 茶
('#607D8B', 'Blue Grey', 16); -- 青灰
```

## 3. API設計

### 3.1 タグ一覧取得
```
GET /api/v1/tags
```

#### リクエストパラメータ
```typescript
{
  scope?: 'all' | 'tenant' | 'personal'  // default: 'all'
  q?: string                             // 検索文字列
  sortBy?: 'name' | 'usage' | 'created' // default: 'usage'
  includeStats?: boolean                 // 使用統計を含むか
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "tenantTags": [
      {
        "id": "tag-001",
        "name": "🚄 出張",
        "color": "#2196F3",
        "scope": "tenant",
        "usageCount": 145,
        "lastUsedAt": "2024-01-20T10:00:00Z",
        "createdBy": {
          "id": "user-001",
          "name": "田中弁護士"
        }
      },
      {
        "id": "tag-002",
        "name": "📋 A社案件",
        "color": "#4CAF50",
        "scope": "tenant",
        "usageCount": 89,
        "lastUsedAt": "2024-01-19T15:30:00Z",
        "createdBy": {
          "id": "user-001",
          "name": "田中弁護士"
        }
      }
    ],
    "personalTags": [
      {
        "id": "tag-003",
        "name": "⭐ 重要",
        "color": "#F44336",
        "scope": "personal",
        "usageCount": 23,
        "lastUsedAt": "2024-01-20T09:00:00Z"
      }
    ]
  }
}
```

### 3.2 タグ作成
```
POST /api/v1/tags
```

#### リクエストボディ
```json
{
  "name": "🏛️ 裁判所",
  "color": "#9C27B0",
  "scope": "tenant"
}
```

#### バリデーション
```kotlin
data class CreateTagRequest(
    @field:NotBlank
    @field:Size(max = 50)
    @field:Pattern(
        regexp = "^(?!\\s*$).+", 
        message = "Tag name cannot be only whitespace"
    )
    val name: String,
    
    @field:NotBlank
    @field:Pattern(
        regexp = "^#[0-9A-Fa-f]{6}$",
        message = "Color must be in #RRGGBB format"
    )
    val color: String,
    
    @field:NotNull
    @field:Pattern(regexp = "^(tenant|personal)$")
    val scope: String
)
```

### 3.3 タグ更新
```
PUT /api/v1/tags/{id}
```

#### リクエストボディ
```json
{
  "name": "🏛️ 東京地裁",
  "color": "#673AB7"
}
```

#### 権限チェック
```kotlin
fun canUpdateTag(user: User, tag: Tag): Boolean {
    return when (tag.scope) {
        "tenant" -> user.hasPermission("tag.update.tenant")
        "personal" -> tag.ownerId == user.id
        else -> false
    }
}
```

### 3.4 タグ削除
```
DELETE /api/v1/tags/{id}
```

削除時の動作：
- 論理削除
- 関連する実費からは自動的に外れる
- 使用統計は保持

### 3.5 タグ検索・サジェスト
```
GET /api/v1/tags/suggest
```

#### リクエストパラメータ
```
q: string      // 検索文字列（2文字以上）
limit?: number // 最大件数（default: 10）
```

#### レスポンス
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-001",
      "name": "🚄 出張",
      "color": "#2196F3",
      "scope": "tenant",
      "matchedPart": "出張"  // マッチした部分
    }
  ]
}
```

### 3.6 タグ一括操作
```
POST /api/v1/tags/bulk
```

#### リクエストボディ
```json
{
  "action": "merge",  // merge, delete
  "sourceTagIds": ["tag-001", "tag-002"],
  "targetTagId": "tag-003"  // merge時のみ
}
```

## 4. 使用例

### 4.1 実費作成時のタグ付け
```kotlin
// 実費作成リクエスト
data class CreateExpenseRequest(
    // ... 他のフィールド
    val tagIds: Set<UUID> = emptySet()
)

// タグ使用統計の更新
fun attachTagsToExpense(expenseId: UUID, tagIds: Set<UUID>) {
    tagIds.forEach { tagId ->
        // 関連付け
        expenseTagRelationRepository.save(
            ExpenseTagRelation(expenseId, tagId)
        )
        
        // 使用統計更新
        tagRepository.incrementUsageCount(tagId)
    }
}
```

### 4.2 タグによる実費フィルタリング
```sql
-- タグでの絞り込みクエリ
SELECT DISTINCT e.*
FROM expenses e
JOIN expense_tag_relations etr ON e.id = etr.expense_id
WHERE etr.tag_id = ANY(:tagIds)
  AND e.tenant_id = :tenantId
  AND e.deleted_at IS NULL;
```

## 5. カラーピッカーのUI推奨

```typescript
// フロントエンド実装例
const colorPresets = [
  { color: '#F44336', name: 'red' },
  { color: '#2196F3', name: 'blue' },
  { color: '#4CAF50', name: 'green' },
  // ... 他のプリセット
]

// カスタムカラーも許可
const isValidColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}
```

## 6. タグの命名規則（推奨）

```yaml
推奨される命名パターン:
  - "🚄 出張"          # 絵文字 + 名前
  - "A社案件"          # プロジェクト名
  - "2024年1月"        # 期間
  - "東京"            # 場所
  
避けるべき命名:
  - "　　　"          # 空白のみ
  - "あああああ..."    # 無意味な文字の羅列
  - 50文字を超える名前
```

この設計により、柔軟かつ使いやすいタグシステムが実現できます。