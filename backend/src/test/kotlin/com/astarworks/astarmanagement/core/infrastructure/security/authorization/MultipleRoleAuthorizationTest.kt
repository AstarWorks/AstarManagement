package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Tests for endpoints that accept multiple roles.
 * Tests @PreAuthorize("hasRole('ADMIN') or hasRole('USER')") functionality.
 */
class MultipleRoleAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("Admin-or-User endpoint should return 401 without authentication")
    fun `admin-or-user endpoint should return 401 without authentication`() {
        mockMvc.perform(get(ADMIN_OR_USER_ENDPOINT))
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    @DisplayName("Admin-or-User endpoint should allow ADMIN role")
    fun `admin-or-user endpoint should allow ADMIN role`() {
        mockMvc.perform(get(ADMIN_OR_USER_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(ADMIN_OR_USER_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_ADMIN"))
    }
    
    @Test
    @WithMockUser(roles = ["USER"])
    @DisplayName("Admin-or-User endpoint should allow USER role")
    fun `admin-or-user endpoint should allow USER role`() {
        mockMvc.perform(get(ADMIN_OR_USER_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(ADMIN_OR_USER_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_USER"))
    }
    
    @Test
    @WithMockUser(roles = ["VIEWER"])
    @DisplayName("Admin-or-User endpoint should deny VIEWER role")
    fun `admin-or-user endpoint should deny VIEWER role`() {
        mockMvc.perform(get(ADMIN_OR_USER_ENDPOINT))
            .andExpect(status().isForbidden)
    }
}