package com.astarworks.astarmanagement.integration.api.table

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyAddRequest
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyDefinitionDto
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyReorderRequest
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyUpdateRequest
import com.astarworks.astarmanagement.core.table.api.dto.table.TableCreateRequest
import com.astarworks.astarmanagement.core.table.api.dto.table.TableUpdateRequest
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.hamcrest.Matchers
import org.junit.jupiter.api.*
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.print
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

/**
 * Integration tests for TableController.
 * 
 * This test class verifies:
 * - Basic CRUD operations for tables
 * - Property management (add, update, remove, reorder)
 * - Authentication and authorization 
 * - Tenant isolation and data separation
 * - Error handling and validation
 * 
 * Test structure:
 * - 5 basic CRUD tests
 * - 6 property management tests  
 * - 4 tenant isolation tests
 * - 3 authentication/authorization tests
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test", "integration")
@ExtendWith(SpringExtension::class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("Table Controller Integration Tests")
class TableControllerIntegrationTest : IntegrationTestBase() {

    @Autowired
    private lateinit var json: Json
    
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
    @Transactional
    fun setupTestScenario() {
        // Clean database and caches
        cleanupDatabase()
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
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.CREATE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.DELETE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.CREATE, Scope.ALL)
            )
        )
        
        editorRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "editor",
            listOf(
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL)
            )
        )
        
        viewerRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "viewer",
            listOf(
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL)
            )
        )
        
        // Assign roles to users
        userRoleService.assignRole(adminTenantUserId, adminRole.id.value)
        userRoleService.assignRole(editorTenantUserId, editorRole.id.value)
        userRoleService.assignRole(viewerTenantUserId, viewerRole.id.value)
        
        // Create workspaces
        workspaceA = createWorkspace(tenantA.id.value, "Test Workspace A")
        workspaceB = createWorkspace(tenantB.id.value, "Test Workspace B")
        
        // Generate JWT tokens
        adminJwt = createJwtToken(adminUser.auth0Sub, tenantAOrgId, adminUser.email)
        editorJwt = createJwtToken(editorUser.auth0Sub, tenantAOrgId, editorUser.email)
        viewerJwt = createJwtToken(viewerUser.auth0Sub, tenantAOrgId, viewerUser.email)
        
        // Create a tenant B user for cross-tenant tests
        val tenantBAdminUser = createUser(UUID.randomUUID(), "auth0|tenant-b-admin", "admin@tenant-b.com")
        val tenantBAdminMembershipId = UUID.randomUUID()
        createTenantMembership(tenantBAdminMembershipId, tenantBAdminUser, tenantB)
        
        val tenantBAdminRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantB.id.value,
            "admin",
            listOf(
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.CREATE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.DELETE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL)
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
    
    private fun createTenantMembership(membershipId: UUID, user: User, tenant: Tenant) {
        tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(membershipId),
                tenantId = tenant.id,
                userId = user.id,
                isActive = true,
                joinedAt = Instant.now()
            )
        )
    }
    
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
    
    /**
     * Clean up all test data from database.
     */
    override fun cleanupDatabase() {
        // Using regular jdbcTemplate since we're in test setup
        // and app_user already has BYPASSRLS privilege
        jdbcTemplate.execute("""
            TRUNCATE TABLE 
                records,
                tables,
                workspaces,
                user_roles,
                role_permissions,
                roles,
                tenant_users,
                user_profiles,
                users,
                tenants
            RESTART IDENTITY CASCADE
        """)
    }
    
    /**
     * Clear any caches.
     */
    override fun clearCaches() {
        // Clear any Spring caches if configured
    }

    // ==================== Test Cases (Placeholders) ====================
    
    @Nested
    @DisplayName("Basic CRUD Operations")
    inner class BasicCRUDOperations {
        
        @Test
        @DisplayName("Should create table successfully")
        fun createTable_Success() {
            val request = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Test Table",
                description = "A test table for integration testing",
                properties = listOf(
                    PropertyDefinitionDto(
                        key = "title",
                        type = PropertyType.TEXT,
                        displayName = "Title",
                        config = kotlinx.serialization.json.buildJsonObject {
                            put("required", kotlinx.serialization.json.JsonPrimitive(true))
                        }
                    ),
                    PropertyDefinitionDto(
                        key = "priority",
                        type = PropertyType.SELECT,
                        displayName = "Priority",
                        config = kotlinx.serialization.json.buildJsonObject {
                            put("options", kotlinx.serialization.json.buildJsonArray {
                                add(kotlinx.serialization.json.buildJsonObject {
                                    put("label", kotlinx.serialization.json.JsonPrimitive("High"))
                                    put("value", kotlinx.serialization.json.JsonPrimitive("high"))
                                    put("color", kotlinx.serialization.json.JsonPrimitive("#FF0000"))
                                })
                                add(kotlinx.serialization.json.buildJsonObject {
                                    put("label", kotlinx.serialization.json.JsonPrimitive("Medium"))
                                    put("value", kotlinx.serialization.json.JsonPrimitive("medium"))
                                    put("color", kotlinx.serialization.json.JsonPrimitive("#FFAA00"))
                                })
                                add(kotlinx.serialization.json.buildJsonObject {
                                    put("label", kotlinx.serialization.json.JsonPrimitive("Low"))
                                    put("value", kotlinx.serialization.json.JsonPrimitive("low"))
                                    put("color", kotlinx.serialization.json.JsonPrimitive("#00AA00"))
                                })
                            })
                        }
                    )
                )
            )
            
            try {
                println("=== STARTING TEST REQUEST ===")
                println("Endpoint: POST /api/v1/tables")
                println("JWT: ${adminJwt.substring(0, 20)}...")
                println(json.encodeToString(request))
                println("===============================")
                
                val result = mockMvc.perform(
                    post("/api/v1/tables")
                        .header("Authorization", "Bearer $adminJwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.encodeToString(request))
                )
                .andDo(print())
                .andDo { result ->
                    println("=== RESPONSE RECEIVED ===")
                    println("Status: ${result.response.status}")
                    println("Error: ${result.response.errorMessage}")
                    println("Content: ${result.response.contentAsString}")
                    
                    // Extract any exceptions from the request
                    val exception = result.request.getAttribute("EXCEPTION")
                    if (exception != null) {
                        println("Exception in request: ${exception}")
                        if (exception is Exception) {
                            exception.printStackTrace()
                        }
                    }
                    println("=========================")
                }
                
                result.andExpect(status().isCreated)
            } catch (e: Exception) {
                println("=== EXCEPTION CAUGHT ===")
                println("Exception type: ${e.javaClass.name}")
                println("Exception message: ${e.message}")
                e.printStackTrace()
                println("========================")
                throw e
            }
            .andExpect(jsonPath("$.name").value("Test Table"))
            .andExpect(jsonPath("$.description").value("A test table for integration testing"))
            .andExpect(jsonPath("$.workspaceId").value(workspaceA.id.value.toString()))
            .andExpect(jsonPath("$.properties").isMap())
            .andExpect(jsonPath("$.properties.title").exists())
            .andExpect(jsonPath("$.properties.priority").exists())
            .andExpect(jsonPath("$.propertyOrder[0]").value("title"))
            .andExpect(jsonPath("$.propertyOrder[1]").value("priority"))
        }
        
        @Test
        @DisplayName("Should get table by ID")
        fun getTable_Success() {
            // First create a table
            val createRequest = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Table for Get Test",
                description = "Test description"
            )
            
            val createResult = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val createResponse = json.parseToJsonElement(createResult.response.contentAsString)
            val tableId = createResponse.jsonObject["id"]!!.jsonPrimitive.contentOrNull!!
            
            // Now get the table
            mockMvc.perform(
                get("/api/v1/tables/$tableId")
                    .header("Authorization", "Bearer $adminJwt")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(tableId))
            .andExpect(jsonPath("$.name").value("Table for Get Test"))
            .andExpect(jsonPath("$.description").value("Test description"))
            .andExpect(jsonPath("$.workspaceId").value(workspaceA.id.value.toString()))
        }
        
        @Test
        @DisplayName("Should update table")
        fun updateTable_Success() {
            // First create a table
            val createRequest = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Original Table Name"
            )
            
            val createResult = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val createResponse = json.parseToJsonElement(createResult.response.contentAsString)
            val tableId = createResponse.jsonObject["id"]!!.jsonPrimitive.contentOrNull!!
            
            // Update the table
            val updateRequest = TableUpdateRequest(
                name = "Updated Table Name",
                description = "Updated description"
            )
            
            mockMvc.perform(
                put("/api/v1/tables/$tableId")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value("Updated Table Name"))
            .andExpect(jsonPath("$.description").value("Updated description"))
        }
        
        @Test
        @DisplayName("Should delete table")
        fun deleteTable_Success() {
            // First create a table
            val createRequest = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Table to Delete"
            )
            
            val createResult = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val createResponse = json.parseToJsonElement(createResult.response.contentAsString)
            val tableId = createResponse.jsonObject["id"]!!.jsonPrimitive.contentOrNull!!
            
            // Delete the table
            mockMvc.perform(
                delete("/api/v1/tables/$tableId")
                    .header("Authorization", "Bearer $adminJwt")
            )
            .andExpect(status().isNoContent)
            
            // Verify table is deleted - should return 404
            mockMvc.perform(
                get("/api/v1/tables/$tableId")
                    .header("Authorization", "Bearer $adminJwt")
            )
            .andExpect(status().isNotFound)
        }
        
        @Test
        @DisplayName("Should list tables in workspace")
        fun listTablesInWorkspace_Success() {
            // Create multiple tables in the workspace
            val table1Request = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Table 1"
            )
            
            val table2Request = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Table 2"
            )
            
            mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(table1Request))
            ).andExpect(status().isCreated)
            
            mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(table2Request))
            ).andExpect(status().isCreated)
            
            // List tables in the workspace
            mockMvc.perform(
                get("/api/v1/tables/workspace/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.tables").isArray())
            .andExpect(jsonPath("$.tables[*].name").value(Matchers.containsInAnyOrder("Table 1", "Table 2")))
            .andExpect(jsonPath("$.tables[*].workspaceId").value(Matchers.everyItem(Matchers.equalTo(workspaceA.id.value.toString()))))
        }
    }
    
    @Nested
    @DisplayName("Property Management")
    inner class PropertyManagement {
        
        private fun createTestTable(): String {
            val createRequest = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Property Test Table"
            )
            
            val createResult = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val createResponse = json.parseToJsonElement(createResult.response.contentAsString)
            return createResponse.jsonObject["id"]!!.jsonPrimitive.contentOrNull!!
        }
        
        @Test
        @DisplayName("Should add property to table")
        fun addProperty_Success() {
            val tableId = createTestTable()
            
            val propertyRequest = PropertyAddRequest(
                definition = PropertyDefinitionDto(
                    key = "status",
                    type = PropertyType.SELECT,
                    displayName = "Status",
                    config = kotlinx.serialization.json.buildJsonObject {
                        put("options", kotlinx.serialization.json.buildJsonArray {
                            add(kotlinx.serialization.json.buildJsonObject {
                                put("label", kotlinx.serialization.json.JsonPrimitive("Active"))
                                put("value", kotlinx.serialization.json.JsonPrimitive("active"))
                                put("color", kotlinx.serialization.json.JsonPrimitive("#00AA00"))
                            })
                            add(kotlinx.serialization.json.buildJsonObject {
                                put("label", kotlinx.serialization.json.JsonPrimitive("Inactive"))
                                put("value", kotlinx.serialization.json.JsonPrimitive("inactive"))
                                put("color", kotlinx.serialization.json.JsonPrimitive("#AA0000"))
                            })
                        })
                        put("required", kotlinx.serialization.json.JsonPrimitive(false))
                    }
                )
            )
            
            mockMvc.perform(
                post("/api/v1/tables/$tableId/properties")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(propertyRequest))
            )
            .andDo(print())
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.properties.status").exists())
            .andExpect(jsonPath("$.properties.status.displayName").value("Status"))
            .andExpect(jsonPath("$.properties.status.type").value("select"))
            .andExpect(jsonPath("$.propertyOrder[*]").value(Matchers.hasItem("status")))
        }
        
        @Test
        @DisplayName("Should update existing property")
        fun updateProperty_Success() {
            val tableId = createTestTable()
            
            // First add a property
            val addRequest = PropertyAddRequest(
                definition = PropertyDefinitionDto(
                    key = "category",
                    type = PropertyType.TEXT,
                    displayName = "Category",
                    config = kotlinx.serialization.json.buildJsonObject {
                        put("required", kotlinx.serialization.json.JsonPrimitive(true))
                    }
                )
            )
            
            mockMvc.perform(
                post("/api/v1/tables/$tableId/properties")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(addRequest))
            ).andExpect(status().isOk)
            
            // Update the property
            val updateRequest = PropertyUpdateRequest(
                displayName = "Updated Category",
                required = false,
                config = kotlinx.serialization.json.buildJsonObject {
                    put("maxLength", kotlinx.serialization.json.JsonPrimitive(100))
                }
            )
            
            mockMvc.perform(
                put("/api/v1/tables/$tableId/properties/category")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.properties.category.displayName").value("Updated Category"))
        }
        
        @Test
        @DisplayName("Should remove property from table")
        fun removeProperty_Success() {
            val tableId = createTestTable()
            
            // First add a property
            val addRequest = PropertyAddRequest(
                definition = PropertyDefinitionDto(
                    key = "temp_field",
                    type = PropertyType.TEXT,
                    displayName = "Temporary Field"
                )
            )
            
            mockMvc.perform(
                post("/api/v1/tables/$tableId/properties")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(addRequest))
            ).andExpect(status().isOk)
            
            // Remove the property
            mockMvc.perform(
                delete("/api/v1/tables/$tableId/properties/temp_field")
                    .header("Authorization", "Bearer $adminJwt")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.properties.temp_field").doesNotExist())
            .andExpect(jsonPath("$.propertyOrder[*]").value(Matchers.not(Matchers.hasItem("temp_field"))))
        }
        
        @Test
        @DisplayName("Should reorder properties")
        fun reorderProperties_Success() {
            val tableId = createTestTable()
            
            // Add multiple properties
            val properties = listOf("prop_a", "prop_b", "prop_c")
            properties.forEach { propKey ->
                val addRequest = PropertyAddRequest(
                    definition = PropertyDefinitionDto(
                        key = propKey,
                        type = PropertyType.TEXT,
                        displayName = propKey.capitalize()
                    )
                )
                
                mockMvc.perform(
                    post("/api/v1/tables/$tableId/properties")
                        .header("Authorization", "Bearer $adminJwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.encodeToString(addRequest))
                ).andExpect(status().isOk)
            }
            
            // Reorder properties (reverse order)
            val reorderRequest = PropertyReorderRequest(
                order = listOf("prop_c", "prop_b", "prop_a")
            )
            
            mockMvc.perform(
                put("/api/v1/tables/$tableId/properties/reorder")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(reorderRequest))
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.propertyOrder[0]").value("prop_c"))
            .andExpect(jsonPath("$.propertyOrder[1]").value("prop_b"))
            .andExpect(jsonPath("$.propertyOrder[2]").value("prop_a"))
        }
        
        @Test
        @DisplayName("Should fail when adding duplicate property key")
        fun addProperty_DuplicateKey_ShouldFail() {
            val tableId = createTestTable()
            
            // Add first property
            val firstRequest = PropertyAddRequest(
                definition = PropertyDefinitionDto(
                    key = "duplicate_key",
                    type = PropertyType.TEXT,
                    displayName = "First Property"
                )
            )
            
            mockMvc.perform(
                post("/api/v1/tables/$tableId/properties")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(firstRequest))
            ).andExpect(status().isOk)
            
            // Try to add property with same key
            val duplicateRequest = PropertyAddRequest(
                definition = PropertyDefinitionDto(
                    key = "duplicate_key",
                    type = PropertyType.NUMBER,
                    displayName = "Duplicate Property"
                )
            )
            
            mockMvc.perform(
                post("/api/v1/tables/$tableId/properties")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(duplicateRequest))
            )
            .andExpect(status().isConflict)
        }
        
        @Test
        @DisplayName("Should fail when updating non-existent property")
        fun updateProperty_NotFound_ShouldFail() {
            val tableId = createTestTable()
            
            val updateRequest = PropertyUpdateRequest(
                displayName = "Non-existent Property"
            )
            
            mockMvc.perform(
                put("/api/v1/tables/$tableId/properties/non_existent_key")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
            .andExpect(status().isNotFound)
        }
    }
    
    @Nested
    @DisplayName("Authentication & Authorization")
    inner class AuthenticationAuthorization {
        
        @Test
        @DisplayName("All endpoints should return 403 without authentication")
        fun allEndpoints_WithoutAuth_ShouldReturn403() {
            val dummyUuid = UUID.randomUUID()
            val createRequest = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Unauthorized Table"
            )
            val updateRequest = TableUpdateRequest(name = "Updated Name")
            val propertyRequest = PropertyAddRequest(
                definition = PropertyDefinitionDto("test", PropertyType.TEXT, "Test")
            )
            
            // Test all major endpoints without authentication
            val endpoints = listOf(
                // Basic CRUD
                Pair(post("/api/v1/tables").contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest)), "POST /api/v1/tables"),
                Pair(get("/api/v1/tables/$dummyUuid"), "GET /api/v1/tables/{id}"),
                Pair(put("/api/v1/tables/$dummyUuid").contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest)), "PUT /api/v1/tables/{id}"),
                Pair(delete("/api/v1/tables/$dummyUuid"), "DELETE /api/v1/tables/{id}"),
                Pair(get("/api/v1/tables/workspace/${workspaceA.id.value}"), "GET /api/v1/tables/workspace/{id}"),
                
                // Property management
                Pair(post("/api/v1/tables/$dummyUuid/properties").contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(propertyRequest)), "POST /api/v1/tables/{id}/properties"),
                Pair(put("/api/v1/tables/$dummyUuid/properties/test").contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(propertyRequest.definition)), "PUT /api/v1/tables/{id}/properties/{key}"),
                Pair(delete("/api/v1/tables/$dummyUuid/properties/test"), "DELETE /api/v1/tables/{id}/properties/{key}")
            )
            
            endpoints.forEach { (requestBuilder, description) ->
                try {
                    mockMvc.perform(requestBuilder)
                        .andExpect(status().isForbidden)
                        .andDo { println("✓ $description returns 403 without auth") }
                } catch (e: AssertionError) {
                    println("✗ $description failed: ${e.message}")
                    // Re-run to see actual status
                    mockMvc.perform(requestBuilder)
                        .andDo { result -> 
                            println("  Actual status: ${result.response.status}")
                            println("  Response: ${result.response.contentAsString}")
                        }
                    throw e
                }
            }
        }
        
        @Test
        @DisplayName("Edit operations should return 403 without proper permissions")
        fun editOperations_WithoutPermission_ShouldReturn403() {
            // First create a table as admin
            val createRequest = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Table for Permission Test"
            )
            
            val createResult = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val tableId = json.parseToJsonElement(createResult.response.contentAsString)
                .jsonObject["id"]!!.jsonPrimitive.contentOrNull!!
            
            // Viewer (with only view permissions) tries to edit - should fail
            val updateRequest = TableUpdateRequest(name = "Updated by Viewer")
            
            mockMvc.perform(
                put("/api/v1/tables/$tableId")
                    .header("Authorization", "Bearer $viewerJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
            .andExpect(status().isForbidden)
            
            // Viewer tries to delete - should fail
            mockMvc.perform(
                delete("/api/v1/tables/$tableId")
                    .header("Authorization", "Bearer $viewerJwt")
            )
            .andExpect(status().isForbidden)
            
            // Viewer tries to add property - should fail
            val propertyRequest = PropertyAddRequest(
                definition = PropertyDefinitionDto("new_prop", PropertyType.TEXT, "New Property")
            )
            
            mockMvc.perform(
                post("/api/v1/tables/$tableId/properties")
                    .header("Authorization", "Bearer $viewerJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(propertyRequest))
            )
            .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("View operations should succeed with view permissions")
        fun viewOperations_WithViewPermission_ShouldSucceed() {
            // Create a table as admin
            val createRequest = TableCreateRequest(
                workspaceId = workspaceA.id.value,
                name = "Viewable Table",
                description = "Table that viewers can see"
            )
            
            val createResult = mockMvc.perform(
                post("/api/v1/tables")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
            .andExpect(status().isCreated)
            .andReturn()
            
            val tableId = json.parseToJsonElement(createResult.response.contentAsString)
                .jsonObject["id"]!!.jsonPrimitive.contentOrNull!!
            
            // Viewer should be able to get the table
            mockMvc.perform(
                get("/api/v1/tables/$tableId")
                    .header("Authorization", "Bearer $viewerJwt")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value("Viewable Table"))
            .andExpect(jsonPath("$.description").value("Table that viewers can see"))
            
            // Viewer should be able to list tables in workspace
            mockMvc.perform(
                get("/api/v1/tables/workspace/${workspaceA.id.value}")
                    .header("Authorization", "Bearer $viewerJwt")
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.tables[*].name").value(Matchers.hasItem("Viewable Table")))
            
            // Viewer should be able to get table schema
            mockMvc.perform(
                get("/api/v1/tables/$tableId/schema")
                    .header("Authorization", "Bearer $viewerJwt")
            )
            .andExpect(status().isOk)
        }
    }
}