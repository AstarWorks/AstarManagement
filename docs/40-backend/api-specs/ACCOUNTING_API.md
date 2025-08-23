# 会計機能API仕様

## 概要

預り金管理、売掛金管理、月次レポート出力を中心とした会計機能のAPI仕様。

## API仕様

### 1. 預り金管理

#### 1.1 預り金取引作成
```
POST /api/deposits
```

##### リクエスト
```json
{
  "projectId": "project_001",
  "transactionDate": "2024-01-20",
  "transactionType": "received",  // received / used / refunded
  "amount": 100000,
  "description": "訴訟費用預り金",
  "relatedExpenseId": null  // 使用時は実費IDを指定
}
```

##### レスポンス
```json
{
  "data": {
    "id": "deposit_001",
    "projectId": "project_001",
    "caseNumber": "2024-01-001",
    "transactionDate": "2024-01-20",
    "transactionType": "received",
    "amount": 100000,
    "balance": 100000,  // 自動計算された残高
    "description": "訴訟費用預り金",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

#### 1.2 預り金残高一覧
```
GET /api/deposits/balances
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| projectId | string | No | 案件IDでフィルタ |
| hasBalance | boolean | No | 残高ありのみ表示 |
| isNegative | boolean | No | マイナス残高のみ表示 |

##### レスポンス
```json
{
  "data": [
    {
      "projectId": "project_001",
      "caseNumber": "2024-01-001",
      "caseTitle": "〇〇商事 vs △△工業",
      "clientName": "〇〇商事株式会社",
      "totalReceived": 100000,
      "totalUsed": 35000,
      "balance": 65000,
      "lastTransactionDate": "2024-01-25",
      "isNegative": false
    },
    {
      "projectId": "project_002",
      "caseNumber": "2024-01-002",
      "caseTitle": "労働審判事件",
      "clientName": "山田太郎",
      "totalReceived": 50000,
      "totalUsed": 55000,
      "balance": -5000,
      "lastTransactionDate": "2024-01-26",
      "isNegative": true
    }
  ],
  "summary": {
    "totalBalance": 60000,
    "positiveCount": 5,
    "negativeCount": 1,
    "negativeAmount": -5000
  }
}
```

#### 1.3 預り金取引履歴
```
GET /api/cases/{projectId}/deposits
```

##### レスポンス
```json
{
  "data": [
    {
      "id": "deposit_001",
      "transactionDate": "2024-01-20",
      "transactionType": "received",
      "transactionTypeLabel": "受領",
      "amount": 100000,
      "balance": 100000,
      "description": "訴訟費用預り金"
    },
    {
      "id": "deposit_002",
      "transactionDate": "2024-01-22",
      "transactionType": "used",
      "transactionTypeLabel": "使用",
      "amount": -30000,
      "balance": 70000,
      "description": "収入印紙代",
      "relatedExpense": {
        "id": "expense_001",
        "description": "収入印紙代"
      }
    }
  ]
}
```

### 2. 売掛金管理

#### 2.1 売掛金一覧
```
GET /api/receivables
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| status | string | No | pending / overdue / paid |
| clientId | string | No | クライアントID |
| daysOverdue | integer | No | 遅延日数以上 |

##### レスポンス
```json
{
  "data": [
    {
      "id": "receivable_001",
      "invoiceNumber": "2024-001",
      "caseNumber": "2024-01-001",
      "caseTitle": "〇〇商事 vs △△工業",
      "clientName": "〇〇商事株式会社",
      "invoiceDate": "2024-01-15",
      "dueDate": "2024-02-15",
      "totalAmount": 550000,
      "paidAmount": 0,
      "unpaidAmount": 550000,
      "daysOverdue": 0,
      "status": "pending",
      "statusLabel": "未入金"
    }
  ],
  "summary": {
    "totalReceivable": 2500000,
    "totalOverdue": 500000,
    "overdueCount": 3,
    "collectionRate": 85.5
  }
}
```

#### 2.2 売掛金詳細
```
GET /api/receivables/{id}
```

##### レスポンス
```json
{
  "data": {
    "id": "receivable_001",
    "invoice": {
      "invoiceNumber": "2024-001",
      "issueDate": "2024-01-15",
      "items": [
        {
          "description": "着手金",
          "amount": 500000,
          "withholdingAmount": 51050
        }
      ]
    },
    "payments": [
      {
        "id": "payment_001",
        "paymentDate": "2024-02-10",
        "amount": 200000,
        "method": "bank_transfer"
      }
    ],
    "reminders": [
      {
        "sentDate": "2024-02-20",
        "method": "email",
        "note": "支払期限を過ぎております"
      }
    ]
  }
}
```

### 3. 月次レポート

#### 3.1 月次収支レポート生成
```
POST /api/reports/monthly
```

##### リクエスト
```json
{
  "year": 2024,
  "month": 1,
  "includeDetails": true,
  "groupBy": ["lawyer", "accountCode"],
  "format": "excel"
}
```

##### レスポンス
```json
{
  "data": {
    "reportId": "report_001",
    "period": {
      "year": 2024,
      "month": 1
    },
    "summary": {
      "income": {
        "gross": 5000000,
        "withholding": 510500,
        "net": 4489500
      },
      "expense": {
        "total": 1500000,
        "office": 800000,
        "personal": 200000,
        "case": 500000
      },
      "netProfit": 2989500
    },
    "downloadUrl": "/api/reports/report_001/download",
    "expiresAt": "2024-01-21T10:00:00Z"
  }
}
```

#### 3.2 レポートダウンロード
```
GET /api/reports/{reportId}/download
```

##### レスポンス
- Excel ファイル（.xlsx）
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

### 4. 集計・分析

#### 4.1 キャッシュフロー取得
```
GET /api/accounting/cashflow
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| period | string | Yes | daily / weekly / monthly |
| startDate | date | Yes | 開始日 |
| endDate | date | Yes | 終了日 |

##### レスポンス
```json
{
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "opening": 1000000,
    "income": {
      "collected": 3000000,
      "deposits": 500000,
      "total": 3500000
    },
    "expense": {
      "paid": 1200000,
      "depositUsed": 200000,
      "total": 1400000
    },
    "closing": 3100000,
    "timeline": [
      {
        "date": "2024-01-01",
        "income": 0,
        "expense": 50000,
        "balance": 950000
      }
    ]
  }
}
```

#### 4.2 勘定科目別集計
```
GET /api/accounting/summary-by-account
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| year | integer | Yes | 対象年 |
| month | integer | No | 対象月 |
| expenseType | string | No | office / personal / case |

##### レスポンス
```json
{
  "data": [
    {
      "accountCode": "travel_expense",
      "accountName": "旅費交通費",
      "amount": 250000,
      "percentage": 16.7,
      "count": 45,
      "breakdown": {
        "office": 50000,
        "personal": 80000,
        "case": 120000
      }
    }
  ]
}
```

### 5. 警告・通知

#### 5.1 会計アラート取得
```
GET /api/accounting/alerts
```

##### レスポンス
```json
{
  "data": [
    {
      "id": "alert_001",
      "type": "negative_deposit",
      "severity": "high",
      "caseNumber": "2024-01-002",
      "message": "預り金残高がマイナスです（-5,000円）",
      "amount": -5000,
      "createdAt": "2024-01-26T10:00:00Z"
    },
    {
      "id": "alert_002",
      "type": "overdue_receivable",
      "severity": "medium",
      "invoiceNumber": "2024-003",
      "message": "支払期限を30日超過しています",
      "daysOverdue": 30,
      "amount": 300000
    }
  ]
}
```

## Excel出力フォーマット

### シート1: サマリー
```
2024年1月 月次収支報告書

【収入の部】
報酬収入（総額）        5,000,000
源泉徴収税            △510,500
手取収入              4,489,500

【支出の部】
事務所経費              800,000
個人経費               200,000
案件実費               500,000
支出合計             1,500,000

【収支】
当月収支              2,989,500
```

### シート2: 収入明細
```
日付    案件番号    クライアント名    内容        総額        源泉徴収    手取額
1/15   2024-001   〇〇商事        着手金      500,000     51,050    448,950
```

### シート3: 支出明細
```
日付    種別      勘定科目    内容            金額
1/10   事務所    家賃       1月分家賃      200,000
1/12   案件実費   交通費     東京地裁交通費    1,200
```

### シート4: 預り金
```
案件番号    案件名              受領額      使用額     残高
2024-001   〇〇商事vs△△工業   100,000     35,000    65,000
```

## 権限

- `accounting.read` - 会計情報の閲覧
- `accounting.export` - レポートのエクスポート
- `deposit.manage` - 預り金の管理
- `receivable.manage` - 売掛金の管理