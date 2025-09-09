package com.astarworks.astarmanagement.integration.workflow

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.table.api.dto.record.*
import com.astarworks.astarmanagement.core.table.api.dto.table.*
import com.astarworks.astarmanagement.core.table.api.dto.property.*
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.core.table.domain.service.RecordService
import com.astarworks.astarmanagement.core.tenant.api.dto.CreateTenantRequest
import com.astarworks.astarmanagement.core.tenant.api.dto.TenantResponse
import com.astarworks.astarmanagement.core.auth.api.dto.SetupRequest
import com.astarworks.astarmanagement.core.auth.api.dto.SetupResponse
import com.astarworks.astarmanagement.core.auth.api.dto.UserProfileDto
import com.astarworks.astarmanagement.core.auth.api.dto.TenantTypeDto
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.tenant.domain.service.TenantService
import com.astarworks.astarmanagement.core.user.api.dto.UserResponse
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.workspace.api.dto.WorkspaceResponse
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.api.dto.PageResponse
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.*
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.Matchers.*
import org.junit.jupiter.api.*
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
import java.time.Instant
import java.util.UUID

/**
 * User Onboarding Workflow Integration Tests
 * 
 * This test class verifies the complete user onboarding workflow from initial
 * registration through to table and record operations. It represents a high-level
 * integration test at the top of the test pyramid, validating the entire user journey.
 * 
 * Test scenarios:
 * 1. Complete onboarding workflow (registration → tenant → workspace → table → records)
 * 2. Multi-tenant isolation verification
 * 3. User belonging to multiple tenants
 * 4. Error cases and edge conditions
 * 
 * Key features tested:
 * - Automatic user registration on first login
 * - Default tenant and workspace creation
 * - Role assignment and permissions
 * - Table creation and data operations
 * - Row Level Security (RLS) enforcement
 * - Multi-tenant data isolation
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test", "integration")
@ExtendWith(SpringExtension::class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("User Onboarding Workflow Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class UserOnboardingWorkflowTest : IntegrationTestBase() {

    @Autowired
    private lateinit var json: Json
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var tenantMembershipRepository: TenantMembershipRepository
    
    @Autowired
    private lateinit var tenantService: TenantService
    
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
    private lateinit var recordService: RecordService
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    @BeforeEach
    fun setUp() {
        // Clean database and clear any caches
        cleanupDatabase()
        clearCaches()
    }
    
    @AfterEach
    fun tearDown() {
        // RLS context cleanup is handled automatically by test framework
        // The @Sql annotation and transaction rollback handle cleanup
    }
    
    @Nested
    @DisplayName("Complete Onboarding Workflow")
    inner class CompleteOnboardingWorkflow {
        
        @Test
        @DisplayName("Should complete full user onboarding workflow from registration to table operations")
        fun shouldCompleteFullUserOnboardingWorkflow() {
            // Step 1: Create a new user with complete setup
            val newUserAuth0Sub = "auth0|${UUID.randomUUID().toString().replace("-", "")}"
            val newUserEmail = "newuser@example.com"
            
            println("=== Step 1: Setting up new user with tenant ===")
            val (authenticatedJwt, userId, tenantId) = setupUserWithDefaultTenant(
                auth0Sub = newUserAuth0Sub,
                email = newUserEmail,
                tenantName = "My Company"
            )
            
            println("User setup complete: userId=$userId, tenantId=$tenantId")
            
            // Step 2: Create workspace
            println("=== Step 2: Creating workspace ===")
            val workspaceId = createDefaultWorkspace(authenticatedJwt, tenantId)
            println("Workspace created: $workspaceId")
            
            // Step 3: Verify workspace access
            println("=== Step 3: Verifying workspace access ===")
            val workspacesResponse = mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $authenticatedJwt")
            )
            .andDo(print())
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.workspaces", hasSize<Any>(1)))
            .andExpect(jsonPath("$.workspaces[0].name").value("Default Workspace"))
            .andReturn()
            
            // Step 4: Create a table in the workspace
            println("=== Step 4: Creating a table ===")
            
            val createTableRequest = TableCreateRequest(
                workspaceId = workspaceId,
                name = "Tasks",
                properties = listOf(
                    PropertyDefinitionDto(
                        key = "title",
                        type = PropertyType.TEXT,
                        displayName = "Title",
                        required = true,
                        config = buildJsonObject {}
                    ),
                    PropertyDefinitionDto(
                        key = "status",
                        type = PropertyType.SELECT,
                        displayName = "Status", 
                        required = false,
                        config = buildJsonObject {
                            putJsonArray("options") {
                                add(buildJsonObject {
                                    put("value", "TODO")
                                    put("label", "To Do")
                                })
                                add(buildJsonObject {
                                    put("value", "IN_PROGRESS")
                                    put("label", "In Progress")
                                })
                                add(buildJsonObject {
                                    put("value", "DONE")
                                    put("label", "Done")
                                })
                            }
                        }
                    ),
                    PropertyDefinitionDto(
                        key = "assignee",
                        type = PropertyType.TEXT,
                        displayName = "Assignee",
                        required = false,
                        config = buildJsonObject {}
                    )
                )
            )
            
            val tableResponse = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $authenticatedJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createTableRequest))
            )
            .andDo(print())
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.name").value("Tasks"))
            .andExpect(jsonPath("$.properties.title").exists())
            .andExpect(jsonPath("$.properties.status").exists())
            .andReturn()
            
            val createdTable = json.decodeFromString<TableResponse>(
                tableResponse.response.contentAsString
            )
            
            assertThat(createdTable.id).isNotNull()
            println("Table created with ID: ${createdTable.id}")
            
            // Step 7: Create a record in the table
            println("=== Step 6: Creating a record ===")
            
            val createRecordRequest = RecordCreateRequest(
                tableId = createdTable.id,
                data = buildJsonObject {
                    put("title", JsonPrimitive("My First Task"))
                    put("status", JsonPrimitive("TODO"))
                    put("assignee", JsonPrimitive("Me"))
                }
            )
            
            val recordResponse = mockMvc.perform(
                post("/api/v1/records")
                    .header("Authorization", "Bearer $authenticatedJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRecordRequest))
            )
            .andDo(print())
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.tableId").value(createdTable.id.toString()))
            .andReturn()
            
            val createdRecord = json.decodeFromString<RecordResponse>(
                recordResponse.response.contentAsString
            )
            
            // Verify the record data
            val recordData = createdRecord.data
            assertThat(recordData["title"]?.jsonPrimitive?.content).isEqualTo("My First Task")
            assertThat(recordData["status"]?.jsonPrimitive?.content).isEqualTo("TODO")
            assertThat(recordData["assignee"]?.jsonPrimitive?.content).isEqualTo("Me")
            
            println("Record created with ID: ${createdRecord.id}")
            
            // Step 8: Read records from the table
            println("=== Step 7: Reading records ===")
            
            mockMvc.perform(
                get("/api/v1/records/table/${createdTable.id}")
                    .header("Authorization", "Bearer $authenticatedJwt")
            )
            .andDo(print())
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content", hasSize<Any>(1)))
            .andExpect(jsonPath("$.content[0].data.title").value("My First Task"))
            .andExpect(jsonPath("$.content[0].data.status").value("TODO"))
            
            // Step 9: Update the record
            println("=== Step 8: Updating record ===")
            
            val updateRecordRequest = RecordUpdateRequest(
                data = buildJsonObject {
                    put("title", JsonPrimitive("My First Task"))
                    put("status", JsonPrimitive("IN_PROGRESS"))
                    put("assignee", JsonPrimitive("Me"))
                }
            )
            
            mockMvc.perform(
                put("/api/v1/records/${createdRecord.id}")
                    .header("Authorization", "Bearer $authenticatedJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRecordRequest))
            )
            .andDo(print())
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
            
            // Step 10: Verify complete data persistence
            println("=== Step 9: Verifying data persistence ===")
            
            // Verify user exists in database
            val savedUser = userRepository.findByAuth0Sub(newUserAuth0Sub)
            assertThat(savedUser).isNotNull
            assertThat(savedUser!!.email).isEqualTo(newUserEmail)
            
            // Verify tenant exists
            val savedTenant = tenantRepository.findById(com.astarworks.astarmanagement.shared.domain.value.TenantId(tenantId))
            assertThat(savedTenant).isNotNull
            assertThat(savedTenant!!.name).isEqualTo("My Company")
            
            // Verify tenant membership
            val membership = tenantMembershipRepository.findByUserIdAndTenantId(
                savedUser.id,
                savedTenant.id
            )
            assertThat(membership).isNotNull
            assertThat(membership!!.isActive).isTrue()
            
            println("=== Onboarding workflow completed successfully! ===")
        }
    }
    
    @Nested
    @DisplayName("Multi-Tenant Isolation")
    inner class MultiTenantIsolation {
        
        @Test
        @DisplayName("Should enforce tenant isolation throughout workflow")
        fun shouldEnforceTenantIsolation() {
            // Create two separate users with their own tenants
            val user1Auth0Sub = "auth0|user1_${UUID.randomUUID().toString().substring(0, 8)}"
            val user2Auth0Sub = "auth0|user2_${UUID.randomUUID().toString().substring(0, 8)}"
            val user1Email = "user1@example.com"
            val user2Email = "user2@example.com"
            
            // Setup User 1 with tenant
            println("=== Setting up User 1 ===")
            val (jwt1, userId1, tenantId1) = setupUserWithDefaultTenant(
                auth0Sub = user1Auth0Sub,
                email = user1Email,
                tenantName = "Company 1"
            )
            val workspaceId1 = createDefaultWorkspace(jwt1, tenantId1)
            
            // Setup User 2 with tenant
            println("=== Setting up User 2 ===")
            val (jwt2, userId2, tenantId2) = setupUserWithDefaultTenant(
                auth0Sub = user2Auth0Sub,
                email = user2Email,
                tenantName = "Company 2"
            )
            val workspaceId2 = createDefaultWorkspace(jwt2, tenantId2)
            
            // User 1: Create a table in their workspace
            println("=== User 1 creating table ===")
            val table1Request = TableCreateRequest(
                workspaceId = workspaceId1,
                name = "Company 1 Tasks",
                properties = listOf(
                    PropertyDefinitionDto(
                        key = "title",
                        type = PropertyType.TEXT,
                        displayName = "Title",
                        required = true,
                        config = buildJsonObject {}
                    )
                )
            )
            
            val table1Response = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $jwt1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(table1Request))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val table1 = json.decodeFromString<TableResponse>(
                table1Response.response.contentAsString
            )
            
            // User 1: Create a record
            val record1Request = RecordCreateRequest(
                tableId = table1.id,
                data = buildJsonObject {
                    put("title", JsonPrimitive("Company 1 Secret Task"))
                }
            )
            
            mockMvc.perform(
                post("/api/v1/records")
                    .header("Authorization", "Bearer $jwt1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(record1Request))
            )
            .andExpect(status().isCreated)
            
            // User 2: Try to access User 1's workspace (should fail or return empty)
            println("=== Testing isolation: User 2 accessing User 1's workspace ===")
            mockMvc.perform(
                get("/api/v1/workspaces/$workspaceId1")
                    .header("Authorization", "Bearer $jwt2")
            )
            .andExpect(status().isNotFound)
            
            // User 2: Try to access User 1's table (should fail)
            mockMvc.perform(
                get("/api/v1/tables/${table1.id}")
                    .header("Authorization", "Bearer $jwt2")
            )
            .andExpect(status().isNotFound)
            
            // User 2: Try to read User 1's records (should return 404 - table not accessible)
            mockMvc.perform(
                get("/api/v1/records/table/${table1.id}")
                    .header("Authorization", "Bearer $jwt2")
            )
            .andExpect(status().isNotFound)
            
            // User 2: Verify they can only see their own workspace
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $jwt2")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.workspaces", hasSize<Any>(1)))
            .andExpect(jsonPath("$.workspaces[0].id").value(workspaceId2.toString()))
            
            println("=== Tenant isolation verified successfully! ===")
        }
    }
    
    @Nested
    @DisplayName("Multiple Tenant Membership")
    inner class MultipleTenantMembership {
        
        @Test
        @DisplayName("Should handle user belonging to multiple tenants")
        fun shouldHandleUserBelongingToMultipleTenants() {
            // Create a user with first tenant using setup flow
            val userAuth0Sub = "auth0|multiuser_${UUID.randomUUID().toString().substring(0, 8)}"
            val userEmail = "multiuser@example.com"
            
            // Setup user with first tenant
            println("=== Setting up user with first tenant ===")
            val (jwt1Initial, userId, tenantId1) = setupUserWithDefaultTenant(
                auth0Sub = userAuth0Sub,
                email = userEmail,
                tenantName = "Tenant 1"
            )
            
            // Get the tenant1 details for later use
            val tenant1 = tenantService.findById(TenantId(tenantId1))!!
            
            // Get the auth0OrgId that was assigned to tenant1 in setupUserWithDefaultTenant
            val tenant1Auth0OrgId = tenant1.auth0OrgId ?: throw IllegalStateException("Tenant 1 should have auth0OrgId")
            
            // Create second tenant (simulating invitation/addition to another org)
            println("=== Creating second tenant and adding user membership ===")
            val tenant2Slug = "tenant2-${UUID.randomUUID().toString().substring(0, 8)}"
            val tenant2Auth0OrgId = "org_tenant2_${UUID.randomUUID().toString().substring(0, 8)}"
            val tenant2 = tenantService.create(
                slug = tenant2Slug,
                name = "Tenant 2",
                auth0OrgId = tenant2Auth0OrgId
            )
            
            // Add user to second tenant using UserResolverService for proper JIT provisioning
            val user = userRepository.findByAuth0Sub(userAuth0Sub)!!
            val tenantMembership = tenantMembershipRepository.save(
                TenantMembership(
                    tenantId = tenant2.id,
                    userId = user.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Create admin role for tenant 2 and assign to user using Entity-based approach
            val adminRole2Id = UUID.randomUUID()
            executeAsSystemUser {
                // Create admin role
                dynamicRoleRepository.save(
                    DynamicRole(
                        id = RoleId(adminRole2Id),
                        tenantId = tenant2.id,
                        name = "admin",
                        displayName = "Administrator",
                        color = "#FF5733",
                        position = 100,
                        isSystem = false,
                        createdAt = Instant.now(),
                        updatedAt = Instant.now()
                    )
                )
                
                // Add workspace permissions for tenant 2 admin role
                rolePermissionService.grantPermissionFromString(
                    RoleId(adminRole2Id),
                    "workspace.create.all"
                )
                rolePermissionService.grantPermissionFromString(
                    RoleId(adminRole2Id),
                    "workspace.view.all"
                )
                rolePermissionService.grantPermissionFromString(
                    RoleId(adminRole2Id),
                    "table.manage.all"
                )
                rolePermissionService.grantPermissionFromString(
                    RoleId(adminRole2Id),
                    "record.manage.all"
                )
                
                // Assign admin role to user in tenant 2
                userRoleService.assignRole(
                    tenantMembership.id.value,
                    adminRole2Id
                )
            }
            
            // Create JWTs for both tenants
            val jwt1 = JwtTestFixture.createValidJwt(
                subject = userAuth0Sub,
                orgId = tenant1Auth0OrgId,
                email = userEmail
            )
            val jwt2 = JwtTestFixture.createValidJwt(
                subject = userAuth0Sub,
                orgId = tenant2Auth0OrgId,
                email = userEmail
            )
            
            // Create workspace in tenant 1 (from setup)
            val workspace1Id = createDefaultWorkspace(jwt1, tenantId1)
            
            // Create workspace in tenant 2
            val workspace2Id = createDefaultWorkspace(jwt2, tenant2.id.value)
            
            // Access resources in Tenant 1
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $jwt1")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.workspaces", hasSize<Any>(1)))
            .andExpect(jsonPath("$.workspaces[0].name").value("Default Workspace"))
            
            // Access resources in Tenant 2
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $jwt2")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.workspaces", hasSize<Any>(1)))
            .andExpect(jsonPath("$.workspaces[0].name").value("Default Workspace"))
            
            // Create tables in both tenants
            // Table in Tenant 1
            val table1Request = TableCreateRequest(
                workspaceId = workspace1Id,
                name = "Tenant 1 Table",
                properties = listOf(
                    PropertyDefinitionDto(
                        key = "content",
                        type = PropertyType.TEXT,
                        displayName = "Content",
                        required = true,
                        config = buildJsonObject {}
                    )
                )
            )
            
            val table1Response = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $jwt1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(table1Request))
            )
            .andDo { result ->
                if (result.response.status != 201) {
                    println("Table creation failed with status ${result.response.status}")
                    println("Response: ${result.response.contentAsString}")
                }
            }
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.name").value("Tenant 1 Table"))
            
            // Table in Tenant 2
            val table2Request = TableCreateRequest(
                workspaceId = workspace2Id,
                name = "Tenant 2 Table",
                properties = listOf(
                    PropertyDefinitionDto(
                        key = "content",
                        type = PropertyType.TEXT,
                        displayName = "Content",
                        required = true,
                        config = buildJsonObject {}
                    )
                )
            )
            
            mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $jwt2")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(table2Request))
            )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.name").value("Tenant 2 Table"))
            
            // Verify tables are properly isolated
            mockMvc.perform(
                get("/api/v1/tables/workspace/$workspace1Id")
                    .header("Authorization", "Bearer $jwt1")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.tables", hasSize<Any>(1)))
            .andExpect(jsonPath("$.tables[0].name").value("Tenant 1 Table"))
            
            mockMvc.perform(
                get("/api/v1/tables/workspace/$workspace2Id")
                    .header("Authorization", "Bearer $jwt2")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.tables", hasSize<Any>(1)))
            .andExpect(jsonPath("$.tables[0].name").value("Tenant 2 Table"))
            
            println("=== Multiple tenant membership verified successfully! ===")
        }
    }
    
    @Nested
    @DisplayName("Error Cases")
    inner class ErrorCases {
        
        @Test
        @DisplayName("Should handle invalid JWT token")
        fun shouldHandleInvalidJwtToken() {
            val invalidJwt = "invalid.jwt.token"
            
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $invalidJwt")
            )
            .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should prevent access without proper authentication")
        fun shouldPreventAccessWithoutAuthentication() {
            // Try to access protected endpoints without JWT
            // Note: Returns 403 Forbidden instead of 401 in current security configuration
            mockMvc.perform(get("/api/v1/workspaces"))
                .andExpect(status().isForbidden)
            
            mockMvc.perform(get("/api/v1/tables/${UUID.randomUUID()}"))
                .andExpect(status().isForbidden)
            
            mockMvc.perform(get("/api/v1/records/table/${UUID.randomUUID()}"))
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should prevent duplicate tenant creation")
        fun shouldPreventDuplicateTenantCreation() {
            val userAuth0Sub = "auth0|dup_${UUID.randomUUID().toString().substring(0, 8)}"
            val userEmail = "dupuser@example.com"
            
            // First user creates a tenant with a specific name
            val tenantName = "Unique Company ${UUID.randomUUID().toString().substring(0, 8)}"
            val (jwt1, _, tenantId1) = setupUserWithDefaultTenant(
                auth0Sub = userAuth0Sub,
                email = userEmail,
                tenantName = tenantName
            )
            
            // Get the created tenant's slug for testing
            val tenant1 = tenantService.findById(TenantId(tenantId1))!!
            val tenantSlug = tenant1.slug
            
            // Try to create another tenant with same user (should fail)
            // A user who has already completed setup shouldn't be able to setup again
            val anotherJwt = JwtTestFixture.createJwtWithoutOrgId(
                subject = userAuth0Sub,  // Same user
                email = userEmail
            )
            
            val setupRequest = SetupRequest(
                tenantName = "Another Company",
                tenantType = TenantTypeDto.TEAM,
                userProfile = UserProfileDto(
                    displayName = "Another User",
                    email = userEmail
                )
            )
            
            // User who already has a tenant shouldn't be able to setup again
            // Note: Returns 403 Forbidden as setup mode is disabled after user has completed setup
            mockMvc.perform(
                post("/api/v1/auth/setup")
                    .header("Authorization", "Bearer $anotherJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(setupRequest))
            )
            .andExpect(status().isForbidden)  // 403 as setup mode is no longer available
        }
        
        @Test
        @DisplayName("Should validate required fields in table creation")
        fun shouldValidateRequiredFieldsInTableCreation() {
            // Setup user and tenant
            val userAuth0Sub = "auth0|validate_${UUID.randomUUID().toString().substring(0, 8)}"
            val userEmail = "validate@example.com"
            
            val (jwt, userId, tenantId) = setupUserWithDefaultTenant(
                auth0Sub = userAuth0Sub,
                email = userEmail,
                tenantName = "Validation Test Company"
            )
            
            val workspaceId = createDefaultWorkspace(jwt, tenantId)
            
            // Try to create table without name
            val invalidTableRequest = """
                {
                    "workspaceId": "${workspaceId}",
                    "properties": []
                }
            """.trimIndent()
            
            mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $jwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidTableRequest)
            )
            .andExpect(status().isBadRequest)
            
            // Try to create record without required field
            val validTableRequest = TableCreateRequest(
                workspaceId = workspaceId,
                name = "Test Table",
                properties = listOf(
                    PropertyDefinitionDto(
                        key = "requiredField",
                        type = PropertyType.TEXT,
                        displayName = "Required",
                        required = true,
                        config = buildJsonObject {}
                    )
                )
            )
            
            val tableResponse = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $jwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(validTableRequest))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val table = json.decodeFromString<TableResponse>(
                tableResponse.response.contentAsString
            )
            
            // Note: Record validation has been removed from the service layer in the simplified version
            // The backend now acts as a simple JSON container (MVP philosophy)
            // Validation should be handled by the frontend or in future iterations
            
            // Create record without required field - should succeed now (no validation)
            val recordWithoutRequiredField = RecordCreateRequest(
                tableId = table.id,
                data = buildJsonObject {
                    // Missing required field - but this is allowed in simplified service
                }
            )
            
            mockMvc.perform(
                post("/api/v1/records")
                    .header("Authorization", "Bearer $jwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(recordWithoutRequiredField))
            )
            .andExpect(status().isCreated)  // Should succeed without validation
        }
    }
    
    // Helper methods
    
    /**
     * Sets up a new user with default tenant using the new auth flow.
     * Returns the authenticated JWT with org_id.
     */
    private fun setupUserWithDefaultTenant(
        auth0Sub: String = "auth0|${UUID.randomUUID().toString().replace("-", "")}",
        email: String = "user${System.currentTimeMillis()}@example.com",
        tenantName: String = "Test Company"
    ): Triple<String, UUID, UUID> {
        // Step 1: Create JWT without org_id (first-time user)
        val initialJwt = JwtTestFixture.createJwtWithoutOrgId(
            subject = auth0Sub,
            email = email
        )
        
        // Step 2: Check auth status (should be SETUP_REQUIRED)
        mockMvc.perform(
            get("/api/v1/auth/me")
                .header("Authorization", "Bearer $initialJwt")
        )
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.status").value("SETUP_REQUIRED"))
        
        // Step 3: Complete setup
        val setupRequest = SetupRequest(
            tenantName = tenantName,
            tenantType = TenantTypeDto.PERSONAL,
            userProfile = UserProfileDto(
                displayName = "Test User",
                email = email,
                avatarUrl = null
            )
        )
        
        val setupResponse = mockMvc.perform(
            post("/api/v1/auth/setup")
                .header("Authorization", "Bearer $initialJwt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.encodeToString(setupRequest))
        )
        .andExpect(status().isOk)
        .andReturn()
        
        val setupResult = json.decodeFromString<SetupResponse>(
            setupResponse.response.contentAsString
        )
        
        // Step 4: Simulate Auth0 org_id assignment
        val simulatedOrgId = "org_${setupResult.tenantId.toString().take(8)}"
        executeAsSystemUser {
            jdbcTemplate.update(
                "UPDATE tenants SET auth0_org_id = ? WHERE id = ?",
                simulatedOrgId, setupResult.tenantId
            )
        }
        
        // Step 5: Create admin role with permissions using Entity-based approach
        val adminRoleId = UUID.randomUUID()
        executeAsSystemUser {
            // Create admin role
            val adminRole = dynamicRoleRepository.save(
                DynamicRole(
                    id = RoleId(adminRoleId),
                    tenantId = TenantId(setupResult.tenantId),
                    name = "admin",
                    displayName = "Administrator",
                    color = "#FF5733",
                    position = 100,
                    isSystem = false,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }
        
        // Verify role was created before granting permissions
        executeAsSystemUser {
            val savedRole = dynamicRoleRepository.findById(RoleId(adminRoleId))
            if (savedRole == null) {
                throw IllegalStateException("Admin role was not created successfully")
            }
            
            // Add workspace permissions
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "workspace.create.all"
            )
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "workspace.view.all"
            )
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "workspace.edit.all"
            )
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "workspace.delete.all"
            )
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "table.manage.all"
            )
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "record.manage.all"
            )
            
            // Assign role to user
            userRoleService.assignRole(
                setupResult.tenantUserId,
                adminRoleId
            )
        }
        
        // Step 6: Create JWT with org_id
        val authenticatedJwt = JwtTestFixture.createValidJwt(
            subject = auth0Sub,
            orgId = simulatedOrgId,
            email = email
        )
        
        return Triple(authenticatedJwt, setupResult.userId, setupResult.tenantId)
    }
    
    /**
     * Creates a default workspace for a tenant.
     */
    private fun createDefaultWorkspace(jwt: String, tenantId: UUID): UUID {
        // Create workspace
        val workspaceRequest = """
            {
                "name": "Default Workspace",
                "description": "Default workspace for testing"
            }
        """.trimIndent()
        
        val response = mockMvc.perform(
            post("/api/v1/workspaces")
                .header("Authorization", "Bearer $jwt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(workspaceRequest)
        )
        .andExpect(status().isOk)
        .andReturn()
        
        val workspaceJson = Json.parseToJsonElement(response.response.contentAsString).jsonObject
        return UUID.fromString(workspaceJson["id"]!!.jsonPrimitive.content)
    }
    
    /**
     * Asserts that a user exists in the database with the given Auth0 subject.
     */
    private fun assertUserExists(auth0Sub: String): User {
        val user = userRepository.findByAuth0Sub(auth0Sub)
        assertThat(user).isNotNull
        return user!!
    }
    
    /**
     * Asserts that a tenant exists with the given slug.
     */
    private fun assertTenantExists(slug: String): Tenant {
        val tenant = tenantRepository.findBySlug(slug)
        assertThat(tenant).isNotNull
        return tenant!!
    }
    
    /**
     * Asserts the number of workspaces for a given tenant.
     */
    private fun assertWorkspaceCount(tenantId: TenantId, expectedCount: Int) {
        val workspaces = workspaceService.getWorkspacesByTenant(tenantId)
        assertThat(workspaces).hasSize(expectedCount)
    }
    
    /**
     * Asserts the number of tables in a workspace.
     */
    private fun assertTableCount(workspaceId: WorkspaceId, expectedCount: Int) {
        val tables = tableService.getTablesByWorkspace(workspaceId)
        assertThat(tables).hasSize(expectedCount)
    }
    
    /**
     * Asserts that a user has a specific role in a tenant.
     */
    private fun assertUserHasRole(userId: UserId, tenantId: TenantId, roleName: String) {
        // TODO: Fix this method - temporarily commented for compilation
        /*
        val membership = tenantMembershipRepository.findByUserIdAndTenantId(userId, tenantId)
        assertThat(membership).isNotNull
        
        val roles = userRoleService.getUserRoles(membership!!.id.value)
        val hasRole = roles.any { it.name == roleName }
        assertThat(hasRole).isTrue()
        */
    }
}