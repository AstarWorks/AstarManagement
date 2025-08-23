package com.astarworks.astarmanagement.core.auth.domain.model

import java.time.LocalDateTime
import java.util.UUID

/**
 * UserRole domain entity.
 * Represents role assignments to users within a tenant context.
 * A user can have multiple roles within a tenant (Discord-style).
 */
data class UserRole(
    val tenantUserId: UUID,
    val roleId: UUID,
    val assignedAt: LocalDateTime = LocalDateTime.now(),
    val assignedBy: UUID? = null  // User who assigned the role
) {
    /**
     * Checks if this role was assigned by a specific user.
     */
    fun wasAssignedBy(userId: UUID): Boolean = assignedBy == userId
    
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
        val cutoffDate = LocalDateTime.now().minusDays(withinDays)
        return assignedAt.isAfter(cutoffDate)
    }
    
    /**
     * Creates a new assignment with updated assigner.
     * Used when reassigning or confirming a role assignment.
     */
    fun reassignBy(newAssignerId: UUID): UserRole = copy(
        assignedAt = LocalDateTime.now(),
        assignedBy = newAssignerId
    )
    
    companion object {
        /**
         * Creates a new user role assignment.
         */
        fun assign(
            tenantUserId: UUID,
            roleId: UUID,
            assignedBy: UUID? = null
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
            tenantUserId: UUID,
            roleId: UUID
        ): UserRole {
            return UserRole(
                tenantUserId = tenantUserId,
                roleId = roleId,
                assignedBy = null
            )
        }
    }
}