package dev.ryuzu.astermanagement.security.rbac.entity

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import jakarta.persistence.*
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Role entity implementing Discord-style Role-Based Access Control with bitwise permission flags.
 * Each role contains a permission flags field using bitwise operations for efficient permission checking.
 * 
 * Features:
 * - Bitwise permission flags for up to 64 distinct permissions
 * - Role hierarchy system with numeric precedence levels
 * - Customizable display names and colors for UI representation
 * - Audit trail through BaseEntity inheritance
 * - Many-to-many relationships with users through UserRole join entity
 */
@Entity
@Table(
    name = "roles",
    indexes = [
        Index(name = "idx_role_name", columnList = "name", unique = true),
        Index(name = "idx_role_hierarchy", columnList = "hierarchy_level")
    ]
)
class Role : BaseEntity() {

    /**
     * Unique role name (used programmatically)
     * Examples: "LAWYER", "CLERK", "CLIENT", "ADMIN"
     */
    @Column(name = "name", unique = true, nullable = false, length = 50)
    @NotBlank(message = "Role name cannot be blank")
    @Size(max = 50, message = "Role name must not exceed 50 characters")
    var name: String = ""

    /**
     * Human-readable display name for UI
     * Examples: "Senior Lawyer", "Junior Clerk", "External Client"
     */
    @Column(name = "display_name", nullable = false, length = 100)
    @NotBlank(message = "Display name cannot be blank")
    @Size(max = 100, message = "Display name must not exceed 100 characters")
    var displayName: String = ""

    /**
     * Permission flags using bitwise operations (Discord-style).
     * Each bit position represents a specific permission from the Permission enum.
     * Maximum 64 permissions supported with Long data type.
     */
    @Column(name = "permissions", nullable = false)
    var permissions: Long = 0L

    /**
     * Role hierarchy level for precedence evaluation.
     * Higher values indicate higher authority levels.
     * Used for role inheritance and permission escalation.
     * 
     * Standard levels:
     * - 100: Lawyer (highest authority)
     * - 50: Clerk (medium authority)
     * - 10: Client (lowest authority)
     */
    @Column(name = "hierarchy_level", nullable = false)
    @Min(value = 0, message = "Hierarchy level must be non-negative")
    @Max(value = 1000, message = "Hierarchy level must not exceed 1000")
    var hierarchyLevel: Int = 0

    /**
     * Role color for UI representation (hex color code)
     * Examples: "#FF5733" (red), "#33FF57" (green), "#3357FF" (blue)
     */
    @Column(name = "color", nullable = false, length = 7)
    @Size(min = 7, max = 7, message = "Color must be a valid hex code (#RRGGBB)")
    var color: String = "#808080"

    /**
     * Optional description of the role's purpose and responsibilities
     */
    @Column(name = "description", length = 500)
    @Size(max = 500, message = "Description must not exceed 500 characters")
    var description: String? = null

    /**
     * Whether this role is active and can be assigned to users
     */
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

    /**
     * Whether this is a system-defined role that cannot be deleted
     */
    @Column(name = "is_system_role", nullable = false)
    var isSystemRole: Boolean = false

    /**
     * Many-to-many relationship with users through UserRole join entity
     */
    @OneToMany(mappedBy = "role", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    var userRoles: MutableSet<UserRole> = mutableSetOf()

    /**
     * Check if this role has a specific permission
     */
    fun hasPermission(permission: Permission): Boolean {
        return Permission.hasPermission(permissions, permission)
    }

    /**
     * Grant a permission to this role
     */
    fun grantPermission(permission: Permission) {
        permissions = Permission.grantPermission(permissions, permission)
    }

    /**
     * Revoke a permission from this role
     */
    fun revokePermission(permission: Permission) {
        permissions = Permission.revokePermission(permissions, permission)
    }

    /**
     * Get all permissions granted to this role
     */
    fun getPermissionsList(): List<Permission> {
        return Permission.getPermissionsList(permissions)
    }

    /**
     * Set permissions from a list of Permission enums
     */
    fun setPermissions(permissionList: List<Permission>) {
        permissions = permissionList.fold(0L) { acc, permission -> acc or permission.value }
    }

    /**
     * Check if this role has higher hierarchy than another role
     */
    fun hasHigherHierarchyThan(otherRole: Role): Boolean {
        return this.hierarchyLevel > otherRole.hierarchyLevel
    }

    /**
     * Check if this role has equal or higher hierarchy than another role
     */
    fun hasEqualOrHigherHierarchyThan(otherRole: Role): Boolean {
        return this.hierarchyLevel >= otherRole.hierarchyLevel
    }

    /**
     * Get a human-readable description of all permissions
     */
    fun getPermissionsDescription(): String {
        return Permission.describePermissions(permissions)
    }

    /**
     * Check if this role can perform all actions that another role can perform
     * (useful for role inheritance checks)
     */
    fun canPerformAllActionsOf(otherRole: Role): Boolean {
        return (permissions and otherRole.permissions) == otherRole.permissions
    }

    /**
     * Get permissions that this role has but another role doesn't
     */
    fun getAdditionalPermissionsComparedTo(otherRole: Role): List<Permission> {
        val additionalPermissions = permissions and otherRole.permissions.inv()
        return Permission.getPermissionsList(additionalPermissions)
    }

    /**
     * Create a copy of this role with modified permissions
     */
    fun withPermissions(newPermissions: Long): Role {
        val copy = Role()
        copy.name = this.name
        copy.displayName = this.displayName
        copy.permissions = newPermissions
        copy.hierarchyLevel = this.hierarchyLevel
        copy.color = this.color
        copy.description = this.description
        copy.isActive = this.isActive
        copy.isSystemRole = this.isSystemRole
        return copy
    }

    override fun toString(): String {
        return "Role(id=$id, name='$name', displayName='$displayName', " +
                "hierarchyLevel=$hierarchyLevel, permissionCount=${getPermissionsList().size}, " +
                "isActive=$isActive, isSystemRole=$isSystemRole)"
    }

    companion object {
        /**
         * Standard hierarchy levels for default roles
         */
        object HierarchyLevel {
            const val CLIENT = 10
            const val CLERK = 50
            const val LAWYER = 100
            const val ADMIN = 200
        }

        /**
         * Standard colors for default roles
         */
        object DefaultColors {
            const val CLIENT = "#6B7280"    // Gray
            const val CLERK = "#3B82F6"     // Blue
            const val LAWYER = "#10B981"    // Green
            const val ADMIN = "#EF4444"     // Red
        }

        /**
         * Create a default client role
         */
        fun createClientRole(): Role {
            val role = Role()
            role.name = "CLIENT"
            role.displayName = "Client"
            role.permissions = Permission.Companion.Defaults.CLIENT_PERMISSIONS
            role.hierarchyLevel = HierarchyLevel.CLIENT
            role.color = DefaultColors.CLIENT
            role.description = "External client with read-only access to their matters"
            role.isSystemRole = true
            return role
        }

        /**
         * Create a default clerk role
         */
        fun createClerkRole(): Role {
            val role = Role()
            role.name = "CLERK"
            role.displayName = "Clerk"
            role.permissions = Permission.Companion.Defaults.CLERK_PERMISSIONS
            role.hierarchyLevel = HierarchyLevel.CLERK
            role.color = DefaultColors.CLERK
            role.description = "Internal staff with CRUD access but no deletion rights"
            role.isSystemRole = true
            return role
        }

        /**
         * Create a default lawyer role
         */
        fun createLawyerRole(): Role {
            val role = Role()
            role.name = "LAWYER"
            role.displayName = "Lawyer"
            role.permissions = Permission.Companion.Defaults.LAWYER_PERMISSIONS
            role.hierarchyLevel = HierarchyLevel.LAWYER
            role.color = DefaultColors.LAWYER
            role.description = "Legal professional with full system access"
            role.isSystemRole = true
            return role
        }
    }
}