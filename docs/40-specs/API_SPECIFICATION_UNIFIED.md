# 統一API仕様書

## 概要

Aster Management システムの統一されたREST API仕様。すべてのエンドポイントはRESTfulな設計原則に従い、一貫性のある命名規則とレスポンス形式を採用します。

## 基本仕様

### ベースURL
```
https://api.{tenant}.astermanagement.com/api/v1
```

### 認証
```
Authorization: Bearer {jwt_token}
```

### 共通ヘッダー
```
Content-Type: application/json
Accept: application/json
X-Tenant-ID: {tenant_id}
```

### 標準レスポンス形式

#### 成功レスポンス
```json
{
  "data": {
    // リソースデータ
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00Z",
    "version": "1.0"
  }
}
```

#### エラーレスポンス
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたリソースが見つかりません",
    "details": {
      "resource": "case",
      "id": "case_001"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00Z",
    "requestId": "req_123"
  }
}
```

### ページネーション

すべてのリスト系エンドポイントで統一されたページネーションパラメータを使用：

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| page | integer | 1 | ページ番号 |
| perPage | integer | 20 | 1ページあたりの件数（最大100） |
| sort | string | -createdAt | ソート順（フィールド名:asc/desc） |

レスポンスには以下のメタ情報を含む：
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## API エンドポイント一覧

### 1. 認証・セッション管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| POST | /sessions | ログイン（セッション作成） | - |
| DELETE | /sessions | ログアウト（セッション削除） | - |
| POST | /sessions/refresh | トークンリフレッシュ | - |
| POST | /users/password-reset | パスワードリセット要求 | - |
| PUT | /users/password | パスワード変更 | - |

### 2. ユーザー管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /users | ユーザー一覧 | user.read |
| GET | /users/{userId} | ユーザー詳細 | user.read |
| POST | /users | ユーザー作成 | user.create |
| PUT | /users/{userId} | ユーザー更新（完全） | user.update |
| PATCH | /users/{userId} | ユーザー更新（部分） | user.update |
| DELETE | /users/{userId} | ユーザー削除（論理） | user.delete |
| GET | /users/me | 自分の情報取得 | - |
| PATCH | /users/me | 自分の情報更新 | - |

### 3. 案件管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /cases | 案件一覧 | case.read |
| GET | /cases/{caseId} | 案件詳細 | case.read |
| POST | /cases | 案件作成 | case.create |
| PUT | /cases/{caseId} | 案件更新（完全） | case.update |
| PATCH | /cases/{caseId} | 案件更新（部分） | case.update |
| DELETE | /cases/{caseId} | 案件削除（論理） | case.delete |
| POST | /cases/bulk | 案件一括作成 | case.create |
| PATCH | /cases/bulk | 案件一括更新 | case.update |

#### 案件関連リソース

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /cases/{caseId}/timeline | タイムライン取得 | case.read |
| GET | /cases/{caseId}/tasks | タスク一覧 | task.read |
| POST | /cases/{caseId}/tasks | タスク作成 | task.create |
| GET | /cases/{caseId}/documents | 書類一覧 | document.read |
| POST | /cases/{caseId}/documents | 書類作成 | document.create |
| GET | /cases/{caseId}/communications | 連絡履歴 | communication.read |
| POST | /cases/{caseId}/communications | 連絡記録作成 | communication.create |
| GET | /cases/{caseId}/expenses | 実費一覧 | expense.read |
| POST | /cases/{caseId}/expenses | 実費記録 | expense.create |
| GET | /cases/{caseId}/invoices | 請求書一覧 | invoice.read |
| POST | /cases/{caseId}/invoices | 請求書作成 | invoice.create |
| GET | /cases/{caseId}/deposits | 預り金履歴 | deposit.read |
| POST | /cases/{caseId}/deposits | 預り金記録 | deposit.create |

### 4. クライアント管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /clients | クライアント一覧 | client.read |
| GET | /clients/{clientId} | クライアント詳細 | client.read |
| POST | /clients | クライアント作成 | client.create |
| PUT | /clients/{clientId} | クライアント更新 | client.update |
| DELETE | /clients/{clientId} | クライアント削除 | client.delete |
| GET | /clients/{clientId}/cases | クライアントの案件一覧 | case.read |

### 5. タグ管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /tags | タグ一覧 | tag.read |
| GET | /tags/{tagId} | タグ詳細 | tag.read |
| POST | /tags | タグ作成 | tag.create |
| PATCH | /tags/{tagId} | タグ更新 | tag.update |
| DELETE | /tags/{tagId} | タグ削除 | tag.delete |
| GET | /tag-categories | カテゴリー一覧 | tag.read |
| POST | /tag-categories | カテゴリー作成 | tag.manage |
| PUT | /tag-categories/{categoryId} | カテゴリー更新 | tag.manage |
| DELETE | /tag-categories/{categoryId} | カテゴリー削除 | tag.manage |
| PATCH | /tag-categories/{categoryId}/order | カテゴリー順序変更 | tag.manage |

### 6. タスク管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /tasks | タスク一覧 | task.read |
| GET | /tasks/{taskId} | タスク詳細 | task.read |
| POST | /tasks | タスク作成 | task.create |
| PATCH | /tasks/{taskId} | タスク更新 | task.update |
| DELETE | /tasks/{taskId} | タスク削除 | task.delete |
| POST | /tasks/{taskId}/complete | タスク完了 | task.update |
| POST | /tasks/{taskId}/reopen | タスク再開 | task.update |

### 7. 書類管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /documents | 書類一覧 | document.read |
| GET | /documents/{documentId} | 書類詳細 | document.read |
| POST | /documents | 書類作成 | document.create |
| PUT | /documents/{documentId} | 書類更新 | document.update |
| DELETE | /documents/{documentId} | 書類削除 | document.delete |
| GET | /documents/{documentId}/versions | バージョン一覧 | document.read |
| GET | /documents/{documentId}/versions/{versionId} | バージョン詳細 | document.read |
| POST | /documents/{documentId}/lock | 書類ロック | document.update |
| DELETE | /documents/{documentId}/lock | ロック解除 | document.update |
| PATCH | /documents/{documentId}/autosave | 自動保存 | document.update |

### 8. 書類エクスポート

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| POST | /documents/{documentId}/exports | エクスポート作成 | document.export |
| GET | /exports/{exportId} | エクスポート状態 | - |
| GET | /exports/{exportId}/download | ファイルダウンロード | - |

### 9. テンプレート管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /templates | テンプレート一覧 | template.read |
| GET | /templates/{templateId} | テンプレート詳細 | template.read |
| POST | /templates | テンプレート作成 | template.create |
| PATCH | /templates/{templateId} | テンプレート更新 | template.update |
| DELETE | /templates/{templateId} | テンプレート削除 | template.delete |
| POST | /templates/{templateId}/duplicate | テンプレート複製 | template.create |

### 10. 報酬・請求管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /invoices | 請求書一覧 | invoice.read |
| GET | /invoices/{invoiceId} | 請求書詳細 | invoice.read |
| POST | /invoices | 請求書作成 | invoice.create |
| PATCH | /invoices/{invoiceId} | 請求書更新 | invoice.update |
| DELETE | /invoices/{invoiceId} | 請求書削除 | invoice.delete |
| POST | /invoices/{invoiceId}/send | 請求書送信 | invoice.manage |
| GET | /invoices/{invoiceId}/payments | 入金履歴 | payment.read |
| POST | /invoices/{invoiceId}/payments | 入金記録 | payment.create |

### 11. 経費管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /expenses | 経費一覧 | expense.read |
| GET | /expenses/{expenseId} | 経費詳細 | expense.read |
| POST | /expenses | 経費記録 | expense.create |
| PATCH | /expenses/{expenseId} | 経費更新 | expense.update |
| DELETE | /expenses/{expenseId} | 経費削除 | expense.delete |
| POST | /expenses/{expenseId}/receipt | 領収書アップロード | expense.update |
| GET | /expense-templates | 経費テンプレート一覧 | expense.read |
| POST | /expense-templates | テンプレート作成 | expense.create |
| PUT | /expense-templates/{templateId} | テンプレート更新 | expense.update |
| DELETE | /expense-templates/{templateId} | テンプレート削除 | expense.delete |

### 12. 会計管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /deposits | 預り金一覧 | deposit.read |
| GET | /deposits/balances | 預り金残高一覧 | deposit.read |
| POST | /deposits | 預り金記録 | deposit.manage |
| GET | /receivables | 売掛金一覧 | receivable.read |
| GET | /receivables/{receivableId} | 売掛金詳細 | receivable.read |
| PATCH | /receivables/{receivableId} | 売掛金更新 | receivable.manage |
| GET | /account-codes | 勘定科目一覧 | accounting.read |
| POST | /account-codes | 勘定科目作成 | account.manage |
| PUT | /account-codes/{codeId} | 勘定科目更新 | account.manage |
| DELETE | /account-codes/{codeId} | 勘定科目削除 | account.manage |

### 13. レポート

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /reports/monthly | 月次レポート生成 | accounting.export |
| GET | /reports/cashflow | キャッシュフロー | accounting.read |
| GET | /reports/summary | 会計サマリー | accounting.read |
| GET | /reports/withholding | 源泉徴収一覧 | accounting.read |

### 14. ダッシュボード

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /dashboard | ダッシュボード取得 | - |
| PATCH | /dashboard | レイアウト更新 | - |
| GET | /dashboard/widgets | ウィジェット一覧 | - |
| POST | /dashboard/widgets | ウィジェット追加 | - |
| PATCH | /dashboard/widgets/{widgetId} | ウィジェット更新 | - |
| DELETE | /dashboard/widgets/{widgetId} | ウィジェット削除 | - |
| GET | /dashboard/statistics | 統計情報 | - |

### 15. 通知

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /notifications | 通知一覧 | - |
| GET | /notifications/{notificationId} | 通知詳細 | - |
| PATCH | /notifications/{notificationId}/read | 既読にする | - |
| POST | /notifications/mark-all-read | 全て既読にする | - |
| GET | /notifications/preferences | 通知設定取得 | - |
| PATCH | /notifications/preferences | 通知設定更新 | - |

### 16. 検索

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /search | 全文検索 | - |
| GET | /search/cases | 案件検索 | case.read |
| GET | /search/documents | 書類検索 | document.read |
| GET | /search/clients | クライアント検索 | client.read |

### 17. AIアシスタント

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| POST | /ai/chat | AIチャット送信 | ai.use |
| GET | /ai/chat/{documentId} | チャット履歴取得 | ai.use |
| POST | /ai/suggestions/{suggestionId}/apply | AI提案適用 | ai.use |

### 18. システム管理

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /system/health | ヘルスチェック | - |
| GET | /system/info | システム情報 | system.read |
| GET | /permissions | 権限一覧 | permission.read |
| GET | /roles | ロール一覧 | role.read |
| POST | /roles | ロール作成 | role.create |
| PATCH | /roles/{roleId} | ロール更新 | role.update |
| DELETE | /roles/{roleId} | ロール削除 | role.delete |

## フィルタリング

すべてのリスト系エンドポイントで統一されたフィルタリング構文を使用：

### 基本フィルタ
```
GET /api/v1/cases?status=active&clientId=client_001
```

### 高度なフィルタ
```
GET /api/v1/cases?filter[status][in]=active,pending&filter[amount][gte]=100000
```

サポートする演算子：
- `eq`: 等しい（デフォルト）
- `ne`: 等しくない
- `gt`: より大きい
- `gte`: 以上
- `lt`: より小さい
- `lte`: 以下
- `in`: 含まれる
- `nin`: 含まれない
- `like`: 部分一致
- `between`: 範囲

## バルク操作

効率的な一括処理のためのエンドポイント：

### バルク作成
```
POST /api/v1/{resource}/bulk
{
  "items": [
    { /* item 1 */ },
    { /* item 2 */ }
  ]
}
```

### バルク更新
```
PATCH /api/v1/{resource}/bulk
{
  "updates": [
    {
      "id": "resource_001",
      "data": { /* update data */ }
    }
  ]
}
```

### バルク削除
```
DELETE /api/v1/{resource}/bulk
{
  "ids": ["resource_001", "resource_002"]
}
```

## エラーコード

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | アクセス権限なし |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 422 | バリデーションエラー |
| CONFLICT | 409 | リソースの競合 |
| RATE_LIMIT | 429 | レート制限超過 |
| SERVER_ERROR | 500 | サーバーエラー |

## レート制限

- 認証済みユーザー: 1000リクエスト/時間
- 未認証ユーザー: 100リクエスト/時間
- バルク操作: 100リクエスト/時間

レスポンスヘッダー：
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1579521600
```

## バージョニング

APIバージョンはURLに含まれます：
- 現在のバージョン: v1
- サポート終了予定: 新バージョンリリース後6ヶ月

## WebSocket API

リアルタイム通信用：
```
wss://api.{tenant}.astermanagement.com/api/v1/ws
```

### イベント
- `case.updated`
- `task.created`
- `document.locked`
- `notification.received`

## 今後の拡張予定

- GraphQL API サポート
- Webhook 機能
- API キー認証
- OAuth2 プロバイダー統合