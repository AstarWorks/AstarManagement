package com.astarworks.astarmanagement.core.user.domain.model

import java.time.LocalDateTime
import java.util.UUID

/**
 * User profile domain entity.
 * Stores display information for users (display name, avatar).
 * One-to-one relationship with User entity.
 */
data class UserProfile(
    val id: UUID = UUID.randomUUID(),
    val userId: UUID,
    val displayName: String? = null,
    val avatarUrl: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    init {
        require(displayName?.isNotBlank() ?: true) {
            "Display name cannot be blank if provided"
        }
        require(displayName?.length?.let { it <= 255 } ?: true) {
            "Display name cannot exceed 255 characters"
        }
        require(avatarUrl?.isNotBlank() ?: true) {
            "Avatar URL cannot be blank if provided"
        }
    }
    
    /**
     * Updates the display name.
     */
    fun updateDisplayName(newDisplayName: String?): UserProfile {
        require(newDisplayName?.isNotBlank() ?: true) {
            "Display name cannot be blank if provided"
        }
        require(newDisplayName?.length?.let { it <= 255 } ?: true) {
            "Display name cannot exceed 255 characters"
        }
        
        return copy(
            displayName = newDisplayName,
            updatedAt = LocalDateTime.now()
        )
    }
    
    /**
     * Updates the avatar URL.
     */
    fun updateAvatarUrl(newAvatarUrl: String?): UserProfile {
        require(newAvatarUrl?.isNotBlank() ?: true) {
            "Avatar URL cannot be blank if provided"
        }
        
        return copy(
            avatarUrl = newAvatarUrl,
            updatedAt = LocalDateTime.now()
        )
    }
    
    /**
     * Updates both display name and avatar URL.
     */
    fun updateProfile(newDisplayName: String?, newAvatarUrl: String?): UserProfile {
        require(newDisplayName?.isNotBlank() ?: true) {
            "Display name cannot be blank if provided"
        }
        require(newDisplayName?.length?.let { it <= 255 } ?: true) {
            "Display name cannot exceed 255 characters"
        }
        require(newAvatarUrl?.isNotBlank() ?: true) {
            "Avatar URL cannot be blank if provided"
        }
        
        return copy(
            displayName = newDisplayName,
            avatarUrl = newAvatarUrl,
            updatedAt = LocalDateTime.now()
        )
    }
}