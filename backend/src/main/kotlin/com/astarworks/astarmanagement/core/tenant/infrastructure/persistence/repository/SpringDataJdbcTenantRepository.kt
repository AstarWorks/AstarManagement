package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.SpringDataJdbcTenantTable
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for tenant operations.
 * Provides automatic CRUD operations with custom query methods.
 */
@Repository
interface SpringDataJdbcTenantRepository : CrudRepository<SpringDataJdbcTenantTable, TenantId> {
    
    /**
     * Finds a tenant by its unique slug.
     */
    @Query("SELECT * FROM tenants WHERE slug = :slug")
    fun findBySlug(@Param("slug") slug: String): SpringDataJdbcTenantTable?
    
    /**
     * Finds a tenant by its Auth0 Organization ID.
     */
    @Query("SELECT * FROM tenants WHERE auth0_org_id = :auth0OrgId")
    fun findByAuth0OrgId(@Param("auth0OrgId") auth0OrgId: String): SpringDataJdbcTenantTable?
    
    /**
     * Finds all active tenants ordered by creation date.
     */
    @Query("SELECT * FROM tenants WHERE is_active = true ORDER BY created_at")
    fun findByIsActiveTrue(): List<SpringDataJdbcTenantTable>
    
    /**
     * Finds all tenants ordered by creation date.
     */
    @Query("SELECT * FROM tenants ORDER BY created_at")
    override fun findAll(): List<SpringDataJdbcTenantTable>
    
    /**
     * Checks if a tenant with the given slug exists.
     */
    @Query("SELECT COUNT(*) > 0 FROM tenants WHERE slug = :slug")
    fun existsBySlug(@Param("slug") slug: String): Boolean
    
    /**
     * Checks if a tenant with the given Auth0 Organization ID exists.
     */
    @Query("SELECT COUNT(*) > 0 FROM tenants WHERE auth0_org_id = :auth0OrgId")
    fun existsByAuth0OrgId(@Param("auth0OrgId") auth0OrgId: String): Boolean
}