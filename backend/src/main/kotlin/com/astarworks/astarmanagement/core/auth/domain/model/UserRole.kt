package com.astarworks.astarmanagement.core.auth.domain.model

import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantUserId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import java.time.Duration
import java.time.Instant
import java.util.UUID

/**
 * UserRole domain entity.
 * Represents role assignments to users within a tenant context.
 * A user can have multiple roles within a tenant (Discord-style).
 */
data class UserRole(
    val tenantUserId: TenantUserId,
    val roleId: RoleId,
    val assignedAt: Instant = Instant.now(),
    val assignedBy: UserId? = null  // User who assigned the role
) {
    /**
     * Checks if this role was assigned by a specific user.
     */
    fun wasAssignedBy(userId: UserId): Boolean = assignedBy == userId
    
    /**
     * Checks if this role was system-assigned (no specific assigner).
     */
    fun isSystemAssigned(): Boolean = assignedBy == null
    
    /**
     * Checks if this role was assigned within a specific time period.
     * @param withinDays Number of days to check
     * @return true if assigned within the specified days, false otherwise
     */
    fun wasAssignedWithin(withinDays: Long): Boolean {
        val cutoffDate = Instant.now().minus(Duration.ofDays(withinDays))
        return assignedAt.isAfter(cutoffDate)
    }
    
    /**
     * Creates a new assignment with updated assigner.
     * Used when reassigning or confirming a role assignment.
     */
    fun reassignBy(newAssignerId: UserId): UserRole = copy(
        assignedAt = Instant.now(),
        assignedBy = newAssignerId
    )
    
    companion object {
        /**
         * Creates a new user role assignment.
         */
        fun assign(
            tenantUserId: TenantUserId,
            roleId: RoleId,
            assignedBy: UserId? = null
        ): UserRole {
            return UserRole(
                tenantUserId = tenantUserId,
                roleId = roleId,
                assignedBy = assignedBy
            )
        }
        
        /**
         * Creates a system-assigned role.
         */
        fun systemAssign(
            tenantUserId: TenantUserId,
            roleId: RoleId
        ): UserRole {
            return UserRole(
                tenantUserId = tenantUserId,
                roleId = roleId,
                assignedBy = null
            )
        }
    }
}