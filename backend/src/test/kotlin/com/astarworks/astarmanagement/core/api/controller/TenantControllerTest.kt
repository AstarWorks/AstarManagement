package com.astarworks.astarmanagement.core.api.controller

import com.astarworks.astarmanagement.core.tenant.api.dto.CreateTenantRequest
import com.astarworks.astarmanagement.core.tenant.api.dto.UpdateTenantRequest
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.infrastructure.security.TenantContextService
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.LocalDateTime
import java.util.UUID

/**
 * Integration tests for TenantController.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TenantControllerTest {
    
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Autowired
    private lateinit var objectMapper: ObjectMapper
    
    @MockBean
    private lateinit var tenantService: TenantService
    
    @MockBean
    private lateinit var tenantContextService: TenantContextService
    
    private lateinit var testTenant: Tenant
    private lateinit var testTenantId: UUID
    
    @BeforeEach
    fun setup() {
        testTenantId = UUID.randomUUID()
        testTenant = Tenant(
            id = testTenantId,
            slug = "test-tenant",
            name = "Test Tenant",
            auth0OrgId = "org_test123",
            isActive = true,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun `should get all tenants when admin`() {
        `when`(tenantService.findAllTenants()).thenReturn(listOf(testTenant))
        
        mockMvc.perform(get("/api/v1/tenants"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(testTenantId.toString()))
            .andExpect(jsonPath("$[0].slug").value("test-tenant"))
            .andExpect(jsonPath("$[0].name").value("Test Tenant"))
    }
    
    @Test
    @WithMockUser(roles = ["USER"])
    fun `should return 403 when non-admin tries to get all tenants`() {
        mockMvc.perform(get("/api/v1/tenants"))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @WithMockUser
    fun `should get current tenant`() {
        `when`(tenantContextService.getTenantContext()).thenReturn(testTenantId)
        `when`(tenantService.findById(testTenantId)).thenReturn(testTenant)
        
        mockMvc.perform(get("/api/v1/tenants/current"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(testTenantId.toString()))
            .andExpect(jsonPath("$.slug").value("test-tenant"))
    }
    
    @Test
    @WithMockUser
    fun `should return 404 when no tenant context`() {
        `when`(tenantContextService.getTenantContext()).thenReturn(null)
        
        mockMvc.perform(get("/api/v1/tenants/current"))
            .andExpect(status().isNotFound)
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun `should create tenant when admin`() {
        val request = CreateTenantRequest(
            slug = "new-tenant",
            name = "New Tenant",
            auth0OrgId = "org_new123"
        )
        
        val newTenant = Tenant(
            id = UUID.randomUUID(),
            slug = request.slug,
            name = request.name,
            auth0OrgId = request.auth0OrgId
        )
        
        `when`(tenantService.createTenant(request.slug, request.name, request.auth0OrgId))
            .thenReturn(newTenant)
        
        mockMvc.perform(
            post("/api/v1/tenants")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.slug").value("new-tenant"))
            .andExpect(jsonPath("$.name").value("New Tenant"))
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun `should return 400 when creating tenant with invalid slug`() {
        val request = CreateTenantRequest(
            slug = "Invalid Slug!", // Invalid: contains uppercase and special char
            name = "Test Tenant",
            auth0OrgId = null
        )
        
        mockMvc.perform(
            post("/api/v1/tenants")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isBadRequest)
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun `should update tenant name`() {
        val request = UpdateTenantRequest(name = "Updated Name")
        val updatedTenant = testTenant.updateName(request.name)
        
        `when`(tenantService.updateTenantName(testTenantId, request.name))
            .thenReturn(updatedTenant)
        
        mockMvc.perform(
            put("/api/v1/tenants/$testTenantId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value("Updated Name"))
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun `should deactivate tenant`() {
        val deactivatedTenant = testTenant.deactivate()
        
        `when`(tenantService.deactivateTenant(testTenantId))
            .thenReturn(deactivatedTenant)
        
        mockMvc.perform(delete("/api/v1/tenants/$testTenantId"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.isActive").value(false))
    }
    
    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun `should activate tenant`() {
        val inactiveTenant = testTenant.deactivate()
        val activatedTenant = inactiveTenant.activate()
        
        `when`(tenantService.activateTenant(testTenantId))
            .thenReturn(activatedTenant)
        
        mockMvc.perform(post("/api/v1/tenants/$testTenantId/activate"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.isActive").value(true))
    }
    
    @Test
    @WithMockUser
    fun `should get tenant by slug`() {
        `when`(tenantService.findBySlug("test-tenant"))
            .thenReturn(testTenant)
        
        mockMvc.perform(get("/api/v1/tenants/slug/test-tenant"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.slug").value("test-tenant"))
            .andExpect(jsonPath("$.name").value("Test Tenant"))
    }
    
    @Test
    @WithMockUser
    fun `should return 404 for non-existent slug`() {
        `when`(tenantService.findBySlug("non-existent"))
            .thenReturn(null)
        
        mockMvc.perform(get("/api/v1/tenants/slug/non-existent"))
            .andExpect(status().isNotFound)
    }
}