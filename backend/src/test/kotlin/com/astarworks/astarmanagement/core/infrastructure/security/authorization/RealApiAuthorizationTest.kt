package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Comprehensive tests comparing real API authorization with test API authorization.
 * Ensures consistent security behavior between production and test endpoints.
 */
class RealApiAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("Real API vs Test API - consistent authorization behavior for authenticated users")
    fun `should have consistent authorization between real and test APIs for authenticated users`() {
        // テスト専用API（@PreAuthorize使用）- 認証が必要
        mockMvc.perform(get("/api/v1/test/authenticated")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_USER"))))
            .andExpect(status().isOk)
        
        // 実際のAPI（URL-based認可）- 認証が必要
        mockMvc.perform(get("/api/v1/auth/me")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_USER"))
                    .jwt { it.subject("consistency-test-user")
                        .claim("email", "test@consistency.com") }))
            .andExpect(status().isOk)
    }
    
    @Test
    @DisplayName("Authorization consistency - unauthenticated access denied")
    fun `should consistently deny unauthenticated access to protected endpoints`() {
        val protectedEndpoints = listOf(
            "/api/v1/test/authenticated", // Test API with @PreAuthorize
            "/api/v1/auth/me",            // Real API with URL-based auth
            "/api/v1/auth/claims",        // Real API with URL-based auth
            "/api/v1/auth/business-context" // Real API with URL-based auth
        )
        
        protectedEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Test
    @DisplayName("Role-based access - consistent behavior across API types")
    fun `should handle role-based access consistently across real and test APIs`() {
        // ADMIN role should work on both admin-only test endpoint and business context endpoint
        mockMvc.perform(get("/api/v1/test/admin-only")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_ADMIN"))))
            .andExpect(status().isOk)
        
        mockMvc.perform(get("/api/v1/auth/business-context")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt { it.subject("admin-user")
                        .claim("https://your-app.com/roles", listOf("ADMIN")) }))
            .andExpect(status().isOk)
    }
    
    @Test
    @DisplayName("Public endpoints - consistent public access")
    fun `should consistently allow public access to designated endpoints`() {
        val publicEndpoints = listOf(
            "/api/v1/test/public",  // Test API public endpoint
            "/api/v1/health",       // Real API public endpoint
            "/api/v1/health/ping"   // Real API public endpoint
        )
        
        publicEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isOk)
        }
    }
    
    @Test
    @DisplayName("JWT claims processing - consistent between test and real APIs")
    fun `should process JWT claims consistently across test and real endpoints`() {
        val testJwt = jwt()
            .authorities(SimpleGrantedAuthority("ROLE_USER"))
            .jwt { it.subject("claims-comparison-user")
                .claim("email", "compare@claims.com")
                .claim("name", "Claims Comparison User") }
        
        // Test endpoint with JWT
        mockMvc.perform(get("/api/v1/test/authenticated").with(testJwt))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_USER"))
            .andExpect(jsonPath("$.userId").value("claims-comparison-user"))
        
        // Real endpoint with same JWT
        mockMvc.perform(get("/api/v1/auth/me").with(testJwt))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.subject").value("claims-comparison-user"))
            .andExpect(jsonPath("$.email").value("compare@claims.com"))
    }
    
    @Test
    @DisplayName("Error handling consistency - 401 and 403 responses")
    fun `should return consistent error responses for unauthorized and forbidden access`() {
        // 401 Unauthorized - No authentication
        val unauthenticatedEndpoints = listOf(
            "/api/v1/test/admin-only",
            "/api/v1/auth/me"
        )
        
        unauthenticatedEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized)
        }
        
        // 403 Forbidden - Wrong role
        val forbiddenTestCases = listOf(
            Pair("/api/v1/test/admin-only", "ROLE_USER"),
            Pair("/api/v1/test/user-only", "ROLE_VIEWER")
        )
        
        forbiddenTestCases.forEach { (endpoint, role) ->
            mockMvc.perform(get(endpoint)
                    .with(jwt().authorities(SimpleGrantedAuthority(role))))
                .andExpect(status().isForbidden)
        }
    }
    
    @Test
    @DisplayName("Multiple roles - consistent handling across API types")
    fun `should handle multiple roles consistently in test and real APIs`() {
        val multiRoleJwt = jwt()
            .authorities(
                SimpleGrantedAuthority("ROLE_ADMIN"),
                SimpleGrantedAuthority("ROLE_USER")
            )
            .jwt { it.subject("multi-role-user")
                .claim("https://your-app.com/roles", listOf("ADMIN", "USER")) }
        
        // Test API with multiple roles
        mockMvc.perform(get("/api/v1/test/admin-or-user").with(multiRoleJwt))
            .andExpect(status().isOk)
        
        // Real API with multiple roles
        mockMvc.perform(get("/api/v1/auth/business-context").with(multiRoleJwt))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.springSecurityAuthorities").isArray)
    }
}