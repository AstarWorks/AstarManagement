package com.astarworks.astarmanagement.core.auth.api.controller
import org.springframework.web.server.ResponseStatusException

import com.astarworks.astarmanagement.core.auth.api.dto.*
import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.service.*
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID
import jakarta.validation.Valid

/**
 * REST controller for user role management.
 * Provides endpoints for assigning roles to users, checking permissions,
 * and managing current user's role information.
 */
@RestController
@RequestMapping("/api/v1/user-roles")
@PreAuthorize("isAuthenticated()")
class UserRoleController(
    private val userRoleService: UserRoleService,
    private val roleManagementService: RoleManagementService,
    private val rolePermissionService: RolePermissionService,
    private val authorizationService: AuthorizationService,
    private val tenantMembershipRepository: TenantMembershipRepository,
    private val tenantContextService: TenantContextService
) {
    private val logger = LoggerFactory.getLogger(UserRoleController::class.java)
    
    // === Current User Endpoints (/me) ===
    
    /**
     * Gets current user's roles.
     * 
     * @return List of roles assigned to the current user
     */
    @GetMapping("/me/roles")
    fun getMyRoles(
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): List<RoleResponse> {
        logger.debug("Getting roles for current user: ${principal.tenantUserId}")
        
        val roles = authorizationService.getUserEffectiveRoles(principal.tenantUserId)
        val responses = roles.map { role ->
            RoleResponse(
                id = role.id.value,
                tenantId = role.tenantId?.value,
                name = role.name,
                displayName = role.displayName,
                color = role.color,
                position = role.position,
                isSystem = role.isSystem,
                permissions = null,
                userCount = null,
                createdAt = role.createdAt,
                updatedAt = role.updatedAt
            )
        }
        
        return responses
    }
    
    /**
     * Gets current user's effective permissions.
     * Returns all permissions from all assigned roles, with details about which role grants which permission.
     * 
     * @return User permissions response with roles, effective permissions, and permission breakdown
     */
    @GetMapping("/me/permissions")
    fun getMyPermissions(
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): UserPermissionsResponse {
        logger.debug("Getting permissions for current user: ${principal.tenantUserId}")
        
        // Get user's roles
        val roles = authorizationService.getUserEffectiveRoles(principal.tenantUserId)
        
        // Get effective permissions
        val effectivePermissions = authorizationService.getUserEffectivePermissions(principal.tenantUserId)
        
        // Build permission breakdown by role
        val permissionsByRoleList = roles.map { role ->
            val rolePermissions = rolePermissionService.getRolePermissionRules(role.id)
            RolePermissions(
                roleName = role.name,
                permissions = rolePermissions.map { PermissionRule.fromDatabaseString(it) }
            )
        }
        
        // Convert roles to response DTOs
        val roleResponses = roles.map { role ->
            val permissions = rolePermissionService.getRolePermissionRules(role.id)
            RoleResponse(
                id = role.id.value,
                tenantId = role.tenantId?.value,
                name = role.name,
                displayName = role.displayName,
                color = role.color,
                position = role.position,
                isSystem = role.isSystem,
                permissions = permissions?.map { PermissionRule.fromDatabaseString(it) },
                userCount = null,
                createdAt = role.createdAt,
                updatedAt = role.updatedAt
            )
        }
        
        val response = UserPermissionsResponse(
            userId = principal.userId,
            tenantUserId = principal.tenantUserId,
            roles = roleResponses,
            effectivePermissions = effectivePermissions.map { PermissionRule.fromDatabaseString(it) }.toSet(),
            permissionsByRole = permissionsByRoleList
        )
        
        return response
    }
    
    /**
     * Checks if current user has a specific permission.
     * 
     * @param permission Permission rule to check
     * @return Boolean indicating if user has the permission
     */
    @GetMapping("/me/permissions/check")
    fun checkMyPermission(
        @RequestParam permission: String,
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): Map<String, Any> {
        logger.debug("Checking permission '$permission' for user: ${principal.tenantUserId}")
        
        val permissionRule = try {
            PermissionRule.fromDatabaseString(permission)
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid permission format: $permission")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid permission format: $permission")
        }
        
        val hasPermission = authorizationService.hasPermission(principal.tenantUserId, permissionRule)
        
        val response = mapOf(
            "permission" to permission,
            "hasPermission" to hasPermission,
            "userId" to principal.userId,
            "tenantUserId" to principal.tenantUserId
        )
        
        return response
    }
    
    /**
     * Checks if current user can access a specific resource.
     * 
     * @param resourceId Resource ID
     * @param resourceType Resource type (e.g., "document", "table")
     * @param action Action to perform (e.g., "view", "edit", "delete")
     * @return Boolean indicating if user can access the resource
     */
    @PostMapping("/me/permissions/check-resource")
    fun checkMyResourceAccess(
        @RequestParam resourceId: UUID,
        @RequestParam resourceType: String,
        @RequestParam action: String,
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): Map<String, Any> {
        logger.debug("Checking resource access for user ${principal.tenantUserId}: $resourceType:$resourceId with action $action")
        
        val resourceTypeEnum = try {
            ResourceType.valueOf(resourceType.uppercase())
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid resource type: $resourceType")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resource type: $resourceType")
        }
        
        val actionEnum = try {
            Action.valueOf(action.uppercase())
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid action: $action")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid action: $action")
        }
        
        val canAccess = authorizationService.canAccessResource(
            principal.tenantUserId,
            resourceId,
            resourceTypeEnum,
            actionEnum
        )
        
        val response = mapOf(
            "resourceId" to resourceId,
            "resourceType" to resourceType,
            "action" to action,
            "canAccess" to canAccess,
            "userId" to principal.userId,
            "tenantUserId" to principal.tenantUserId
        )
        
        return response
    }
    
    // === User Role Management Endpoints ===
    
    /**
     * Gets roles assigned to a specific user.
     * 
     * @param userId User ID (tenant user ID)
     * @return List of roles assigned to the user
     */
    @GetMapping("/{userId}/roles")
    @PreAuthorize("hasPermissionRule('user.view.all') or isSelfTenantUser(#userId)")
    fun getUserRoles(
        @PathVariable userId: UUID,
        @RequestParam(defaultValue = "false") includePermissions: Boolean
    ): List<RoleResponse> {
        logger.debug("Getting roles for user: $userId")
        
        val roles = userRoleService.getUserDynamicRoles(userId)
        val responses = roles.map { role ->
            val permissions = if (includePermissions) {
                rolePermissionService.getRolePermissionRules(role.id)
            } else {
                null
            }
            
            RoleResponse(
                id = role.id.value,
                tenantId = role.tenantId?.value,
                name = role.name,
                displayName = role.displayName,
                color = role.color,
                position = role.position,
                isSystem = role.isSystem,
                permissions = permissions?.map { PermissionRule.fromDatabaseString(it) },
                userCount = null,
                createdAt = role.createdAt,
                updatedAt = role.updatedAt
            )
        }
        
        return responses
    }
    
    /**
     * Assigns roles to a user.
     * 
     * @param userId User ID (tenant user ID)
     * @param request List of role IDs to assign
     * @return Assignment result
     */
    @PostMapping("/{userId}/roles")
    @PreAuthorize("hasPermissionRule('user.edit.all')")
    fun assignRoles(
        @PathVariable userId: UUID,
        @Valid @RequestBody request: UserRoleAssignmentRequest,
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): UserRoleAssignmentResult {
        logger.info("Assigning ${request.roleIds.size} roles to user: $userId")
        
        val assignedRoles = mutableListOf<UUID>()
        val failedRoles = mutableListOf<FailedRoleAssignment>()
        
        request.roleIds.forEach { roleId ->
            try {
                // Verify role exists and belongs to the tenant
                val roleIdValue = RoleId(roleId)
                val role = roleManagementService.findById(roleIdValue)
                if (role == null) {
                    failedRoles.add(FailedRoleAssignment(roleId, "Role not found"))
                } else {
                    val tenantUuid = tenantContextService.requireTenantContext()
                    if (role.tenantId != null && role.tenantId?.value != tenantUuid) {
                        failedRoles.add(FailedRoleAssignment(roleId, "Role does not belong to this tenant"))
                    } else {
                        // Create user role assignment
                        val userRole = UserRole(
                            tenantUserId = TenantMembershipId(userId),
                            roleId = roleIdValue,
                            assignedAt = Instant.now(),
                            assignedBy = UserId(principal.userId)
                        )
                        userRoleService.assignRole(userId, roleId, principal.userId)
                        assignedRoles.add(roleId)
                    }
                }
            } catch (e: Exception) {
                logger.error("Failed to assign role $roleId to user $userId", e)
                failedRoles.add(FailedRoleAssignment(roleId, e.message ?: "Unknown error"))
            }
        }
        
        val result = UserRoleAssignmentResult(
            userId = userId,
            assignedRoles = assignedRoles,
            failedRoles = failedRoles,
            totalAssigned = assignedRoles.size
        )
        
        return result
    }
    
    /**
     * Removes a role from a user.
     * 
     * @param userId User ID (tenant user ID)
     * @param roleId Role ID to remove
     */
    @DeleteMapping("/{userId}/roles/{roleId}")
    @PreAuthorize("hasPermissionRule('user.edit.all')")
    fun removeRole(
        @PathVariable userId: UUID,
        @PathVariable roleId: UUID
    ): Unit {
        logger.info("Removing role $roleId from user: $userId")
        
        userRoleService.removeRole(userId, roleId)
        return Unit
    }
    
    /**
     * Replaces all roles for a user (sync operation).
     * 
     * @param userId User ID (tenant user ID)
     * @param request List of role IDs to set (replaces all existing roles)
     * @return Assignment result
     */
    @PutMapping("/{userId}/roles")
    @PreAuthorize("hasPermissionRule('user.edit.all')")
    fun setUserRoles(
        @PathVariable userId: UUID,
        @Valid @RequestBody request: UserRoleAssignmentRequest,
        @AuthenticationPrincipal principal: AuthenticatedUserContext
    ): UserRoleAssignmentResult {
        logger.info("Setting ${request.roleIds.size} roles for user: $userId (replacing existing)")
        
        // Remove all existing roles
        userRoleService.removeAllRoles(userId)
        
        // Assign new roles
        return assignRoles(userId, request, principal)
    }
    
    /**
     * Gets effective permissions for a specific user.
     * 
     * @param userId User ID (tenant user ID)
     * @return User permissions response
     */
    @GetMapping("/{userId}/permissions")
    @PreAuthorize("hasPermissionRule('user.view.all') or isSelfTenantUser(#userId)")
    fun getUserPermissions(
        @PathVariable userId: UUID
    ): UserPermissionsResponse {
        logger.debug("Getting permissions for user: $userId")
        
        // Get tenant membership details
        val tenantMembership = tenantMembershipRepository.findById(TenantMembershipId(userId))
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        // Get user's roles
        val roles = authorizationService.getUserEffectiveRoles(userId)
        
        // Get effective permissions
        val effectivePermissions = authorizationService.getUserEffectivePermissions(userId)
        
        // Build permission breakdown by role
        val permissionsByRoleList = roles.map { role ->
            val rolePermissions = rolePermissionService.getRolePermissionRules(role.id)
            RolePermissions(
                roleName = role.name,
                permissions = rolePermissions.map { PermissionRule.fromDatabaseString(it) }
            )
        }
        
        // Convert roles to response DTOs
        val roleResponses = roles.map { role ->
            val permissions = rolePermissionService.getRolePermissionRules(role.id)
            RoleResponse(
                id = role.id.value,
                tenantId = role.tenantId?.value,
                name = role.name,
                displayName = role.displayName,
                color = role.color,
                position = role.position,
                isSystem = role.isSystem,
                permissions = permissions?.map { PermissionRule.fromDatabaseString(it) },
                userCount = null,
                createdAt = role.createdAt,
                updatedAt = role.updatedAt
            )
        }
        
        val response = UserPermissionsResponse(
            userId = tenantMembership.userId.value,
            tenantUserId = userId,
            roles = roleResponses,
            effectivePermissions = effectivePermissions.map { PermissionRule.fromDatabaseString(it) }.toSet(),
            permissionsByRole = permissionsByRoleList
        )
        
        return response
    }
}