# 書類作成サポート機能API仕様

## 概要

VSCode風エディターでの法的書類作成、テンプレート管理、AIアシスタント連携を提供するAPI仕様。

## API仕様

### 1. 書類管理

#### 1.1 書類作成
```
POST /api/documents
```

##### リクエスト
```json
{
  "caseId": "case_001",
  "title": "訴状",
  "content": "# 訴状\n\n原告 {{clientName}}\n被告 {{opponentName}}",
  "documentType": "complaint",
  "templateId": "template_001",
  "variables": {
    "clientName": "〇〇商事株式会社",
    "opponentName": "△△工業株式会社"
  }
}
```

##### レスポンス
```json
{
  "data": {
    "id": "doc_001",
    "caseId": "case_001",
    "caseNumber": "2024-01-001",
    "title": "訴状",
    "filePath": "/2024-001/訴状.md",
    "documentType": "complaint",
    "version": 1,
    "createdBy": "user_001",
    "createdAt": "2024-01-20T10:00:00Z",
    "variables": {
      "clientName": "〇〇商事株式会社",
      "opponentName": "△△工業株式会社"
    }
  }
}
```

#### 1.2 書類一覧取得
```
GET /api/cases/{caseId}/documents
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| documentType | string | No | 書類種別でフィルタ |
| search | string | No | タイトル・内容で検索 |

##### レスポンス
```json
{
  "data": [
    {
      "id": "doc_001",
      "title": "訴状",
      "filePath": "/2024-001/訴状.md",
      "documentType": "complaint",
      "version": 3,
      "lastModifiedBy": "user_001",
      "lastModifiedAt": "2024-01-22T14:30:00Z",
      "size": 15234
    }
  ]
}
```

#### 1.3 書類詳細取得
```
GET /api/documents/{documentId}
```

##### レスポンス
```json
{
  "data": {
    "id": "doc_001",
    "caseId": "case_001",
    "title": "訴状",
    "content": "# 訴状\n\n原告 〇〇商事株式会社\n被告 △△工業株式会社\n\n## 請求の趣旨\n...",
    "documentType": "complaint",
    "version": 3,
    "variables": {
      "clientName": "〇〇商事株式会社",
      "opponentName": "△△工業株式会社",
      "claimAmount": "5000000"
    },
    "metadata": {
      "wordCount": 2500,
      "lastSaved": "2024-01-22T14:30:00Z",
      "autoSaveEnabled": true
    }
  }
}
```

#### 1.4 書類更新
```
PUT /api/documents/{documentId}
```

##### リクエスト
```json
{
  "content": "# 訴状\n\n更新された内容...",
  "variables": {
    "claimAmount": "6000000"
  },
  "createVersion": true,
  "versionComment": "請求金額を修正"
}
```

#### 1.5 書類削除
```
DELETE /api/documents/{documentId}
```

### 2. バージョン管理

#### 2.1 バージョン一覧
```
GET /api/documents/{documentId}/versions
```

##### レスポンス
```json
{
  "data": [
    {
      "id": "ver_003",
      "version": 3,
      "createdBy": "user_001",
      "createdAt": "2024-01-22T14:30:00Z",
      "changeComment": "請求金額を修正",
      "additions": 15,
      "deletions": 3
    }
  ]
}
```

#### 2.2 バージョン詳細
```
GET /api/documents/{documentId}/versions/{versionId}
```

#### 2.3 バージョン比較
```
GET /api/documents/{documentId}/versions/{versionId}/diff
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| compareWith | string | No | 比較対象バージョンID |

##### レスポンス
```json
{
  "data": {
    "fromVersion": 2,
    "toVersion": 3,
    "changes": [
      {
        "line": 25,
        "type": "modified",
        "before": "請求金額 5,000,000円",
        "after": "請求金額 6,000,000円"
      }
    ]
  }
}
```

### 3. テンプレート管理

#### 3.1 書類テンプレート一覧
```
GET /api/document-templates
```

##### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| category | string | No | カテゴリー（system/custom） |
| documentType | string | No | 書類種別 |

##### レスポンス
```json
{
  "data": [
    {
      "id": "template_001",
      "name": "通常訴状",
      "category": "system",
      "documentType": "complaint",
      "description": "一般的な民事訴訟の訴状テンプレート",
      "variables": [
        {
          "key": "clientName",
          "label": "原告名",
          "type": "string",
          "required": true
        },
        {
          "key": "claimAmount",
          "label": "請求金額",
          "type": "number",
          "required": true
        }
      ],
      "usageCount": 45,
      "lastUsedAt": "2024-01-19T10:00:00Z"
    }
  ]
}
```

#### 3.2 テンプレート作成
```
POST /api/document-templates
```

##### リクエスト
```json
{
  "name": "労働審判申立書",
  "documentType": "labor_tribunal",
  "content": "# 労働審判申立書\n\n申立人 {{employeeName}}\n相手方 {{companyName}}",
  "variables": [
    {
      "key": "employeeName",
      "label": "申立人（労働者）",
      "type": "string",
      "required": true
    }
  ],
  "sharing": "office"
}
```

### 4. AIアシスタント

#### 4.1 AIチャット送信
```
POST /api/documents/{documentId}/ai-chat
```

##### リクエスト
```json
{
  "message": "この段落をもっと強い表現にしてください",
  "selectedText": "被告の行為は、原告に損害を与えました。",
  "context": {
    "startLine": 45,
    "endLine": 45
  }
}
```

##### レスポンス
```json
{
  "data": {
    "id": "chat_001",
    "response": "以下のように修正することを提案します：\n\n「被告の行為は、著しく信義則に反し、原告に重大な損害を与えました。」\n\nより強い表現として：\n- 「著しく信義則に反し」：違法性を強調\n- 「重大な」：損害の程度を強調",
    "suggestions": [
      {
        "type": "replacement",
        "original": "被告の行為は、原告に損害を与えました。",
        "suggested": "被告の行為は、著しく信義則に反し、原告に重大な損害を与えました。"
      }
    ]
  }
}
```

#### 4.2 AI提案適用
```
POST /api/documents/{documentId}/ai-suggestions/{suggestionId}/apply
```

##### レスポンス
```json
{
  "data": {
    "applied": true,
    "updatedContent": "...",
    "chatId": "chat_001"
  }
}
```

#### 4.3 チャット履歴取得
```
GET /api/documents/{documentId}/ai-chat-history
```

### 5. エクスポート

#### 5.1 PDF生成
```
POST /api/documents/{documentId}/export/pdf
```

##### リクエスト
```json
{
  "settings": {
    "paperSize": "A4",
    "margins": {
      "top": 30,
      "bottom": 30,
      "left": 25,
      "right": 25
    },
    "font": "mincho",
    "fontSize": 10.5,
    "lineHeight": 1.5,
    "pageNumbers": {
      "enabled": true,
      "position": "bottom-center",
      "format": "- {page} -"
    },
    "header": {
      "text": "事件番号：2024-01-001",
      "alignment": "right"
    }
  }
}
```

##### レスポンス
```json
{
  "data": {
    "exportId": "export_001",
    "status": "processing",
    "estimatedTime": 5,
    "pageCount": 12
  }
}
```

#### 5.2 エクスポート状態確認
```
GET /api/exports/{exportId}/status
```

##### レスポンス
```json
{
  "data": {
    "exportId": "export_001",
    "status": "completed",
    "downloadUrl": "/api/exports/export_001/download",
    "expiresAt": "2024-01-20T12:00:00Z",
    "fileSize": 125678,
    "pageCount": 12
  }
}
```

#### 5.3 Word出力
```
POST /api/documents/{documentId}/export/word
```

##### リクエスト
```json
{
  "settings": {
    "template": "standard",
    "includeStyles": true,
    "includeVersionHistory": false
  }
}
```

### 6. 検索機能

#### 6.1 書類内検索
```
POST /api/documents/{documentId}/search
```

##### リクエスト
```json
{
  "query": "損害賠償",
  "options": {
    "caseSensitive": false,
    "wholeWord": false,
    "regex": false
  }
}
```

##### レスポンス
```json
{
  "data": {
    "matches": [
      {
        "line": 45,
        "column": 10,
        "text": "損害賠償請求",
        "context": "原告は被告に対し、損害賠償請求として金500万円の支払いを求める。"
      }
    ],
    "totalMatches": 5
  }
}
```

#### 6.2 横断検索
```
POST /api/cases/{caseId}/documents/search
```

##### リクエスト
```json
{
  "query": "時効",
  "documentTypes": ["complaint", "brief"],
  "includeVersions": false
}
```

### 7. 自動保存

#### 7.1 自動保存
```
POST /api/documents/{documentId}/autosave
```

##### リクエスト
```json
{
  "content": "# 訴状\n\n編集中の内容...",
  "cursorPosition": {
    "line": 25,
    "column": 15
  }
}
```

##### レスポンス
```json
{
  "data": {
    "saved": true,
    "timestamp": "2024-01-20T10:30:45Z",
    "conflictDetected": false
  }
}
```

### 8. 書類構造管理

#### 8.1 フォルダー作成
```
POST /api/cases/{caseId}/folders
```

##### リクエスト
```json
{
  "name": "準備書面",
  "parentPath": "/2024-001"
}
```

#### 8.2 ファイル移動
```
PUT /api/documents/{documentId}/move
```

##### リクエスト
```json
{
  "targetPath": "/2024-001/準備書面",
  "newName": "準備書面第1号.md"
}
```

### 9. 変数管理

#### 9.1 システム変数取得
```
GET /api/cases/{caseId}/system-variables
```

##### レスポンス
```json
{
  "data": {
    "caseNumber": "2024-01-001",
    "caseTitle": "〇〇商事 vs △△工業",
    "clientName": "〇〇商事株式会社",
    "clientAddress": "東京都千代田区...",
    "opponentName": "△△工業株式会社",
    "courtName": "東京地方裁判所",
    "judgeName": "山田太郎",
    "lawyerName": "田中弁護士",
    "lawFirmName": "〇〇法律事務所",
    "today": "2024年1月20日"
  }
}
```

#### 9.2 カスタム変数保存
```
PUT /api/documents/{documentId}/variables
```

##### リクエスト
```json
{
  "variables": {
    "customField1": "値1",
    "customField2": "値2"
  }
}
```

## WebSocket API

### 1. リアルタイム編集

#### 接続
```
ws://api/documents/{documentId}/edit
```

#### メッセージ形式

##### クライアント → サーバー
```json
{
  "type": "cursor",
  "data": {
    "line": 25,
    "column": 15
  }
}
```

```json
{
  "type": "edit",
  "data": {
    "operation": "insert",
    "position": { "line": 25, "column": 15 },
    "text": "追加テキスト"
  }
}
```

##### サーバー → クライアント
```json
{
  "type": "user-joined",
  "data": {
    "userId": "user_002",
    "userName": "佐藤弁護士",
    "color": "#FF5733"
  }
}
```

## 権限

- `document.create` - 書類の作成
- `document.read` - 書類の閲覧
- `document.update` - 書類の編集
- `document.delete` - 書類の削除
- `document.export` - 書類のエクスポート
- `template.create` - テンプレートの作成
- `template.manage` - テンプレートの管理
- `ai.use` - AIアシスタントの使用

### スコープによる制限

- 案件担当者のみがその案件の書類を編集可能
- テンプレートの共有範囲（personal/office）による制限