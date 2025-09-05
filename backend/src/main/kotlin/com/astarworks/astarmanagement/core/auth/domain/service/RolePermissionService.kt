package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.exception.RoleManagementException
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Service for managing role permissions.
 * 
 * This service handles the assignment and management of permissions to roles,
 * using a flexible permission rule system (resource.action.scope format).
 * 
 * Key features:
 * - Permission rule validation and management
 * - Wildcard permission support
 * - Permission hierarchy evaluation
 * - Template-based permission assignment
 * - Comprehensive permission queries
 */
@Service
@Transactional
class RolePermissionService(
    private val rolePermissionRepository: RolePermissionRepository,
    private val dynamicRoleRepository: DynamicRoleRepository
) {
    private val logger = LoggerFactory.getLogger(RolePermissionService::class.java)
    
    /**
     * Grants a permission to a role using a string representation.
     * This method is primarily for Controller compatibility.
     * 
     * @param roleId The role ID
     * @param permissionRuleString The permission rule string
     * @return The created role permission
     * @throws IllegalArgumentException if permission format is invalid or role not found
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun grantPermissionFromString(roleId: RoleId, permissionRuleString: String): RolePermission {
        val permissionRule = try {
            PermissionRule.fromDatabaseString(permissionRuleString)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid permission format: $permissionRuleString", e)
        }
        return grantPermission(roleId, permissionRule)
    }
    
    /**
     * Grants a permission to a role.
     * 
     * @param roleId The role ID
     * @param permissionRule The permission rule object
     * @return The created role permission
     * @throws IllegalArgumentException if role not found or permission already granted
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun grantPermission(roleId: RoleId, permissionRule: PermissionRule): RolePermission {
        logger.info("Granting permission '$permissionRule' to role $roleId")
        
        // Verify role exists
        val role = dynamicRoleRepository.findById(roleId)
            ?: throw RoleManagementException.RoleNotFoundException(roleId.value)
        
        // Check if permission already granted - return existing if already present
        if (rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)) {
            logger.info("Permission '${permissionRule.toDatabaseString()}' already granted to role $roleId, returning existing")
            return rolePermissionRepository.findByRoleIdAndPermissionRule(roleId, permissionRule)
                ?: throw IllegalStateException("Permission exists but not found: ${permissionRule.toDatabaseString()}")
        }
        
        val rolePermission = RolePermission(
            roleId = roleId,
            permissionRule = permissionRule
        )
        
        val savedPermission = rolePermissionRepository.save(rolePermission)
        logger.info("Granted permission '${permissionRule.toDatabaseString()}' to role $roleId")
        
        return savedPermission
    }
    
    
    /**
     * Grants multiple permissions to a role in a single transaction.
     * 
     * @param roleId The role ID
     * @param permissionRules List of permission rules to grant
     * @return List of created role permissions
     * @throws IllegalArgumentException if role not found or any rule is invalid
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun grantPermissions(roleId: RoleId, permissionRules: List<String>): List<RolePermission> {
        logger.info("Granting ${permissionRules.size} permissions to role $roleId")
        
        // Verify role exists
        val role = dynamicRoleRepository.findById(roleId)
            ?: throw RoleManagementException.RoleNotFoundException(roleId.value)
        
        val permissions = mutableListOf<RolePermission>()
        
        permissionRules.forEach { ruleString ->
            try {
                // Parse permission rule from string
                val permissionRule = try {
                    PermissionRule.fromDatabaseString(ruleString)
                } catch (e: Exception) {
                    logger.warn("Invalid permission rule '$ruleString' for role $roleId, skipping")
                    return@forEach
                }
                
                // Skip if already granted
                if (!rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)) {
                    val rolePermission = RolePermission(
                        roleId = roleId,
                        permissionRule = permissionRule
                    )
                    
                    val savedPermission = rolePermissionRepository.save(rolePermission)
                    permissions.add(savedPermission)
                } else {
                    logger.debug("Permission '${permissionRule.toDatabaseString()}' already granted to role $roleId, skipping")
                }
            } catch (e: Exception) {
                logger.warn("Failed to grant permission '$ruleString' to role $roleId: ${e.message}")
            }
        }
        
        logger.info("Granted ${permissions.size} new permissions to role $roleId")
        return permissions
    }
    
    /**
     * Revokes a permission from a role using a string representation.
     * 
     * @param roleId The role ID
     * @param permissionRuleString The permission rule string to revoke
     * @throws IllegalArgumentException if permission not found
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun revokePermission(roleId: RoleId, permissionRuleString: String) {
        logger.info("Revoking permission '$permissionRuleString' from role $roleId")
        
        val permissionRule = try {
            PermissionRule.fromDatabaseString(permissionRuleString)
        } catch (e: Exception) {
            logger.warn("Invalid permission rule format: $permissionRuleString")
            return
        }
        
        // Check if permission exists - just log and return if not present
        if (!rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)) {
            logger.info("Permission '$permissionRuleString' is not granted to role $roleId, nothing to revoke")
            return
        }
        
        rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, permissionRule)
        logger.info("Revoked permission '$permissionRuleString' from role $roleId")
    }
    
    /**
     * Revokes multiple permissions from a role.
     * 
     * @param roleId The role ID
     * @param permissionRules List of permission rules to revoke
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun revokePermissions(roleId: RoleId, permissionRules: List<String>) {
        logger.info("Revoking ${permissionRules.size} permissions from role $roleId")
        
        var revokedCount = 0
        permissionRules.forEach { ruleString ->
            val permissionRule = try {
                PermissionRule.fromDatabaseString(ruleString)
            } catch (e: Exception) {
                logger.warn("Invalid permission rule format: $ruleString, skipping")
                return@forEach
            }
            
            if (rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)) {
                rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, permissionRule)
                revokedCount++
            }
        }
        
        logger.info("Revoked $revokedCount permissions from role $roleId")
    }
    
    /**
     * Revokes all permissions from a role.
     * 
     * @param roleId The role ID
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun revokeAllPermissions(roleId: RoleId) {
        logger.info("Revoking all permissions from role $roleId")
        
        rolePermissionRepository.deleteByRoleId(roleId)
        logger.info("Revoked all permissions from role $roleId")
    }
    
    /**
     * Gets all permissions for a role.
     * 
     * @param roleId The role ID
     * @return List of role permissions
     */
    @Transactional(readOnly = true)
    @Cacheable(value = ["rolePermissions"], key = "#roleId")
    fun getRolePermissions(roleId: RoleId): List<RolePermission> {
        return rolePermissionRepository.findByRoleId(roleId)
    }
    
    /**
     * Gets all permission rules as strings for a role.
     * 
     * @param roleId The role ID
     * @return List of permission rule strings
     */
    @Transactional(readOnly = true)
    fun getRolePermissionRules(roleId: RoleId): List<String> {
        return rolePermissionRepository.findByRoleId(roleId)
            .map { it.permissionRule.toDatabaseString() }
    }
    
    /**
     * Gets all permission rules for a role as typed PermissionRule objects.
     * This method provides type-safe access to permissions, eliminating String parsing.
     * 
     * @param roleId The role ID
     * @return List of typed PermissionRule objects
     */
    @Transactional(readOnly = true)
    fun getRolePermissionRulesAsObjects(roleId: RoleId): List<PermissionRule> {
        return getRolePermissions(roleId).map { it.permissionRule }
    }
    
    
    /**
     * Grants multiple permissions to a role using type-safe PermissionRule objects.
     * 
     * @param roleId The role ID
     * @param permissionRules List of PermissionRule objects to grant
     * @return List of created role permissions
     * @throws IllegalArgumentException if role not found
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun grantPermissionRules(roleId: RoleId, permissionRules: List<PermissionRule>): List<RolePermission> {
        val permissionStrings = permissionRules.map { it.toDatabaseString() }
        return grantPermissions(roleId, permissionStrings)
    }
    
    /**
     * Revokes a permission from a role using a type-safe PermissionRule object.
     * 
     * @param roleId The role ID
     * @param permissionRule The PermissionRule object to revoke
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun revokePermissionRule(roleId: RoleId, permissionRule: PermissionRule) {
        revokePermission(roleId, permissionRule.toDatabaseString())
    }
    
    /**
     * Revokes multiple permissions from a role using type-safe PermissionRule objects.
     * 
     * @param roleId The role ID
     * @param permissionRules List of PermissionRule objects to revoke
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun revokePermissionRules(roleId: RoleId, permissionRules: List<PermissionRule>) {
        val permissionStrings = permissionRules.map { it.toDatabaseString() }
        revokePermissions(roleId, permissionStrings)
    }
    
    /**
     * Checks if a role has a specific permission using type-safe PermissionRule evaluation.
     * 
     * @param roleId The role ID
     * @param permissionRule The PermissionRule object to check
     * @return true if the role has the permission, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasPermission(roleId: RoleId, permissionRule: PermissionRule): Boolean {
        return rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)
    }
    
    /**
     * Type-safe permission checking for resource, action, and scope using enums.
     * This eliminates hardcoded String validation in favor of compile-time type safety.
     * 
     * @param roleId The role ID
     * @param resourceType The resource type (enum)
     * @param action The permission (enum)
     * @param scope The scope (enum)
     * @return true if the role has the required permission, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasPermission(roleId: RoleId, resourceType: ResourceType, action: Action, scope: Scope): Boolean {
        val rolePermissions = getRolePermissionRulesAsObjects(roleId)
        
        return rolePermissions.any { rolePermission ->
            when (rolePermission) {
                is PermissionRule.GeneralRule -> {
                    evaluateGeneralRuleMatch(rolePermission, resourceType, action, scope)
                }
                is PermissionRule.ResourceGroupRule -> {
                    // ResourceGroupRule doesn't apply to general resource checks
                    false
                }
                is PermissionRule.ResourceIdRule -> {
                    // ResourceIdRule doesn't apply to general resource checks
                    false
                }
            }
        }
    }
    
    /**
     * Checks if a role has permission for a specific resource instance using type-safe evaluation.
     * This properly evaluates SpecificRule permissions that were previously ignored.
     * 
     * @param roleId The role ID
     * @param resourceId The specific resource instance ID
     * @param resourceType The resource type (enum)
     * @param action The permission to check (enum)
     * @return true if the role has the permission for the specific resource
     */
    @Transactional(readOnly = true)
    fun hasPermissionForResource(
        roleId: UUID,
        resourceId: UUID,
        resourceType: ResourceType,
        action: Action
    ): Boolean {
        val rolePermissions = getRolePermissionRulesAsObjects(RoleId(roleId))
        
        return rolePermissions.any { rolePermission ->
            when (rolePermission) {
                is PermissionRule.GeneralRule -> {
                    // Check if general rule matches
                    rolePermission.resourceType == resourceType &&
                    (rolePermission.action == action || rolePermission.action == Action.MANAGE)
                }
                is PermissionRule.ResourceGroupRule -> {
                    // ResourceGroupRule needs group membership check
                    false
                }
                is PermissionRule.ResourceIdRule -> {
                    // Check if specific rule matches this exact resource
                    rolePermission.resourceType == resourceType &&
                    rolePermission.resourceId == resourceId &&
                    (rolePermission.action == action || rolePermission.action == Action.MANAGE)
                }
            }
        }
    }
    
    /**
     * Replaces all permissions for a role with a new set using type-safe PermissionRule objects.
     * 
     * @param roleId The role ID
     * @param newPermissionRules List of new PermissionRule objects
     * @return List of new role permissions
     */
    fun replaceRolePermissionRules(roleId: RoleId, newPermissionRules: List<PermissionRule>): List<RolePermission> {
        val permissionStrings = newPermissionRules.map { it.toDatabaseString() }
        return replaceRolePermissions(roleId, permissionStrings)
    }
    
    /**
     * Checks if a role has a specific permission.
     * 
     * @param roleId The role ID
     * @param permissionRule The permission rule to check
     * @return true if the role has the permission, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasPermission(roleId: RoleId, permissionRuleString: String): Boolean {
        val permissionRule = try {
            PermissionRule.fromDatabaseString(permissionRuleString)
        } catch (e: Exception) {
            return false
        }
        return rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)
    }
    
    /**
     * Checks if a role has permission for a specific resource-action-scope combination.
     * Takes into account wildcard permissions and permission hierarchy.
     * 
     * @param roleId The role ID
     * @param resource The resource type
     * @param action The action
     * @param scope The scope
     * @return true if the role has the required permission, false otherwise
     */
    @Transactional(readOnly = true)
    fun hasPermission(roleId: RoleId, resource: String, action: String, scope: String): Boolean {
        // Stringをenumに変換
        val resourceType = try {
            ResourceType.entries.find { it.name.lowercase() == resource.lowercase() } ?: return false
        } catch (e: Exception) {
            return false
        }
        
        val actionEnum = try {
            Action.entries.find { it.name.lowercase() == action.lowercase() } ?: return false
        } catch (e: Exception) {
            return false
        }
        
        val scopeEnum = try {
            Scope.entries.find { it.name.lowercase() == scope.lowercase() } ?: return false
        } catch (e: Exception) {
            return false
        }
        
        // 型安全メソッドを呼ぶ
        return hasPermission(roleId, resourceType, actionEnum, scopeEnum)
    }
    
    
    
    /**
     * Replaces all permissions for a role with a new set.
     * 
     * @param roleId The role ID
     * @param newPermissionRules List of new permission rules
     * @return List of new role permissions
     */
    fun replaceRolePermissions(roleId: RoleId, newPermissionRules: List<String>): List<RolePermission> {
        logger.info("Replacing all permissions for role $roleId with ${newPermissionRules.size} new permissions")
        
        // Verify role exists
        val role = dynamicRoleRepository.findById(roleId)
            ?: throw RoleManagementException.RoleNotFoundException(roleId.value)
        
        // Remove all existing permissions
        rolePermissionRepository.deleteByRoleId(roleId)
        
        // Grant new permissions
        return grantPermissions(roleId, newPermissionRules)
    }
    
    
    /**
     * Validates that a permission can be granted to a role.
     * 
     * @param roleId The role ID
     * @param permissionRule The permission rule
     * @return true if permission can be granted, false otherwise
     */
    @Transactional(readOnly = true)
    fun canGrantPermission(roleId: RoleId, permissionRuleString: String): Boolean {
        // Check if role exists
        val role = dynamicRoleRepository.findById(roleId) ?: return false
        
        // Try to parse permission rule
        val permissionRule = try {
            PermissionRule.fromDatabaseString(permissionRuleString)
        } catch (e: Exception) {
            return false
        }
        
        // Check if already granted
        if (rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, permissionRule)) {
            return false
        }
        
        return true
    }
    
    /**
     * Counts the number of permissions for a role.
     * 
     * @param roleId The role ID
     * @return The count of permissions
     */
    @Transactional(readOnly = true)
    fun countRolePermissions(roleId: RoleId): Long {
        return rolePermissionRepository.countByRoleId(roleId)
    }
    
    
    /**
     * Synchronizes permissions for a role.
     * Adds new permissions and removes those not in the provided set.
     * 
     * @param roleId The role ID
     * @param permissions Set of permission rules to sync
     * @return Sync result with added, removed, and unchanged permissions
     */
    @CacheEvict(value = ["rolePermissions"], key = "#roleId")
    fun syncPermissions(roleId: RoleId, permissions: Set<String>): SyncResult {
        logger.info("Syncing permissions for role $roleId")
        
        // Verify role exists
        val role = dynamicRoleRepository.findById(roleId)
            ?: throw RoleManagementException.RoleNotFoundException(roleId.value)
        
        val currentPermissions = getRolePermissionRules(roleId).toSet()
        
        val toAdd = permissions - currentPermissions
        val toRemove = currentPermissions - permissions
        val unchanged = permissions.intersect(currentPermissions)
        
        val failed = mutableMapOf<String, String>()
        
        // Add new permissions
        toAdd.forEach { permissionString ->
            try {
                val permissionRule = try {
                    PermissionRule.fromDatabaseString(permissionString)
                } catch (e: Exception) {
                    failed[permissionString] = "Invalid permission format"
                    return@forEach
                }
                
                val rolePermission = RolePermission(
                    roleId = roleId,
                    permissionRule = permissionRule
                )
                rolePermissionRepository.save(rolePermission)
            } catch (e: Exception) {
                failed[permissionString] = e.message ?: "Unknown error"
                logger.error("Failed to add permission '$permissionString' to role $roleId", e)
            }
        }
        
        // Remove permissions
        toRemove.forEach { permissionString ->
            try {
                val permissionRule = PermissionRule.fromDatabaseString(permissionString)
                rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, permissionRule)
            } catch (e: Exception) {
                failed[permissionString] = e.message ?: "Unknown error"
                logger.error("Failed to remove permission '$permissionString' from role $roleId", e)
            }
        }
        
        val actuallyAdded = toAdd - failed.keys
        val actuallyRemoved = toRemove.filter { it !in failed.keys }
        
        logger.info("Sync completed for role $roleId: ${actuallyAdded.size} added, ${actuallyRemoved.size} removed")
        
        return SyncResult(
            roleId = roleId,
            added = actuallyAdded.toList(),
            removed = actuallyRemoved,
            unchanged = unchanged.toList(),
            failed = failed,
            syncedAt = Instant.now()
        )
    }
    
    /**
     * Compares permissions between two roles.
     * 
     * @param roleId1 First role ID
     * @param roleId2 Second role ID
     * @return Difference analysis between the two roles' permissions
     */
    @Transactional(readOnly = true)
    fun comparePermissions(roleId1: UUID, roleId2: UUID): PermissionDiff {
        logger.debug("Comparing permissions between roles $roleId1 and $roleId2")
        
        val permissions1 = getRolePermissionRules(RoleId(roleId1)).toSet()
        val permissions2 = getRolePermissionRules(RoleId(roleId2)).toSet()
        
        return PermissionDiff(
            role1Id = roleId1,
            role2Id = roleId2,
            onlyInFirst = (permissions1 - permissions2).toList(),
            onlyInSecond = (permissions2 - permissions1).toList(),
            inBoth = permissions1.intersect(permissions2).toList()
        )
    }
    
    /**
     * Copies all permissions from one role to another.
     * 
     * @param fromRoleId Source role ID
     * @param toRoleId Target role ID
     * @param overwrite Whether to overwrite existing permissions
     * @return List of copied permissions
     */
    fun copyPermissions(fromRoleId: UUID, toRoleId: UUID, overwrite: Boolean = false): List<RolePermission> {
        logger.info("Copying permissions from role $fromRoleId to role $toRoleId")
        
        // Verify both roles exist
        val fromRole = dynamicRoleRepository.findById(RoleId(fromRoleId))
            ?: throw RoleManagementException.RoleNotFoundException(fromRoleId)
        val toRole = dynamicRoleRepository.findById(RoleId(toRoleId))
            ?: throw RoleManagementException.RoleNotFoundException(toRoleId)
        
        val sourcePermissions = getRolePermissionRules(RoleId(fromRoleId))
        
        if (overwrite) {
            // Remove existing permissions if overwriting
            revokeAllPermissions(RoleId(toRoleId))
        }
        
        // Grant permissions to target role
        return grantPermissions(RoleId(toRoleId), sourcePermissions)
    }
    
    /**
     * Validates permission hierarchy and suggests improvements.
     * 
     * @param permissions List of permission rules to validate
     * @return List of hierarchy warnings
     */
    @Transactional(readOnly = true)
    fun validatePermissionHierarchy(permissions: List<String>): List<String> {
        val warnings = mutableListOf<String>()
        
        permissions.forEach { permission ->
            val parts = permission.split(".")
            if (parts.size == 3) {
                val (resource, action, scope) = parts
                
                // Check for scope hierarchy issues
                when (scope) {
                    "own" -> {
                        if (permissions.any { it == "$resource.$action.team" || it == "$resource.$action.all" }) {
                            warnings.add("Permission '$permission' is redundant due to broader scope permissions")
                        }
                    }
                    "team" -> {
                        if (permissions.any { it == "$resource.$action.all" }) {
                            warnings.add("Permission '$permission' is redundant due to 'all' scope permission")
                        }
                    }
                }
                
                // Check for missing prerequisite permissions
                when (action) {
                    "edit", "delete" -> {
                        if (!permissions.any { it.startsWith("$resource.view.") }) {
                            warnings.add("Permission '$permission' may require view permission as prerequisite")
                        }
                    }
                }
            }
        }
        
        return warnings
    }
    
    /**
     * Detects duplicate or redundant permissions.
     * 
     * @param permissions List of permission rules to check
     * @return List of duplication warnings
     */
    @Transactional(readOnly = true)
    fun detectDuplicatePermissions(permissions: List<String>): List<String> {
        val warnings = mutableListOf<String>()
        val uniquePermissions = permissions.toSet()
        
        // Check for exact duplicates
        if (permissions.size != uniquePermissions.size) {
            warnings.add("Found duplicate permissions in the list")
        }
        
        return warnings
    }

    /**
     * Validates a list of permission rules.
     * 
     * @param permissions List of permission rules to validate
     * @return Validation result with valid, invalid, and warnings
     */
    @Transactional(readOnly = true)
    fun validatePermissions(permissions: List<String>): ValidationResult {
        val valid = mutableListOf<String>()
        val invalid = mutableMapOf<String, String>()
        val warnings = mutableMapOf<String, String>()
        
        permissions.forEach { permission ->
            when {
                permission.isBlank() -> {
                    invalid[permission] = "Permission cannot be blank"
                }
                else -> {
                    try {
                        val permissionRule = PermissionRule.fromDatabaseString(permission)
                        valid.add(permission)
                        
                        // Check for broad scope warnings
                        if (permissionRule.scope == Scope.ALL) {
                            warnings[permission] = "ALL scope grants complete access to this resource type"
                        }
                    } catch (e: Exception) {
                        invalid[permission] = "Invalid permission format: ${e.message}"
                    }
                }
            }
        }
        
        // Check for scope hierarchy redundancy
        detectScopeRedundancy(valid, warnings)
        
        return ValidationResult(
            valid = valid,
            invalid = invalid,
            warnings = warnings
        )
    }
    
    /**
     * Detects scope hierarchy redundancy in permissions.
     * If a broader scope exists (e.g., "all"), narrower scopes ("team", "own") are redundant.
     */
    private fun detectScopeRedundancy(validPermissions: List<String>, warnings: MutableMap<String, String>) {
        val resourceActions = validPermissions.mapNotNull { permission ->
            val parts = permission.split(".")
            if (parts.size == 3) {
                val resourceAction = "${parts[0]}.${parts[1]}"
                resourceAction to parts[2] // scope
            } else null
        }.groupBy { it.first }
        
        resourceActions.forEach { (resourceAction, scopes) ->
            val scopeValues = scopes.map { it.second }
            
            when {
                "all" in scopeValues -> {
                    // If "all" scope exists, "team" and "own" are redundant
                    scopeValues.filter { it in listOf("team", "own") }.forEach { redundantScope ->
                        val redundantPermission = "$resourceAction.$redundantScope"
                        warnings[redundantPermission] = "Permission is redundant - already covered by $resourceAction.all"
                    }
                }
                "team" in scopeValues && "own" in scopeValues -> {
                    // If both "team" and "own" exist, suggest using "team" only (as it covers "own")
                    val ownPermission = "$resourceAction.own"
                    warnings[ownPermission] = "Permission may be redundant - $resourceAction.team already includes own scope"
                }
            }
        }
    }
    
    /**
     * Suggests permissions based on a role's current permissions and common patterns.
     * 
     * @param roleId The role ID
     * @return List of suggested permission rules
     */
    @Transactional(readOnly = true)
    fun suggestPermissions(roleId: RoleId): List<String> {
        logger.debug("Generating permission suggestions for role $roleId")
        
        val currentPermissions = getRolePermissionRules(roleId).toSet()
        val suggestions = mutableSetOf<String>()
        
        // Analyze current permissions for patterns
        currentPermissions.forEach { permission ->
            val parts = permission.split(".")
            if (parts.size == 3) {
                val (resource, action, scope) = parts
                
                // Suggest related actions for the same resource and scope
                when (action) {
                    "view" -> {
                        suggestions.add("$resource.edit.$scope")
                        suggestions.add("$resource.create.$scope")
                    }
                    "edit" -> {
                        suggestions.add("$resource.view.$scope")
                        suggestions.add("$resource.delete.$scope")
                    }
                    "create" -> {
                        suggestions.add("$resource.view.$scope")
                        suggestions.add("$resource.edit.$scope")
                    }
                    "delete" -> {
                        suggestions.add("$resource.view.$scope")
                        suggestions.add("$resource.edit.$scope")
                    }
                }
                
                // Suggest scope upgrades
                when (scope) {
                    "own" -> {
                        suggestions.add("$resource.$action.team")
                    }
                    "team" -> {
                        suggestions.add("$resource.$action.all")
                    }
                }
            }
        }
        
        // Remove already granted permissions
        suggestions.removeAll(currentPermissions)
        
        return suggestions.toList().sorted()
    }
    
    /**
     * Gets the effective permissions for a role, including wildcard expansions.
     * 
     * @param roleId The role ID
     * @return Set of effective permission rules
     */
    @Transactional(readOnly = true)
    fun getEffectivePermissions(roleId: RoleId): Set<String> {
        val directPermissions = getRolePermissionRules(roleId)
        // In the new type-safe system, effective permissions are the same as direct permissions
        // No wildcard expansion needed
        return directPermissions.toSet()
    }
    
    /**
     * Merges permissions from multiple roles into a single set.
     * 
     * @param roleIds List of role IDs
     * @return Combined set of permission rules
     */
    @Transactional(readOnly = true)
    fun mergePermissions(roleIds: List<UUID>): Set<String> {
        val mergedPermissions = mutableSetOf<String>()
        
        roleIds.forEach { roleId ->
            mergedPermissions.addAll(getRolePermissionRules(RoleId(roleId)))
        }
        
        return mergedPermissions
    }
    
    /**
     * Analyzes permission usage across all roles.
     * 
     * @return Map of permission rules to the count of roles using them
     */
    @Transactional(readOnly = true)
    fun analyzePermissionUsage(): Map<String, Int> {
        val allPermissions = rolePermissionRepository.findAll()
        
        return allPermissions
            .groupBy { it.permissionRule.toDatabaseString() }
            .mapValues { it.value.size }
    }
    
    // === Private Helper Methods (Type-Safe) ===
    
    /**
     * Type-safe evaluation of GeneralRule matching.
     * Replaces String-based wildcard parsing with proper enum-based logic.
     * 
     * @param userRule The user's GeneralRule
     * @param targetResourceType The target resource type
     * @param targetAction The target permission
     * @param targetScope The target scope
     * @return true if the user rule grants access
     */
    private fun evaluateGeneralRuleMatch(
        userRule: PermissionRule.GeneralRule,
        targetResourceType: ResourceType,
        targetAction: Action,
        targetScope: Scope
    ): Boolean {
        // Check resource type match
        if (userRule.resourceType != targetResourceType) {
            return false
        }
        
        // Check permission match (MANAGE grants all permissions)
        val actionMatch = userRule.action == targetAction || userRule.action == Action.MANAGE
        if (!actionMatch) {
            return false
        }
        
        // Check scope hierarchy: ALL > TEAM > OWN > RESOURCE_GROUP > RESOURCE_ID
        val scopeMatch = when (userRule.scope) {
            Scope.ALL -> true // ALL grants access to everything
            Scope.TEAM -> targetScope in listOf(Scope.TEAM, Scope.OWN, Scope.RESOURCE_GROUP, Scope.RESOURCE_ID)
            Scope.OWN -> targetScope in listOf(Scope.OWN, Scope.RESOURCE_GROUP, Scope.RESOURCE_ID)
            Scope.RESOURCE_GROUP -> targetScope in listOf(Scope.RESOURCE_GROUP, Scope.RESOURCE_ID)
            Scope.RESOURCE_ID -> targetScope == Scope.RESOURCE_ID
        }
        
        return scopeMatch
    }
}