# Discord風ロールシステム

## 概要

Discordのロールシステムを参考にした、柔軟で直感的な権限管理システム。

## 設計思想

### 原則
1. **初期ロールなし**: システムに事前定義されたロールは存在しない
2. **動的作成**: 管理者が組織のニーズに合わせてロールを作成
3. **複数ロール付与**: 1ユーザーに複数ロールを付与可能
4. **階層なし**: ロール間に継承関係はなく、すべて独立
5. **色分けと表示**: Discord風の色分けとロール表示機能

## データモデル

### Roleエンティティ
```kotlin
@Entity
@Table(name = "roles")
data class Role(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val tenantId: UUID,
    
    @Column(nullable = false)
    val name: String,
    
    val description: String? = null,
    
    @Column(nullable = false)
    val color: String = "#808080", // Hex color
    
    val icon: String? = null,
    
    @Column(nullable = false)
    val priority: Int = 0, // 表示順序
    
    @Column(nullable = false)
    val isMentionable: Boolean = true,
    
    @ElementCollection
    @CollectionTable(name = "role_permissions")
    val permissions: Set<String> = emptySet(),
    
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)
```

### UserRole関連
```kotlin
@Entity
@Table(name = "user_roles")
data class UserRole(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val userId: UUID,
    
    @Column(nullable = false)
    val roleId: UUID,
    
    val assignedAt: Instant = Instant.now(),
    val assignedBy: UUID? = null
)
```

## 権限モデル

### パーミッション形式
```
resource:action:scope
```

### 例
```
table:read::/projects/*        # プロジェクトテーブルの読み取り
table:write::/projects/123     # 特定プロジェクトの編集
document:*::/docs/*            # ドキュメントの全操作
system:manage_roles::*         # ロール管理権限
```

### 権限カテゴリ
```yaml
system:
  - manage_tenant     # テナント管理
  - manage_users      # ユーザー管理
  - manage_roles      # ロール管理
  - view_audit_log    # 監査ログ閲覧

table:
  - create           # テーブル作成
  - read             # テーブル読み取り
  - write            # テーブル編集
  - delete           # テーブル削除

document:
  - create           # ドキュメント作成
  - read             # ドキュメント読み取り
  - write            # ドキュメント編集
  - delete           # ドキュメント削除
  - share            # ドキュメント共有

ai:
  - execute          # AIエージェント実行
  - configure        # AI設定変更
```

## Spring Security統合

### カスタム認可サービス
```kotlin
@Service
class CustomPermissionEvaluator : PermissionEvaluator {
    
    override fun hasPermission(
        authentication: Authentication,
        targetDomainObject: Any?,
        permission: Any
    ): Boolean {
        val user = authentication.principal as CustomUserDetails
        val permissionString = permission.toString()
        
        return user.permissions.any { userPerm ->
            matchesPermission(userPerm, permissionString, targetDomainObject)
        }
    }
    
    private fun matchesPermission(
        userPerm: String,
        requiredPerm: String,
        target: Any?
    ): Boolean {
        // resource:action:scope形式でマッチング
        val (userResource, userAction, userScope) = parsePermission(userPerm)
        val (reqResource, reqAction, reqScope) = parsePermission(requiredPerm)
        
        // リソースチェック
        if (userResource != "*" && userResource != reqResource) return false
        
        // アクションチェック
        if (userAction != "*" && userAction != reqAction) return false
        
        // スコープチェック（パスマッチング）
        return matchesScope(userScope, reqScope, target)
    }
}
```

### コントローラーでの使用
```kotlin
@RestController
@RequestMapping("/api/v1/tables")
class TableController {
    
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'table:read')")
    fun getTable(@PathVariable id: UUID): ResponseEntity<Table> {
        // ...
    }
    
    @PostMapping
    @PreAuthorize("hasPermission(null, 'table:create')")
    fun createTable(@RequestBody table: CreateTableRequest): ResponseEntity<Table> {
        // ...
    }
}
```

## ロール表示

### UI表示ルール
1. ユーザー名横に最高優先度ロールを色付きで表示
2. ホバーで全ロール一覧を表示
3. @ロール名でメンション可能
4. ロール管理画面でドラッグ&ドロップで優先度変更

### APIレスポンス
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "田中太郎",
    "roles": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174000",
        "name": "プロジェクトマネージャー",
        "color": "#FF5733",
        "priority": 100
      },
      {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "name": "開発者",
        "color": "#3498DB",
        "priority": 50
      }
    ],
    "displayRole": {
      "name": "プロジェクトマネージャー",
      "color": "#FF5733"
    }
  }
}
```

## テンプレートシステム

### テンプレートに含まれるロール定義
```yaml
# law-firm-template.yaml
roles:
  - name: "所長弁護士"
    color: "#9B59B6"
    priority: 100
    permissions:
      - "system:*::*"
      
  - name: "アソシエイト弁護士"
    color: "#3498DB"
    priority: 80
    permissions:
      - "table:*::/cases/*"
      - "document:*::/legal/*"
      
  - name: "パラリーガル"
    color: "#2ECC71"
    priority: 60
    permissions:
      - "table:read::/cases/*"
      - "document:write::/legal/*"
      
  - name: "事務員"
    color: "#95A5A6"
    priority: 40
    permissions:
      - "table:read::*"
      - "document:read::*"
```

### テンプレート適用
```kotlin
@Service
class TemplateService {
    
    @Transactional
    fun applyTemplate(tenantId: UUID, templateName: String) {
        val template = loadTemplate(templateName)
        
        // ロールを作成
        template.roles.forEach { roleDef ->
            val role = Role(
                tenantId = tenantId,
                name = roleDef.name,
                color = roleDef.color,
                priority = roleDef.priority,
                permissions = roleDef.permissions.toSet()
            )
            roleRepository.save(role)
        }
        
        // その他のテンプレート設定を適用...
    }
}
```

## まとめ

Discord風ロールシステムにより：
1. **柔軟な権限管理**: 組織ごとに最適なロールを設計
2. **直感的なUI**: 色分けと優先度で誰が何の権限を持つか一目瞭然
3. **テンプレート対応**: 業界別の標準ロールを簡単にインポート
4. **スケーラブル**: 小規模から大規模組織まで対応