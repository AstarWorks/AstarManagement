package com.astarworks.astarmanagement.core.api.controller

import com.astarworks.astarmanagement.base.IntegrationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Integration tests for AuthController endpoints.
 * Tests real API authentication and authorization behavior.
 */
@SpringBootTest
@ActiveProfiles("test")
class AuthControllerTest : IntegrationTest() {
    
    @Test
    @DisplayName("GET /api/v1/auth/me - 認証なしで401エラー")
    fun `should return 401 when accessing auth me without token`() {
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @DisplayName("GET /api/v1/auth/me - 有効なJWTで200レスポンス")
    fun `should return user info when authenticated`() {
        mockMvc.perform(get("/api/v1/auth/me")
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_USER"))
                    .jwt { it.subject("user123")
                        .claim("email", "test@example.com")
                        .claim("name", "Test User")
                        .audience(listOf("local-dev-api")) }))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.subject").value("user123"))
            .andExpect(jsonPath("$.email").value("test@example.com"))
    }
    
    @Test
    @DisplayName("GET /api/v1/auth/claims - JWT claims extraction")
    fun `should extract JWT claims correctly`() {
        mockMvc.perform(get("/api/v1/auth/claims")
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_USER"))
                    .jwt { it.subject("user456")
                        .claim("email", "claims@test.com")
                        .claim("email_verified", true)
                        .claim("name", "Claims User") }))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.sub").value("user456"))
            .andExpect(jsonPath("$.email_verified").value(true))
    }
    
    @Test
    @DisplayName("GET /api/v1/auth/business-context - business context extraction")
    fun `should extract business context from JWT`() {
        mockMvc.perform(get("/api/v1/auth/business-context")
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt { it.subject("admin123")
                        .claim("org_id", "org-456")
                        .claim("https://your-app.com/tenant_id", "tenant-789")
                        .claim("https://your-app.com/roles", listOf("ADMIN")) }))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.businessContext.userId").value("admin123"))
            .andExpect(jsonPath("$.businessContext.tenantId").exists())
            .andExpect(jsonPath("$.springSecurityAuthorities[0]").value("ROLE_ADMIN"))
    }
    
    @Test
    @DisplayName("GET /api/v1/auth/business-context - 認証なしで401エラー")
    fun `should return 401 when accessing business context without authentication`() {
        mockMvc.perform(get("/api/v1/auth/business-context"))
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @DisplayName("GET /api/v1/auth/claims - 認証なしで401エラー") 
    fun `should return 401 when accessing claims without authentication`() {
        mockMvc.perform(get("/api/v1/auth/claims"))
            .andExpect(status().isUnauthorized)
    }
}