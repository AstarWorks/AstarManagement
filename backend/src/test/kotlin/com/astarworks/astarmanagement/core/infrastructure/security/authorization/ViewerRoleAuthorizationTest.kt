package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Tests for endpoints that require VIEWER role authorization.
 * Tests @PreAuthorize("hasRole('VIEWER')") functionality.
 */
class ViewerRoleAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("Viewer-only endpoint should return 401 without authentication")
    fun `viewer-only endpoint should return 401 without authentication`() {
        mockMvc.perform(get(VIEWER_ONLY_ENDPOINT))
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(roles = ["VIEWER"])
    @DisplayName("Viewer-only endpoint should allow VIEWER role")
    fun `viewer-only endpoint should allow VIEWER role`() {
        mockMvc.perform(get(VIEWER_ONLY_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value(VIEWER_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.userRoles[0]").value("ROLE_VIEWER"))
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    @DisplayName("Viewer-only endpoint should deny ADMIN role")
    fun `viewer-only endpoint should deny ADMIN role`() {
        mockMvc.perform(get(VIEWER_ONLY_ENDPOINT))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @WithMockUser(roles = ["USER"])
    @DisplayName("Viewer-only endpoint should deny USER role")
    fun `viewer-only endpoint should deny USER role`() {
        mockMvc.perform(get(VIEWER_ONLY_ENDPOINT))
            .andExpect(status().isForbidden)
    }
}