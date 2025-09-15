# テンプレート機能API仕様

## 概要

プロジェクトテンプレート機能により、頻繁に扱うプロジェクトタイプ（離婚調停、債務整理、労働問題等）の初期設定を保存・再利用できます。テンプレートにはプロジェクトの基本情報、タグ、ディレクトリ構造、標準ドキュメントを含めることができます。

## テンプレートの種類

1. **個人テンプレート**: 作成したユーザーのみ使用可能
2. **共有テンプレート**: テナント内で共有（権限により制限可能）
3. **システムテンプレート**: システムが提供する標準テンプレート

## API仕様

### 1. テンプレート一覧取得
```
GET /api/templates
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| type | string | No | personal/shared/system |
| category | string | No | テンプレートカテゴリー |
| search | string | No | テンプレート名検索 |

#### レスポンス
```json
{
  "data": [
    {
      "id": "template_001",
      "name": "離婚調停プロジェクト",
      "description": "離婚調停プロジェクトの標準テンプレート",
      "type": "shared",
      "category": "家事事件",
      "usageCount": 45,
      "lastUsedAt": "2024-01-20T10:00:00Z",
      "createdBy": {
        "id": "user_001",
        "name": "山田太郎"
      },
      "tags": ["tag_type_divorce", "tag_type_family"],
      "preview": {
        "directoryCount": 5,
        "documentCount": 8
      }
    }
  ]
}
```

### 2. テンプレート詳細取得
```
GET /api/templates/{templateId}
```

#### レスポンス
```json
{
  "data": {
    "id": "template_001",
    "name": "離婚調停案件",
    "description": "離婚調停案件の標準テンプレート",
    "type": "shared",
    "category": "家事事件",
    "projectDefaults": {
      "title": "{{clientName}} vs {{opponentName}} 離婚調停事件",
      "summary": "離婚調停申立事件",
      "tags": ["tag_type_divorce", "tag_type_family", "tag_status_new"],
      "customFields": {
        "courtName": "{{city}}家庭裁判所"
      }
    },
    "directoryStructure": [
      {
        "path": "/01_調停申立書",
        "documents": [
          {
            "name": "調停申立書.md",
            "content": "# 調停申立書\n\n申立人: {{clientName}}\n相手方: {{opponentName}}\n\n## 申立ての趣旨\n..."
          }
        ]
      },
      {
        "path": "/02_証拠資料",
        "documents": []
      },
      {
        "path": "/03_調停記録",
        "documents": [
          {
            "name": "第1回調停メモ.md",
            "content": "# 第1回調停メモ\n\n日時: \n場所: \n\n## 出席者\n- 申立人: \n- 相手方: \n\n## 協議内容\n"
          }
        ]
      }
    ],
    "variables": [
      {
        "key": "clientName",
        "label": "依頼者名",
        "type": "string",
        "required": true
      },
      {
        "key": "opponentName", 
        "label": "相手方名",
        "type": "string",
        "required": true
      },
      {
        "key": "city",
        "label": "管轄地",
        "type": "string",
        "required": false,
        "default": "東京"
      }
    ]
  }
}
```

### 3. テンプレート作成
```
POST /api/templates
```

#### リクエスト
```json
{
  "name": "債務整理案件",
  "description": "個人の債務整理案件用テンプレート",
  "type": "personal",
  "category": "債務整理",
  "projectDefaults": {
    "title": "{{clientName}} 債務整理案件",
    "summary": "任意整理による債務整理",
    "tags": ["tag_type_debt", "tag_priority_high"]
  },
  "directoryStructure": [
    {
      "path": "/01_債権者一覧",
      "documents": [
        {
          "name": "債権者リスト.md",
          "content": "# 債権者一覧\n\n| 債権者名 | 債務額 | 最終返済日 | 備考 |\n|---------|--------|------------|------|\n"
        }
      ]
    }
  ],
  "variables": [
    {
      "key": "clientName",
      "label": "依頼者名",
      "type": "string",
      "required": true
    }
  ]
}
```

### 4. プロジェクト作成時のテンプレート適用
```
POST /api/projects/from-template
```

#### リクエスト
```json
{
  "templateId": "template_001",
  "variables": {
    "clientName": "田中花子",
    "opponentName": "田中太郎",
    "city": "横浜"
  },
  "additionalData": {
    "clientId": "client_123",
    "assignees": ["user_001"]
  }
}
```

#### レスポンス
```json
{
  "data": {
    "id": "project_new_001",
    "projectNumber": {
      "year": 2024,
      "month": 1,
      "sequence": 10,
      "formatted": "2024-01-010"
    },
    "title": "田中花子 vs 田中太郎 離婚調停事件",
    "documentsCreated": 3,
    "directoriesCreated": 3
  }
}
```

### 5. テンプレート更新
```
PATCH /api/templates/{templateId}
```

### 6. テンプレート削除
```
DELETE /api/templates/{templateId}
```

### 7. 既存プロジェクトからテンプレート作成
```
POST /api/templates/from-project
```

#### リクエスト
```json
{
  "projectId": "project_001",
  "name": "交通事故案件テンプレート",
  "description": "交通事故の損害賠償請求用",
  "type": "shared",
  "includeDocuments": true,
  "documentFilter": {
    "excludePatterns": ["*個人情報*", "*秘密*"]
  }
}
```

## 変数システム

テンプレート内で使用できる変数：

- `{{variableName}}` - 基本的な変数置換
- `{{variableName|default:デフォルト値}}` - デフォルト値付き
- `{{variableName|upper}}` - 大文字変換
- `{{date|format:YYYY年MM月DD日}}` - 日付フォーマット
- `{{#if variableName}}...{{/if}}` - 条件分岐
- `{{#each items}}...{{/each}}` - 繰り返し

## ドキュメントテンプレート機能

### 8. ドキュメントテンプレート一覧取得
```
GET /api/document-templates
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| category | string | No | テンプレートカテゴリー |
| search | string | No | テンプレート名検索 |

#### レスポンス
```json
{
  "data": [
    {
      "id": "doc_template_001",
      "name": "和解条項",
      "description": "標準的な和解条項のテンプレート",
      "category": "和解",
      "fileName": "和解条項.md",
      "variables": ["clientName", "opponentName", "amount", "paymentDate"],
      "usageCount": 23
    }
  ]
}
```

### 9. ドキュメントテンプレート適用
```
POST /api/projects/{projectId}/documents/from-template
```

#### リクエスト
```json
{
  "templateId": "doc_template_001",
  "path": "/04_和解書類",
  "fileName": "和解条項_{{date}}.md",
  "variables": {
    "amount": "1,000,000",
    "paymentDate": "2024年3月31日"
  }
}
```

#### レスポンス
```json
{
  "data": {
    "id": "doc_005",
    "name": "和解条項_20240120.md",
    "path": "/04_和解書類/和解条項_20240120.md",
    "content": "# 和解条項\n\n1. 被告は原告に対し、本件解決金として金1,000,000円の支払義務があることを認める。\n2. 被告は前項の金員を2024年3月31日までに...",
    "createdFrom": "doc_template_001"
  }
}
```

### 10. ドキュメントテンプレート作成
```
POST /api/document-templates
```

#### リクエスト
```json
{
  "name": "訴状テンプレート",
  "description": "一般的な訴状のテンプレート",
  "category": "訴状",
  "fileName": "訴状.md",
  "content": "# 訴状\n\n原告: {{clientName}}\n被告: {{opponentName}}\n\n## 請求の趣旨\n{{claimContent}}\n\n## 請求の原因\n{{claimReason}}",
  "variables": [
    {
      "key": "clientName",
      "label": "原告名",
      "type": "string",
      "required": true
    },
    {
      "key": "opponentName",
      "label": "被告名",
      "type": "string",
      "required": true
    },
    {
      "key": "claimContent",
      "label": "請求内容",
      "type": "text",
      "required": true
    },
    {
      "key": "claimReason",
      "label": "請求理由",
      "type": "text",
      "required": true
    }
  ]
}
```

## テンプレートカテゴリー管理

### 11. カテゴリー一覧取得
```
GET /api/template-categories
```

#### レスポンス
```json
{
  "data": {
    "projectCategories": [
      "離婚",
      "相続",
      "労働問題",
      "債務整理",
      "交通事故",
      "不動産"
    ],
    "documentCategories": [
      "訴状",
      "答弁書",
      "準備書面",
      "和解",
      "調停",
      "契約書"
    ]
  }
}
```

### 12. カテゴリー追加
```
POST /api/template-categories
```

#### リクエスト
```json
{
  "type": "project",
  "category": "知的財産"
}
```

## バリデーション仕様

### 13. テンプレートプレビュー
```
POST /api/templates/{templateId}/preview
```

#### リクエスト
```json
{
  "variables": {
    "clientName": "山田太郎",
    "opponentName": "田中花子",
    "amount": "1,000,000"
  },
  "projectContext": "project_001"  // 現在のプロジェクトコンテキスト（省略可能）
}
```

#### レスポンス
```json
{
  "data": {
    "projectDefaults": {
      "title": "山田太郎 vs 田中花子 離婚調停事件",
      "summary": "離婚調停申立事件"
    },
    "documents": [
      {
        "path": "/01_調停申立書/調停申立書.md",
        "content": "# 調停申立書\n\n申立人: 山田太郎\n相手方: 田中花子\n\n## 申立ての趣旨\n..."
      }
    ],
    "missingVariables": ["paymentDate"],
    "autoFilledVariables": {
      "projectNumber": "2024-01-001",
      "today": "2024年1月20日",
      "lawyerName": "弁護士 鈴木一郎"
    }
  }
}
```

## 変数の型定義

### 利用可能な変数型

```yaml
variableTypes:
  string:
    description: 短いテキスト（1行）
    example: 氏名、住所
    
  text:
    description: 長いテキスト（複数行）
    example: 請求内容、理由
    
  number:
    description: 数値
    example: 金額、日数
    format: "###,###"  # 表示フォーマット
    
  date:
    description: 日付
    example: 期限、締切日
    format: "YYYY年MM月DD日"
    
  select:
    description: 選択肢から選択
    example: 管轄裁判所、案件種別
    options:
      - value: "tokyo"
        label: "東京地方裁判所"
      - value: "yokohama"
        label: "横浜地方裁判所"
        
  boolean:
    description: はい/いいえ
    example: 和解希望の有無
    trueLabel: "あり"
    falseLabel: "なし"
```

### 変数定義の例（拡張版）

```json
{
  "variables": [
    {
      "key": "clientName",
      "label": "依頼者名",
      "type": "string",
      "required": true,
      "placeholder": "例: 山田太郎"
    },
    {
      "key": "amount",
      "label": "請求金額",
      "type": "number",
      "required": true,
      "format": "¥###,###",
      "min": 0
    },
    {
      "key": "dueDate",
      "label": "支払期限",
      "type": "date",
      "required": false,
      "default": "{{today|addDays:30}}",
      "format": "YYYY年MM月DD日"
    },
    {
      "key": "court",
      "label": "管轄裁判所",
      "type": "select",
      "required": true,
      "options": [
        {"value": "tokyo", "label": "東京地方裁判所"},
        {"value": "osaka", "label": "大阪地方裁判所"}
      ]
    },
    {
      "key": "hasSettlement",
      "label": "和解希望",
      "type": "boolean",
      "required": false,
      "default": true
    }
  ]
}
```

## システム変数（自動入力）

以下の変数は、プロジェクトコンテキストから自動的に取得されます：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| {{clientName}} | 現在のプロジェクトの依頼者名 | 山田太郎 |
| {{opponentName}} | 現在のプロジェクトの相手方名 | 田中花子 |
| {{projectNumber}} | 現在のプロジェクト番号 | 2024-01-001 |
| {{projectTitle}} | 現在のプロジェクト名 | 〇〇 vs △△ 売買代金請求事件 |
| {{today}} | 今日の日付 | 2024年1月20日 |
| {{currentUser}} | 現在のユーザー名 | 弁護士 鈴木一郎 |
| {{lawyerName}} | 担当弁護士名 | 弁護士 鈴木一郎 |
| {{lawFirmName}} | 法律事務所名 | 〇〇法律事務所 |

### 日付関連の特殊変数

```
{{today|format:YYYY/MM/DD}} → 2024/01/20
{{today|addDays:30}} → 2024年2月19日
{{today|addMonths:1}} → 2024年2月20日
{{today|startOfMonth}} → 2024年1月1日
{{today|endOfMonth}} → 2024年1月31日
```

### テンプレート作成時の検証

1. **変数名の検証**
   - 英数字とアンダースコアのみ
   - 予約語（システム変数名）は使用不可
   - 重複チェック

2. **変数使用の検証**
   - テンプレート内で宣言された変数のみ使用可能（システム変数を除く）
   - 必須変数がすべて定義されているか確認

3. **構文検証**
   - `{{variableName}}` の正しい記法
   - 閉じられていない変数タグの検出
   
4. **型検証**
   - select型のoptionsが定義されているか
   - number型のmin/maxが妥当か
   - date型のフォーマットが正しいか

### エラーレスポンス例
```json
{
  "error": {
    "code": "TEMPLATE_VALIDATION_ERROR",
    "message": "テンプレートの検証に失敗しました",
    "details": [
      {
        "type": "undefined_variable",
        "message": "未定義の変数が使用されています: {{unknownVar}}",
        "location": "directoryStructure[0].documents[0].content",
        "line": 5
      },
      {
        "type": "invalid_variable_name",
        "message": "無効な変数名です: {{123invalid}}",
        "location": "projectDefaults.title"
      }
    ]
  }
}
```

## 権限

- `template.read` - テンプレートの閲覧
- `template.create` - テンプレートの作成
- `template.update` - テンプレートの更新
- `template.delete` - テンプレートの削除
- `template.share` - 個人テンプレートを共有テンプレートに変更