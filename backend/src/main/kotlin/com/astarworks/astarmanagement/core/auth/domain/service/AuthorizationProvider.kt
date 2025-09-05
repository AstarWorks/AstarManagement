package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.*
import java.util.UUID

/**
 * Authorization provider interface for decoupling security expressions from concrete implementations.
 * 
 * This interface provides a clean abstraction for permission checking and role management,
 * making the security system more testable and maintainable.
 * 
 * Key benefits:
 * - Enables easy mocking for tests
 * - Reduces coupling between security expressions and business logic
 * - Allows different implementations for different environments
 */
interface AuthorizationProvider {
    
    /**
     * Checks if a user has a specific permission rule.
     * 
     * @param tenantUserId The tenant user ID
     * @param permissionRule The permission rule to check
     * @return true if the user has the permission
     */
    fun hasPermission(tenantUserId: UUID, permissionRule: PermissionRule): Boolean
    
    /**
     * Checks if a user has any of the specified permission rules.
     * 
     * @param tenantUserId The tenant user ID
     * @param permissionRules Set of permission rules to check
     * @return true if the user has at least one permission
     */
    fun hasAnyPermission(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean
    
    /**
     * Checks if a user has all of the specified permission rules.
     * 
     * @param tenantUserId The tenant user ID
     * @param permissionRules Set of permission rules to check
     * @return true if the user has all permissions
     */
    fun hasAllPermissions(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean
    
    /**
     * Checks if a user has permission for a specific resource, action, and scope.
     * 
     * @param tenantUserId The tenant user ID
     * @param resourceType The resource type
     * @param action The action
     * @param scope The required scope
     * @return true if the user has the required permission
     */
    fun hasPermissionForResource(tenantUserId: UUID, resourceType: ResourceType, action: Action, scope: Scope): Boolean
    
    /**
     * Checks if a user can access a specific resource instance.
     * 
     * @param tenantUserId The tenant user ID
     * @param resourceId The UUID of the resource
     * @param resourceType The type of resource
     * @param action The action to perform
     * @return true if the user can access the resource
     */
    fun canAccessResource(tenantUserId: UUID, resourceId: UUID, resourceType: ResourceType, action: Action): Boolean
    
    /**
     * Gets all roles assigned to a user.
     * 
     * @param tenantUserId The tenant user ID
     * @return Set of DynamicRole objects
     */
    fun getUserEffectiveRoles(tenantUserId: UUID): Set<DynamicRole>
    
    /**
     * Gets all effective permission rules for a user.
     * 
     * @param tenantUserId The tenant user ID
     * @return Set of permission rules
     */
    fun getUserEffectivePermissions(tenantUserId: UUID): Set<PermissionRule>
}