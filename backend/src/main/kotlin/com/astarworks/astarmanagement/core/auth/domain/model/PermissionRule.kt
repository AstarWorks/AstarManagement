package com.astarworks.astarmanagement.core.auth.domain.model

import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * Permission rule that defines access control for resources.
 * Can be either a general rule (applying to all resources of a type with a scope)
 * or a specific rule (applying to a specific resource instance).
 */
@Serializable
sealed class PermissionRule {
    abstract val permission: Permission
    
    /**
     * Converts this permission rule to a Spring Security authority string.
     * Used for integration with @PreAuthorize annotations.
     * 
     * Format examples:
     * - GeneralRule: "table.view.all", "document.edit.team"
     * - SpecificRule: "table.edit.uuid:123e4567-e89b-12d3-a456-426614174000"
     */
    abstract fun toAuthorityString(): String
    
    /**
     * Checks if this rule matches the requested permission string.
     * Supports exact matching and wildcard matching for MANAGE permission.
     */
    abstract fun matches(requestedPermission: String): Boolean
    
    /**
     * General permission rule that applies to all resources of a type within a scope.
     * Example: "All team members can view all documents in their team"
     */
    @Serializable
    data class GeneralRule(
        override val permission: Permission,
        val scope: Scope,
        val resourceType: ResourceType
    ) : PermissionRule() {
        
        override fun toAuthorityString(): String {
            val resource = resourceType.name.lowercase()
            val perm = permission.name.lowercase()
            val scopeStr = scope.name.lowercase()
            return "$resource.$perm.$scopeStr"
        }
        
        override fun matches(requestedPermission: String): Boolean {
            // Exact match
            if (toAuthorityString() == requestedPermission) return true
            
            // MANAGE permission matches all actions for the resource type
            if (permission == Permission.MANAGE) {
                val resourcePrefix = "${resourceType.name.lowercase()}."
                return requestedPermission.startsWith(resourcePrefix)
            }
            
            return false
        }
    }
    
    /**
     * Specific permission rule that applies to a single resource instance.
     * Example: "User X can edit document with UUID Y"
     */
    @Serializable
    data class SpecificRule(
        override val permission: Permission,
        val resourceReference: ResourceReference
    ) : PermissionRule() {
        
        override fun toAuthorityString(): String {
            val resource = resourceReference.type.name.lowercase()
            val perm = permission.name.lowercase()
            return "$resource.$perm.uuid:${resourceReference.id}"
        }
        
        override fun matches(requestedPermission: String): Boolean {
            // Only exact match for specific rules
            return toAuthorityString() == requestedPermission
        }
    }
    
    companion object {
        /**
         * Parses a permission string into a PermissionRule.
         * 
         * Format:
         * - "resource.permission.scope" -> GeneralRule
         * - "resource.permission.uuid:id" -> SpecificRule
         * 
         * @param authorityString The permission string to parse
         * @return The parsed PermissionRule, or null if parsing fails
         */
        fun fromString(authorityString: String): PermissionRule? {
            val parts = authorityString.split(".")
            if (parts.size != 3) return null
            
            val resourceTypeStr = parts[0].uppercase()
            val permissionStr = parts[1].uppercase()
            val scopeOrId = parts[2]
            
            // Find matching enums
            val resourceType = try {
                ResourceType.valueOf(resourceTypeStr)
            } catch (e: IllegalArgumentException) {
                return null
            }
            
            val permission = try {
                Permission.valueOf(permissionStr)
            } catch (e: IllegalArgumentException) {
                return null
            }
            
            return if (scopeOrId.startsWith("uuid:")) {
                // Parse as SpecificRule
                val uuidStr = scopeOrId.substring(5)
                val uuid = try {
                    UUID.fromString(uuidStr)
                } catch (e: IllegalArgumentException) {
                    return null
                }
                
                SpecificRule(
                    permission = permission,
                    resourceReference = ResourceReference(
                        type = resourceType,
                        id = uuid
                    )
                )
            } else {
                // Parse as GeneralRule
                val scope = try {
                    Scope.valueOf(scopeOrId.uppercase())
                } catch (e: IllegalArgumentException) {
                    return null
                }
                
                GeneralRule(
                    permission = permission,
                    scope = scope,
                    resourceType = resourceType
                )
            }
        }
    }
}