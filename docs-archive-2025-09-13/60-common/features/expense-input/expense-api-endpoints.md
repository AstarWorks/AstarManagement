# 実費管理API エンドポイント詳細設計

## 1. API基本仕様

### ベースURL
```
https://api.Astar-management.com/api/v1
```

### 認証
```http
Authorization: Bearer {jwt_token}
```

### 共通レスポンス形式
```typescript
// 成功時
interface ApiResponse<T> {
  success: true
  data: T
  meta?: {
    timestamp: string
    version: string
  }
}

// エラー時
interface ApiErrorResponse {
  success: false
  error: {
    code: string
    statusCode: number
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
  }
}
```

## 2. 実費エンドポイント

### 2.1 実費一覧取得
```
GET /api/v1/expenses
```

#### リクエストパラメータ
```typescript
{
  // ページネーション
  page?: number         // default: 1
  perPage?: number      // default: 30, max: 100
  
  // フィルター
  dateFrom?: string     // ISO 8601 (YYYY-MM-DD)
  dateTo?: string       // ISO 8601 (YYYY-MM-DD)
  caseId?: string       // UUID
  category?: string     // transportation, stamp_fee, etc.
  tagIds?: string[]     // タグIDの配列
  minAmount?: number    // 最小金額
  maxAmount?: number    // 最大金額
  
  // 検索
  q?: string           // 摘要、メモを検索
  
  // ソート
  sortBy?: string      // date(default), amount, createdAt
  sortOrder?: string   // desc(default), asc
}
```

#### レスポンス
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2024-01-20",
      "category": "transportation",
      "description": "○○地裁への移動",
      "incomeAmount": 0,
      "expenseAmount": 1500,
      "case": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "山田太郎 vs 株式会社ABC"
      },
      "createdBy": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "田中弁護士"
      },
      "tags": ["出張", "東京"],
      "attachmentCount": 1,
      "memo": "電車代（往復）",
      "createdAt": "2024-01-20T09:00:00Z",
      "updatedAt": "2024-01-20T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 30,
    "total": 150,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2.2 実費詳細取得
```
GET /api/v1/expenses/{id}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-01-20",
    "category": "transportation",
    "description": "○○地裁への移動",
    "incomeAmount": 0,
    "expenseAmount": 1500,
    "case": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "山田太郎 vs 株式会社ABC",
      "status": "active"
    },
    "user": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "佐藤事務員"
    },
    "createdBy": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "田中弁護士"
    },
    "tags": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "name": "出張"
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440005",
        "name": "東京"
      }
    ],
    "attachments": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440006",
        "fileName": "receipt_20240120.jpg",
        "originalName": "領収書.jpg",
        "fileSize": 1024000,
        "mimeType": "image/jpeg",
        "uploadedAt": "2024-01-20T09:05:00Z"
      }
    ],
    "memo": "電車代（往復）\n品川→東京地裁",
    "approvalStatus": "approved",
    "createdAt": "2024-01-20T09:00:00Z",
    "updatedAt": "2024-01-20T09:00:00Z"
  }
}
```

### 2.3 実費作成
```
POST /api/v1/expenses
```

#### リクエストボディ
```json
{
  "date": "2024-01-20",
  "category": "transportation",
  "description": "○○地裁への移動",
  "incomeAmount": 0,
  "expenseAmount": 1500,
  "caseId": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "880e8400-e29b-41d4-a716-446655440003",
  "tagIds": [
    "990e8400-e29b-41d4-a716-446655440004",
    "990e8400-e29b-41d4-a716-446655440005"
  ],
  "memo": "電車代（往復）",
  "attachmentIds": [
    "aa0e8400-e29b-41d4-a716-446655440006"
  ]
}
```

#### バリデーションルール
```kotlin
data class CreateExpenseRequest(
    @field:NotNull
    @field:PastOrPresent
    val date: LocalDate,
    
    @field:NotBlank
    @field:Pattern(regexp = "^(transportation|stamp_fee|copy_fee|postage|other)$")
    val category: String,
    
    @field:NotBlank
    @field:Size(max = 200)
    val description: String,
    
    @field:NotNull
    @field:PositiveOrZero
    val incomeAmount: BigDecimal = BigDecimal.ZERO,
    
    @field:NotNull
    @field:PositiveOrZero
    val expenseAmount: BigDecimal = BigDecimal.ZERO,
    
    val caseId: UUID? = null,
    val userId: UUID? = null,
    val tagIds: Set<UUID> = emptySet(),
    
    @field:Size(max = 1000)
    val memo: String? = null,
    
    val attachmentIds: Set<UUID> = emptySet()
) {
    @AssertTrue(message = "Either income or expense must be greater than 0")
    fun isAmountValid(): Boolean {
        return (incomeAmount > BigDecimal.ZERO) xor (expenseAmount > BigDecimal.ZERO)
    }
}
```

### 2.4 実費更新
```
PUT /api/v1/expenses/{id}
```

#### リクエストボディ
```json
{
  "date": "2024-01-20",
  "category": "transportation",
  "description": "○○地裁への移動（修正）",
  "incomeAmount": 0,
  "expenseAmount": 1800,
  "caseId": "660e8400-e29b-41d4-a716-446655440001",
  "tagIds": ["990e8400-e29b-41d4-a716-446655440004"],
  "memo": "電車代（往復）+ タクシー代"
}
```

### 2.5 実費削除（論理削除）
```
DELETE /api/v1/expenses/{id}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deletedAt": "2024-01-20T10:00:00Z"
  }
}
```

### 2.6 実費一括削除
```
POST /api/v1/expenses/bulk-delete
```

#### リクエストボディ
```json
{
  "ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

## 3. CSVインポート

### 3.1 CSVファイル解析
```
POST /api/v1/expenses/import/parse
```

#### リクエスト
```
Content-Type: multipart/form-data

file: (CSVファイル)
formatId?: string  // 既存フォーマットID
encoding?: string  // default: "UTF-8", options: "SHIFT_JIS"
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "sessionId": "import-session-123",
    "format": {
      "id": "format-456",
      "name": "楽天カード",
      "detectedAutomatically": true
    },
    "summary": {
      "totalRows": 50,
      "validRows": 48,
      "invalidRows": 2,
      "duplicateRows": 5
    },
    "preview": [
      {
        "rowNumber": 1,
        "status": "valid",
        "data": {
          "date": "2024-01-15",
          "description": "スターバックス新宿店",
          "expenseAmount": 550,
          "suggestedCategory": "other"
        },
        "isDuplicate": false
      },
      {
        "rowNumber": 2,
        "status": "invalid",
        "data": {
          "date": "invalid-date",
          "description": "エラーデータ"
        },
        "errors": [
          {
            "field": "date",
            "code": "INVALID_FORMAT",
            "message": "Invalid date format"
          }
        ]
      }
    ],
    "columnMapping": {
      "date": "利用日",
      "description": "利用先",
      "amount": "利用金額"
    }
  }
}
```

### 3.2 インポート実行
```
POST /api/v1/expenses/import/execute
```

#### リクエストボディ
```json
{
  "sessionId": "import-session-123",
  "selectedRows": [1, 3, 5, 7, 9],
  "defaultValues": {
    "category": "other",
    "caseId": "660e8400-e29b-41d4-a716-446655440001"
  },
  "skipDuplicates": false
}
```

## 4. 集計・レポート

### 4.1 残高取得
```
GET /api/v1/expenses/balance
```

#### リクエストパラメータ
```
date: string          // 基準日
caseId?: string       // 案件別
userId?: string       // ユーザー別
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "balance": 125000,
    "totalIncome": 500000,
    "totalExpense": 375000,
    "transactionCount": 145
  }
}
```

### 4.2 月次サマリー
```
GET /api/v1/expenses/summary/monthly
```

#### リクエストパラメータ
```
year: number
month: number
groupBy?: string  // case, user, category
```

## 5. エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| `EXPENSE_NOT_FOUND` | 404 | 実費が見つかりません |
| `INVALID_CATEGORY` | 400 | 無効な科目です |
| `FUTURE_DATE` | 400 | 未来の日付は入力できません |
| `DUPLICATE_EXPENSE` | 409 | 重複する実費が存在します |
| `IMPORT_SESSION_EXPIRED` | 410 | インポートセッションが期限切れです |
| `FILE_TOO_LARGE` | 413 | ファイルサイズが大きすぎます |
| `UNSUPPORTED_FORMAT` | 415 | サポートされていないファイル形式です |

## 6. Kotlin実装例

```kotlin
@RestController
@RequestMapping("/api/v1/expenses")
class ExpenseController(
    private val expenseService: ExpenseService
) {
    @GetMapping
    fun getExpenses(
        @Valid request: ExpenseSearchRequest,
        @AuthenticationPrincipal auth: AuthenticatedUser
    ): ApiResponse<PagedData<ExpenseListDto>> {
        val result = expenseService.search(
            tenantId = auth.tenantId,
            request = request
        )
        return ApiResponse.success(result)
    }
    
    @PostMapping
    fun createExpense(
        @Valid @RequestBody request: CreateExpenseRequest,
        @AuthenticationPrincipal auth: AuthenticatedUser
    ): ApiResponse<ExpenseDetailDto> {
        val expense = expenseService.create(
            tenantId = auth.tenantId,
            userId = auth.userId,
            request = request
        )
        return ApiResponse.success(expense)
    }
}
```