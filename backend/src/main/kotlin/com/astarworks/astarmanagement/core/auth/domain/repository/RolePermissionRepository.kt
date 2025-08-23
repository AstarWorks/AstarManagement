package com.astarworks.astarmanagement.core.auth.domain.repository

import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import java.util.UUID

/**
 * RolePermission repository interface for domain layer.
 * Handles permission assignments to roles with composite key management.
 * Supports advanced permission rule matching, wildcard patterns, and hierarchical access control.
 */
interface RolePermissionRepository {
    
    /**
     * Saves a role permission to the repository.
     * @param rolePermission The role permission to save
     * @return The saved role permission with any generated values
     */
    fun save(rolePermission: RolePermission): RolePermission
    
    /**
     * Finds a role permission by role ID and permission rule combination (composite key).
     * @param roleId The role ID
     * @param permissionRule The permission rule string
     * @return The role permission if found, null otherwise
     */
    fun findByRoleIdAndPermissionRule(roleId: UUID, permissionRule: String): RolePermission?
    
    /**
     * Finds all role permissions.
     * @return List of all role permissions
     */
    fun findAll(): List<RolePermission>
    
    /**
     * Finds all permission assignments for a specific role.
     * @param roleId The role ID
     * @return List of permission assignments for the role
     */
    fun findByRoleId(roleId: UUID): List<RolePermission>
    
    /**
     * Finds all roles with a specific permission rule.
     * @param permissionRule The permission rule string
     * @return List of role permissions with the specified rule
     */
    fun findByPermissionRule(permissionRule: String): List<RolePermission>
    
    /**
     * Finds all role permissions containing a specific pattern in the permission rule.
     * @param pattern The pattern to search for in permission rules
     * @return List of role permissions containing the pattern
     */
    fun findByPermissionRuleContaining(pattern: String): List<RolePermission>
    
    /**
     * Finds all wildcard permissions (rules containing '*').
     * @return List of role permissions with wildcard patterns
     */
    fun findWildcardPermissions(): List<RolePermission>
    
    /**
     * Finds all full access permissions (rules like '*.*.all').
     * @return List of role permissions granting full access
     */
    fun findFullAccessPermissions(): List<RolePermission>
    
    /**
     * Finds permissions by resource type.
     * @param resource The resource type (e.g., "table", "document", "user")
     * @return List of role permissions for the specified resource
     */
    fun findByResource(resource: String): List<RolePermission>
    
    /**
     * Finds permissions by resource and action combination.
     * @param resource The resource type
     * @param action The action type (e.g., "view", "edit", "delete")
     * @return List of role permissions for the resource-action combination
     */
    fun findByResourceAndAction(resource: String, action: String): List<RolePermission>
    
    /**
     * Finds permissions by resource, action, and scope combination.
     * @param resource The resource type
     * @param action The action type
     * @param scope The scope (e.g., "all", "team", "own")
     * @return List of role permissions matching the complete combination
     */
    fun findByResourceAndActionAndScope(resource: String, action: String, scope: String): List<RolePermission>
    
    /**
     * Finds permissions by scope type.
     * @param scope The scope (e.g., "all", "team", "own")
     * @return List of role permissions with the specified scope
     */
    fun findByScope(scope: String): List<RolePermission>
    
    /**
     * Finds permissions created within a specific time period.
     * @param withinDays Number of days to check
     * @return List of role permissions created within the specified days
     */
    fun findCreatedWithin(withinDays: Long): List<RolePermission>
    
    /**
     * Finds role permissions that grant access to a specific resource-action-scope combination.
     * Uses the domain model's permission matching logic.
     * @param resource The resource type
     * @param action The action type
     * @param scope The scope
     * @return List of role permissions that grant the requested access
     */
    fun findGrantingAccessTo(resource: String, action: String, scope: String): List<RolePermission>
    
    /**
     * Checks if a role permission exists for the given role and permission rule combination.
     * @param roleId The role ID
     * @param permissionRule The permission rule string
     * @return true if permission exists, false otherwise
     */
    fun existsByRoleIdAndPermissionRule(roleId: UUID, permissionRule: String): Boolean
    
    /**
     * Checks if any permissions exist for a specific role.
     * @param roleId The role ID
     * @return true if permissions exist, false otherwise
     */
    fun existsByRoleId(roleId: UUID): Boolean
    
    /**
     * Checks if any roles have a specific permission rule.
     * @param permissionRule The permission rule string
     * @return true if roles with the permission exist, false otherwise
     */
    fun existsByPermissionRule(permissionRule: String): Boolean
    
    /**
     * Checks if any wildcard permissions exist.
     * @return true if wildcard permissions exist, false otherwise
     */
    fun existsWildcardPermissions(): Boolean
    
    /**
     * Checks if any full access permissions exist.
     * @return true if full access permissions exist, false otherwise
     */
    fun existsFullAccessPermissions(): Boolean
    
    /**
     * Deletes a role permission by role ID and permission rule combination (composite key).
     * @param roleId The role ID
     * @param permissionRule The permission rule string
     */
    fun deleteByRoleIdAndPermissionRule(roleId: UUID, permissionRule: String)
    
    /**
     * Deletes all permissions for a specific role.
     * @param roleId The role ID
     */
    fun deleteByRoleId(roleId: UUID)
    
    /**
     * Deletes all roles with a specific permission rule.
     * @param permissionRule The permission rule string
     */
    fun deleteByPermissionRule(permissionRule: String)
    
    /**
     * Deletes all wildcard permissions.
     */
    fun deleteWildcardPermissions()
    
    /**
     * Deletes all full access permissions.
     */
    fun deleteFullAccessPermissions()
    
    /**
     * Deletes permissions by resource type.
     * @param resource The resource type
     */
    fun deleteByResource(resource: String)
    
    /**
     * Counts the total number of role permissions.
     * @return The total count
     */
    fun count(): Long
    
    /**
     * Counts the number of permissions for a specific role.
     * @param roleId The role ID
     * @return The count of permissions for the role
     */
    fun countByRoleId(roleId: UUID): Long
    
    /**
     * Counts the number of roles with a specific permission rule.
     * @param permissionRule The permission rule string
     * @return The count of roles with the permission
     */
    fun countByPermissionRule(permissionRule: String): Long
    
    /**
     * Counts the number of wildcard permissions.
     * @return The count of wildcard permissions
     */
    fun countWildcardPermissions(): Long
    
    /**
     * Counts the number of full access permissions.
     * @return The count of full access permissions
     */
    fun countFullAccessPermissions(): Long
    
    /**
     * Counts permissions by resource type.
     * @param resource The resource type
     * @return The count of permissions for the resource
     */
    fun countByResource(resource: String): Long
    
    /**
     * Counts permissions by scope type.
     * @param scope The scope
     * @return The count of permissions with the scope
     */
    fun countByScope(scope: String): Long
}