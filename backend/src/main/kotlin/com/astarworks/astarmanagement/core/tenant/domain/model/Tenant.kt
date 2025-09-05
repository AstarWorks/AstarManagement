package com.astarworks.astarmanagement.core.tenant.domain.model

import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import java.time.Instant
import java.util.UUID

/**
 * Tenant domain model representing an organization in the multi-tenant system.
 * Integrates with Auth0 Organizations for SSO and identity management.
 */
data class Tenant(
    val id: TenantId = TenantId(java.util.UUID.randomUUID()),
    val slug: String,
    val name: String,
    val auth0OrgId: String? = null,
    val isActive: Boolean = true,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {
    init {
        require(slug.isNotBlank()) { "Tenant slug cannot be blank" }
        require(name.isNotBlank()) { "Tenant name cannot be blank" }
        require(slug.length <= 100) { "Tenant slug cannot exceed 100 characters" }
        require(name.length <= 255) { "Tenant name cannot exceed 255 characters" }
        require(slug.matches(Regex("^[a-z0-9-]+$"))) { 
            "Tenant slug can only contain lowercase letters, numbers, and hyphens" 
        }
    }
    
    /**
     * Deactivates the tenant, preventing access while preserving data.
     */
    fun deactivate(): Tenant = copy(
        isActive = false,
        updatedAt = Instant.now()
    )
    
    /**
     * Reactivates a deactivated tenant.
     */
    fun activate(): Tenant = copy(
        isActive = true,
        updatedAt = Instant.now()
    )
    
    /**
     * Updates the tenant's display name.
     */
    fun updateName(newName: String): Tenant {
        require(newName.isNotBlank()) { "Tenant name cannot be blank" }
        require(newName.length <= 255) { "Tenant name cannot exceed 255 characters" }
        
        return copy(
            name = newName,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * Links the tenant with an Auth0 Organization.
     */
    fun linkAuth0Organization(orgId: String): Tenant {
        require(orgId.isNotBlank()) { "Auth0 Organization ID cannot be blank" }
        
        return copy(
            auth0OrgId = orgId,
            updatedAt = Instant.now()
        )
    }
}