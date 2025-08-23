package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

/**
 * Tests for permission-based authorization with generic resource types.
 * Validates that the generic permission-based approach works correctly
 * with TABLE, DOCUMENT, DIRECTORY, and SETTINGS resources.
 */
@DisplayName("Permission-Based Authorization Tests")
class PermissionBasedAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("ADMIN role should have table.delete.all permission")
    @WithMockUser(roles = ["ADMIN"], authorities = ["ROLE_ADMIN", "table.manage.all", "document.manage.all", "settings.manage.all"])
    fun `admin should access table delete endpoint via permission`() {
        mockMvc.perform(get("/api/v1/test/permission/table-delete"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Table delete permission granted"))
            .andExpect(jsonPath("$.requiredPermission").value("table.delete.all"))
    }
    
    @Test
    @DisplayName("USER role should NOT have table.delete.all permission")
    @WithMockUser(roles = ["USER"], authorities = ["ROLE_USER", "table.view.all", "table.create.all", "table.edit.own"])
    fun `user should not access table delete all endpoint`() {
        mockMvc.perform(get("/api/v1/test/permission/table-delete"))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @DisplayName("All roles should have view permissions for their scope")
    @WithMockUser(roles = ["VIEWER"], authorities = ["ROLE_VIEWER", "table.view.team", "document.view.team"])
    fun `viewer should access table view endpoint via permission`() {
        mockMvc.perform(get("/api/v1/test/permission/table-view"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Table view permission granted"))
    }
    
    @Test
    @DisplayName("USER role should have table.create.all permission")
    @WithMockUser(roles = ["USER"], authorities = ["ROLE_USER", "table.view.all", "table.create.all", "table.edit.own"])
    fun `user should access hybrid table create endpoint via permission`() {
        mockMvc.perform(get("/api/v1/test/hybrid/table-create"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Table create access granted (hybrid auth)"))
            .andExpect(jsonPath("$.authMethod").value("Role OR Permission"))
    }
    
    @Test
    @DisplayName("Only ADMIN should have settings.manage.all permission")
    @WithMockUser(roles = ["ADMIN"], authorities = ["ROLE_ADMIN", "settings.manage.all"])
    fun `admin should access settings manage endpoint via permission`() {
        mockMvc.perform(get("/api/v1/test/permission/settings-manage"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Settings manage permission granted"))
    }
    
    @Test
    @DisplayName("USER role should NOT have settings.manage.all permission")
    @WithMockUser(roles = ["USER"], authorities = ["ROLE_USER", "table.view.all", "table.create.all"])
    fun `user should not access settings manage endpoint`() {
        mockMvc.perform(get("/api/v1/test/permission/settings-manage"))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @DisplayName("Any role with view permissions should access any-view endpoint")
    @WithMockUser(authorities = ["table.view.all", "document.view.team"])
    fun `user with view permissions should access any view endpoint`() {
        mockMvc.perform(get("/api/v1/test/permission/any-view"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("View permission granted"))
    }
    
    @Test
    @DisplayName("User without any view permissions should not access any-view endpoint")
    @WithMockUser(authorities = ["table.create.all", "document.edit.own"])
    fun `user without view permissions should not access any view endpoint`() {
        mockMvc.perform(get("/api/v1/test/permission/any-view"))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @DisplayName("MANAGE permission should grant access to all actions for that resource")
    @WithMockUser(authorities = ["table.manage.all"])
    fun `manage permission should grant access to table view`() {
        // MANAGE includes VIEW, CREATE, EDIT, DELETE
        mockMvc.perform(get("/api/v1/test/permission/table-view"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Table view permission granted"))
    }
    
    @Test
    @DisplayName("Full MANAGE permissions should grant access to everything")
    @WithMockUser(authorities = ["table.manage.all", "document.manage.all", "directory.manage.all", "settings.manage.all"])
    fun `full manage permissions should grant access to all endpoints`() {
        // Should access delete endpoint
        mockMvc.perform(get("/api/v1/test/permission/table-delete"))
            .andExpect(status().isOk)
        
        // Should access manage endpoint
        mockMvc.perform(get("/api/v1/test/permission/settings-manage"))
            .andExpect(status().isOk)
        
        // Should access view endpoint
        mockMvc.perform(get("/api/v1/test/permission/table-view"))
            .andExpect(status().isOk)
    }
    
    @Test
    @DisplayName("Direct permission grant should work without role")
    @WithMockUser(authorities = ["table.delete.all"])
    fun `direct permission grant should allow access without role`() {
        mockMvc.perform(get("/api/v1/test/permission/table-delete"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Table delete permission granted"))
    }
    
    @Test
    @DisplayName("Mixed authorities (roles and permissions) should work together")
    @WithMockUser(authorities = ["ROLE_USER", "table.view.all", "table.create.all", "settings.manage.all"])
    fun `mixed authorities should grant appropriate access`() {
        // Should access via permission
        mockMvc.perform(get("/api/v1/test/permission/settings-manage"))
            .andExpect(status().isOk)
        
        // Should access via role
        mockMvc.perform(get("/api/v1/test/user-only"))
            .andExpect(status().isOk)
        
        // Should access via permission
        mockMvc.perform(get("/api/v1/test/permission/table-view"))
            .andExpect(status().isOk)
    }
    
    @Test
    @DisplayName("Scope-based permissions should be respected")
    @WithMockUser(authorities = ["document.edit.own"])
    fun `own scope permission should allow access to document edit own endpoint`() {
        mockMvc.perform(get("/api/v1/test/permission/document-edit-own"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Document edit (own) permission granted"))
    }
    
    @Test
    @DisplayName("Team scope permission should allow access to team resources")
    @WithMockUser(authorities = ["document.view.team"])
    fun `team scope permission should allow access to document view team endpoint`() {
        mockMvc.perform(get("/api/v1/test/permission/document-view-team"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Document view (team) permission granted"))
    }
    
    @Test
    @DisplayName("All scope permission should be most permissive")
    @WithMockUser(authorities = ["table.view.all"])
    fun `all scope permission should allow access to table view endpoint`() {
        mockMvc.perform(get("/api/v1/test/permission/table-view"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Table view permission granted"))
    }
}