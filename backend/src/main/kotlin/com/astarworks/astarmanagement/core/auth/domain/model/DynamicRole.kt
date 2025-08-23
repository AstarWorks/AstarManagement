package com.astarworks.astarmanagement.core.auth.domain.model

import java.time.LocalDateTime
import java.util.UUID

/**
 * Dynamic role domain entity (Discord-style role system).
 * Represents roles that can be dynamically created and assigned within a tenant.
 * No default roles - all roles are explicitly created and assigned.
 */
data class DynamicRole(
    val id: UUID = UUID.randomUUID(),
    val tenantId: UUID? = null,  // null = system-wide role
    val name: String,
    val displayName: String? = null,
    val color: String? = null,  // Hex color code (e.g., "#FF5733")
    val position: Int = 0,  // Display order (higher = higher priority)
    val isSystem: Boolean = false,  // System-defined roles cannot be deleted
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    init {
        require(name.isNotBlank()) {
            "Role name cannot be blank"
        }
        require(name.length <= 100) {
            "Role name cannot exceed 100 characters"
        }
        require(name.matches(Regex("^[a-z0-9_]+$"))) {
            "Role name can only contain lowercase letters, numbers, and underscores"
        }
        require(displayName?.length?.let { it <= 255 } ?: true) {
            "Display name cannot exceed 255 characters"
        }
        require(color?.matches(Regex("^#[0-9A-Fa-f]{6}$")) ?: true) {
            "Color must be a valid hex color code (e.g., #FF5733)"
        }
        require(position >= 0) {
            "Position must be non-negative"
        }
    }
    
    /**
     * Updates the role's display name.
     */
    fun updateDisplayName(newDisplayName: String?): DynamicRole {
        require(newDisplayName?.length?.let { it <= 255 } ?: true) {
            "Display name cannot exceed 255 characters"
        }
        
        return copy(
            displayName = newDisplayName,
            updatedAt = LocalDateTime.now()
        )
    }
    
    /**
     * Updates the role's color.
     */
    fun updateColor(newColor: String?): DynamicRole {
        require(newColor?.matches(Regex("^#[0-9A-Fa-f]{6}$")) ?: true) {
            "Color must be a valid hex color code (e.g., #FF5733)"
        }
        
        return copy(
            color = newColor,
            updatedAt = LocalDateTime.now()
        )
    }
    
    /**
     * Updates the role's position in the hierarchy.
     */
    fun updatePosition(newPosition: Int): DynamicRole {
        require(newPosition >= 0) {
            "Position must be non-negative"
        }
        
        return copy(
            position = newPosition,
            updatedAt = LocalDateTime.now()
        )
    }
    
    /**
     * Checks if this role is tenant-specific.
     */
    fun isTenantSpecific(): Boolean = tenantId != null
    
    /**
     * Checks if this role is system-wide.
     */
    fun isSystemWide(): Boolean = tenantId == null
    
    /**
     * Checks if this role can be deleted.
     * System roles cannot be deleted.
     */
    fun isDeletable(): Boolean = !isSystem
    
    /**
     * Checks if this role can be edited.
     * All roles can be edited, including system roles.
     */
    fun isEditable(): Boolean = true
    
    companion object {
        /**
         * Creates a tenant-specific role.
         */
        fun forTenant(
            tenantId: UUID,
            name: String,
            displayName: String? = null,
            color: String? = null,
            position: Int = 0
        ): DynamicRole {
            return DynamicRole(
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position,
                isSystem = false
            )
        }
        
        /**
         * Creates a system-wide role.
         */
        fun systemRole(
            name: String,
            displayName: String? = null,
            color: String? = null,
            position: Int = 0
        ): DynamicRole {
            return DynamicRole(
                tenantId = null,
                name = name,
                displayName = displayName,
                color = color,
                position = position,
                isSystem = true
            )
        }
    }
}