package com.astarworks.astarmanagement.fixture.builder

import com.astarworks.astarmanagement.core.auth.domain.model.*
import java.util.UUID

/**
 * Test data builder for creating PermissionRule instances for testing.
 * 
 * Provides convenient methods to create various types of permission rules
 * with different scopes, actions, and resource types.
 */
class PermissionTestDataBuilder {
    
    /**
     * Builds a GeneralRule with ALL scope - grants access to all resources.
     * 
     * @param resourceType The type of resource
     * @param action The action to perform
     * @return GeneralRule with ALL scope
     */
    fun buildAllScopePermission(
        resourceType: ResourceType = ResourceType.TABLE,
        action: Action = Action.VIEW
    ): PermissionRule.GeneralRule {
        return PermissionRule.GeneralRule(
            resourceType = resourceType,
            action = action,
            scope = Scope.ALL
        )
    }
    
    /**
     * Builds a GeneralRule with TEAM scope - grants access to team resources.
     * 
     * @param resourceType The type of resource
     * @param action The action to perform
     * @return GeneralRule with TEAM scope
     */
    fun buildTeamScopePermission(
        resourceType: ResourceType = ResourceType.DOCUMENT,
        action: Action = Action.EDIT
    ): PermissionRule.GeneralRule {
        return PermissionRule.GeneralRule(
            resourceType = resourceType,
            action = action,
            scope = Scope.TEAM
        )
    }
    
    /**
     * Builds a GeneralRule with OWN scope - grants access to owned resources only.
     * 
     * @param resourceType The type of resource
     * @param action The action to perform
     * @return GeneralRule with OWN scope
     */
    fun buildOwnScopePermission(
        resourceType: ResourceType = ResourceType.RECORD,
        action: Action = Action.DELETE
    ): PermissionRule.GeneralRule {
        return PermissionRule.GeneralRule(
            resourceType = resourceType,
            action = action,
            scope = Scope.OWN
        )
    }
    
    /**
     * Builds a ResourceGroupRule - grants access through resource group membership.
     * 
     * @param resourceType The type of resource
     * @param action The action to perform
     * @param groupId The resource group ID
     * @return ResourceGroupRule
     */
    fun buildResourceGroupPermission(
        resourceType: ResourceType = ResourceType.WORKSPACE,
        action: Action = Action.MANAGE,
        groupId: UUID = UUID.randomUUID()
    ): PermissionRule.ResourceGroupRule {
        return PermissionRule.ResourceGroupRule(
            resourceType = resourceType,
            action = action,
            groupId = groupId
        )
    }
    
    /**
     * Builds a ResourceIdRule - grants access to a specific resource instance.
     * 
     * @param resourceType The type of resource
     * @param action The action to perform
     * @param resourceId The specific resource ID
     * @return ResourceIdRule
     */
    fun buildResourceIdPermission(
        resourceType: ResourceType = ResourceType.TABLE,
        action: Action = Action.EDIT,
        resourceId: UUID = UUID.randomUUID()
    ): PermissionRule.ResourceIdRule {
        return PermissionRule.ResourceIdRule(
            resourceType = resourceType,
            action = action,
            resourceId = resourceId
        )
    }
    
    /**
     * Builds a MANAGE permission that grants all actions on a resource.
     * 
     * @param resourceType The type of resource
     * @param scope The scope of access
     * @return GeneralRule with MANAGE action
     */
    fun buildManagePermission(
        resourceType: ResourceType = ResourceType.ROLE,
        scope: Scope = Scope.ALL
    ): PermissionRule.GeneralRule {
        return PermissionRule.GeneralRule(
            resourceType = resourceType,
            action = Action.MANAGE,
            scope = scope
        )
    }
    
    /**
     * Builds a set of standard user permissions.
     * 
     * @return Set of permission rules for a standard user
     */
    fun buildStandardUserPermissions(): Set<PermissionRule> {
        return setOf(
            buildAllScopePermission(ResourceType.TABLE, Action.VIEW),
            buildAllScopePermission(ResourceType.TABLE, Action.CREATE),
            buildOwnScopePermission(ResourceType.TABLE, Action.EDIT),
            buildOwnScopePermission(ResourceType.TABLE, Action.DELETE),
            buildTeamScopePermission(ResourceType.DOCUMENT, Action.VIEW),
            buildAllScopePermission(ResourceType.DOCUMENT, Action.CREATE),
            buildOwnScopePermission(ResourceType.DOCUMENT, Action.EDIT),
            buildOwnScopePermission(ResourceType.DOCUMENT, Action.DELETE)
        )
    }
    
    /**
     * Builds a set of admin permissions with full access.
     * 
     * @return Set of permission rules for an admin
     */
    fun buildAdminPermissions(): Set<PermissionRule> {
        return setOf(
            buildManagePermission(ResourceType.TABLE, Scope.ALL),
            buildManagePermission(ResourceType.DOCUMENT, Scope.ALL),
            buildManagePermission(ResourceType.DIRECTORY, Scope.ALL),
            buildManagePermission(ResourceType.WORKSPACE, Scope.ALL),
            buildManagePermission(ResourceType.USER, Scope.ALL),
            buildManagePermission(ResourceType.ROLE, Scope.ALL),
            buildManagePermission(ResourceType.SETTINGS, Scope.ALL)
        )
    }
    
    /**
     * Builds a set of viewer permissions (read-only).
     * 
     * @return Set of permission rules for a viewer
     */
    fun buildViewerPermissions(): Set<PermissionRule> {
        return setOf(
            buildTeamScopePermission(ResourceType.TABLE, Action.VIEW),
            buildTeamScopePermission(ResourceType.DOCUMENT, Action.VIEW),
            buildTeamScopePermission(ResourceType.DIRECTORY, Action.VIEW)
        )
    }
    
    /**
     * Builds permissions for testing scope hierarchy.
     * 
     * @param resourceType The resource type to test
     * @param action The action to test
     * @return List of permissions with different scopes
     */
    fun buildScopeHierarchyPermissions(
        resourceType: ResourceType = ResourceType.TABLE,
        action: Action = Action.VIEW
    ): List<PermissionRule.GeneralRule> {
        return listOf(
            PermissionRule.GeneralRule(resourceType, action, Scope.ALL),
            PermissionRule.GeneralRule(resourceType, action, Scope.TEAM),
            PermissionRule.GeneralRule(resourceType, action, Scope.OWN)
        )
    }
    
    /**
     * Creates a permission from a database string format.
     * 
     * @param permissionString The permission string (e.g., "table.view.all")
     * @return Parsed PermissionRule
     */
    fun fromString(permissionString: String): PermissionRule {
        return PermissionRule.fromDatabaseString(permissionString)
    }
    
    /**
     * Creates multiple permissions from database string format.
     * 
     * @param permissionStrings List of permission strings
     * @return Set of parsed PermissionRules
     */
    fun fromStrings(vararg permissionStrings: String): Set<PermissionRule> {
        return permissionStrings.map { fromString(it) }.toSet()
    }
    
    companion object {
        /**
         * Fixed UUIDs for consistent testing
         */
        object TestIds {
            val RESOURCE_GROUP_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
            val RESOURCE_GROUP_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
            val SPECIFIC_TABLE_ID = UUID.fromString("12345678-1234-1234-1234-123456789012")
            val SPECIFIC_DOCUMENT_ID = UUID.fromString("87654321-4321-4321-4321-210987654321")
        }
        
        /**
         * Common test permission strings
         */
        object TestPermissions {
            const val TABLE_VIEW_ALL = "table.view.all"
            const val TABLE_CREATE_ALL = "table.create.all"
            const val TABLE_EDIT_OWN = "table.edit.own"
            const val TABLE_DELETE_OWN = "table.delete.own"
            const val TABLE_MANAGE_ALL = "table.manage.all"
            
            const val DOCUMENT_VIEW_TEAM = "document.view.team"
            const val DOCUMENT_EDIT_OWN = "document.edit.own"
            const val DOCUMENT_MANAGE_ALL = "document.manage.all"
            
            const val ROLE_VIEW_ALL = "role.view.all"
            const val ROLE_CREATE_ALL = "role.create.all"
            const val ROLE_MANAGE_ALL = "role.manage.all"
        }
    }
}