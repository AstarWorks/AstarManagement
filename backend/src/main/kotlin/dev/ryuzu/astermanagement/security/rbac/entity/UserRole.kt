package dev.ryuzu.astermanagement.security.rbac.entity

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import dev.ryuzu.astermanagement.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

/**
 * UserRole join entity for many-to-many relationship between Users and Roles.
 * This entity provides additional metadata about role assignments including
 * when the role was granted, by whom, and any expiration information.
 * 
 * This approach allows for:
 * - Audit trail of role assignments
 * - Temporary role assignments with expiration
 * - Tracking who granted specific roles
 * - Multiple roles per user with different metadata
 */
@Entity
@Table(
    name = "user_roles",
    indexes = [
        Index(name = "idx_user_role_user", columnList = "user_id"),
        Index(name = "idx_user_role_role", columnList = "role_id"),
        Index(name = "idx_user_role_active", columnList = "is_active"),
        Index(name = "idx_user_role_expiry", columnList = "expires_at")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_user_role", 
            columnNames = ["user_id", "role_id"]
        )
    ]
)
class UserRole : BaseEntity() {

    /**
     * Reference to the user who has been assigned the role
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = ForeignKey(name = "fk_user_role_user"))
    var user: User? = null

    /**
     * Reference to the role that has been assigned to the user
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false, foreignKey = ForeignKey(name = "fk_user_role_role"))
    var role: Role? = null

    /**
     * Whether this role assignment is currently active
     * Allows for temporarily disabling roles without deletion
     */
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

    /**
     * When this role assignment was granted
     * Automatically set to current time when created
     */
    @Column(name = "granted_at", nullable = false)
    var grantedAt: LocalDateTime = LocalDateTime.now()

    /**
     * ID of the user who granted this role assignment
     * Tracks administrative actions for audit purposes
     */
    @Column(name = "granted_by")
    var grantedBy: UUID? = null

    /**
     * Optional expiration date for temporary role assignments
     * When set, the role will automatically become inactive after this date
     */
    @Column(name = "expires_at")
    var expiresAt: LocalDateTime? = null

    /**
     * Optional reason or notes for this role assignment
     * Useful for audit trail and administrative purposes
     */
    @Column(name = "assignment_reason", length = 500)
    var assignmentReason: String? = null

    /**
     * Whether this is a primary role for the user
     * Helps identify the main role when a user has multiple roles
     */
    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false

    /**
     * Check if this role assignment is currently valid
     * (active and not expired)
     */
    fun isCurrentlyValid(): Boolean {
        val now = LocalDateTime.now()
        return isActive && (expiresAt == null || expiresAt!!.isAfter(now))
    }

    /**
     * Check if this role assignment has expired
     */
    fun isExpired(): Boolean {
        return expiresAt != null && expiresAt!!.isBefore(LocalDateTime.now())
    }

    /**
     * Deactivate this role assignment
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Reactivate this role assignment
     */
    fun reactivate() {
        isActive = true
    }

    /**
     * Set expiration date for this role assignment
     */
    fun setExpiration(expirationDate: LocalDateTime) {
        expiresAt = expirationDate
    }

    /**
     * Remove expiration date (make permanent)
     */
    fun removePermanent() {
        expiresAt = null
    }

    /**
     * Get the effective permissions from the assigned role
     * Only returns permissions if the role assignment is currently valid
     */
    fun getEffectivePermissions(): Long {
        return if (isCurrentlyValid() && role != null) {
            role!!.permissions
        } else {
            0L
        }
    }

    /**
     * Check if this role assignment grants a specific permission
     */
    fun hasPermission(permission: Permission): Boolean {
        return if (isCurrentlyValid() && role != null) {
            role!!.hasPermission(permission)
        } else {
            false
        }
    }

    /**
     * Get the role hierarchy level
     * Returns 0 if role assignment is not valid
     */
    fun getHierarchyLevel(): Int {
        return if (isCurrentlyValid() && role != null) {
            role!!.hierarchyLevel
        } else {
            0
        }
    }

    /**
     * Get days until expiration
     * Returns null if no expiration is set or already expired
     */
    fun getDaysUntilExpiration(): Long? {
        return if (expiresAt != null && !isExpired()) {
            java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), expiresAt)
        } else {
            null
        }
    }

    /**
     * Check if this role assignment will expire within the specified number of days
     */
    fun willExpireWithinDays(days: Long): Boolean {
        val daysUntilExpiration = getDaysUntilExpiration()
        return daysUntilExpiration != null && daysUntilExpiration <= days
    }

    override fun toString(): String {
        return "UserRole(id=$id, userId=${user?.id}, roleId=${role?.id}, " +
                "roleName=${role?.name}, isActive=$isActive, " +
                "grantedAt=$grantedAt, expiresAt=$expiresAt, isPrimary=$isPrimary)"
    }

    companion object {
        /**
         * Create a permanent role assignment
         */
        fun create(
            user: User,
            role: Role,
            grantedBy: UUID? = null,
            assignmentReason: String? = null,
            isPrimary: Boolean = false
        ): UserRole {
            val userRole = UserRole()
            userRole.user = user
            userRole.role = role
            userRole.grantedBy = grantedBy
            userRole.assignmentReason = assignmentReason
            userRole.isPrimary = isPrimary
            userRole.grantedAt = LocalDateTime.now()
            return userRole
        }

        /**
         * Create a temporary role assignment with expiration
         */
        fun createTemporary(
            user: User,
            role: Role,
            expiresAt: LocalDateTime,
            grantedBy: UUID? = null,
            assignmentReason: String? = null
        ): UserRole {
            val userRole = create(user, role, grantedBy, assignmentReason, false)
            userRole.expiresAt = expiresAt
            return userRole
        }

        /**
         * Create a primary role assignment (main role for the user)
         */
        fun createPrimary(
            user: User,
            role: Role,
            grantedBy: UUID? = null,
            assignmentReason: String? = null
        ): UserRole {
            return create(user, role, grantedBy, assignmentReason, true)
        }
    }
}