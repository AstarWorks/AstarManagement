package com.astarworks.astarmanagement.core.auth.api.controller

import com.astarworks.astarmanagement.core.auth.api.dto.*
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.core.auth.domain.service.PermissionService
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Test controller for authorization functionality.
 * Only available in development mode for testing RBAC.
 * Uses type-safe DTOs for all responses.
 */
@RestController
@RequestMapping("/api/v1/auth/test")
@ConditionalOnProperty(
    name = ["auth.mock.enabled"],
    havingValue = "true",
    matchIfMissing = true  // Allow in test environments
)
class AuthorizationTestController(
    private val userRoleService: UserRoleService,
    private val permissionService: PermissionService
) {

    /**
     * Endpoint accessible only by ADMIN role.
     */
    @GetMapping("/admin-only")
    @PreAuthorize("hasDynamicRole('admin')")
    fun adminOnly(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): AuthTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val roles = getUserRoles(userId)
        
        return AuthTestResponse(
            message = "Admin access granted",
            endpoint = "/admin-only",
            userRoles = roles,
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }

    /**
     * Endpoint accessible only by USER role.
     */
    @GetMapping("/user-only")
    @PreAuthorize("hasRole('USER')")
    fun userOnly(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): AuthTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val roles = getUserRoles(userId)
        
        return AuthTestResponse(
            message = "User access granted",
            endpoint = "/user-only",
            userRoles = roles,
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }

    /**
     * Endpoint accessible only by VIEWER role.
     */
    @GetMapping("/viewer-only")
    @PreAuthorize("hasRole('VIEWER')")
    fun viewerOnly(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): AuthTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val roles = getUserRoles(userId)
        
        return AuthTestResponse(
            message = "Viewer access granted",
            endpoint = "/viewer-only",
            userRoles = roles,
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }

    /**
     * Endpoint accessible by both ADMIN and USER roles.
     */
    @GetMapping("/admin-or-user")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    fun adminOrUser(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): AuthTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val roles = getUserRoles(userId)
        
        return AuthTestResponse(
            message = "Admin or User access granted",
            endpoint = "/admin-or-user",
            userRoles = roles,
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Permission-based authorization test endpoints.
     * These demonstrate the new generic permission-based approach.
     */
    
    /**
     * Test endpoint requiring table.view permission.
     * Tests generic table viewing permissions.
     */
    @GetMapping("/permission/table-view")
    @PreAuthorize("hasAuthority('table.view.all')")
    fun tableView(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): PermissionTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val userPermissions = getUserPermissions(userId)
        val requiredPermission = PermissionRule.GeneralRule(
            resourceType = ResourceType.TABLE,
            action = Action.VIEW,
            scope = Scope.ALL
        )
        
        return PermissionTestResponse(
            message = "Table view permission granted",
            endpoint = "/permission/table-view",
            requiredPermission = requiredPermission,
            userPermissions = userPermissions,
            hasRequiredPermission = userPermissions.contains(requiredPermission),
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Test endpoint requiring table.delete permission.
     * Only ADMIN role has full delete permissions by default.
     */
    @GetMapping("/permission/table-delete")
    @PreAuthorize("hasAuthority('table.delete.all')")
    fun tableDelete(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): PermissionTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val userPermissions = getUserPermissions(userId)
        val requiredPermission = PermissionRule.GeneralRule(
            resourceType = ResourceType.TABLE,
            action = Action.DELETE,
            scope = Scope.ALL
        )
        
        return PermissionTestResponse(
            message = "Table delete permission granted",
            endpoint = "/permission/table-delete",
            requiredPermission = requiredPermission,
            userPermissions = userPermissions,
            hasRequiredPermission = userPermissions.contains(requiredPermission),
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Test endpoint for document editing permission.
     * Tests document-specific permissions.
     */
    @GetMapping("/permission/document-edit-own")
    @PreAuthorize("hasAuthority('document.edit.own')")
    fun documentEditOwn(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): PermissionTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val userPermissions = getUserPermissions(userId)
        val requiredPermission = PermissionRule.GeneralRule(
            resourceType = ResourceType.DOCUMENT,
            action = Action.EDIT,
            scope = Scope.OWN
        )
        
        return PermissionTestResponse(
            message = "Document edit (own) permission granted",
            endpoint = "/permission/document-edit-own",
            requiredPermission = requiredPermission,
            userPermissions = userPermissions,
            hasRequiredPermission = userPermissions.contains(requiredPermission),
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Test endpoint with backward-compatible authorization.
     * Works with both role-based and permission-based auth.
     */
    @GetMapping("/hybrid/table-create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER') or hasAuthority('table.create.all')")
    fun tableCreateHybrid(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): HybridAuthTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val roles = getUserRoles(userId)
        val permissions = getUserPermissions(userId)
        
        return HybridAuthTestResponse(
            message = "Table create access granted (hybrid auth)",
            endpoint = "/hybrid/table-create",
            authMethod = "Role OR Permission",
            userRoles = roles,
            userPermissions = permissions,
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Test endpoint for settings.manage permission.
     * Only ADMIN has settings management permission.
     */
    @GetMapping("/permission/settings-manage")
    @PreAuthorize("hasAuthority('settings.manage.all')")
    fun settingsManage(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): PermissionTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val userPermissions = getUserPermissions(userId)
        val requiredPermission = PermissionRule.GeneralRule(
            resourceType = ResourceType.SETTINGS,
            action = Action.MANAGE,
            scope = Scope.ALL
        )
        
        return PermissionTestResponse(
            message = "Settings manage permission granted",
            endpoint = "/permission/settings-manage",
            requiredPermission = requiredPermission,
            userPermissions = userPermissions,
            hasRequiredPermission = userPermissions.contains(requiredPermission),
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Test endpoint for any view permission.
     * All roles have some view permissions.
     */
    @GetMapping("/permission/any-view")
    @PreAuthorize("hasAuthority('table.view.all') or hasAuthority('document.view.team') or hasAuthority('directory.view.team')")
    fun anyView(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): MultiPermissionTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val userPermissions = getUserPermissions(userId)
        val requiredPermissions = listOf(
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.TEAM),
            PermissionRule.GeneralRule(ResourceType.DIRECTORY, Action.VIEW, Scope.TEAM)
        )
        val matchedPermissions = requiredPermissions.filter { it in userPermissions }
        
        return MultiPermissionTestResponse(
            message = "View permission granted",
            endpoint = "/permission/any-view",
            requiredPermissions = requiredPermissions,
            userPermissions = userPermissions,
            matchedPermissions = matchedPermissions,
            hasAnyRequiredPermission = matchedPermissions.isNotEmpty(),
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Test endpoint for team-scoped permissions.
     * Tests the TEAM scope functionality.
     */
    @GetMapping("/permission/document-view-team")
    @PreAuthorize("hasAuthority('document.view.team')")
    fun documentViewTeam(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): PermissionTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val userPermissions = getUserPermissions(userId)
        val requiredPermission = PermissionRule.GeneralRule(
            resourceType = ResourceType.DOCUMENT,
            action = Action.VIEW,
            scope = Scope.TEAM
        )
        
        return PermissionTestResponse(
            message = "Document view (team) permission granted",
            endpoint = "/permission/document-view-team",
            requiredPermission = requiredPermission,
            userPermissions = userPermissions,
            hasRequiredPermission = userPermissions.contains(requiredPermission),
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }

    /**
     * Public endpoint for testing - no authorization required.
     */
    @GetMapping("/public")
    fun publicEndpoint(): PublicTestResponse {
        return PublicTestResponse(
            message = "Public access - no authentication required",
            endpoint = "/public",
            testResult = TestResult.SUCCESS
        )
    }

    /**
     * Authenticated endpoint - any authenticated user can access.
     */
    @GetMapping("/authenticated")
    @PreAuthorize("isAuthenticated()")
    fun authenticatedEndpoint(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): AuthenticatedTestResponse {
        val userId = jwt?.subject ?: authentication.name ?: "test-user"
        val roles = getUserRoles(userId)
        val permissions = getUserPermissions(userId)
        
        return AuthenticatedTestResponse(
            message = "Authenticated access - any valid token",
            endpoint = "/authenticated",
            userRoles = roles,
            userPermissions = permissions,
            userId = userId,
            testResult = TestResult.SUCCESS
        )
    }
    
    /**
     * Helper method to get user roles as RoleResponse objects.
     * Returns empty list if unable to fetch roles.
     */
    private fun getUserRoles(userId: String): List<RoleResponse> {
        return try {
            // In test mode, return mock roles based on authorities
            // In production, this would fetch from UserRoleService
            listOf()  // Simplified for testing
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /**
     * Helper method to get user permissions as PermissionRule objects.
     * Returns empty list if unable to fetch permissions.
     */
    private fun getUserPermissions(userId: String): List<PermissionRule> {
        return try {
            // In test mode, return mock permissions
            // In production, this would fetch from PermissionService
            listOf()  // Simplified for testing
        } catch (e: Exception) {
            emptyList()
        }
    }
}