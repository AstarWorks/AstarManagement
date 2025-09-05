package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.*
import org.junit.jupiter.api.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.util.*

/**
 * Integration tests for JWT authentication flow.
 * Tests the complete authentication pipeline from JWT validation to API access.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("JWT Authentication Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class JwtAuthenticationIntegrationTest : IntegrationTestBase() {

    @Autowired
    override lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup

    @Autowired
    private lateinit var userRoleService: com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService

    private lateinit var testUser: User
    private lateinit var testTenant: Tenant
    private lateinit var testMembership: TenantMembership
    private lateinit var adminRole: DynamicRole
    private lateinit var userRole: DynamicRole

    // Use lateinit to get actual values from created entities
    private lateinit var testAuth0Sub: String
    private lateinit var testOrgId: String
    private lateinit var testEmail: String

    @BeforeEach
    fun setupTestData() {
        // app_user has BYPASSRLS privilege in test environment
        // No need for session variables or row_security settings
        
        // Generate test data values
        testAuth0Sub = "auth0|test-${UUID.randomUUID()}"
        testOrgId = "org_${UUID.randomUUID().toString().replace("-", "").substring(0, 10)}"
        testEmail = "test@example.com"
        
        // Use the fixture to set up JWT test scenario with these values
        val scenario = integrationTestSetup.setupJwtTestScenario(
            auth0Sub = testAuth0Sub,
            orgId = testOrgId,
            email = testEmail
        )
        
        // Store references to test data
        testTenant = scenario.tenant
        testUser = scenario.user
        adminRole = scenario.adminRole
        userRole = scenario.userRole ?: throw IllegalStateException("User role is required")
        testMembership = scenario.membership
    }

    @Nested
    @DisplayName("Successful JWT Authentication")
    inner class SuccessfulAuthenticationTests {

        @Test
        @DisplayName("Should authenticate with valid JWT and access protected endpoint")
        fun shouldAuthenticateWithValidJwt() {
            // Given
            val validJwt = JwtTestFixture.createValidJwt(
                subject = testAuth0Sub,
                orgId = testOrgId,
                email = testEmail
            )
            
            // Debug: Print JWT and test data values
            println("=== JWT TOKEN VALUES ===")
            println("JWT auth0Sub: $testAuth0Sub")
            println("JWT orgId: $testOrgId")
            println("JWT email: $testEmail")
            println("JWT token: $validJwt")
            println("========================")

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $validJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.message").value("Authenticated access - any valid token"))
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.testResult").value("SUCCESS"))
        }

        @Test
        @DisplayName("Should include user context in authenticated request")
        fun shouldIncludeUserContext() {
            // Given
            val validJwt = JwtTestFixture.createValidJwt(
                subject = testAuth0Sub,
                orgId = testOrgId,
                email = testEmail
            )

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $validJwt")
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.message").value("Authenticated access - any valid token"))
                .andExpect(jsonPath("$.userId").value(testAuth0Sub))
                .andExpect(jsonPath("$.endpoint").value("/authenticated"))
                .andExpect(jsonPath("$.testResult").value("SUCCESS"))
        }

        @Test
        @DisplayName("Should access public endpoint without authentication")
        fun shouldAccessPublicEndpoint() {
            // When & Then - No JWT required
            mockMvc.perform(
                get("/api/v1/auth/test/public")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.message").value("Public access - no authentication required"))
        }
    }

    @Nested
    @DisplayName("Failed JWT Authentication")
    inner class FailedAuthenticationTests {

        @Test
        @DisplayName("Should reject request without JWT token")
        fun shouldRejectRequestWithoutJwt() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"))
                .andExpect(jsonPath("$.message").exists())
        }

        @Test
        @DisplayName("Should reject expired JWT token")
        fun shouldRejectExpiredJwt() {
            // Given
            val expiredJwt = JwtTestFixture.createExpiredJwt(
                subject = testAuth0Sub,
                orgId = testOrgId
            )

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $expiredJwt")
            )
                .andExpect(status().isUnauthorized)
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").exists())
        }

        @Test
        @DisplayName("Should reject JWT with invalid signature")
        fun shouldRejectJwtWithInvalidSignature() {
            // Given
            val invalidJwt = JwtTestFixture.createJwtWithInvalidSignature(
                subject = testAuth0Sub,
                orgId = testOrgId
            )

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $invalidJwt")
            )
                .andExpect(status().isUnauthorized)
        }

        @Test
        @DisplayName("Should reject malformed JWT")
        fun shouldRejectMalformedJwt() {
            // Given
            val malformedJwt = JwtTestFixture.createMalformedJwt()

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $malformedJwt")
            )
                .andExpect(status().isUnauthorized)
        }

        @Test
        @DisplayName("Should accept JWT without org_id as SetupMode authentication")
        fun shouldRejectJwtWithoutOrgIdForProtectedEndpoints() {
            // Given - JWT without org_id triggers SetupMode authentication
            val jwtWithoutOrgId = JwtTestFixture.createJwtWithoutOrgId(
                subject = testAuth0Sub,
                email = testEmail
            )

            // When & Then - SetupMode JWTs are accepted for @PreAuthorize("isAuthenticated()") endpoints
            // The endpoint accepts SetupMode authentication as it only requires authentication, not specific roles
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $jwtWithoutOrgId")
            )
                .andExpect(status().isOk) // SetupMode authentication is accepted
                .andExpect(jsonPath("$.message").value("Authenticated access - any valid token"))
                .andExpect(jsonPath("$.userId").value(testAuth0Sub)) // Verifies SetupMode authentication worked
        }

        @Test
        @DisplayName("Should accept JWT for non-existent user via JIT provisioning")
        fun shouldRejectJwtForNonExistentUser() {
            // Given - JWT for a user that doesn't exist in the database
            val nonExistentUserJwt = JwtTestFixture.createValidJwt(
                subject = "auth0|nonexistent",
                orgId = testOrgId,
                email = "nonexistent@example.com"
            )

            // When & Then - JIT provisioning automatically creates the user
            // The system accepts the JWT and creates a new user on-the-fly
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $nonExistentUserJwt")
            )
                .andExpect(status().isOk) // JIT provisioning creates the user automatically
                .andExpect(jsonPath("$.message").value("Authenticated access - any valid token"))
                .andExpect(jsonPath("$.userId").value("auth0|nonexistent")) // Confirms the new user
        }

        @Test
        @DisplayName("Should reject JWT for non-existent tenant")
        fun shouldRejectJwtForNonExistentTenant() {
            // Given
            val nonExistentTenantJwt = JwtTestFixture.createValidJwt(
                subject = testAuth0Sub,
                orgId = "org_nonexistent",
                email = testEmail
            )

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $nonExistentTenantJwt")
            )
                .andExpect(status().isUnauthorized)
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
        }

        @Test
        @DisplayName("Should reject JWT for inactive tenant membership")
        @Disabled("MVP機能外 - メンバーシップ管理は将来実装予定")
        fun shouldRejectJwtForInactiveMembership() {
            // Given - Deactivate the membership
            // Note: This test needs access to repository or service to deactivate membership
            // For now, we'll skip this test implementation
            // TODO: Add proper test implementation after refactoring

            val validJwt = JwtTestFixture.createValidJwt(
                subject = testAuth0Sub,
                orgId = testOrgId,
                email = testEmail
            )

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $validJwt")
            )
                .andExpect(status().isForbidden)
        }
    }

    @Nested
    @DisplayName("Alternative Claim Locations")
    inner class AlternativeClaimTests {

        @Test
        @DisplayName("Should authenticate with alternative email claim")
        fun shouldAuthenticateWithAlternativeEmailClaim() {
            // Given
            val jwtWithAltEmail = JwtTestFixture.createJwtWithAlternativeEmailClaim(
                subject = testAuth0Sub,
                orgId = testOrgId,
                emailClaimName = "https://your-app.com/email",
                email = testEmail
            )

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $jwtWithAltEmail")
            )
                .andExpect(status().isOk)
        }

        @Test
        @DisplayName("Should authenticate with alternative org_id claim")
        fun shouldAuthenticateWithAlternativeOrgClaim() {
            // Given
            val jwtWithAltOrg = JwtTestFixture.createJwtWithAlternativeOrgClaim(
                subject = testAuth0Sub,
                orgId = testOrgId,
                orgClaimName = "https://your-app.com/tenant_id"
            )

            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/test/authenticated")
                    .header("Authorization", "Bearer $jwtWithAltOrg")
            )
                .andExpect(status().isOk)
        }
    }

    @Nested
    @DisplayName("Role-Based Access Control")
    inner class RoleBasedAccessTests {

        @Test
        @DisplayName("Should access admin endpoint with admin role")
        fun shouldAccessAdminEndpointWithAdminRole() {
            // Given - JWT for user with admin role (assigned in @BeforeEach setupTestData)
            val validJwt = JwtTestFixture.createValidJwt(
                subject = testAuth0Sub,
                orgId = testOrgId,
                email = testEmail
            )
            
            // When & Then - Should access admin endpoint successfully
            mockMvc.perform(
                get("/api/v1/auth/test/admin-only")
                    .header("Authorization", "Bearer $validJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.message").value("Admin access granted"))
                .andExpect(jsonPath("$.endpoint").value("/admin-only"))
                .andExpect(jsonPath("$.userId").value(testAuth0Sub))
                .andExpect(jsonPath("$.testResult").value("SUCCESS"))
        }

        @Test
        @DisplayName("Should deny access to admin endpoint without admin role")
        fun shouldDenyAccessToAdminEndpointWithoutAdminRole() {
            // Given - Create a separate user with only user role (not admin role)
            val nonAdminAuth0Sub = "auth0|non-admin-${UUID.randomUUID()}"
            val nonAdminOrgId = "org_non_admin_${UUID.randomUUID().toString().replace("-", "").substring(0, 10)}" // Use different tenant
            val nonAdminEmail = "non-admin@example.com"
            
            // Create scenario (which assigns admin role by default)
            val nonAdminScenario = integrationTestSetup.setupJwtTestScenario(
                auth0Sub = nonAdminAuth0Sub,
                orgId = nonAdminOrgId,
                email = nonAdminEmail
            )
            
            // Remove admin role and assign only user role
            val membershipId = nonAdminScenario.membership.id.value
            
            // Remove admin role assignment
            userRoleService.removeRole(membershipId, nonAdminScenario.adminRole.id.value)
            
            // Assign user role instead
            val userRole = nonAdminScenario.userRole ?: throw IllegalStateException("User role not found")
            userRoleService.assignRole(membershipId, userRole.id.value)
            
            // Create JWT for non-admin user
            val nonAdminJwt = JwtTestFixture.createValidJwt(
                subject = nonAdminAuth0Sub,
                orgId = nonAdminOrgId,
                email = nonAdminEmail
            )
            
            // When & Then - Should be denied access (403 Forbidden)
            mockMvc.perform(
                get("/api/v1/auth/test/admin-only")
                    .header("Authorization", "Bearer $nonAdminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }

}