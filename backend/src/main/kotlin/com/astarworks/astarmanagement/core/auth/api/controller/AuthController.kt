package com.astarworks.astarmanagement.core.auth.api.controller
import org.springframework.web.server.ResponseStatusException
import org.springframework.http.HttpStatus

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor
import com.astarworks.astarmanagement.core.auth.api.dto.BusinessContextResponse
import com.astarworks.astarmanagement.core.auth.api.dto.AuthenticatedContextDto
import com.astarworks.astarmanagement.core.auth.api.dto.RawJwtClaimsDto
import com.astarworks.astarmanagement.core.auth.api.dto.CurrentUserResponse
import com.astarworks.astarmanagement.core.auth.api.dto.JwtClaimsResponse
import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.SetupModeContext
import com.astarworks.astarmanagement.core.auth.domain.model.MultiTenantAuthentication
import com.astarworks.astarmanagement.core.auth.domain.model.MultiTenantContext
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
/**
 * Authentication controller for JWT validation.
 * Provides endpoints to verify JWT authentication and retrieve user information.
 */
@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val jwtClaimsExtractor: JwtClaimsExtractor
) {

    /**
     * Get current authenticated user information.
     * Returns different responses based on authentication type:
     * - SetupModeAuthentication: Returns SETUP_REQUIRED status
     * - Normal authentication: Returns full business context with user, tenant, and role information
     */
    @GetMapping("/me")
    fun getCurrentUser(authentication: Authentication?): Any {
        return when (authentication) {
            null -> {
                // No authentication - return unauthorized
                throw ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
                )
            }
            is SetupModeAuthentication -> {
                // First-time user without org_id - needs setup
                val setupContext = authentication.principal as SetupModeContext
                mapOf(
                    "status" to "SETUP_REQUIRED",
                    "auth0Sub" to setupContext.auth0Sub,
                    "email" to setupContext.email,
                    "hasDefaultTenant" to false,
                    "message" to "Please complete the setup process to create your default workspace"
                )
            }
            
            is JwtAuthenticationToken -> {
                // Normal authenticated user with org_id
                val authenticatedContext = authentication.principal as? AuthenticatedUserContext
                    ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
                
                AuthenticatedContextDto(
                    auth0Sub = authenticatedContext.auth0Sub,
                    userId = authenticatedContext.userId,
                    tenantUserId = authenticatedContext.tenantUserId,
                    tenantId = authenticatedContext.tenantId,
                    roles = authenticatedContext.roles.map { it.name }.toSet().toList(),  
                    email = authenticatedContext.email,
                    isActive = authenticatedContext.isActive
                )
            }
            
            is MultiTenantAuthentication -> {
                // User without org_id but has accessible tenants - return first tenant info
                val multiTenantContext = authentication.principal as MultiTenantContext
                
                // For multi-tenant users without org_id, return basic info without tenant context
                AuthenticatedContextDto(
                    auth0Sub = multiTenantContext.auth0Sub,
                    userId = multiTenantContext.userId,
                    tenantUserId = null, // No specific tenant selected
                    tenantId = multiTenantContext.accessibleTenantIds.firstOrNull(), // Return first accessible tenant
                    roles = emptyList(),  // No specific roles without tenant context
                    email = multiTenantContext.email,
                    isActive = true
                )
            }
            
            else -> {
                // Unknown authentication type
                throw ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authentication type"
                )
            }
        }
    }

    /**
     * Get specific JWT claims.
     * Returns formatted JWT claims for client consumption.
     */
    @GetMapping("/claims")
    fun getJwtClaims(authentication: Authentication?): JwtClaimsResponse {
        if (authentication == null) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required")
        }
        // JwtAuthenticationToken から JWT を取得
        val jwt = (authentication as? JwtAuthenticationToken)?.token
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        
        val claims = JwtClaimsResponse(
            sub = jwt.subject,
            email = jwt.getClaimAsString("email"),
            emailVerified = jwt.getClaimAsBoolean("email_verified"),
            name = jwt.getClaimAsString("name"),
            picture = jwt.getClaimAsString("picture"),
            aud = jwt.audience,
            iss = jwt.issuer?.toString(),
            iat = jwt.issuedAt,
            exp = jwt.expiresAt,
            scope = jwt.getClaimAsString("scope")
        )
        
        return claims
    }

    /**
     * Get business context extracted from JWT.
     * Returns business-specific information and authorities.
     */
    @GetMapping("/business-context")
    @PreAuthorize("isAuthenticated()")
    fun getBusinessContext(authentication: Authentication?): BusinessContextResponse {
        if (authentication == null) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required")
        }
        // Principal から AuthenticatedUserContext を取得
        val authenticatedContext = authentication.principal as? AuthenticatedUserContext
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        
        // JwtAuthenticationToken から JWT を取得
        val jwt = (authentication as? JwtAuthenticationToken)?.token
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        
        val authorities = authentication.authorities.map { it.authority }
        
        val response = BusinessContextResponse(
            authenticatedContext = AuthenticatedContextDto(
                auth0Sub = authenticatedContext.auth0Sub,
                userId = authenticatedContext.userId,
                tenantUserId = authenticatedContext.tenantUserId,
                tenantId = authenticatedContext.tenantId,
                roles = authenticatedContext.roles.map { it.name }.toSet().toList(),
                email = authenticatedContext.email,
                isActive = authenticatedContext.isActive
            ),
            springSecurityAuthorities = authorities,
            rawJwtClaims = RawJwtClaimsDto(
                orgId = jwt.getClaimAsString("org_id"),
                customTenantId = jwt.getClaimAsString("https://your-app.com/tenant_id"),
                roles = jwt.getClaimAsStringList("https://your-app.com/roles")
            )
        )
        
        return response
    }
}