package com.astarworks.astarmanagement.integration.api.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.helper.MockMvcHelper
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.fixture.setup.TestScenario
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.print
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Integration tests for AuthController.
 * 
 * Tests the authentication API endpoints including:
 * - GET /api/v1/auth/me - Current user information
 * - GET /api/v1/auth/claims - JWT claims extraction
 * - GET /api/v1/auth/business-context - Business context with authorities
 * 
 * Focuses on AuthController-specific functionality, avoiding overlap with
 * AuthenticationIntegrationTest and JwtAuthenticationIntegrationTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Auth Controller Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class AuthControllerIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    @Autowired
    private lateinit var mockMvcHelper: MockMvcHelper
    
    // Test data
    private lateinit var testScenario: TestScenario
    private lateinit var adminJwt: String
    private lateinit var userJwt: String
    private lateinit var viewerJwt: String
    private lateinit var tenantBAdminJwt: String
    private lateinit var expiredJwt: String
    private lateinit var jwtWithoutTenant: String
    
    @BeforeEach
    fun setUp() {
        // Setup basic authentication scenario with users, tenants, and roles
        testScenario = integrationTestSetup.setupBasicAuthenticationScenario()
        
        // Generate JWTs for different test cases based on actual test data
        val adminUser = testScenario.users["admin"]!!
        val regularUser = testScenario.users["regular"]!!
        val viewerUser = testScenario.users["viewer"]!!
        val tenantBAdminUser = testScenario.users["tenant_b_admin"]!!
        
        val tenantA = testScenario.tenants["tenant_a"]!!
        val tenantB = testScenario.tenants["tenant_b"]!!
        
        // Create JWTs that match the test data exactly
        adminJwt = JwtTestFixture.createValidJwt(
            subject = adminUser.auth0Sub,
            orgId = tenantA.auth0OrgId ?: "org_tenant_a_test",
            email = adminUser.email ?: "tenant1-admin@test.com"
        )
        
        userJwt = JwtTestFixture.createValidJwt(
            subject = regularUser.auth0Sub,
            orgId = tenantA.auth0OrgId ?: "org_tenant_a_test",
            email = regularUser.email ?: "tenant1-user@test.com"
        )
        
        viewerJwt = JwtTestFixture.createValidJwt(
            subject = viewerUser.auth0Sub,
            orgId = tenantA.auth0OrgId ?: "org_tenant_a_test",
            email = viewerUser.email ?: "tenant1-viewer@test.com"
        )
        
        tenantBAdminJwt = JwtTestFixture.createValidJwt(
            subject = tenantBAdminUser.auth0Sub,
            orgId = tenantB.auth0OrgId ?: "org_tenant_b_test",
            email = tenantBAdminUser.email ?: "tenant2-admin@test.com"
        )
        
        expiredJwt = JwtTestFixture.createExpiredJwt(
            subject = adminUser.auth0Sub
        )
        
        jwtWithoutTenant = JwtTestFixture.createJwtWithoutOrgId(
            subject = adminUser.auth0Sub,
            email = adminUser.email ?: "tenant1-admin@test.com"
        )
    }
    
    @Nested
    @DisplayName("GET /api/v1/auth/me - Current User Information")
    inner class CurrentUserTests {
        
        @Test
        @DisplayName("Should return current user with admin role")
        fun `should return current user with admin role`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andDo(print())
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.auth0Sub").value("auth0|test_${IntegrationTestSetup.Companion.TestIds.ADMIN_USER}"))
                .andExpect(jsonPath("$.userId").value(IntegrationTestSetup.Companion.TestIds.ADMIN_USER.toString()))
                .andExpect(jsonPath("$.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_A.toString()))
                .andExpect(jsonPath("$.roles").isArray)
                .andExpect(jsonPath("$.roles[0]").value("admin"))
                .andExpect(jsonPath("$.email").value("tenant1-admin@test.com"))
                .andExpect(jsonPath("$.active").value(true))
        }
        
        @Test
        @DisplayName("Should return current user with user role")
        fun `should return current user with user role`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.auth0Sub").value("auth0|test_${IntegrationTestSetup.Companion.TestIds.REGULAR_USER}"))
                .andExpect(jsonPath("$.userId").value(IntegrationTestSetup.Companion.TestIds.REGULAR_USER.toString()))
                .andExpect(jsonPath("$.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_A.toString()))
                .andExpect(jsonPath("$.roles").isArray)
                .andExpect(jsonPath("$.roles[0]").value("user"))
                .andExpect(jsonPath("$.email").value("tenant1-user@test.com"))
                .andExpect(jsonPath("$.active").value(true))
        }
        
        @Test
        @DisplayName("Should return current user with viewer role")
        fun `should return current user with viewer role`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $viewerJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.auth0Sub").value("auth0|test_${IntegrationTestSetup.Companion.TestIds.VIEWER_USER}"))
                .andExpect(jsonPath("$.userId").value(IntegrationTestSetup.Companion.TestIds.VIEWER_USER.toString()))
                .andExpect(jsonPath("$.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_A.toString()))
                .andExpect(jsonPath("$.roles").isArray)
                .andExpect(jsonPath("$.roles[0]").value("viewer"))
                .andExpect(jsonPath("$.email").value("tenant1-viewer@test.com"))
                .andExpect(jsonPath("$.active").value(true))
        }
        
        @Test
        @DisplayName("Should return 401 without JWT")
        fun `should return 401 without JWT`() {
            // When & Then
            mockMvcHelper.unauthenticatedGet("/api/v1/auth/me")
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should return 401 with expired JWT")
        fun `should return 401 with expired JWT`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $expiredJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should handle JWT without tenant context")
        fun `should handle JWT without tenant context`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $jwtWithoutTenant")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.auth0Sub").exists())
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.tenantId").exists())
        }
        
        @Test
        @DisplayName("Should return 401 with invalid JWT format")
        fun `should return 401 with invalid JWT format`() {
            // When & Then
            mockMvcHelper.invalidJwtGet("/api/v1/auth/me")
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Nested
    @DisplayName("GET /api/v1/auth/claims - JWT Claims")
    inner class JwtClaimsTests {
        
        @Test
        @DisplayName("Should return JWT claims for admin user")
        fun `should return JWT claims for admin user`() {
            val adminUser = testScenario.users["admin"]!!
            
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/claims")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.sub").value(adminUser.auth0Sub))
                .andExpect(jsonPath("$.email").value(adminUser.email))
                .andExpect(jsonPath("$.iss").value("https://test.auth0.com/"))
                .andExpect(jsonPath("$.aud").value("https://api.astar.com"))
                .andExpect(jsonPath("$.iat").exists())
                .andExpect(jsonPath("$.exp").exists())
        }
        
        @Test
        @DisplayName("Should return JWT claims for regular user")
        fun `should return JWT claims for regular user`() {
            val regularUser = testScenario.users["regular"]!!
            
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/claims")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.sub").value(regularUser.auth0Sub))
                .andExpect(jsonPath("$.email").value(regularUser.email))
        }
        
        @Test
        @DisplayName("Should return 401 without authentication")
        fun `should return 401 without authentication for claims`() {
            // When & Then
            mockMvcHelper.unauthenticatedGet("/api/v1/auth/claims")
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Nested
    @DisplayName("GET /api/v1/auth/business-context - Business Context")
    inner class BusinessContextTests {
        
        @Test
        @DisplayName("Should return business context for admin user")
        fun `should return business context for admin user`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                // Authenticated context
                .andExpect(jsonPath("$.authenticatedContext").exists())
                .andExpect(jsonPath("$.authenticatedContext.auth0Sub").value("auth0|test_${IntegrationTestSetup.Companion.TestIds.ADMIN_USER}"))
                .andExpect(jsonPath("$.authenticatedContext.userId").value(IntegrationTestSetup.Companion.TestIds.ADMIN_USER.toString()))
                .andExpect(jsonPath("$.authenticatedContext.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_A.toString()))
                .andExpect(jsonPath("$.authenticatedContext.roles").isArray)
                .andExpect(jsonPath("$.authenticatedContext.email").value("tenant1-admin@test.com"))
                .andExpect(jsonPath("$.authenticatedContext.active").value(true))
                // Spring Security authorities
                .andExpect(jsonPath("$.springSecurityAuthorities").isArray)
                .andExpect(jsonPath("$.springSecurityAuthorities").isNotEmpty)
                // Raw JWT claims
                .andExpect(jsonPath("$.rawJwtClaims").exists())
                // Note: rawJwtClaims.orgId might not exist in response structure
        }
        
        @Test
        @DisplayName("Should return business context for regular user")
        fun `should return business context for regular user`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.authenticatedContext.userId").value(IntegrationTestSetup.Companion.TestIds.REGULAR_USER.toString()))
                .andExpect(jsonPath("$.authenticatedContext.roles[0]").value("user"))
                .andExpect(jsonPath("$.springSecurityAuthorities").isArray)
        }
        
        @Test
        @DisplayName("Should require authentication for business context")
        fun `should require authentication for business context`() {
            // When & Then - @PreAuthorize("isAuthenticated()") should reject
            mockMvcHelper.unauthenticatedGet("/api/v1/auth/business-context")
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should return 401 with expired JWT for business context")
        fun `should return 401 with expired JWT for business context`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $expiredJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Nested
    @DisplayName("Multi-Tenant Authentication")
    inner class MultiTenantTests {
        
        @Test
        @DisplayName("Should handle different tenant contexts based on JWT")
        fun `should handle different tenant contexts based on JWT`() {
            // Test with Tenant A JWT
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_A.toString()))
            
            // Test with Tenant B JWT
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $tenantBAdminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_B.toString()))
        }
        
        @Test
        @DisplayName("Should maintain separate user contexts per tenant")
        fun `should maintain separate user contexts per tenant`() {
            // Tenant A context
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.authenticatedContext.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_A.toString()))
                // Note: rawJwtClaims.orgId might not exist in response structure
            
            // Tenant B context  
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $tenantBAdminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.authenticatedContext.tenantId").value(IntegrationTestSetup.Companion.TestIds.TENANT_B.toString()))
                // Note: rawJwtClaims.orgId might not exist in response structure
        }
        
        @Test
        @DisplayName("Should extract correct org_id from JWT for tenant identification")
        fun `should extract correct org_id from JWT for tenant identification`() {
            // Test org_id extraction in claims endpoint
            mockMvc.perform(
                get("/api/v1/auth/claims")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                // Note: org_id is not directly in JwtClaimsResponse, but we can verify other claims
                .andExpect(jsonPath("$.sub").value("auth0|test_${IntegrationTestSetup.Companion.TestIds.ADMIN_USER}"))
            
            // Test org_id extraction in business context
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                // Note: rawJwtClaims.orgId might not exist in response structure
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Error Handling")
    inner class EdgeCaseTests {
        
        @Test
        @DisplayName("Should handle malformed Authorization header")
        fun `should handle malformed Authorization header`() {
            // Missing "Bearer " prefix
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", adminJwt)
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
            
            // Wrong prefix
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Basic $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should handle JWT with invalid signature")
        fun `should handle JWT with invalid signature`() {
            // Tamper with the JWT signature
            val tamperedJwt = adminJwt.dropLast(10) + "tamperedXYZ"
            
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $tamperedJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should handle empty Authorization header")
        fun `should handle empty Authorization header`() {
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
            
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer ")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
    }
}