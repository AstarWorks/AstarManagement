# ダッシュボードAPI仕様

## 概要

ユーザーの日常業務を効率化するためのダッシュボード機能。担当プロジェクトの概要、今日のタスク、重要な通知などを一元的に表示します。

## API仕様

### 1. ダッシュボード概要取得
```
GET /api/dashboard
```

#### レスポンス
```json
{
  "data": {
    "summary": {
      "activeProjects": {
        "total": 24,
        "new": 3,
        "urgent": 2,
        "nearDeadline": 5
      },
      "todaySchedule": {
        "hearings": 2,
        "meetings": 3,
        "deadlines": 1
      },
      "weeklyStats": {
        "casesCreated": 5,
        "casesCompleted": 2,
        "documentsAdded": 45
      }
    },
    "myCases": [
      {
        "id": "case_001",
        "caseNumber": "2024-01-001",
        "title": "〇〇商事 vs △△工業",
        "status": {
          "id": "tag_status_active",
          "name": "進行中",
          "color": "#22c55e"
        },
        "priority": {
          "id": "tag_priority_high",
          "name": "高",
          "color": "#ef4444"
        },
        "nextAction": {
          "type": "hearing",
          "date": "2024-01-25",
          "description": "第1回口頭弁論"
        },
        "lastUpdate": "2024-01-20T10:00:00Z"
      }
    ],
    "todayTasks": [
      {
        "id": "task_001",
        "type": "deadline",
        "caseId": "case_002",
        "caseNumber": "2024-01-002",
        "caseTitle": "労働審判事件",
        "description": "答弁書提出期限",
        "dueTime": "17:00",
        "status": "pending"
      },
      {
        "id": "task_002",
        "type": "hearing",
        "caseId": "case_003",
        "caseNumber": "2024-01-003",
        "caseTitle": "離婚調停事件",
        "description": "第2回調停",
        "time": "14:00",
        "location": "東京家庭裁判所",
        "status": "scheduled"
      }
    ],
    "recentActivities": [
      {
        "id": "activity_001",
        "type": "case_updated",
        "caseId": "case_001",
        "caseNumber": "2024-01-001",
        "description": "ステータスを「進行中」に変更",
        "user": {
          "id": "user_002",
          "name": "佐藤花子"
        },
        "timestamp": "2024-01-20T09:30:00Z"
      }
    ],
    "alerts": [
      {
        "id": "alert_001",
        "type": "deadline_approaching",
        "severity": "warning",
        "caseId": "case_004",
        "caseNumber": "2024-01-004",
        "message": "控訴期限まであと3日",
        "dueDate": "2024-01-23"
      },
      {
        "id": "alert_002",
        "type": "document_ocr_completed",
        "severity": "info",
        "documentId": "doc_123",
        "message": "訴状のOCR処理が完了しました"
      }
    ]
  }
}
```

### 2. ケース統計取得
```
GET /api/dashboard/statistics
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| period | string | No | 期間（week/month/quarter/year、デフォルト: month） |
| groupBy | string | No | グループ化（status/type/assignee） |

#### レスポンス
```json
{
  "data": {
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "casesByStatus": [
      {
        "status": "進行中",
        "count": 15,
        "percentage": 45
      },
      {
        "status": "新規",
        "count": 8,
        "percentage": 24
      },
      {
        "status": "完了",
        "count": 10,
        "percentage": 31
      }
    ],
    "casesByType": [
      {
        "type": "民事",
        "count": 12,
        "percentage": 36
      },
      {
        "type": "家事",
        "count": 8,
        "percentage": 24
      },
      {
        "type": "労働",
        "count": 13,
        "percentage": 40
      }
    ],
    "timeline": [
      {
        "date": "2024-01-01",
        "created": 2,
        "completed": 1
      },
      {
        "date": "2024-01-02",
        "created": 0,
        "completed": 0
      }
    ],
    "performance": {
      "averageCompletionDays": 45,
      "completionRate": 85,
      "onTimeRate": 92
    }
  }
}
```

### 3. タスクリスト取得
```
GET /api/dashboard/tasks
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| date | date | No | 対象日（デフォルト: 今日） |
| type | string | No | タスクタイプ（deadline/hearing/meeting/all） |
| status | string | No | ステータス（pending/completed/all） |

#### レスポンス
```json
{
  "data": [
    {
      "id": "task_001",
      "type": "deadline",
      "priority": "high",
      "caseId": "case_001",
      "caseInfo": {
        "caseNumber": "2024-01-001",
        "title": "〇〇商事 vs △△工業",
        "client": "〇〇商事株式会社"
      },
      "description": "準備書面提出期限",
      "dueDate": "2024-01-25",
      "dueTime": "17:00",
      "status": "pending",
      "assignees": [
        {
          "id": "user_001",
          "name": "山田太郎",
          "avatar": "https://..."
        }
      ],
      "checklist": [
        {
          "id": "check_001",
          "title": "準備書面作成",
          "completed": true
        },
        {
          "id": "check_002",
          "title": "証拠説明書作成",
          "completed": false
        }
      ],
      "reminder": {
        "enabled": true,
        "beforeDays": 3
      }
    }
  ]
}
```

### 4. カレンダーイベント取得
```
GET /api/dashboard/calendar
```

#### パラメータ
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| start | date | Yes | 開始日 |
| end | date | Yes | 終了日 |
| types | string[] | No | イベントタイプフィルタ |

#### レスポンス
```json
{
  "data": [
    {
      "id": "event_001",
      "date": "2024-01-25",
      "type": "hearing",
      "title": "第1回口頭弁論",
      "time": "10:30",
      "duration": 60,
      "location": "東京地方裁判所 第301法廷",
      "caseId": "case_001",
      "caseNumber": "2024-01-001",
      "caseTitle": "〇〇商事 vs △△工業",
      "participants": [
        {
          "id": "user_001",
          "name": "山田太郎",
          "role": "主任弁護士"
        }
      ],
      "notes": "証人尋問あり",
      "color": "#3b82f6"
    },
    {
      "id": "event_002",
      "date": "2024-01-25",
      "type": "deadline",
      "title": "答弁書提出期限",
      "time": "17:00",
      "caseId": "case_002",
      "caseNumber": "2024-01-002",
      "color": "#ef4444"
    }
  ]
}
```

### 5. ウィジェット設定
```
GET /api/dashboard/widgets
```

#### レスポンス
```json
{
  "data": {
    "layout": [
      {
        "id": "widget_summary",
        "type": "summary",
        "position": { "x": 0, "y": 0, "w": 4, "h": 2 },
        "enabled": true
      },
      {
        "id": "widget_my_cases",
        "type": "my_cases",
        "position": { "x": 0, "y": 2, "w": 8, "h": 4 },
        "enabled": true,
        "config": {
          "limit": 10,
          "sortBy": "priority"
        }
      },
      {
        "id": "widget_calendar",
        "type": "calendar",
        "position": { "x": 8, "y": 0, "w": 4, "h": 6 },
        "enabled": true
      }
    ]
  }
}
```

### 6. ウィジェット設定更新
```
PUT /api/dashboard/widgets
```

#### リクエスト
```json
{
  "layout": [
    {
      "id": "widget_summary",
      "position": { "x": 0, "y": 0, "w": 6, "h": 2 },
      "enabled": true
    }
  ]
}
```

## ダッシュボードウィジェット種類

1. **サマリーウィジェット**
   - アクティブプロジェクト数
   - 今日のタスク数
   - 緊急プロジェクト数

2. **マイケースウィジェット**
   - 自分の担当プロジェクト一覧
   - 優先度・期限順ソート
   - クイックアクション

3. **タスクウィジェット**
   - 今日のタスク
   - 今週のタスク
   - 期限切れタスク

4. **カレンダーウィジェット**
   - 月/週/日表示
   - 期日・期限の可視化
   - ドラッグ&ドロップで日程変更

5. **統計ウィジェット**
   - プロジェクト処理状況
   - 月別推移
   - チーム比較

6. **アクティビティウィジェット**
   - 最近の更新
   - チームの活動
   - 重要な変更

7. **アラートウィジェット**
   - 期限アラート
   - システム通知
   - 承認待ち

## フィルター機能

各ウィジェットは以下のフィルターに対応：

- **期間**: 今日/今週/今月/カスタム
- **担当者**: 自分/チーム/全員
- **プロジェクトタイプ**: タグによるフィルタ
- **優先度**: 高/中/低
- **ステータス**: アクティブ/完了/全て

## デフォルトウィジェット配置

### 弁護士（Lawyer）ロール
```json
{
  "layout": [
    {
      "id": "widget_summary",
      "type": "summary",
      "position": { "x": 0, "y": 0, "w": 12, "h": 2 },
      "enabled": true
    },
    {
      "id": "widget_my_cases",
      "type": "my_cases",
      "position": { "x": 0, "y": 2, "w": 8, "h": 4 },
      "enabled": true,
      "config": {
        "limit": 10,
        "sortBy": "priority",
        "showClient": true,
        "showDeadline": true
      }
    },
    {
      "id": "widget_calendar",
      "type": "calendar",
      "position": { "x": 8, "y": 2, "w": 4, "h": 4 },
      "enabled": true,
      "config": {
        "view": "week",
        "showHearings": true,
        "showDeadlines": true
      }
    },
    {
      "id": "widget_alerts",
      "type": "alerts",
      "position": { "x": 0, "y": 6, "w": 4, "h": 3 },
      "enabled": true
    },
    {
      "id": "widget_statistics",
      "type": "statistics",
      "position": { "x": 4, "y": 6, "w": 8, "h": 3 },
      "enabled": true,
      "config": {
        "period": "month",
        "showTeamComparison": true
      }
    }
  ]
}
```

### 事務員（Clerk）ロール
```json
{
  "layout": [
    {
      "id": "widget_tasks",
      "type": "tasks",
      "position": { "x": 0, "y": 0, "w": 8, "h": 3 },
      "enabled": true,
      "config": {
        "showAllTeamTasks": true,
        "groupBy": "dueDate"
      }
    },
    {
      "id": "widget_calendar",
      "type": "calendar",
      "position": { "x": 8, "y": 0, "w": 4, "h": 3 },
      "enabled": true,
      "config": {
        "view": "month",
        "showAllEvents": true
      }
    },
    {
      "id": "widget_recent_documents",
      "type": "recent_documents",
      "position": { "x": 0, "y": 3, "w": 6, "h": 4 },
      "enabled": true,
      "config": {
        "limit": 20,
        "showUploadStatus": true
      }
    },
    {
      "id": "widget_activity",
      "type": "activity",
      "position": { "x": 6, "y": 3, "w": 6, "h": 4 },
      "enabled": true,
      "config": {
        "showTeamActivity": true
      }
    },
    {
      "id": "widget_alerts",
      "type": "alerts",
      "position": { "x": 0, "y": 7, "w": 12, "h": 2 },
      "enabled": true,
      "config": {
        "showDocumentAlerts": true,
        "showDeadlineAlerts": true
      }
    }
  ]
}
```

### クライアント（Client）ロール
```json
{
  "layout": [
    {
      "id": "widget_my_cases",
      "type": "my_cases",
      "position": { "x": 0, "y": 0, "w": 12, "h": 4 },
      "enabled": true,
      "config": {
        "limit": 5,
        "sortBy": "recent",
        "showStatus": true,
        "showNextAction": true,
        "hideInternalInfo": true
      }
    },
    {
      "id": "widget_case_progress",
      "type": "case_progress",
      "position": { "x": 0, "y": 4, "w": 8, "h": 3 },
      "enabled": true,
      "config": {
        "showMilestones": true,
        "showEstimatedCompletion": true
      }
    },
    {
      "id": "widget_messages",
      "type": "messages",
      "position": { "x": 8, "y": 4, "w": 4, "h": 3 },
      "enabled": true,
      "config": {
        "showUnreadCount": true
      }
    },
    {
      "id": "widget_documents",
      "type": "shared_documents",
      "position": { "x": 0, "y": 7, "w": 12, "h": 3 },
      "enabled": true,
      "config": {
        "showOnlyClientVisible": true
      }
    }
  ]
}
```

### インターン（Intern）ロール
```json
{
  "layout": [
    {
      "id": "widget_assigned_tasks",
      "type": "tasks",
      "position": { "x": 0, "y": 0, "w": 8, "h": 4 },
      "enabled": true,
      "config": {
        "showOnlyAssigned": true,
        "showInstructions": true
      }
    },
    {
      "id": "widget_learning_resources",
      "type": "learning",
      "position": { "x": 8, "y": 0, "w": 4, "h": 4 },
      "enabled": true,
      "config": {
        "showTemplates": true,
        "showGuidelines": true
      }
    },
    {
      "id": "widget_recent_work",
      "type": "activity",
      "position": { "x": 0, "y": 4, "w": 12, "h": 3 },
      "enabled": true,
      "config": {
        "showOwnActivity": true,
        "showFeedback": true
      }
    }
  ]
}
```

## ウィジェット種類の詳細

### クライアント向け特別ウィジェット

1. **case_progress** - プロジェクト進捗ウィジェット
   - 現在のステータス
   - 完了したマイルストーン
   - 次のステップ
   - 推定完了時期

2. **messages** - メッセージウィジェット
   - 弁護士からの連絡
   - 未読メッセージ数
   - 重要な通知

3. **shared_documents** - 共有書類ウィジェット
   - クライアント閲覧可能な書類のみ
   - 最新の追加書類
   - ダウンロード可能

### 事務員向け特別ウィジェット

1. **recent_documents** - 最近の書類ウィジェット
   - アップロードされた書類
   - OCR処理状況
   - 要確認書類

### インターン向け特別ウィジェット

1. **learning** - 学習リソースウィジェット
   - 参考テンプレート
   - 業務ガイドライン
   - よくある質問

## 権限

- `dashboard.read` - ダッシュボードの閲覧
- `dashboard.customize` - ウィジェットのカスタマイズ
- `dashboard.team` - チーム全体の統計閲覧