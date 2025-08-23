package com.astarworks.astarmanagement.core.tenant.api.controller

import com.astarworks.astarmanagement.core.tenant.api.dto.CreateTenantRequest
import com.astarworks.astarmanagement.core.tenant.api.dto.TenantResponse
import com.astarworks.astarmanagement.core.tenant.api.dto.UpdateTenantRequest
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllTenants(): ResponseEntity<List<TenantResponse>> {
        logger.info("Getting all tenants")
        val tenants = tenantService.findAllTenants()
        val responses = tenants.map { TenantResponse.from(it) }
        return ResponseEntity.ok(responses)
    }
    
    /**
     * Get all active tenants (admin only).
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    fun getActiveTenants(): ResponseEntity<List<TenantResponse>> {
        logger.info("Getting active tenants")
        val tenants = tenantService.findActiveTenants()
        val responses = tenants.map { TenantResponse.from(it) }
        return ResponseEntity.ok(responses)
    }
    
    /**
     * Get current tenant information.
     * Returns the tenant associated with the current user's JWT token.
     */
    @GetMapping("/current")
    fun getCurrentTenant(): ResponseEntity<TenantResponse> {
        val tenantId = tenantContextService.getTenantContext()
        
        if (tenantId == null) {
            logger.warn("No tenant context found for current user")
            return ResponseEntity.notFound().build()
        }
        
        val tenant = tenantService.findById(tenantId)
        
        return if (tenant != null) {
            ResponseEntity.ok(TenantResponse.from(tenant))
        } else {
            logger.error("Tenant not found for ID in context: $tenantId")
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Get tenant by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.tenantId")
    fun getTenantById(@PathVariable id: UUID): ResponseEntity<TenantResponse> {
        logger.info("Getting tenant by ID: $id")
        
        val tenant = tenantService.findById(id)
        return if (tenant != null) {
            ResponseEntity.ok(TenantResponse.from(tenant))
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Get tenant by slug.
     */
    @GetMapping("/slug/{slug}")
    fun getTenantBySlug(@PathVariable slug: String): ResponseEntity<TenantResponse> {
        logger.info("Getting tenant by slug: $slug")
        
        val tenant = tenantService.findBySlug(slug)
        return if (tenant != null) {
            ResponseEntity.ok(TenantResponse.from(tenant))
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Create a new tenant (admin only).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun createTenant(
        @Valid @RequestBody request: CreateTenantRequest
    ): ResponseEntity<TenantResponse> {
        logger.info("Creating tenant with slug: ${request.slug}")
        
        return try {
            val tenant = tenantService.createTenant(
                slug = request.slug,
                name = request.name,
                auth0OrgId = request.auth0OrgId
            )
            ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant))
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to create tenant: ${e.message}")
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Update tenant information.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.tenantId")
    fun updateTenant(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTenantRequest
    ): ResponseEntity<TenantResponse> {
        logger.info("Updating tenant $id")
        
        return try {
            val tenant = tenantService.updateTenantName(id, request.name)
            ResponseEntity.ok(TenantResponse.from(tenant))
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to update tenant: ${e.message}")
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Link tenant with Auth0 Organization (admin only).
     */
    @PostMapping("/{id}/link-auth0")
    @PreAuthorize("hasRole('ADMIN')")
    fun linkAuth0Organization(
        @PathVariable id: UUID,
        @RequestParam auth0OrgId: String
    ): ResponseEntity<TenantResponse> {
        logger.info("Linking tenant $id with Auth0 org: $auth0OrgId")
        
        return try {
            val tenant = tenantService.linkAuth0Organization(id, auth0OrgId)
            ResponseEntity.ok(TenantResponse.from(tenant))
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to link Auth0 organization: ${e.message}")
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Deactivate a tenant (admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deactivateTenant(@PathVariable id: UUID): ResponseEntity<TenantResponse> {
        logger.info("Deactivating tenant: $id")
        
        return try {
            val tenant = tenantService.deactivateTenant(id)
            ResponseEntity.ok(TenantResponse.from(tenant))
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to deactivate tenant: ${e.message}")
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Activate a tenant (admin only).
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    fun activateTenant(@PathVariable id: UUID): ResponseEntity<TenantResponse> {
        logger.info("Activating tenant: $id")
        
        return try {
            val tenant = tenantService.activateTenant(id)
            ResponseEntity.ok(TenantResponse.from(tenant))
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to activate tenant: ${e.message}")
            ResponseEntity.notFound().build()
        }
    }
}