package com.astarworks.astarmanagement.core.auth.domain.model

/**
 * Default role-to-permission mappings for the system.
 * Defines what permissions each role has by default.
 * 
 * This can be overridden by custom templates for different industries or organizations.
 */
object RolePermissionMapping {
    
    /**
     * Default permission rules for each role.
     * These define the baseline permissions that come with each role.
     */
    val DEFAULT_MAPPINGS: Map<Role, List<PermissionRule>> = mapOf(
        Role.ADMIN to listOf(
            // Admins have full management rights on all resource types
            PermissionRule.GeneralRule(Permission.MANAGE, Scope.ALL, ResourceType.TABLE),
            PermissionRule.GeneralRule(Permission.MANAGE, Scope.ALL, ResourceType.DOCUMENT),
            PermissionRule.GeneralRule(Permission.MANAGE, Scope.ALL, ResourceType.DIRECTORY),
            PermissionRule.GeneralRule(Permission.MANAGE, Scope.ALL, ResourceType.SETTINGS)
        ),
        
        Role.USER to listOf(
            // Users can view all tables
            PermissionRule.GeneralRule(Permission.VIEW, Scope.ALL, ResourceType.TABLE),
            // Users can create new table entries
            PermissionRule.GeneralRule(Permission.CREATE, Scope.ALL, ResourceType.TABLE),
            // Users can edit their own table entries
            PermissionRule.GeneralRule(Permission.EDIT, Scope.OWN, ResourceType.TABLE),
            // Users can delete their own table entries
            PermissionRule.GeneralRule(Permission.DELETE, Scope.OWN, ResourceType.TABLE),
            
            // Users can view team documents
            PermissionRule.GeneralRule(Permission.VIEW, Scope.TEAM, ResourceType.DOCUMENT),
            // Users can create documents
            PermissionRule.GeneralRule(Permission.CREATE, Scope.ALL, ResourceType.DOCUMENT),
            // Users can edit their own documents
            PermissionRule.GeneralRule(Permission.EDIT, Scope.OWN, ResourceType.DOCUMENT),
            // Users can delete their own documents
            PermissionRule.GeneralRule(Permission.DELETE, Scope.OWN, ResourceType.DOCUMENT),
            
            // Users can view directories
            PermissionRule.GeneralRule(Permission.VIEW, Scope.TEAM, ResourceType.DIRECTORY),
            // Users can create directories
            PermissionRule.GeneralRule(Permission.CREATE, Scope.ALL, ResourceType.DIRECTORY)
        ),
        
        Role.VIEWER to listOf(
            // Viewers can only view team resources
            PermissionRule.GeneralRule(Permission.VIEW, Scope.TEAM, ResourceType.TABLE),
            PermissionRule.GeneralRule(Permission.VIEW, Scope.TEAM, ResourceType.DOCUMENT),
            PermissionRule.GeneralRule(Permission.VIEW, Scope.TEAM, ResourceType.DIRECTORY)
        )
    )
    
    /**
     * Get permission rules for a given role.
     * 
     * @param role The role to get permissions for
     * @return List of permission rules for the role
     */
    fun getPermissionRulesForRole(role: Role): List<PermissionRule> {
        return DEFAULT_MAPPINGS[role] ?: emptyList()
    }
    
    /**
     * Get Spring Security authority strings for a given role.
     * Converts PermissionRule objects to authority strings.
     * 
     * @param role The role to get authorities for
     * @return Set of authority strings for Spring Security
     */
    fun getAuthoritiesForRole(role: Role): Set<String> {
        val rules = getPermissionRulesForRole(role)
        return rules.map { it.toAuthorityString() }.toSet()
    }
    
    /**
     * Get permission rules for multiple roles.
     * Combines permissions from all roles (union).
     * 
     * @param roles Collection of roles
     * @return Combined list of permission rules
     */
    fun getPermissionRulesForRoles(roles: Collection<Role>): List<PermissionRule> {
        return roles.flatMap { role ->
            getPermissionRulesForRole(role)
        }.distinct()
    }
    
    /**
     * Get Spring Security authority strings for multiple roles.
     * 
     * @param roles Collection of roles
     * @return Combined set of authority strings
     */
    fun getAuthoritiesForRoles(roles: Collection<Role>): Set<String> {
        return roles.flatMap { role ->
            getAuthoritiesForRole(role)
        }.toSet()
    }
    
    /**
     * Check if a role has a specific permission.
     * 
     * @param role The role to check
     * @param permissionString The permission string to check for
     * @return true if the role has the permission
     */
    fun roleHasPermission(role: Role, permissionString: String): Boolean {
        val rules = getPermissionRulesForRole(role)
        return rules.any { rule -> rule.matches(permissionString) }
    }
    
    /**
     * Load custom permission mappings from a template.
     * This allows for industry-specific or organization-specific permission configurations.
     * 
     * @param template Map of role names to permission strings
     * @return Map of Roles to PermissionRules
     */
    fun loadFromTemplate(template: Map<String, List<String>>): Map<Role, List<PermissionRule>> {
        return template.mapNotNull { (roleName, permissionStrings) ->
            try {
                val role = Role.valueOf(roleName.uppercase())
                val rules = permissionStrings.mapNotNull { permStr ->
                    PermissionRule.fromString(permStr)
                }
                role to rules
            } catch (e: IllegalArgumentException) {
                // Skip invalid role names
                null
            }
        }.toMap()
    }
}