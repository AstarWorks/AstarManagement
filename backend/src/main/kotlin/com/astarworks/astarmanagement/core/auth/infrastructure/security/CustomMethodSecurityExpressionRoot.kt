package com.astarworks.astarmanagement.core.auth.infrastructure.security

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.auth.domain.service.AuthorizationProvider
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import org.slf4j.LoggerFactory
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.access.expression.SecurityExpressionRoot
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations
import org.springframework.security.authentication.AuthenticationTrustResolver
import org.springframework.security.core.Authentication
import java.io.Serializable
import java.util.UUID

/**
 * Custom security expression root for method-level security.
 * 
 * This class provides custom SpEL methods that can be used in @PreAuthorize annotations
 * to implement fine-grained access control based on our permission system.
 * 
 * Available methods:
 * - hasPermission(rule): Check if user has a specific permission rule
 * - hasAnyPermission(rules...): Check if user has any of the specified permissions
 * - hasAllPermissions(rules...): Check if user has all specified permissions
 * - hasResourcePermission(resource, action, scope): Check resource-specific permission
 * - canAccessResource(id, type, action): Check access to a specific resource instance
 * - hasPermissionForOwn(resource, action, ownerId): Check permission for owned resources
 * - hasPermissionForTeam(resource, action): Check permission for team resources
 * - hasDynamicRole(name): Check if user has a specific role
 * - hasAnyDynamicRole(names...): Check if user has any of the specified roles
 * - isInTenant(tenantId): Check if user belongs to a specific tenant
 * 
 * Example usage in controllers:
 * @PreAuthorize("hasPermission('document.edit.all')")
 * @PreAuthorize("canAccessResource(#id, 'document', 'view')")
 * @PreAuthorize("hasPermissionForOwn('document', 'delete', #document.ownerId)")
 * @PreAuthorize("hasDynamicRole('admin') or hasPermission('settings.manage.all')")
 */
class CustomMethodSecurityExpressionRoot(
    authentication: Authentication,
    private val authorizationProvider: AuthorizationProvider,
    private val tenantContextService: TenantContextService
) : SecurityExpressionRoot(authentication), MethodSecurityExpressionOperations {
    
    private val logger = LoggerFactory.getLogger(CustomMethodSecurityExpressionRoot::class.java)
    
    private var filterObject: Any? = null
    private var returnObject: Any? = null
    private var target: Any? = null
    private var permissionEvaluator: PermissionEvaluator? = null
    private var trustResolver: AuthenticationTrustResolver? = null
    
    /**
     * Override hasPermission to handle single-argument permission checks.
     * This method is called when using @PreAuthorize("hasPermission('permission')")
     * with a single string argument.
     * 
     * @param targetDomainObject The target object (when null, treated as single-arg call)
     * @param permission The permission rule to check
     * @return true if the user has the permission
     */
    override fun hasPermission(target: Any, permission: Any): Boolean {
        // Handle single-argument call: hasPermission('workspace.view')
        // In this case, Spring passes the permission as target and a dummy permission
        if (target is String && permission == null) {
            return hasPermissionRule(target)
        }
        
        // Handle permission string check
        if (permission is String) {
            return hasPermissionRule(permission)
        }
        
        // For standard two-argument calls, delegate to the permission evaluator if available
        return permissionEvaluator?.hasPermission(authentication, target, permission) ?: false
    }
    
    /**
     * Override Spring Security's built-in hasPermission method for ID-based permissions.
     * This ensures compatibility with Spring Security's standard permission checking.
     * This method is called when using @PreAuthorize("hasPermission(#id, 'type', 'permission')")
     * 
     * @param targetId The target object ID
     * @param targetType The target type 
     * @param permission The permission rule to check
     * @return true if the user has the permission
     */
    override fun hasPermission(targetId: Any, targetType: String, permission: Any): Boolean {
        // Convert targetId to Serializable if needed
        val serializableTargetId = when (targetId) {
            is java.io.Serializable -> targetId
            is String -> targetId
            is UUID -> targetId
            else -> targetId?.toString()
        }
        
        // Delegate to the permission evaluator for resource-based checks
        return if (serializableTargetId != null) {
            permissionEvaluator?.hasPermission(authentication, serializableTargetId, targetType, permission) ?: false
        } else {
            false
        }
    }
    
    /**
     * Checks if the current user has a specific permission rule.
     * Supports wildcard permissions (e.g., "*.*.all").
     * This is a custom method for single-argument permission checks.
     * 
     * @param permissionRule The permission rule to check (e.g., "document.edit.all")
     * @return true if the user has the permission
     * 
     * Usage: @PreAuthorize("hasPermissionRule('document.edit.all')")
     */
    fun hasPermissionRule(permissionRule: String): Boolean {
        try {
            logger.debug("Checking permission rule: {}", permissionRule)
            
            // Get tenant user ID
            val tenantUserId = getTenantUserIdFromAuth()
            logger.debug("Got tenantUserId: {}", tenantUserId)
            
            // Check permission using authorizationProvider
            val rule = PermissionRule.fromDatabaseString(permissionRule)
            val result = authorizationProvider.hasPermission(tenantUserId, rule)
            logger.debug("Permission check result for '{}': {}", permissionRule, result)
            return result
        } catch (e: Exception) {
            logger.error("Permission check failed for rule: {}, user: {}", permissionRule, authentication.name, e)
            return false
        }
    }
    
    
    /**
     * Checks if the current user has any of the specified permission rules.
     * 
     * @param permissionRules Variable number of permission rules
     * @return true if the user has at least one of the permissions
     * 
     * Usage: @PreAuthorize("hasAnyPermission('document.edit.all', 'document.create.all')")
     */
    fun hasAnyPermission(vararg permissionRules: String): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        val rules = permissionRules.map { PermissionRule.fromDatabaseString(it) }.toSet()
        return authorizationProvider.hasAnyPermission(tenantUserId, rules)
    }
    
    /**
     * Checks if the current user has all of the specified permission rules.
     * 
     * @param permissionRules Variable number of permission rules
     * @return true if the user has all the permissions
     * 
     * Usage: @PreAuthorize("hasAllPermissions('document.view.all', 'document.edit.all')")
     */
    fun hasAllPermissions(vararg permissionRules: String): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        val rules = permissionRules.map { PermissionRule.fromDatabaseString(it) }.toSet()
        return authorizationProvider.hasAllPermissions(tenantUserId, rules)
    }
    
    /**
     * Checks if the current user has permission for a specific resource, action, and scope.
     * Considers scope hierarchy (all > team > own).
     * 
     * @param resource The resource type (e.g., "document", "table")
     * @param action The action (e.g., "view", "edit", "delete")
     * @param scope The required scope (e.g., "all", "team", "own")
     * @return true if the user has the required permission
     * 
     * Usage: @PreAuthorize("hasResourcePermission('document', 'edit', 'all')")
     */
    fun hasResourcePermission(resource: String, action: String, scope: String): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        val resourceType = ResourceType.valueOf(resource.uppercase())
        val actionEnum = Action.valueOf(action.uppercase())
        val scopeEnum = Scope.valueOf(scope.uppercase())
        return authorizationProvider.hasPermissionForResource(
            tenantUserId, resourceType, actionEnum, scopeEnum
        )
    }
    
    /**
     * Checks if the current user can access a specific resource instance.
     * 
     * @param resourceId The UUID of the resource
     * @param resourceType The type of resource (e.g., "document", "table")
     * @param action The action to perform (e.g., "view", "edit", "delete")
     * @return true if the user can access the resource
     * 
     * Usage: @PreAuthorize("canAccessResource(#id, 'document', 'edit')")
     */
    fun canAccessResource(resourceId: UUID, resourceType: String, action: String): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        val resourceTypeEnum = ResourceType.valueOf(resourceType.uppercase())
        val actionEnum = Action.valueOf(action.uppercase())
        return authorizationProvider.canAccessResource(
            tenantUserId, resourceId, resourceTypeEnum, actionEnum
        )
    }
    
    /**
     * Checks if the current user has permission to perform an action on their own resources.
     * First verifies the user has "own" scope permission, then checks ownership.
     * 
     * @param resource The resource type
     * @param action The action to perform
     * @param ownerId The owner ID of the resource
     * @return true if the user has permission and is the owner
     * 
     * Usage: @PreAuthorize("hasPermissionForOwn('document', 'delete', #document.ownerId)")
     */
    fun hasPermissionForOwn(resource: String, action: String, ownerId: UUID): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        
        // Check if user has at least "own" scope permission
        val resourceType = ResourceType.valueOf(resource.uppercase())
        val actionEnum = Action.valueOf(action.uppercase())
        if (!authorizationProvider.hasPermissionForResource(
            tenantUserId, resourceType, actionEnum, Scope.OWN
        )) {
            return false
        }
        
        // Check if the user is the owner
        return tenantUserId == ownerId
    }
    
    /**
     * Checks if the current user has team-level permission for a resource and action.
     * 
     * @param resource The resource type
     * @param action The action to perform
     * @return true if the user has team-level permission
     * 
     * Usage: @PreAuthorize("hasPermissionForTeam('document', 'edit')")
     */
    fun hasPermissionForTeam(resource: String, action: String): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        val resourceType = ResourceType.valueOf(resource.uppercase())
        val actionEnum = Action.valueOf(action.uppercase())
        return authorizationProvider.hasPermissionForResource(
            tenantUserId, resourceType, actionEnum, Scope.TEAM
        )
    }
    
    /**
     * Checks if the current user has a specific dynamic role.
     * 
     * @param roleName The name of the role
     * @return true if the user has the role
     * 
     * Usage: @PreAuthorize("hasDynamicRole('admin')")
     */
    fun hasDynamicRole(roleName: String): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        val roles = authorizationProvider.getUserEffectiveRoles(tenantUserId)
        return roles.any { it.name.equals(roleName, ignoreCase = true) }
    }
    
    /**
     * Checks if the current user has any of the specified dynamic roles.
     * 
     * @param roleNames Variable number of role names
     * @return true if the user has at least one of the roles
     * 
     * Usage: @PreAuthorize("hasAnyDynamicRole('admin', 'manager')")
     */
    fun hasAnyDynamicRole(vararg roleNames: String): Boolean {
        val tenantUserId = getTenantUserIdFromAuth()
        val roles = authorizationProvider.getUserEffectiveRoles(tenantUserId)
        return roles.any { role ->
            roleNames.any { it.equals(role.name, ignoreCase = true) }
        }
    }
    
    /**
     * Checks if the current request is within the specified tenant context.
     * 
     * @param tenantId The tenant ID to check
     * @return true if the current tenant context matches
     * 
     * Usage: @PreAuthorize("isInTenant(#tenantId)")
     */
    fun isInTenant(tenantId: UUID): Boolean {
        val currentTenantId = tenantContextService.getTenantContext()
        return currentTenantId == tenantId
    }
    
    /**
     * Checks if the current user is the same as the specified user.
     * Compares with the user ID (not tenant user ID).
     * 
     * @param userId The user ID to compare
     * @return true if the current user matches
     * 
     * Usage: @PreAuthorize("isSelf(#userId)")
     */
    fun isSelf(userId: UUID): Boolean {
        val currentUserId = getUserIdFromAuth()
        return currentUserId == userId
    }
    
    /**
     * Checks if the current tenant user is the same as the specified tenant user.
     * Compares with the tenant user ID.
     * 
     * @param tenantUserId The tenant user ID to compare
     * @return true if the current tenant user matches
     * 
     * Usage: @PreAuthorize("isSelfTenantUser(#tenantUserId)")
     */
    fun isSelfTenantUser(tenantUserId: UUID): Boolean {
        val currentTenantUserId = getTenantUserIdFromAuth()
        return currentTenantUserId == tenantUserId
    }
    
    /**
     * Gets the current authenticated user context.
     * Can be used in complex expressions that need full context.
     * 
     * @return The authenticated user context or null
     * 
     * Usage: @PreAuthorize("@customService.checkComplex(authenticatedContext)")
     */
    fun getAuthenticatedContext(): AuthenticatedUserContext? {
        val principal = authentication.principal
        return principal as? AuthenticatedUserContext
    }
    
    /**
     * Extracts the tenant user ID from the authentication principal.
     * Now simplified to work directly with AuthenticatedUserContext.
     * Throws SecurityException if tenant user context is not available.
     * 
     * @return The tenant user ID
     * @throws SecurityException if tenant user context is not available
     */
    private fun getTenantUserIdFromAuth(): UUID {
        return getAuthenticatedContext()?.tenantUserId
            ?: throw SecurityException("Tenant user context not available. Authentication: ${authentication.name}")
    }
    
    /**
     * Extracts the user ID from the authentication principal.
     * 
     * @return The user ID or null if not found
     */
    private fun getUserIdFromAuth(): UUID? {
        return getAuthenticatedContext()?.userId
    }
    
    /**
     * Extracts the tenant ID from the authentication principal.
     * 
     * @return The tenant ID or null if not found
     */
    private fun getTenantIdFromAuth(): UUID? {
        return getAuthenticatedContext()?.tenantId
    }
    
    // ===== Table Security Methods =====
    // Migrated from TableSecurityExpressions to unify authorization approach
    
    /**
     * Check table creation permission.
     * Workspace access is implicitly checked via tenant isolation.
     * 
     * @param workspaceId The workspace ID (for parameter validation, not used in actual check)
     * @return true if user can create tables
     */
    fun canCreateTable(workspaceId: UUID): Boolean {
        return hasPermissionRule("table.create.all")
    }
    
    /**
     * Check table view permission.
     * Table access is implicitly checked via tenant isolation.
     * 
     * @param tableId The table ID (for parameter validation, not used in actual check)
     * @return true if user can view tables
     */
    fun canViewTable(tableId: UUID): Boolean {
        return hasPermissionRule("table.view.all")
    }
    
    /**
     * Check tables view permission in workspace.
     * Workspace access is implicitly checked via tenant isolation.
     * 
     * @param workspaceId The workspace ID (for parameter validation, not used in actual check)
     * @return true if user can view tables in workspace
     */
    fun canViewTablesInWorkspace(workspaceId: UUID): Boolean {
        return hasPermissionRule("table.view.all")
    }
    
    /**
     * Check table edit permission.
     * Table access is implicitly checked via tenant isolation.
     * 
     * @param tableId The table ID (for parameter validation, not used in actual check)
     * @return true if user can edit tables
     */
    fun canEditTable(tableId: UUID): Boolean {
        return hasPermissionRule("table.edit.all")
    }
    
    /**
     * Check table delete permission.
     * Table access is implicitly checked via tenant isolation.
     * 
     * @param tableId The table ID (for parameter validation, not used in actual check)
     * @return true if user can delete tables
     */
    fun canDeleteTable(tableId: UUID): Boolean {
        return hasPermissionRule("table.delete.all")
    }
    
    /**
     * Check table export permission.
     * Table access is implicitly checked via tenant isolation.
     * 
     * @param tableId The table ID (for parameter validation, not used in actual check)
     * @return true if user can export tables
     */
    fun canExportTable(tableId: UUID): Boolean {
        return hasPermissionRule("table.export.all")
    }
    
    /**
     * Check table import permission.
     * Table access is implicitly checked via tenant isolation.
     * 
     * @param tableId The table ID (for parameter validation, not used in actual check)
     * @return true if user can import into tables
     */
    fun canImportTable(tableId: UUID): Boolean {
        return hasPermissionRule("table.import.all")
    }
    
    /**
     * Check table duplication permission.
     * Source table access is implicitly checked via tenant isolation.
     * 
     * @param sourceTableId The source table ID (for parameter validation, not used in actual check)
     * @return true if user can duplicate tables
     */
    fun canDuplicateTable(sourceTableId: UUID): Boolean {
        return hasPermissionRule("table.create.all")
    }
    
    /**
     * Check record creation permission.
     * Table access is implicitly checked via tenant isolation.
     * 
     * @param tableId The table ID (for parameter validation, not used in actual check)
     * @return true if user can create records
     */
    fun canCreateRecord(tableId: UUID): Boolean {
        return hasPermissionRule("record.create.all")
    }
    
    /**
     * Check record view permission.
     * Record access is implicitly checked via tenant isolation.
     * 
     * @param recordId The record ID (for parameter validation, not used in actual check)
     * @return true if user can view records
     */
    fun canViewRecord(recordId: UUID): Boolean {
        return hasPermissionRule("record.view.all")
    }
    
    /**
     * Check record edit permission.
     * Record access is implicitly checked via tenant isolation.
     * 
     * @param recordId The record ID (for parameter validation, not used in actual check)
     * @return true if user can edit records
     */
    fun canEditRecord(recordId: UUID): Boolean {
        return hasPermissionRule("record.edit.all")
    }
    
    /**
     * Check record delete permission.
     * Record access is implicitly checked via tenant isolation.
     * 
     * @param recordId The record ID (for parameter validation, not used in actual check)
     * @return true if user can delete records
     */
    fun canDeleteRecord(recordId: UUID): Boolean {
        return hasPermissionRule("record.delete.all")
    }
    
    /**
     * Check records view permission for a table.
     * Table access is implicitly checked via tenant isolation.
     * 
     * @param tableId The table ID (for parameter validation, not used in actual check)
     * @return true if user can view records in tables
     */
    fun canViewTableRecords(tableId: UUID): Boolean {
        return hasPermissionRule("record.view.all")
    }
    
    /**
     * Check property type management permissions.
     * 
     * @return true if user can manage property types
     */
    fun canManagePropertyTypes(): Boolean {
        return hasPermissionRule("property_type.create.all") || 
               hasPermissionRule("property_type.edit.all") || 
               hasPermissionRule("property_type.delete.all")
    }
    
    /**
     * Check view custom property types permission.
     * 
     * @return true if user can view custom property types
     */
    fun canViewCustomPropertyTypes(): Boolean {
        return hasPermissionRule("property_type.view.custom")
    }
    
    // ===== MethodSecurityExpressionOperations Implementation =====
    
    override fun setFilterObject(filterObject: Any) {
        this.filterObject = filterObject
    }
    
    override fun getFilterObject(): Any? = filterObject
    
    override fun setReturnObject(returnObject: Any?) {
        this.returnObject = returnObject
    }
    
    override fun getReturnObject(): Any? = returnObject
    
    override fun getThis(): Any? = target
    
    fun setThis(target: Any?) {
        this.target = target
    }
    
    override fun setPermissionEvaluator(evaluator: PermissionEvaluator) {
        this.permissionEvaluator = evaluator
        super.setPermissionEvaluator(evaluator)
    }
    
    override fun setTrustResolver(resolver: AuthenticationTrustResolver) {
        this.trustResolver = resolver
        super.setTrustResolver(resolver)
    }
    
}