package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.cache.annotation.Cacheable
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Centralized authorization service for permission and role management.
 * 
 * This service provides comprehensive permission checking functionality using type-safe
 * PermissionRule evaluation instead of ugly String-based parsing.
 * 
 * Key features:
 * - Type-safe permission evaluation with proper PermissionRule objects
 * - Proper support for SpecificRule permissions (previously ignored)
 * - Enum-based resource type, permission, and scope validation
 * - Spring Security integration
 * - Multi-role permission aggregation
 * - Resource ownership and team-based access control
 * 
 * Eliminates "醜悪String" (ugly string) evaluation in favor of proper type safety.
 * Integrates with ResourceAccessEvaluator for own/team scope evaluation.
 */
@Service
@Transactional(readOnly = true)
class AuthorizationService(
    private val userRoleService: UserRoleService,
    private val rolePermissionService: RolePermissionService,
    private val dynamicRoleRepository: DynamicRoleRepository,
    private val tenantContextService: TenantContextService
) {
    
    // Optional dependency - injected via setter to avoid circular dependencies
    private var resourceAccessEvaluator: ResourceAccessEvaluator? = null
    
    fun setResourceAccessEvaluator(evaluator: ResourceAccessEvaluator?) {
        this.resourceAccessEvaluator = evaluator
        if (evaluator != null) {
            logger.debug("ResourceAccessEvaluator injected - full own/team scope evaluation enabled")
        }
    }
    private val logger = LoggerFactory.getLogger(AuthorizationService::class.java)
    
    /**
     * Gets all effective permission rules for a user.
     * Aggregates permissions from all assigned roles.
     * 
     * @param tenantUserId The tenant user ID
     * @return Set of PermissionRule objects
     */
    @Cacheable(value = ["userPermissionRules"], key = "#tenantUserId")
    fun getUserEffectivePermissionRules(tenantUserId: UUID): Set<PermissionRule> {
        logger.debug("Getting effective permission rules for user: $tenantUserId")
        
        // Get all roles assigned to the user
        val userRoles = userRoleService.getUserRoles(tenantUserId)
        if (userRoles.isEmpty()) {
            logger.debug("No roles found for user: $tenantUserId")
            return emptySet()
        }
        
        // Collect permissions from all roles
        val permissionRules = mutableSetOf<PermissionRule>()
        userRoles.forEach { userRole ->
            val rolePermissions = rolePermissionService.getRolePermissions(userRole.roleId)
            rolePermissions.forEach { rolePermission ->
                // Permission already stored as PermissionRule object
                permissionRules.add(rolePermission.permissionRule)
            }
        }
        
        logger.debug("User $tenantUserId has ${permissionRules.size} effective permission rules")
        return permissionRules
    }
    
    /**
     * Gets all effective permission rules for a user as strings (for backward compatibility).
     * Aggregates permissions from all assigned roles.
     * 
     * @param tenantUserId The tenant user ID
     * @return Set of permission rules as strings (e.g., "document.edit.all")
     */
    @Cacheable(value = ["userPermissions"], key = "#tenantUserId")
    fun getUserEffectivePermissions(tenantUserId: UUID): Set<String> {
        val permissionRules = getUserEffectivePermissionRules(tenantUserId)
        return permissionRules.map { it.toDatabaseString() }.toSet()
    }
    
    /**
     * Gets all roles assigned to a user.
     * 
     * @param tenantUserId The tenant user ID
     * @return Set of DynamicRole objects
     */
    @Cacheable(value = ["userRoles"], key = "#tenantUserId")
    fun getUserEffectiveRoles(tenantUserId: UUID): Set<DynamicRole> {
        logger.debug("Getting effective roles for user: $tenantUserId")
        
        val roles = userRoleService.getUserDynamicRoles(tenantUserId).toSet()
        
        logger.debug("User $tenantUserId has ${roles.size} effective roles")
        return roles
    }
    
    /**
     * Checks if a user has a specific permission rule using type-safe PermissionRule evaluation.
     * This replaces the ugly String-based evaluation with proper type-safe checking.
     * 
     * @param tenantUserId The tenant user ID
     * @param permissionRule The permission rule to check
     * @return true if the user has the permission
     */
    @Cacheable(value = ["userPermissions"], key = "#tenantUserId + ':' + #permissionRule.toDatabaseString()")
    fun hasPermission(tenantUserId: UUID, permissionRule: PermissionRule): Boolean {
        val userPermissionRules = getUserEffectivePermissionRules(tenantUserId)
        
        // Use type-safe matching
        val hasPermission = userPermissionRules.any { userRule ->
            evaluatePermissionMatch(userRule, permissionRule)
        }
        
        if (hasPermission) {
            logger.debug("User $tenantUserId has permission: ${permissionRule.toDatabaseString()}")
        }
        
        return hasPermission
    }
    
    /**
     * Checks if a user has any of the specified permission rules.
     * 
     * @param tenantUserId The tenant user ID
     * @param permissionRules Set of permission rules to check
     * @return true if the user has at least one permission
     */
    fun hasAnyPermission(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean {
        return permissionRules.any { rule ->
            hasPermission(tenantUserId, rule)
        }
    }
    
    /**
     * Checks if a user has all of the specified permission rules.
     * 
     * @param tenantUserId The tenant user ID
     * @param permissionRules Set of permission rules to check
     * @return true if the user has all permissions
     */
    fun hasAllPermissions(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean {
        return permissionRules.all { rule ->
            hasPermission(tenantUserId, rule)
        }
    }
    
    /**
     * Checks permission for a specific resource, action, and scope using type-safe enum evaluation.
     * This eliminates hardcoded String comparisons in favor of proper enum-based logic.
     * 
     * @param tenantUserId The tenant user ID
     * @param resource The resource type (enum-based)
     * @param action The permission (enum-based)
     * @param scope The required scope (enum-based)
     * @return true if the user has the required permission
     */
    fun hasPermissionForResource(
        tenantUserId: UUID,
        resourceType: ResourceType,
        action: Action,
        scope: Scope
    ): Boolean {
        val userPermissionRules = getUserEffectivePermissionRules(tenantUserId)
        
        val hasPermission = userPermissionRules.any { userRule ->
            when (userRule) {
                is PermissionRule.GeneralRule -> {
                    evaluateGeneralRuleMatch(userRule, resourceType, action, scope)
                }
                is PermissionRule.ResourceGroupRule -> {
                    // ResourceGroupRule requires group membership check (handled in Service layer)
                    false
                }
                is PermissionRule.ResourceIdRule -> {
                    // ResourceIdRule doesn't apply to general resource checks
                    false
                }
            }
        }
        
        if (hasPermission) {
            logger.debug("User $tenantUserId has permission for ${resourceType.name}.${action.name}.${scope.name}")
        }
        
        return hasPermission
    }
    
    /**
     * Checks if a user can access a specific resource instance using type-safe evaluation.
     * This method properly evaluates SpecificRule permissions that were previously ignored.
     * 
     * @param tenantUserId The tenant user ID
     * @param resourceId The specific resource instance ID
     * @param resourceType The resource type (enum-based)
     * @param action The permission to check (enum-based)
     * @return true if the user can access the resource
     */
    fun canAccessResource(
        tenantUserId: UUID,
        resourceId: UUID,
        resourceType: ResourceType,
        action: Action
    ): Boolean {
        logger.debug("Checking resource access for user $tenantUserId on ${resourceType.name}:$resourceId with permission ${action.name}")
        
        val userPermissionRules = getUserEffectivePermissionRules(tenantUserId)
        
        // Check for ResourceIdRule permissions (specific resource access)
        val hasSpecificAction = userPermissionRules.any { userRule ->
            when (userRule) {
                is PermissionRule.ResourceIdRule -> {
                    userRule.resourceType == resourceType &&
                    userRule.resourceId == resourceId &&
                    (userRule.action == action || userRule.action == Action.MANAGE)
                }
                is PermissionRule.ResourceGroupRule -> {
                    // Would need to check group membership here
                    false  // TODO: implement group membership check
                }
                else -> false
            }
        }
        
        if (hasSpecificAction) {
            logger.debug("User has specific permission for resource - access granted")
            return true
        }
        
        // Check for "all" scope general permission
        if (hasPermissionForResource(tenantUserId, resourceType, action, Scope.ALL)) {
            logger.debug("User has 'all' scope permission - access granted")
            return true
        }
        
        // If ResourceAccessEvaluator is available, check team and own scopes
        val evaluator = resourceAccessEvaluator
        if (evaluator != null) {
            // Check for "team" scope permission
            if (hasPermissionForResource(tenantUserId, resourceType, action, Scope.TEAM)) {
                if (evaluator.isInResourceTeam(tenantUserId, resourceId, resourceType)) {
                    logger.debug("User has 'team' scope permission and is in resource team - access granted")
                    return true
                }
                logger.debug("User has 'team' scope permission but is not in resource team - access denied")
            }
            
            // Check for "own" scope permission
            if (hasPermissionForResource(tenantUserId, resourceType, action, Scope.OWN)) {
                if (evaluator.isResourceOwner(tenantUserId, resourceId, resourceType)) {
                    logger.debug("User has 'own' scope permission and owns the resource - access granted")
                    return true
                }
                logger.debug("User has 'own' scope permission but does not own the resource - access denied")
            }
        } else {
            // Fallback when ResourceAccessEvaluator is not available
            if (hasPermissionForResource(tenantUserId, resourceType, action, Scope.TEAM)) {
                logger.warn("Team scope check requested but ResourceAccessEvaluator not available - access denied")
            }
            if (hasPermissionForResource(tenantUserId, resourceType, action, Scope.OWN)) {
                logger.warn("Own scope check requested but ResourceAccessEvaluator not available - access denied")
            }
        }
        
        logger.debug("No applicable permissions found - access denied")
        return false
    }
    
    /**
     * Gets the highest permission scope for a resource and action using type-safe evaluation.
     * 
     * @param tenantUserId The tenant user ID
     * @param resourceType The resource type (enum-based)
     * @param action The permission (enum-based)
     * @return The highest scope or null if no permission
     */
    fun getHighestPermissionScope(
        tenantUserId: UUID,
        resourceType: ResourceType,
        action: Action
    ): Scope? {
        // Check scopes in priority order
        val scopePriority = listOf(Scope.ALL, Scope.TEAM, Scope.OWN)
        
        for (scope in scopePriority) {
            if (hasPermissionForResource(tenantUserId, resourceType, action, scope)) {
                logger.debug("User $tenantUserId has $scope scope for ${resourceType.name}.${action.name}")
                return scope
            }
        }
        
        return null
    }
    
    /**
     * Converts user permissions to Spring Security GrantedAuthorities.
     * Used for integration with Spring Security and JWT authentication.
     * 
     * @param tenantUserId The tenant user ID
     * @return Set of GrantedAuthority objects
     */
    fun convertToGrantedAuthorities(tenantUserId: UUID): Set<GrantedAuthority> {
        val authorities = mutableSetOf<GrantedAuthority>()
        
        // Add role authorities (with ROLE_ prefix for Spring Security)
        val roles = getUserEffectiveRoles(tenantUserId)
        roles.forEach { role ->
            authorities.add(SimpleGrantedAuthority("ROLE_${role.name.uppercase()}"))
        }
        
        // Add permission rule authorities
        val permissions = getUserEffectivePermissions(tenantUserId)
        permissions.forEach { permission ->
            authorities.add(SimpleGrantedAuthority(permission))
        }
        
        logger.debug("Generated ${authorities.size} authorities for user $tenantUserId")
        return authorities
    }
    
    // === Private Helper Methods (Type-Safe) ===
    
    /**
     * Type-safe evaluation of permission match between user rule and target rule.
     * This replaces the ugly String-based wildcard matching with proper type-safe logic.
     * 
     * @param userRule The user's permission rule
     * @param targetRule The target permission rule to check
     * @return true if the user rule grants access to the target rule
     */
    private fun evaluatePermissionMatch(userRule: PermissionRule, targetRule: PermissionRule): Boolean {
        return when {
            // Exact match
            userRule == targetRule -> true
            
            // Cross-type matching not supported
            userRule::class != targetRule::class -> false
            
            // GeneralRule matching
            userRule is PermissionRule.GeneralRule && targetRule is PermissionRule.GeneralRule -> {
                evaluateGeneralRuleMatch(userRule, targetRule.resourceType, targetRule.action, targetRule.scope)
            }
            
            // ResourceIdRule matching (exact only)
            userRule is PermissionRule.ResourceIdRule && targetRule is PermissionRule.ResourceIdRule -> {
                userRule.resourceType == targetRule.resourceType &&
                userRule.resourceId == targetRule.resourceId &&
                (userRule.action == targetRule.action || userRule.action == Action.MANAGE)
            }
            
            // ResourceGroupRule matching
            userRule is PermissionRule.ResourceGroupRule && targetRule is PermissionRule.ResourceGroupRule -> {
                userRule.resourceType == targetRule.resourceType &&
                userRule.groupId == targetRule.groupId &&
                (userRule.action == targetRule.action || userRule.action == Action.MANAGE)
            }
            
            else -> false
        }
    }
    
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