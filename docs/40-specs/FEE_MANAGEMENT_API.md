# 報酬管理機能API仕様

## 概要

弁護士の報酬管理、実費記録、経費管理を行うAPI。事務所全体、弁護士個人、案件ごとの経費を明確に区分して管理します。

## API仕様

### 1. 経費入力・管理

#### 1.1 経費作成（統一エンドポイント）
```
POST /api/expenses
```

##### リクエスト
```json
{
  "expenseType": "case",  // office / personal / case
  "caseId": "case_001",   // 案件実費の場合は必須
  "date": "2024-01-20",
  "amount": 1200,
  "accountCode": "travel_expense",
  "description": "東京地裁へのタクシー代",
  "paymentMethod": "cash",
  "hasWithholding": false,
  "taxRate": 10,
  "receiptPhoto": "base64_encoded_image"  // または別途アップロードAPI
}
```

##### レスポンス
```json
{
  "data": {
    "id": "expense_001",
    "expenseType": "case",
    "caseId": "case_001",
    "caseNumber": "2024-01-001",
    "lawyerId": "user_001",
    "date": "2024-01-20",
    "amount": 1200,
    "accountCode": "travel_expense",
    "accountName": "旅費交通費",
    "description": "東京地裁へのタクシー代",
    "receiptUrl": "https://...",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

#### 1.2 経費一覧取得（フィルタリング対応）
```
GET /api/expenses
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| view | string | No | all / office / lawyer / case |
| lawyerId | string | No | 弁護士IDでフィルタ |
| caseId | string | No | 案件IDでフィルタ |
| dateFrom | date | No | 開始日 |
| dateTo | date | No | 終了日 |
| accountCode | string | No | 勘定科目でフィルタ |
| page | integer | No | ページ番号 |
| perPage | integer | No | 1ページあたりの件数 |

##### レスポンス
```json
{
  "data": [
    {
      "id": "expense_001",
      "expenseType": "case",
      "expenseTypeLabel": "案件実費",
      "caseId": "case_001",
      "caseNumber": "2024-01-001",
      "caseTitle": "〇〇商事 vs △△工業",
      "lawyerId": "user_001",
      "lawyerName": "山田太郎",
      "date": "2024-01-20",
      "amount": 1200,
      "accountCode": "travel_expense",
      "accountName": "旅費交通費",
      "description": "東京地裁へのタクシー代",
      "hasReceipt": true,
      "hasWithholding": false
    },
    {
      "id": "expense_002",
      "expenseType": "office",
      "expenseTypeLabel": "事務所経費",
      "date": "2024-01-20",
      "amount": 5000,
      "accountCode": "office_supplies",
      "accountName": "消耗品費",
      "description": "コピー用紙",
      "hasReceipt": true
    }
  ],
  "summary": {
    "totalAmount": 156000,
    "byType": {
      "office": 50000,
      "personal": 20000,
      "case": 86000
    },
    "byAccountCode": {
      "travel_expense": 35000,
      "office_supplies": 15000,
      "communication": 8000
    }
  },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150
  }
}
```

#### 1.3 経費集計
```
GET /api/expenses/summary
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| period | string | Yes | month / quarter / year |
| year | integer | Yes | 対象年 |
| month | integer | No | 対象月（period=monthの場合） |
| groupBy | string | No | type / lawyer / case / account |

##### レスポンス
```json
{
  "data": {
    "period": {
      "year": 2024,
      "month": 1
    },
    "summary": {
      "income": {
        "total": 5000000,
        "withholding": 500000,
        "net": 4500000
      },
      "expense": {
        "total": 1500000,
        "byType": {
          "office": 800000,
          "personal": 200000,
          "case": 500000
        }
      }
    },
    "details": {
      "byLawyer": [
        {
          "lawyerId": "user_001",
          "lawyerName": "山田太郎",
          "income": 3000000,
          "expense": 600000,
          "personalExpense": 100000,
          "caseExpense": 300000
        }
      ],
      "byAccountCode": [
        {
          "code": "travel_expense",
          "name": "旅費交通費",
          "amount": 250000,
          "percentage": 16.7
        }
      ]
    }
  }
}
```

### 2. 勘定科目管理

#### 2.1 勘定科目一覧
```
GET /api/account-codes
```

##### レスポンス
```json
{
  "data": [
    {
      "id": "ac_001",
      "code": "sales",
      "name": "売上高（報酬）",
      "category": "income",
      "isDefault": true,
      "displayOrder": 1
    },
    {
      "id": "ac_002",
      "code": "travel_expense",
      "name": "旅費交通費",
      "category": "expense",
      "isDefault": true,
      "displayOrder": 10
    },
    {
      "id": "ac_custom_001",
      "code": "expert_fee",
      "name": "鑑定料",
      "category": "expense",
      "isDefault": false,
      "displayOrder": 50
    }
  ]
}
```

#### 2.2 勘定科目作成
```
POST /api/account-codes
```

##### リクエスト
```json
{
  "code": "expert_fee",
  "name": "鑑定料",
  "category": "expense"
}
```

### 3. 報酬設定

#### 3.1 案件の報酬設定取得
```
GET /api/cases/{caseId}/fee-settings
```

##### レスポンス
```json
{
  "data": {
    "caseId": "case_001",
    "retainerFee": 500000,
    "retainerWithholding": true,
    "retainerPaidDate": "2024-01-15",
    "successFeeType": "rate",
    "successFeeRate": 10,
    "successFeeMinimum": 300000,
    "successWithholding": true,
    "hourlyRate": 20000,
    "hourlyUnit": 30,
    "expenseMarkup": 0
  }
}
```

#### 3.2 報酬設定更新
```
PUT /api/cases/{caseId}/fee-settings
```

### 4. 請求書管理

#### 4.1 見積書作成
```
POST /api/cases/{caseId}/estimates
```

##### リクエスト
```json
{
  "items": [
    {
      "type": "retainer",
      "description": "着手金",
      "amount": 500000,
      "hasWithholding": true
    },
    {
      "type": "success_fee",
      "description": "成功報酬（見込み）",
      "amount": 1000000,
      "hasWithholding": true,
      "note": "経済的利益の10%"
    },
    {
      "type": "expense",
      "description": "実費（概算）",
      "amount": 50000,
      "hasWithholding": false
    }
  ],
  "validUntil": "2024-02-20",
  "notes": "実費は実額精算となります"
}
```

#### 4.2 請求書作成
```
POST /api/cases/{caseId}/invoices
```

##### リクエスト
```json
{
  "issueDate": "2024-01-20",
  "dueDate": "2024-02-20",
  "items": [
    {
      "type": "retainer",
      "description": "着手金",
      "amount": 500000,
      "hasWithholding": true,
      "withholdingAmount": 51050
    },
    {
      "type": "expense",
      "description": "実費",
      "amount": 23500,
      "hasWithholding": false,
      "expenseIds": ["expense_001", "expense_002", "expense_003"]
    }
  ],
  "bankAccount": {
    "bankName": "〇〇銀行",
    "branchName": "△△支店",
    "accountType": "普通",
    "accountNumber": "1234567",
    "accountHolder": "〇〇法律事務所"
  }
}
```

##### レスポンス
```json
{
  "data": {
    "id": "invoice_001",
    "invoiceNumber": "2024-001",
    "caseId": "case_001",
    "issueDate": "2024-01-20",
    "dueDate": "2024-02-20",
    "subtotal": 523500,
    "taxAmount": 52350,
    "withholdingAmount": 51050,
    "totalAmount": 524800,
    "status": "draft",
    "pdfUrl": null
  }
}
```

#### 4.3 請求書PDF生成
```
POST /api/invoices/{invoiceId}/generate-pdf
```

### 5. レポート出力

#### 5.1 月次レポートエクスポート
```
POST /api/reports/monthly-export
```

##### リクエスト
```json
{
  "year": 2024,
  "month": 1,
  "format": "csv",  // csv / excel
  "includeReceipts": false,
  "groupBy": "accountCode"
}
```

##### レスポンス
```json
{
  "data": {
    "exportId": "export_001",
    "status": "processing",
    "format": "csv",
    "estimatedSize": "150KB"
  }
}
```

#### 5.2 源泉徴収一覧
```
GET /api/reports/withholding
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| year | integer | Yes | 対象年 |
| month | integer | No | 対象月 |

##### レスポンス
```json
{
  "data": [
    {
      "date": "2024-01-15",
      "clientName": "〇〇商事株式会社",
      "caseNumber": "2024-01-001",
      "invoiceNumber": "2024-001",
      "grossAmount": 500000,
      "withholdingAmount": 51050,
      "netAmount": 448950,
      "type": "着手金"
    }
  ],
  "summary": {
    "totalGross": 3000000,
    "totalWithholding": 306300,
    "totalNet": 2693700
  }
}
```

### 6. 領収書アップロード

#### 6.1 領収書画像アップロード
```
POST /api/expenses/{expenseId}/receipt
```

##### リクエスト（multipart/form-data）
```
file: (binary) 最大5MB
```

##### レスポンス
```json
{
  "data": {
    "receiptUrl": "https://storage.../receipts/expense_001_receipt.jpg",
    "fileSize": 1234567,
    "uploadedAt": "2024-01-20T10:00:00Z"
  }
}
```

### 7. 入金管理

#### 7.1 入金記録
```
POST /api/invoices/{invoiceId}/payments
```

##### リクエスト
```json
{
  "paymentDate": "2024-02-15",
  "amount": 524800,
  "method": "bank_transfer",
  "memo": "振込人名：カ）マルマルショウジ"
}
```

##### レスポンス
```json
{
  "data": {
    "id": "payment_001",
    "invoiceId": "invoice_001",
    "paymentDate": "2024-02-15",
    "amount": 524800,
    "method": "bank_transfer",
    "status": "completed",
    "invoiceStatus": "paid"
  }
}
```

#### 7.2 入金一覧
```
GET /api/payments
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| status | string | No | pending / completed |
| dateFrom | date | No | 入金日開始 |
| dateTo | date | No | 入金日終了 |
| caseId | string | No | 案件ID |

### 8. クイック入力

#### 8.1 クイック入力テンプレート一覧
```
GET /api/expense-templates
```

##### レスポンス
```json
{
  "data": [
    {
      "id": "template_001",
      "name": "東京地裁タクシー",
      "icon": "🚕",
      "amount": 1200,
      "accountCode": "travel_expense",
      "description": "東京地裁へのタクシー代",
      "usageCount": 45,
      "lastUsedAt": "2024-01-19T15:00:00Z"
    },
    {
      "id": "template_002",
      "name": "収入印紙",
      "icon": "📮",
      "amount": 10000,
      "accountCode": "tax_stamp",
      "description": "収入印紙代",
      "usageCount": 23
    }
  ]
}
```

#### 8.2 クイック入力テンプレート作成
```
POST /api/expense-templates
```

##### リクエスト
```json
{
  "name": "コピー代",
  "icon": "📄",
  "amount": 500,
  "accountCode": "office_supplies",
  "description": "コピー代"
}
```

#### 8.3 テンプレートから経費作成
```
POST /api/expenses/from-template
```

##### リクエスト
```json
{
  "templateId": "template_001",
  "caseId": "case_001",
  "date": "2024-01-20",
  "amount": 1500  // テンプレートの金額を上書き可能
}
```

## 権限

- `expense.create` - 経費の作成
- `expense.read` - 経費の閲覧
- `expense.update` - 経費の更新
- `expense.delete` - 経費の削除
- `expense.export` - 経費データのエクスポート
- `invoice.create` - 請求書の作成
- `invoice.read` - 請求書の閲覧
- `invoice.manage` - 請求書の管理（番号編集など）
- `payment.create` - 入金記録の作成
- `payment.read` - 入金記録の閲覧
- `account.manage` - 勘定科目の管理

### スコープによる制限

- 事務所経費：`expense.*:office` - 管理者のみ
- 個人経費：`expense.*:personal` - 本人のみ
- 案件実費：`expense.*:case` - 案件担当者のみ