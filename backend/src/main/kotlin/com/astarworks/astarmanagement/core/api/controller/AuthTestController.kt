package com.astarworks.astarmanagement.core.api.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Test controller for Auth0 JWT validation.
 * Provides endpoints to verify JWT authentication is working.
 */
@RestController
@RequestMapping("/api/v1/auth-test")
class AuthTestController {

    /**
     * Test endpoint that requires authentication.
     * Returns JWT claims if authentication successful.
     */
    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal jwt: Jwt): ResponseEntity<Map<String, Any>> {
        val userInfo = mapOf(
            "subject" to jwt.subject,
            "email" to (jwt.getClaimAsString("email") ?: "N/A"),
            "name" to (jwt.getClaimAsString("name") ?: "N/A"),
            "audience" to jwt.audience,
            "issuer" to jwt.issuer.toString(),
            "issuedAt" to jwt.issuedAt.toString(),
            "expiresAt" to jwt.expiresAt.toString(),
            "allClaims" to jwt.claims
        )
        
        return ResponseEntity.ok(userInfo)
    }

    /**
     * Test endpoint for checking specific Auth0 claims.
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
}