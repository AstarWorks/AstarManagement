package com.astarworks.astarmanagement.core.user.domain.repository

import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.shared.domain.value.UserId
import java.util.UUID

/**
 * User repository interface for domain layer.
 * Handles Auth0-based user persistence.
 * Users can belong to multiple tenants (handled via tenant_users table).
 */
interface UserRepository {
    
    fun save(user: User): User
    
    fun findById(id: UserId): User?
    
    /**
     * Find user by Auth0 subject identifier.
     */
    fun findByAuth0Sub(auth0Sub: String): User?
    
    /**
     * Find user by email address.
     * Note: Email is not unique across tenants.
     */
    fun findByEmail(email: String): User?
    
    fun existsByEmail(email: String): Boolean
    
    fun existsByAuth0Sub(auth0Sub: String): Boolean
    
    // General methods
    fun deleteById(id: UserId)
    
    fun findAll(): List<User>
    
    fun count(): Long
}