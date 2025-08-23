package com.astarworks.astarmanagement.core.auth.domain.model

import java.time.LocalDateTime
import java.util.UUID

/**
 * RolePermission domain entity.
 * Represents permissions assigned to roles.
 * Permission rules follow the format: resource.action.scope (e.g., "table.edit.all")
 */
data class RolePermission(
    val roleId: UUID,
    val permissionRule: String,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    init {
        require(permissionRule.isNotBlank()) {
            "Permission rule cannot be blank"
        }
        require(permissionRule.length <= 255) {
            "Permission rule cannot exceed 255 characters"
        }
        require(isValidPermissionRule(permissionRule)) {
            "Invalid permission rule format. Expected: resource.action.scope (e.g., 'table.edit.all')"
        }
    }
    
    /**
     * Parses the permission rule into its components.
     * @return Triple of (resource, action, scope) or null if invalid format
     */
    fun parseRule(): Triple<String, String, String>? {
        val parts = permissionRule.split(".")
        return if (parts.size == 3) {
            Triple(parts[0], parts[1], parts[2])
        } else {
            null
        }
    }
    
    /**
     * Gets the resource type from the permission rule.
     */
    fun getResource(): String? = parseRule()?.first
    
    /**
     * Gets the action from the permission rule.
     */
    fun getAction(): String? = parseRule()?.second
    
    /**
     * Gets the scope from the permission rule.
     */
    fun getScope(): String? = parseRule()?.third
    
    /**
     * Checks if this permission grants access to a specific resource.
     */
    fun grantsAccessTo(resource: String, action: String, scope: String): Boolean {
        val ruleParts = parseRule() ?: return false
        val (ruleResource, ruleAction, ruleScope) = ruleParts
        
        // Check resource match (wildcard support)
        val resourceMatch = ruleResource == "*" || ruleResource == resource
        
        // Check action match (wildcard support)
        val actionMatch = ruleAction == "*" || ruleAction == action
        
        // Check scope match (hierarchy: all > team > own)
        val scopeMatch = when (ruleScope) {
            "all" -> true
            "team" -> scope in listOf("team", "own")
            "own" -> scope == "own"
            "*" -> true
            else -> ruleScope == scope
        }
        
        return resourceMatch && actionMatch && scopeMatch
    }
    
    /**
     * Checks if this permission is a wildcard permission.
     */
    fun isWildcard(): Boolean {
        return permissionRule.contains("*")
    }
    
    /**
     * Checks if this permission grants full access (*.*.all).
     */
    fun isFullAccess(): Boolean {
        return permissionRule == "*.*.all" || permissionRule == "*.*.*"
    }
    
    companion object {
        /**
         * Validates the format of a permission rule.
         */
        fun isValidPermissionRule(rule: String): Boolean {
            if (rule.isBlank()) return false
            
            val parts = rule.split(".")
            if (parts.size != 3) return false
            
            // Each part should be non-empty and contain only valid characters
            return parts.all { part ->
                part.isNotEmpty() && part.matches(Regex("^[a-z0-9_*]+$"))
            }
        }
        
        /**
         * Creates a permission rule string from components.
         */
        fun createRule(resource: String, action: String, scope: String): String {
            require(resource.isNotBlank()) { "Resource cannot be blank" }
            require(action.isNotBlank()) { "Action cannot be blank" }
            require(scope.isNotBlank()) { "Scope cannot be blank" }
            
            val rule = "$resource.$action.$scope"
            require(isValidPermissionRule(rule)) {
                "Invalid permission rule components"
            }
            
            return rule
        }
        
        /**
         * Common permission rule templates.
         */
        object Templates {
            // Full access
            const val FULL_ACCESS = "*.*.all"
            
            // Table permissions
            const val TABLE_VIEW_ALL = "table.view.all"
            const val TABLE_CREATE_ALL = "table.create.all"
            const val TABLE_EDIT_ALL = "table.edit.all"
            const val TABLE_EDIT_OWN = "table.edit.own"
            const val TABLE_DELETE_ALL = "table.delete.all"
            const val TABLE_DELETE_OWN = "table.delete.own"
            const val TABLE_MANAGE_ALL = "table.manage.all"
            
            // Document permissions
            const val DOCUMENT_VIEW_ALL = "document.view.all"
            const val DOCUMENT_VIEW_TEAM = "document.view.team"
            const val DOCUMENT_CREATE_ALL = "document.create.all"
            const val DOCUMENT_EDIT_ALL = "document.edit.all"
            const val DOCUMENT_EDIT_OWN = "document.edit.own"
            const val DOCUMENT_DELETE_ALL = "document.delete.all"
            const val DOCUMENT_DELETE_OWN = "document.delete.own"
            const val DOCUMENT_MANAGE_ALL = "document.manage.all"
            
            // Settings permissions
            const val SETTINGS_VIEW_ALL = "settings.view.all"
            const val SETTINGS_EDIT_ALL = "settings.edit.all"
            const val SETTINGS_MANAGE_ALL = "settings.manage.all"
            
            // User management permissions
            const val USER_VIEW_ALL = "user.view.all"
            const val USER_CREATE_ALL = "user.create.all"
            const val USER_EDIT_ALL = "user.edit.all"
            const val USER_DELETE_ALL = "user.delete.all"
            const val USER_MANAGE_ALL = "user.manage.all"
            
            // Role management permissions
            const val ROLE_VIEW_ALL = "role.view.all"
            const val ROLE_CREATE_ALL = "role.create.all"
            const val ROLE_EDIT_ALL = "role.edit.all"
            const val ROLE_DELETE_ALL = "role.delete.all"
            const val ROLE_MANAGE_ALL = "role.manage.all"
        }
    }
}