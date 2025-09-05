package com.astarworks.astarmanagement.core.auth.api.controller
import org.springframework.web.server.ResponseStatusException

import com.astarworks.astarmanagement.core.auth.api.dto.*
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.RoleCreateRequest
import com.astarworks.astarmanagement.core.auth.domain.service.RoleManagementService
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.shared.domain.value.*
import java.util.UUID
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import jakarta.validation.Valid
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule

/**
 * REST controller for role management operations.
 * Provides endpoints for CRUD operations on roles, role searches, and special operations.
 * All operations are tenant-scoped and require appropriate permissions.
 */
@RestController
@RequestMapping("/api/v1/roles")
@PreAuthorize("isAuthenticated()")
class RoleController(
    private val roleManagementService: RoleManagementService,
    private val rolePermissionService: RolePermissionService,
    private val userRoleRepository: UserRoleRepository,
    private val tenantContextService: TenantContextService
) {
    private val logger = LoggerFactory.getLogger(RoleController::class.java)
    
    /**
     * Gets all roles for the current tenant.
     * 
     * @return List of roles with optional permission and user count information
     */
    @GetMapping
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun getRoles(
        @RequestParam(defaultValue = "false") includePermissions: Boolean,
        @RequestParam(defaultValue = "false") includeUserCount: Boolean
    ): List<RoleResponse> {
        val tenantUuid = tenantContextService.requireTenantContext()
        val tenantId = TenantId(tenantUuid)
        logger.debug("Getting roles for tenant: $tenantId")
        
        val roles = roleManagementService.findByTenantId(tenantId)
        val responses = roles.map { role ->
            toRoleResponse(role, includePermissions, includeUserCount)
        }
        
        return responses
    }
    
    /**
     * Creates a new role for the current tenant.
     * 
     * @param request Role creation request with name, display name, color, position, and initial permissions
     * @return Created role information
     */
    @PostMapping
    @PreAuthorize("hasPermissionRule('role.create.all')")
    fun createRole(
        @Valid @RequestBody request: RoleCreateRequestDto
    ): RoleResponse {
        val tenantUuid = tenantContextService.requireTenantContext()
        val tenantId = TenantId(tenantUuid)
        logger.info("Creating role '${request.name}' for tenant: $tenantId")
        
        // Convert DTO to domain model
        val createRequest = RoleCreateRequest(
            name = request.name,
            displayName = request.displayName,
            color = request.color,
            position = request.position,
            permissions = request.permissions.map { it.toDatabaseString() }
        )
        
        // Create the role
        val role = roleManagementService.createRole(
            tenantId = tenantId,
            name = createRequest.name,
            displayName = createRequest.displayName,
            color = createRequest.color,
            position = createRequest.position
        )
        
        // Grant initial permissions if specified
        if (request.permissions.isNotEmpty()) {
            rolePermissionService.grantPermissions(role.id, request.permissions.map { it.toDatabaseString() })
        }
        
        val response = toRoleResponse(role, includePermissions = true, includeUserCount = false)
        return response
    }
    
    /**
     * Gets a specific role by ID.
     * 
     * @param id Role ID
     * @return Role information
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun getRole(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "true") includePermissions: Boolean,
        @RequestParam(defaultValue = "true") includeUserCount: Boolean
    ): RoleResponse {
        logger.debug("Getting role: $id")
        
        val roleId = RoleId(id)
        val role = roleManagementService.findById(roleId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        // Verify role belongs to current tenant
        val tenantUuid = tenantContextService.requireTenantContext()
        if (role.tenantId != null && role.tenantId?.value != tenantUuid) {
            // Return 403 Forbidden for cross-tenant access attempts
            // (User is authenticated but not authorized for this resource)
            throw ResponseStatusException(HttpStatus.FORBIDDEN)
        }
        
        val response = toRoleResponse(role, includePermissions, includeUserCount)
        return response
    }
    
    /**
     * Updates role information (display name, color, position).
     * 
     * @param id Role ID
     * @param request Update request with optional fields
     * @return Updated role information
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun updateRole(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RoleUpdateRequest
    ): RoleResponse {
        logger.info("Updating role: $id")
        
        // Verify role belongs to current tenant
        val roleId = RoleId(id)
        val role = roleManagementService.findById(roleId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        val tenantUuid = tenantContextService.requireTenantContext()
        if (role.tenantId != null && role.tenantId?.value != tenantUuid) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val updatedRole = roleManagementService.updateRole(
            id = roleId,
            displayName = request.displayName,
            color = request.color,
            position = request.position
        )
        
        val response = toRoleResponse(updatedRole, includePermissions = true, includeUserCount = false)
        return response
    }
    
    /**
     * Deletes a role.
     * 
     * @param id Role ID
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermissionRule('role.delete.all')")
    fun deleteRole(@PathVariable id: UUID): Unit {
        logger.info("Deleting role: $id")
        
        // Verify role belongs to current tenant
        val roleId = RoleId(id)
        val role = roleManagementService.findById(roleId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        val tenantUuid = tenantContextService.requireTenantContext()
        if (role.tenantId != null && role.tenantId?.value != tenantUuid) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        roleManagementService.deleteRole(roleId)
        return Unit
    }
    
    /**
     * Searches for roles by name or display name.
     * 
     * @param q Search query
     * @return List of matching roles
     */
    @GetMapping("/search")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun searchRoles(
        @RequestParam q: String,
        @RequestParam(defaultValue = "false") includePermissions: Boolean
    ): List<RoleResponse> {
        val tenantUuid = tenantContextService.requireTenantContext()
        val tenantId = TenantId(tenantUuid)
        logger.debug("Searching roles with query '$q' for tenant: $tenantId")
        
        val roles = roleManagementService.searchRoles(tenantId, q)
        val responses = roles.map { role ->
            toRoleResponse(role, includePermissions, includeUserCount = false)
        }
        
        return responses
    }
    
    /**
     * Gets roles that have a specific permission.
     * 
     * @param permission Permission rule to search for
     * @return List of roles with the permission
     */
    @GetMapping("/by-permission")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun getRolesByPermission(
        @RequestParam permission: String
    ): List<RoleResponse> {
        val tenantUuid = tenantContextService.requireTenantContext()
        val tenantId = TenantId(tenantUuid)
        logger.debug("Getting roles with permission '$permission' for tenant: $tenantId")
        
        val roles = roleManagementService.getRolesByPermission(tenantId, permission)
        val responses = roles.map { role ->
            toRoleResponse(role, includePermissions = true, includeUserCount = false)
        }
        
        return responses
    }
    
    /**
     * Reorders multiple roles by updating their positions.
     * 
     * @param request Map of role IDs to new positions
     */
    @PutMapping("/reorder")
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun reorderRoles(
        @Valid @RequestBody request: RoleReorderRequest
    ): Unit {
        val tenantUuid = tenantContextService.requireTenantContext()
        val tenantId = TenantId(tenantUuid)
        logger.info("Reordering ${request.positions.size} roles for tenant: $tenantId")
        
        val positionsMap = request.positions.associate { it.roleId to it.position }
        roleManagementService.reorderRoles(tenantId, positionsMap)
        return Unit
    }
    
    /**
     * Duplicates an existing role with a new name.
     * 
     * @param id Source role ID
     * @param request Duplicate request with new name and permission copy option
     * @return Created duplicate role
     */
    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasPermissionRule('role.create.all')")
    fun duplicateRole(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RoleDuplicateRequest
    ): RoleResponse {
        val tenantUuid = tenantContextService.requireTenantContext()
        val tenantId = TenantId(tenantUuid)
        logger.info("Duplicating role $id as '${request.newName}' for tenant: $tenantId")
        
        val duplicatedRole = roleManagementService.duplicateRole(
            sourceRoleId = id,
            tenantId = tenantId,
            newName = request.newName,
            includePermissions = request.includePermissions
        )
        
        val response = toRoleResponse(duplicatedRole, includePermissions = true, includeUserCount = false)
        return response
    }
    
    /**
     * Exports a role configuration for backup or migration.
     * 
     * @param id Role ID to export
     * @return Role export data
     */
    @GetMapping("/{id}/export")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun exportRole(@PathVariable id: UUID): Any {
        logger.debug("Exporting role: $id")
        
        // Verify role belongs to current tenant
        val roleId = RoleId(id)
        val role = roleManagementService.findById(roleId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        
        val tenantUuid = tenantContextService.requireTenantContext()
        if (role.tenantId != null && role.tenantId?.value != tenantUuid) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val exportData = roleManagementService.exportRole(roleId)
        return exportData
    }
    
    /**
     * Validates if a role can be created with the given name.
     * 
     * @param name Role name to validate
     * @return Validation result
     */
    @PostMapping("/validate")
    @PreAuthorize("hasPermissionRule('role.create.all')")
    fun validateRoleCreation(
        @RequestParam name: String
    ): Any {
        val tenantUuid = tenantContextService.requireTenantContext()
        val tenantId = TenantId(tenantUuid)
        logger.debug("Validating role creation for name '$name' in tenant: $tenantId")
        
        val validationResult = roleManagementService.validateRoleCreation(tenantId, name)
        return validationResult
    }
    
    // === Helper Methods ===
    
    /**
     * Converts a DynamicRole to RoleResponse DTO.
     */
    private fun toRoleResponse(
        role: DynamicRole,
        includePermissions: Boolean,
        includeUserCount: Boolean
    ): RoleResponse {
        val permissions = if (includePermissions) {
            rolePermissionService.getRolePermissionRules(role.id)
        } else {
            null
        }
        
        val userCount = if (includeUserCount) {
            userRoleRepository.countByRoleId(role.id.value).toInt()
        } else {
            null
        }
        
        return RoleResponse(
            id = role.id.value,
            tenantId = role.tenantId?.value,
            name = role.name,
            displayName = role.displayName,
            color = role.color,
            position = role.position,
            isSystem = role.isSystem,
            permissions = permissions?.map { PermissionRule.fromDatabaseString(it) },
            userCount = userCount,
            createdAt = role.createdAt,
            updatedAt = role.updatedAt
        )
    }
}