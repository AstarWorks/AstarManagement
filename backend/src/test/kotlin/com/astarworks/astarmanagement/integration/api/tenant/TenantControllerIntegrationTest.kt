package com.astarworks.astarmanagement.integration.api.tenant

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.util.*

/**
 * Integration tests for TenantController.
 * 
 * Tests the tenant management API endpoints including:
 * - Tenant creation and updates
 * - Auth0 organization integration
 * - Tenant retrieval (by ID, slug, current)
 * - Tenant deactivation and activation
 * - Authorization and access control
 * 
 * Follows the established test patterns:
 * - 3-phase setup (cleanup, cache clear, test data)
 * - @Nested classes for logical grouping
 * - JWT-based authentication testing
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Tenant Controller Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class TenantControllerIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var tenantMembershipRepository: TenantMembershipRepository
    
    @Autowired
    private lateinit var dynamicRoleRepository: DynamicRoleRepository
    
    @Autowired
    private lateinit var rolePermissionService: RolePermissionService
    
    @Autowired
    private lateinit var userRoleService: UserRoleService
    
    @Autowired
    private lateinit var tenantService: TenantService
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    @Autowired
    private lateinit var json: Json
    
    // Test data
    private lateinit var tenantA: Tenant
    private lateinit var tenantB: Tenant
    private lateinit var inactiveTenant: Tenant
    private lateinit var adminUser: User
    private lateinit var regularUser: User
    private lateinit var adminRole: DynamicRole
    private lateinit var viewerRole: DynamicRole
    private lateinit var adminMembership: TenantMembership
    private lateinit var regularMembership: TenantMembership
    private lateinit var adminJwt: String
    private lateinit var regularJwt: String
    
    @BeforeEach
    fun setUp() {
        // Step 1: Clean up database (handled by @Sql annotation)
        
        // Step 2: Clear any caches
        // No specific cache clearing needed for tenant tests
        
        // Step 3: Setup test scenario
        setupTenantTestScenario()
    }
    
    private fun setupTenantTestScenario() {
        // Create tenants
        tenantA = tenantRepository.save(
            Tenant(
                id = TenantId(IntegrationTestSetup.Companion.TestIds.TENANT_A),
                slug = "tenant-a",
                name = "Tenant A Corporation",
                auth0OrgId = "org_tenantA",
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        tenantB = tenantRepository.save(
            Tenant(
                id = TenantId(IntegrationTestSetup.Companion.TestIds.TENANT_B),
                slug = "tenant-b",
                name = "Tenant B Inc",
                auth0OrgId = "org_tenantB",
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        inactiveTenant = tenantRepository.save(
            Tenant(
                id = TenantId(UUID.randomUUID()),
                slug = "inactive-tenant",
                name = "Inactive Tenant",
                auth0OrgId = "org_inactive",
                isActive = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create users
        adminUser = userRepository.save(
            User(
                id = UserId(IntegrationTestSetup.Companion.TestIds.ADMIN_USER),
                auth0Sub = "auth0|admin",
                email = "admin@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        regularUser = userRepository.save(
            User(
                id = UserId(IntegrationTestSetup.Companion.TestIds.REGULAR_USER),
                auth0Sub = "auth0|regular",
                email = "regular@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create roles
        adminRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(IntegrationTestSetup.Companion.TestIds.ADMIN_ROLE_A),
                tenantId = tenantA.id,
                name = "admin",
                displayName = "Administrator",
                color = "#FF0000",
                position = 100,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        viewerRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(IntegrationTestSetup.Companion.TestIds.VIEWER_ROLE_A),
                tenantId = tenantA.id,
                name = "viewer",
                displayName = "Viewer",
                color = "#0000FF",
                position = 10,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Add permissions to roles
        // Grant admin all tenant permissions
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.TENANT, Action.VIEW, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.TENANT, Action.CREATE, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.TENANT, Action.EDIT, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.TENANT, Action.DELETE, Scope.ALL)
        )
        
        rolePermissionService.grantPermission(
            viewerRole.id,
            PermissionRule.GeneralRule(ResourceType.TENANT, Action.VIEW, Scope.OWN)
        )
        
        // Create tenant memberships
        adminMembership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A1),
                tenantId = tenantA.id,
                userId = adminUser.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        regularMembership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A2),
                tenantId = tenantA.id,
                userId = regularUser.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        // Assign roles
        userRoleService.assignRole(adminMembership.id.value, adminRole.id.value)
        userRoleService.assignRole(regularMembership.id.value, viewerRole.id.value)
        
        // Generate JWTs for testing
        adminJwt = JwtTestFixture.createValidJwt(
            subject = adminUser.auth0Sub,
            orgId = tenantA.auth0OrgId!!,
            email = adminUser.email
        )
        
        regularJwt = JwtTestFixture.createValidJwt(
            subject = regularUser.auth0Sub,
            orgId = tenantA.auth0OrgId!!,
            email = regularUser.email
        )
    }
    
    @Nested
    @DisplayName("Tenant Retrieval")
    inner class TenantRetrievalTests {
        
        @Test
        @DisplayName("Should get current tenant for authenticated user")
        fun `should get current tenant for authenticated user`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants/current")
                    .header("Authorization", "Bearer $regularJwt")
                    .header("X-Tenant-Id", tenantA.id.value.toString())
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.id").value(tenantA.id.value.toString()))
                .andExpect(jsonPath("$.slug").value("tenant-a"))
                .andExpect(jsonPath("$.name").value("Tenant A Corporation"))
                .andExpect(jsonPath("$.auth0OrgId").value("org_tenantA"))
                .andExpect(jsonPath("$.active").value(true))
        }
        
        @Test
        @DisplayName("Should get tenant by ID with proper authorization")
        fun `should get tenant by ID with proper authorization`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants/${tenantA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.id").value(tenantA.id.value.toString()))
                .andExpect(jsonPath("$.slug").value("tenant-a"))
                .andExpect(jsonPath("$.name").value("Tenant A Corporation"))
        }
        
        @Test
        @DisplayName("Should get tenant by slug")
        fun `should get tenant by slug`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants/slug/tenant-a")
                    .header("Authorization", "Bearer $regularJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.id").value(tenantA.id.value.toString()))
                .andExpect(jsonPath("$.slug").value("tenant-a"))
                .andExpect(jsonPath("$.name").value("Tenant A Corporation"))
        }
        
        @Test
        @DisplayName("Should return 404 for non-existent tenant")
        fun `should return 404 for non-existent tenant`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants/${UUID.randomUUID()}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isNotFound)
        }
        
        @Test
        @DisplayName("Should return 404 for non-existent slug")
        fun `should return 404 for non-existent slug`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants/slug/non-existent")
                    .header("Authorization", "Bearer $regularJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isNotFound)
        }
    }
    
    @Nested
    @DisplayName("Tenant Listing")
    inner class TenantListingTests {
        
        @Test
        @DisplayName("Admin should get all tenants")
        fun `admin should get all tenants`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$").isArray)
                .andExpect(jsonPath("$.length()").value(3)) // tenantA, tenantB, inactiveTenant
                .andExpect(jsonPath("$[?(@.slug == 'tenant-a')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'tenant-b')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'inactive-tenant')]").exists())
        }
        
        @Test
        @DisplayName("Admin should get only active tenants")
        fun `admin should get only active tenants`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants/active")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$").isArray)
                .andExpect(jsonPath("$.length()").value(2)) // Only tenantA and tenantB
                .andExpect(jsonPath("$[?(@.slug == 'tenant-a')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'tenant-b')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'inactive-tenant')]").doesNotExist())
        }
        
        @Test
        @DisplayName("Regular user should be denied access to all tenants")
        fun `regular user should be denied access to all tenants`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants")
                    .header("Authorization", "Bearer $regularJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Tenant Creation")
    inner class TenantCreationTests {
        
        @Test
        @DisplayName("Admin should create new tenant")
        fun `admin should create new tenant`() {
            // Given
            val createRequest = mapOf(
                "slug" to "new-tenant",
                "name" to "New Tenant Corp",
                "auth0OrgId" to "org_new"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/tenants")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.slug").value("new-tenant"))
                .andExpect(jsonPath("$.name").value("New Tenant Corp"))
                .andExpect(jsonPath("$.auth0OrgId").value("org_new"))
                .andExpect(jsonPath("$.active").value(true))
        }
        
        @Test
        @DisplayName("Should reject duplicate slug")
        fun `should reject duplicate slug`() {
            // Given
            val createRequest = mapOf(
                "slug" to "tenant-a", // Already exists
                "name" to "Duplicate Tenant",
                "auth0OrgId" to "org_duplicate"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/tenants")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
                .andExpect(status().isBadRequest)
        }
        
        @Test
        @DisplayName("Should validate slug format")
        fun `should validate slug format`() {
            // Given - Invalid slug with uppercase
            val createRequest = mapOf(
                "slug" to "Invalid-Slug",
                "name" to "Invalid Tenant",
                "auth0OrgId" to "org_invalid"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/tenants")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
                .andExpect(status().isBadRequest)
        }
        
        @Test
        @DisplayName("Regular user should be denied tenant creation")
        fun `regular user should be denied tenant creation`() {
            // Given
            val createRequest = mapOf(
                "slug" to "new-tenant",
                "name" to "New Tenant Corp",
                "auth0OrgId" to "org_new"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/tenants")
                    .header("Authorization", "Bearer $regularJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Tenant Updates")
    inner class TenantUpdateTests {
        
        @Test
        @DisplayName("Admin should update tenant name")
        fun `admin should update tenant name`() {
            // Given
            val updateRequest = mapOf(
                "name" to "Updated Tenant Name"
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/tenants/${tenantA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.id").value(tenantA.id.value.toString()))
                .andExpect(jsonPath("$.name").value("Updated Tenant Name"))
                .andExpect(jsonPath("$.slug").value("tenant-a")) // Slug unchanged
        }
        
        @Test
        @DisplayName("Should link Auth0 organization")
        fun `should link Auth0 organization`() {
            // Given - Create tenant without Auth0 org
            val newTenant = tenantRepository.save(
                Tenant(
                    slug = "no-auth0",
                    name = "No Auth0 Tenant",
                    auth0OrgId = null,
                    isActive = true
                )
            )
            
            val linkRequest = mapOf(
                "auth0OrgId" to "org_linked"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/tenants/${newTenant.id.value}/link-auth0?auth0OrgId=org_linked")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.auth0OrgId").value("org_linked"))
        }
        
        @Test
        @DisplayName("Regular user should be denied tenant updates")
        fun `regular user should be denied tenant updates`() {
            // Given
            val updateRequest = mapOf(
                "name" to "Unauthorized Update"
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/tenants/${tenantA.id.value}")
                    .header("Authorization", "Bearer $regularJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Tenant Activation")
    inner class TenantActivationTests {
        
        @Test
        @DisplayName("Admin should deactivate tenant")
        fun `admin should deactivate tenant`() {
            // When & Then
            mockMvc.perform(
                delete("/api/v1/tenants/${tenantB.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.id").value(tenantB.id.value.toString()))
                .andExpect(jsonPath("$.active").value(false))
        }
        
        @Test
        @DisplayName("Admin should activate tenant")
        fun `admin should activate tenant`() {
            // When & Then
            mockMvc.perform(
                post("/api/v1/tenants/${inactiveTenant.id.value}/activate")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.id").value(inactiveTenant.id.value.toString()))
                .andExpect(jsonPath("$.active").value(true))
        }
        
        @Test
        @DisplayName("Regular user should be denied activation/deactivation")
        fun `regular user should be denied activation deactivation`() {
            // When & Then - Deactivate
            mockMvc.perform(
                delete("/api/v1/tenants/${tenantA.id.value}")
                    .header("Authorization", "Bearer $regularJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
            
            // When & Then - Activate
            mockMvc.perform(
                post("/api/v1/tenants/${inactiveTenant.id.value}/activate")
                    .header("Authorization", "Bearer $regularJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Authentication and Authorization")
    inner class AuthenticationAuthorizationTests {
        
        @Test
        @DisplayName("Should reject requests without JWT")
        fun `should reject requests without JWT`() {
            // When & Then - No JWT returns 404 (no tenant context)
            mockMvc.perform(
                get("/api/v1/tenants/current")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isNotFound)
        }
        
        @Test
        @DisplayName("Should reject requests with invalid JWT")
        fun `should reject requests with invalid JWT`() {
            // Given
            val invalidJwt = JwtTestFixture.createJwtWithInvalidSignature(
                subject = "auth0|test",
                orgId = "org_test"
            )
            
            // When & Then
            mockMvc.perform(
                get("/api/v1/tenants/current")
                    .header("Authorization", "Bearer $invalidJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should handle missing tenant context")
        fun `should handle missing tenant context`() {
            // Given - User without tenant membership
            val orphanUser = userRepository.save(
                User(
                    auth0Sub = "auth0|orphan",
                    email = "orphan@test.com"
                )
            )
            
            val orphanJwt = JwtTestFixture.createJwtWithoutOrgId(
                subject = orphanUser.auth0Sub,
                email = orphanUser.email
            )
            
            // When & Then - SetupMode JWT is forbidden for tenant-specific endpoints
            mockMvc.perform(
                get("/api/v1/tenants/current")
                    .header("Authorization", "Bearer $orphanJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
}