package com.astarworks.astarmanagement.core.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.infrastructure.persistence.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Spring Data JPA repository for UserEntity.
 * Simplified interface for business data queries.
 * No user provisioning or complex Auth0 synchronization.
 */
@Repository
interface JpaUserRepository : JpaRepository<UserEntity, UUID> {
    
    // Simple Auth0 reference lookup
    fun findByAuth0Sub(auth0Sub: String): UserEntity?
    
    // Email methods for legacy support
    fun findByEmail(email: String): UserEntity?
    
    fun existsByEmail(email: String): Boolean
    
    // Tenant-scoped method
    fun findByTenantId(tenantId: UUID): List<UserEntity>
    
    // Count method
    override fun count(): Long
}