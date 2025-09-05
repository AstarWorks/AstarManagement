package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.api.dto.RoleCreateRequestDto
import com.astarworks.astarmanagement.core.auth.api.dto.RoleUpdateRequest
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import org.junit.jupiter.api.*
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.util.*

/**
 * Integration tests for RoleController authorization.
 * 
 * This test class verifies:
 * - Authentication requirements for all endpoints
 * - Permission-based access control
 * - Tenant isolation and data separation
 * - Error handling and validation
 * 
 * Test structure:
 * - 3 authentication tests (no auth)
 * - 6 permission-based tests (admin, editor, viewer)
 * - 3 tenant isolation tests
 * - 3 special case tests (validation, limits)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test", "dev")
@ExtendWith(SpringExtension::class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("Role Controller Authorization Tests")
class RoleControllerAuthorizationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    
    @Autowired
    private lateinit var dynamicRoleRepository: DynamicRoleRepository
    
    @Autowired
    private lateinit var rolePermissionService: RolePermissionService
    
    @Autowired
    private lateinit var userRoleService: UserRoleService
    
    @Autowired
    private lateinit var json: Json
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    // Test data
    private lateinit var tenantA: Tenant
    private lateinit var tenantB: Tenant
    private lateinit var adminUser: User
    private lateinit var editorUser: User
    private lateinit var viewerUser: User
    // Auth0 organization IDs for JWT generation
    private lateinit var tenantAOrgId: String
    private lateinit var tenantBOrgId: String
    // Using direct tenant user IDs instead of membership objects
    private lateinit var adminTenantUserId: UUID
    private lateinit var editorTenantUserId: UUID
    private lateinit var viewerTenantUserId: UUID
    private lateinit var adminRole: DynamicRole
    private lateinit var editorRole: DynamicRole
    private lateinit var viewerRole: DynamicRole
    private lateinit var existingRole: DynamicRole
    
    @BeforeEach
    fun setupTestScenario() {
        // Clean database and caches
        cleanupDatabase()
        clearCaches()
        
        // Generate Auth0 organization IDs
        tenantAOrgId = "org_${UUID.randomUUID().toString().replace("-", "").substring(0, 10)}"
        tenantBOrgId = "org_${UUID.randomUUID().toString().replace("-", "").substring(0, 10)}"
        
        // Create test tenants with proper Auth0 org IDs
        tenantA = createTenant(UUID.randomUUID(), "tenant-a", "Tenant A", tenantAOrgId)
        tenantB = createTenant(UUID.randomUUID(), "tenant-b", "Tenant B", tenantBOrgId)
        
        // Create test users
        adminUser = createUser(UUID.randomUUID(), "auth0|admin", "admin@test.com")
        editorUser = createUser(UUID.randomUUID(), "auth0|editor", "editor@test.com")
        viewerUser = createUser(UUID.randomUUID(), "auth0|viewer", "viewer@test.com")
        
        // Create tenant memberships (using direct database calls)
        adminTenantUserId = UUID.randomUUID()
        editorTenantUserId = UUID.randomUUID() 
        viewerTenantUserId = UUID.randomUUID()
        
        createTenantMembership(adminTenantUserId, adminUser, tenantA)
        createTenantMembership(editorTenantUserId, editorUser, tenantA)
        createTenantMembership(viewerTenantUserId, viewerUser, tenantA)
        
        // Create roles with appropriate permissions
        adminRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "admin",
            listOf(
                PermissionRule.GeneralRule(ResourceType.ROLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.ROLE, Action.CREATE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.ROLE, Action.EDIT, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.ROLE, Action.DELETE, Scope.ALL)
            )
        )
        
        editorRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "editor",
            listOf(
                PermissionRule.GeneralRule(ResourceType.ROLE, Action.VIEW, Scope.ALL)
            )
        )
        
        viewerRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "viewer",
            listOf(
                PermissionRule.GeneralRule(ResourceType.ROLE, Action.VIEW, Scope.ALL)
            )
        )
        
        // Create an existing role for testing
        existingRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "existing_role",
            emptyList()
        )
        
        // Assign roles to users
        userRoleService.assignRole(adminTenantUserId, adminRole.id.value)
        userRoleService.assignRole(editorTenantUserId, editorRole.id.value)
        userRoleService.assignRole(viewerTenantUserId, viewerRole.id.value)
    }
    
    // ==================== Helper Methods ====================
    
    /**
     * Creates a JWT token using JwtTestFixture with proper Auth0 claims.
     */
    private fun createJwtToken(
        auth0Sub: String,
        orgId: String,
        email: String = "test@example.com"
    ): String {
        return JwtTestFixture.createValidJwt(
            subject = auth0Sub,
            orgId = orgId,
            email = email
        )
    }
    
    private fun createTenant(id: UUID, slug: String, name: String, auth0OrgId: String): Tenant {
        return tenantRepository.save(
            Tenant(
                id = TenantId(id),
                slug = slug,
                name = name,
                auth0OrgId = auth0OrgId,
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
    }
    
    private fun createUser(id: UUID, auth0Sub: String, email: String): User {
        return userRepository.save(
            User(
                id = UserId(id),
                auth0Sub = auth0Sub,
                email = email,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
    }
    
    private fun createTenantMembership(
        id: UUID,
        user: User,
        tenant: Tenant
    ) {
        // Create tenant membership using direct SQL (similar to AuthorizationServiceIntegrationTest)
        val now = java.sql.Timestamp.from(Instant.now())
        executeAsSystemUser {
            jdbcTemplate.update(
                """INSERT INTO tenant_users (id, user_id, tenant_id, is_active, joined_at, last_accessed_at, version)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                id, user.id.value, tenant.id.value, true, now, now, 0
            )
        }
    }
    
    private fun createRoleWithPermissions(
        id: UUID,
        tenantId: UUID,
        name: String,
        permissions: List<PermissionRule>
    ): DynamicRole {
        val role = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(id),
                tenantId = TenantId(tenantId),
                name = name,
                displayName = name.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() },
                color = "#007bff",
                position = 0,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Grant permissions to the role
        if (permissions.isNotEmpty()) {
            rolePermissionService.grantPermissions(
                role.id,
                permissions.map { it.toDatabaseString() }
            )
        }
        
        return role
    }
    
    // ==================== Test Cases ====================
    
    @Nested
    @DisplayName("Authentication Tests")
    inner class AuthenticationTests {
        
        @Test
        @DisplayName("Should return 401 when accessing GET /roles without authentication")
        fun `should return 401 for GET roles without auth`() {
            mockMvc.perform(
                get("/api/v1/roles")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should return 401 when accessing POST /roles without authentication")
        fun `should return 401 for POST roles without auth`() {
            val request = RoleCreateRequestDto(
                name = "test_role",
                displayName = "Test Role",
                color = "#ff0000",
                position = 1,
                permissions = emptyList()
            )
            
            mockMvc.perform(
                post("/api/v1/roles")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
            .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should return 401 when accessing DELETE /roles/{id} without authentication")
        fun `should return 401 for DELETE roles without auth`() {
            mockMvc.perform(
                delete("/api/v1/roles/${existingRole.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Permission-Based Access Tests")
    inner class PermissionBasedAccessTests {
        
        @Test
        @DisplayName("Admin should have full access to all role operations")
        fun `admin should have full access`() {
            val token = createJwtToken(
                adminUser.auth0Sub,
                tenantAOrgId,
                adminUser.email
            )
            
            // Test GET - should succeed
            mockMvc.perform(
                get("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            
            // Test POST - should succeed (use unique name to avoid conflicts)
            val uniqueRoleName = "admin_role_${System.currentTimeMillis()}_${UUID.randomUUID().toString().substring(0, 8)}"
            val createRequest = RoleCreateRequestDto(
                name = uniqueRoleName,
                displayName = "New Admin Role",
                color = "#00ff00",
                position = 2,
                permissions = emptyList()
            )
            
            mockMvc.perform(
                post("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value(uniqueRoleName))
            
            // Test PUT - should succeed
            // Create a fresh role for update test to avoid ID conflicts
            val roleToUpdate = createRoleWithPermissions(
                UUID.randomUUID(),
                tenantA.id.value,
                "role_to_update_${System.currentTimeMillis()}",
                emptyList()
            )
            
            val updateRequest = RoleUpdateRequest(
                displayName = "Updated Role",
                color = "#0000ff",
                position = 3
            )
            
            mockMvc.perform(
                put("/api/v1/roles/${roleToUpdate.id.value}")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
            .andExpect(status().isOk)
            
            // Test DELETE - should succeed
            val roleToDelete = createRoleWithPermissions(
                UUID.randomUUID(),
                tenantA.id.value,
                "role_to_delete",
                emptyList()
            )
            
            mockMvc.perform(
                delete("/api/v1/roles/${roleToDelete.id.value}")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
        }
        
        @Test
        @DisplayName("Editor should only have read access to roles")
        fun `editor should only have read access`() {
            val token = createJwtToken(
                editorUser.auth0Sub,
                tenantAOrgId,
                editorUser.email
            )
            
            // Test GET - should succeed
            mockMvc.perform(
                get("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            
            // Test POST - should fail with 403
            val createRequest = RoleCreateRequestDto(
                name = "editor_attempt_role",
                displayName = "Editor Attempt Role",
                color = "#ff00ff",
                position = 4,
                permissions = emptyList()
            )
            
            mockMvc.perform(
                post("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isForbidden)
            
            // Test PUT - should fail with 403
            // Create a fresh role for this test to avoid conflicts
            val roleForEditTest = createRoleWithPermissions(
                UUID.randomUUID(),
                tenantA.id.value,
                "role_for_edit_test_${System.currentTimeMillis()}",
                emptyList()
            )
            
            val updateRequest = RoleUpdateRequest(
                displayName = "Editor Update Attempt",
                color = "#ffffff"
            )
            
            mockMvc.perform(
                put("/api/v1/roles/${roleForEditTest.id.value}")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
            .andExpect(status().isForbidden)
            
            // Test DELETE - should fail with 403
            // Create a fresh role for this test to avoid conflicts
            val roleForDeleteTest = createRoleWithPermissions(
                UUID.randomUUID(),
                tenantA.id.value,
                "role_for_delete_test_${System.currentTimeMillis()}",
                emptyList()
            )
            
            mockMvc.perform(
                delete("/api/v1/roles/${roleForDeleteTest.id.value}")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Viewer should only have read access to roles")
        fun `viewer should only have read access`() {
            val token = createJwtToken(
                viewerUser.auth0Sub,
                tenantAOrgId,
                viewerUser.email
            )
            
            // Test GET - should succeed
            mockMvc.perform(
                get("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            
            // Test GET by ID - should succeed
            mockMvc.perform(
                get("/api/v1/roles/${existingRole.id.value}")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value("existing_role"))
            
            // Test POST - should fail with 403
            val createRequest = RoleCreateRequestDto(
                name = "viewer_attempt_role",
                displayName = "Viewer Attempt Role",
                color = "#123456",
                position = 5,
                permissions = emptyList()
            )
            
            mockMvc.perform(
                post("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Tenant Isolation Tests")
    inner class TenantIsolationTests {
        
        @Test
        @DisplayName("Should access own tenant's roles")
        fun `should access own tenant roles`() {
            val token = createJwtToken(
                adminUser.auth0Sub,
                tenantAOrgId,
                adminUser.email
            )
            
            mockMvc.perform(
                get("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andExpect(jsonPath("$[?(@.name == 'existing_role')]").exists())
        }
        
        @Test
        @DisplayName("Should return 403 when accessing other tenant's role")
        fun `should return 403 for other tenant role`() {
            // Create a role in tenant B
            val otherTenantRole = createRoleWithPermissions(
                UUID.randomUUID(),
                tenantB.id.value,
                "tenant_b_role",
                emptyList()
            )
            
            // Try to access it with tenant A user
            val token = createJwtToken(
                adminUser.auth0Sub,
                tenantAOrgId,
                adminUser.email
            )
            
            mockMvc.perform(
                get("/api/v1/roles/${otherTenantRole.id.value}")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should return 404 for non-existent role")
        fun `should return 404 for non-existent role`() {
            val token = createJwtToken(
                adminUser.auth0Sub,
                tenantAOrgId,
                adminUser.email
            )
            
            val nonExistentId = UUID.randomUUID()
            
            mockMvc.perform(
                get("/api/v1/roles/$nonExistentId")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isNotFound)
        }
    }
    
    @Nested
    @DisplayName("Validation and Special Cases")
    inner class ValidationTests {
        
        @Test
        @DisplayName("Should return 400 for duplicate role name")
        fun `should return 400 for duplicate role name`() {
            val token = createJwtToken(
                adminUser.auth0Sub,
                tenantAOrgId,
                adminUser.email
            )
            
            val request = RoleCreateRequestDto(
                name = "existing_role", // Already exists
                displayName = "Duplicate Role",
                color = "#abcdef",
                position = 10,
                permissions = emptyList()
            )
            
            mockMvc.perform(
                post("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
            .andExpect(status().isConflict)
        }
        
        @Test
        @DisplayName("Should return 400 for invalid color code")
        fun `should return 400 for invalid color code`() {
            val token = createJwtToken(
                adminUser.auth0Sub,
                tenantAOrgId,
                adminUser.email
            )
            
            val request = RoleCreateRequestDto(
                name = "invalid_color_role",
                displayName = "Invalid Color Role",
                color = "not-a-color", // Invalid format
                position = 11,
                permissions = emptyList()
            )
            
            mockMvc.perform(
                post("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
            .andExpect(status().isBadRequest)
        }
        
        @Test
        @DisplayName("Should return 403 when role limit is exceeded")
        fun `should return 403 when role limit exceeded`() {
            val token = createJwtToken(
                adminUser.auth0Sub,
                tenantAOrgId,
                adminUser.email
            )
            
            // Get current role count for tenant A
            val currentCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM roles WHERE tenant_id = ?",
                Int::class.java,
                tenantA.id.value
            ) ?: 0
            
            // Create roles up to the limit (50) minus 1
            val roleLimit = 50
            val rolesToCreate = roleLimit - currentCount
            
            // Create roles to reach exactly the limit
            for (i in 1..rolesToCreate) {
                createRoleWithPermissions(
                    UUID.randomUUID(),
                    tenantA.id.value,
                    "bulk_role_${System.currentTimeMillis()}_$i",
                    emptyList()
                )
            }
            
            // Try to create one more (should fail with 403 Forbidden)
            val request = RoleCreateRequestDto(
                name = "over_limit_role_${System.currentTimeMillis()}",
                displayName = "Over Limit Role",
                color = "#fedcba",
                position = 100,
                permissions = emptyList()
            )
            
            mockMvc.perform(
                post("/api/v1/roles")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
            .andExpect(status().isForbidden)
        }
    }
    
}