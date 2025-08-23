package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Tests for JWT claims extraction and authority mapping.
 * Tests JWT request post processors and claims handling.
 */
class JwtClaimsAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("Should extract correct authorities from JWT claims")
    fun `should extract correct authorities from JWT claims`() {
        mockMvc.perform(
            get(AUTHENTICATED_ENDPOINT)
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt { it.subject("user123")
                        .claim("email", "test@example.com")
                        .claim("name", "Test User") }
                )
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.userRoles").isArray)
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_ADMIN"))
            .andExpect(jsonPath("$.userId").value("user123"))
    }
    
    @Test 
    @DisplayName("Should support multiple authorities in JWT")
    fun `should support multiple authorities in JWT`() {
        mockMvc.perform(
            get(AUTHENTICATED_ENDPOINT)
                .with(jwt()
                    .authorities(
                        SimpleGrantedAuthority("ROLE_ADMIN"),
                        SimpleGrantedAuthority("ROLE_USER")
                    )
                    .jwt { it.subject("admin-user-123")
                        .claim("email", "admin@example.com") }
                )
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.userRoles").isArray)
            .andExpect(jsonPath("$.userRoles.length()").value(2))
    }
    
    @Test
    @DisplayName("Admin endpoint should work with JWT post processor")
    fun `admin endpoint should work with JWT post processor`() {
        mockMvc.perform(
            get(ADMIN_ONLY_ENDPOINT)
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_ADMIN"))
                    .jwt { it.subject("admin123") }
                )
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(ADMIN_ACCESS_MESSAGE))
    }
    
    @Test
    @DisplayName("Admin endpoint should deny non-admin JWT")
    fun `admin endpoint should deny non-admin JWT`() {
        mockMvc.perform(
            get(ADMIN_ONLY_ENDPOINT)
                .with(jwt()
                    .authorities(SimpleGrantedAuthority("ROLE_USER"))
                    .jwt { it.subject("user123") }
                )
        )
            .andExpect(status().isForbidden)
    }
}