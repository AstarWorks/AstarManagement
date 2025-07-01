package dev.ryuzu.astermanagement.security.rbac.controller

import dev.ryuzu.astermanagement.security.rbac.dto.*
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.entity.Role
import dev.ryuzu.astermanagement.security.rbac.service.RoleService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

/**
 * REST controller for role management operations.
 * Provides endpoints for CRUD operations on roles and permission management.
 * 
 * All endpoints require appropriate permissions and are secured with method-level security.
 * Only users with ROLE_MANAGEMENT permission can access these endpoints.
 */
@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasPermission(null, 'ROLE_MANAGEMENT')")
class RoleController(
    private val roleService: RoleService
) {

    /**
     * Get all roles with pagination and optional filtering.
     * 
     * @param pageable Pagination parameters
     * @param name Optional role name filter
     * @param active Optional active status filter
     * @return Paginated list of roles
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'ROLE_READ')")
    fun getAllRoles(
        pageable: Pageable,
        @RequestParam(required = false) name: String?,
        @RequestParam(required = false) active: Boolean?
    ): ResponseEntity<Page<RoleResponseDto>> {
        val roles = roleService.getAllRoles(pageable, name, active)
        return ResponseEntity.ok(roles)
    }

    /**
     * Get a specific role by ID.
     * 
     * @param roleId The role ID
     * @return Role details
     */
    @GetMapping("/{roleId}")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_READ')")
    fun getRoleById(@PathVariable roleId: UUID): ResponseEntity<RoleResponseDto> {
        val role = roleService.getRoleById(roleId)
        return ResponseEntity.ok(role)
    }

    /**
     * Create a new role.
     * 
     * @param createRequest Role creation request
     * @return Created role details
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'ROLE_CREATE')")
    fun createRole(@Valid @RequestBody createRequest: CreateRoleRequestDto): ResponseEntity<RoleResponseDto> {
        val createdRole = roleService.createRole(createRequest)
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRole)
    }

    /**
     * Update an existing role.
     * 
     * @param roleId The role ID
     * @param updateRequest Role update request
     * @return Updated role details
     */
    @PutMapping("/{roleId}")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_UPDATE')")
    fun updateRole(
        @PathVariable roleId: UUID,
        @Valid @RequestBody updateRequest: UpdateRoleRequestDto
    ): ResponseEntity<RoleResponseDto> {
        val updatedRole = roleService.updateRole(roleId, updateRequest)
        return ResponseEntity.ok(updatedRole)
    }

    /**
     * Delete a role.
     * Only non-system roles can be deleted.
     * 
     * @param roleId The role ID
     * @return No content response
     */
    @DeleteMapping("/{roleId}")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_DELETE')")
    fun deleteRole(@PathVariable roleId: UUID): ResponseEntity<Void> {
        roleService.deleteRole(roleId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Get all available permissions.
     * Used for role permission assignment UI.
     * 
     * @return List of all permissions with descriptions
     */
    @GetMapping("/permissions")
    @PreAuthorize("hasPermission(null, 'ROLE_READ')")
    fun getAllPermissions(): ResponseEntity<List<PermissionDto>> {
        val permissions = Permission.entries.map { permission ->
            PermissionDto(
                name = permission.name,
                description = permission.description,
                category = permission.category,
                bit = permission.bit
            )
        }
        return ResponseEntity.ok(permissions)
    }

    /**
     * Update permissions for a specific role.
     * 
     * @param roleId The role ID
     * @param permissionRequest Permission update request
     * @return Updated role details
     */
    @PutMapping("/{roleId}/permissions")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_UPDATE')")
    fun updateRolePermissions(
        @PathVariable roleId: UUID,
        @Valid @RequestBody permissionRequest: UpdateRolePermissionsRequestDto
    ): ResponseEntity<RoleResponseDto> {
        val updatedRole = roleService.updateRolePermissions(roleId, permissionRequest)
        return ResponseEntity.ok(updatedRole)
    }

    /**
     * Grant a specific permission to a role.
     * 
     * @param roleId The role ID
     * @param permission The permission to grant
     * @return Updated role details
     */
    @PostMapping("/{roleId}/permissions/{permission}")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_UPDATE')")
    fun grantPermission(
        @PathVariable roleId: UUID,
        @PathVariable permission: String
    ): ResponseEntity<RoleResponseDto> {
        val updatedRole = roleService.grantPermission(roleId, Permission.valueOf(permission))
        return ResponseEntity.ok(updatedRole)
    }

    /**
     * Revoke a specific permission from a role.
     * 
     * @param roleId The role ID
     * @param permission The permission to revoke
     * @return Updated role details
     */
    @DeleteMapping("/{roleId}/permissions/{permission}")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_UPDATE')")
    fun revokePermission(
        @PathVariable roleId: UUID,
        @PathVariable permission: String
    ): ResponseEntity<RoleResponseDto> {
        val updatedRole = roleService.revokePermission(roleId, Permission.valueOf(permission))
        return ResponseEntity.ok(updatedRole)
    }

    /**
     * Get users assigned to a specific role.
     * 
     * @param roleId The role ID
     * @param pageable Pagination parameters
     * @return Paginated list of users with this role
     */
    @GetMapping("/{roleId}/users")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_READ')")
    fun getRoleUsers(
        @PathVariable roleId: UUID,
        pageable: Pageable
    ): ResponseEntity<Page<UserRoleResponseDto>> {
        val users = roleService.getRoleUsers(roleId, pageable)
        return ResponseEntity.ok(users)
    }

    /**
     * Assign a role to a user.
     * 
     * @param roleId The role ID
     * @param userId The user ID
     * @return No content response
     */
    @PostMapping("/{roleId}/users/{userId}")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_UPDATE')")
    fun assignRoleToUser(
        @PathVariable roleId: UUID,
        @PathVariable userId: UUID
    ): ResponseEntity<Void> {
        roleService.assignRoleToUser(roleId, userId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Remove a role from a user.
     * 
     * @param roleId The role ID
     * @param userId The user ID
     * @return No content response
     */
    @DeleteMapping("/{roleId}/users/{userId}")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_UPDATE')")
    fun removeRoleFromUser(
        @PathVariable roleId: UUID,
        @PathVariable userId: UUID
    ): ResponseEntity<Void> {
        roleService.removeRoleFromUser(roleId, userId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Get role hierarchy information.
     * Shows the hierarchy levels and relationships between roles.
     * 
     * @return Role hierarchy data
     */
    @GetMapping("/hierarchy")
    @PreAuthorize("hasPermission(null, 'ROLE_READ')")
    fun getRoleHierarchy(): ResponseEntity<List<RoleHierarchyDto>> {
        val hierarchy = roleService.getRoleHierarchy()
        return ResponseEntity.ok(hierarchy)
    }

    /**
     * Clone an existing role with a new name.
     * Useful for creating similar roles based on existing ones.
     * 
     * @param roleId The source role ID
     * @param cloneRequest Clone request with new role details
     * @return Created role details
     */
    @PostMapping("/{roleId}/clone")
    @PreAuthorize("hasPermission(#roleId, 'Role', 'ROLE_READ') and hasPermission(null, 'ROLE_CREATE')")
    fun cloneRole(
        @PathVariable roleId: UUID,
        @Valid @RequestBody cloneRequest: CloneRoleRequestDto
    ): ResponseEntity<RoleResponseDto> {
        val clonedRole = roleService.cloneRole(roleId, cloneRequest)
        return ResponseEntity.status(HttpStatus.CREATED).body(clonedRole)
    }
}