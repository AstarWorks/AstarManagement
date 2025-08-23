package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Tests for endpoints that require USER role authorization.
 * Tests @PreAuthorize("hasRole('USER')") functionality.
 */
class UserRoleAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("User-only endpoint should return 401 without authentication")
    fun `user-only endpoint should return 401 without authentication`() {
        mockMvc.perform(get(USER_ONLY_ENDPOINT))
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(roles = ["USER"])
    @DisplayName("User-only endpoint should allow USER role")
    fun `user-only endpoint should allow USER role`() {
        mockMvc.perform(get(USER_ONLY_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(USER_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_USER"))
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    @DisplayName("User-only endpoint should deny ADMIN role")
    fun `user-only endpoint should deny ADMIN role`() {
        mockMvc.perform(get(USER_ONLY_ENDPOINT))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @WithMockUser(roles = ["VIEWER"])
    @DisplayName("User-only endpoint should deny VIEWER role")
    fun `user-only endpoint should deny VIEWER role`() {
        mockMvc.perform(get(USER_ONLY_ENDPOINT))
            .andExpect(status().isForbidden)
    }
}