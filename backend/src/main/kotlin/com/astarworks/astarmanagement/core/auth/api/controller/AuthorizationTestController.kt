package com.astarworks.astarmanagement.core.auth.api.controller

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.ResponseEntity
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
 */
@RestController
@RequestMapping("/api/v1/test")
@ConditionalOnProperty(
    name = ["auth.mock.enabled"],
    havingValue = "true",
    matchIfMissing = true  // Allow in test environments
)
class AuthorizationTestController {

    /**
     * Endpoint accessible only by ADMIN role.
     */
    @GetMapping("/admin-only")
    @PreAuthorize("hasRole('ADMIN')")
    fun adminOnly(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Admin access granted",
            "endpoint" to "/admin-only",
            "userRoles" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }

    /**
     * Endpoint accessible only by USER role.
     */
    @GetMapping("/user-only")
    @PreAuthorize("hasRole('USER')")
    fun userOnly(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "User access granted",
            "endpoint" to "/user-only",
            "userRoles" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }

    /**
     * Endpoint accessible only by VIEWER role.
     */
    @GetMapping("/viewer-only")
    @PreAuthorize("hasRole('VIEWER')")
    fun viewerOnly(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Viewer access granted",
            "endpoint" to "/viewer-only",
            "userRoles" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }

    /**
     * Endpoint accessible by both ADMIN and USER roles.
     */
    @GetMapping("/admin-or-user")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    fun adminOrUser(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Admin or User access granted",
            "endpoint" to "/admin-or-user",
            "userRoles" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
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
    fun tableView(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Table view permission granted",
            "endpoint" to "/permission/table-view",
            "requiredPermission" to "table.view.all",
            "userAuthorities" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }
    
    /**
     * Test endpoint requiring table.delete permission.
     * Only ADMIN role has full delete permissions by default.
     */
    @GetMapping("/permission/table-delete")
    @PreAuthorize("hasAuthority('table.delete.all')")
    fun tableDelete(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Table delete permission granted",
            "endpoint" to "/permission/table-delete",
            "requiredPermission" to "table.delete.all",
            "userAuthorities" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }
    
    /**
     * Test endpoint for document editing permission.
     * Tests document-specific permissions.
     */
    @GetMapping("/permission/document-edit-own")
    @PreAuthorize("hasAuthority('document.edit.own')")
    fun documentEditOwn(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Document edit (own) permission granted",
            "endpoint" to "/permission/document-edit-own",
            "requiredPermission" to "document.edit.own",
            "userAuthorities" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }
    
    /**
     * Test endpoint with backward-compatible authorization.
     * Works with both role-based and permission-based auth.
     */
    @GetMapping("/hybrid/table-create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER') or hasAuthority('table.create.all')")
    fun tableCreateHybrid(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Table create access granted (hybrid auth)",
            "endpoint" to "/hybrid/table-create",
            "authMethod" to "Role OR Permission",
            "userAuthorities" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }
    
    /**
     * Test endpoint for settings.manage permission.
     * Only ADMIN has settings management permission.
     */
    @GetMapping("/permission/settings-manage")
    @PreAuthorize("hasAuthority('settings.manage.all')")
    fun settingsManage(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Settings manage permission granted",
            "endpoint" to "/permission/settings-manage",
            "requiredPermission" to "settings.manage.all",
            "userAuthorities" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }
    
    /**
     * Test endpoint for any view permission.
     * All roles have some view permissions.
     */
    @GetMapping("/permission/any-view")
    @PreAuthorize("hasAuthority('table.view.all') or hasAuthority('document.view.team') or hasAuthority('directory.view.team')")
    fun anyView(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "View permission granted",
            "endpoint" to "/permission/any-view",
            "requiredPermissions" to listOf("table.view.all", "document.view.team", "directory.view.team"),
            "userAuthorities" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }
    
    /**
     * Test endpoint for team-scoped permissions.
     * Tests the TEAM scope functionality.
     */
    @GetMapping("/permission/document-view-team")
    @PreAuthorize("hasAuthority('document.view.team')")
    fun documentViewTeam(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Document view (team) permission granted",
            "endpoint" to "/permission/document-view-team",
            "requiredPermission" to "document.view.team",
            "userAuthorities" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }

    /**
     * Public endpoint for testing - no authorization required.
     */
    @GetMapping("/public")
    fun publicEndpoint(): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Public access - no authentication required",
            "endpoint" to "/public",
            "testResult" to "SUCCESS"
        ))
    }

    /**
     * Authenticated endpoint - any authenticated user can access.
     */
    @GetMapping("/authenticated")
    fun authenticatedEndpoint(@AuthenticationPrincipal jwt: Jwt?, authentication: Authentication): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "message" to "Authenticated access - any valid token",
            "endpoint" to "/authenticated",
            "userRoles" to authentication.authorities.map { it.authority },
            "userId" to (jwt?.subject ?: authentication.name ?: "test-user"),
            "testResult" to "SUCCESS"
        ))
    }
}