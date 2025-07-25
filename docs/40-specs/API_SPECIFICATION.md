# API仕様書

## 1. API概要

### 1.1 基本情報
- **ベースURL**: `https://api.aster-management.com/api/v1`
- **プロトコル**: HTTPS
- **データ形式**: JSON
- **文字エンコーディング**: UTF-8
- **API仕様記述**: OpenAPI 3.0

### 1.2 設計原則
- RESTfulアーキテクチャに準拠
- リソース指向のURL設計
- 適切なHTTPメソッドとステータスコードの使用
- 一貫性のあるレスポンス構造
- ページネーション対応
- 国際化対応（Accept-Languageヘッダー）

### 1.3 バージョニング
- URLパスにバージョンを含める（/api/v1）
- 後方互換性を保ちながら新バージョンを追加
- 非推奨APIは最低6ヶ月間維持

## 2. 認証・認可

### 2.1 認証方式
JWT (JSON Web Token) を使用したBearer認証

```
Authorization: Bearer <access_token>
```

### 2.2 トークン仕様
- **アクセストークン**: 有効期限15分
- **リフレッシュトークン**: 有効期限7日
- **トークン形式**: JWT (RS256)

### 2.3 認証エンドポイント

#### ログイン
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"  // 2FA有効時のみ
}

Response:
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 900,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "山田太郎",
      "role": "lawyer"
    }
  }
}
```

#### トークンリフレッシュ
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}

Response:
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### ログアウト
```
POST /auth/logout
Authorization: Bearer <access_token>

Response:
{
  "message": "ログアウトしました"
}
```

## 3. 共通仕様

### 3.1 リクエストヘッダー
```
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
Accept-Language: ja  // または en
X-Request-ID: <unique-request-id>  // オプション
```

### 3.2 レスポンス構造

#### 成功レスポンス
```json
{
  "data": {
    // レスポンスデータ
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

#### ページネーション付きレスポンス
```json
{
  "data": [
    // データ配列
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

#### エラーレスポンス
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "code": "required",
        "message": "メールアドレスは必須です"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 3.3 HTTPステータスコード
| コード | 説明 | 使用例 |
|--------|------|--------|
| 200 | OK | GET, PUT成功時 |
| 201 | Created | POST成功時 |
| 204 | No Content | DELETE成功時 |
| 400 | Bad Request | バリデーションエラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | リソースが見つからない |
| 409 | Conflict | 重複エラー |
| 422 | Unprocessable Entity | ビジネスロジックエラー |
| 429 | Too Many Requests | レート制限 |
| 500 | Internal Server Error | サーバーエラー |

### 3.4 エラーコード一覧
| コード | 説明 |
|--------|------|
| AUTHENTICATION_FAILED | 認証失敗 |
| INVALID_TOKEN | 無効なトークン |
| TOKEN_EXPIRED | トークン期限切れ |
| PERMISSION_DENIED | 権限不足 |
| VALIDATION_ERROR | バリデーションエラー |
| RESOURCE_NOT_FOUND | リソースが見つからない |
| DUPLICATE_RESOURCE | リソースの重複 |
| BUSINESS_LOGIC_ERROR | ビジネスロジックエラー |
| RATE_LIMIT_EXCEEDED | レート制限超過 |
| INTERNAL_ERROR | 内部エラー |

## 4. APIエンドポイント詳細

### 4.1 案件管理 (Cases)

#### 案件一覧取得
```
GET /cases

Query Parameters:
- page: integer (default: 1)
- perPage: integer (default: 20, max: 100)
- search: string (案件名、案件番号、依頼者名で検索)
- status: string (ステータスでフィルター)
- caseType: string (案件種別でフィルター)
- assigneeId: uuid (担当者でフィルター)
- fromDate: date (受任日の開始日)
- toDate: date (受任日の終了日)
- sortBy: string (case_number|title|accepted_date|updated_at)
- sortOrder: string (asc|desc)

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "caseNumber": "2024-001",
      "title": "山田太郎 対 株式会社ABC 損害賠償請求事件",
      "caseType": {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "code": "civil_damages",
        "name": "損害賠償"
      },
      "client": {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "name": "山田太郎",
        "clientCode": "C-2024-001"
      },
      "currentStatus": {
        "code": "in_progress",
        "name": "進行中",
        "color": "#green"
      },
      "acceptedDate": "2024-01-10",
      "primaryLawyer": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "name": "田中弁護士"
      },
      "updatedAt": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 案件詳細取得
```
GET /cases/{caseId}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "caseNumber": "2024-001",
    "title": "山田太郎 対 株式会社ABC 損害賠償請求事件",
    "caseType": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "code": "civil_damages",
      "name": "損害賠償"
    },
    "client": {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "name": "山田太郎",
      "clientCode": "C-2024-001",
      "email": "yamada@example.com",
      "phone": "03-1234-5678"
    },
    "opponentName": "株式会社ABC",
    "opponentAttorney": "佐藤法律事務所",
    "courtName": "東京地方裁判所",
    "caseCourtNumber": "令和6年(ワ)第123号",
    "currentStatus": {
      "code": "in_progress",
      "name": "進行中",
      "color": "#green"
    },
    "acceptedDate": "2024-01-10",
    "closedDate": null,
    "summary": "契約違反による損害賠償請求事件。原告は被告の債務不履行により損害を被ったとして、損害賠償金1000万円を請求。",
    "internalNotes": "被告側は和解を希望している模様",
    "feeStructure": "着手金30万円、成功報酬は回収額の20%",
    "retainerFee": 300000,
    "successFeeRate": 20.0,
    "assignments": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174004",
        "user": {
          "id": "123e4567-e89b-12d3-a456-426614174003",
          "name": "田中弁護士",
          "role": "lawyer"
        },
        "role": "primary_lawyer",
        "assignedDate": "2024-01-10"
      }
    ],
    "statistics": {
      "taskCount": 12,
      "completedTaskCount": 8,
      "documentCount": 25,
      "communicationCount": 30,
      "totalExpenses": 45000
    },
    "createdAt": "2024-01-10T09:00:00Z",
    "createdBy": {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "name": "管理者"
    },
    "updatedAt": "2024-01-20T10:00:00Z",
    "updatedBy": {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "name": "田中弁護士"
    }
  }
}
```

#### 案件作成
```
POST /cases
Content-Type: application/json

{
  "caseNumber": "2024-002",  // 省略時は自動採番
  "title": "鈴木花子 対 田中商事 売掛金請求事件",
  "caseTypeId": "123e4567-e89b-12d3-a456-426614174001",
  "clientId": "123e4567-e89b-12d3-a456-426614174006",
  "opponentName": "田中商事株式会社",
  "opponentAttorney": "",
  "courtName": "",
  "caseCourtNumber": "",
  "acceptedDate": "2024-01-15",
  "summary": "売掛金500万円の支払いを求める事件",
  "internalNotes": "",
  "feeStructure": "着手金20万円、成功報酬15%",
  "retainerFee": 200000,
  "successFeeRate": 15.0,
  "assignments": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174003",
      "role": "primary_lawyer"
    },
    {
      "userId": "123e4567-e89b-12d3-a456-426614174007",
      "role": "clerk"
    }
  ]
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174008",
    "caseNumber": "2024-002",
    "title": "鈴木花子 対 田中商事 売掛金請求事件",
    "currentStatus": {
      "code": "accepted",
      "name": "受任"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 案件更新
```
PUT /cases/{caseId}
Content-Type: application/json

{
  "title": "鈴木花子 対 田中商事株式会社 売掛金請求事件",
  "opponentAttorney": "高橋法律事務所",
  "courtName": "東京簡易裁判所",
  "caseCourtNumber": "令和6年(ハ)第456号",
  "summary": "売掛金500万円の支払いを求める事件。被告は支払い義務を争っている。",
  "internalNotes": "次回期日で和解の可能性あり"
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174008",
    "caseNumber": "2024-002",
    "title": "鈴木花子 対 田中商事株式会社 売掛金請求事件",
    "updatedAt": "2024-01-20T14:00:00Z"
  }
}
```

#### 案件ステータス変更
```
PUT /cases/{caseId}/status
Content-Type: application/json

{
  "statusCode": "in_progress",
  "reason": "訴状提出完了",
  "notes": "第1回口頭弁論期日は2月15日"
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174008",
    "currentStatus": {
      "code": "in_progress",
      "name": "進行中"
    },
    "statusChangedAt": "2024-01-20T14:30:00Z"
  }
}
```

#### 案件削除（論理削除）
```
DELETE /cases/{caseId}

Response:
204 No Content
```

### 4.2 タスク管理 (Tasks)

#### タスク一覧取得
```
GET /cases/{caseId}/tasks

Query Parameters:
- status: string (todo|in_progress|done|cancelled)
- assigneeId: uuid
- priority: string (high|medium|low)
- dueDateFrom: date
- dueDateTo: date

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "title": "訴状作成",
      "description": "損害賠償請求の訴状を作成する",
      "assignee": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "name": "田中弁護士"
      },
      "priority": "high",
      "status": "in_progress",
      "dueDate": "2024-01-25",
      "estimatedHours": 8.0,
      "actualHours": 3.5,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T14:00:00Z"
    }
  ]
}
```

#### タスク作成
```
POST /cases/{caseId}/tasks
Content-Type: application/json

{
  "title": "証拠収集",
  "description": "契約書および関連メールの収集",
  "assigneeId": "123e4567-e89b-12d3-a456-426614174007",
  "priority": "medium",
  "dueDate": "2024-01-30",
  "estimatedHours": 4.0
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174010",
    "title": "証拠収集",
    "status": "todo",
    "createdAt": "2024-01-20T15:00:00Z"
  }
}
```

#### タスク更新
```
PUT /tasks/{taskId}
Content-Type: application/json

{
  "status": "done",
  "actualHours": 4.5,
  "completedDate": "2024-01-25T17:00:00Z"
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174010",
    "status": "done",
    "completedDate": "2024-01-25T17:00:00Z",
    "updatedAt": "2024-01-25T17:00:00Z"
  }
}
```

### 4.3 書類管理 (Documents)

#### 書類一覧取得
```
GET /cases/{caseId}/documents

Query Parameters:
- documentType: string (court|contract|evidence|memo|other)
- search: string (ファイル名、タイトルで検索)
- tags: array (タグでフィルター)

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174011",
      "documentNumber": "DOC-2024-001-001",
      "title": "訴状",
      "documentType": "court",
      "fileName": "訴状_20240120.pdf",
      "fileSize": 245760,
      "mimeType": "application/pdf",
      "documentDate": "2024-01-20",
      "isConfidential": false,
      "tags": ["訴状", "提出済み"],
      "createdAt": "2024-01-20T10:00:00Z",
      "createdBy": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "name": "田中弁護士"
      }
    }
  ]
}
```

#### 書類アップロード
```
POST /cases/{caseId}/documents
Content-Type: multipart/form-data

Form Data:
- file: (binary)
- title: "答弁書"
- documentType: "court"
- documentDate: "2024-01-25"
- isConfidential: false
- description: "被告から提出された答弁書"
- tags: ["答弁書", "被告"]

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174012",
    "documentNumber": "DOC-2024-001-002",
    "title": "答弁書",
    "fileName": "答弁書_20240125.pdf",
    "fileSize": 189440,
    "createdAt": "2024-01-25T14:00:00Z"
  }
}
```

#### 書類ダウンロード
```
GET /documents/{documentId}/download

Response:
Binary file data
Headers:
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="訴状_20240120.pdf"
```

### 4.4 コミュニケーション管理 (Communications)

#### コミュニケーション履歴取得
```
GET /cases/{caseId}/communications

Query Parameters:
- type: string (email|phone|meeting|letter|fax)
- direction: string (inbound|outbound)
- fromDate: datetime
- toDate: datetime

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174013",
      "communicationType": "phone",
      "direction": "inbound",
      "subject": "和解提案について",
      "summary": "相手方代理人より和解の提案。300万円での解決を希望。",
      "occurredAt": "2024-01-25T14:30:00Z",
      "durationMinutes": 15,
      "participants": ["田中弁護士", "相手方代理人（高橋弁護士）"],
      "createdBy": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "name": "田中弁護士"
      }
    }
  ]
}
```

#### コミュニケーション記録作成
```
POST /cases/{caseId}/communications
Content-Type: application/json

{
  "communicationType": "meeting",
  "direction": "outbound",
  "subject": "依頼者との打ち合わせ",
  "summary": "今後の方針について協議。和解も視野に入れることで合意。",
  "occurredAt": "2024-01-26T10:00:00Z",
  "durationMinutes": 60,
  "participants": ["田中弁護士", "山田太郎（依頼者）"]
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174014",
    "createdAt": "2024-01-26T11:00:00Z"
  }
}
```

### 4.5 請求・支払管理 (Invoices & Payments)

#### 請求書一覧取得
```
GET /invoices

Query Parameters:
- caseId: uuid
- clientId: uuid
- status: string (draft|sent|paid|overdue|cancelled)
- fromDate: date
- toDate: date

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174015",
      "invoiceNumber": "INV-2024-001",
      "case": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "caseNumber": "2024-001",
        "title": "山田太郎 対 株式会社ABC 損害賠償請求事件"
      },
      "client": {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "name": "山田太郎"
      },
      "invoiceType": "retainer",
      "issueDate": "2024-01-15",
      "dueDate": "2024-02-15",
      "totalAmount": 330000,
      "status": "sent",
      "paidAmount": 0
    }
  ]
}
```

#### 請求書作成
```
POST /invoices
Content-Type: application/json

{
  "caseId": "123e4567-e89b-12d3-a456-426614174000",
  "clientId": "123e4567-e89b-12d3-a456-426614174002",
  "invoiceType": "retainer",
  "issueDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "items": [
    {
      "itemType": "fee",
      "description": "着手金",
      "quantity": 1,
      "unitPrice": 300000,
      "taxRate": 10.0
    }
  ],
  "notes": "振込手数料はご負担ください"
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174015",
    "invoiceNumber": "INV-2024-001",
    "subtotal": 300000,
    "taxAmount": 30000,
    "totalAmount": 330000,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 支払記録
```
POST /invoices/{invoiceId}/payments
Content-Type: application/json

{
  "paymentDate": "2024-02-01",
  "amount": 330000,
  "paymentMethod": "bank_transfer",
  "referenceNumber": "20240201-001",
  "notes": "全額入金確認"
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174016",
    "createdAt": "2024-02-01T14:00:00Z"
  }
}
```

### 4.6 ユーザー管理 (Users)

#### ユーザー一覧取得
```
GET /users

Query Parameters:
- role: string (admin|lawyer|clerk)
- isActive: boolean
- search: string (名前、メールアドレスで検索)

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "email": "tanaka@law-firm.com",
      "name": "田中太郎",
      "nameKana": "タナカタロウ",
      "role": "lawyer",
      "isActive": true,
      "lastLoginAt": "2024-01-26T09:00:00Z"
    }
  ]
}
```

#### ユーザー作成
```
POST /users
Content-Type: application/json

{
  "email": "suzuki@law-firm.com",
  "password": "SecurePassword123!",
  "name": "鈴木花子",
  "nameKana": "スズキハナコ",
  "role": "clerk",
  "phone": "03-9876-5432"
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174017",
    "email": "suzuki@law-firm.com",
    "name": "鈴木花子",
    "role": "clerk",
    "createdAt": "2024-01-26T10:00:00Z"
  }
}
```

### 4.7 マスターデータ (Master Data)

#### 案件種別一覧
```
GET /master/case-types

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "code": "civil_damages",
      "name": "損害賠償",
      "category": "civil",
      "displayOrder": 2
    }
  ]
}
```

#### ステータス定義一覧
```
GET /master/status-definitions

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174018",
      "code": "in_progress",
      "name": "進行中",
      "category": "progress",
      "color": "#green",
      "displayOrder": 4
    }
  ]
}
```

## 5. WebSocket API

### 5.1 接続
```
ws://api.aster-management.com/ws?token=<access_token>
```

### 5.2 イベント

#### 案件更新通知
```json
{
  "type": "case.updated",
  "data": {
    "caseId": "123e4567-e89b-12d3-a456-426614174000",
    "updatedFields": ["status", "internalNotes"],
    "updatedBy": {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "name": "田中弁護士"
    },
    "updatedAt": "2024-01-26T10:00:00Z"
  }
}
```

#### タスク完了通知
```json
{
  "type": "task.completed",
  "data": {
    "taskId": "123e4567-e89b-12d3-a456-426614174009",
    "caseId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "訴状作成",
    "completedBy": {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "name": "田中弁護士"
    },
    "completedAt": "2024-01-25T17:00:00Z"
  }
}
```

## 6. レート制限

### 6.1 制限値
- 認証エンドポイント: 5リクエスト/分
- 一般API: 100リクエスト/分
- ファイルアップロード: 10リクエスト/分

### 6.2 レスポンスヘッダー
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706236800
```

### 6.3 制限超過時のレスポンス
```
429 Too Many Requests

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "レート制限を超過しました。しばらく待ってから再試行してください。",
    "retryAfter": 60
  }
}
```

## 7. 開発者向けツール

### 7.1 Sandbox環境
- **URL**: https://sandbox-api.aster-management.com/api/v1
- **特徴**: テストデータで自由に操作可能
- **制限**: データは毎日リセット

### 7.2 APIドキュメント
- **Swagger UI**: https://api.aster-management.com/swagger
- **OpenAPI仕様**: https://api.aster-management.com/openapi.json

### 7.3 Postmanコレクション
- https://api.aster-management.com/postman-collection.json

## 8. 変更履歴

### v1.0.0 (2024-01-01)
- 初回リリース
- 基本的なCRUD操作
- 認証・認可機能
- 案件管理、タスク管理、書類管理、請求管理