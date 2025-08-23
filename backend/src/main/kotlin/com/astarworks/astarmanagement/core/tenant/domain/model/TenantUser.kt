package com.astarworks.astarmanagement.core.tenant.domain.model

import java.time.LocalDateTime
import java.util.UUID

/**
 * TenantUser domain entity.
 * Represents the many-to-many relationship between tenants and users.
 * A user can belong to multiple tenants (Slack-style multi-tenancy).
 */
data class TenantUser(
    val id: UUID = UUID.randomUUID(),
    val tenantId: UUID,
    val userId: UUID,
    val isActive: Boolean = true,
    val joinedAt: LocalDateTime = LocalDateTime.now(),
    val lastAccessedAt: LocalDateTime? = null
) {
    /**
     * Deactivates the user's membership in this tenant.
     * User data is preserved but access is revoked.
     */
    fun deactivate(): TenantUser = copy(
        isActive = false
    )
    
    /**
     * Reactivates the user's membership in this tenant.
     */
    fun activate(): TenantUser = copy(
        isActive = true
    )
    
    /**
     * Updates the last accessed timestamp.
     * Should be called when user accesses the tenant.
     */
    fun updateLastAccessed(): TenantUser = copy(
        lastAccessedAt = LocalDateTime.now()
    )
    
    /**
     * Checks if the user has accessed this tenant recently.
     * @param withinDays Number of days to check
     * @return true if accessed within the specified days, false otherwise
     */
    fun hasAccessedWithin(withinDays: Long): Boolean {
        val lastAccess = lastAccessedAt ?: return false
        val cutoffDate = LocalDateTime.now().minusDays(withinDays)
        return lastAccess.isAfter(cutoffDate)
    }
    
    /**
     * Checks if the user is an active member of this tenant.
     * Active means both the membership is active and the user has accessed recently.
     * @param inactiveDaysThreshold Days without access to consider inactive
     * @return true if active, false otherwise
     */
    fun isActiveMember(inactiveDaysThreshold: Long = 90): Boolean {
        return isActive && hasAccessedWithin(inactiveDaysThreshold)
    }
}