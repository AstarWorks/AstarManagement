package com.astarworks.astarmanagement.core.infrastructure.security.integration

import com.astarworks.astarmanagement.base.IntegrationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

/**
 * Integration tests for URL-based authorization configured in SecurityConfig.
 * Tests that SecurityFilterChain correctly protects endpoints based on URL patterns.
 */
@SpringBootTest
@ActiveProfiles("test")
class UrlBasedAuthorizationTest : IntegrationTest() {
    
    @Test
    @DisplayName("Public endpoints - no authentication required")
    fun `should allow access to public endpoints without authentication`() {
        val publicEndpoints = listOf(
            "/actuator/health",
            "/api/v1/health",
            "/api/v1/test/public"
        )
        
        publicEndpoints.forEach { endpoint ->
            // Test that endpoints are accessible (200) or at least not returning 401/403
            mockMvc.perform(get(endpoint))
                .andExpect(status().isOk)
        }
    }
    
    @Test
    @DisplayName("Protected API endpoints - authentication required")
    fun `should require authentication for API endpoints`() {
        val protectedEndpoints = listOf(
            "/api/v1/auth/me",
            "/api/v1/auth/claims",
            "/api/v1/auth/business-context"
        )
        
        protectedEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Test
    @DisplayName("Test endpoints - mixed access control")
    fun `should handle test endpoints with mixed access control`() {
        // Public test endpoint
        mockMvc.perform(get("/api/v1/test/public"))
            .andExpect(status().isOk)
        
        // Protected test endpoints
        val protectedTestEndpoints = listOf(
            "/api/v1/test/authenticated",
            "/api/v1/test/admin-only",
            "/api/v1/test/user-only",
            "/api/v1/test/viewer-only",
            "/api/v1/test/admin-or-user"
        )
        
        protectedTestEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Test
    @DisplayName("Development-only endpoints - conditional access")
    fun `should handle development only endpoints correctly`() {
        // auth.mock.enabled=trueの場合のみアクセス可能
        mockMvc.perform(get("/api/v1/debug/config"))
            .andExpect(status().isOk)
        
        mockMvc.perform(get("/api/v1/debug/health"))
            .andExpect(status().isOk)
    }
    
    @Test
    @DisplayName("Mock auth endpoints are publicly accessible in test environment")
    fun `should allow access to mock auth endpoints in test environment`() {
        val mockAuthEndpoints = listOf(
            "/mock-auth/.well-known/jwks.json"
        )
        
        mockAuthEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().`is`(200))
        }
    }
    
    @Test
    @DisplayName("Unknown API endpoints are protected")
    fun `should protect unknown API endpoints`() {
        val unknownEndpoints = listOf(
            "/api/v1/unknown",
            "/api/v2/test",
            "/api/admin/secret"
        )
        
        unknownEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized)
        }
    }
}