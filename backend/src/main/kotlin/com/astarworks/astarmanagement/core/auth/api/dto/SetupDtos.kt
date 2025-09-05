package com.astarworks.astarmanagement.core.auth.api.dto

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * Request DTO for initial tenant setup.
 * Used by first-time users to create their default workspace.
 */
@Serializable
data class SetupRequest(
    val tenantName: String,
    val tenantType: TenantTypeDto = TenantTypeDto.PERSONAL,
    val userProfile: UserProfileDto
)

/**
 * User profile information for setup.
 */
@Serializable
data class UserProfileDto(
    val displayName: String,
    val email: String,
    val avatarUrl: String? = null
)

/**
 * Tenant type enumeration.
 */
@Serializable
enum class TenantTypeDto {
    PERSONAL,
    TEAM,
    ENTERPRISE
}

/**
 * Response DTO for successful setup completion.
 */
@Serializable
data class SetupResponse(
    @Contextual
    val userId: UUID,
    
    @Contextual
    val tenantId: UUID,
    
    @Contextual
    val tenantUserId: UUID,
    
    val tenant: TenantDto,
    
    val user: UserDto,
    
    val message: String = "Setup completed successfully. Please re-authenticate with your organization ID."
)

/**
 * Simple response DTO for quick default workspace creation.
 * Used by the simplified setup flow that creates a default workspace with minimal input.
 */
@Serializable
data class SimpleSetupResponse(
    @Contextual
    val userId: UUID,
    
    @Contextual
    val tenantId: UUID,
    
    val tenantName: String,
    
    val success: Boolean,
    
    val message: String
)

/**
 * Tenant information DTO.
 */
@Serializable
data class TenantDto(
    @Contextual
    val id: UUID,
    
    val name: String,
    
    val type: TenantTypeDto,
    
    val orgId: String,
    
    val isActive: Boolean = true
)

/**
 * User information DTO.
 */
@Serializable
data class UserDto(
    @Contextual
    val id: UUID,
    
    val auth0Sub: String,
    
    val email: String,
    
    val displayName: String,
    
    val avatarUrl: String? = null,
    
    val isActive: Boolean = true
)

/**
 * Response DTO for listing user's tenants.
 * Used when a user may belong to multiple tenants.
 */
@Serializable
data class MyTenantsResponse(
    val tenants: List<UserTenantDto>,
    
    @Contextual
    val defaultTenantId: UUID? = null
)

/**
 * User's tenant membership information.
 */
@Serializable
data class UserTenantDto(
    @Contextual
    val tenantId: UUID,
    
    val tenantName: String,
    
    val orgId: String,
    
    val roles: List<String>,
    
    val joinedAt: String,
    
    val isActive: Boolean = true
)