package com.astarworks.astarmanagement.core.domain.repository

import com.astarworks.astarmanagement.core.domain.model.User
import java.util.*

/**
 * User repository interface for domain layer.
 * Simplified interface focusing on business data operations.
 * Auth0 manages user provisioning and synchronization.
 */
interface UserRepository {
    
    fun save(user: User): User
    
    fun findById(id: UUID): User?
    
    // Simple Auth0 reference lookup - no provisioning
    fun findByAuth0Sub(auth0Sub: String): User?
    
    // Email-based methods for legacy support
    fun findByEmail(email: String): User?
    
    fun existsByEmail(email: String): Boolean
    
    // Tenant-scoped method
    fun findByTenantId(tenantId: UUID): List<User>
    
    // General methods
    fun deleteById(id: UUID)
    
    fun findAll(): List<User>
    
    fun count(): Long
}