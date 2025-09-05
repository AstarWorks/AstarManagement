# ResourceGroup アーキテクチャ設計書

## 1. 概要

ResourceGroupは「リソースのUserRole版」として設計される、柔軟なリソースグルーピング機構です。
ユーザーが複数のロールを持てるように、リソースも複数のグループに所属することができます。

## 2. コンセプト

### 2.1 基本思想

```
User : Role = Resource : ResourceGroup
```

- **User** は複数の **Role** を持つことができる
- **Resource** は複数の **ResourceGroup** に所属することができる
- **Permission** は **ResourceGroup** 単位で付与される

### 2.2 動的グループ管理

ResourceGroupは完全に動的で、ユーザーが自由に作成・管理できます：

- 事前定義されたグループは存在しない
- テナントごとに独立したグループ体系
- 業界テンプレートからのインポートも可能

## 3. データモデル

### 3.1 ResourceGroup

```kotlin
/**
 * リソースグループエンティティ
 * 部署、プロジェクト、クライアント、セキュリティレベルなどを表現
 */
@Entity
@Table(name = "resource_groups")
data class ResourceGroupTable(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,
    
    @Column(name = "name", nullable = false)
    val name: String,
    
    @Column(name = "description")
    val description: String? = null,
    
    @Column(name = "resource_type", nullable = false)
    @Enumerated(EnumType.STRING)
    val resourceType: ResourceType,
    
    @Column(name = "parent_group_id")
    val parentGroupId: UUID? = null,  // 階層構造サポート（オプション）
    
    @Column(name = "metadata", columnDefinition = "jsonb")
    @Type(type = "jsonb")
    val metadata: Map<String, Any> = emptyMap(),
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "created_by", nullable = false)
    val createdBy: UUID,
    
    @Column(name = "updated_at")
    val updatedAt: Instant? = null,
    
    @Column(name = "is_active", nullable = false)
    val isActive: Boolean = true
)
```

### 3.2 ResourceGroupMembership

```kotlin
/**
 * リソースとグループの所属関係
 * M:N関係を表現
 */
@Entity
@Table(
    name = "resource_group_memberships",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["resource_id", "group_id"])
    ]
)
data class ResourceGroupMembershipTable(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "resource_id", nullable = false)
    val resourceId: UUID,
    
    @Column(name = "group_id", nullable = false)
    val groupId: UUID,
    
    @Column(name = "resource_type", nullable = false)
    @Enumerated(EnumType.STRING)
    val resourceType: ResourceType,
    
    @Column(name = "joined_at", nullable = false)
    val joinedAt: Instant = Instant.now(),
    
    @Column(name = "joined_by", nullable = false)
    val joinedBy: UUID,
    
    @Column(name = "expires_at")
    val expiresAt: Instant? = null  // 期限付きメンバーシップ（オプション）
)
```

### 3.3 UserResourceGroupPermission

```kotlin
/**
 * ユーザー（ロール）とResourceGroupの権限関係
 * どのユーザー/ロールがどのResourceGroupに対してどの権限を持つか
 */
@Entity
@Table(name = "user_resource_group_permissions")
data class UserResourceGroupPermissionTable(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "role_id", nullable = false)
    val roleId: UUID,  // ロール経由での権限付与
    
    @Column(name = "group_id", nullable = false)
    val groupId: UUID,
    
    @Column(name = "permission", nullable = false)
    @Enumerated(EnumType.STRING)
    val permission: Permission,
    
    @Column(name = "granted_at", nullable = false)
    val grantedAt: Instant = Instant.now(),
    
    @Column(name = "granted_by", nullable = false)
    val grantedBy: UUID
)
```

## 4. ユースケース

### 4.1 部署別アクセス制御

```kotlin
// 経理部グループ作成
val accountingGroup = ResourceGroup(
    name = "経理部",
    resourceType = ResourceType.TABLE,
    metadata = mapOf(
        "department" to "accounting",
        "cost_center" to "CC-001"
    )
)

// 経理部のテーブルをグループに追加
resourceGroupService.addResourceToGroup(
    resourceId = accountingTableId,
    groupId = accountingGroup.id
)

// 経理部ロールに権限付与
rolePermissionService.grantPermission(
    roleId = accountingRoleId,
    permission = "table.view.resource_group:${accountingGroup.id}"
)
```

### 4.2 プロジェクト別アクセス制御

```kotlin
// プロジェクトAグループ作成
val projectAGroup = ResourceGroup(
    name = "プロジェクトA",
    resourceType = ResourceType.TABLE,
    metadata = mapOf(
        "project_code" to "PRJ-2024-001",
        "client" to "ClientX",
        "start_date" to "2024-01-01",
        "end_date" to "2024-12-31"
    )
)

// プロジェクト関連リソースをグループに追加
projectTables.forEach { tableId ->
    resourceGroupService.addResourceToGroup(tableId, projectAGroup.id)
}

// プロジェクトメンバーのロール設定
// プロジェクトマネージャー：全権限
pmRole.permissions.add("table.manage.resource_group:${projectAGroup.id}")

// プロジェクトメンバー：編集権限
memberRole.permissions.add("table.edit.resource_group:${projectAGroup.id}")
memberRole.permissions.add("table.view.resource_group:${projectAGroup.id}")

// プロジェクト閲覧者：閲覧のみ
viewerRole.permissions.add("table.view.resource_group:${projectAGroup.id}")
```

### 4.3 クライアント別アクセス制御

```kotlin
// クライアントXグループ
val clientXGroup = ResourceGroup(
    name = "クライアントX",
    resourceType = ResourceType.TABLE,
    metadata = mapOf(
        "client_id" to "CLIENT-001",
        "contract_type" to "enterprise",
        "confidentiality_level" to "high"
    )
)

// クライアント担当者のみアクセス可能
clientManagerRole.permissions.add("table.view.resource_group:${clientXGroup.id}")
clientManagerRole.permissions.add("table.edit.resource_group:${clientXGroup.id}")
```

### 4.4 セキュリティレベル別アクセス

```kotlin
// 機密レベル2グループ
val confidentialGroup = ResourceGroup(
    name = "機密レベル2",
    resourceType = ResourceType.DOCUMENT,
    metadata = mapOf(
        "security_level" to 2,
        "requires_audit" to true,
        "encryption_required" to true
    )
)

// セキュリティクリアランスを持つロールのみ
securityClearedRole.permissions.add("document.view.resource_group:${confidentialGroup.id}")
```

## 5. 権限評価の実装

### 5.1 ResourceGroupService

```kotlin
@Service
@Transactional
class ResourceGroupService(
    private val resourceGroupRepository: ResourceGroupRepository,
    private val membershipRepository: ResourceGroupMembershipRepository,
    private val permissionRepository: UserResourceGroupPermissionRepository
) {
    
    /**
     * リソースグループの作成
     */
    fun createResourceGroup(
        name: String,
        resourceType: ResourceType,
        description: String? = null,
        metadata: Map<String, Any> = emptyMap()
    ): ResourceGroup {
        val tenantId = tenantContextService.getCurrentTenantId()
        val userId = getCurrentUserId()
        
        val group = ResourceGroupTable(
            tenantId = tenantId,
            name = name,
            description = description,
            resourceType = resourceType,
            metadata = metadata,
            createdBy = userId
        )
        
        return resourceGroupRepository.save(group).toDomain()
    }
    
    /**
     * リソースをグループに追加
     * 1つのリソースは複数のグループに所属可能
     */
    fun addResourceToGroup(
        resourceId: UUID,
        groupId: UUID,
        resourceType: ResourceType
    ): ResourceGroupMembership {
        val userId = getCurrentUserId()
        
        // 既存メンバーシップチェック
        val existing = membershipRepository.findByResourceIdAndGroupId(resourceId, groupId)
        if (existing != null) {
            return existing.toDomain()
        }
        
        val membership = ResourceGroupMembershipTable(
            resourceId = resourceId,
            groupId = groupId,
            resourceType = resourceType,
            joinedBy = userId
        )
        
        return membershipRepository.save(membership).toDomain()
    }
    
    /**
     * リソースが所属するグループを取得
     */
    fun getResourceGroups(resourceId: UUID): Set<UUID> {
        return membershipRepository
            .findByResourceId(resourceId)
            .map { it.groupId }
            .toSet()
    }
    
    /**
     * グループに所属するリソースを取得
     */
    fun getGroupResources(
        groupId: UUID,
        pageable: Pageable
    ): Page<UUID> {
        return membershipRepository
            .findByGroupId(groupId, pageable)
            .map { it.resourceId }
    }
    
    /**
     * ユーザーがアクセス権を持つグループを取得
     */
    fun getUserPermittedGroups(
        tenantUserId: UUID,
        resourceType: ResourceType,
        permission: Permission
    ): Set<UUID> {
        // ユーザーのロールを取得
        val userRoles = userRoleService.getUserRoles(tenantUserId)
        
        // 各ロールからResourceGroup権限を抽出
        return userRoles.flatMap { role ->
            permissionRepository.findByRoleIdAndPermission(role.id, permission)
                .filter { it.groupId != null }
                .map { it.groupId!! }
        }.toSet()
    }
    
    /**
     * リソースグループの階層構造を取得（オプション機能）
     */
    fun getGroupHierarchy(groupId: UUID): List<ResourceGroup> {
        val hierarchy = mutableListOf<ResourceGroup>()
        var currentGroup = resourceGroupRepository.findById(groupId).orElse(null)
        
        while (currentGroup != null) {
            hierarchy.add(currentGroup.toDomain())
            currentGroup = currentGroup.parentGroupId?.let {
                resourceGroupRepository.findById(it).orElse(null)
            }
        }
        
        return hierarchy.reversed()
    }
    
    /**
     * グループメンバーシップの有効期限チェック
     */
    fun cleanupExpiredMemberships() {
        val now = Instant.now()
        val expired = membershipRepository.findByExpiresAtBefore(now)
        membershipRepository.deleteAll(expired)
        
        logger.info("Cleaned up ${expired.size} expired group memberships")
    }
}
```

### 5.2 権限評価での活用

```kotlin
@Service
class AuthorizationService {
    
    /**
     * ResourceGroup経由でのアクセス権限チェック
     */
    fun canAccessViaResourceGroup(
        tenantUserId: UUID,
        resourceId: UUID,
        resourceType: ResourceType,
        permission: Permission
    ): Boolean {
        // リソースが所属するグループ
        val resourceGroups = resourceGroupService.getResourceGroups(resourceId)
        if (resourceGroups.isEmpty()) return false
        
        // ユーザーが権限を持つグループ
        val userPermittedGroups = resourceGroupService.getUserPermittedGroups(
            tenantUserId,
            resourceType,
            permission
        )
        
        // 交差があればアクセス可能（OR評価）
        return resourceGroups.intersect(userPermittedGroups).isNotEmpty()
    }
    
    /**
     * 複数グループの権限評価（将来的なAND評価対応）
     */
    fun canAccessWithMultipleGroups(
        tenantUserId: UUID,
        resourceId: UUID,
        requiredGroups: Set<UUID>,
        operator: LogicalOperator = LogicalOperator.OR
    ): Boolean {
        val resourceGroups = resourceGroupService.getResourceGroups(resourceId)
        val userGroups = resourceGroupService.getUserPermittedGroups(
            tenantUserId,
            ResourceType.TABLE,
            Permission.VIEW
        )
        
        return when (operator) {
            LogicalOperator.OR -> {
                // いずれかのグループに所属していればOK
                requiredGroups.any { it in resourceGroups && it in userGroups }
            }
            LogicalOperator.AND -> {
                // すべてのグループに所属している必要がある
                requiredGroups.all { it in resourceGroups && it in userGroups }
            }
        }
    }
}
```

## 6. API設計

### 6.1 ResourceGroup管理API

```kotlin
@RestController
@RequestMapping("/api/resource-groups")
@PreAuthorize("isAuthenticated()")
class ResourceGroupController(
    private val resourceGroupService: ResourceGroupService
) {
    
    /**
     * グループ作成
     */
    @PostMapping
    @PreAuthorize("hasPermissionRule('resource_group.create.all')")
    fun createGroup(
        @RequestBody request: CreateResourceGroupRequest
    ): ResourceGroupDto {
        val group = resourceGroupService.createResourceGroup(
            name = request.name,
            resourceType = request.resourceType,
            description = request.description,
            metadata = request.metadata
        )
        return group.toDto()
    }
    
    /**
     * グループ一覧取得
     */
    @GetMapping
    fun listGroups(
        @RequestParam(required = false) resourceType: ResourceType?,
        @PageableDefault pageable: Pageable
    ): Page<ResourceGroupDto> {
        return resourceGroupService.findAccessibleGroups(resourceType, pageable)
            .map { it.toDto() }
    }
    
    /**
     * リソースをグループに追加
     */
    @PostMapping("/{groupId}/resources")
    @PreAuthorize("hasPermissionRule('resource_group.edit.all') or hasPermissionRule('resource_group.edit.resource_group', #groupId)")
    fun addResourceToGroup(
        @PathVariable groupId: UUID,
        @RequestBody request: AddResourceRequest
    ): ResourceGroupMembershipDto {
        val membership = resourceGroupService.addResourceToGroup(
            resourceId = request.resourceId,
            groupId = groupId,
            resourceType = request.resourceType
        )
        return membership.toDto()
    }
    
    /**
     * グループのリソース一覧
     */
    @GetMapping("/{groupId}/resources")
    @PreAuthorize("hasPermissionRule('resource_group.view.all') or hasPermissionRule('resource_group.view.resource_group', #groupId)")
    fun getGroupResources(
        @PathVariable groupId: UUID,
        @PageableDefault pageable: Pageable
    ): Page<ResourceReferenceDto> {
        return resourceGroupService.getGroupResources(groupId, pageable)
            .map { ResourceReferenceDto(it) }
    }
    
    /**
     * リソースの所属グループ一覧
     */
    @GetMapping("/resources/{resourceId}/groups")
    @PreAuthorize("canAccessResource(#resourceId, 'TABLE', 'VIEW')")
    fun getResourceGroups(
        @PathVariable resourceId: UUID
    ): List<ResourceGroupDto> {
        val groupIds = resourceGroupService.getResourceGroups(resourceId)
        return resourceGroupService.findByIds(groupIds).map { it.toDto() }
    }
}
```

## 7. データベース設計

### 7.1 テーブル定義

```sql
-- リソースグループテーブル
CREATE TABLE resource_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL,
    parent_group_id UUID REFERENCES resource_groups(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT uk_resource_groups_tenant_name 
        UNIQUE (tenant_id, name, resource_type)
);

-- リソースグループメンバーシップテーブル
CREATE TABLE resource_group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL,
    group_id UUID NOT NULL REFERENCES resource_groups(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    joined_by UUID NOT NULL,
    expires_at TIMESTAMP,
    
    CONSTRAINT uk_resource_group_membership 
        UNIQUE (resource_id, group_id)
);

-- ユーザー（ロール）のグループ権限テーブル
CREATE TABLE user_resource_group_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    group_id UUID NOT NULL REFERENCES resource_groups(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID NOT NULL,
    
    CONSTRAINT uk_user_group_permission 
        UNIQUE (role_id, group_id, permission)
);

-- インデックス
CREATE INDEX idx_resource_groups_tenant ON resource_groups(tenant_id);
CREATE INDEX idx_resource_groups_type ON resource_groups(resource_type);
CREATE INDEX idx_resource_groups_parent ON resource_groups(parent_group_id);

CREATE INDEX idx_group_memberships_resource ON resource_group_memberships(resource_id);
CREATE INDEX idx_group_memberships_group ON resource_group_memberships(group_id);
CREATE INDEX idx_group_memberships_expires ON resource_group_memberships(expires_at);

CREATE INDEX idx_user_group_permissions_role ON user_resource_group_permissions(role_id);
CREATE INDEX idx_user_group_permissions_group ON user_resource_group_permissions(group_id);
```

## 8. 利点と拡張性

### 8.1 利点

1. **柔軟性**: リソースは複数グループに所属可能
2. **動的管理**: グループは実行時に作成・変更可能
3. **階層構造**: 親子関係によるグループ階層（オプション）
4. **期限管理**: 一時的なグループメンバーシップ
5. **メタデータ**: グループごとの追加情報保持

### 8.2 将来の拡張

1. **グループテンプレート**: よく使うグループ構成の保存・複製
2. **自動グルーピング**: ルールベースの自動グループ割り当て
3. **グループ間の関係**: グループ同士の依存関係定義
4. **動的権限継承**: 親グループからの権限継承
5. **グループポリシー**: グループ固有のアクセスポリシー

## 9. まとめ

ResourceGroupは、組織の実際の構造（部署、プロジェクト、クライアント関係など）を
権限システムに反映させる強力な仕組みです。ユーザーとロールの関係と同様に、
リソースとグループの関係を柔軟に管理することで、きめ細かいアクセス制御を実現します。