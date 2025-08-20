package com.astarworks.astarmanagement.core.domain.repository

import com.astarworks.astarmanagement.core.domain.model.User
import java.util.*

/**
 * User repository interface for domain layer.
 * Defines operations for user persistence supporting both Auth0 and local authentication.
 */
interface UserRepository {
    
    fun save(user: User): User
    
    fun findById(id: UUID): User?
    
    // Auth0 support methods
    fun findByAuth0Sub(auth0Sub: String): User?
    
    fun findByAuth0SubBypassingRLS(auth0Sub: String): User?
    
    fun existsByAuth0Sub(auth0Sub: String): Boolean
    
    // Email-based methods
    fun findByEmail(email: String): User?
    
    fun existsByEmail(email: String): Boolean
    
    // Tenant-scoped methods for multi-tenancy
    fun findByEmailAndTenantId(email: String, tenantId: UUID): User?
    
    fun findByTenantId(tenantId: UUID): List<User>
    
    // General methods
    fun deleteById(id: UUID)
    
    fun findAll(): List<User>
    
    fun count(): Long
}