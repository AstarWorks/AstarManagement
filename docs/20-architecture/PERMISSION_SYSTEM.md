# 権限システム詳細設計

## 概要

Astar Managementの権限システムは、GitHub/Cloudflareのような柔軟で厳密な権限管理を実現します。Permission（権限）、Scope（スコープ）、Condition（条件）の3層構造により、きめ細かなアクセス制御を可能にします。

## 権限モデル

### 基本構造
```
Access = Permission + Scope + Condition
```

### 1. Permission（権限）

基本的な操作権限を定義します。

```yaml
permissions:
  # 案件管理
  case.read: 案件の閲覧
  case.create: 案件の作成
  case.update: 案件の更新
  case.delete: 案件の削除
  case.export: 案件のエクスポート
  case.status.change: ステータスの変更
  case.assignee.manage: 担当者の管理
  
  # タグ管理
  tag.read: タグの閲覧
  tag.manage: タグの作成・更新・削除
  tag.reorder: タグの並び替え
  
  # 書類管理
  document.read: 書類の閲覧
  document.upload: 書類のアップロード
  document.update: 書類の更新
  document.delete: 書類の削除
  document.download: 書類のダウンロード
  
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
    - active: アクティブな案件のみ
    - closed: 終了した案件のみ
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

## 権限の組み合わせ例

### 1. 弁護士（Partner）
```json
{
  "role": "partner",
  "permissions": [
    {
      "permission": "case.*",
      "scope": "all",
      "condition": null
    },
    {
      "permission": "admin.*",
      "scope": "all",
      "condition": null
    }
  ]
}
```

### 2. アソシエイト弁護士
```json
{
  "role": "associate",
  "permissions": [
    {
      "permission": "case.read",
      "scope": "all",
      "condition": null
    },
    {
      "permission": "case.create",
      "scope": "own",
      "condition": null
    },
    {
      "permission": "case.update",
      "scope": "own",
      "condition": {
        "status": ["active"]
      }
    },
    {
      "permission": "case.status.change",
      "scope": "own",
      "condition": {
        "status": {
          "from": ["new", "active"],
          "to": ["active", "pending"]
        }
      }
    }
  ]
}
```

### 3. 事務員
```json
{
  "role": "clerk",
  "permissions": [
    {
      "permission": "case.read",
      "scope": "team",
      "condition": null
    },
    {
      "permission": "case.update",
      "scope": "team",
      "condition": {
        "fields": ["summary", "description", "memos"]
      }
    },
    {
      "permission": "document.*",
      "scope": "team",
      "condition": null
    }
  ]
}
```

### 4. クライアント
```json
{
  "role": "client",
  "permissions": [
    {
      "permission": "case.read",
      "scope": "client",
      "condition": {
        "fields": ["public_fields"]
      }
    },
    {
      "permission": "document.read",
      "scope": "client",
      "condition": {
        "tags": ["client_visible"]
      }
    },
    {
      "permission": "memo.read",
      "scope": "client",
      "condition": {
        "visibility": "client"
      }
    }
  ]
}
```

### 5. インターン
```json
{
  "role": "intern",
  "permissions": [
    {
      "permission": "case.read",
      "scope": "own",
      "condition": {
        "status": ["closed"],
        "time": {
          "business_hours": true
        }
      }
    },
    {
      "permission": "memo.create",
      "scope": "own",
      "condition": {
        "visibility": "private"
      }
    }
  ]
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
    "action": "case.update",
    "resource": "case_123",
    "result": "allowed",
    "details": {
      "permission": "case.update:own",
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
  case_members: 案件の担当者全員
  lawyers_only: 弁護士のみ（事務員・クライアント除外）
  client_visible: クライアントも閲覧可能
  public: 全員（テナント内）
```

## セキュリティ考慮事項

1. **最小権限の原則**: デフォルトではすべて拒否、必要な権限のみ付与
2. **権限の継承なし**: 上位ロールが自動的に下位ロールの権限を持つことはない
3. **明示的な付与**: すべての権限は明示的に付与される必要がある
4. **定期的な権限レビュー**: 3ヶ月ごとに権限設定をレビュー
5. **権限変更の承認フロー**: 重要な権限変更は承認が必要