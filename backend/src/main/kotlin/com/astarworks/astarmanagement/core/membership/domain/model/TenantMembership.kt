package com.astarworks.astarmanagement.core.membership.domain.model

import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import java.time.Duration
import java.time.Instant
import java.util.UUID

/**
 * Represents a user's membership in a tenant.
 * 
 * This is the core relationship entity that connects users to tenants
 * in a multi-tenant system (Slack-style where users can belong to multiple tenants).
 * 
 * Key concepts:
 * - A user can be a member of multiple tenants
 * - Each membership has its own lifecycle (join, leave, reactivate)
 * - Memberships can be active or inactive
 * - User roles are assigned per membership (tenant-specific roles)
 * 
 * This entity corresponds to the tenant_users table in the database.
 */
data class TenantMembership(
    val id: TenantMembershipId = TenantMembershipId(UUID.randomUUID()),
    val tenantId: TenantId,
    val userId: UserId,
    val isActive: Boolean = true,
    val joinedAt: Instant = Instant.now(),
    val lastAccessedAt: Instant? = null
) {
    
    /**
     * Deactivates this membership.
     * The membership record is retained for audit purposes.
     */
    fun deactivate(): TenantMembership {
        return this.copy(isActive = false)
    }
    
    /**
     * Reactivates this membership and updates last access time.
     */
    fun reactivate(): TenantMembership {
        return this.copy(
            isActive = true,
            lastAccessedAt = Instant.now()
        )
    }
    
    /**
     * Updates the last access timestamp.
     */
    fun updateLastAccess(): TenantMembership {
        return this.copy(lastAccessedAt = Instant.now())
    }
    
    /**
     * Checks if this membership is currently active.
     */
    fun isActiveMember(): Boolean = isActive
    
    /**
     * Checks if this is a new membership (joined within the last 7 days).
     */
    fun isNewMember(): Boolean {
        val sevenDaysAgo = Instant.now().minus(Duration.ofDays(7))
        return joinedAt.isAfter(sevenDaysAgo)
    }
    
    /**
     * Gets the duration of membership.
     */
    fun getMembershipDuration(): Long {
        return Duration.between(joinedAt, Instant.now()).toDays()
    }
}