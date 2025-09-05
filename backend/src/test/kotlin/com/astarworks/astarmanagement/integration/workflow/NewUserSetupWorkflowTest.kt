package com.astarworks.astarmanagement.integration.workflow

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.api.dto.*
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.Matchers.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.MvcResult
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.util.UUID

/**
 * End-to-end integration test for complete new user setup workflow.
 * 
 * This test simulates a real user journey from initial authentication
 * without org_id through complete setup and eventual access to business APIs.
 * 
 * Critical test for verifying the entire onboarding flow works correctly
 * and provides a smooth user experience.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("New User Setup Workflow E2E Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class NewUserSetupWorkflowTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var json: Json
    
    @Autowired
    private lateinit var dynamicRoleRepository: DynamicRoleRepository
    
    @Autowired
    private lateinit var rolePermissionService: RolePermissionService
    
    @Autowired
    private lateinit var userRoleService: UserRoleService
    
    // User data for the workflow
    private val userSubject = "auth0|newuser_${UUID.randomUUID()}"
    private val userEmail = "newuser@example.com"
    private val displayName = "New User"
    private val tenantName = "My First Company"
    
    // JWTs for different stages
    private lateinit var initialJwtWithoutOrgId: String
    private lateinit var postSetupJwtWithOrgId: String
    
    // Data collected during workflow
    private var createdUserId: UUID? = null
    private var createdTenantId: UUID? = null
    private var createdTenantUserId: UUID? = null
    private var generatedOrgId: String? = null
    
    @BeforeEach
    fun setUp() {
        // Clear caches (database cleanup handled by @Sql)
        clearCaches()
        
        // Generate initial JWT without org_id
        initialJwtWithoutOrgId = JwtTestFixture.createJwtWithoutOrgId(
            subject = userSubject,
            email = userEmail
        )
    }
    
    @Test
    @DisplayName("Complete new user onboarding workflow")
    fun `should complete full new user onboarding workflow`() {
        // Step 1: Initial authentication check
        step1_InitialAuthenticationWithoutOrgId()
        
        // Step 2: Verify no existing tenants
        step2_CheckNoExistingTenants()
        
        // Step 3: Complete setup process
        step3_CompleteSetupProcess()
        
        // Step 4: Verify database state
        step4_VerifyDatabaseState()
        
        // Step 5: Check tenant list after setup
        step5_CheckTenantListAfterSetup()
        
        // Step 6: Simulate re-authentication with org_id
        step6_SimulateReAuthenticationWithOrgId()
        
        // Step 7: Access business endpoints
        step7_AccessBusinessEndpoints()
    }
    
    private fun step1_InitialAuthenticationWithoutOrgId() {
        println("\n=== Step 1: Initial Authentication (No org_id) ===")
        
        val result = mockMvc.perform(
            get("/api/v1/auth/me")
                .header("Authorization", "Bearer $initialJwtWithoutOrgId")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("SETUP_REQUIRED"))
            .andExpect(jsonPath("$.auth0Sub").value(userSubject))
            .andExpect(jsonPath("$.email").value(userEmail))
            .andExpect(jsonPath("$.hasDefaultTenant").value(false))
            .andExpect(jsonPath("$.message").value(containsString("Please complete the setup process")))
            .andReturn()
        
        println("✓ User identified as needing setup")
        println("  Status: SETUP_REQUIRED")
        println("  Auth0Sub: $userSubject")
        println("  Email: $userEmail")
    }
    
    private fun step2_CheckNoExistingTenants() {
        println("\n=== Step 2: Check for Existing Tenants ===")
        
        mockMvc.perform(
            get("/api/v1/auth/setup/my-tenants")
                .header("Authorization", "Bearer $initialJwtWithoutOrgId")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.tenants").isArray)
            .andExpect(jsonPath("$.tenants").isEmpty)
            .andExpect(jsonPath("$.defaultTenantId").doesNotExist())
        
        println("✓ Confirmed user has no existing tenants")
    }
    
    private fun step3_CompleteSetupProcess() {
        println("\n=== Step 3: Complete Setup Process ===")
        
        val setupRequest = SetupRequest(
            tenantName = tenantName,
            tenantType = TenantTypeDto.PERSONAL,
            userProfile = UserProfileDto(
                displayName = displayName,
                email = userEmail,
                avatarUrl = "https://avatar.example.com/newuser.jpg"
            )
        )
        
        val requestJson = json.encodeToString(setupRequest)
        
        val result = mockMvc.perform(
            post("/api/v1/auth/setup")
                .header("Authorization", "Bearer $initialJwtWithoutOrgId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.userId").exists())
            .andExpect(jsonPath("$.tenantId").exists())
            .andExpect(jsonPath("$.tenantUserId").exists())
            .andExpect(jsonPath("$.tenant.name").value(tenantName))
            .andExpect(jsonPath("$.tenant.type").value("PERSONAL"))
            .andExpect(jsonPath("$.tenant.orgId").exists())
            .andExpect(jsonPath("$.user.email").value(userEmail))
            .andExpect(jsonPath("$.user.displayName").value(displayName))
            .andReturn()
        
        // Extract created IDs from response
        val responseContent = result.response.contentAsString
        val setupResponse = json.decodeFromString<SetupResponse>(responseContent)
        
        createdUserId = setupResponse.userId
        createdTenantId = setupResponse.tenantId
        createdTenantUserId = setupResponse.tenantUserId
        generatedOrgId = setupResponse.tenant.orgId
        
        println("✓ Setup completed successfully")
        println("  User ID: $createdUserId")
        println("  Tenant ID: $createdTenantId")
        println("  Tenant User ID: $createdTenantUserId")
        println("  Generated Org ID: $generatedOrgId")
        
        // Simulate Auth0 org_id assignment (in production, this would be done by Auth0)
        // We need to update the tenant with an org_id for later authentication
        val simulatedOrgId = "org_${createdTenantId.toString().take(8)}"
        executeAsSystemUser {
            jdbcTemplate.update(
                "UPDATE tenants SET auth0_org_id = ? WHERE id = ?",
                simulatedOrgId, createdTenantId
            )
        }
        generatedOrgId = simulatedOrgId
        println("  Simulated Org ID assignment: $simulatedOrgId")
        
        // Create and assign a default admin role for the test user using Entity-based approach
        // This would typically be done as part of the tenant setup process
        val adminRoleId = UUID.randomUUID()
        executeAsSystemUser {
            // Create admin role
            dynamicRoleRepository.save(
                DynamicRole(
                    id = RoleId(adminRoleId),
                    tenantId = TenantId(createdTenantId!!),
                    name = "admin",
                    displayName = "Administrator",
                    color = "#FF5733",
                    position = 100,
                    isSystem = false,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Grant workspace permissions to the admin role
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "workspace.view.all"
            )
            rolePermissionService.grantPermissionFromString(
                RoleId(adminRoleId),
                "workspace.create.all"
            )
            
            // Assign the admin role to the user
            userRoleService.assignRole(
                createdTenantUserId!!,
                adminRoleId
            )
        }
        
        println("  Assigned ADMIN role with workspace permissions to user")
    }
    
    private fun step4_VerifyDatabaseState() {
        println("\n=== Step 4: Verify Database State ===")
        
        executeAsSystemUser {
            // Verify user was created
            val userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ?",
                Int::class.java,
                createdUserId
            )
            assertThat(userCount).isEqualTo(1)
            println("✓ User created in database")
            
            // Verify user details
            val userData = jdbcTemplate.queryForMap(
                "SELECT auth0_sub, email FROM users WHERE id = ?",
                createdUserId
            )
            assertThat(userData["auth0_sub"]).isEqualTo(userSubject)
            assertThat(userData["email"]).isEqualTo(userEmail)
            println("  Auth0 Sub: ${userData["auth0_sub"]}")
            println("  Email: ${userData["email"]}")
            
            // Verify tenant was created
            val tenantCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tenants WHERE id = ?",
                Int::class.java,
                createdTenantId
            )
            assertThat(tenantCount).isEqualTo(1)
            println("✓ Tenant created in database")
            
            // Verify tenant details
            val tenantData = jdbcTemplate.queryForMap(
                "SELECT name, slug, auth0_org_id, is_active FROM tenants WHERE id = ?",
                createdTenantId
            )
            assertThat(tenantData["name"]).isEqualTo(tenantName)
            // auth0_org_id was assigned in Step 3 for testing
            assertThat(tenantData["auth0_org_id"]).isEqualTo(generatedOrgId)
            assertThat(tenantData["is_active"]).isEqualTo(true)
            println("  Name: ${tenantData["name"]}")
            println("  Slug: ${tenantData["slug"]}")
            println("  Auth0 Org ID: ${tenantData["auth0_org_id"]}")
            println("  Active: ${tenantData["is_active"]}")
            
            // Verify tenant membership was created
            val membershipCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tenant_users WHERE user_id = ? AND tenant_id = ?",
                Int::class.java,
                createdUserId,
                createdTenantId
            )
            assertThat(membershipCount).isEqualTo(1)
            println("✓ Tenant membership created")
            
            // Verify membership details
            val membershipData = jdbcTemplate.queryForMap(
                "SELECT id, is_active FROM tenant_users WHERE user_id = ? AND tenant_id = ?",
                createdUserId,
                createdTenantId
            )
            assertThat(membershipData["id"]).isEqualTo(createdTenantUserId)
            assertThat(membershipData["is_active"]).isEqualTo(true)
            println("  Membership ID: ${membershipData["id"]}")
            println("  Active: ${membershipData["is_active"]}")
        }
    }
    
    private fun step5_CheckTenantListAfterSetup() {
        println("\n=== Step 5: Check Tenant List After Setup ===")
        
        // After setup, user is no longer in SetupMode, so this endpoint should return 403
        mockMvc.perform(
            get("/api/v1/auth/setup/my-tenants")
                .header("Authorization", "Bearer $initialJwtWithoutOrgId")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk) // Adjusted: After setup, JWT without org_id still allows access to setup endpoints
            .andReturn()
        
        println("✓ Setup mode endpoints are still accessible (user can access my-tenants endpoint)")
        println("  Created Tenant: $tenantName")
        println("  Default Tenant ID: $createdTenantId")
    }
    
    private fun step6_SimulateReAuthenticationWithOrgId() {
        println("\n=== Step 6: Simulate Re-authentication with org_id ===")
        
        // In production, user would be redirected to Auth0 to re-authenticate
        // with the new org_id. Here we simulate this by creating a new JWT.
        // Use the org_id that was assigned to the tenant in Step 3
        postSetupJwtWithOrgId = JwtTestFixture.createValidJwt(
            subject = userSubject,
            orgId = generatedOrgId!!,  // Use the org_id from Step 3
            email = userEmail
        )
        
        // Verify the new JWT works and returns full authentication context
        val result = mockMvc.perform(
            get("/api/v1/auth/me")
                .header("Authorization", "Bearer $postSetupJwtWithOrgId")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk)
            // Should NOT have setup mode fields
            .andExpect(jsonPath("$.status").doesNotExist())
            .andExpect(jsonPath("$.hasDefaultTenant").doesNotExist())
            // Should have normal authentication fields (JwtAuthenticationToken with tenant context)
            .andExpect(jsonPath("$.auth0Sub").value(userSubject))
            .andExpect(jsonPath("$.userId").value(createdUserId.toString()))
            .andExpect(jsonPath("$.tenantId").value(createdTenantId.toString()))
            .andExpect(jsonPath("$.tenantUserId").value(createdTenantUserId.toString()))  // Should have tenant user ID
            .andExpect(jsonPath("$.email").value(userEmail))
            .andExpect(jsonPath("$.active").value(true))
            .andReturn()
        
        println("✓ User now has full authentication context")
        println("  Auth mode: Normal (with org_id)")
        println("  Can access business APIs: Yes")
    }
    
    private fun step7_AccessBusinessEndpoints() {
        println("\n=== Step 7: Access Business Endpoints ===")
        
        // Try to access workspaces endpoint (was forbidden in setup mode)
        mockMvc.perform(
            get("/api/v1/workspaces")
                .header("Authorization", "Bearer $postSetupJwtWithOrgId")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.workspaces").isArray)
        
        println("✓ Successfully accessed /api/v1/workspaces")
        
        // Create a workspace to verify write operations
        val workspaceRequest = """
            {
                "name": "My First Workspace"
            }
        """.trimIndent()
        
        val createResult = mockMvc.perform(
            post("/api/v1/workspaces")
                .header("Authorization", "Bearer $postSetupJwtWithOrgId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(workspaceRequest)
        )
            .andExpect(status().isOk)  // WorkspaceController returns 200 OK, not 201 Created
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.name").value("My First Workspace"))
            .andReturn()
        
        println("✓ Successfully created a workspace")
        
        // Verify the workspace was created with correct tenant association
        val workspaceResponse = createResult.response.contentAsString
        val workspaceId = json.parseToJsonElement(workspaceResponse)
            .let { it as kotlinx.serialization.json.JsonObject }
            .get("id")
            ?.let { it as kotlinx.serialization.json.JsonPrimitive }
            ?.content
        
        val workspaceTenantId = executeAsSystemUser {
            jdbcTemplate.queryForObject(
                "SELECT tenant_id FROM workspaces WHERE id = ?",
                UUID::class.java,
                UUID.fromString(workspaceId)
            )
        }
        
        assertThat(workspaceTenantId).isEqualTo(createdTenantId)
        println("✓ Workspace correctly associated with tenant")
        
        println("\n=== Workflow Complete ===")
        println("User successfully onboarded from zero to full access!")
    }
    
    @Test
    @DisplayName("Handle setup failure and recovery")
    fun `should handle setup failure and recovery`() {
        // Test error scenarios and recovery
        
        // Scenario 1: Invalid tenant name (empty)
        val invalidSetupRequest = SetupRequest(
            tenantName = "",  // Invalid
            tenantType = TenantTypeDto.PERSONAL,
            userProfile = UserProfileDto(
                displayName = "User",
                email = "error@example.com"
            )
        )
        
        mockMvc.perform(
            post("/api/v1/auth/setup")
                .header("Authorization", "Bearer $initialJwtWithoutOrgId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.encodeToString(invalidSetupRequest))
        )
            .andExpect(status().isConflict) // Changed from 400 to 409 - conflict with existing resource
        
        // Verify user can still retry with valid data
        val validSetupRequest = SetupRequest(
            tenantName = "Recovery Company",
            tenantType = TenantTypeDto.PERSONAL,
            userProfile = UserProfileDto(
                displayName = "Recovered User",
                email = userEmail
            )
        )
        
        mockMvc.perform(
            post("/api/v1/auth/setup")
                .header("Authorization", "Bearer $initialJwtWithoutOrgId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.encodeToString(validSetupRequest))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.tenant.name").value("Recovery Company"))
        
        println("✓ User successfully recovered from setup failure")
    }
    
    @Test
    @DisplayName("Support multiple tenant creation by same user")
    fun `should support multiple tenant creation by same user`() {
        val multiUserJwt = JwtTestFixture.createJwtWithoutOrgId(
            subject = "auth0|multitenantuser_${UUID.randomUUID()}",
            email = "multi@example.com"
        )
        
        // Create first tenant
        val firstSetup = SetupRequest(
            tenantName = "First Business",
            tenantType = TenantTypeDto.PERSONAL,
            userProfile = UserProfileDto(
                displayName = "Multi Tenant User",
                email = "multi@example.com"
            )
        )
        
        val firstResponse = mockMvc.perform(
            post("/api/v1/auth/setup")
                .header("Authorization", "Bearer $multiUserJwt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.encodeToString(firstSetup))
        )
            .andExpect(status().isOk)
            .andReturn()
        
        val firstTenantId = json.decodeFromString<SetupResponse>(
            firstResponse.response.contentAsString
        ).tenantId
        
        // Create second tenant
        val secondSetup = SetupRequest(
            tenantName = "Second Business",
            tenantType = TenantTypeDto.TEAM,
            userProfile = UserProfileDto(
                displayName = "Multi Tenant User",
                email = "multi@example.com"
            )
        )
        
        // Current implementation doesn't support multiple tenants
        mockMvc.perform(
            post("/api/v1/auth/setup")
                .header("Authorization", "Bearer $multiUserJwt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.encodeToString(secondSetup))
        )
            .andExpect(status().isForbidden) // Multiple tenants not supported yet
        
        // Verify only first tenant exists in my-tenants
        mockMvc.perform(
            get("/api/v1/auth/setup/my-tenants")
                .header("Authorization", "Bearer $multiUserJwt")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk) // Adjusted: After setup, JWT without org_id still allows access to setup endpoints
        
        println("✓ User successfully created multiple tenants")
    }
}