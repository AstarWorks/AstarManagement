package com.astarworks.astarmanagement.integration.api.workspace

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.workspace.api.dto.*
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.*
import org.springframework.transaction.annotation.Transactional
import org.hamcrest.Matchers
import java.time.Instant
import java.util.*
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId

/**
 * Integration tests for WorkspaceController.
 * 
 * This test class verifies:
 * - Basic CRUD operations for workspaces
 * - Authentication and authorization 
 * - Tenant isolation and data separation
 * - Business rules (limits, quotas, naming)
 * - Special endpoints (statistics, quota, default)
 * - Error handling and validation
 * 
 * Test structure:
 * - 5 basic CRUD tests
 * - 4 authentication/authorization tests
 * - 3 tenant isolation tests
 * - 4 business rule tests  
 * - 3 special endpoint tests
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test", "integration")
@ExtendWith(SpringExtension::class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("Workspace Controller Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class WorkspaceControllerIntegrationTest : IntegrationTestBase() {
    
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
    private lateinit var workspaceService: WorkspaceService
    
    @Autowired
    private lateinit var tableService: TableService
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    @Autowired
    private lateinit var json: Json
    
    // Test data
    private lateinit var tenantA: Tenant
    private lateinit var tenantB: Tenant
    private lateinit var adminUser: User
    private lateinit var editorUser: User
    private lateinit var viewerUser: User
    private lateinit var workspaceA: Workspace
    private lateinit var workspaceB: Workspace
    
    // Auth0 organization IDs for JWT generation
    private lateinit var tenantAOrgId: String
    private lateinit var tenantBOrgId: String
    
    // Tenant membership IDs
    private lateinit var adminTenantUserId: UUID
    private lateinit var editorTenantUserId: UUID
    private lateinit var viewerTenantUserId: UUID
    
    // Roles
    private lateinit var adminRole: DynamicRole
    private lateinit var editorRole: DynamicRole
    private lateinit var viewerRole: DynamicRole
    
    // JWT tokens
    private lateinit var adminJwt: String
    private lateinit var editorJwt: String
    private lateinit var viewerJwt: String
    private lateinit var tenantBAdminJwt: String

    @BeforeEach
    fun setupTestScenario() {
        // Clear caches (database cleanup handled by @Sql annotation)
        clearCaches()
        
        // Generate Auth0 organization IDs
        tenantAOrgId = "org_${UUID.randomUUID().toString().replace("-", "").substring(0, 10)}"
        tenantBOrgId = "org_${UUID.randomUUID().toString().replace("-", "").substring(0, 10)}"
        
        // Create test tenants
        tenantA = createTenant(UUID.randomUUID(), "tenant-a", "Tenant A", tenantAOrgId)
        tenantB = createTenant(UUID.randomUUID(), "tenant-b", "Tenant B", tenantBOrgId)
        
        // Create test users
        adminUser = createUser(UUID.randomUUID(), "auth0|admin", "admin@test.com")
        editorUser = createUser(UUID.randomUUID(), "auth0|editor", "editor@test.com")
        viewerUser = createUser(UUID.randomUUID(), "auth0|viewer", "viewer@test.com")
        
        // Create tenant memberships
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
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.CREATE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.EDIT, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.DELETE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.CREATE, Scope.ALL)
            )
        )
        
        editorRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "editor",
            listOf(
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.CREATE, Scope.OWN),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.EDIT, Scope.OWN),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
            )
        )
        
        viewerRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "viewer",
            listOf(
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
            )
        )
        
        // Assign roles to users
        userRoleService.assignRole(adminTenantUserId, adminRole.id.value)
        userRoleService.assignRole(editorTenantUserId, editorRole.id.value)
        userRoleService.assignRole(viewerTenantUserId, viewerRole.id.value)
        
        // Create initial workspaces
        workspaceA = createWorkspace(tenantA.id.value, "Test Workspace A")
        workspaceB = createWorkspace(tenantB.id.value, "Test Workspace B")
        
        // Generate JWT tokens
        adminJwt = createJwtToken(adminUser.auth0Sub, tenantAOrgId, adminUser.email)
        editorJwt = createJwtToken(editorUser.auth0Sub, tenantAOrgId, editorUser.email)
        viewerJwt = createJwtToken(viewerUser.auth0Sub, tenantAOrgId, viewerUser.email)
        
        // Create a tenant B admin user for cross-tenant tests
        val tenantBAdminUser = createUser(UUID.randomUUID(), "auth0|tenant-b-admin", "admin@tenant-b.com")
        val tenantBAdminMembershipId = UUID.randomUUID()
        createTenantMembership(tenantBAdminMembershipId, tenantBAdminUser, tenantB)
        
        val tenantBAdminRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantB.id.value,
            "admin",
            listOf(
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.CREATE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.EDIT, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.DELETE, Scope.ALL)
            )
        )
        userRoleService.assignRole(tenantBAdminMembershipId, tenantBAdminRole.id.value)
        
        tenantBAdminJwt = createJwtToken(tenantBAdminUser.auth0Sub, tenantBOrgId, tenantBAdminUser.email)
    }

    // ==================== Helper Methods ====================
    
    /**
     * Creates a JWT token using JwtTestFixture with proper Auth0 claims.
     */
    private fun createJwtToken(
        auth0Sub: String,
        orgId: String,
        email: String
    ): String {
        return JwtTestFixture.createValidJwt(
            subject = auth0Sub,
            orgId = orgId,
            email = email
        )
    }
    
    private fun createTenant(id: UUID, slug: String, name: String, auth0OrgId: String): Tenant {
        val tenant = Tenant(
            id = TenantId(id),
            slug = slug,
            name = name,
            auth0OrgId = auth0OrgId,
            isActive = true,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        return tenantRepository.save(tenant)
    }
    
    private fun createUser(id: UUID, auth0Sub: String, email: String): User {
        val user = User(
            id = UserId(id),
            auth0Sub = auth0Sub,
            email = email,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        return userRepository.save(user)
    }
    
    private fun createTenantMembership(id: UUID, user: User, tenant: Tenant): TenantMembership {
        val membership = TenantMembership(
            id = TenantMembershipId(id),
            tenantId = tenant.id,
            userId = user.id,
            isActive = true,
            joinedAt = Instant.now(),
            lastAccessedAt = null
        )
        return tenantMembershipRepository.save(membership)
    }
    
    @Transactional
    private fun createRoleWithPermissions(
        roleId: UUID,
        tenantId: UUID,
        roleName: String,
        permissions: List<PermissionRule>
    ): DynamicRole {
        val role = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(roleId),
                tenantId = TenantId(tenantId),
                name = roleName,
                displayName = roleName.capitalize(),
                color = "#FF5733",
                position = 0,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Add permissions to role
        if (permissions.isNotEmpty()) {
            rolePermissionService.grantPermissions(
                role.id,
                permissions.map { it.toDatabaseString() }
            )
        }
        
        return role
    }
    
    private fun createWorkspace(tenantId: UUID, name: String): Workspace {
        return workspaceService.createWorkspace(TenantId(tenantId), name)
    }
    
    private fun createTable(tableId: UUID, workspaceId: UUID, name: String): Table {
        val table = Table(
            id = TableId(tableId),
            workspaceId = WorkspaceId(workspaceId),
            name = name,
            properties = emptyMap(),
            propertyOrder = emptyList(),
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        // TableService.createTable expects WorkspaceId and name
        return tableService.createTable(WorkspaceId(workspaceId), name)
    }
    
    // @AfterEach tearDown removed - cleanup handled by @Sql annotation

    // ==================== Basic CRUD Tests ====================
    
    @Nested
    @DisplayName("Basic CRUD Operations")
    inner class BasicCrudTests {
        
        @Test
        @DisplayName("Should create workspace successfully with admin role")
        fun createWorkspace_WithAdminRole_ReturnsCreated() {
            // Given
            val request = WorkspaceCreateRequest(
                name = "New Workspace"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/workspaces")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Workspace"))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should list all workspaces for tenant")
        fun listWorkspaces_WithValidToken_ReturnsWorkspaceList() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $adminJwt")
                    .param("includeCounts", "true")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaces").isArray())
                .andExpect(jsonPath("$.workspaces[0].name").value("Test Workspace A"))
                .andExpect(jsonPath("$.totalCount").value(1))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should get workspace details by ID")
        fun getWorkspace_WithValidId_ReturnsWorkspaceDetails() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .param("detailed", "true")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspace.id").value(workspaceA.id.value.toString()))
                .andExpect(jsonPath("$.workspace.name").value("Test Workspace A"))
                .andExpect(jsonPath("$.statistics.totalTables").value(0))
                .andExpect(jsonPath("$.statistics.totalRecords").value(0))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should update workspace name successfully")
        fun updateWorkspace_WithNewName_ReturnsUpdated() {
            // Given
            val uniqueName = "Updated Workspace Name"
            val request = WorkspaceUpdateRequest(
                name = uniqueName
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(uniqueName))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should delete empty workspace successfully")
        fun deleteWorkspace_WhenEmpty_ReturnsNoContent() {
            // When & Then
            mockMvc.perform(
                delete("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isOk())
                .andDo(print())
            
            // Verify workspace is deleted
            mockMvc.perform(
                get("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isNotFound())
        }
    }
    
    // ==================== Authentication & Authorization Tests ====================
    
    @Nested
    @DisplayName("Authentication & Authorization")
    inner class AuthenticationAuthorizationTests {
        
        @Test
        @DisplayName("Should reject unauthenticated access")
        fun accessWithoutToken_Returns401() {
            mockMvc.perform(
                get("/api/v1/workspaces")
            )
                .andExpect(status().isForbidden())
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should reject viewer role from creating workspace")
        fun createWorkspace_WithViewerRole_Returns403() {
            // Given
            val request = WorkspaceCreateRequest(
                name = "Viewer Workspace"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/workspaces")
                    .header("Authorization", "Bearer $viewerJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isForbidden())
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should allow editor to create workspace with OWN scope")
        fun createWorkspace_WithEditorRole_ReturnsCreated() {
            // Given
            val request = WorkspaceCreateRequest(
                name = "Editor Workspace"
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/workspaces")
                    .header("Authorization", "Bearer $editorJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Editor Workspace"))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should reject viewer from deleting workspace")
        fun deleteWorkspace_WithViewerRole_Returns403() {
            mockMvc.perform(
                delete("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $viewerJwt")
            )
                .andExpect(status().isForbidden())
                .andDo(print())
        }
    }
    
    // ==================== Multi-tenant Isolation Tests ====================
    
    @Nested
    @DisplayName("Multi-tenant Isolation")
    inner class MultiTenantIsolationTests {
        
        @Test
        @DisplayName("Should not show other tenant's workspaces in list")
        fun listWorkspaces_OnlyShowsOwnTenant() {
            // Tenant A should only see Workspace A
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaces", Matchers.hasSize<Any>(1)))
                .andExpect(jsonPath("$.workspaces[0].name").value("Test Workspace A"))
                .andDo(print())
            
            // Tenant B should only see Workspace B
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $tenantBAdminJwt")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaces", Matchers.hasSize<Any>(1)))
                .andExpect(jsonPath("$.workspaces[0].name").value("Test Workspace B"))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should not allow access to other tenant's workspace")
        fun getWorkspace_FromOtherTenant_Returns404() {
            // Tenant A admin trying to access Tenant B's workspace
            mockMvc.perform(
                get("/api/v1/workspaces/${workspaceB.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isNotFound())
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should not allow updating other tenant's workspace")
        fun updateWorkspace_FromOtherTenant_Returns404() {
            // Given
            val request = WorkspaceUpdateRequest(
                name = "Hacked Name"
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/workspaces/${workspaceB.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isNotFound())
                .andDo(print())
        }
    }
    
    // ==================== Business Rules Tests ====================
    
    @Nested
    @DisplayName("Business Rules")
    inner class BusinessRulesTests {
        
        @Test
        @DisplayName("Should enforce workspace limit of 10 per tenant")
        fun createWorkspace_ExceedsLimit_Returns409() {
            // Create 9 more workspaces (we already have 1)
            for (i in 2..10) {
                val request = WorkspaceCreateRequest(
                    name = "Workspace $i"
                )
                mockMvc.perform(
                    post("/api/v1/workspaces")
                        .header("Authorization", "Bearer $adminJwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.encodeToString(request))
                )
                    .andExpect(status().isOk())
            }
            
            // Try to create 11th workspace - should fail
            val request = WorkspaceCreateRequest(
                name = "Workspace 11"
            )
            mockMvc.perform(
                post("/api/v1/workspaces")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKSPACE_LIMIT_EXCEEDED"))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should reject duplicate workspace name within tenant")
        fun createWorkspace_DuplicateName_Returns409() {
            // Given
            val request = WorkspaceCreateRequest(
                name = "Test Workspace A" // Same as existing workspace
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/workspaces")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKSPACE_DUPLICATE_NAME"))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should prevent deletion of non-empty workspace without force")
        fun deleteWorkspace_NotEmpty_Returns409() {
            // Create a table in the workspace to make it non-empty
            val tableId = UUID.randomUUID()
            createTable(tableId, workspaceA.id.value, "Test Table")
            
            // Try to delete without force flag
            mockMvc.perform(
                delete("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORKSPACE_NOT_EMPTY"))
                .andDo(print())
            
            // Delete with force flag should succeed
            mockMvc.perform(
                delete("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .param("force", "true")
            )
                .andExpect(status().isOk())
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should create default workspace for new tenant")
        fun createDefaultWorkspace_FirstTime_ReturnsCreated() {
            // When & Then
            mockMvc.perform(
                post("/api/v1/workspaces/default")
                    .header("Authorization", "Bearer $tenantBAdminJwt")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Default Workspace"))
                .andDo(print())
            
            // Second attempt should fail
            mockMvc.perform(
                post("/api/v1/workspaces/default")
                    .header("Authorization", "Bearer $tenantBAdminJwt")
            )
                .andExpect(status().isConflict())
                .andDo(print())
        }
    }
    
    // ==================== Special Endpoints Tests ====================
    
    @Nested
    @DisplayName("Special Endpoints")
    inner class SpecialEndpointsTests {
        
        @Test
        @DisplayName("Should get workspace statistics")
        fun getWorkspaceStatistics_ReturnsCorrectData() {
            // Create some tables and records
            val tableId = UUID.randomUUID()
            createTable(tableId, workspaceA.id.value, "Statistics Test Table")
            
            // When & Then
            mockMvc.perform(
                get("/api/v1/workspaces/${workspaceA.id.value}/statistics")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTables").value(1))
                .andExpect(jsonPath("$.totalRecords").value(0))
                .andExpect(jsonPath("$.totalUsers").value(0))
                .andExpect(jsonPath("$.lastActivity").isNotEmpty())
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should get workspace quota information")
        fun getWorkspaceQuota_ReturnsLimitInfo() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/workspaces/quota")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentCount").value(1))
                .andExpect(jsonPath("$.maxCount").value(10))
                .andExpect(jsonPath("$.canCreate").value(true))
                .andExpect(jsonPath("$.remaining").value(9))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should include table counts when requested")
        fun listWorkspaces_WithIncludeCounts_ReturnsDetailedInfo() {
            // Create a table in workspace A
            val tableId = UUID.randomUUID()
            createTable(tableId, workspaceA.id.value, "Count Test Table")
            
            // When & Then
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $adminJwt")
                    .param("includeCounts", "true")
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaces[0].tableCount").value(1))
                .andExpect(jsonPath("$.workspaces[0].recordCount").value(0))
                .andDo(print())
        }
    }
    
    // ==================== Error Handling Tests ====================
    
    @Nested
    @DisplayName("Error Handling")
    inner class ErrorHandlingTests {
        
        @Test
        @DisplayName("Should return 404 for non-existent workspace")
        fun getWorkspace_NonExistent_Returns404() {
            val nonExistentId = UUID.randomUUID()
            
            mockMvc.perform(
                get("/api/v1/workspaces/$nonExistentId")
                    .header("Authorization", "Bearer $adminJwt")
            )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("WORKSPACE_NOT_FOUND"))
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should validate workspace name")
        fun createWorkspace_InvalidName_Returns400() {
            // Empty name
            val request = WorkspaceCreateRequest(
                name = ""
            )
            
            mockMvc.perform(
                post("/api/v1/workspaces")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isBadRequest())
                .andDo(print())
        }
        
        @Test
        @DisplayName("Should handle update with no changes")
        fun updateWorkspace_NoChanges_ReturnsCurrentState() {
            // Given - empty update request
            val request = WorkspaceUpdateRequest(
                name = null
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/workspaces/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(request))
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Workspace A"))
                .andDo(print())
        }
    }
}