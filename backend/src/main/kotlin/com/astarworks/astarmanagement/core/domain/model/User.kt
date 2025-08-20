package com.astarworks.astarmanagement.core.domain.model

import java.time.LocalDateTime
import java.util.*

/**
 * User domain entity with Auth0 reference support.
 * Auth0 manages user authentication and profiles.
 * This entity only maintains references for business data association.
 */
data class User(
    val id: UUID = UUID.randomUUID(),
    val auth0Sub: String? = null,  // Reference to Auth0 user, no provisioning
    val email: String,
    val name: String? = null,
    val passwordHash: String? = null,  // For legacy local auth support
    val profilePictureUrl: String? = null,  // Cached for display only
    val role: String = "USER",
    val tenantId: UUID? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    init {
        // Simple authentication check - must have one auth method
        require(
            !passwordHash.isNullOrBlank() || !auth0Sub.isNullOrBlank()
        ) {
            "User must have either password or Auth0 sub"
        }
        // No Auth0 sub format validation - Auth0 manages this
    }
    
    companion object {
        // Only keep local user creation for legacy support
        fun createLocalUser(
            email: String,
            passwordHash: String,
            name: String? = null,
            role: String = "USER"
        ): User {
            return User(
                email = email,
                passwordHash = passwordHash,
                name = name,
                role = role
            )
        }
        // No fromAuth0Claims - Auth0 manages user creation
    }
    
    // Simple profile update for local data only
    fun updateProfile(
        name: String? = null,
        profilePictureUrl: String? = null
    ): User {
        return this.copy(
            name = name ?: this.name,
            profilePictureUrl = profilePictureUrl ?: this.profilePictureUrl,
            updatedAt = LocalDateTime.now()
        )
    }
    // No syncAuth0Profile - no synchronization needed
    
    fun assignToTenant(tenantId: UUID): User {
        return this.copy(
            tenantId = tenantId,
            updatedAt = LocalDateTime.now()
        )
    }
    
    fun updateRole(role: String): User {
        return this.copy(
            role = role,
            updatedAt = LocalDateTime.now()
        )
    }
    
    fun isAuth0User(): Boolean = !auth0Sub.isNullOrBlank()
    
    fun isLocalUser(): Boolean = !passwordHash.isNullOrBlank()
}