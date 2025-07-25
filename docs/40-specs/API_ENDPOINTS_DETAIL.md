# APIエンドポイント詳細設計

## 概要

このドキュメントでは、Aster ManagementシステムのREST APIエンドポイントの詳細設計を定義します。すべてのAPIはJWT認証を必要とし、Discord風のRBACによる権限制御が適用されます。

## 共通仕様

### ベースURL
```
https://api.{tenant}.astermanagement.com/v1
```

### 認証
```
Authorization: Bearer {jwt_token}
```

### レスポンス形式
```json
{
  "data": {},
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

### エラーレスポンス
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

### ページネーション
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 1. 案件管理API

### 1.1 案件一覧取得
```
GET /api/cases
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| page | integer | No | ページ番号（デフォルト: 1） |
| perPage | integer | No | 1ページあたりの件数（デフォルト: 20、最大: 100） |
| search | string | No | 検索キーワード（案件番号、タイトル、概要を部分一致検索） |
| tags | string[] | No | タグIDの配列 |
| tagMode | string | No | タグ検索モード（and/or、デフォルト: and） |
| status | string | No | ステータスタグID |
| assigneeId | string | No | 担当者ID |
| clientId | string | No | 依頼者ID |
| dateFrom | date | No | 期間開始日（ISO 8601形式） |
| dateTo | date | No | 期間終了日（ISO 8601形式） |
| sortBy | string | No | ソートフィールド（caseNumber/createdAt/updatedAt、デフォルト: caseNumber） |
| sortOrder | string | No | ソート順（asc/desc、デフォルト: desc） |

#### レスポンス
```json
{
  "data": [
    {
      "id": "case_1234567890",
      "caseNumber": {
        "year": 2024,
        "month": 1,
        "sequence": 1,
        "formatted": "2024-01-001"
      },
      "title": "〇〇商事 vs △△工業 売買代金請求事件",
      "summary": "売買契約に基づく代金支払請求",
      "tags": [
        {
          "id": "tag_status_active",
          "name": "進行中",
          "color": "#22c55e",
          "category": {
            "id": "cat_status",
            "name": "ステータス",
            "isExclusive": true
          }
        },
        {
          "id": "tag_priority_high",
          "name": "高",
          "color": "#ef4444",
          "category": {
            "id": "cat_priority",
            "name": "優先度",
            "isExclusive": true
          }
        }
      ],
      "assignees": [
        {
          "id": "user_lawyer_001",
          "name": "山田太郎",
          "role": "lawyer",
          "avatar": "https://..."
        }
      ],
      "client": {
        "id": "client_001",
        "name": "〇〇商事株式会社",
        "type": "corporation"
      },
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
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

#### 権限
- `case.read` - 基本的な案件情報の閲覧
- クライアントロールの場合は自身が関連する案件のみ表示

### 1.2 案件詳細取得
```
GET /api/cases/{caseId}
```

#### レスポンス
```json
{
  "data": {
    "id": "case_1234567890",
    "caseNumber": {
      "year": 2024,
      "month": 1,
      "sequence": 1,
      "formatted": "2024-01-001"
    },
    "title": "〇〇商事 vs △△工業 売買代金請求事件",
    "summary": "売買契約に基づく代金支払請求",
    "description": "2023年12月1日付売買契約に基づき、商品代金1,000万円の支払いを求める。",
    "tags": [],
    "assignees": [],
    "client": {},
    "opponent": {
      "name": "△△工業株式会社",
      "attorney": "相手方法律事務所"
    },
    "court": {
      "name": "東京地方裁判所",
      "department": "民事第1部"
    },
    "dates": {
      "accepted": "2024-01-15",
      "filed": "2024-01-20",
      "nextHearing": "2024-02-15"
    },
    "fees": {
      "retainer": 500000,
      "successFeeRate": 10,
      "expenses": 50000
    },
    "relatedCases": [
      {
        "id": "case_0987654321",
        "caseNumber": "2023-12-005",
        "title": "関連案件タイトル",
        "relationship": "前審"
      }
    ],
    "audit": {
      "createdBy": "user_001",
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedBy": "user_002",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  }
}
```

#### 権限
- `case.read` - 案件詳細の閲覧
- クライアントロールの場合は自身が関連する案件のみ

### 1.3 案件作成
```
POST /api/cases
```

#### リクエスト
```json
{
  "title": "〇〇商事 vs △△工業 売買代金請求事件",
  "summary": "売買契約に基づく代金支払請求",
  "description": "詳細な説明...",
  "clientId": "client_001",
  "opponentName": "△△工業株式会社",
  "courtName": "東京地方裁判所",
  "acceptedDate": "2024-01-15",
  "retainerFee": 500000,
  "successFeeRate": 10,
  "tags": ["tag_status_new", "tag_priority_high", "tag_type_civil"],
  "assignees": ["user_lawyer_001", "user_clerk_001"]
}
```

#### レスポンス
```json
{
  "data": {
    "id": "case_1234567890",
    "caseNumber": {
      "year": 2024,
      "month": 1,
      "sequence": 1,
      "formatted": "2024-01-001"
    },
    // ... 作成された案件の全情報
  }
}
```

#### 権限
- `case.create` - 案件の作成

### 1.4 案件更新
```
PATCH /api/cases/{caseId}
```

#### リクエスト（部分更新）
```json
{
  "title": "更新後のタイトル",
  "tags": ["tag_status_active", "tag_priority_medium"]
}
```

#### 権限
- `case.update` - 案件の更新
- 担当者のみ更新可能

### 1.5 案件削除
```
DELETE /api/cases/{caseId}
```

#### 権限
- `case.delete` - 案件の削除（論理削除）

### 1.6 案件ステータス変更
```
POST /api/cases/{caseId}/status
```

#### リクエスト
```json
{
  "statusTagId": "tag_status_completed",
  "reason": "和解成立により終結"
}
```

#### 権限
- `case.status.change` - ステータスの変更

## 2. タグ管理API

### 2.1 タグ一覧取得
```
GET /api/tags
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| categoryId | string | No | カテゴリーIDでフィルタ |
| search | string | No | タグ名で部分一致検索 |
| includeUsageCount | boolean | No | 使用数を含めるか（デフォルト: false） |

#### レスポンス
```json
{
  "data": [
    {
      "id": "tag_status_active",
      "name": "進行中",
      "color": "#22c55e",
      "categoryId": "cat_status",
      "category": {
        "id": "cat_status",
        "name": "ステータス",
        "isExclusive": true,
        "isRequired": true
      },
      "displayOrder": 1,
      "usageCount": 25
    }
  ]
}
```

### 2.2 タグ作成
```
POST /api/tags
```

#### リクエスト
```json
{
  "name": "新規タグ",
  "color": "#3b82f6",
  "categoryId": "cat_general"
}
```

#### 権限
- `tag.manage` - タグの管理

### 2.3 タグ更新
```
PATCH /api/tags/{tagId}
```

#### リクエスト
```json
{
  "name": "更新後の名前",
  "color": "#ef4444"
}
```

### 2.4 タグ削除
```
DELETE /api/tags/{tagId}
```

#### 権限
- `tag.manage` - タグの管理
- 使用中のタグは削除不可（400エラー）

### 2.5 タグ並び替え
```
POST /api/tag-categories/{categoryId}/reorder
```

#### リクエスト
```json
{
  "tagIds": ["tag_001", "tag_003", "tag_002"]
}
```

#### 権限
- `tag.reorder` - タグの並び替え

### 2.6 タグ使用統計
```
GET /api/tags/stats
```

#### レスポンス
```json
{
  "data": {
    "totalTags": 45,
    "totalCategories": 5,
    "tags": [
      {
        "id": "tag_status_active",
        "name": "進行中",
        "color": "#22c55e",
        "categoryName": "ステータス",
        "usageCount": 25,
        "lastUsedAt": "2024-01-20T10:00:00Z"
      }
    ]
  }
}
```

## 3. タグカテゴリー管理API

### 3.1 タグカテゴリー一覧取得
```
GET /api/tag-categories
```

#### レスポンス
```json
{
  "data": [
    {
      "id": "cat_status",
      "name": "ステータス",
      "description": "案件の進行状況",
      "isExclusive": true,
      "isRequired": true,
      "displayOrder": 1,
      "tagCount": 5
    }
  ]
}
```

### 3.2 タグカテゴリー作成
```
POST /api/tag-categories
```

#### リクエスト
```json
{
  "name": "新カテゴリー",
  "description": "カテゴリーの説明",
  "isExclusive": false,
  "isRequired": false
}
```

#### 権限
- `tag.manage` - タグの管理

## 4. 担当者管理API

### 4.1 担当者割り当て
```
POST /api/cases/{caseId}/assignees
```

#### リクエスト
```json
{
  "assigneeIds": ["user_lawyer_002", "user_clerk_002"],
  "reason": "担当変更の理由"
}
```

#### 権限
- `case.assignee.manage` - 担当者の管理

### 4.2 担当者削除
```
DELETE /api/cases/{caseId}/assignees/{userId}
```

#### リクエスト
```json
{
  "reason": "担当から外す理由"
}
```

## 5. タイムラインAPI

### 5.1 タイムライン取得
```
GET /api/cases/{caseId}/timeline
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| page | integer | No | ページ番号 |
| perPage | integer | No | 1ページあたりの件数（デフォルト: 50） |
| types | string[] | No | イベントタイプでフィルタ |

#### レスポンス
```json
{
  "data": [
    {
      "id": "event_001",
      "type": "status_change",
      "title": "ステータス変更",
      "description": "新規 → 進行中",
      "metadata": {
        "from": "tag_status_new",
        "to": "tag_status_active",
        "reason": "訴状提出完了"
      },
      "createdBy": {
        "id": "user_001",
        "name": "山田太郎"
      },
      "createdAt": "2024-01-20T10:00:00Z"
    },
    {
      "id": "event_002",
      "type": "document_added",
      "title": "書類追加",
      "description": "訴状を追加しました",
      "metadata": {
        "documentId": "doc_001",
        "documentName": "訴状.pdf"
      },
      "createdBy": {},
      "createdAt": "2024-01-20T09:00:00Z"
    }
  ]
}
```

### 5.2 タイムラインイベント追加
```
POST /api/cases/{caseId}/timeline
```

#### リクエスト
```json
{
  "type": "note",
  "title": "クライアント打ち合わせ",
  "description": "和解条件について協議。クライアントは早期解決を希望。"
}
```

## 6. 検索API

### 6.1 全文検索
```
POST /api/search
```

#### リクエスト
```json
{
  "query": "売買契約 AND (山田 OR 田中)",
  "types": ["case", "document", "memo"],
  "scopes": ["readable"],  // アクセス可能な範囲のみ検索
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "page": 1,
  "perPage": 20
}
```

#### レスポンス
```json
{
  "data": [
    {
      "type": "case",
      "id": "case_001",
      "title": "〇〇商事 vs △△工業 売買代金請求事件",
      "summary": "売買契約に基づく代金支払請求",
      "highlight": {
        "title": "〇〇商事 vs △△工業 <mark>売買</mark>代金請求事件",
        "summary": "<mark>売買契約</mark>に基づく代金支払請求"
      },
      "score": 0.95
    }
  ],
  "pagination": {},
  "aggregations": {
    "byType": {
      "case": 15,
      "document": 23,
      "memo": 8
    }
  }
}
```

#### 権限
- 検索結果は閲覧権限がある項目のみ返却

## 7. ドキュメント管理API（VSCode風階層構造）

### 7.1 ディレクトリツリー取得
```
GET /api/cases/{caseId}/documents/tree
```

#### レスポンス
```json
{
  "data": {
    "id": "root",
    "name": "案件_2024-01-001",
    "type": "directory",
    "path": "/",
    "children": [
      {
        "id": "dir_001",
        "name": "01_訴状関連",
        "type": "directory",
        "path": "/01_訴状関連",
        "children": [
          {
            "id": "doc_001",
            "name": "訴状.pdf",
            "type": "file",
            "path": "/01_訴状関連/訴状.pdf",
            "mimeType": "application/pdf",
            "size": 1048576,
            "modifiedAt": "2024-01-20T10:00:00Z"
          },
          {
            "id": "doc_002",
            "name": "訴状_ドラフトメモ.md",
            "type": "file",
            "path": "/01_訴状関連/訴状_ドラフトメモ.md",
            "mimeType": "text/markdown",
            "size": 2048,
            "modifiedAt": "2024-01-20T11:00:00Z"
          }
        ]
      }
    ]
  }
}
```

### 7.2 ドキュメント作成（Markdown）
```
POST /api/cases/{caseId}/documents
```

#### リクエスト
```json
{
  "name": "クライアント打ち合わせメモ.md",
  "path": "/03_会議メモ",
  "type": "markdown",
  "content": "# クライアント打ち合わせメモ\n\n日時: 2024-01-20\n\n## 議題\n- 和解条件について",
  "tags": ["tag_meeting", "tag_client"]
}
```

#### レスポンス
```json
{
  "data": {
    "id": "doc_003",
    "name": "クライアント打ち合わせメモ.md",
    "path": "/03_会議メモ/クライアント打ち合わせメモ.md",
    "type": "file",
    "mimeType": "text/markdown",
    "version": 1,
    "createdBy": "user_001",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

### 7.3 ファイルアップロード（PDF等）
```
POST /api/cases/{caseId}/documents/upload
```

#### リクエスト（multipart/form-data）
```
file: (binary)
path: /01_訴状関連
tags: ["tag_official_document"]
```

#### レスポンス
```json
{
  "data": {
    "id": "doc_004",
    "name": "訴状.pdf",
    "path": "/01_訴状関連/訴状.pdf",
    "type": "file",
    "mimeType": "application/pdf",
    "size": 1048576,
    "version": 1,
    "uploadedBy": "user_001",
    "uploadedAt": "2024-01-20T10:00:00Z",
    "ocrStatus": "pending"
  }
}
```

### 7.4 ドキュメント読み取り
```
GET /api/documents/{documentId}
```

#### レスポンス（Markdownの場合）
```json
{
  "data": {
    "id": "doc_002",
    "name": "訴状_ドラフトメモ.md",
    "path": "/01_訴状関連/訴状_ドラフトメモ.md",
    "type": "file",
    "mimeType": "text/markdown",
    "content": "# 訴状ドラフト\n\n## 請求の趣旨\n...",
    "version": 3,
    "size": 2048,
    "tags": ["tag_draft"],
    "metadata": {
      "lastEditor": "user_002",
      "editCount": 15
    },
    "modifiedAt": "2024-01-20T15:00:00Z"
  }
}
```

### 7.5 ドキュメント更新（Markdown）
```
PUT /api/documents/{documentId}
```

#### リクエスト
```json
{
  "content": "# 訴状ドラフト（更新版）\n\n## 請求の趣旨\n...",
  "commitMessage": "auto: 請求の趣旨セクションを更新"
}
```

#### レスポンス
```json
{
  "data": {
    "id": "doc_002",
    "version": 4,
    "modifiedBy": "user_001",
    "modifiedAt": "2024-01-20T16:00:00Z"
  }
}
```

### 7.6 バージョン履歴取得
```
GET /api/documents/{documentId}/versions
```

#### レスポンス
```json
{
  "data": [
    {
      "version": 4,
      "commitMessage": "auto: 請求の趣旨セクションを更新",
      "author": "user_001",
      "authorName": "山田太郎",
      "createdAt": "2024-01-20T16:00:00Z",
      "changes": {
        "additions": 10,
        "deletions": 5
      }
    },
    {
      "version": 3,
      "commitMessage": "auto: 証拠説明を追加",
      "author": "user_002",
      "authorName": "佐藤花子",
      "createdAt": "2024-01-20T15:00:00Z",
      "changes": {
        "additions": 25,
        "deletions": 0
      }
    }
  ]
}
```

### 7.7 バージョン間の差分取得
```
GET /api/documents/{documentId}/diff?from=2&to=4
```

#### レスポンス
```json
{
  "data": {
    "from": 2,
    "to": 4,
    "diff": [
      {
        "type": "deleted",
        "lineNumber": 10,
        "content": "- 原告は被告に対し、金100万円を支払え"
      },
      {
        "type": "added",
        "lineNumber": 10,
        "content": "+ 原告は被告に対し、金1,000万円を支払え"
      }
    ]
  }
}
```

### 7.8 ディレクトリ作成
```
POST /api/cases/{caseId}/documents/directories
```

#### リクエスト
```json
{
  "name": "04_証拠資料",
  "path": "/"
}
```

### 7.9 ファイル/ディレクトリ移動・リネーム
```
PATCH /api/documents/{documentId}/move
```

#### リクエスト
```json
{
  "newPath": "/02_準備書面",
  "newName": "原告第1準備書面_最終版.md"
}
```

### 7.10 削除（論理削除）
```
DELETE /api/documents/{documentId}
```

#### 権限
- `document.read` - ドキュメントの閲覧
- `document.create` - ドキュメントの作成
- `document.update` - ドキュメントの更新
- `document.delete` - ドキュメントの削除
- `document.upload` - ファイルのアップロード

## 8. エクスポートAPI

### 8.1 案件エクスポート
```
POST /api/cases/export
```

#### リクエスト
```json
{
  "format": "csv",
  "caseIds": ["case_001", "case_002"],
  "fields": ["caseNumber", "title", "client", "status", "assignees"]
}
```

#### レスポンス
```json
{
  "data": {
    "exportId": "export_001",
    "status": "processing",
    "format": "csv",
    "estimatedTime": 30
  }
}
```

### 8.2 エクスポート状態確認
```
GET /api/exports/{exportId}
```

#### レスポンス
```json
{
  "data": {
    "exportId": "export_001",
    "status": "completed",
    "downloadUrl": "/api/exports/export_001/download",
    "expiresAt": "2024-01-21T10:00:00Z"
  }
}
```

#### 権限
- `case.export` - 案件データのエクスポート

## 9. WebSocket API

### 9.1 リアルタイム更新
```
ws://api.{tenant}.astermanagement.com/v1/ws
```

#### 接続時認証
```json
{
  "type": "auth",
  "token": "jwt_token"
}
```

#### サブスクリプション
```json
{
  "type": "subscribe",
  "channels": ["case:case_001", "notifications"]
}
```

#### イベント受信
```json
{
  "type": "event",
  "channel": "case:case_001",
  "event": "case.updated",
  "data": {
    "caseId": "case_001",
    "changes": {
      "title": "更新後のタイトル"
    },
    "updatedBy": "user_002",
    "updatedAt": "2024-01-20T15:00:00Z"
  }
}
```

## エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | 権限不足 |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 400 | バリデーションエラー |
| CONFLICT | 409 | リソースの競合（例：重複） |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_ERROR | 500 | サーバー内部エラー |

## レート制限

- 認証済みユーザー: 1000リクエスト/時
- 検索API: 100リクエスト/時
- ファイルアップロード: 100リクエスト/時
- エクスポート: 10リクエスト/時

## バージョニング

- URLパスにバージョンを含める（/v1/）
- 後方互換性を保ちながら新バージョンを追加
- 非推奨APIは最低6ヶ月間維持
- Sunset headerで非推奨を通知