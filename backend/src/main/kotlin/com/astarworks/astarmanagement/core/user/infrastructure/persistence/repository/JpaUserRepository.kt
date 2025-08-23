package com.astarworks.astarmanagement.core.user.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Spring Data JPA repository for UserTable.
 * Handles Auth0-based user queries.
 */
@Repository
interface JpaUserRepository : JpaRepository<UserTable, UUID> {
    
    /**
     * Find user by Auth0 subject identifier.
     */
    fun findByAuth0Sub(auth0Sub: String): UserTable?
    
    /**
     * Find user by email address.
     * Note: Email is not unique across tenants.
     */
    fun findByEmail(email: String): UserTable?
    
    /**
     * Check if a user with the given email exists.
     */
    fun existsByEmail(email: String): Boolean
    
    /**
     * Check if a user with the given Auth0 sub exists.
     */
    fun existsByAuth0Sub(auth0Sub: String): Boolean
}