package com.astarworks.astarmanagement.core.tenant.api.dto

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.fasterxml.jackson.annotation.JsonProperty
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for tenant information.
 */
@Serializable
data class TenantResponse(
    @Contextual
    val id: UUID,
    val slug: String,
    val name: String,
    @JsonProperty("auth0OrgId")
    @SerialName("auth0OrgId")
    val auth0OrgId: String?,
    @JsonProperty("active")
    @SerialName("active")
    val isActive: Boolean,
    @Contextual
    val createdAt: Instant,
    @Contextual
    val updatedAt: Instant
) {
    companion object {
        /**
         * Creates a TenantResponse from a Tenant domain model.
         */
        fun from(tenant: Tenant): TenantResponse {
            return TenantResponse(
                id = tenant.id.value,
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