package com.astarworks.astarmanagement.core.user.domain.model

import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import java.time.Instant
import java.util.UUID

/**
 * User profile domain entity.
 * Stores display information for users (display name, avatar).
 * One-to-one relationship with User entity.
 */
data class UserProfile(
    val id: UserProfileId = UserProfileId(java.util.UUID.randomUUID()),
    val userId: UserId,
    val displayName: String? = null,
    val avatarUrl: String? = null,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
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
            updatedAt = Instant.now()
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
            updatedAt = Instant.now()
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
            updatedAt = Instant.now()
        )
    }
}