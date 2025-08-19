package com.astarworks.astarmanagement.core.domain.model

import java.time.LocalDateTime
import java.util.*

/**
 * User domain entity for Auth0 integration.
 * Represents a user in the system with minimal required fields.
 */
data class User(
    val id: UUID = UUID.randomUUID(),
    val auth0Id: String,
    val email: String,
    val name: String? = null,
    val tenantId: UUID? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    
    companion object {
        fun fromAuth0Claims(
            auth0Id: String,
            email: String,
            name: String? = null
        ): User {
            return User(
                auth0Id = auth0Id,
                email = email,
                name = name
            )
        }
    }
    
    fun updateProfile(name: String): User {
        return this.copy(
            name = name,
            updatedAt = LocalDateTime.now()
        )
    }
    
    fun assignToTenant(tenantId: UUID): User {
        return this.copy(
            tenantId = tenantId,
            updatedAt = LocalDateTime.now()
        )
    }
}