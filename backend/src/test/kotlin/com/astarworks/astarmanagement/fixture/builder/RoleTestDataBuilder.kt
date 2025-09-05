package com.astarworks.astarmanagement.fixture.builder

import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.shared.domain.value.*
import java.time.Instant
import java.util.UUID

/**
 * Test data builder for creating Role-related entities for testing.
 * 
 * Provides convenient methods to create DynamicRoles, RolePermissions,
 * and UserRole assignments with various configurations.
 */
class RoleTestDataBuilder {
    
    private val permissionBuilder = PermissionTestDataBuilder()
    
    /**
     * Builds an admin role with full permissions.
     * 
     * @param tenantId The tenant ID for this role
     * @param roleId Optional fixed role ID
     * @return DynamicRole configured as admin
     */
    fun buildAdminRole(
        tenantId: TenantId? = null,
        roleId: RoleId = RoleId(UUID.randomUUID())
    ): DynamicRole {
        return DynamicRole(
            id = roleId,
            tenantId = tenantId,
            name = "admin",
            displayName = "Administrator",
            color = "#FF5733",
            position = 100,
            isSystem = true,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * Builds a standard user role with typical permissions.
     * 
     * @param tenantId The tenant ID for this role
     * @param roleId Optional fixed role ID
     * @return DynamicRole configured as standard user
     */
    fun buildUserRole(
        tenantId: TenantId? = null,
        roleId: RoleId = RoleId(UUID.randomUUID())
    ): DynamicRole {
        return DynamicRole(
            id = roleId,
            tenantId = tenantId,
            name = "user",
            displayName = "User",
            color = "#33FF57",
            position = 50,
            isSystem = true,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * Builds a viewer role with read-only permissions.
     * 
     * @param tenantId The tenant ID for this role
     * @param roleId Optional fixed role ID
     * @return DynamicRole configured as viewer
     */
    fun buildViewerRole(
        tenantId: TenantId? = null,
        roleId: RoleId = RoleId(UUID.randomUUID())
    ): DynamicRole {
        return DynamicRole(
            id = roleId,
            tenantId = tenantId,
            name = "viewer",
            displayName = "Viewer",
            color = "#3357FF",
            position = 10,
            isSystem = true,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * Builds a custom role with specified configuration.
     * 
     * @param name The role name (must be lowercase with underscores)
     * @param displayName The display name
     * @param color Hex color code (e.g., "#FF5733")
     * @param position Display order position
     * @param tenantId The tenant ID for this role
     * @param isSystem Whether this is a system role
     * @return Custom DynamicRole
     */
    fun buildCustomRole(
        name: String,
        displayName: String? = null,
        color: String? = null,
        position: Int = 0,
        tenantId: TenantId? = null,
        isSystem: Boolean = false
    ): DynamicRole {
        return DynamicRole(
            id = RoleId(UUID.randomUUID()),
            tenantId = tenantId,
            name = name,
            displayName = displayName,
            color = color,
            position = position,
            isSystem = isSystem,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * Builds role permissions for an admin role.
     * 
     * @param roleId The role ID to assign permissions to
     * @return List of RolePermission entities
     */
    fun buildAdminPermissions(roleId: RoleId): List<RolePermission> {
        return permissionBuilder.buildAdminPermissions().map { permission ->
            RolePermission(
                roleId = roleId,
                permissionRule = permission,
                createdAt = Instant.now()
            )
        }
    }
    
    /**
     * Builds role permissions for a standard user role.
     * 
     * @param roleId The role ID to assign permissions to
     * @return List of RolePermission entities
     */
    fun buildUserPermissions(roleId: RoleId): List<RolePermission> {
        return permissionBuilder.buildStandardUserPermissions().map { permission ->
            RolePermission(
                roleId = roleId,
                permissionRule = permission,
                createdAt = Instant.now()
            )
        }
    }
    
    /**
     * Builds role permissions for a viewer role.
     * 
     * @param roleId The role ID to assign permissions to
     * @return List of RolePermission entities
     */
    fun buildViewerPermissions(roleId: RoleId): List<RolePermission> {
        return permissionBuilder.buildViewerPermissions().map { permission ->
            RolePermission(
                roleId = roleId,
                permissionRule = permission,
                createdAt = Instant.now()
            )
        }
    }
    
    /**
     * Builds a RolePermission with a specific permission rule.
     * 
     * @param roleId The role ID
     * @param permissionRule The permission rule to assign
     * @return RolePermission entity
     */
    fun buildRolePermission(
        roleId: RoleId,
        permissionRule: PermissionRule
    ): RolePermission {
        return RolePermission(
            roleId = roleId,
            permissionRule = permissionRule,
            createdAt = Instant.now()
        )
    }
    
    /**
     * Builds a UserRole assignment.
     * 
     * @param userId The user ID
     * @param roleId The role ID to assign
     * @param assignedBy Optional ID of the user who assigned the role
     * @return UserRole entity
     */
    fun buildUserRole(
        tenantUserId: TenantUserId,
        roleId: RoleId,
        assignedBy: UserId? = null
    ): UserRole {
        return UserRole(
            tenantUserId = tenantUserId,
            roleId = roleId,
            assignedAt = Instant.now(),
            assignedBy = assignedBy
        )
    }
    
    /**
     * Creates a complete role setup with permissions.
     * 
     * @param roleType The type of role to create (admin, user, viewer)
     * @param tenantId The tenant ID
     * @return Pair of DynamicRole and its RolePermissions
     */
    fun buildRoleWithPermissions(
        roleType: RoleType,
        tenantId: TenantId? = null
    ): Pair<DynamicRole, List<RolePermission>> {
        val role = when (roleType) {
            RoleType.ADMIN -> buildAdminRole(tenantId)
            RoleType.USER -> buildUserRole(tenantId)
            RoleType.VIEWER -> buildViewerRole(tenantId)
        }
        
        val permissions = when (roleType) {
            RoleType.ADMIN -> buildAdminPermissions(role.id)
            RoleType.USER -> buildUserPermissions(role.id)
            RoleType.VIEWER -> buildViewerPermissions(role.id)
        }
        
        return role to permissions
    }
    
    /**
     * Creates multiple roles with a hierarchy.
     * 
     * @param tenantId The tenant ID
     * @return List of roles ordered by position
     */
    fun buildRoleHierarchy(tenantId: TenantId? = null): List<DynamicRole> {
        return listOf(
            buildAdminRole(tenantId).copy(position = 100),
            buildCustomRole("manager", "Manager", "#FFA500", 75, tenantId),
            buildUserRole(tenantId).copy(position = 50),
            buildCustomRole("contributor", "Contributor", "#00FF00", 25, tenantId),
            buildViewerRole(tenantId).copy(position = 10)
        ).sortedByDescending { it.position }
    }
    
    /**
     * Enum for role types
     */
    enum class RoleType {
        ADMIN,
        USER,
        VIEWER
    }
    
    companion object {
        /**
         * Fixed role IDs for consistent testing
         */
        object TestRoleIds {
            val ADMIN_ROLE_ID: RoleId = RoleId(
                UUID.fromString("11111111-1111-1111-1111-111111111111")
            )
            val USER_ROLE_ID: RoleId = RoleId(
                UUID.fromString("22222222-2222-2222-2222-222222222222")
            )
            val VIEWER_ROLE_ID: RoleId = RoleId(
                UUID.fromString("33333333-3333-3333-3333-333333333333")
            )
            val CUSTOM_ROLE_ID: RoleId = RoleId(
                UUID.fromString("44444444-4444-4444-4444-444444444444")
            )
        }
        
        /**
         * Test role names
         */
        object TestRoleNames {
            const val ADMIN = "admin"
            const val USER = "user"
            const val VIEWER = "viewer"
            const val MANAGER = "manager"
            const val CONTRIBUTOR = "contributor"
            const val GUEST = "guest"
        }
        
        /**
         * Discord-style colors for roles
         */
        object RoleColors {
            const val RED = "#FF5733"
            const val GREEN = "#33FF57"
            const val BLUE = "#3357FF"
            const val ORANGE = "#FFA500"
            const val PURPLE = "#9B59B6"
            const val YELLOW = "#F1C40F"
        }
    }
}