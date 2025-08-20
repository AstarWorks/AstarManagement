package com.astarworks.astarmanagement.core.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.infrastructure.persistence.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Spring Data JPA repository for UserEntity.
 * Provides database access methods for users with Auth0 and local authentication support.
 */
@Repository
interface JpaUserRepository : JpaRepository<UserEntity, UUID> {
    
    // Auth0 methods
    fun findByAuth0Sub(auth0Sub: String): UserEntity?
    
    @Query("SELECT u FROM UserEntity u WHERE u.auth0Sub = :auth0Sub")
    fun findByAuth0SubBypassingRLS(@Param("auth0Sub") auth0Sub: String): UserEntity?
    
    fun existsByAuth0Sub(auth0Sub: String): Boolean
    
    // Email methods
    fun findByEmail(email: String): UserEntity?
    
    fun existsByEmail(email: String): Boolean
    
    // Tenant-scoped methods
    fun findByEmailAndTenantId(email: String, tenantId: UUID): UserEntity?
    
    fun findByTenantId(tenantId: UUID): List<UserEntity>
    
    // Count method
    override fun count(): Long
}