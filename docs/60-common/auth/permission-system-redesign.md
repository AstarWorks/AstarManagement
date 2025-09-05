# 権限システム根本的再設計仕様書

## 1. 概要

### 1.1 背景と問題点

現在の権限システムには以下の根本的な問題が存在する：

1. **String評価の脆弱性**: 権限評価が文字列分割（"醜悪String"）に依存し、型安全性が欠如
2. **Scope概念の混乱**: "edit", "view"などのActionがScopeとして誤用されている
3. **限定的なScope**: ALL, TEAM, OWNの3つしか存在せず、柔軟性に欠ける
4. **Controller層の破損**: `@tableSecurityExpressions`への20箇所の参照が機能していない

### 1.2 再設計の目的

- **型安全性の確保**: Enum基盤の権限評価システム
- **Scope階層の確立**: ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_ID
- **ResourceGroup概念**: リソースのUserRole版として、柔軟なグループベースアクセス制御
- **RESTful設計**: 一覧取得時の権限フィルタリング、個別リソースの権限チェック

## 2. 新しい権限モデル

### 2.1 Scope階層

```kotlin
enum class Scope {
    ALL,            // 全リソースへのアクセス権
    TEAM,           // チーム所有リソースへのアクセス権
    OWN,            // 個人所有リソースへのアクセス権
    RESOURCE_GROUP, // リソースグループ経由のアクセス権
    RESOURCE_ID     // 特定リソースインスタンスへのアクセス権
}
```

**階層関係**: ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_ID

### 2.2 PermissionとActionの明確な分離

```kotlin
// Permission: 何をするか
enum class Permission {
    VIEW,    // 閲覧
    CREATE,  // 作成
    EDIT,    // 編集
    DELETE,  // 削除
    MANAGE,  // 管理（全権限）
    EXPORT,  // エクスポート
    IMPORT   // インポート
}

// ResourceType: 何に対して
enum class ResourceType {
    TABLE,
    RECORD,
    DOCUMENT,
    WORKSPACE,
    TENANT,
    USER,
    ROLE,
    PROPERTY_TYPE
}
```

### 2.3 PermissionRule設計

```kotlin
sealed class PermissionRule {
    
    /**
     * 一般的なスコープベース権限
     * 例: "table.view.all", "document.edit.team"
     */
    data class GeneralRule(
        val resourceType: ResourceType,
        val permission: Permission,
        val scope: Scope  // ALL, TEAM, OWN のみ
    ) : PermissionRule()
    
    /**
     * リソースグループベース権限
     * 例: "table.edit.resource_group:project-a-id"
     */
    data class ResourceGroupRule(
        val resourceType: ResourceType,
        val permission: Permission,
        val groupId: UUID  // 動的に指定されるグループID
    ) : PermissionRule()
    
    /**
     * 特定リソースインスタンス権限
     * 例: "table.view.resource_id:123e4567-..."
     */
    data class ResourceIdRule(
        val resourceType: ResourceType,
        val permission: Permission,
        val resourceId: UUID  // 動的に指定されるリソースID
    ) : PermissionRule()
}
```

## 3. ResourceGroup概念

### 3.1 定義

ResourceGroupは「リソースのUserRole版」として、リソースを論理的にグループ化する仕組み。

```kotlin
/**
 * リソースグループ
 * 部署、プロジェクト、クライアント、セキュリティレベルなどを表現
 */
data class ResourceGroup(
    val id: UUID,
    val tenantId: UUID,
    val name: String,
    val description: String?,
    val resourceType: ResourceType,
    val metadata: Map<String, Any> = emptyMap()
)

/**
 * リソースのグループ所属関係
 * 1つのリソースは複数のグループに所属可能
 */
data class ResourceGroupMembership(
    val resourceId: UUID,
    val groupId: UUID,
    val joinedAt: Instant
)
```

### 3.2 ユースケース

- **部署別アクセス**: 経理部、営業部などの部署単位でリソースを管理
- **プロジェクト別アクセス**: プロジェクトA、プロジェクトBなどプロジェクト単位
- **クライアント別アクセス**: 顧客X、顧客Yなどクライアント単位
- **セキュリティレベル**: 機密レベル1、機密レベル2などのセキュリティ分類

## 4. 権限評価フロー

### 4.1 基本評価ロジック（OR評価）

```kotlin
fun canAccessResource(userId: UUID, resourceId: UUID, permission: Permission): Boolean {
    // 1. ALL scope - 最強の権限
    if (hasPermission("${resourceType}.${permission}.all")) return true
    
    // 2. TEAM scope - チーム権限
    if (hasPermission("${resourceType}.${permission}.team") && isTeamResource(resourceId)) {
        return true
    }
    
    // 3. OWN scope - 所有権
    if (hasPermission("${resourceType}.${permission}.own") && isOwnResource(resourceId)) {
        return true
    }
    
    // 4. RESOURCE_GROUP scope - グループ権限
    if (hasPermission("${resourceType}.${permission}.resource_group")) {
        val resourceGroups = getResourceGroups(resourceId)
        val userPermittedGroups = getUserPermittedGroups(userId)
        if (resourceGroups.intersect(userPermittedGroups).isNotEmpty()) return true
    }
    
    // 5. RESOURCE_ID scope - 個別権限
    if (hasPermission("${resourceType}.${permission}.resource_id:${resourceId}")) {
        return true
    }
    
    return false
}
```

### 4.2 将来の拡張（AND評価）

```kotlin
// 将来的にCompositeRuleで実現
data class CompositeRule(
    val rules: List<PermissionRule>,
    val operator: LogicalOperator  // AND or OR
) : PermissionRule()
```

## 5. Controller層の実装パターン

### 5.1 リソース一覧取得（RESTfulパターン）

```kotlin
@RestController
@RequestMapping("/api/tables")
class TableController {
    
    /**
     * テーブル一覧取得
     * - 認証済みユーザーは誰でもアクセス可能
     * - 結果は権限に基づいてフィルタリング
     * - 0件でも正常応答（空リスト）
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun listTables(
        @RequestParam(required = false) workspaceId: UUID?,
        @RequestParam(required = false) resourceGroupId: UUID?,
        @PageableDefault pageable: Pageable
    ): Page<TableDto> {
        return tableService.findAccessibleTables(workspaceId, resourceGroupId, pageable)
    }
}
```

### 5.2 個別リソースアクセス

```kotlin
/**
 * 特定テーブルの取得
 * 権限チェックは階層的にOR評価
 */
@GetMapping("/{id}")
@PreAuthorize("""
    hasPermissionRule('table.view.all') or
    (hasPermissionRule('table.view.team') and isTeamResource(#id, 'TABLE')) or
    (hasPermissionRule('table.view.own') and isOwnResource(#id, 'TABLE')) or
    (hasPermissionRule('table.view.resource_group') and isInResourceGroup(#id, 'TABLE')) or
    hasPermissionRule('table.view.resource_id', #id)
""")
fun getTable(@PathVariable id: UUID): TableDto {
    return tableService.findById(id)
}
```

### 5.3 リソース作成

```kotlin
/**
 * テーブル作成
 * ワークスペースレベルの権限チェック
 */
@PostMapping
@PreAuthorize("""
    hasPermissionRule('table.create.all') or
    hasPermissionRule('table.create.own') or
    (hasPermissionRule('table.create.team') and canAccessWorkspace(#request.workspaceId, 'WORKSPACE', 'EDIT'))
""")
fun createTable(@RequestBody request: CreateTableRequest): TableDto {
    return tableService.create(request)
}
```

## 6. Service層の実装

### 6.1 AuthorizationService

```kotlin
@Service
class AuthorizationService {
    
    /**
     * ユーザーの有効な権限ルールを取得
     * 複数ロールからの権限を集約（OR評価）
     */
    fun getUserEffectivePermissionRules(tenantUserId: UUID): Set<PermissionRule> {
        val roles = userRoleService.getUserRoles(tenantUserId)
        return roles.flatMap { role ->
            rolePermissionService.getRolePermissionRules(role.id)
        }.toSet()
    }
    
    /**
     * 特定リソースへのアクセス権限チェック
     * 型安全な評価を実行
     */
    fun canAccessResource(
        tenantUserId: UUID,
        resourceId: UUID,
        resourceType: ResourceType,
        permission: Permission
    ): Boolean {
        val userRules = getUserEffectivePermissionRules(tenantUserId)
        
        // Scope階層に沿って評価（OR条件）
        return evaluateScopeHierarchy(userRules, resourceId, resourceType, permission)
    }
}
```

### 6.2 ResourceGroupService

```kotlin
@Service
class ResourceGroupService {
    
    /**
     * リソースグループの作成
     */
    fun createResourceGroup(
        name: String,
        resourceType: ResourceType,
        metadata: Map<String, Any> = emptyMap()
    ): ResourceGroup {
        val tenantId = tenantContextService.getCurrentTenantId()
        return resourceGroupRepository.save(
            ResourceGroup(
                id = UUID.randomUUID(),
                tenantId = tenantId,
                name = name,
                resourceType = resourceType,
                metadata = metadata
            )
        )
    }
    
    /**
     * リソースをグループに追加
     * 1つのリソースは複数グループに所属可能
     */
    fun addResourceToGroup(resourceId: UUID, groupId: UUID) {
        resourceGroupMembershipRepository.save(
            ResourceGroupMembership(
                resourceId = resourceId,
                groupId = groupId,
                joinedAt = Instant.now()
            )
        )
    }
    
    /**
     * ユーザーがアクセス可能なグループを取得
     */
    fun getUserPermittedGroups(
        tenantUserId: UUID,
        resourceType: ResourceType,
        permission: Permission
    ): Set<UUID> {
        val rules = authorizationService.getUserEffectivePermissionRules(tenantUserId)
        return rules.filterIsInstance<ResourceGroupRule>()
            .filter { it.resourceType == resourceType && it.permission == permission }
            .map { it.groupId }
            .toSet()
    }
}
```

### 6.3 権限フィルタリング実装

```kotlin
@Service
class TableService {
    
    fun findAccessibleTables(
        workspaceId: UUID?,
        resourceGroupId: UUID?,
        pageable: Pageable
    ): Page<TableDto> {
        val tenantUserId = getCurrentTenantUserId()
        val userRules = authorizationService.getUserEffectivePermissionRules(tenantUserId)
        
        val specification = buildAccessSpecification(tenantUserId, userRules, workspaceId, resourceGroupId)
        val results = tableRepository.findAll(specification, pageable)
        
        // 空の結果も正常応答
        return results.map { it.toDto() }
    }
    
    private fun buildAccessSpecification(
        tenantUserId: UUID,
        userRules: Set<PermissionRule>,
        workspaceId: UUID?,
        resourceGroupId: UUID?
    ): Specification<TableEntity> {
        return Specification { root, query, cb ->
            val predicates = mutableListOf<Predicate>()
            
            // ワークスペースフィルタ
            workspaceId?.let {
                predicates.add(cb.equal(root.get<UUID>("workspaceId"), it))
            }
            
            // 権限に基づくアクセス条件（OR評価）
            val accessPredicates = mutableListOf<Predicate>()
            
            // 1. ALL scope
            if (hasViewAllPermission(userRules)) {
                // すべて見える - 追加条件なし
                return@Specification cb.and(*predicates.toTypedArray())
            }
            
            // 2. TEAM scope
            if (hasViewTeamPermission(userRules)) {
                val teamIds = teamService.getUserTeamIds(tenantUserId)
                if (teamIds.isNotEmpty()) {
                    accessPredicates.add(root.get<UUID>("teamId").`in`(teamIds))
                }
            }
            
            // 3. OWN scope
            if (hasViewOwnPermission(userRules)) {
                accessPredicates.add(cb.equal(root.get<UUID>("createdBy"), tenantUserId))
            }
            
            // 4. RESOURCE_GROUP scope
            if (hasViewResourceGroupPermission(userRules)) {
                val groupIds = extractResourceGroupIds(userRules)
                if (groupIds.isNotEmpty()) {
                    val subquery = createResourceGroupSubquery(query, cb, groupIds)
                    accessPredicates.add(root.get<UUID>("id").`in`(subquery))
                }
            }
            
            // 5. RESOURCE_ID scope
            val specificIds = extractSpecificResourceIds(userRules)
            if (specificIds.isNotEmpty()) {
                accessPredicates.add(root.get<UUID>("id").`in`(specificIds))
            }
            
            // OR条件で結合
            if (accessPredicates.isNotEmpty()) {
                predicates.add(cb.or(*accessPredicates.toTypedArray()))
            } else {
                // アクセス可能なリソースがない
                predicates.add(cb.disjunction())
            }
            
            cb.and(*predicates.toTypedArray())
        }
    }
}
```

## 7. CustomMethodSecurityExpressionRoot

```kotlin
@Component
class CustomMethodSecurityExpressionRoot(
    private val authorizationService: AuthorizationService,
    private val resourceGroupService: ResourceGroupService,
    private val teamMembershipService: TeamMembershipService,
    private val resourceOwnershipService: ResourceOwnershipService
) : SecurityExpressionRoot, MethodSecurityExpressionOperations {
    
    /**
     * 権限ルールチェック（動的パラメータ対応）
     * @param rule 権限ルール文字列
     * @param resourceId オプション：動的リソースID
     */
    fun hasPermissionRule(rule: String, resourceId: UUID? = null): Boolean {
        val tenantUserId = getCurrentTenantUserId() ?: return false
        
        if (resourceId != null) {
            // リソースIDが指定されている場合、スコープに応じた評価
            return evaluateWithResourceContext(tenantUserId, rule, resourceId)
        }
        
        // 通常の権限チェック
        val permissionRule = PermissionRule.fromString(rule) ?: return false
        return authorizationService.hasPermissionRule(tenantUserId, permissionRule)
    }
    
    /**
     * チームリソースチェック
     */
    fun isTeamResource(resourceId: UUID, resourceType: String): Boolean {
        val tenantUserId = getCurrentTenantUserId() ?: return false
        return teamMembershipService.isTeamResource(tenantUserId, resourceId)
    }
    
    /**
     * 所有リソースチェック
     */
    fun isOwnResource(resourceId: UUID, resourceType: String): Boolean {
        val tenantUserId = getCurrentTenantUserId() ?: return false
        return resourceOwnershipService.isOwner(tenantUserId, resourceId)
    }
    
    /**
     * ResourceGroup所属チェック
     */
    fun isInResourceGroup(resourceId: UUID, resourceType: String): Boolean {
        val tenantUserId = getCurrentTenantUserId() ?: return false
        val userGroups = resourceGroupService.getUserPermittedGroups(
            tenantUserId,
            ResourceType.valueOf(resourceType),
            Permission.VIEW
        )
        val resourceGroups = resourceGroupService.getResourceGroups(resourceId)
        return userGroups.intersect(resourceGroups).isNotEmpty()
    }
    
    /**
     * 複数権限のOR評価
     */
    fun hasAnyPermissionRule(rules: List<String>): Boolean {
        return rules.any { hasPermissionRule(it) }
    }
}
```

## 8. 移行計画

### 8.1 破壊的変更箇所

#### TableController - 17箇所
- Line 53, 90: `canCreateTable` → 新形式
- Line 121: `canViewTablesInWorkspace` → 認証のみ
- Line 159, 399, 614: `canViewTable` → OR評価
- Line 192, 262, 291, 345, 373: `canEditTable` → OR評価
- Line 236: `canDeleteTable` → OR評価
- Line 425: `canDuplicateTable` → OR評価
- Line 487: `canExportTable` → OR評価
- Line 559: `canImportTable` → OR評価

#### RecordController - 3箇所
- Line 50, 75: `canCreateRecord` → 新形式
- Line 100: `canViewTableRecords` → 認証のみ＋フィルタリング

### 8.2 実装フェーズ

1. **Phase 1**: ドキュメント作成 ✓
2. **Phase 2**: Scope拡張実装
3. **Phase 3**: ResourceGroup基盤実装
4. **Phase 4**: Permission/Action分離
5. **Phase 5**: PermissionRule型安全評価エンジン
6. **Phase 6**: Controller層修正
7. **Phase 7**: Service層修正
8. **Phase 8**: テスト実装

## 9. 典型的な権限設定例

### 9.1 アクセスパターン別権限設定

```yaml
# システム管理者
permissions:
  - table.view.all
  - table.edit.all
  - table.delete.all
  - table.manage.all

# 部門長
permissions:
  - table.view.team
  - table.edit.team
  - table.create.team
  - table.delete.own

# プロジェクトマネージャー
permissions:
  - table.view.resource_group:project-a
  - table.edit.resource_group:project-a
  - table.delete.resource_group:project-a

# 一般社員
permissions:
  - table.view.team
  - table.view.own
  - table.edit.own
  - table.create.own

# 外部コラボレーター
permissions:
  - table.view.resource_group:client-x
  - table.view.resource_id:specific-table-id

# 監査役（読み取り専用）
permissions:
  - table.view.all
  - document.view.all
  - record.view.all
  - table.export.all
```

### 9.2 リソースアクセスのユースケース

| ユーザータイプ | Scope | ユースケース |
|------------|-------|-----------|
| システム管理者 | ALL | すべてのテーブルを管理 |
| 部門長 | TEAM | 部門内のテーブルを管理 |
| プロジェクトマネージャー | RESOURCE_GROUP | プロジェクト関連テーブルを管理 |
| 一般社員 | OWN + TEAM(View) | 自分のテーブル編集＋チームテーブル閲覧 |
| 外部コラボレーター | RESOURCE_ID | 特定テーブルのみアクセス |

## 10. まとめ

この再設計により：

1. **型安全性**: String評価を排除し、Enumベースの型安全な評価を実現
2. **柔軟性**: 5段階のScope階層により、きめ細かい権限制御が可能
3. **拡張性**: ResourceGroup概念により、組織構造に応じた権限管理が可能
4. **RESTful**: 一覧取得時の権限フィルタリング、個別リソースの適切な権限チェック
5. **保守性**: 明確な責任分離と一貫した実装パターン

"醜悪String"評価から脱却し、型安全で拡張可能な権限システムを実現する。