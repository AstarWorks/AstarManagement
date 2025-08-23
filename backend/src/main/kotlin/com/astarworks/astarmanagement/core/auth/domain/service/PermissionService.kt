package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.Permission
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.Role
import com.astarworks.astarmanagement.core.auth.domain.model.RolePermissionMapping
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Service for managing permissions and converting them to Spring Security authorities.
 * 
 * This service bridges the gap between our domain model (Roles and PermissionRules)
 * and Spring Security's GrantedAuthority system.
 * 
 * It supports both:
 * - Role-based authorization (ROLE_ADMIN, ROLE_USER, etc.)
 * - Permission-based authorization (table.view.all, document.edit.own, etc.)
 */
@Service
class PermissionService {
    
    /**
     * Converts a set of roles to Spring Security GrantedAuthorities.
     * 
     * This method generates two types of authorities:
     * 1. Role authorities (ROLE_XXX) for hasRole() checks
     * 2. Permission authorities (resource.action.scope) for hasAuthority() checks
     * 
     * @param roles Set of roles to convert
     * @return Set of GrantedAuthority objects for Spring Security
     */
    fun convertRolesToAuthorities(roles: Set<Role>): Set<GrantedAuthority> {
        val authorities = mutableSetOf<GrantedAuthority>()
        
        // Add role-based authorities (ROLE_ prefix is required by Spring Security)
        roles.forEach { role ->
            authorities.add(SimpleGrantedAuthority("ROLE_${role.name}"))
        }
        
        // Add permission-based authorities from role mappings
        val permissionRules = RolePermissionMapping.getPermissionRulesForRoles(roles)
        permissionRules.forEach { rule ->
            authorities.add(SimpleGrantedAuthority(rule.toAuthorityString()))
        }
        
        return authorities
    }
    
    /**
     * Converts custom permission rules to authorities for dynamic roles.
     * 
     * This is used when roles are loaded from templates or created dynamically.
     * 
     * @param roleName Name of the custom role
     * @param rules List of permission rules for this role
     * @return Set of GrantedAuthority objects
     */
    fun convertPermissionRulesToAuthorities(
        roleName: String,
        rules: List<PermissionRule>
    ): Set<GrantedAuthority> {
        val authorities = mutableSetOf<GrantedAuthority>()
        
        // Add the role authority
        authorities.add(SimpleGrantedAuthority("ROLE_${roleName.uppercase()}"))
        
        // Add permission authorities
        rules.forEach { rule ->
            authorities.add(SimpleGrantedAuthority(rule.toAuthorityString()))
        }
        
        return authorities
    }
    
    /**
     * Checks if a user has permission for a specific resource.
     * 
     * This method is used for fine-grained access control to specific resources.
     * 
     * @param userRules List of permission rules the user has
     * @param resourceId UUID of the resource to check access for
     * @param requiredPermission The permission required (VIEW, EDIT, DELETE, etc.)
     * @return true if the user has the required permission
     */
    fun hasPermissionForResource(
        userRules: List<PermissionRule>,
        resourceId: UUID,
        requiredPermission: Permission
    ): Boolean {
        return userRules.any { rule ->
            when (rule) {
                is PermissionRule.SpecificRule -> {
                    // Check if this rule applies to the specific resource
                    rule.resourceReference.id == resourceId &&
                    (rule.permission == requiredPermission || 
                     rule.permission == Permission.MANAGE)
                }
                is PermissionRule.GeneralRule -> {
                    // MANAGE permission on general rules grants access to all resources
                    rule.permission == Permission.MANAGE
                }
            }
        }
    }
    
    /**
     * Expands wildcard authorities if needed (for future use).
     * 
     * For example: "table.*" could expand to all table permissions.
     * Currently not used as we use explicit PermissionRules.
     * 
     * @param authority Authority string that might contain wildcards
     * @return Set of expanded authorities
     */
    fun expandAuthority(authority: String): Set<String> {
        // For now, return as-is. Can be extended for wildcard support.
        return setOf(authority)
    }
    
    /**
     * Validates if an authority string is well-formed.
     * 
     * Valid formats:
     * - ROLE_XXX (role authority)
     * - resource.action.scope (permission authority)
     * - resource.action.uuid:id (specific resource permission)
     * 
     * @param authority The authority string to validate
     * @return true if the authority is valid
     */
    fun isValidAuthority(authority: String): Boolean {
        // Check if it's a role authority
        if (authority.startsWith("ROLE_")) {
            return authority.length > 5 && !authority.substring(5).contains(".")
        }
        
        // Check if it's a permission authority
        val parts = authority.split(".")
        if (parts.size != 3) return false
        
        // Validate each part
        return parts.all { it.isNotBlank() }
    }
    
    /**
     * Merges authorities from multiple sources (roles, custom permissions, etc.).
     * 
     * @param authoritySets Variable number of authority sets to merge
     * @return Combined set of authorities with duplicates removed
     */
    fun mergeAuthorities(vararg authoritySets: Set<GrantedAuthority>): Set<GrantedAuthority> {
        return authoritySets.flatMap { it }.toSet()
    }
}