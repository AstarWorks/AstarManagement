# 実費入力画面 API仕様書

## 1. API概要

### 1.1 基本情報
- **ベースURL**: `https://api.Astar-management.com/v1`
- **認証方式**: JWT Bearer Token
- **Content-Type**: `application/json`
- **文字コード**: UTF-8

### 1.2 共通ヘッダー
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Tenant-ID: {tenant_id}
```

### 1.3 共通レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "meta": {
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

#### エラー時
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": {
      "field": "amount",
      "reason": "金額は0以上の数値を入力してください"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

## 2. エンドポイント一覧

### 2.1 実費管理

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/expenses` | 実費一覧取得 |
| GET | `/expenses/{id}` | 実費詳細取得 |
| POST | `/expenses` | 実費新規作成 |
| PUT | `/expenses/{id}` | 実費更新 |
| DELETE | `/expenses/{id}` | 実費削除（論理削除） |
| POST | `/expenses/bulk-delete` | 実費一括削除 |
| GET | `/expenses/export` | 実費エクスポート |

### 2.2 CSVインポート

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| POST | `/expenses/import/parse` | CSVファイル解析 |
| POST | `/expenses/import/execute` | インポート実行 |
| GET | `/expenses/import/formats` | 対応フォーマット一覧 |
| POST | `/expenses/import/formats` | カスタムフォーマット登録 |

### 2.3 集計・レポート

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/expenses/reports/summary` | 集計サマリー取得 |
| GET | `/expenses/reports/breakdown` | 内訳取得 |
| POST | `/expenses/reports/export` | レポートエクスポート |

### 2.4 マスタデータ

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/expenses/categories` | 科目一覧取得 |
| POST | `/expenses/categories` | 科目追加 |
| PUT | `/expenses/categories/{id}` | 科目更新 |

## 3. API詳細

### 3.1 実費一覧取得

#### エンドポイント
```
GET /expenses
```

#### クエリパラメータ
```typescript
{
  // ページネーション
  page?: number;          // デフォルト: 1
  limit?: number;         // デフォルト: 30, 最大: 100
  
  // ソート
  sort_by?: 'date' | 'amount' | 'category';  // デフォルト: 'date'
  sort_order?: 'asc' | 'desc';               // デフォルト: 'desc'
  
  // フィルター
  date_from?: string;     // ISO 8601形式 (YYYY-MM-DD)
  date_to?: string;       // ISO 8601形式 (YYYY-MM-DD)
  case_id?: string;       // 案件ID
  category?: string;      // 科目コード
  amount_min?: number;    // 最小金額
  amount_max?: number;    // 最大金額
  search?: string;        // 検索文字列（摘要、メモ）
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "date": "2024-01-20",
        "category": "transportation",
        "category_name": "交通費",
        "description": "○○地裁への移動",
        "income_amount": 0,
        "expense_amount": 1500,
        "balance": 98500,
        "case_id": "660e8400-e29b-41d4-a716-446655440001",
        "case_name": "山田太郎 vs 株式会社ABC",
        "memo": "電車代（往復）",
        "attachment_count": 1,
        "created_at": "2024-01-20T09:00:00Z",
        "created_by_name": "弁護士 田中"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 150,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 3.2 実費新規作成

#### エンドポイント
```
POST /expenses
```

#### リクエストボディ
```json
{
  "date": "2024-01-20",
  "category": "transportation",
  "description": "○○地裁への移動",
  "income_amount": 0,
  "expense_amount": 1500,
  "case_id": "660e8400-e29b-41d4-a716-446655440001",
  "memo": "電車代（往復）",
  "attachment_ids": ["770e8400-e29b-41d4-a716-446655440002"]
}
```

#### バリデーションルール
- `date`: 必須、過去1年以内の日付
- `category`: 必須、登録済み科目コード
- `description`: 必須、最大200文字
- `income_amount`: 必須、0以上の数値
- `expense_amount`: 必須、0以上の数値
- `memo`: 任意、最大500文字

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-01-20",
    "category": "transportation",
    "description": "○○地裁への移動",
    "income_amount": 0,
    "expense_amount": 1500,
    "balance": 98500,
    "case_id": "660e8400-e29b-41d4-a716-446655440001",
    "memo": "電車代（往復）",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

### 3.3 CSVファイル解析

#### エンドポイント
```
POST /expenses/import/parse
```

#### リクエスト
```http
Content-Type: multipart/form-data

file: (CSVファイル)
format_id?: string  // 既存フォーマットID（省略時は自動判定）
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "detected_format": "rakuten_card",
    "detected_format_name": "楽天カード",
    "total_rows": 50,
    "valid_rows": 48,
    "invalid_rows": 2,
    "preview": [
      {
        "row_number": 1,
        "date": "2024-01-15",
        "description": "スターバックス新宿店",
        "amount": 550,
        "category_suggestion": "other",
        "is_valid": true
      },
      {
        "row_number": 2,
        "date": "2024-01-16",
        "description": "JR東日本",
        "amount": 1500,
        "category_suggestion": "transportation",
        "is_valid": true
      }
    ],
    "errors": [
      {
        "row_number": 15,
        "field": "date",
        "message": "日付の形式が不正です",
        "value": "2024/13/45"
      }
    ],
    "column_mapping": {
      "date": "利用日",
      "description": "利用店舗",
      "amount": "利用金額"
    }
  }
}
```

### 3.4 インポート実行

#### エンドポイント
```
POST /expenses/import/execute
```

#### リクエストボディ
```json
{
  "rows": [
    {
      "row_number": 1,
      "date": "2024-01-15",
      "category": "other",
      "description": "スターバックス新宿店",
      "expense_amount": 550,
      "case_id": null,
      "memo": "打ち合わせ"
    },
    {
      "row_number": 2,
      "date": "2024-01-16",
      "category": "transportation",
      "description": "JR東日本",
      "expense_amount": 1500,
      "case_id": "660e8400-e29b-41d4-a716-446655440001",
      "memo": null
    }
  ]
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "imported_count": 2,
    "failed_count": 0,
    "imported_ids": [
      "880e8400-e29b-41d4-a716-446655440003",
      "880e8400-e29b-41d4-a716-446655440004"
    ],
    "errors": []
  }
}
```

### 3.5 集計サマリー取得

#### エンドポイント
```
GET /expenses/reports/summary
```

#### クエリパラメータ
```typescript
{
  period_type: 'month' | 'quarter' | 'year' | 'custom';
  start_date?: string;  // period_type=customの場合必須
  end_date?: string;    // period_type=customの場合必須
  group_by?: 'case' | 'lawyer' | 'category';
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "period": {
      "type": "month",
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "summary": {
      "total_income": 50000,
      "total_expense": 125000,
      "balance": -75000,
      "count": 45
    },
    "breakdown": [
      {
        "id": "transportation",
        "label": "交通費",
        "income": 0,
        "expense": 45000,
        "count": 20,
        "percentage": 36.0
      },
      {
        "id": "stamp_fee",
        "label": "印紙代",
        "income": 0,
        "expense": 30000,
        "count": 5,
        "percentage": 24.0
      }
    ]
  }
}
```

### 3.6 実費エクスポート

#### エンドポイント
```
GET /expenses/export
```

#### クエリパラメータ
```typescript
{
  format: 'csv' | 'pdf';
  // その他、一覧取得と同じフィルターパラメータ
}
```

#### レスポンス（CSV）
```csv
日付,科目,摘要,収入金額,支出金額,差引残額,案件,メモ
2024-01-20,交通費,○○地裁への移動,0,1500,98500,山田太郎 vs 株式会社ABC,電車代（往復）
```

#### レスポンス（PDF）
バイナリデータとして返却
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="expenses_2024-01.pdf"
```

## 4. エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|---------------|
| `UNAUTHORIZED` | 認証エラー | 401 |
| `FORBIDDEN` | 権限エラー | 403 |
| `NOT_FOUND` | リソースが見つからない | 404 |
| `VALIDATION_ERROR` | バリデーションエラー | 400 |
| `DUPLICATE_ENTRY` | 重複エラー | 409 |
| `FILE_TOO_LARGE` | ファイルサイズ超過 | 413 |
| `INVALID_FILE_FORMAT` | ファイル形式エラー | 400 |
| `IMPORT_PARTIAL_FAILURE` | 一部インポート失敗 | 207 |
| `INTERNAL_ERROR` | サーバーエラー | 500 |

## 5. ファイルアップロード

### 5.1 裏付け資料アップロード

#### エンドポイント
```
POST /expenses/attachments
```

#### リクエスト
```http
Content-Type: multipart/form-data

file: (画像またはPDFファイル)
```

#### 制限事項
- 最大ファイルサイズ: 10MB
- 対応形式: JPG, PNG, PDF
- 最大ファイル数: 1実費あたり5ファイルまで

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    "file_name": "receipt_20240120.jpg",
    "file_size": 1024000,
    "mime_type": "image/jpeg",
    "url": "https://storage.Astar-management.com/attachments/990e8400.jpg",
    "uploaded_at": "2024-01-20T10:35:00Z"
  }
}
```

## 6. レート制限

- 通常エンドポイント: 1000リクエスト/時間
- CSVインポート: 10リクエスト/時間
- ファイルアップロード: 100リクエスト/時間

レート制限に達した場合、以下のヘッダーが返却されます：
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642684800
```

## 7. Webhook（将来実装）

実費の作成・更新・削除時に、指定されたURLにイベントを通知する機能。

### イベント例
```json
{
  "event": "expense.created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "110e8400-e29b-41d4-a716-446655440099",
    // 実費データ
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```