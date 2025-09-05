package com.astarworks.astarmanagement.core.tenant.api.controller
import org.springframework.web.server.ResponseStatusException

import com.astarworks.astarmanagement.core.tenant.api.dto.CreateTenantRequest
import com.astarworks.astarmanagement.core.tenant.api.dto.TenantResponse
import com.astarworks.astarmanagement.core.tenant.api.dto.UpdateTenantRequest
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST API controller for tenant management.
 * Provides endpoints for creating, reading, updating, and deactivating tenants.
 */
@RestController
@RequestMapping("/api/v1/tenants")
class TenantController(
    private val tenantService: TenantService,
    private val tenantContextService: TenantContextService
) {
    private val logger = LoggerFactory.getLogger(TenantController::class.java)
    
    /**
     * Get all tenants (admin only).
     */
    @GetMapping
    @PreAuthorize("hasPermissionRule('tenant.view.all')")
    fun getAllTenants(): List<TenantResponse> {
        logger.info("Getting all tenants")
        val tenants = tenantService.findAllTenants()
        val responses = tenants.map { TenantResponse.from(it) }
        return responses
    }
    
    /**
     * Get all active tenants (admin only).
     */
    @GetMapping("/active")
    @PreAuthorize("hasPermissionRule('tenant.view.all')")
    fun getActiveTenants(): List<TenantResponse> {
        logger.info("Getting active tenants")
        val tenants = tenantService.findActiveTenants()
        val responses = tenants.map { TenantResponse.from(it) }
        return responses
    }
    
    /**
     * Get current tenant information.
     * Returns the tenant associated with the current user's JWT token.
     */
    @GetMapping("/current")
    fun getCurrentTenant(): TenantResponse {
        val tenantId = tenantContextService.getTenantContext()
        
        if (tenantId == null) {
            logger.warn("No tenant context found for current user")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        
        val tenant = tenantService.findById(TenantId(tenantId))
        
        return if (tenant != null) {
            TenantResponse.from(tenant)
        } else {
            logger.error("Tenant not found for ID in context: $tenantId")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }
    
    /**
     * Get tenant by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermissionRule('tenant.view.all') and canAccessResource(#id, 'tenant', 'view')")
    fun getTenantById(@PathVariable id: UUID): TenantResponse {
        logger.info("Getting tenant by ID: $id")
        
        val tenant = tenantService.findById(TenantId(id))
        return if (tenant != null) {
            TenantResponse.from(tenant)
        } else {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }
    
    /**
     * Get tenant by slug.
     */
    @GetMapping("/slug/{slug}")
    fun getTenantBySlug(@PathVariable slug: String): TenantResponse {
        logger.info("Getting tenant by slug: $slug")
        
        val tenant = tenantService.findBySlug(slug)
        return if (tenant != null) {
            TenantResponse.from(tenant)
        } else {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }
    
    /**
     * Create a new tenant (admin only).
     */
    @PostMapping
    @PreAuthorize("hasPermissionRule('tenant.create.all')")
    fun createTenant(
        @Valid @RequestBody request: CreateTenantRequest
    ): TenantResponse {
        logger.info("Creating tenant with slug: ${request.slug}")
        
        return try {
            val tenant = tenantService.createTenant(
                slug = request.slug,
                name = request.name,
                auth0OrgId = request.auth0OrgId
            )
            TenantResponse.from(tenant)
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to create tenant: ${e.message}")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST)
        }
    }
    
    /**
     * Update tenant information.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermissionRule('tenant.edit.all') and canAccessResource(#id, 'tenant', 'edit')")
    fun updateTenant(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTenantRequest
    ): TenantResponse {
        logger.info("Updating tenant $id")
        
        return try {
            val tenant = tenantService.updateTenantName(TenantId(id), request.name)
            TenantResponse.from(tenant)
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to update tenant: ${e.message}")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }
    
    /**
     * Link tenant with Auth0 Organization (admin only).
     */
    @PostMapping("/{id}/link-auth0")
    @PreAuthorize("hasPermissionRule('tenant.edit.all')")
    fun linkAuth0Organization(
        @PathVariable id: UUID,
        @RequestParam auth0OrgId: String
    ): TenantResponse {
        logger.info("Linking tenant $id with Auth0 org: $auth0OrgId")
        
        return try {
            val tenant = tenantService.linkAuth0Organization(TenantId(id), auth0OrgId)
            TenantResponse.from(tenant)
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to link Auth0 organization: ${e.message}")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST)
        }
    }
    
    /**
     * Deactivate a tenant (admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermissionRule('tenant.delete.all')")
    fun deactivateTenant(@PathVariable id: UUID): TenantResponse {
        logger.info("Deactivating tenant: $id")
        
        return try {
            val tenant = tenantService.deactivateTenant(TenantId(id))
            TenantResponse.from(tenant)
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to deactivate tenant: ${e.message}")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }
    
    /**
     * Activate a tenant (admin only).
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasPermissionRule('tenant.edit.all')")
    fun activateTenant(@PathVariable id: UUID): TenantResponse {
        logger.info("Activating tenant: $id")
        
        return try {
            val tenant = tenantService.activateTenant(TenantId(id))
            TenantResponse.from(tenant)
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to activate tenant: ${e.message}")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }
}