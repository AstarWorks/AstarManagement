package com.astarworks.astarmanagement.shared.api.controller

import com.astarworks.astarmanagement.core.tenant.api.dto.CreateTenantRequest
import com.astarworks.astarmanagement.core.tenant.api.dto.TenantResponse
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * Test data management controller for development and testing.
 * Provides endpoints to manage test data without authentication.
 * 
 * WARNING: This controller is only enabled in development/test environments.
 * It bypasses all security checks and should NEVER be enabled in production.
 */
@RestController
@RequestMapping("/api/v1/test-data")
@Tag(name = "Test Data", description = "Test data management endpoints (Development only)")
class TestDataController(
    private val tenantService: TenantService
) {
    
    private val logger = LoggerFactory.getLogger(TestDataController::class.java)
    
    init {
        logger.warn("TestDataController is enabled - This should only be used in development/test environments!")
    }
    
    @PostMapping("/tenants")
    @Operation(summary = "Create a test tenant", description = "Creates a test tenant with predefined data")
    fun createTestTenant(
        @RequestBody request: CreateTenantRequest
    ): ResponseEntity<TenantResponse> {
        logger.info("Creating test tenant: ${request.slug}")
        
        val tenant = tenantService.create(
            slug = request.slug,
            name = request.name,
            auth0OrgId = request.auth0OrgId
        )
        
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant))
    }
    
    @PostMapping("/tenants/default")
    @Operation(summary = "Create default test tenant", description = "Creates a default test tenant for MockAuth")
    fun createDefaultTestTenant(): ResponseEntity<TenantResponse> {
        logger.info("Creating default test tenant")
        
        // Check if tenant already exists
        val existingTenant = tenantService.findByAuth0OrgId("test-tenant-123")
        if (existingTenant != null) {
            logger.info("Default test tenant already exists: ${existingTenant.id}")
            return ResponseEntity.ok(TenantResponse.from(existingTenant))
        }
        
        val tenant = tenantService.create(
            slug = "test-tenant",
            name = "Test Tenant",
            auth0OrgId = "test-tenant-123"
        )
        
        logger.info("Created default test tenant: ${tenant.id}")
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant))
    }
    
    @GetMapping("/tenants")
    @Operation(summary = "List all test tenants", description = "Returns all tenants in the database")
    fun listTestTenants(): ResponseEntity<List<TenantResponse>> {
        logger.info("Listing all test tenants")
        
        val tenants = tenantService.findAll()
        return ResponseEntity.ok(tenants.map { TenantResponse.from(it) })
    }
    
    @GetMapping("/tenants/{id}")
    @Operation(summary = "Get a test tenant by ID", description = "Returns a specific tenant by ID")
    fun getTestTenant(
        @PathVariable id: UUID
    ): ResponseEntity<TenantResponse> {
        logger.info("Getting test tenant: $id")
        
        val tenant = tenantService.findById(id)
            ?: return ResponseEntity.notFound().build()
        
        return ResponseEntity.ok(TenantResponse.from(tenant))
    }
    
    @DeleteMapping("/tenants/{id}")
    @Operation(summary = "Delete a test tenant", description = "Deletes a test tenant by ID")
    fun deleteTestTenant(
        @PathVariable id: UUID
    ): ResponseEntity<Void> {
        logger.info("Deleting test tenant: $id")
        
        return try {
            tenantService.deleteById(id)
            ResponseEntity.noContent().build()
        } catch (e: Exception) {
            logger.error("Failed to delete tenant: $id", e)
            ResponseEntity.notFound().build()
        }
    }
    
    @DeleteMapping("/tenants")
    @Operation(summary = "Delete all test tenants", description = "Deletes all tenants in the database")
    fun deleteAllTestTenants(): ResponseEntity<Map<String, Any>> {
        logger.warn("Deleting ALL test tenants")
        
        val tenants = tenantService.findAll()
        val deletedCount = tenants.size
        
        tenants.forEach { tenant ->
            try {
                tenantService.deleteById(tenant.id)
                logger.info("Deleted tenant: ${tenant.id}")
            } catch (e: Exception) {
                logger.error("Failed to delete tenant: ${tenant.id}", e)
            }
        }
        
        return ResponseEntity.ok(mapOf(
            "message" to "Deleted all test tenants",
            "count" to deletedCount
        ))
    }
    
    @PostMapping("/reset")
    @Operation(summary = "Reset test data", description = "Resets all test data to default state")
    fun resetTestData(): ResponseEntity<Map<String, Any>> {
        logger.warn("Resetting test data to default state")
        
        // Delete all existing tenants
        val existingTenants = tenantService.findAll()
        existingTenants.forEach { tenant ->
            try {
                tenantService.deleteById(tenant.id)
            } catch (e: Exception) {
                logger.error("Failed to delete tenant during reset: ${tenant.id}", e)
            }
        }
        
        // Create default test tenant
        val defaultTenant = tenantService.create(
            slug = "test-tenant",
            name = "Test Tenant",
            auth0OrgId = "test-tenant-123"
        )
        
        // Create additional test tenants
        val secondTenant = tenantService.create(
            slug = "second-tenant",
            name = "Second Test Tenant",
            auth0OrgId = "test-tenant-456"
        )
        
        logger.info("Test data reset complete")
        
        return ResponseEntity.ok(mapOf(
            "message" to "Test data reset complete",
            "deletedCount" to existingTenants.size,
            "createdTenants" to listOf(
                TenantResponse.from(defaultTenant),
                TenantResponse.from(secondTenant)
            )
        ))
    }
    
    @GetMapping("/status")
    @Operation(summary = "Test data status", description = "Returns the current status of test data")
    fun getTestDataStatus(): ResponseEntity<Map<String, Any>> {
        val tenants = tenantService.findAll()
        val defaultTenantExists = tenants.any { it.auth0OrgId == "test-tenant-123" }
        
        return ResponseEntity.ok(mapOf(
            "enabled" to true,
            "environment" to "development",
            "tenantCount" to tenants.size,
            "defaultTenantExists" to defaultTenantExists,
            "tenants" to tenants.map { 
                mapOf(
                    "id" to it.id.toString(),
                    "slug" to it.slug,
                    "auth0OrgId" to it.auth0OrgId
                )
            }
        ))
    }
}