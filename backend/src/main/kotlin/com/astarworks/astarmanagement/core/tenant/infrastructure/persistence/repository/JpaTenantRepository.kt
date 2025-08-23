package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantTable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Spring Data JPA repository interface for TenantEntity.
 * Provides database access methods for tenant entities.
 */
@Repository
interface JpaTenantRepository : JpaRepository<TenantTable, UUID> {
    
    /**
     * Finds a tenant entity by its slug.
     */
    fun findBySlug(slug: String): TenantTable?
    
    /**
     * Finds a tenant entity by its Auth0 Organization ID.
     */
    fun findByAuth0OrgId(auth0OrgId: String): TenantTable?
    
    /**
     * Finds all active tenant entities.
     */
    fun findByIsActiveTrue(): List<TenantTable>
    
    /**
     * Checks if a tenant with the given slug exists.
     */
    fun existsBySlug(slug: String): Boolean
    
    /**
     * Checks if a tenant with the given Auth0 Organization ID exists.
     */
    fun existsByAuth0OrgId(auth0OrgId: String): Boolean
}