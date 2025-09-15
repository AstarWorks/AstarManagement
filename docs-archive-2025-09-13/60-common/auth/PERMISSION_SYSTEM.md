# 権限システム詳細設計

## 概要

Astar Managementの権限システムは、**Discord風の動的ロール作成システム**を採用しています。Permission（権限）、Scope（スコープ）、Condition（条件）の3層構造により、きめ細かなアクセス制御を可能にします。

### 重要な設計原則
- **初期ロールなし**: システムには事前定義されたロールは存在しない
- **動的ロール作成**: 管理者が組織のニーズに合わせてロールを作成
- **テンプレート同梱**: 業界テンプレートに事前定義されたロールをインポート可能
- **階層なし**: ロール間に継承関係はなく、すべて独立
- **複数ロール**: 1ユーザーに複数のロールを付与可能

## 権限モデル

### 基本構造
```
User → Role(s) → Permission + Scope + Condition = Access
```

### Discord風ロールシステムの特徴
1. **動的作成**: ロールは管理者が必要に応じて作成
2. **色分け**: ロールに色を設定して視覚的に区別
3. **権限組み合わせ**: ロールに複数の権限を組み合わせて設定
4. **柔軟な適用**: ユーザーに複数ロールを付与して柔軟な権限設定

### 1. Permission（権限）

基本的な操作権限を定義します。

```yaml
permissions:
  # プロジェクト管理
  project.read: プロジェクトの閲覧
  project.create: プロジェクトの作成
  project.update: プロジェクトの更新
  project.delete: プロジェクトの削除
  project.export: プロジェクトのエクスポート
  project.status.change: ステータスの変更
  project.assignee.manage: 担当者の管理
  
  # タグ管理
  tag.read: タグの閲覧
  tag.manage: タグの作成・更新・削除
  tag.reorder: タグの並び替え
  
  # 文書管理
  document.read: 文書の閲覧
  document.upload: 文書のアップロード
  document.update: 文書の更新
  document.delete: 文書の削除
  document.download: 文書のダウンロード
  
  # メモ管理
  memo.read: メモの閲覧
  memo.create: メモの作成
  memo.update: メモの更新
  memo.delete: メモの削除
  memo.share: メモの共有設定変更
  
  # 管理機能
  admin.user.manage: ユーザー管理
  admin.role.manage: ロール管理
  admin.permission.manage: 権限管理
  admin.audit.read: 監査ログの閲覧
  admin.system.config: システム設定
```

### 2. Scope（スコープ）

権限が適用される範囲を定義します。

```yaml
scopes:
  all: すべて
  own: 自分が作成/担当
  team: 同じチーム
  department: 同じ部門
  client: クライアントとして関連
  public: 公開設定のもの
  none: なし
```

### 3. Condition（条件）

追加の制約条件を定義します。

```yaml
conditions:
  # ステータス条件
  status:
    - active: アクティブなプロジェクトのみ
    - closed: 終了したプロジェクトのみ
    - specific: 特定のステータスのみ
  
  # 時間条件
  time:
    - business_hours: 営業時間内のみ
    - weekdays: 平日のみ
    - date_range: 特定期間のみ
  
  # データ条件
  data:
    - max_amount: 金額上限
    - tag_filter: 特定のタグのみ
    - client_type: 特定のクライアントタイプ
```

## ロール作成システム

### カスタムロール作成例
```json
{
  "createRole": {
    "name": "プロジェクトリーダー",
    "description": "プロジェクトの統括責任者",
    "color": "#ff6b6b",
    "permissions": [
      {
        "permission": "project.*",
        "scope": "team",
        "condition": null
      },
      {
        "permission": "user.assign",
        "scope": "team",
        "condition": null
      }
    ],
    "createdBy": "admin_user_id",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

### ユーザーへのロール付与例
```json
{
  "assignRoles": {
    "userId": "user_123",
    "roles": [
      {
        "roleId": "custom_project_leader",
        "roleName": "プロジェクトリーダー",
        "assignedAt": "2024-01-15T09:00:00Z",
        "assignedBy": "admin_user_id"
      },
      {
        "roleId": "custom_qa_specialist", 
        "roleName": "QAスペシャリスト",
        "assignedAt": "2024-01-20T14:30:00Z",
        "assignedBy": "admin_user_id"
      }
    ]
  }
}
```

### テンプレート同梱ロールのインポート
```json
{
  "importTemplateRoles": {
    "templateId": "law_firm_template",
    "selectedRoles": [
      "partner_lawyer",
      "associate_lawyer", 
      "paralegal",
      "clerk",
      "client"
    ],
    "customizations": {
      "partner_lawyer": {
        "name": "パートナー弁護士",
        "color": "#8b5cf6"
      },
      "client": {
        "name": "依頼者",
        "color": "#6b7280"
      }
    },
    "importedAt": "2024-01-10T08:00:00Z",
    "importedBy": "setup_admin"
  }
}
```

### テンプレートロール定義例（法律事務所）
```json
{
  "templateRoles": {
    "templateId": "law_firm_template",
    "templateName": "法律事務所テンプレート",
    "roles": [
      {
        "id": "partner_lawyer",
        "name": "パートナー弁護士",
        "description": "事務所の経営パートナー",
        "color": "#8b5cf6",
        "permissions": [
          {
            "permission": "*",
            "scope": "all",
            "condition": null
          }
        ]
      },
      {
        "id": "client",
        "name": "依頼者",
        "description": "外部顧客",
        "color": "#6b7280",
        "permissions": [
          {
            "permission": "project.read",
            "scope": "client",
            "condition": {
              "fields": ["title", "status", "public_updates"]
            }
          }
        ]
      }
    ]
  }
}
```

### 動的ロール管理API
```json
{
  "roleManagement": {
    "createRole": "/api/roles",
    "updateRole": "/api/roles/{roleId}",
    "deleteRole": "/api/roles/{roleId}",
    "assignRole": "/api/users/{userId}/roles",
    "revokeRole": "/api/users/{userId}/roles/{roleId}",
    "listAvailableRoles": "/api/roles",
    "importTemplateRoles": "/api/templates/{templateId}/roles/import"
  },
  "permissions": {
    "roleManagement": [
      "role.create",
      "role.update", 
      "role.delete",
      "role.assign",
      "role.revoke"
    ],
    "requiredScope": "admin"
  }
}
```

## 権限チェックの実装

### APIレベル
```kotlin
@RestController
@RequestMapping("/api/cases")
class CaseController {
    
    @GetMapping
    @RequirePermission("case.read")
    fun listCases(
        @AuthenticationPrincipal user: User,
        @RequestParam scope: String? = null
    ): List<Case> {
        val effectiveScope = permissionService.getEffectiveScope(
            user, "case.read", scope
        )
        
        return caseService.findByScope(user, effectiveScope)
    }
    
    @PatchMapping("/{id}")
    @RequirePermission("case.update")
    fun updateCase(
        @PathVariable id: String,
        @RequestBody updates: Map<String, Any>,
        @AuthenticationPrincipal user: User
    ): Case {
        val case = caseService.findById(id)
        
        // スコープチェック
        if (!permissionService.hasAccess(user, "case.update", case)) {
            throw ForbiddenException("No permission to update this case")
        }
        
        // 条件チェック（フィールド制限など）
        val allowedFields = permissionService.getAllowedFields(
            user, "case.update", case
        )
        val filteredUpdates = updates.filterKeys { it in allowedFields }
        
        return caseService.update(id, filteredUpdates)
    }
}
```

### フロントエンドでの権限チェック
```typescript
// composables/usePermissions.ts
export function usePermissions() {
  const user = useAuthStore()
  
  const hasPermission = (
    permission: string, 
    scope?: string,
    resource?: any
  ): boolean => {
    const perms = user.permissions
    
    // 権限チェックロジック
    return perms.some(p => {
      if (!matchPermission(p.permission, permission)) return false
      if (scope && p.scope !== 'all' && p.scope !== scope) return false
      if (p.condition && !checkCondition(p.condition, resource)) return false
      return true
    })
  }
  
  const can = (action: string, resource?: any): boolean => {
    // リソースベースの権限チェック
    const permission = `${resource?._type || 'case'}.${action}`
    const scope = determineScope(resource)
    return hasPermission(permission, scope, resource)
  }
  
  return { hasPermission, can }
}
```

## 権限の委譲

### 一時的な権限委譲
```json
{
  "delegation": {
    "from": "user_001",
    "to": "user_002",
    "permissions": ["case.update:own"],
    "resources": ["case_123", "case_456"],
    "validFrom": "2024-02-01T00:00:00Z",
    "validUntil": "2024-02-07T23:59:59Z",
    "reason": "休暇中の代理"
  }
}
```

### チーム権限
```json
{
  "team": {
    "id": "team_litigation",
    "name": "訴訟チーム",
    "members": ["user_001", "user_002", "user_003"],
    "sharedPermissions": [
      {
        "permission": "case.*",
        "scope": "team",
        "condition": {
          "tags": ["litigation"]
        }
      }
    ]
  }
}
```

## 監査ログ

すべての権限チェックと重要な操作は監査ログに記録されます。

```json
{
  "auditLog": {
    "id": "audit_001",
    "timestamp": "2024-01-20T10:00:00Z",
    "user": "user_001",
    "action": "project.update",
    "resource": "project_123",
    "result": "allowed",
    "details": {
      "permission": "project.update:own",
      "changes": {
        "title": {
          "from": "旧タイトル",
          "to": "新タイトル"
        }
      }
    },
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## メモの共有設定

メモには以下の共有レベルを設定できます：

```yaml
memo_visibility:
  private: 作成者のみ
  team: チームメンバー
  project_members: プロジェクトの担当者全員
  staff_only: スタッフのみ（アシスタント・外部ユーザー除外）
  external_visible: 外部ユーザーも閲覧可能
  public: 全員（テナント内）
```

## セキュリティ考慮事項

1. **最小権限の原則**: デフォルトではすべて拒否、必要な権限のみ付与
2. **権限の継承なし**: 上位ロールが自動的に下位ロールの権限を持つことはない
3. **明示的な付与**: すべての権限は明示的に付与される必要がある
4. **定期的な権限レビュー**: 3ヶ月ごとに権限設定をレビュー
5. **権限変更の承認フロー**: 重要な権限変更は承認が必要