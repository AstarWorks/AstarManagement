package com.astarworks.astarmanagement.core.domain.model

import java.time.LocalDateTime
import java.util.*

/**
 * User domain entity for Auth0 and local authentication integration.
 * Supports both OAuth (Auth0) and local password authentication.
 */
data class User(
    val id: UUID = UUID.randomUUID(),
    val auth0Sub: String? = null,
    val email: String,
    val name: String? = null,
    val passwordHash: String? = null,
    val profilePictureUrl: String? = null,
    val lastAuth0SyncAt: LocalDateTime? = null,
    val role: String = "USER",
    val tenantId: UUID? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    init {
        // Ensure user has at least one authentication method
        require(
            !passwordHash.isNullOrBlank() || !auth0Sub.isNullOrBlank()
        ) {
            "User must have either password or Auth0 sub"
        }
        
        // Validate Auth0 sub format if present
        auth0Sub?.let {
            require(
                it.matches(Regex("^(auth0|google-oauth2|github|facebook|linkedin)\\|[a-zA-Z0-9._-]+\$"))
            ) {
                "Invalid Auth0 sub format"
            }
        }
    }
    
    companion object {
        fun fromAuth0Claims(
            auth0Sub: String,
            email: String,
            name: String? = null,
            profilePictureUrl: String? = null
        ): User {
            return User(
                auth0Sub = auth0Sub,
                email = email,
                name = name,
                profilePictureUrl = profilePictureUrl,
                lastAuth0SyncAt = LocalDateTime.now()
            )
        }
        
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
    }
    
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
    
    fun syncAuth0Profile(
        name: String? = null,
        profilePictureUrl: String? = null
    ): User {
        return this.copy(
            name = name ?: this.name,
            profilePictureUrl = profilePictureUrl ?: this.profilePictureUrl,
            lastAuth0SyncAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
    }
    
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