package com.astarworks.astarmanagement.shared.testing

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
     * Accepts optional parameters including roles specification.
     */
    @PostMapping("/token", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun generateToken(@RequestBody(required = false) request: Map<String, Any>?): ResponseEntity<Map<String, Any>> {
        return try {
            // Extract roles from request, fallback to default
            val requestedRoles = request?.get("roles") as? List<*>
            val roles = when {
                requestedRoles != null && requestedRoles.isNotEmpty() -> requestedRoles.mapNotNull { it as? String }
                else -> listOf("ADMIN", "USER") // default roles
            }
            
            val token = mockAuthService.generateToken(roles)
            ResponseEntity.ok(mapOf(
                "access_token" to token,
                "token_type" to "Bearer",
                "expires_in" to 3600,
                "roles" to roles
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
    
    /**
     * Generate a mock JWT token with specific role via query parameter.
     * Convenient method for testing different authorization scenarios.
     */
    @GetMapping("/generate-token", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun generateTokenByRole(@RequestParam(required = false) role: String?): ResponseEntity<Map<String, Any>> {
        return try {
            val roles = when (role?.uppercase()) {
                "ADMIN" -> listOf("ADMIN")
                "USER" -> listOf("USER")
                "VIEWER" -> listOf("VIEWER")
                "ADMIN_USER" -> listOf("ADMIN", "USER")
                else -> listOf("ADMIN", "USER") // default
            }
            
            val token = mockAuthService.generateToken(roles)
            ResponseEntity.ok(mapOf(
                "access_token" to token,
                "token_type" to "Bearer",
                "expires_in" to 3600,
                "roles" to roles
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
    
    /**
     * Mock login endpoint for testing.
     * Accepts any credentials and returns a token.
     */
    @PostMapping("/login", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun login(@RequestBody request: Map<String, Any>): ResponseEntity<Map<String, Any>> {
        // In mock mode, accept any credentials
        val email = request["email"] as? String ?: "test@example.com"
        val password = request["password"] as? String ?: "password"
        
        // For mock, always succeed
        val token = mockAuthService.generateToken()
        return ResponseEntity.ok(mapOf(
            "access_token" to token,
            "token_type" to "Bearer",
            "expires_in" to 3600,
            "user" to mapOf(
                "email" to email,
                "name" to "Test User"
            )
        ))
    }
    
    /**
     * Mock token validation endpoint.
     * Validates the structure of a token without full cryptographic verification.
     */
    @GetMapping("/validate", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun validateToken(@RequestHeader("Authorization") authHeader: String?): ResponseEntity<Map<String, Any>> {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                mapOf(
                    "valid" to false,
                    "error" to "Missing or invalid Authorization header"
                )
            )
        }
        
        val token = authHeader.substring(7)
        return try {
            // Basic validation - just check if it's a well-formed JWT
            val parts = token.split(".")
            if (parts.size == 3) {
                ResponseEntity.ok(mapOf<String, Any>(
                    "valid" to true,
                    "message" to "Token structure is valid"
                ))
            } else {
                ResponseEntity.ok(mapOf<String, Any>(
                    "valid" to false,
                    "error" to "Invalid token structure"
                ))
            }
        } catch (e: Exception) {
            ResponseEntity.ok(mapOf<String, Any>(
                "valid" to false,
                "error" to (e.message ?: "Unknown error")
            ))
        }
    }
}