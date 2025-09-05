package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.*
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Production implementation of AuthorizationProvider that delegates to AuthorizationService.
 * 
 * This implementation acts as a bridge between the interface and the existing business logic,
 * providing a clean separation that enables better testing and maintainability.
 */
@Component
class AuthorizationProviderImpl(
    private val authorizationService: AuthorizationService
) : AuthorizationProvider {
    
    override fun hasPermission(tenantUserId: UUID, permissionRule: PermissionRule): Boolean {
        return authorizationService.hasPermission(tenantUserId, permissionRule)
    }
    
    override fun hasAnyPermission(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean {
        return authorizationService.hasAnyPermission(tenantUserId, permissionRules)
    }
    
    override fun hasAllPermissions(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean {
        return authorizationService.hasAllPermissions(tenantUserId, permissionRules)
    }
    
    override fun hasPermissionForResource(
        tenantUserId: UUID, 
        resourceType: ResourceType, 
        action: Action, 
        scope: Scope
    ): Boolean {
        return authorizationService.hasPermissionForResource(tenantUserId, resourceType, action, scope)
    }
    
    override fun canAccessResource(
        tenantUserId: UUID, 
        resourceId: UUID, 
        resourceType: ResourceType, 
        action: Action
    ): Boolean {
        return authorizationService.canAccessResource(tenantUserId, resourceId, resourceType, action)
    }
    
    override fun getUserEffectiveRoles(tenantUserId: UUID): Set<DynamicRole> {
        return authorizationService.getUserEffectiveRoles(tenantUserId)
    }
    
    override fun getUserEffectivePermissions(tenantUserId: UUID): Set<PermissionRule> {
        return authorizationService.getUserEffectivePermissionRules(tenantUserId)
    }
}