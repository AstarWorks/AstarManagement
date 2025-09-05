# 権限モデルのクリーンアップと統一設計書

## 1. 現状の問題：概念の重複と混乱

現在のコードベースには、同じ概念を表す複数の実装が混在しており、設計の一貫性が失われています。

### 1.1 Action vs Permission の重複

現在、**2つの異なる名前で同じ概念**が存在：

```kotlin
// File: Action.kt
enum class Action {
    VIEW,    // 閲覧権限
    CREATE,  // 作成権限
    EDIT,    // 編集権限
    DELETE,  // 削除権限
    MANAGE   // 管理権限
}

// File: PermissionRule.kt (内部で使用)
abstract val action: Action  // "permission"ではなく"action"を使用

// File: RolePermission.kt (文字列ベース)
fun getAction(): String?  // 文字列として"action"を取得
```

しかし、ドキュメントや他の場所では「Permission」という用語も使用されており、混乱を招いています。

### 1.2 PermissionRuleの構造的矛盾

```kotlin
// 現在のPermissionRule
sealed class PermissionRule {
    abstract val action: Action  // ← Actionを含む
    
    data class GeneralRule(
        override val action: Action,
        val scope: Scope,
        val resourceType: ResourceType
    ) : PermissionRule()
}
```

**問題点**：
- `PermissionRule`という名前なのに`permission`フィールドがない
- 代わりに`action`フィールドを使用
- 概念的に`PermissionRule = ResourceType + Action + Scope`であるべき

### 1.3 文字列ベースと型安全の混在

```kotlin
// 型安全な実装（PermissionRule.kt）
data class GeneralRule(
    override val action: Action,  // Enum
    val scope: Scope,             // Enum
    val resourceType: ResourceType // Enum
)

// 文字列ベースの実装（RolePermission.kt）
data class RolePermission(
    val permissionRule: String  // "table.edit.all"
)
```

同じシステム内で型安全な実装と文字列ベースの実装が混在しています。

## 2. 統一設計：PermissionRule = ResourceType + Action + Scope

### 2.1 正しい概念モデル

```
PermissionRule = ResourceType + Action + Scope
```

- **ResourceType**: 何に対して（TABLE, DOCUMENT, WORKSPACE...）
- **Action**: 何をするか（VIEW, CREATE, EDIT, DELETE, MANAGE）
- **Scope**: どの範囲で（ALL, TEAM, OWN, RESOURCE_GROUP, RESOURCE_ID）

### 2.2 統一された実装

#### Step 1: Actionを正式名称として確立

```kotlin
/**
 * リソースに対する操作（アクション）を定義
 * PermissionRuleの構成要素の1つ
 */
enum class Action {
    VIEW,    // リソースの閲覧
    CREATE,  // リソースの作成
    EDIT,    // リソースの編集
    DELETE,  // リソースの削除
    MANAGE   // リソースの全権限（全アクションを包含）
}
```

#### Step 2: PermissionRuleの正しい構造

```kotlin
/**
 * 権限ルール = ResourceType + Action + Scope
 * これが権限システムの基本単位
 */
sealed class PermissionRule {
    abstract val resourceType: ResourceType
    abstract val action: Action
    abstract val scope: Scope
    
    /**
     * 一般的なスコープベース権限
     * 例: "table.view.all" = TABLE + VIEW + ALL
     */
    data class GeneralRule(
        override val resourceType: ResourceType,
        override val action: Action,
        override val scope: Scope  // ALL, TEAM, OWN のみ
    ) : PermissionRule() {
        init {
            require(scope in listOf(Scope.ALL, Scope.TEAM, Scope.OWN)) {
                "GeneralRule only supports ALL, TEAM, OWN scopes"
            }
        }
        
        override fun toAuthorityString(): String {
            return "${resourceType.name.lowercase()}.${action.name.lowercase()}.${scope.name.lowercase()}"
        }
    }
    
    /**
     * ResourceGroup経由の権限
     * 例: "table.edit.resource_group:project-a"
     */
    data class ResourceGroupRule(
        override val resourceType: ResourceType,
        override val action: Action,
        val groupId: UUID
    ) : PermissionRule() {
        override val scope = Scope.RESOURCE_GROUP
        
        override fun toAuthorityString(): String {
            return "${resourceType.name.lowercase()}.${action.name.lowercase()}.resource_group:$groupId"
        }
    }
    
    /**
     * 特定リソースインスタンスへの権限
     * 例: "table.view.resource_id:123e4567-..."
     */
    data class ResourceIdRule(
        override val resourceType: ResourceType,
        override val action: Action,
        val resourceId: UUID
    ) : PermissionRule() {
        override val scope = Scope.RESOURCE_ID
        
        override fun toAuthorityString(): String {
            return "${resourceType.name.lowercase()}.${action.name.lowercase()}.resource_id:$resourceId"
        }
    }
}
```

### 2.3 メソッド名の統一

現在の混乱したメソッド名：
```kotlin
// 悪い例（現在）
fun getAction(): String?      // 文字列？
fun getPermission(): String?   // これも文字列？
abstract val action: Action    // Enum？
abstract val permission: Permission  // 存在しない
```

統一後：
```kotlin
// 良い例（統一後）
abstract val resourceType: ResourceType  // 明確：リソースタイプ
abstract val action: Action              // 明確：アクション
abstract val scope: Scope                // 明確：スコープ
```

## 3. 削除・統合すべきコード

### 3.1 削除対象

1. **Permission enum**（もし存在すれば）
   - `Action` enumに統一

2. **文字列ベースの権限処理**
   ```kotlin
   // 削除
   fun parseRule(): Triple<String, String, String>?
   fun getAction(): String?
   fun getScope(): String?
   ```

3. **TableSecurityExpressions**
   - 全体を削除
   - CustomMethodSecurityExpressionRootに統合

### 3.2 修正対象

#### RolePermission.kt
```kotlin
// Before（文字列ベース）
data class RolePermission(
    val permissionRule: String  // "table.edit.all"
)

// After（型安全）
data class RolePermission(
    val roleId: UUID,
    val permissionRule: PermissionRule,  // 型安全なオブジェクト
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    // 互換性のための文字列変換
    fun toPermissionString(): String = permissionRule.toAuthorityString()
}
```

#### PermissionService.kt
```kotlin
// Before
fun hasPermissionForResource(
    userRules: List<PermissionRule>,
    resourceId: UUID,
    requiredAction: Action  // ← ここは正しい
): Boolean

// After（変更不要、既に正しい）
// このメソッドは既にActionを使用しているので変更不要
```

## 4. 用語の統一ガイドライン

### 4.1 正式用語

| 概念 | 正式用語 | 説明 | 使用禁止用語 |
|-----|---------|------|-------------|
| 権限ルール | PermissionRule | ResourceType + Action + Scopeの組み合わせ | Permission（単体では使わない） |
| 操作 | Action | VIEW, CREATE, EDIT, DELETE, MANAGE | Permission（動詞として） |
| リソースタイプ | ResourceType | TABLE, DOCUMENT等 | Resource（単体） |
| スコープ | Scope | ALL, TEAM, OWN, RESOURCE_GROUP, RESOURCE_ID | Range, Level |

### 4.2 命名規則

```kotlin
// 良い例
hasPermissionRule()       // 権限ルールを持っているか
canPerformAction()        // アクションを実行できるか
isInScope()              // スコープ内にあるか
evaluatePermissionRule()  // 権限ルールを評価

// 悪い例
hasPermission()          // 曖昧：何のPermission？
checkAccess()           // 曖昧：どうチェック？
validate()              // 曖昧：何を検証？
```

## 5. 実装チェックリスト

### Phase 1: モデル層の統一
- [ ] Action enumを正式に確立
- [ ] Permission enumが存在する場合は削除
- [ ] PermissionRuleの構造を修正（action → 維持、他は整合性確認）
- [ ] Scope enumにRESOURCE_GROUP, RESOURCE_IDを追加

### Phase 2: 文字列処理の排除
- [ ] RolePermission.ktの文字列メソッドを削除
- [ ] PermissionRule.fromString()を型安全に
- [ ] 文字列分割（split(".")）の排除

### Phase 3: Service層の統一
- [ ] AuthorizationServiceの用語統一
- [ ] PermissionServiceの整合性確認
- [ ] ResourceAccessEvaluatorの修正

### Phase 4: Controller層の修正
- [ ] @PreAuthorizeアノテーションの統一
- [ ] メソッド名の統一（hasPermissionRule等）

## 6. 移行時の互換性維持

### 6.1 ブリッジメソッド

移行期間中は以下のブリッジメソッドを提供：

```kotlin
/**
 * 移行用：文字列からPermissionRuleへの変換
 * @deprecated 移行完了後に削除
 */
@Deprecated("Use PermissionRule directly")
fun parsePermissionString(permission: String): PermissionRule? {
    val parts = permission.split(".")
    if (parts.size != 3) return null
    
    val resourceType = ResourceType.valueOf(parts[0].uppercase())
    val action = Action.valueOf(parts[1].uppercase())
    val scopePart = parts[2]
    
    return when {
        scopePart in listOf("all", "team", "own") -> {
            GeneralRule(resourceType, action, Scope.valueOf(scopePart.uppercase()))
        }
        scopePart.startsWith("resource_group:") -> {
            val groupId = UUID.fromString(scopePart.substringAfter(":"))
            ResourceGroupRule(resourceType, action, groupId)
        }
        scopePart.startsWith("resource_id:") -> {
            val resourceId = UUID.fromString(scopePart.substringAfter(":"))
            ResourceIdRule(resourceType, action, resourceId)
        }
        else -> null
    }
}
```

### 6.2 データベース移行

```sql
-- 既存の文字列ベース権限を保持しつつ、新形式も格納
ALTER TABLE role_permissions 
ADD COLUMN permission_rule_json JSONB;

-- 移行スクリプト
UPDATE role_permissions
SET permission_rule_json = 
    CASE 
        WHEN permission_rule LIKE '%.%.all' THEN 
            jsonb_build_object(
                'type', 'GeneralRule',
                'resourceType', split_part(permission_rule, '.', 1),
                'action', split_part(permission_rule, '.', 2),
                'scope', 'ALL'
            )
        -- 他のパターンも同様に...
    END;
```

## 7. 最終的な理想形

### 7.1 シンプルで一貫性のある権限チェック

```kotlin
// Controller層
@PreAuthorize("canPerformAction(#id, 'TABLE', 'VIEW')")
fun getTable(@PathVariable id: UUID): TableDto

// Service層
fun canPerformAction(
    resourceId: UUID, 
    resourceType: ResourceType, 
    action: Action
): Boolean {
    val userRules = getUserPermissionRules()
    return evaluatePermissionRules(userRules, resourceId, resourceType, action)
}

// 評価エンジン
fun evaluatePermissionRules(
    rules: Set<PermissionRule>,
    resourceId: UUID,
    resourceType: ResourceType,
    action: Action
): Boolean {
    // Scope階層に従って評価（ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_ID）
    return rules.any { rule ->
        rule.resourceType == resourceType &&
        rule.action == action &&
        evaluateScope(rule.scope, resourceId)
    }
}
```

### 7.2 明確な責任分離

1. **PermissionRule**: 権限の定義（What）
2. **AuthorizationService**: 権限の評価（How）
3. **Controller**: 権限の適用（Where）
4. **ResourceGroupService**: グループ管理（Who）

## 8. まとめ

現在のシステムは以下の問題を抱えています：

1. **Action vs Permission の概念的重複**
2. **文字列ベースと型安全の混在**
3. **PermissionRuleの構造的矛盾**

これらを解決するため：

1. **PermissionRule = ResourceType + Action + Scope** を徹底
2. **Action**を正式な用語として統一使用
3. **文字列処理を排除**し、型安全な実装に統一
4. **用語と命名規則**を明確化

この統一により、保守性が向上し、新機能の追加が容易になり、バグの発生を防ぐことができます。