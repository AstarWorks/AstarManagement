package com.astarworks.astarmanagement.core.user.domain.model

import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import java.time.Instant
import java.util.UUID

/**
 * User domain entity with Auth0-only authentication.
 * Represents a user that can belong to multiple tenants (Slack-style).
 * Profile information (name, avatar) is stored separately in user_profiles.
 */
data class User(
    val id: UserId = UserId(UUID.randomUUID()),
    val auth0Sub: String,  // Required - Auth0 is the only authentication method
    val email: String,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {
    init {
        require(auth0Sub.isNotBlank()) {
            "Auth0 sub is required"
        }
        require(email.isNotBlank()) {
            "Email is required"
        }
    }
    
    companion object {
        /**
         * Creates a new user from Auth0 authentication.
         */
        fun fromAuth0(
            auth0Sub: String,
            email: String
        ): User {
            return User(
                auth0Sub = auth0Sub,
                email = email
            )
        }
    }
    
    /**
     * Updates the user's email (rare operation).
     */
    fun updateEmail(newEmail: String): User {
        return this.copy(
            email = newEmail,
            updatedAt = Instant.now()
        )
    }
}