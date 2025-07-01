package dev.ryuzu.astermanagement.security.rbac.service

import dev.ryuzu.astermanagement.security.rbac.dto.*
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.entity.Role
import dev.ryuzu.astermanagement.security.rbac.repository.RoleRepository
import dev.ryuzu.astermanagement.security.rbac.repository.UserRoleRepository
import dev.ryuzu.astermanagement.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*

/**
 * Service for managing roles and their permissions.
 * Provides CRUD operations for roles and handles role-user assignments.
 */
@Service
@Transactional
class RoleService(
    private val roleRepository: RoleRepository,
    private val userRoleRepository: UserRoleRepository,
    private val userRepository: UserRepository
) {
    
    private val logger = LoggerFactory.getLogger(RoleService::class.java)

    /**
     * Get all roles with pagination and optional filtering.
     */
    @Transactional(readOnly = true)
    fun getAllRoles(
        pageable: Pageable,
        name: String? = null,
        active: Boolean? = null
    ): Page<RoleResponseDto> {
        val roles = when {
            name != null && active != null -> roleRepository.findByNameContainingIgnoreCaseAndIsActive(name, active, pageable)
            name != null -> roleRepository.findByNameContainingIgnoreCase(name, pageable)
            active != null -> roleRepository.findByIsActive(active, pageable)
            else -> roleRepository.findAll(pageable)
        }
        
        return roles.map { role ->
            val userCount = userRoleRepository.countByRoleId(role.id!!).toInt()
            role.toResponseDto(userCount)
        }
    }

    /**
     * Get a role by ID.
     */
    @Transactional(readOnly = true)
    fun getRoleById(roleId: UUID): RoleResponseDto {
        val role = roleRepository.findById(roleId)
            .orElseThrow { NoSuchElementException("Role not found with id: $roleId") }
        
        val userCount = userRoleRepository.countByRoleId(roleId).toInt()
        return role.toResponseDto(userCount)
    }

    /**
     * Create a new role.
     */
    fun createRole(createRequest: CreateRoleRequestDto): RoleResponseDto {
        // Check if role name already exists
        if (roleRepository.existsByName(createRequest.name)) {
            throw IllegalArgumentException("Role with name '${createRequest.name}' already exists")
        }

        // Validate permissions
        val permissions = validatePermissions(createRequest.permissions)
        
        // Create new role
        val role = Role().apply {
            name = createRequest.name
            displayName = createRequest.displayName
            setPermissions(permissions)
            hierarchyLevel = createRequest.hierarchyLevel
            color = createRequest.color
            description = createRequest.description
            isActive = createRequest.isActive
            isSystemRole = false
        }

        val savedRole = roleRepository.save(role)
        logger.info("Created new role: {} with permissions: {}", savedRole.name, permissions.map { it.name })
        
        return savedRole.toResponseDto(0)
    }

    /**
     * Update an existing role.
     */
    fun updateRole(roleId: UUID, updateRequest: UpdateRoleRequestDto): RoleResponseDto {
        val role = roleRepository.findById(roleId)
            .orElseThrow { NoSuchElementException("Role not found with id: $roleId") }

        // Check if it's a system role
        if (role.isSystemRole) {
            throw IllegalArgumentException("Cannot modify system role: ${role.name}")
        }

        // Update role properties
        role.apply {
            displayName = updateRequest.displayName
            hierarchyLevel = updateRequest.hierarchyLevel
            color = updateRequest.color
            description = updateRequest.description
            isActive = updateRequest.isActive
        }

        val savedRole = roleRepository.save(role)
        logger.info("Updated role: {}", savedRole.name)
        
        val userCount = userRoleRepository.countByRoleId(roleId).toInt()
        return savedRole.toResponseDto(userCount)
    }

    /**
     * Delete a role.
     */
    fun deleteRole(roleId: UUID) {
        val role = roleRepository.findById(roleId)
            .orElseThrow { NoSuchElementException("Role not found with id: $roleId") }

        // Check if it's a system role
        if (role.isSystemRole) {
            throw IllegalArgumentException("Cannot delete system role: ${role.name}")
        }

        // Check if role has assigned users
        val userCount = userRoleRepository.countByRoleId(roleId)
        if (userCount > 0) {
            throw IllegalArgumentException("Cannot delete role '${role.name}' because it is assigned to $userCount users")
        }

        roleRepository.delete(role)
        logger.info("Deleted role: {}", role.name)
    }

    /**
     * Update permissions for a role.
     */
    fun updateRolePermissions(roleId: UUID, permissionRequest: UpdateRolePermissionsRequestDto): RoleResponseDto {
        val role = roleRepository.findById(roleId)
            .orElseThrow { NoSuchElementException("Role not found with id: $roleId") }

        // Check if it's a system role
        if (role.isSystemRole) {
            throw IllegalArgumentException("Cannot modify permissions for system role: ${role.name}")
        }

        // Validate and set permissions
        val permissions = validatePermissions(permissionRequest.permissions)
        role.setPermissions(permissions)

        val savedRole = roleRepository.save(role)
        logger.info("Updated permissions for role: {} with permissions: {}", savedRole.name, permissions.map { it.name })
        
        val userCount = userRoleRepository.countByRoleId(roleId).toInt()
        return savedRole.toResponseDto(userCount)
    }

    /**
     * Grant a specific permission to a role.
     */
    fun grantPermission(roleId: UUID, permission: Permission): RoleResponseDto {
        val role = roleRepository.findById(roleId)
            .orElseThrow { NoSuchElementException("Role not found with id: $roleId") }

        if (role.isSystemRole) {
            throw IllegalArgumentException("Cannot modify permissions for system role: ${role.name}")
        }

        role.grantPermission(permission)
        val savedRole = roleRepository.save(role)
        logger.info("Granted permission {} to role: {}", permission.name, savedRole.name)
        
        val userCount = userRoleRepository.countByRoleId(roleId).toInt()
        return savedRole.toResponseDto(userCount)
    }

    /**
     * Revoke a specific permission from a role.
     */
    fun revokePermission(roleId: UUID, permission: Permission): RoleResponseDto {
        val role = roleRepository.findById(roleId)
            .orElseThrow { NoSuchElementException("Role not found with id: $roleId") }

        if (role.isSystemRole) {
            throw IllegalArgumentException("Cannot modify permissions for system role: ${role.name}")
        }

        role.revokePermission(permission)
        val savedRole = roleRepository.save(role)
        logger.info("Revoked permission {} from role: {}", permission.name, savedRole.name)
        
        val userCount = userRoleRepository.countByRoleId(roleId).toInt()
        return savedRole.toResponseDto(userCount)
    }

    /**
     * Get users assigned to a specific role.
     */
    @Transactional(readOnly = true)
    fun getRoleUsers(roleId: UUID, pageable: Pageable): Page<UserRoleResponseDto> {
        // Verify role exists
        if (!roleRepository.existsById(roleId)) {
            throw NoSuchElementException("Role not found with id: $roleId")
        }

        val userRoles = userRoleRepository.findByRoleIdWithUser(roleId, pageable)
        
        return userRoles.map { userRole ->
            UserRoleResponseDto(
                userId = userRole.user.id!!,
                email = userRole.user.email,
                fullName = userRole.user.fullName,
                assignedAt = userRole.grantedAt,
                assignedBy = null, // TODO: Add assigned_by field to UserRole entity
                isActive = userRole.user.isActive
            )
        }
    }

    /**
     * Assign a role to a user.
     */
    fun assignRoleToUser(roleId: UUID, userId: UUID) {
        val role = roleRepository.findById(roleId)
            .orElseThrow { NoSuchElementException("Role not found with id: $roleId") }
        
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found with id: $userId") }

        // Check if assignment already exists
        if (userRoleRepository.existsByUserIdAndRoleId(userId, roleId)) {
            throw IllegalArgumentException("User ${user.email} already has role ${role.name}")
        }

        // Create user-role assignment
        val userRole = dev.ryuzu.astermanagement.security.rbac.entity.UserRole()
        userRole.user = user
        userRole.role = role

        userRoleRepository.save(userRole)
        logger.info("Assigned role {} to user: {}", role.name, user.email)
    }

    /**
     * Remove a role from a user.
     */
    fun removeRoleFromUser(roleId: UUID, userId: UUID) {
        val userRole = userRoleRepository.findByUserIdAndRoleId(userId, roleId)
            ?: throw NoSuchElementException("User-role assignment not found")

        userRoleRepository.delete(userRole)
        logger.info("Removed role {} from user: {}", userRole.role.name, userRole.user.email)
    }

    /**
     * Get role hierarchy information.
     */
    @Transactional(readOnly = true)
    fun getRoleHierarchy(): List<RoleHierarchyDto> {
        val allRoles = roleRepository.findAllByIsActiveOrderByHierarchyLevelDesc(true)
        
        return allRoles.map { role ->
            val userCount = userRoleRepository.countByRoleId(role.id!!).toInt()
            val parentRoles = allRoles.filter { it.hierarchyLevel > role.hierarchyLevel }
                .map { it.toHierarchyNode() }
            val childRoles = allRoles.filter { it.hierarchyLevel < role.hierarchyLevel }
                .map { it.toHierarchyNode() }
            
            RoleHierarchyDto(
                id = role.id!!,
                name = role.name,
                displayName = role.displayName,
                hierarchyLevel = role.hierarchyLevel,
                color = role.color,
                userCount = userCount,
                parentRoles = parentRoles,
                childRoles = childRoles
            )
        }
    }

    /**
     * Clone an existing role.
     */
    fun cloneRole(sourceRoleId: UUID, cloneRequest: CloneRoleRequestDto): RoleResponseDto {
        val sourceRole = roleRepository.findById(sourceRoleId)
            .orElseThrow { NoSuchElementException("Source role not found with id: $sourceRoleId") }

        // Check if new role name already exists
        if (roleRepository.existsByName(cloneRequest.name)) {
            throw IllegalArgumentException("Role with name '${cloneRequest.name}' already exists")
        }

        // Start with source role permissions
        var permissions = sourceRole.getPermissionsList().toMutableList()

        // Modify permissions if requested
        if (cloneRequest.modifyPermissions) {
            // Add additional permissions
            val additionalPermissions = validatePermissions(cloneRequest.additionalPermissions)
            permissions.addAll(additionalPermissions)

            // Remove specified permissions
            val removedPermissions = validatePermissions(cloneRequest.removedPermissions)
            permissions.removeAll(removedPermissions.toSet())
        }

        // Create cloned role
        val clonedRole = Role().apply {
            name = cloneRequest.name
            displayName = cloneRequest.displayName
            setPermissions(permissions.distinct())
            hierarchyLevel = sourceRole.hierarchyLevel
            color = cloneRequest.color
            description = cloneRequest.description
            isActive = true
            isSystemRole = false
        }

        val savedRole = roleRepository.save(clonedRole)
        logger.info("Cloned role {} from {} with permissions: {}", 
                   savedRole.name, sourceRole.name, permissions.map { it.name })
        
        return savedRole.toResponseDto(0)
    }

    /**
     * Validate permission strings and convert to Permission enums.
     */
    private fun validatePermissions(permissionNames: List<String>): List<Permission> {
        return permissionNames.map { permissionName ->
            try {
                Permission.valueOf(permissionName)
            } catch (e: IllegalArgumentException) {
                throw IllegalArgumentException("Invalid permission: $permissionName")
            }
        }
    }

    /**
     * Extension function to convert Role to hierarchy node.
     */
    private fun Role.toHierarchyNode(): RoleHierarchyNodeDto {
        return RoleHierarchyNodeDto(
            id = this.id!!,
            name = this.name,
            displayName = this.displayName,
            hierarchyLevel = this.hierarchyLevel
        )
    }
}