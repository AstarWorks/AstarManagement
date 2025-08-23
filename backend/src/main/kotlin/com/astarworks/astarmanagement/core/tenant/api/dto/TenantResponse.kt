package com.astarworks.astarmanagement.core.tenant.api.dto

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import java.time.LocalDateTime
import java.util.UUID

/**
 * Response DTO for tenant information.
 */
data class TenantResponse(
    val id: UUID,
    val slug: String,
    val name: String,
    val auth0OrgId: String?,
    val isActive: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        /**
         * Creates a TenantResponse from a Tenant domain model.
         */
        fun from(tenant: Tenant): TenantResponse {
            return TenantResponse(
                id = tenant.id,
                slug = tenant.slug,
                name = tenant.name,
                auth0OrgId = tenant.auth0OrgId,
                isActive = tenant.isActive,
                createdAt = tenant.createdAt,
                updatedAt = tenant.updatedAt
            )
        }
    }
}