# Scope階層設計書

## 1. 概要

本ドキュメントでは、権限システムにおけるScope階層の設計と、Permission（Action）との明確な分離について定義します。

## 2. 問題の背景

### 2.1 現在の混乱

現在のシステムでは、以下の概念的混乱が存在します：

```kotlin
// 問題のあるコード例
canAccessWorkspace(workspaceId, "edit")  // "edit"はActionなのにScopeとして使用
```

- **Permission（Action）**: `VIEW`, `EDIT`, `DELETE` など「何をするか」
- **Scope**: `ALL`, `TEAM`, `OWN` など「どの範囲で」

これらが混在し、文字列ベースで処理されているため、型安全性が失われています。

### 2.2 解決方針

1. PermissionとScopeを明確に分離
2. Enum基盤の型安全な設計
3. 階層的なScope評価（ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_ID）

## 3. Scope階層の定義

### 3.1 Scope Enum

```kotlin
/**
 * リソースアクセスのスコープ（範囲）を定義
 * 階層順: ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_ID
 */
enum class Scope {
    /**
     * ALL: 全リソースへのアクセス
     * - システム管理者向け
     * - テナント内のすべてのリソースにアクセス可能
     */
    ALL,
    
    /**
     * TEAM: チーム所有リソースへのアクセス
     * - チームメンバー向け
     * - 同じチームに所属するリソースにアクセス可能
     */
    TEAM,
    
    /**
     * OWN: 個人所有リソースへのアクセス
     * - 一般ユーザー向け
     * - 自分が作成/所有するリソースにアクセス可能
     */
    OWN,
    
    /**
     * RESOURCE_GROUP: グループ経由のアクセス
     * - 動的グループメンバー向け
     * - 特定のResourceGroupに所属するリソースにアクセス可能
     */
    RESOURCE_GROUP,
    
    /**
     * RESOURCE_ID: 特定リソースインスタンスへのアクセス
     * - 個別権限付与向け
     * - 明示的に指定されたリソースのみアクセス可能
     */
    RESOURCE_ID;
    
    /**
     * スコープの強さを比較
     * @return このスコープが他のスコープより強い場合true
     */
    fun isStrongerThan(other: Scope): Boolean {
        return this.ordinal < other.ordinal
    }
    
    /**
     * スコープが他のスコープを包含するかチェック
     */
    fun includes(other: Scope): Boolean {
        return this.ordinal <= other.ordinal
    }
}
```

### 3.2 階層関係

```
ALL (最強)
 ├─> TEAM
 │    └─> OWN
 └─> RESOURCE_GROUP
      └─> RESOURCE_ID (最弱)
```

- **ALL**: すべてを包含
- **TEAM**: OWNを包含
- **RESOURCE_GROUP**: RESOURCE_IDを包含可能（設定による）

## 4. PermissionとScopeの分離

### 4.1 Permission（Action）の定義

```kotlin
/**
 * リソースに対する操作を定義
 * 「何をするか」を表現
 */
enum class Permission {
    VIEW,    // 閲覧
    CREATE,  // 作成
    EDIT,    // 編集
    DELETE,  // 削除
    EXPORT,  // エクスポート
    IMPORT,  // インポート
    MANAGE;  // 管理（全権限）
    
    /**
     * MANAGEは他のすべての権限を包含
     */
    fun includes(other: Permission): Boolean {
        return this == MANAGE || this == other
    }
}
```

### 4.2 ResourceTypeの定義

```kotlin
/**
 * 権限制御の対象となるリソースタイプ
 * 「何に対して」を表現
 */
enum class ResourceType {
    TABLE,         // テーブル
    RECORD,        // レコード
    DOCUMENT,      // ドキュメント
    WORKSPACE,     // ワークスペース
    TENANT,        // テナント
    USER,          // ユーザー
    ROLE,          // ロール
    PROPERTY_TYPE, // プロパティタイプ
    RESOURCE_GROUP // リソースグループ自体
}
```

## 5. 権限表現の構造

### 5.1 権限文字列フォーマット

```
{ResourceType}.{Permission}.{Scope}[:{Identifier}]
```

例：
- `table.view.all` - すべてのテーブルを閲覧
- `document.edit.team` - チームのドキュメントを編集
- `table.view.resource_group:project-a` - プロジェクトAのテーブルを閲覧
- `document.edit.resource_id:doc-123` - 特定ドキュメントを編集

### 5.2 PermissionRuleの型安全な表現

```kotlin
sealed class PermissionRule {
    abstract val resourceType: ResourceType
    abstract val permission: Permission
    
    /**
     * スコープベースの一般的な権限
     */
    data class GeneralRule(
        override val resourceType: ResourceType,
        override val permission: Permission,
        val scope: Scope  // ALL, TEAM, OWN
    ) : PermissionRule() {
        init {
            require(scope in listOf(Scope.ALL, Scope.TEAM, Scope.OWN)) {
                "GeneralRule only supports ALL, TEAM, OWN scopes"
            }
        }
    }
    
    /**
     * ResourceGroup経由の権限
     */
    data class ResourceGroupRule(
        override val resourceType: ResourceType,
        override val permission: Permission,
        val groupId: UUID
    ) : PermissionRule() {
        val scope = Scope.RESOURCE_GROUP
    }
    
    /**
     * 特定リソースへの権限
     */
    data class ResourceIdRule(
        override val resourceType: ResourceType,
        override val permission: Permission,
        val resourceId: UUID
    ) : PermissionRule() {
        val scope = Scope.RESOURCE_ID
    }
}
```

## 6. 権限評価ロジック

### 6.1 基本的な評価フロー

```kotlin
class ScopeEvaluator(
    private val teamMembershipService: TeamMembershipService,
    private val resourceOwnershipService: ResourceOwnershipService,
    private val resourceGroupService: ResourceGroupService
) {
    
    /**
     * スコープに基づく権限評価
     * 階層順に評価し、最初にマッチしたらtrue（OR評価）
     */
    fun evaluateAccess(
        userId: UUID,
        resourceId: UUID,
        resourceType: ResourceType,
        permission: Permission,
        userRules: Set<PermissionRule>
    ): Boolean {
        // 1. ALL scope - 最強の権限
        if (hasScope(userRules, resourceType, permission, Scope.ALL)) {
            logger.debug("Access granted via ALL scope")
            return true
        }
        
        // 2. TEAM scope - チーム権限
        if (hasScope(userRules, resourceType, permission, Scope.TEAM)) {
            val isTeamResource = teamMembershipService.isTeamResource(userId, resourceId)
            if (isTeamResource) {
                logger.debug("Access granted via TEAM scope")
                return true
            }
        }
        
        // 3. OWN scope - 所有権
        if (hasScope(userRules, resourceType, permission, Scope.OWN)) {
            val isOwnResource = resourceOwnershipService.isOwner(userId, resourceId)
            if (isOwnResource) {
                logger.debug("Access granted via OWN scope")
                return true
            }
        }
        
        // 4. RESOURCE_GROUP scope - グループ権限
        val groupRules = userRules.filterIsInstance<ResourceGroupRule>()
            .filter { it.resourceType == resourceType && it.permission == permission }
        
        if (groupRules.isNotEmpty()) {
            val resourceGroups = resourceGroupService.getResourceGroups(resourceId)
            val userGroups = groupRules.map { it.groupId }.toSet()
            
            if (resourceGroups.intersect(userGroups).isNotEmpty()) {
                logger.debug("Access granted via RESOURCE_GROUP scope")
                return true
            }
        }
        
        // 5. RESOURCE_ID scope - 個別権限
        val idRules = userRules.filterIsInstance<ResourceIdRule>()
            .filter { 
                it.resourceType == resourceType && 
                it.permission == permission && 
                it.resourceId == resourceId 
            }
        
        if (idRules.isNotEmpty()) {
            logger.debug("Access granted via RESOURCE_ID scope")
            return true
        }
        
        logger.debug("Access denied - no matching scope")
        return false
    }
    
    private fun hasScope(
        rules: Set<PermissionRule>,
        resourceType: ResourceType,
        permission: Permission,
        scope: Scope
    ): Boolean {
        return rules.filterIsInstance<GeneralRule>().any {
            it.resourceType == resourceType &&
            it.permission == permission &&
            it.scope == scope
        }
    }
}
```

### 6.2 Scope階層を考慮した最適化

```kotlin
class OptimizedScopeEvaluator {
    
    /**
     * 早期リターンによる最適化された評価
     */
    fun evaluateAccessOptimized(
        userId: UUID,
        resourceId: UUID,
        resourceType: ResourceType,
        permission: Permission,
        userRules: Set<PermissionRule>
    ): Boolean {
        // MANAGEは全権限を包含
        if (hasManagePermission(userRules, resourceType)) {
            return true
        }
        
        // スコープ別にルールを分類
        val rulesByScope = classifyRulesByScope(userRules, resourceType, permission)
        
        // ALL scopeがあれば即座にtrue
        if (rulesByScope.containsKey(Scope.ALL)) {
            return true
        }
        
        // 必要な場合のみリソース情報を取得（遅延評価）
        var resourceInfo: ResourceInfo? = null
        
        // TEAM scope評価
        if (rulesByScope.containsKey(Scope.TEAM)) {
            resourceInfo = resourceInfo ?: loadResourceInfo(resourceId)
            if (isTeamMember(userId, resourceInfo.teamId)) {
                return true
            }
        }
        
        // OWN scope評価
        if (rulesByScope.containsKey(Scope.OWN)) {
            resourceInfo = resourceInfo ?: loadResourceInfo(resourceId)
            if (resourceInfo.ownerId == userId || resourceInfo.createdBy == userId) {
                return true
            }
        }
        
        // RESOURCE_GROUP scope評価
        val groupRules = rulesByScope[Scope.RESOURCE_GROUP]
        if (!groupRules.isNullOrEmpty()) {
            val userGroups = groupRules.filterIsInstance<ResourceGroupRule>()
                .map { it.groupId }.toSet()
            val resourceGroups = resourceGroupService.getResourceGroups(resourceId)
            
            if (userGroups.intersect(resourceGroups).isNotEmpty()) {
                return true
            }
        }
        
        // RESOURCE_ID scope評価
        val idRules = rulesByScope[Scope.RESOURCE_ID]
        if (!idRules.isNullOrEmpty()) {
            return idRules.filterIsInstance<ResourceIdRule>()
                .any { it.resourceId == resourceId }
        }
        
        return false
    }
}
```

## 7. Controller層での活用

### 7.1 @PreAuthorizeでの使用

```kotlin
@RestController
@RequestMapping("/api/tables")
class TableController {
    
    /**
     * スコープ階層を活用した権限チェック
     */
    @GetMapping("/{id}")
    @PreAuthorize("""
        hasScope('TABLE', 'VIEW', 'ALL') or
        (hasScope('TABLE', 'VIEW', 'TEAM') and isTeamResource(#id)) or
        (hasScope('TABLE', 'VIEW', 'OWN') and isOwnResource(#id)) or
        hasResourceGroupAccess(#id, 'TABLE', 'VIEW') or
        hasResourceIdAccess(#id, 'TABLE', 'VIEW')
    """)
    fun getTable(@PathVariable id: UUID): TableDto {
        return tableService.findById(id)
    }
    
    /**
     * 簡略化されたバージョン（内部で階層評価）
     */
    @PutMapping("/{id}")
    @PreAuthorize("canAccessResource(#id, 'TABLE', 'EDIT')")
    fun updateTable(
        @PathVariable id: UUID,
        @RequestBody request: UpdateTableRequest
    ): TableDto {
        return tableService.update(id, request)
    }
}
```

### 7.2 CustomMethodSecurityExpressionRoot

```kotlin
@Component
class CustomMethodSecurityExpressionRoot {
    
    /**
     * 特定スコープの権限チェック
     */
    fun hasScope(
        resourceType: String,
        permission: String,
        scope: String
    ): Boolean {
        val userId = getCurrentUserId() ?: return false
        val rule = GeneralRule(
            resourceType = ResourceType.valueOf(resourceType),
            permission = Permission.valueOf(permission),
            scope = Scope.valueOf(scope)
        )
        
        return authorizationService.hasPermissionRule(userId, rule)
    }
    
    /**
     * リソースへの総合的なアクセスチェック
     * 内部でScope階層を評価
     */
    fun canAccessResource(
        resourceId: UUID,
        resourceType: String,
        permission: String
    ): Boolean {
        val userId = getCurrentUserId() ?: return false
        
        return scopeEvaluator.evaluateAccess(
            userId = userId,
            resourceId = resourceId,
            resourceType = ResourceType.valueOf(resourceType),
            permission = Permission.valueOf(permission),
            userRules = authorizationService.getUserRules(userId)
        )
    }
    
    /**
     * チームリソースチェック（TEAM scope用）
     */
    fun isTeamResource(resourceId: UUID): Boolean {
        val userId = getCurrentUserId() ?: return false
        return teamMembershipService.isTeamResource(userId, resourceId)
    }
    
    /**
     * 所有リソースチェック（OWN scope用）
     */
    fun isOwnResource(resourceId: UUID): Boolean {
        val userId = getCurrentUserId() ?: return false
        return resourceOwnershipService.isOwner(userId, resourceId)
    }
    
    /**
     * ResourceGroupアクセスチェック
     */
    fun hasResourceGroupAccess(
        resourceId: UUID,
        resourceType: String,
        permission: String
    ): Boolean {
        val userId = getCurrentUserId() ?: return false
        val userGroups = resourceGroupService.getUserPermittedGroups(
            userId,
            ResourceType.valueOf(resourceType),
            Permission.valueOf(permission)
        )
        val resourceGroups = resourceGroupService.getResourceGroups(resourceId)
        
        return userGroups.intersect(resourceGroups).isNotEmpty()
    }
}
```

## 8. Service層での実装

### 8.1 リソース一覧取得時のScope適用

```kotlin
@Service
class TableService {
    
    /**
     * Scopeに基づくフィルタリング
     */
    fun findAccessibleTables(pageable: Pageable): Page<TableDto> {
        val userId = getCurrentUserId()
        val userRules = authorizationService.getUserRules(userId)
        
        // スコープ別にクエリ条件を構築
        val specification = buildScopeSpecification(userId, userRules)
        
        return tableRepository.findAll(specification, pageable)
            .map { it.toDto() }
    }
    
    private fun buildScopeSpecification(
        userId: UUID,
        userRules: Set<PermissionRule>
    ): Specification<TableEntity> {
        return Specification { root, query, cb ->
            val predicates = mutableListOf<Predicate>()
            
            // ALL scope - 条件なし
            if (hasViewAllScope(userRules)) {
                return@Specification cb.conjunction()
            }
            
            val accessPredicates = mutableListOf<Predicate>()
            
            // TEAM scope
            if (hasViewTeamScope(userRules)) {
                val teamIds = teamService.getUserTeamIds(userId)
                if (teamIds.isNotEmpty()) {
                    accessPredicates.add(root.get<UUID>("teamId").`in`(teamIds))
                }
            }
            
            // OWN scope
            if (hasViewOwnScope(userRules)) {
                accessPredicates.add(
                    cb.or(
                        cb.equal(root.get<UUID>("createdBy"), userId),
                        cb.equal(root.get<UUID>("ownerId"), userId)
                    )
                )
            }
            
            // RESOURCE_GROUP scope
            val groupIds = extractViewGroupIds(userRules)
            if (groupIds.isNotEmpty()) {
                val subquery = createGroupMembershipSubquery(query, cb, groupIds)
                accessPredicates.add(root.get<UUID>("id").`in`(subquery))
            }
            
            // RESOURCE_ID scope
            val resourceIds = extractViewResourceIds(userRules)
            if (resourceIds.isNotEmpty()) {
                accessPredicates.add(root.get<UUID>("id").`in`(resourceIds))
            }
            
            // OR条件で結合
            if (accessPredicates.isEmpty()) {
                cb.disjunction() // 何も見えない
            } else {
                cb.or(*accessPredicates.toTypedArray())
            }
        }
    }
}
```

## 9. テスト戦略

### 9.1 Scope階層テスト

```kotlin
@Test
class ScopeHierarchyTest {
    
    @Test
    fun `ALL scope should override all other scopes`() {
        val userId = UUID.randomUUID()
        val resourceId = UUID.randomUUID()
        
        val rules = setOf(
            GeneralRule(ResourceType.TABLE, Permission.VIEW, Scope.ALL)
        )
        
        val result = scopeEvaluator.evaluateAccess(
            userId, resourceId, ResourceType.TABLE, Permission.VIEW, rules
        )
        
        assertTrue(result)
        // リソースの詳細情報を取得していないことを確認（最適化チェック）
        verify(resourceService, never()).loadResourceInfo(any())
    }
    
    @Test
    fun `TEAM scope should only grant access to team resources`() {
        val userId = UUID.randomUUID()
        val teamResourceId = UUID.randomUUID()
        val nonTeamResourceId = UUID.randomUUID()
        
        val rules = setOf(
            GeneralRule(ResourceType.TABLE, Permission.VIEW, Scope.TEAM)
        )
        
        // チームリソースへのアクセス
        whenever(teamMembershipService.isTeamResource(userId, teamResourceId))
            .thenReturn(true)
        
        assertTrue(
            scopeEvaluator.evaluateAccess(
                userId, teamResourceId, ResourceType.TABLE, Permission.VIEW, rules
            )
        )
        
        // 非チームリソースへのアクセス
        whenever(teamMembershipService.isTeamResource(userId, nonTeamResourceId))
            .thenReturn(false)
        
        assertFalse(
            scopeEvaluator.evaluateAccess(
                userId, nonTeamResourceId, ResourceType.TABLE, Permission.VIEW, rules
            )
        )
    }
    
    @Test
    fun `Multiple scopes should be evaluated with OR logic`() {
        val userId = UUID.randomUUID()
        val resourceId = UUID.randomUUID()
        
        val rules = setOf(
            GeneralRule(ResourceType.TABLE, Permission.VIEW, Scope.TEAM),
            GeneralRule(ResourceType.TABLE, Permission.VIEW, Scope.OWN)
        )
        
        // TEAMもOWNも該当しない
        whenever(teamMembershipService.isTeamResource(userId, resourceId))
            .thenReturn(false)
        whenever(resourceOwnershipService.isOwner(userId, resourceId))
            .thenReturn(false)
        
        assertFalse(
            scopeEvaluator.evaluateAccess(
                userId, resourceId, ResourceType.TABLE, Permission.VIEW, rules
            )
        )
        
        // OWNが該当
        whenever(resourceOwnershipService.isOwner(userId, resourceId))
            .thenReturn(true)
        
        assertTrue(
            scopeEvaluator.evaluateAccess(
                userId, resourceId, ResourceType.TABLE, Permission.VIEW, rules
            )
        )
    }
}
```

## 10. マイグレーション戦略

### 10.1 既存システムからの移行

```kotlin
/**
 * 既存の文字列ベース権限を新形式に変換
 */
object PermissionMigrator {
    
    fun migrateOldPermission(oldPermission: String): PermissionRule? {
        val parts = oldPermission.split(".")
        
        return when (parts.size) {
            3 -> {
                val resourceType = parseResourceType(parts[0])
                val permission = parsePermission(parts[1])
                val scopeOrId = parts[2]
                
                when {
                    scopeOrId in listOf("all", "team", "own") -> {
                        GeneralRule(
                            resourceType = resourceType,
                            permission = permission,
                            scope = Scope.valueOf(scopeOrId.uppercase())
                        )
                    }
                    scopeOrId.startsWith("uuid:") -> {
                        val uuid = UUID.fromString(scopeOrId.substring(5))
                        ResourceIdRule(
                            resourceType = resourceType,
                            permission = permission,
                            resourceId = uuid
                        )
                    }
                    else -> null
                }
            }
            else -> null
        }
    }
    
    private fun parsePermission(str: String): Permission {
        return when (str.lowercase()) {
            "view", "read" -> Permission.VIEW
            "create", "add" -> Permission.CREATE
            "edit", "update", "write" -> Permission.EDIT
            "delete", "remove" -> Permission.DELETE
            "manage", "admin" -> Permission.MANAGE
            else -> throw IllegalArgumentException("Unknown permission: $str")
        }
    }
}
```

## 11. まとめ

### 11.1 主な改善点

1. **明確な分離**: Permission（Action）とScopeの役割を明確化
2. **型安全性**: Enumベースの型安全な実装
3. **階層構造**: ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_IDの明確な階層
4. **拡張性**: 新しいScopeやPermissionの追加が容易
5. **最適化**: 階層を考慮した早期リターンによる性能改善

### 11.2 移行の利点

- 実行時エラーの削減
- IDEによる補完とリファクタリング支援
- テストの容易性向上
- ドキュメントとコードの一致