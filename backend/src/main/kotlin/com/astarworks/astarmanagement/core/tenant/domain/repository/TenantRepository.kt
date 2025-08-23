package com.astarworks.astarmanagement.core.tenant.domain.repository

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import java.util.UUID

/**
 * Tenant repository interface for domain layer.
 * Provides abstraction for tenant data persistence operations.
 */
interface TenantRepository {
    
    /**
     * Saves a tenant to the repository.
     * @param tenant The tenant to save
     * @return The saved tenant with any generated values
     */
    fun save(tenant: Tenant): Tenant
    
    /**
     * Finds a tenant by its ID.
     * @param id The tenant ID
     * @return The tenant if found, null otherwise
     */
    fun findById(id: UUID): Tenant?
    
    /**
     * Finds a tenant by its unique slug.
     * @param slug The tenant slug
     * @return The tenant if found, null otherwise
     */
    fun findBySlug(slug: String): Tenant?
    
    /**
     * Finds a tenant by its Auth0 Organization ID.
     * @param auth0OrgId The Auth0 Organization ID
     * @return The tenant if found, null otherwise
     */
    fun findByAuth0OrgId(auth0OrgId: String): Tenant?
    
    /**
     * Finds all tenants.
     * @return List of all tenants
     */
    fun findAll(): List<Tenant>
    
    /**
     * Finds all active tenants.
     * @return List of active tenants
     */
    fun findAllActive(): List<Tenant>
    
    /**
     * Checks if a tenant with the given slug exists.
     * @param slug The tenant slug to check
     * @return true if exists, false otherwise
     */
    fun existsBySlug(slug: String): Boolean
    
    /**
     * Checks if a tenant with the given Auth0 Organization ID exists.
     * @param auth0OrgId The Auth0 Organization ID to check
     * @return true if exists, false otherwise
     */
    fun existsByAuth0OrgId(auth0OrgId: String): Boolean
    
    /**
     * Deletes a tenant by its ID.
     * @param id The tenant ID
     */
    fun deleteById(id: UUID)
    
    /**
     * Counts the total number of tenants.
     * @return The total count
     */
    fun count(): Long
}