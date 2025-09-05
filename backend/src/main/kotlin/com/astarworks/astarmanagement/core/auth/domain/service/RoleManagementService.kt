package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.exception.RoleManagementException
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.shared.domain.value.*
import java.util.UUID
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Service for managing Discord-style dynamic roles.
 * 
 * This service handles all role management operations including:
 * - CRUD operations for dynamic roles
 * - Tenant-specific role management
 * - Role position (hierarchy) management
 * - System role operations
 * 
 * All roles are tenant-specific except for system-wide roles.
 * Follows Discord's model where roles have colors, positions, and display names.
 */
@Service
@Transactional
class RoleManagementService(
    private val dynamicRoleRepository: DynamicRoleRepository,
    private val userRoleRepository: UserRoleRepository,
    private val rolePermissionRepository: RolePermissionRepository,
    private val rolePermissionService: RolePermissionService
) {
    private val logger = LoggerFactory.getLogger(RoleManagementService::class.java)
    
    /**
     * Creates a new role for a tenant.
     * 
     * @param tenantId The tenant ID
     * @param name Internal name (lowercase, alphanumeric with underscores)
     * @param displayName Optional display name for UI
     * @param color Optional hex color code (#RRGGBB format)
     * @param position Display order (higher value = higher priority)
     * @return The created role
     * @throws IllegalArgumentException if role name already exists for the tenant
     */
    fun createRole(
        tenantId: TenantId,
        name: String,
        displayName: String? = null,
        color: String? = null,
        position: Int = 0
    ): DynamicRole {
        logger.info("Creating role '$name' for tenant: $tenantId")
        
        // Validate role name format
        if (name.isBlank() || !name.matches(Regex("^[a-z0-9_]+$")) || name.matches(Regex("^\\d+$"))) {
            throw RoleManagementException.InvalidRoleNameException(
                name = name,
                reason = "Role name must contain lowercase letters, numbers, and underscores, and cannot be only numbers"
            )
        }
        
        // Validate color format if provided
        if (color != null && !color.matches(Regex("^#[0-9A-Fa-f]{6}$"))) {
            throw RoleManagementException.InvalidRoleColorException(color)
        }
        
        // Check if role name already exists for this tenant
        if (dynamicRoleRepository.existsByTenantIdAndName(tenantId, name)) {
            throw RoleManagementException.DuplicateRoleException(name, tenantId.value)
        }
        
        // Check role limit
        val currentRoleCount = dynamicRoleRepository.countByTenantId(tenantId)
        val maxRoles = 50L // Maximum roles per tenant
        if (currentRoleCount >= maxRoles) {
            throw RoleManagementException.RoleLimitExceededException(
                tenantId = tenantId.value,
                currentCount = currentRoleCount.toInt(),
                limit = maxRoles.toInt()
            )
        }
        
        try {
            val role = DynamicRole.forTenant(
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position
            )
            
            val savedRole = dynamicRoleRepository.save(role)
            logger.info("Created role with ID: ${savedRole.id}")
            
            return savedRole
        } catch (e: IllegalArgumentException) {
            // Handle validation errors from DynamicRole constructor
            when {
                e.message?.contains("Role name", ignoreCase = true) == true -> {
                    throw RoleManagementException.InvalidRoleNameException(name, e.message ?: "Invalid role name")
                }
                e.message?.contains("Color", ignoreCase = true) == true -> {
                    throw RoleManagementException.InvalidRoleColorException(color ?: "")
                }
                else -> throw e
            }
        }
    }
    
    /**
     * Creates a system-wide role (not tenant-specific).
     * 
     * @param name Internal name (lowercase, alphanumeric with underscores)
     * @param displayName Optional display name for UI
     * @param color Optional hex color code
     * @param position Display order
     * @return The created system role
     * @throws IllegalArgumentException if system role name already exists
     */
    fun createSystemRole(
        name: String,
        displayName: String? = null,
        color: String? = null,
        position: Int = 0
    ): DynamicRole {
        logger.info("Creating system role: $name")
        
        // Validate role name format
        if (name.isBlank() || !name.matches(Regex("^[a-z0-9_]+$")) || name.matches(Regex("^\\d+$"))) {
            throw RoleManagementException.InvalidRoleNameException(
                name = name,
                reason = "Role name must contain lowercase letters, numbers, and underscores, and cannot be only numbers"
            )
        }
        
        // Validate color format if provided
        if (color != null && !color.matches(Regex("^#[0-9A-Fa-f]{6}$"))) {
            throw RoleManagementException.InvalidRoleColorException(color)
        }
        
        // Check if system role name already exists
        if (dynamicRoleRepository.existsByTenantIdAndName(null, name)) {
            throw RoleManagementException.DuplicateRoleException(name)
        }
        
        try {
            val role = DynamicRole.systemRole(
                name = name,
                displayName = displayName,
                color = color,
                position = position
            )
            
            val savedRole = dynamicRoleRepository.save(role)
            logger.info("Created system role with ID: ${savedRole.id}")
            
            return savedRole
        } catch (e: IllegalArgumentException) {
            // Handle validation errors from DynamicRole constructor
            when {
                e.message?.contains("Role name", ignoreCase = true) == true -> {
                    throw RoleManagementException.InvalidRoleNameException(name, e.message ?: "Invalid role name")
                }
                e.message?.contains("Color", ignoreCase = true) == true -> {
                    throw RoleManagementException.InvalidRoleColorException(color ?: "")
                }
                else -> throw e
            }
        }
    }
    
    /**
     * Finds a role by its ID.
     * 
     * @param id Role ID
     * @return The role if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun findById(id: RoleId): DynamicRole? {
        return dynamicRoleRepository.findById(id)
    }
    
    /**
     * Finds all roles for a specific tenant.
     * 
     * @param tenantId The tenant ID
     * @return List of roles for the tenant, ordered by position (highest first)
     */
    @Transactional(readOnly = true)
    fun findByTenantId(tenantId: TenantId): List<DynamicRole> {
        return dynamicRoleRepository.findByTenantIdOrderByPositionDesc(tenantId)
    }
    
    /**
     * Finds a role by tenant and name.
     * 
     * @param tenantId The tenant ID
     * @param name Role name
     * @return The role if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun findByTenantIdAndName(tenantId: TenantId, name: String): DynamicRole? {
        return dynamicRoleRepository.findByTenantIdAndName(tenantId, name)
    }
    
    /**
     * Gets all system-wide roles.
     * 
     * @return List of system roles, ordered by position
     */
    @Transactional(readOnly = true)
    fun getSystemRoles(): List<DynamicRole> {
        return dynamicRoleRepository.findSystemRolesOrderByPositionDesc()
    }
    
    /**
     * Updates a role's display properties.
     * 
     * @param id Role ID
     * @param displayName New display name (null to keep current)
     * @param color New color (null to keep current)
     * @param position New position (null to keep current)
     * @return The updated role
     * @throws IllegalArgumentException if role not found
     */
    fun updateRole(
        id: RoleId,
        displayName: String? = null,
        color: String? = null,
        position: Int? = null
    ): DynamicRole {
        logger.info("Updating role: $id")
        
        var role = dynamicRoleRepository.findById(id)
            ?: throw RoleManagementException.RoleNotFoundException(id.value)
        
        // Check if role is a system role
        if (role.isSystem) {
            throw RoleManagementException.SystemRoleException("System roles cannot be modified")
        }
        
        // Apply updates if provided
        displayName?.let {
            role = role.updateDisplayName(it)
        }
        
        color?.let {
            role = role.updateColor(it)
        }
        
        position?.let {
            role = role.updatePosition(it)
        }
        
        val updatedRole = dynamicRoleRepository.save(role)
        logger.info("Updated role: $id")
        
        return updatedRole
    }
    
    /**
     * Updates a role's display name.
     * 
     * @param id Role ID
     * @param displayName New display name
     * @return The updated role
     * @throws IllegalArgumentException if role not found
     */
    fun updateRoleDisplayName(id: RoleId, displayName: String?): DynamicRole {
        logger.info("Updating role $id display name to: $displayName")
        
        val role = dynamicRoleRepository.findById(id)
            ?: throw RoleManagementException.RoleNotFoundException(id.value)
        
        val updatedRole = role.updateDisplayName(displayName)
        return dynamicRoleRepository.save(updatedRole)
    }
    
    /**
     * Updates a role's color.
     * 
     * @param id Role ID
     * @param color New hex color code
     * @return The updated role
     * @throws IllegalArgumentException if role not found or invalid color format
     */
    fun updateRoleColor(id: RoleId, color: String?): DynamicRole {
        logger.info("Updating role $id color to: $color")
        
        val role = dynamicRoleRepository.findById(id)
            ?: throw RoleManagementException.RoleNotFoundException(id.value)
        
        val updatedRole = role.updateColor(color)
        return dynamicRoleRepository.save(updatedRole)
    }
    
    /**
     * Updates a role's position in the hierarchy.
     * 
     * @param id Role ID
     * @param position New position value
     * @return The updated role
     * @throws IllegalArgumentException if role not found
     */
    fun updateRolePosition(id: RoleId, position: Int): DynamicRole {
        logger.info("Updating role $id position to: $position")
        
        val role = dynamicRoleRepository.findById(id)
            ?: throw RoleManagementException.RoleNotFoundException(id.value)
        
        val updatedRole = role.updatePosition(position)
        return dynamicRoleRepository.save(updatedRole)
    }
    
    /**
     * Reorders multiple roles for a tenant.
     * Updates positions for multiple roles in a single transaction.
     * 
     * @param tenantId The tenant ID
     * @param rolePositions Map of role ID to new position
     * @throws IllegalArgumentException if any role not found or not belonging to tenant
     */
    fun reorderRoles(tenantId: TenantId, rolePositions: Map<UUID, Int>) {
        logger.info("Reordering ${rolePositions.size} roles for tenant: $tenantId")
        
        rolePositions.forEach { (roleId, newPosition) ->
            val role = dynamicRoleRepository.findById(RoleId(roleId))
                ?: throw RoleManagementException.RoleNotFoundException(roleId)
            
            // Verify role belongs to the specified tenant
            if (role.tenantId?.value != tenantId.value) {
                throw RoleManagementException.RoleTenantMismatchException(roleId, tenantId.value, role.tenantId?.value)
            }
            
            val updatedRole = role.updatePosition(newPosition)
            dynamicRoleRepository.save(updatedRole)
        }
        
        logger.info("Reordered ${rolePositions.size} roles successfully")
    }
    
    /**
     * Deletes a role.
     * 
     * @param id Role ID
     * @throws IllegalArgumentException if role not found or is a system role
     * @throws IllegalStateException if users are still assigned to this role
     */
    fun deleteRole(id: RoleId) {
        logger.info("Deleting role: $id")
        
        val role = dynamicRoleRepository.findById(id)
            ?: throw RoleManagementException.RoleNotFoundException(id.value)
        
        // Check if role can be deleted
        if (!role.isDeletable()) {
            throw RoleManagementException.SystemRoleException("System roles cannot be deleted")
        }
        
        // Check if any users are assigned to this role
        if (userRoleRepository.existsByRoleId(id.value)) {
            val userCount = userRoleRepository.countByRoleId(id.value)
            throw RoleManagementException.RoleInUseException(id.value, userCount.toInt())
        }
        
        dynamicRoleRepository.deleteById(id)
        logger.info("Deleted role: $id")
    }
    
    /**
     * Deletes all roles for a specific tenant.
     * Used when removing a tenant from the system.
     * 
     * @param tenantId The tenant ID
     */
    fun deleteRolesByTenantId(tenantId: TenantId) {
        logger.info("Deleting all roles for tenant: $tenantId")
        
        // Note: User role assignments should be handled by cascade delete
        dynamicRoleRepository.deleteByTenantId(tenantId)
        
        logger.info("Deleted all roles for tenant: $tenantId")
    }
    
    /**
     * Counts total number of roles in the system.
     * 
     * @return Total role count
     */
    @Transactional(readOnly = true)
    fun countRoles(): Long {
        return dynamicRoleRepository.count()
    }
    
    /**
     * Counts roles for a specific tenant.
     * 
     * @param tenantId The tenant ID
     * @return Role count for the tenant
     */
    @Transactional(readOnly = true)
    fun countRolesByTenantId(tenantId: TenantId): Long {
        return dynamicRoleRepository.countByTenantId(tenantId)
    }
    
    /**
     * Counts system-wide roles.
     * 
     * @return System role count
     */
    @Transactional(readOnly = true)
    fun countSystemRoles(): Long {
        return dynamicRoleRepository.countSystemRoles()
    }
    
    /**
     * Checks if a role name exists for a tenant.
     * 
     * @param tenantId The tenant ID
     * @param name Role name to check
     * @return true if exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun roleExists(tenantId: TenantId, name: String): Boolean {
        return dynamicRoleRepository.existsByTenantIdAndName(tenantId, name)
    }
    
    
    /**
     * Creates multiple roles in a single transaction.
     * 
     * @param tenantId The tenant ID
     * @param roleRequests List of role creation requests
     * @return List of created roles
     * @throws RoleManagementException if any role creation fails
     */
    fun createRoles(tenantId: TenantId, roleRequests: List<RoleCreateRequest>): List<DynamicRole> {
        logger.info("Creating ${roleRequests.size} roles for tenant: $tenantId")
        
        val createdRoles = mutableListOf<DynamicRole>()
        
        roleRequests.forEach { request ->
            // Check for duplicate names
            if (dynamicRoleRepository.existsByTenantIdAndName(tenantId, request.name)) {
                throw RoleManagementException.DuplicateRoleException(request.name, tenantId.value)
            }
            
            // Create the role
            val role = DynamicRole.forTenant(
                tenantId = tenantId,
                name = request.name,
                displayName = request.displayName,
                color = request.color,
                position = request.position
            )
            
            val savedRole = dynamicRoleRepository.save(role)
            createdRoles.add(savedRole)
            
            // Grant permissions if specified
            if (request.permissions.isNotEmpty()) {
                rolePermissionService.grantPermissions(savedRole.id, request.permissions)
            }
        }
        
        logger.info("Created ${createdRoles.size} roles successfully")
        return createdRoles
    }
    
    /**
     * Duplicates an existing role with a new name.
     * 
     * @param sourceRoleId The ID of the role to duplicate
     * @param tenantId The tenant ID for the new role
     * @param newName The name for the duplicated role
     * @param includePermissions Whether to copy permissions
     * @return The duplicated role
     */
    fun duplicateRole(
        sourceRoleId: UUID,
        tenantId: TenantId,
        newName: String,
        includePermissions: Boolean = true
    ): DynamicRole {
        logger.info("Duplicating role $sourceRoleId as '$newName' for tenant: $tenantId")
        
        val sourceRole = dynamicRoleRepository.findById(RoleId(sourceRoleId))
            ?: throw RoleManagementException.RoleNotFoundException(sourceRoleId)
        
        // Check if new name already exists
        if (dynamicRoleRepository.existsByTenantIdAndName(tenantId, newName)) {
            throw RoleManagementException.DuplicateRoleException(newName, tenantId.value)
        }
        
        // Create new role based on source
        val newRole = DynamicRole.forTenant(
            tenantId = tenantId,
            name = newName,
            displayName = sourceRole.displayName?.let { "$it (Copy)" },
            color = sourceRole.color,
            position = sourceRole.position
        )
        
        val savedRole = dynamicRoleRepository.save(newRole)
        
        // Copy permissions if requested
        if (includePermissions) {
            val sourcePermissions = rolePermissionService.getRolePermissionRules(RoleId(sourceRoleId))
            if (sourcePermissions.isNotEmpty()) {
                rolePermissionService.grantPermissions(savedRole.id, sourcePermissions)
            }
        }
        
        logger.info("Successfully duplicated role as: ${savedRole.id}")
        return savedRole
    }
    
    /**
     * Exports a role configuration including permissions.
     * 
     * @param roleId The role ID to export
     * @return Export data containing role configuration and permissions
     */
    @Transactional(readOnly = true)
    fun exportRole(roleId: RoleId): RoleExportData {
        logger.info("Exporting role: $roleId")
        
        val role = dynamicRoleRepository.findById(roleId)
            ?: throw RoleManagementException.RoleNotFoundException(roleId.value)
        
        val permissions = rolePermissionService.getRolePermissionRules(roleId)
        
        return RoleExportData.fromRole(role, permissions)
    }
    
    /**
     * Imports a role from export data.
     * 
     * @param tenantId The tenant ID
     * @param roleData The role export data
     * @return The imported role
     */
    fun importRole(tenantId: TenantId, roleData: RoleExportData): DynamicRole {
        logger.info("Importing role '${roleData.name}' for tenant: $tenantId")
        
        // Validate export data
        val validationErrors = roleData.validate()
        if (validationErrors.isNotEmpty()) {
            throw RoleManagementException.RoleImportExportException(
                "import",
                "Validation failed: ${validationErrors.joinToString(", ")}"
            )
        }
        
        // Check if role name already exists
        if (dynamicRoleRepository.existsByTenantIdAndName(tenantId, roleData.name)) {
            throw RoleManagementException.DuplicateRoleException(roleData.name, tenantId.value)
        }
        
        // Create the role
        val role = DynamicRole.forTenant(
            tenantId = tenantId,
            name = roleData.name,
            displayName = roleData.displayName,
            color = roleData.color,
            position = roleData.position
        )
        
        val savedRole = dynamicRoleRepository.save(role)
        
        // Grant permissions
        if (roleData.permissions.isNotEmpty()) {
            rolePermissionService.grantPermissions(savedRole.id, roleData.permissions)
        }
        
        logger.info("Successfully imported role: ${savedRole.id}")
        return savedRole
    }
    
    /**
     * Searches for roles by name or display name.
     * 
     * @param tenantId The tenant ID
     * @param query The search query
     * @return List of matching roles
     */
    @Transactional(readOnly = true)
    fun searchRoles(tenantId: TenantId, query: String): List<DynamicRole> {
        logger.debug("Searching roles for tenant $tenantId with query: $query")
        
        if (query.isBlank()) {
            return emptyList()
        }
        
        val lowerQuery = query.lowercase()
        return dynamicRoleRepository.findByTenantIdOrderByPositionDesc(tenantId)
            .filter { role ->
                role.name.lowercase().contains(lowerQuery) ||
                role.displayName?.lowercase()?.contains(lowerQuery) == true
            }
    }
    
    /**
     * Gets all roles that have a specific permission.
     * 
     * @param tenantId The tenant ID
     * @param permissionRule The permission rule
     * @return List of roles with the permission
     */
    @Transactional(readOnly = true)
    fun getRolesByPermission(tenantId: TenantId, permissionRuleString: String): List<DynamicRole> {
        logger.debug("Finding roles with permission '$permissionRuleString' for tenant: $tenantId")
        
        // Parse the permission rule string
        val permissionRule = try {
            PermissionRule.fromDatabaseString(permissionRuleString)
        } catch (e: Exception) {
            logger.warn("Invalid permission rule format: $permissionRuleString")
            return emptyList()
        }
        
        // Find all roles with this permission
        val allRolePermissions = rolePermissionRepository.findAll()
        val roleIds = allRolePermissions
            .filter { it.permissionRule == permissionRule }
            .map { it.roleId }
            .toSet()
        
        return dynamicRoleRepository.findByTenantIdOrderByPositionDesc(tenantId)
            .filter { it.id in roleIds }
    }
    
    /**
     * Validates if a role can be created with the given parameters.
     * 
     * @param tenantId The tenant ID
     * @param name The role name
     * @return Validation result with any errors
     */
    @Transactional(readOnly = true)
    fun validateRoleCreation(tenantId: TenantId, name: String): ValidationResult {
        val errors = mutableMapOf<String, String>()
        val warnings = mutableMapOf<String, String>()
        
        // Check name format
        if (!name.matches(Regex("^[a-z0-9_]+$"))) {
            errors["name"] = "Role name can only contain lowercase letters, numbers, and underscores"
        }
        
        // Check name length
        if (name.length > 100) {
            errors["name_length"] = "Role name cannot exceed 100 characters"
        }
        
        // Check if name exists
        if (dynamicRoleRepository.existsByTenantIdAndName(tenantId, name)) {
            errors["duplicate"] = "Role with name '$name' already exists"
        }
        
        // Check role count limit (example: 50 roles per tenant)
        val currentCount = dynamicRoleRepository.countByTenantId(tenantId)
        if (currentCount >= 45) {  // Warn when approaching limit (90% of 50)
            warnings["limit"] = "Approaching role limit (${currentCount}/50)"
        }
        
        return ValidationResult(
            valid = if (errors.isEmpty()) listOf(name) else emptyList(),
            invalid = errors,
            warnings = warnings
        )
    }
    
    /**
     * Clears all caches related to roles and permissions.
     * Should be called after bulk operations or imports.
     */
    @CacheEvict(value = ["roles", "rolePermissions", "userPermissions", "userRoles"], allEntries = true)
    fun clearAllCaches() {
        logger.info("Clearing all role-related caches")
    }
    
    /**
     * Clears caches for a specific tenant.
     * 
     * @param tenantId The tenant ID
     */
    @CacheEvict(value = ["roles"], key = "#tenantId + ':*'")
    fun evictTenantCache(tenantId: TenantId) {
        logger.info("Clearing role cache for tenant: $tenantId")
    }
}