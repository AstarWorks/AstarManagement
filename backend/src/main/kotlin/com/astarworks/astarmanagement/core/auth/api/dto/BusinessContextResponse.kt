package com.astarworks.astarmanagement.core.auth.api.dto

import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for business context endpoint.
 */
@Serializable
data class BusinessContextResponse(
    val authenticatedContext: AuthenticatedContextDto,
    
    val springSecurityAuthorities: List<String>,
    
    val rawJwtClaims: RawJwtClaimsDto
)

/**
 * Authenticated user context information.
 */
@Serializable
data class AuthenticatedContextDto(
    val auth0Sub: String,
    
    @Contextual
    val userId: UUID,
    
    @Contextual
    val tenantUserId: UUID?,
    
    @Contextual
    val tenantId: UUID?,
    
    val roles: List<String>,
    
    val email: String?,
    
    @SerialName("active")
    val isActive: Boolean
)

/**
 * Raw JWT claims information.
 */
@Serializable
data class RawJwtClaimsDto(
    @SerialName("org_id")
    val orgId: String?,
    
    @SerialName("custom_tenant_id")
    val customTenantId: String?,
    
    val roles: List<String>?
)

/**
 * Response DTO for current user information endpoint.
 */
@Serializable
data class CurrentUserResponse(
    val subject: String,
    
    val email: String,
    
    val name: String,
    
    val audience: List<String>,
    
    val issuer: String,
    
    val issuedAt: String,
    
    val expiresAt: String,
    
    val allClaims: Map<String, String>
)

/**
 * Response DTO for JWT claims endpoint.
 */
@Serializable
data class JwtClaimsResponse(
    val sub: String?,
    
    val email: String?,
    
    @SerialName("email_verified")
    val emailVerified: Boolean?,
    
    val name: String?,
    
    val picture: String?,
    
    val aud: List<String>?,
    
    val iss: String?,
    
    @Contextual
    val iat: Instant?,
    
    @Contextual
    val exp: Instant?,
    
    val scope: String?
)