package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Tests for endpoints that require authentication but accept any valid role.
 */
class AuthenticationRequiredTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("Authenticated endpoint should return 401 without authentication")
    fun `authenticated endpoint should require authentication`() {
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT))
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    @DisplayName("Authenticated endpoint should accept ADMIN role")
    fun `authenticated endpoint should accept ADMIN role`() {
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(AUTHENTICATED_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles").isArray)
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_ADMIN"))
            .andExpect(jsonPath("$.testResult").value("SUCCESS"))
    }
    
    @Test
    @WithMockUser(roles = ["USER"])
    @DisplayName("Authenticated endpoint should accept USER role")
    fun `authenticated endpoint should accept USER role`() {
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(AUTHENTICATED_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_USER"))
    }
    
    @Test
    @WithMockUser(roles = ["VIEWER"])
    @DisplayName("Authenticated endpoint should accept VIEWER role")
    fun `authenticated endpoint should accept VIEWER role`() {
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(AUTHENTICATED_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_VIEWER"))
    }
}