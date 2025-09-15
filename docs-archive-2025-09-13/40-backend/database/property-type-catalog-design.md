# Property Type Catalog 設計

## 概要
Notionライクな柔軟なテーブルシステムにおけるプロパティ型の定義と管理を行うカタログシステム。
ハイブリッド設計により、型の一貫性とJSONBの柔軟性を両立する。

## 設計原則

### ハイブリッドアプローチ
1. **型定義はカタログで管理**: 全システム共通の型定義を一元管理
2. **実データはJSONBで保持**: 柔軟性とパフォーマンスを維持
3. **JOINは不要**: カタログは参照とバリデーションのみに使用
4. **段階的活用**: 最初は単純な参照から始め、徐々に高度な機能を追加

## データベース設計

### property_type_catalog テーブル
```sql
CREATE TABLE property_type_catalog (
    id VARCHAR(50) PRIMARY KEY,     -- 型ID（'text', 'number' など）
    name VARCHAR(100) NOT NULL,     -- 型名
    display_name VARCHAR(100),      -- 表示名
    category VARCHAR(50),           -- カテゴリー
    validation_schema JSONB,        -- バリデーションルール
    default_config JSONB,           -- デフォルト設定
    ui_component VARCHAR(100),      -- UIコンポーネント名
    icon VARCHAR(50),               -- アイコン
    description TEXT,               -- 説明
    is_active BOOLEAN DEFAULT TRUE, -- 有効/無効
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 型カテゴリー

### Basic (基本型)
基本的なデータ入力に使用される標準的な型。

| ID | 名前 | 説明 | デフォルト設定 |
|---|------|------|--------------|
| text | Text | 短文テキスト | `{"maxLength": 500}` |
| long_text | Long Text | 長文テキスト | `{"maxLength": 5000}` |
| number | Number | 数値 | `{"precision": 2}` |
| checkbox | Checkbox | チェックボックス | `{}` |
| date | Date | 日付 | `{}` |
| datetime | Date & Time | 日時 | `{}` |
| select | Select | 単一選択 | `{"options": []}` |
| multi_select | Multi-select | 複数選択 | `{"options": []}` |
| status | Status | ステータス（カンバン用） | `{"options": []}` |

### Advanced (高度な型)
特定の形式やバリデーションが必要な型。

| ID | 名前 | 説明 | デフォルト設定 |
|---|------|------|--------------|
| url | URL | URLリンク | `{}` |
| email | Email | メールアドレス | `{}` |
| phone | Phone | 電話番号 | `{}` |
| currency | Currency | 通貨 | `{"currency": "JPY"}` |
| percent | Percent | パーセント | `{}` |

### Relation (リレーション型)
他のデータとの関連を表現する型。

| ID | 名前 | 説明 | デフォルト設定 |
|---|------|------|--------------|
| user | User | ユーザー参照 | `{"multiple": false}` |
| relation | Relation | 他テーブル参照 | `{}` |

### System (システム型)
システムが自動的に管理する型。

| ID | 名前 | 説明 | デフォルト設定 |
|---|------|------|--------------|
| created_time | Created time | 作成日時 | `{}` |
| created_by | Created by | 作成者 | `{}` |
| updated_time | Last edited time | 更新日時 | `{}` |
| updated_by | Last edited by | 更新者 | `{}` |

## バリデーションスキーマ

### テキスト型
```json
{
  "minLength": 0,
  "maxLength": 500,
  "pattern": "^[a-zA-Z0-9]*$",  // 正規表現パターン（オプション）
  "required": false
}
```

### 数値型
```json
{
  "min": 0,
  "max": 1000000,
  "precision": 2,  // 小数点以下の桁数
  "required": false,
  "allowNegative": true
}
```

### 選択型
```json
{
  "options": [
    {"value": "todo", "label": "To Do", "color": "#gray"},
    {"value": "done", "label": "Done", "color": "#green"}
  ],
  "allowCustom": false,  // カスタム値の許可
  "multiple": false,      // 複数選択の許可
  "maxSelections": 5      // 最大選択数
}
```

### 日付型
```json
{
  "minDate": "2020-01-01",
  "maxDate": "2030-12-31",
  "format": "YYYY-MM-DD",
  "includeTime": false
}
```

### リレーション型
```json
{
  "targetDatabase": "uuid",  // 参照先データベースID
  "multiple": false,         // 複数選択
  "bidirectional": false,    // 双方向リレーション
  "cascadeDelete": false     // カスケード削除
}
```

## プロパティ定義での使用方法

データベースのpropertiesフィールドでの定義例：

```json
{
  "title": {
    "type_id": "text",           // カタログの型ID
    "display_name": "タイトル",
    "config": {                  // 型固有の設定（デフォルトを上書き）
      "required": true,
      "maxLength": 200
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
      ],
      "allowCustom": false
    }
  },
  "assignee": {
    "type_id": "user",
    "display_name": "担当者",
    "config": {
      "multiple": true,
      "required": false
    }
  }
}
```

## バックエンド実装

### Kotlinエンティティ
```kotlin
@Entity
@Table(name = "property_type_catalog")
data class PropertyTypeCatalog(
    @Id
    val id: String,
    val name: String,
    val displayName: String?,
    val category: String?,
    @Type(type = "jsonb")
    val validationSchema: Map<String, Any>?,
    @Type(type = "jsonb")
    val defaultConfig: Map<String, Any>?,
    val uiComponent: String?,
    val icon: String?,
    val description: String?,
    val isActive: Boolean = true,
    val createdAt: Instant = Instant.now()
)
```

### バリデーションサービス
```kotlin
@Service
class PropertyValidationService(
    private val catalogRepository: PropertyTypeCatalogRepository
) {
    fun validateProperty(
        typeId: String, 
        value: Any, 
        config: Map<String, Any>
    ): ValidationResult {
        val type = catalogRepository.findById(typeId)
            ?: throw PropertyTypeNotFoundException(typeId)
        
        // カタログのバリデーションスキーマとconfigをマージ
        val mergedSchema = mergeSchemas(
            type.validationSchema, 
            config
        )
        
        return validate(value, mergedSchema)
    }
}
```

## フロントエンド実装

### 型定義
```typescript
interface PropertyType {
  id: string;
  name: string;
  displayName?: string;
  category: string;
  validationSchema?: Record<string, any>;
  defaultConfig?: Record<string, any>;
  uiComponent?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
}

interface PropertyDefinition {
  type_id: string;
  display_name: string;
  config: Record<string, any>;
}
```

### 動的コンポーネントレンダリング
```vue
<template>
  <component
    :is="getComponent(property.type_id)"
    v-model="value"
    :config="property.config"
    :validation="getValidationRules(property)"
  />
</template>

<script setup lang="ts">
const getComponent = (typeId: string) => {
  const componentMap = {
    'text': 'TextInput',
    'number': 'NumberInput',
    'select': 'SelectInput',
    'date': 'DatePicker',
    'user': 'UserPicker',
    // ...
  };
  return componentMap[typeId] || 'TextInput';
};
</script>
```

## 拡張ポイント

### Phase 1（現在）
- 型カタログの基本実装
- 参照とバリデーションのみ

### Phase 2
- カスタム型の追加機能
- 型の継承関係
- より高度なバリデーション

### Phase 3
- プラグイン型のサポート
- 型のバージョン管理
- 型のインポート/エクスポート

### Phase 4
- Formula型の実装
- Rollup型の実装
- 高度なリレーション機能

## 利点と考慮事項

### 利点
1. **一貫性**: 全システムで統一された型定義
2. **拡張性**: 新しい型の追加が容易
3. **保守性**: 型定義の一元管理
4. **性能**: JOINが不要でクエリが高速
5. **柔軟性**: JSONBの利点を維持

### 考慮事項
1. **初期データ**: マイグレーション時に基本型を投入
2. **後方互換性**: 型の変更時の既存データへの影響
3. **キャッシュ**: 型情報は頻繁に参照されるためキャッシュ推奨
4. **国際化**: display_nameの多言語対応

## まとめ

このハイブリッド設計により：
- **移行コストゼロ**: 最初から正しい設計で実装
- **複雑性を最小化**: カタログは参照のみ、実データはJSONB
- **段階的な拡張**: 必要に応じて機能を追加可能
- **Notionとの互換性**: 同様のユーザー体験を提供