package com.astarworks.astarmanagement.core.infrastructure.security.integration

import com.astarworks.astarmanagement.base.IntegrationTest
import org.hamcrest.Matchers.hasSize
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Integration tests for JWT authentication flow with SecurityConfig.
 * Tests end-to-end JWT processing including custom converters and handlers.
 */
@SpringBootTest
@ActiveProfiles("test")
class JwtIntegrationTest : IntegrationTest() {
    
    @Test
    @DisplayName("JWT authentication flow - valid token")
    fun `should authenticate with valid JWT token`() {
        mockMvc.perform(get("/api/v1/auth/me")
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_USER"))
                    .jwt { it.subject("integration-test-user")
                        .claim("email", "integration@test.com")
                        .claim("name", "Integration Test User")
                        .audience(listOf("local-dev-api")) }))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.subject").value("integration-test-user"))
            .andExpect(jsonPath("$.email").value("integration@test.com"))
    }
    
    @Test
    @DisplayName("JWT role mapping - business context extraction")
    fun `should map JWT claims to business roles correctly`() {
        mockMvc.perform(get("/api/v1/auth/business-context")
                .with(jwt()
                    .authorities(
                        SimpleGrantedAuthority("ROLE_ADMIN"),
                        SimpleGrantedAuthority("ROLE_USER")
                    )
                    .jwt { it.subject("multi-role-user")
                        .claim("https://your-app.com/roles", listOf("ADMIN", "USER"))
                        .claim("https://your-app.com/tenant_id", "tenant-123")
                        .claim("org_id", "org-456") }))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.businessContext.userId").value("multi-role-user"))
            .andExpect(jsonPath("$.businessContext.roles").isArray)
            .andExpect(jsonPath("$.springSecurityAuthorities").value(hasSize<Any>(2)))
            .andExpect(jsonPath("$.springSecurityAuthorities[0]").value("ROLE_ADMIN"))
            .andExpect(jsonPath("$.springSecurityAuthorities[1]").value("ROLE_USER"))
    }
    
    @Test
    @DisplayName("JWT claims processing - all expected claims")
    fun `should process all expected JWT claims correctly`() {
        mockMvc.perform(get("/api/v1/auth/claims")
                .with(jwt()
                    .jwt { it.subject("claims-test-user")
                        .claim("email", "claims@test.com")
                        .claim("email_verified", true)
                        .claim("name", "Claims Test User")
                        .claim("picture", "https://example.com/avatar.jpg")
                        .claim("scope", "read:profile write:profile")
                        .audience(listOf("local-dev-api")) }))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.sub").value("claims-test-user"))
            .andExpect(jsonPath("$.email").value("claims@test.com"))
            .andExpect(jsonPath("$.email_verified").value(true))
            .andExpect(jsonPath("$.name").value("Claims Test User"))
            .andExpect(jsonPath("$.picture").value("https://example.com/avatar.jpg"))
            .andExpect(jsonPath("$.scope").value("read:profile write:profile"))
    }
    
    @Test
    @DisplayName("Custom authentication entry point")
    fun `should use custom authentication entry point for 401 errors`() {
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized)
            .andExpect(header().exists("Content-Type"))
    }
    
    @Test
    @DisplayName("Custom access denied handler")
    fun `should use custom access denied handler for 403 errors`() {
        mockMvc.perform(get("/api/v1/test/admin-only")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_USER"))))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @DisplayName("JWT with business roles - role-based endpoint access")
    fun `should grant access based on business roles extracted from JWT`() {
        // Test ADMIN role access
        mockMvc.perform(get("/api/v1/test/admin-only")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_ADMIN"))))
            .andExpect(status().isOk)
        
        // Test USER role access
        mockMvc.perform(get("/api/v1/test/user-only")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_USER"))))
            .andExpect(status().isOk)
        
        // Test VIEWER role access
        mockMvc.perform(get("/api/v1/test/viewer-only")
                .with(jwt().authorities(SimpleGrantedAuthority("ROLE_VIEWER"))))
            .andExpect(status().isOk)
    }
    
    @Test
    @DisplayName("JWT authentication converter integration")
    fun `should properly convert JWT to authentication token with authorities`() {
        mockMvc.perform(get("/api/v1/auth/business-context")
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt { it.subject("converter-test-user")
                        .claim("https://your-app.com/roles", listOf("ADMIN"))
                        .claim("https://your-app.com/tenant_id", "tenant-999") }))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.businessContext.userId").value("converter-test-user"))
            .andExpect(jsonPath("$.springSecurityAuthorities[0]").value("ROLE_ADMIN"))
            .andExpect(jsonPath("$.rawJwtClaims").exists())
    }
}