package com.astarworks.astarmanagement.core.tenant.domain.service

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Application service for tenant management.
 * Handles business logic for tenant operations and Auth0 integration.
 */
@Service
@Transactional
class TenantService(
    private val tenantRepository: TenantRepository
) {
    private val logger = LoggerFactory.getLogger(TenantService::class.java)
    
    /**
     * Creates a new tenant.
     * @param slug URL-friendly identifier
     * @param name Display name
     * @param auth0OrgId Optional Auth0 Organization ID
     * @return Created tenant
     * @throws IllegalArgumentException if slug already exists
     */
    fun createTenant(slug: String, name: String, auth0OrgId: String? = null): Tenant {
        logger.info("Creating tenant with slug: $slug")
        
        if (tenantRepository.existsBySlug(slug)) {
            throw IllegalArgumentException("Tenant with slug '$slug' already exists")
        }
        
        auth0OrgId?.let {
            if (tenantRepository.existsByAuth0OrgId(it)) {
                throw IllegalArgumentException("Tenant with Auth0 Organization ID '$it' already exists")
            }
        }
        
        val tenant = Tenant(
            slug = slug,
            name = name,
            auth0OrgId = auth0OrgId
        )
        
        val savedTenant = tenantRepository.save(tenant)
        logger.info("Created tenant with ID: ${savedTenant.id}")
        
        return savedTenant
    }
    
    /**
     * Finds a tenant by ID.
     * @param id Tenant ID
     * @return Tenant if found
     */
    @Transactional(readOnly = true)
    fun findById(id: TenantId): Tenant? {
        return tenantRepository.findById(id)
    }
    
    /**
     * Finds a tenant by slug.
     * @param slug Tenant slug
     * @return Tenant if found
     */
    @Transactional(readOnly = true)
    fun findBySlug(slug: String): Tenant? {
        return tenantRepository.findBySlug(slug)
    }
    
    /**
     * Finds a tenant by Auth0 Organization ID.
     * @param auth0OrgId Auth0 Organization ID
     * @return Tenant if found
     */
    @Transactional(readOnly = true)
    fun findByAuth0OrgId(auth0OrgId: String): Tenant? {
        return tenantRepository.findByAuth0OrgId(auth0OrgId)
    }
    
    /**
     * Finds or creates a tenant by Auth0 Organization ID.
     * Used for JIT (Just-In-Time) provisioning when users log in from Auth0.
     * @param auth0OrgId Auth0 Organization ID
     * @param slug Slug to use if creating new tenant
     * @param name Name to use if creating new tenant
     * @return Existing or newly created tenant
     */
    fun findOrCreateByAuth0OrgId(auth0OrgId: String, slug: String, name: String): Tenant {
        logger.info("Finding or creating tenant for Auth0 org: $auth0OrgId")
        
        val existingTenant = findByAuth0OrgId(auth0OrgId)
        if (existingTenant != null) {
            logger.debug("Found existing tenant: ${existingTenant.id}")
            return existingTenant
        }
        
        logger.info("Creating new tenant for Auth0 org: $auth0OrgId")
        return createTenant(slug, name, auth0OrgId)
    }
    
    /**
     * Updates a tenant's name.
     * @param id Tenant ID
     * @param name New name
     * @return Updated tenant
     * @throws IllegalArgumentException if tenant not found
     */
    fun updateTenantName(id: TenantId, name: String): Tenant {
        logger.info("Updating tenant $id name to: $name")
        
        val tenant = tenantRepository.findById(id)
            ?: throw IllegalArgumentException("Tenant not found: $id")
        
        val updatedTenant = tenant.updateName(name)
        return tenantRepository.save(updatedTenant)
    }
    
    /**
     * Links a tenant with an Auth0 Organization.
     * @param id Tenant ID
     * @param auth0OrgId Auth0 Organization ID
     * @return Updated tenant
     * @throws IllegalArgumentException if tenant not found or Auth0 org already linked
     */
    fun linkAuth0Organization(id: TenantId, auth0OrgId: String): Tenant {
        logger.info("Linking tenant $id with Auth0 org: $auth0OrgId")
        
        val tenant = tenantRepository.findById(id)
            ?: throw IllegalArgumentException("Tenant not found: $id")
        
        if (tenant.auth0OrgId != null) {
            throw IllegalArgumentException("Tenant already linked to Auth0 org: ${tenant.auth0OrgId}")
        }
        
        if (tenantRepository.existsByAuth0OrgId(auth0OrgId)) {
            throw IllegalArgumentException("Auth0 Organization ID already linked to another tenant")
        }
        
        val updatedTenant = tenant.linkAuth0Organization(auth0OrgId)
        return tenantRepository.save(updatedTenant)
    }
    
    /**
     * Deactivates a tenant.
     * @param id Tenant ID
     * @return Deactivated tenant
     * @throws IllegalArgumentException if tenant not found
     */
    fun deactivateTenant(id: TenantId): Tenant {
        logger.info("Deactivating tenant: $id")
        
        val tenant = tenantRepository.findById(id)
            ?: throw IllegalArgumentException("Tenant not found: $id")
        
        val deactivatedTenant = tenant.deactivate()
        return tenantRepository.save(deactivatedTenant)
    }
    
    /**
     * Activates a tenant.
     * @param id Tenant ID
     * @return Activated tenant
     * @throws IllegalArgumentException if tenant not found
     */
    fun activateTenant(id: TenantId): Tenant {
        logger.info("Activating tenant: $id")
        
        val tenant = tenantRepository.findById(id)
            ?: throw IllegalArgumentException("Tenant not found: $id")
        
        val activatedTenant = tenant.activate()
        return tenantRepository.save(activatedTenant)
    }
    
    /**
     * Gets all tenants.
     * @return List of all tenants
     */
    @Transactional(readOnly = true)
    fun findAllTenants(): List<Tenant> {
        return tenantRepository.findAll()
    }
    
    /**
     * Gets all active tenants.
     * @return List of active tenants
     */
    @Transactional(readOnly = true)
    fun findActiveTenants(): List<Tenant> {
        return tenantRepository.findAllActive()
    }
    
    /**
     * Creates a new tenant (simplified version for test data).
     * @param slug URL-friendly identifier
     * @param name Display name
     * @param auth0OrgId Optional Auth0 Organization ID
     * @return Created tenant
     */
    fun create(slug: String, name: String, auth0OrgId: String? = null): Tenant {
        return createTenant(slug, name, auth0OrgId)
    }
    
    /**
     * Gets all tenants (simplified version for test data).
     * @return List of all tenants
     */
    @Transactional(readOnly = true)
    fun findAll(): List<Tenant> {
        return findAllTenants()
    }
    
    /**
     * Deletes a tenant by ID.
     * @param id Tenant ID
     * @throws IllegalArgumentException if tenant not found
     */
    fun deleteById(id: TenantId) {
        logger.info("Deleting tenant: $id")
        
        val tenant = tenantRepository.findById(id)
            ?: throw IllegalArgumentException("Tenant not found: $id")
        
        // In a real application, you would check for dependencies
        // and ensure the tenant can be safely deleted
        tenantRepository.deleteById(id)
        logger.info("Deleted tenant: $id")
    }
}