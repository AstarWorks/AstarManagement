package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RolePermissionTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RoleTable
import org.springframework.stereotype.Component

/**
 * Mapper for converting between RolePermission domain model and RolePermissionTable entity.
 * Handles composite key permission assignment mapping with string-based permission rules.
 */
@Component
class RolePermissionMapper {
    
    /**
     * Converts a domain RolePermission to a persistence RolePermissionTable.
     * 
     * @param rolePermission The domain RolePermission
     * @param roleTable The RoleTable entity for the foreign key relationship
     * @return RolePermissionTable entity
     */
    fun toEntity(
        rolePermission: RolePermission,
        roleTable: RoleTable
    ): RolePermissionTable {
        return RolePermissionTable(
            role = roleTable,
            permissionRule = rolePermission.permissionRule,
            createdAt = rolePermission.createdAt
        )
    }
    
    /**
     * Converts a persistence RolePermissionTable to a domain RolePermission.
     * 
     * @param entity The RolePermissionTable entity
     * @return RolePermission domain model
     */
    fun toDomain(entity: RolePermissionTable): RolePermission {
        return RolePermission(
            roleId = entity.role.id,
            permissionRule = entity.permissionRule,
            createdAt = entity.createdAt
        )
    }
    
    /**
     * Updates an existing RolePermissionTable with values from a domain RolePermission.
     * Note: This method does not update the composite key relationships (role, permissionRule)
     * as these are typically immutable after creation for permission assignments.
     * 
     * @param entity The existing RolePermissionTable entity to update
     * @param rolePermission The RolePermission with new values
     * @return The updated RolePermissionTable entity
     */
    fun updateEntity(
        entity: RolePermissionTable,
        rolePermission: RolePermission
    ): RolePermissionTable {
        // Note: role, permissionRule, and createdAt are intentionally not updated
        // as composite key and timestamp should be immutable for permissions
        // RolePermission entities are typically replaced rather than updated
        return entity
    }
    
    /**
     * Converts a list of RolePermissionTable entities to a list of RolePermission domain models.
     * 
     * @param entities List of RolePermissionTable entities
     * @return List of RolePermission domain models
     */
    fun toDomainList(entities: List<RolePermissionTable>): List<RolePermission> {
        return entities.map { toDomain(it) }
    }
    
    /**
     * Extracts role ID from a RolePermission for repository operations.
     * This is a utility method to handle role ID extraction.
     * 
     * @param rolePermission The RolePermission
     * @return The role ID as string
     */
    fun extractRoleId(rolePermission: RolePermission): String {
        return rolePermission.roleId.toString()
    }
    
    /**
     * Extracts permission rule from a RolePermission for repository operations.
     * This is a utility method to handle permission rule extraction.
     * 
     * @param rolePermission The RolePermission
     * @return The permission rule string
     */
    fun extractPermissionRule(rolePermission: RolePermission): String {
        return rolePermission.permissionRule
    }
    
    /**
     * Validates the format of a permission rule using domain model logic.
     * 
     * @param rule The permission rule to validate
     * @return true if valid, false otherwise
     */
    fun validatePermissionRule(rule: String): Boolean {
        return RolePermission.isValidPermissionRule(rule)
    }
    
    /**
     * Parses a permission rule into its components using domain model logic.
     * 
     * @param rule The permission rule to parse
     * @return Triple of (resource, action, scope) or null if invalid
     */
    fun parsePermissionRule(rule: String): Triple<String, String, String>? {
        if (!validatePermissionRule(rule)) return null
        
        val parts = rule.split(".")
        return if (parts.size == 3) {
            Triple(parts[0], parts[1], parts[2])
        } else {
            null
        }
    }
    
    /**
     * Creates a permission rule string from components.
     * 
     * @param resource The resource type
     * @param action The action type
     * @param scope The scope type
     * @return The permission rule string
     */
    fun createPermissionRule(resource: String, action: String, scope: String): String {
        return RolePermission.createRule(resource, action, scope)
    }
    
    /**
     * Checks if a permission rule is a wildcard permission.
     * 
     * @param rule The permission rule to check
     * @return true if wildcard, false otherwise
     */
    fun isWildcardPermission(rule: String): Boolean {
        return rule.contains("*")
    }
    
    /**
     * Checks if a permission rule grants full access.
     * 
     * @param rule The permission rule to check
     * @return true if full access, false otherwise
     */
    fun isFullAccessPermission(rule: String): Boolean {
        return rule == "*.*.all" || rule == "*.*.*"
    }
    
    /**
     * Extracts the resource type from a permission rule.
     * 
     * @param rule The permission rule
     * @return The resource type or null if invalid
     */
    fun extractResource(rule: String): String? {
        return parsePermissionRule(rule)?.first
    }
    
    /**
     * Extracts the action type from a permission rule.
     * 
     * @param rule The permission rule
     * @return The action type or null if invalid
     */
    fun extractAction(rule: String): String? {
        return parsePermissionRule(rule)?.second
    }
    
    /**
     * Extracts the scope type from a permission rule.
     * 
     * @param rule The permission rule
     * @return The scope type or null if invalid
     */
    fun extractScope(rule: String): String? {
        return parsePermissionRule(rule)?.third
    }
    
    /**
     * Checks if a permission rule grants access to a specific resource-action-scope combination.
     * Uses the domain model's permission matching logic.
     * 
     * @param rule The permission rule to check
     * @param resource The target resource
     * @param action The target action
     * @param scope The target scope
     * @return true if access is granted, false otherwise
     */
    fun grantsAccessTo(rule: String, resource: String, action: String, scope: String): Boolean {
        return try {
            val rolePermission = RolePermission(
                roleId = java.util.UUID.randomUUID(), // Dummy UUID for validation
                permissionRule = rule
            )
            rolePermission.grantsAccessTo(resource, action, scope)
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Creates a composite key string for logging and debugging purposes.
     * 
     * @param rolePermission The RolePermission
     * @return Composite key as string in format "roleId:permissionRule"
     */
    fun createCompositeKeyString(rolePermission: RolePermission): String {
        return "${rolePermission.roleId}:${rolePermission.permissionRule}"
    }
}