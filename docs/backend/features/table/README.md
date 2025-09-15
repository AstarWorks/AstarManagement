# テーブル機能（柔軟テーブルシステム）

## 概要

PostgreSQLのJSONB型を活用した、スキーマレスで柔軟なテーブルシステム。
Notionのデータベースのように、ユーザーが自由にカラムを定義・変更できる。

## 設計思想

### なぜJSONBか
1. **スキーマの柔軟性**: ALTER TABLEなしでカラム追加・削除
2. **高速検索**: GINインデックスによる高速クエリ
3. **型安全**: JSON Schemaによる検証
4. **PostgreSQL最適化**: ネイティブサポートで高パフォーマンス

## 機能一覧

### コア機能
- **動的プロパティ定義**: テキスト、数値、日付、選択肢など多様なプロパティタイプ
- **複数ビュー**: テーブルビュー、カンバンビュー（ギャラリービューは計画中）
- **フィルタリング・ソート**: 複雑な条件での絞り込みと並び替え
- **インライン編集**: セルを直接編集して即座に保存
- **列のピン留め**: 重要な列を左右に固定表示
- **バッチ操作**: 複数レコードの一括処理
- **キャッシュ戦略**: スキーマ情報のキャッシング

### サポートするプロパティタイプ

**基本型**
- `TEXT`: テキスト
- `NUMBER`: 数値
- `DATE`: 日付
- `CHECKBOX`: チェックボックス
- `URL`: URL
- `EMAIL`: メールアドレス

**選択型**
- `SELECT`: 単一選択
- `MULTI_SELECT`: 複数選択
- `TAGS`: タグ

**リレーション型**
- `USER`: ユーザー参照
- `RELATION`: テーブル間リレーション
- `DOCUMENT`: ドキュメント参照

**メディア型**
- `FILE`: ファイル添付
- `IMAGE`: 画像

**高度な型**（計画中）
- `FORMULA`: 計算式
- `ROLLUP`: 集計
- `LOOKUP`: 参照先の値取得

## アーキテクチャ

### バックエンド
- **ドメインモデル**: `Table`, `Record`, `PropertyDefinition`
- **サービス層**: `TableService`, `RecordService`
- **リポジトリ**: Spring Data JDBCベース
- **API**: RESTful エンドポイント

### フロントエンド
- **コンポーネント**: Vue 3 Composition API
- **状態管理**: Composables パターン
- **UI**: TanStack Table + shadcn-vue
- **ビュー切り替え**: テーブル/カンバン対応

## API概要

### テーブル操作
- `GET /api/v1/workspaces/{workspaceId}/tables` - テーブル一覧
- `POST /api/v1/workspaces/{workspaceId}/tables` - テーブル作成
- `GET /api/v1/tables/{tableId}` - テーブル詳細
- `PUT /api/v1/tables/{tableId}` - テーブル更新
- `DELETE /api/v1/tables/{tableId}` - テーブル削除

### レコード操作
- `GET /api/v1/tables/{tableId}/records` - レコード一覧
- `POST /api/v1/tables/{tableId}/records` - レコード作成
- `PUT /api/v1/records/{recordId}` - レコード更新
- `DELETE /api/v1/records/{recordId}` - レコード削除

## 使用例

### テーブル作成
```typescript
const table = await createTable({
  workspaceId: 'workspace-123',
  name: 'プロジェクト管理',
  properties: {
    title: { type: 'TEXT', name: 'タイトル', required: true },
    status: { 
      type: 'SELECT', 
      name: 'ステータス',
      options: ['TODO', '進行中', '完了']
    },
    assignee: { type: 'USER', name: '担当者' },
    dueDate: { type: 'DATE', name: '期限' }
  }
})
```

### レコード作成
```typescript
const record = await createRecord({
  tableId: table.id,
  data: {
    title: '新機能開発',
    status: '進行中',
    assignee: 'user-456',
    dueDate: '2024-12-31'
  }
})
```