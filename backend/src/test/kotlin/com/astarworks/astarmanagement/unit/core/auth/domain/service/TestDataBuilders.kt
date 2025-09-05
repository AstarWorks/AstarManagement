package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.shared.domain.value.*
import java.time.Instant
import java.util.UUID

/**
 * Test data builder for DynamicRole entities.
 */
object TestRoleBuilder {
    
    fun defaultRole(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID = UUID.randomUUID(),
        name: String = "test_role_${System.currentTimeMillis()}",
        displayName: String = "Test Role",
        color: String = "#FF5733",
        position: Int = 1
    ): DynamicRole {
        return DynamicRole.forTenant(
            tenantId = TenantId(tenantId),
            name = name,
            displayName = displayName,
            color = color,
            position = position
        ).copy(id = RoleId(id))
    }
    
    fun systemRole(
        id: UUID = UUID.randomUUID(),
        name: String = "system_role_${System.currentTimeMillis()}",
        displayName: String = "System Role"
    ): DynamicRole {
        return DynamicRole.systemRole(
            name = name,
            displayName = displayName,
            position = 0
        ).copy(id = RoleId(id))
    }
    
    fun roleWithId(roleId: UUID, tenantId: UUID): DynamicRole {
        return defaultRole(id = roleId, tenantId = tenantId)
    }
    
    fun multipleRoles(tenantId: UUID, count: Int = 3): List<DynamicRole> {
        return (1..count).map { index ->
            defaultRole(
                tenantId = tenantId,
                name = "role_$index",
                displayName = "Role $index",
                position = index
            )
        }
    }
}

/**
 * Test data builder for RolePermission entities.
 */
object TestPermissionBuilder {
    
    fun permission(
        roleId: UUID,
        permissionRule: PermissionRule = PermissionRule.GeneralRule(
            resourceType = ResourceType.DOCUMENT,
            action = Action.VIEW,
            scope = Scope.ALL
        )
    ): RolePermission {
        return RolePermission(
            roleId = RoleId(roleId),
            permissionRule = permissionRule,
            createdAt = Instant.now()
        )
    }
    
    // Overload for backward compatibility with string-based tests
    fun permission(
        roleId: UUID,
        permissionRuleStr: String
    ): RolePermission {
        val rule = PermissionRule.fromDatabaseString(permissionRuleStr)
        return RolePermission(
            roleId = RoleId(roleId),
            permissionRule = rule,
            createdAt = Instant.now()
        )
    }
    
    fun validPermissions(): List<PermissionRule> {
        return listOf(
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.ALL),
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.EDIT, Scope.OWN),
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.DELETE, Scope.TEAM),
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM),
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.CREATE, Scope.ALL),
            PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.OWN),
            PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.MANAGE, Scope.TEAM),
            PermissionRule.GeneralRule(ResourceType.TENANT, Action.MANAGE, Scope.ALL)
        )
    }
    
    fun invalidPermissionStrings(): List<String> {
        return listOf(
            "invalid",
            "document.invalid.all",
            "document.view.invalid",
            "document..all",
            "document.view.",
            ".view.all",
            "document view all",
            "DOCUMENT.VIEW.ALL"
        )
    }
    
    fun wildcardPermissionStrings(): List<String> {
        return listOf(
            "*.view.all",
            "document.*.all",
            "document.view.*",
            "*.*.all",
            "table.*.team"
        )
    }
    
    fun permissionSet(roleId: UUID, rules: List<PermissionRule>): List<RolePermission> {
        return rules.map { rule ->
            permission(roleId = roleId, permissionRule = rule)
        }
    }
    
    fun permissionSetFromStrings(roleId: UUID, ruleStrings: List<String>): List<RolePermission> {
        return ruleStrings.map { ruleStr ->
            permission(roleId = roleId, permissionRuleStr = ruleStr)
        }
    }
}

/**
 * Test data builder for UserRole entities.
 */
object TestUserRoleBuilder {
    
    fun userRole(
        tenantUserId: UUID = UUID.randomUUID(),
        roleId: UUID,
        assignedBy: UUID? = UUID.randomUUID()
    ): UserRole {
        return UserRole(
            tenantUserId = TenantUserId(tenantUserId),
            roleId = RoleId(roleId),
            assignedAt = Instant.now(),
            assignedBy = assignedBy?.let { UserId(it) }
        )
    }
}

/**
 * Test data builder for RoleCreateRequest.
 */
object TestRoleRequestBuilder {
    
    fun createRequest(
        name: String = "new_role",
        displayName: String = "New Role",
        color: String = "#00FF00",
        position: Int = 1,
        permissions: List<String> = emptyList()
    ): RoleCreateRequest {
        return RoleCreateRequest(
            name = name,
            displayName = displayName,
            color = color,
            position = position,
            permissions = permissions
        )
    }
    
    fun multipleRequests(count: Int = 3): List<RoleCreateRequest> {
        return (1..count).map { index ->
            createRequest(
                name = "role_$index",
                displayName = "Role $index",
                position = index
            )
        }
    }
}

/**
 * Test data builder for AuthenticatedUserContext.
 */
object TestAuthContextBuilder {
    
    fun forTesting(
        auth0Sub: String = "test|123456",
        tenantId: UUID = UUID.randomUUID(),
        email: String = "test@example.com"
    ): AuthenticatedUserContext {
        return AuthenticatedUserContext(
            auth0Sub = auth0Sub,
            userId = UUID.randomUUID(),
            tenantUserId = UUID.randomUUID(),
            tenantId = tenantId,
            email = email,
            isActive = true
        )
    }
    
    fun withRoles(
        roles: Set<DynamicRole>,
        tenantId: UUID = UUID.randomUUID()
    ): AuthenticatedUserContext {
        return forTesting(tenantId = tenantId).copy(roles = roles)
    }
    
    fun withPermissions(
        permissions: Set<PermissionRule>,
        tenantId: UUID = UUID.randomUUID()
    ): AuthenticatedUserContext {
        return forTesting(tenantId = tenantId).copy(permissions = permissions)
    }
}