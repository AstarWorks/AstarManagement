package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Tests for endpoints that require ADMIN role authorization.
 * Tests @PreAuthorize("hasRole('ADMIN')") functionality.
 */
class AdminRoleAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("Admin-only endpoint should return 401 without authentication")
    fun `admin-only endpoint should return 401 without authentication`() {
        mockMvc.perform(get(ADMIN_ONLY_ENDPOINT))
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    @DisplayName("Admin-only endpoint should allow ADMIN role")
    fun `admin-only endpoint should allow ADMIN role`() {
        mockMvc.perform(get(ADMIN_ONLY_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(ADMIN_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_ADMIN"))
            .andExpect(jsonPath("$.testResult").value("SUCCESS"))
    }
    
    @Test
    @WithMockUser(roles = ["USER"])
    @DisplayName("Admin-only endpoint should deny USER role")
    fun `admin-only endpoint should deny USER role`() {
        mockMvc.perform(get(ADMIN_ONLY_ENDPOINT))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @WithMockUser(roles = ["VIEWER"])
    @DisplayName("Admin-only endpoint should deny VIEWER role")
    fun `admin-only endpoint should deny VIEWER role`() {
        mockMvc.perform(get(ADMIN_ONLY_ENDPOINT))
            .andExpect(status().isForbidden)
    }
}