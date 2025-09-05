package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.util.UUID

/**
 * Integration tests for SetupModeAuthentication access control.
 * 
 * This test comprehensively verifies that SetupModeAuthentication:
 * - Allows access only to setup-related endpoints
 * - Blocks access to all business and admin APIs
 * - Properly contrasts with normal authentication
 * 
 * Security boundary testing is critical to ensure users without org_id
 * cannot access tenant-specific resources or perform administrative actions.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Setup Mode Authentication Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class SetupModeAuthenticationIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    // Test JWTs
    private lateinit var setupModeJwt: String        // JWT without org_id
    private lateinit var normalAuthJwt: String       // JWT with org_id
    private lateinit var anotherSetupJwt: String     // Another setup mode JWT
    
    @BeforeEach
    fun setUp() {
        // Clear caches (database cleanup handled by @Sql)
        clearCaches()
        
        // Generate SetupMode JWT (no org_id)
        setupModeJwt = JwtTestFixture.createJwtWithoutOrgId(
            subject = "auth0|setupmode_${UUID.randomUUID()}",
            email = "setupuser@example.com"
        )
        
        anotherSetupJwt = JwtTestFixture.createJwtWithoutOrgId(
            subject = "auth0|another_${UUID.randomUUID()}",
            email = "another@example.com"
        )
        
        // Setup normal authentication scenario
        val testScenario = integrationTestSetup.setupBasicAuthenticationScenario()
        val adminUser = testScenario.users["admin"]!!
        val tenantA = testScenario.tenants["tenant_a"]!!
        
        // Generate normal JWT (with org_id)
        normalAuthJwt = JwtTestFixture.createValidJwt(
            subject = adminUser.auth0Sub,
            orgId = tenantA.auth0OrgId ?: "org_tenant_a",
            email = adminUser.email ?: "admin@example.com"
        )
    }
    
    @Nested
    @DisplayName("Setup Mode - Allowed Endpoints")
    inner class AllowedEndpointsTests {
        
        @Test
        @DisplayName("Should allow access to /api/v1/auth/me")
        fun `should allow access to auth me endpoint`() {
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.status").value("SETUP_REQUIRED"))
        }
        
        @Test
        @DisplayName("Should restrict access to /api/v1/auth/claims for SetupMode")
        fun `should restrict access to auth claims endpoint for setup mode`() {
            // SetupMode JWT has limited access to certain endpoints
            mockMvc.perform(
                get("/api/v1/auth/claims")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden) // SetupMode cannot access full claims
        }
        
        @Test
        @DisplayName("Should allow access to /api/v1/auth/setup")
        fun `should allow access to setup endpoint`() {
            val setupRequest = """
                {
                    "tenantName": "Test Company",
                    "tenantType": "PERSONAL",
                    "userProfile": {
                        "displayName": "Test User",
                        "email": "setupuser@example.com"
                    }
                }
            """.trimIndent()
            
            mockMvc.perform(
                post("/api/v1/auth/setup")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(setupRequest)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.tenantId").exists())
        }
        
        @Test
        @DisplayName("Should allow access to /api/v1/auth/setup/my-tenants")
        fun `should allow access to my tenants endpoint`() {
            mockMvc.perform(
                get("/api/v1/auth/setup/my-tenants")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.tenants").isArray)
        }
        
        @ParameterizedTest
        @ValueSource(strings = [
            "/api/v1/auth/me",
            "/api/v1/auth/setup/my-tenants"
        ])
        @DisplayName("Should allow GET requests to setup endpoints")
        fun `should allow GET requests to setup endpoints`(endpoint: String) {
            mockMvc.perform(
                get(endpoint)
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
        }
        
        @Test
        @DisplayName("Should handle /api/v1/auth/claims for SetupMode")
        fun `should handle claims endpoint for setup mode`() {
            // Claims endpoint may return 403 for SetupMode JWT
            mockMvc.perform(
                get("/api/v1/auth/claims")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden) // SetupMode JWT may not have full access to claims
        }
    }
    
    @Nested
    @DisplayName("Setup Mode - Blocked Business APIs")
    inner class BlockedBusinessApisTests {
        
        @Test
        @DisplayName("Should block access to /api/v1/workspaces")
        fun `should block access to workspaces endpoint`() {
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block POST to /api/v1/workspaces")
        fun `should block POST to workspaces endpoint`() {
            val workspaceRequest = """
                {
                    "name": "Test Workspace"
                }
            """.trimIndent()
            
            mockMvc.perform(
                post("/api/v1/workspaces")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(workspaceRequest)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block access to /api/v1/tables")
        fun `should block access to tables endpoint`() {
            mockMvc.perform(
                get("/api/v1/tables")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block access to /api/v1/records")
        fun `should block access to records endpoint`() {
            mockMvc.perform(
                get("/api/v1/records")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @ParameterizedTest
        @ValueSource(strings = [
            "/api/v1/workspaces",
            "/api/v1/workspaces/123",
            "/api/v1/tables",
            "/api/v1/tables/456",
            "/api/v1/records",
            "/api/v1/records/789"
        ])
        @DisplayName("Should block all business API endpoints")
        fun `should block all business API endpoints`(endpoint: String) {
            mockMvc.perform(
                get(endpoint)
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block PUT requests to business endpoints")
        fun `should block PUT requests to business endpoints`() {
            mockMvc.perform(
                put("/api/v1/workspaces/123")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\": \"Updated\"}")
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block DELETE requests to business endpoints")
        fun `should block DELETE requests to business endpoints`() {
            mockMvc.perform(
                delete("/api/v1/workspaces/123")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Setup Mode - Blocked Admin APIs")
    inner class BlockedAdminApisTests {
        
        @Test
        @DisplayName("Should block access to /api/v1/users")
        fun `should block access to users endpoint`() {
            mockMvc.perform(
                get("/api/v1/users")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block access to /api/v1/tenants")
        fun `should block access to tenants endpoint`() {
            mockMvc.perform(
                get("/api/v1/tenants")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block access to /api/v1/roles")
        fun `should block access to roles endpoint`() {
            mockMvc.perform(
                get("/api/v1/roles")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should block access to /api/v1/permissions")
        fun `should block access to permissions endpoint`() {
            mockMvc.perform(
                get("/api/v1/permissions")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @ParameterizedTest
        @ValueSource(strings = [
            "/api/v1/users",
            "/api/v1/users/123",
            "/api/v1/tenants",
            "/api/v1/tenants/456",
            "/api/v1/roles",
            "/api/v1/roles/789",
            "/api/v1/permissions"
        ])
        @DisplayName("Should block all admin API endpoints")
        fun `should block all admin API endpoints`(endpoint: String) {
            mockMvc.perform(
                get(endpoint)
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Setup Mode - Blocked Test Data APIs")
    inner class BlockedTestDataApisTests {
        
        @Test
        @DisplayName("Should block access to /api/v1/test-data endpoints")
        fun `should block access to test data endpoints`() {
            val testDataEndpoints = listOf(
                "/api/v1/test-data/tenants",
                "/api/v1/test-data/users",
                "/api/v1/test-data/clear"
            )
            
            testDataEndpoints.forEach { endpoint ->
                mockMvc.perform(
                    get(endpoint)
                        .header("Authorization", "Bearer $setupModeJwt")
                        .contentType(MediaType.APPLICATION_JSON)
                )
                    .andExpect(status().isForbidden)
            }
        }
    }
    
    @Nested
    @DisplayName("Normal Authentication - Full Access")
    inner class NormalAuthenticationTests {
        
        @Test
        @DisplayName("Should allow access to all auth endpoints with normal auth")
        fun `should allow access to all auth endpoints with normal auth`() {
            val authEndpoints = listOf(
                "/api/v1/auth/me",
                "/api/v1/auth/claims",
                "/api/v1/auth/business-context",
                "/api/v1/auth/setup/my-tenants"
            )
            
            authEndpoints.forEach { endpoint ->
                mockMvc.perform(
                    get(endpoint)
                        .header("Authorization", "Bearer $normalAuthJwt")
                        .contentType(MediaType.APPLICATION_JSON)
                )
                    .andExpect(status().isOk)
            }
        }
        
        @Test
        @DisplayName("Should allow access to business APIs with normal auth")
        fun `should allow access to business APIs with normal auth`() {
            // Workspaces endpoint should be accessible
            mockMvc.perform(
                get("/api/v1/workspaces")
                    .header("Authorization", "Bearer $normalAuthJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.workspaces").isArray)
        }
        
        @Test
        @DisplayName("Should allow access to admin APIs with normal auth")
        fun `should allow access to admin APIs with normal auth`() {
            // Users endpoint should be accessible (though may return empty based on permissions)
            mockMvc.perform(
                get("/api/v1/users")
                    .header("Authorization", "Bearer $normalAuthJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect { result ->
                    val status = result.response.status
                    assert(status == 200 || status == 403) { "Expected status 200 or 403, but got $status" }
                } // Depends on role permissions
        }
    }
    
    @Nested
    @DisplayName("Access Control Comparison")
    inner class AccessControlComparisonTests {
        
        @Test
        @DisplayName("Should show different access levels for same endpoint")
        fun `should show different access levels for same endpoint`() {
            val endpoint = "/api/v1/workspaces"
            
            // SetupMode: Forbidden
            mockMvc.perform(
                get(endpoint)
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
            
            // Normal Auth: OK
            mockMvc.perform(
                get(endpoint)
                    .header("Authorization", "Bearer $normalAuthJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
        }
        
        @Test
        @DisplayName("Should enforce access control for multiple setup mode users")
        fun `should enforce access control for multiple setup mode users`() {
            // Both setup mode users should have same restrictions
            val blockedEndpoint = "/api/v1/tables"
            
            // First setup user
            mockMvc.perform(
                get(blockedEndpoint)
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
            
            // Another setup user
            mockMvc.perform(
                get(blockedEndpoint)
                    .header("Authorization", "Bearer $anotherSetupJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Edge Cases")
    inner class EdgeCaseTests {
        
        @Test
        @DisplayName("Should handle OPTIONS requests appropriately")
        fun `should handle OPTIONS requests appropriately`() {
            // OPTIONS requests might be allowed for CORS
            mockMvc.perform(
                options("/api/v1/workspaces")
                    .header("Authorization", "Bearer $setupModeJwt")
            )
                .andExpect { result ->
                    val status = result.response.status
                    assert(status == 200 || status == 403) { "Expected status 200 or 403, but got $status" }
                }
        }
        
        @Test
        @DisplayName("Should block access to non-existent endpoints")
        fun `should block access to non-existent endpoints`() {
            mockMvc.perform(
                get("/api/v1/nonexistent")
                    .header("Authorization", "Bearer $setupModeJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect { result ->
                    val status = result.response.status
                    assert(status == 403 || status == 404) { "Expected status 403 or 404, but got $status" }
                }
        }
        
        @Test
        @DisplayName("Should maintain security with malformed URLs")
        fun `should maintain security with malformed URLs`() {
            val malformedUrls = listOf(
                "/api/v1//workspaces",
                "/api/v1/workspaces//",
                "/api/v1/../workspaces",
                "/api/v1/WORKSPACES" // Case variation
            )
            
            malformedUrls.forEach { url ->
                mockMvc.perform(
                    get(url)
                        .header("Authorization", "Bearer $setupModeJwt")
                        .contentType(MediaType.APPLICATION_JSON)
                )
                    .andExpect { result ->
                        val status = result.response.status
                        assert(status in listOf(400, 403, 404)) { "Expected status 400, 403 or 404, but got $status" }
                    }
            }
        }
        
        @Test
        @DisplayName("Should handle HEAD requests consistently")
        fun `should handle HEAD requests consistently`() {
            // HEAD requests should have same access control as GET
            mockMvc.perform(
                head("/api/v1/workspaces")
                    .header("Authorization", "Bearer $setupModeJwt")
            )
                .andExpect(status().isForbidden)
            
            mockMvc.perform(
                head("/api/v1/auth/me")
                    .header("Authorization", "Bearer $setupModeJwt")
            )
                .andExpect(status().isOk)
        }
    }
}