# テーブル機能 - Backend API

## REST APIエンドポイント

### テーブル管理

#### テーブル一覧取得
```http
GET /api/v1/workspaces/{workspaceId}/tables
```

**レスポンス**:
```json
{
  "tables": [
    {
      "id": "table-123",
      "workspaceId": "workspace-456",
      "name": "プロジェクト管理",
      "description": "プロジェクトの進捗管理",
      "propertyCount": 5,
      "recordCount": 42,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  ]
}
```

#### テーブル作成
```http
POST /api/v1/workspaces/{workspaceId}/tables
```

**リクエスト**:
```json
{
  "name": "タスク管理",
  "description": "チームのタスク管理テーブル",
  "properties": {
    "title": {
      "type": "TEXT",
      "name": "タイトル",
      "required": true
    },
    "status": {
      "type": "SELECT",
      "name": "ステータス",
      "options": ["TODO", "進行中", "レビュー", "完了"],
      "defaultValue": "TODO"
    }
  },
  "propertyOrder": ["title", "status"]
}
```

#### テーブル詳細取得
```http
GET /api/v1/tables/{tableId}
```

#### テーブル更新
```http
PUT /api/v1/tables/{tableId}
```

**リクエスト**:
```json
{
  "name": "タスク管理（更新）",
  "description": "更新された説明"
}
```

#### テーブル削除
```http
DELETE /api/v1/tables/{tableId}
```

### プロパティ管理

#### プロパティ追加
```http
POST /api/v1/tables/{tableId}/properties
```

**リクエスト**:
```json
{
  "key": "priority",
  "definition": {
    "type": "SELECT",
    "name": "優先度",
    "options": ["低", "中", "高"],
    "defaultValue": "中"
  }
}
```

#### プロパティ更新
```http
PUT /api/v1/tables/{tableId}/properties/{propertyKey}
```

#### プロパティ削除
```http
DELETE /api/v1/tables/{tableId}/properties/{propertyKey}
```

### レコード管理

#### レコード一覧取得
```http
GET /api/v1/tables/{tableId}/records
```

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 0）
- `size`: ページサイズ（デフォルト: 20）
- `sort`: ソート条件（例: `createdAt,desc`）
- `filter`: フィルター条件（JSON形式）

**レスポンス**:
```json
{
  "content": [
    {
      "id": "record-789",
      "tableId": "table-123",
      "data": {
        "title": "新機能開発",
        "status": "進行中",
        "priority": "高"
      },
      "createdAt": "2024-01-10T10:00:00Z",
      "updatedAt": "2024-01-15T15:30:00Z"
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "number": 0,
  "size": 20
}
```

#### レコード作成
```http
POST /api/v1/tables/{tableId}/records
```

**リクエスト**:
```json
{
  "data": {
    "title": "バグ修正",
    "status": "TODO",
    "priority": "高"
  }
}
```

#### レコード更新
```http
PUT /api/v1/records/{recordId}
```

**リクエスト**:
```json
{
  "data": {
    "status": "完了"
  }
}
```

#### レコード削除
```http
DELETE /api/v1/records/{recordId}
```

#### バッチ操作
```http
POST /api/v1/tables/{tableId}/records/batch
```

**リクエスト**:
```json
{
  "operation": "UPDATE",
  "recordIds": ["record-1", "record-2", "record-3"],
  "data": {
    "status": "完了"
  }
}
```

## エラーレスポンス

### 共通エラー形式
```json
{
  "error": {
    "code": "TABLE_NOT_FOUND",
    "message": "指定されたテーブルが見つかりません",
    "details": {
      "tableId": "table-999"
    }
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### エラーコード一覧
- `TABLE_NOT_FOUND`: テーブルが存在しない
- `RECORD_NOT_FOUND`: レコードが存在しない
- `INVALID_PROPERTY_TYPE`: 無効なプロパティタイプ
- `REQUIRED_FIELD_MISSING`: 必須フィールドが未入力
- `PERMISSION_DENIED`: 権限がない
- `VALIDATION_ERROR`: バリデーションエラー

## 認証・認可

すべてのエンドポイントは JWT 認証が必要:
```http
Authorization: Bearer <jwt-token>
```

権限要件:
- テーブル作成: `table:create` 権限
- テーブル読み取り: `table:read` 権限
- テーブル更新: `table:write` 権限
- テーブル削除: `table:delete` 権限