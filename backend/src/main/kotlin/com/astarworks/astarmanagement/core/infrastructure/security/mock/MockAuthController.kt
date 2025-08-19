package com.astarworks.astarmanagement.core.infrastructure.security.mock

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Simple mock authentication controller for local development.
 * Provides JWT token generation and JWKS endpoints.
 */
@RestController
@RequestMapping("/mock-auth")
@ConditionalOnProperty(
    name = ["auth.mock.enabled"],
    havingValue = "true",
    matchIfMissing = false
)
class MockAuthController(
    private val mockAuthService: MockAuthService
) {
    
    /**
     * Get JWKS (JSON Web Key Set) for JWT verification.
     */
    @GetMapping("/.well-known/jwks.json", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun getJwks(): Map<String, Any> {
        return mockAuthService.getJwks()
    }
    
    /**
     * Generate a mock JWT token for testing.
     * Returns a simple token with default claims.
     */
    @PostMapping("/token", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun generateToken(): ResponseEntity<Map<String, Any>> {
        return try {
            val token = mockAuthService.generateToken()
            ResponseEntity.ok(mapOf(
                "access_token" to token,
                "token_type" to "Bearer",
                "expires_in" to 3600
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                mapOf(
                    "error" to "token_generation_failed",
                    "message" to "Failed to generate mock token"
                )
            )
        }
    }
}