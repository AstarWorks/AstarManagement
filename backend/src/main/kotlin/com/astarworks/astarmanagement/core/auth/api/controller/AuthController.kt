package com.astarworks.astarmanagement.core.auth.api.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import com.astarworks.astarmanagement.core.auth.infrastructure.jwt.JwtClaimsExtractor

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
     * Returns JWT claims if authentication successful.
     */
    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal jwt: Jwt): ResponseEntity<Map<String, Any>> {
        val userInfo = mapOf(
            "subject" to jwt.subject,
            "email" to (jwt.getClaimAsString("email") ?: "N/A"),
            "name" to (jwt.getClaimAsString("name") ?: "N/A"),
            "audience" to jwt.audience,
            "issuer" to (jwt.issuer?.toString() ?: "N/A"),
            "issuedAt" to jwt.issuedAt.toString(),
            "expiresAt" to jwt.expiresAt.toString(),
            "allClaims" to jwt.claims
        )
        
        return ResponseEntity.ok(userInfo)
    }

    /**
     * Get specific JWT claims.
     * Returns formatted JWT claims for client consumption.
     */
    @GetMapping("/claims")
    fun getJwtClaims(@AuthenticationPrincipal jwt: Jwt): ResponseEntity<Map<String, Any?>> {
        val claims = mapOf(
            "sub" to jwt.subject,
            "email" to jwt.getClaimAsString("email"),
            "email_verified" to jwt.getClaimAsBoolean("email_verified"),
            "name" to jwt.getClaimAsString("name"),
            "picture" to jwt.getClaimAsString("picture"),
            "aud" to jwt.audience,
            "iss" to jwt.issuer?.toString(),
            "iat" to jwt.issuedAt,
            "exp" to jwt.expiresAt,
            "scope" to jwt.getClaimAsString("scope")
        )
        
        return ResponseEntity.ok(claims)
    }

    /**
     * Get business context extracted from JWT.
     * Returns business-specific information and authorities.
     */
    @GetMapping("/business-context")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'VIEWER')")
    fun getBusinessContext(@AuthenticationPrincipal jwt: Jwt, authentication: Authentication): ResponseEntity<Map<String, Any?>> {
        val businessContext = jwtClaimsExtractor.extractBusinessContext(jwt)
        val authorities = authentication.authorities.map { it.authority }
        
        val response = mapOf(
            "businessContext" to mapOf(
                "userId" to businessContext.userId,
                "tenantId" to businessContext.tenantId,
                "roles" to businessContext.roles.map { it.name }
            ),
            "springSecurityAuthorities" to authorities,
            "rawJwtClaims" to mapOf(
                "org_id" to jwt.getClaimAsString("org_id"),
                "custom_tenant_id" to jwt.getClaimAsString("https://your-app.com/tenant_id"),
                "roles" to jwt.getClaimAsStringList("https://your-app.com/roles")
            )
        )
        
        return ResponseEntity.ok(response)
    }
}