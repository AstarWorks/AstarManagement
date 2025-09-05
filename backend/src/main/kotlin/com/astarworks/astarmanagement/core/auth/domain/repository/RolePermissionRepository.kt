package com.astarworks.astarmanagement.core.auth.domain.repository

import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.ResourceGroupId
import com.astarworks.astarmanagement.shared.domain.value.EntityId
import java.util.UUID

/**
 * RolePermission repository interface for domain layer.
 * 
 * 型安全なPermissionRuleベースのインターフェース。
 * ビジネスロジックでは文字列を一切扱わない。
 * データベースとの変換はインフラ層（RepositoryImpl）で行う。
 */
interface RolePermissionRepository {
    
    /**
     * Saves a role permission to the repository.
     * @param rolePermission The role permission to save
     * @return The saved role permission with any generated values
     */
    fun save(rolePermission: RolePermission): RolePermission
    
    /**
     * Finds a role permission by role ID and permission rule combination.
     * @param roleId The role ID
     * @param permissionRule The permission rule object
     * @return The role permission if found, null otherwise
     */
    fun findByRoleIdAndPermissionRule(roleId: RoleId, permissionRule: PermissionRule): RolePermission?
    
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
    fun findByRoleId(roleId: RoleId): List<RolePermission>
    
    /**
     * Finds permissions by resource type.
     * @param resourceType The resource type enum
     * @return List of role permissions for the specified resource type
     */
    fun findByResourceType(resourceType: ResourceType): List<RolePermission>
    
    /**
     * Finds permissions by action.
     * @param action The action enum
     * @return List of role permissions for the specified action
     */
    fun findByAction(action: Action): List<RolePermission>
    
    /**
     * Finds permissions by scope.
     * @param scope The scope enum
     * @return List of role permissions with the specified scope
     */
    fun findByScope(scope: Scope): List<RolePermission>
    
    /**
     * Finds permissions by resource type and action combination.
     * @param resourceType The resource type enum
     * @param action The action enum
     * @return List of role permissions for the resource-action combination
     */
    fun findByResourceTypeAndAction(resourceType: ResourceType, action: Action): List<RolePermission>
    
    /**
     * Finds permissions by resource type, action, and scope combination.
     * @param resourceType The resource type enum
     * @param action The action enum
     * @param scope The scope enum
     * @return List of role permissions matching the complete combination
     */
    fun findByResourceTypeAndActionAndScope(
        resourceType: ResourceType, 
        action: Action, 
        scope: Scope
    ): List<RolePermission>
    
    /**
     * Finds permissions created within a specific time period.
     * @param withinDays Number of days to check
     * @return List of role permissions created within the specified days
     */
    fun findCreatedWithin(withinDays: Long): List<RolePermission>
    
    /**
     * Finds role permissions that grant access to a specific resource.
     * @param resourceType The resource type enum
     * @param action The action enum
     * @param scope The scope enum
     * @return List of role permissions that grant the requested access
     */
    fun findGrantingAccessTo(
        resourceType: ResourceType, 
        action: Action, 
        scope: Scope
    ): List<RolePermission>
    
    /**
     * Finds permissions for a specific resource group.
     * @param groupId The resource group ID
     * @return List of role permissions for the resource group
     */
    fun findByResourceGroupId(groupId: ResourceGroupId): List<RolePermission>
    
    /**
     * Finds permissions for a specific resource ID.
     * @param resourceId The resource ID (raw UUID for generic resources)
     * @return List of role permissions for the specific resource
     */
    fun findByResourceId(resourceId: UUID): List<RolePermission>
    
    /**
     * Checks if a role permission exists for the given role and permission rule.
     * @param roleId The role ID
     * @param permissionRule The permission rule object
     * @return true if permission exists, false otherwise
     */
    fun existsByRoleIdAndPermissionRule(roleId: RoleId, permissionRule: PermissionRule): Boolean
    
    /**
     * Checks if any permissions exist for a specific role.
     * @param roleId The role ID
     * @return true if permissions exist, false otherwise
     */
    fun existsByRoleId(roleId: RoleId): Boolean
    
    /**
     * Checks if any permissions exist for a resource type.
     * @param resourceType The resource type enum
     * @return true if permissions exist, false otherwise
     */
    fun existsByResourceType(resourceType: ResourceType): Boolean
    
    /**
     * Deletes a role permission by role ID and permission rule.
     * @param roleId The role ID
     * @param permissionRule The permission rule object
     */
    fun deleteByRoleIdAndPermissionRule(roleId: RoleId, permissionRule: PermissionRule)
    
    /**
     * Deletes all permissions for a specific role.
     * @param roleId The role ID
     */
    fun deleteByRoleId(roleId: RoleId)
    
    /**
     * Deletes permissions by resource type.
     * @param resourceType The resource type enum
     */
    fun deleteByResourceType(resourceType: ResourceType)
    
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
    fun countByRoleId(roleId: RoleId): Long
    
    /**
     * Counts permissions by resource type.
     * @param resourceType The resource type enum
     * @return The count of permissions for the resource type
     */
    fun countByResourceType(resourceType: ResourceType): Long
    
    /**
     * Counts permissions by scope.
     * @param scope The scope enum
     * @return The count of permissions with the scope
     */
    fun countByScope(scope: Scope): Long
}