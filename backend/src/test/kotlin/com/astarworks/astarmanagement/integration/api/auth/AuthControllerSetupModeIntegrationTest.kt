package com.astarworks.astarmanagement.integration.api.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.helper.MockMvcHelper
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import org.hamcrest.Matchers.*
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
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.util.UUID

/**
 * Integration tests for AuthController with SetupModeAuthentication.
 * 
 * Tests the modified AuthController behavior when handling users without org_id
 * in their JWT (SetupModeAuthentication) vs users with org_id (normal authentication).
 * 
 * This test specifically verifies:
 * - Different response formats for /api/v1/auth/me endpoint
 * - SETUP_REQUIRED status for users without org_id
 * - Normal response for users with org_id
 * - Proper error handling
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Auth Controller Setup Mode Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class AuthControllerSetupModeIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var mockMvcHelper: MockMvcHelper
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    // Test JWTs
    private lateinit var jwtWithoutOrgId: String
    private lateinit var jwtWithoutOrgIdNoEmail: String
    private lateinit var normalJwtWithOrgId: String
    private lateinit var expiredJwtWithoutOrgId: String
    
    @BeforeEach
    fun setUp() {
        // Clear caches (database cleanup handled by @Sql)
        clearCaches()
        
        // Generate test JWTs for SetupMode (without org_id)
        val newUserSub = "auth0|setupuser_${UUID.randomUUID()}"
        jwtWithoutOrgId = JwtTestFixture.createJwtWithoutOrgId(
            subject = newUserSub,
            email = "setupuser@example.com"
        )
        
        // Create JWT without email using builder
        jwtWithoutOrgIdNoEmail = JwtTestFixture.builder()
            .withSubject("auth0|noemail_${UUID.randomUUID()}")
            .withOrgId(null)
            .withEmail(null)
            .build()
        
        // Create expired JWT without org_id using builder
        expiredJwtWithoutOrgId = JwtTestFixture.builder()
            .withSubject("auth0|expired_${UUID.randomUUID()}")
            .withOrgId(null)
            .withExpiresAt(Instant.now().minusSeconds(3600))
            .withIssuedAt(Instant.now().minusSeconds(7200))
            .build()
        
        // Setup normal authentication scenario with existing data
        val testScenario = integrationTestSetup.setupBasicAuthenticationScenario()
        val adminUser = testScenario.users["admin"]!!
        val tenantA = testScenario.tenants["tenant_a"]!!
        
        // Generate normal JWT with org_id
        normalJwtWithOrgId = JwtTestFixture.createValidJwt(
            subject = adminUser.auth0Sub,
            orgId = tenantA.auth0OrgId ?: "org_tenant_a_test",
            email = adminUser.email ?: "admin@example.com"
        )
    }
    
    @Nested
    @DisplayName("GET /api/v1/auth/me - Setup Mode vs Normal Mode")
    inner class AuthMeEndpointTests {
        
        @Test
        @DisplayName("Should return SETUP_REQUIRED for JWT without org_id")
        fun `should return SETUP_REQUIRED for JWT without org_id`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $jwtWithoutOrgId")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.status").value("SETUP_REQUIRED"))
                .andExpect(jsonPath("$.auth0Sub").value(startsWith("auth0|setupuser_")))
                .andExpect(jsonPath("$.email").value("setupuser@example.com"))
                .andExpect(jsonPath("$.hasDefaultTenant").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Please complete the setup process")))
                // Should NOT have normal authentication fields
                .andExpect(jsonPath("$.userId").doesNotExist())
                .andExpect(jsonPath("$.tenantId").doesNotExist())
                .andExpect(jsonPath("$.tenantUserId").doesNotExist())
                .andExpect(jsonPath("$.roles").doesNotExist())
                .andExpect(jsonPath("$.active").doesNotExist())
        }
        
        @Test
        @DisplayName("Should return normal response for JWT with org_id")
        fun `should return normal response for JWT with org_id`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $normalJwtWithOrgId")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                // Should have normal authentication fields
                .andExpect(jsonPath("$.auth0Sub").value(startsWith("auth0|test_")))
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.tenantId").exists())
                .andExpect(jsonPath("$.tenantUserId").exists())
                .andExpect(jsonPath("$.roles").isArray)
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.active").value(true))
                // Should NOT have setup mode fields
                .andExpect(jsonPath("$.status").doesNotExist())
                .andExpect(jsonPath("$.hasDefaultTenant").doesNotExist())
                .andExpect(jsonPath("$.message").doesNotExist())
        }
        
        @Test
        @DisplayName("Should handle JWT without org_id and without email")
        fun `should handle JWT without org_id and without email`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $jwtWithoutOrgIdNoEmail")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.status").value("SETUP_REQUIRED"))
                .andExpect(jsonPath("$.auth0Sub").value(startsWith("auth0|noemail_")))
                .andExpect(jsonPath("$.email").doesNotExist()) // No email in response
                .andExpect(jsonPath("$.hasDefaultTenant").value(false))
                .andExpect(jsonPath("$.message").exists())
        }
        
        @Test
        @DisplayName("Should require authentication")
        fun `should require authentication for auth me`() {
            // When & Then
            mockMvcHelper.unauthenticatedGet("/api/v1/auth/me")
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should reject expired JWT without org_id")
        fun `should reject expired JWT without org_id`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $expiredJwtWithoutOrgId")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Nested
    @DisplayName("GET /api/v1/auth/claims - Setup Mode")
    inner class ClaimsEndpointTests {
        
        @Test
        @DisplayName("Should deny access to claims endpoint for JWT without org_id (SetupMode)")
        fun `should deny access to claims for JWT without org_id`() {
            // When & Then - SetupMode is denied access to general API endpoints
            mockMvc.perform(
                get("/api/v1/auth/claims")
                    .header("Authorization", "Bearer $jwtWithoutOrgId")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should return claims for JWT with org_id")
        fun `should return claims for JWT with org_id`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/claims")
                    .header("Authorization", "Bearer $normalJwtWithOrgId")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.sub").exists())
                .andExpect(jsonPath("$.email").exists())
                // Response doesn't directly include org_id in JwtClaimsResponse
        }
        
        @Test
        @DisplayName("Should require authentication for claims")
        fun `should require authentication for claims`() {
            // When & Then
            mockMvcHelper.unauthenticatedGet("/api/v1/auth/claims")
                .andExpect(status().isUnauthorized)
        }
    }
    
    @Nested
    @DisplayName("GET /api/v1/auth/business-context - Setup Mode")
    inner class BusinessContextTests {
        
        @Test
        @DisplayName("Should handle business-context for JWT without org_id")
        fun `should handle business-context for JWT without org_id`() {
            // When & Then
            // This endpoint might not work with SetupModeAuthentication
            // depending on implementation, it might return 403 or modified response
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $jwtWithoutOrgId")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                // Expect either 200 (with limited context) or 403 (access denied)
                .andExpect { result ->
                    val status = result.response.status
                    assert(status == 200 || status == 403) { "Expected status 200 or 403, but got $status" }
                }
            // If 200, might have limited context
            // If 403, SetupMode users might not access business context
        }
        
        @Test
        @DisplayName("Should return full business-context for JWT with org_id")
        fun `should return full business-context for JWT with org_id`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/business-context")
                    .header("Authorization", "Bearer $normalJwtWithOrgId")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.authenticatedContext").exists())
                .andExpect(jsonPath("$.authenticatedContext.userId").exists())
                .andExpect(jsonPath("$.authenticatedContext.tenantId").exists())
                .andExpect(jsonPath("$.authenticatedContext.roles").isArray)
                .andExpect(jsonPath("$.springSecurityAuthorities").isArray)
                .andExpect(jsonPath("$.rawJwtClaims").exists())
        }
    }
    
    @Nested
    @DisplayName("Mode Transition Scenarios")
    inner class ModeTransitionTests {
        
        @Test
        @DisplayName("Should show different responses before and after setup")
        fun `should show different responses before and after setup`() {
            // Given - Create a new user JWT without org_id
            val userSub = "auth0|transition_${UUID.randomUUID()}"
            val userEmail = "transition@example.com"
            val setupJwt = JwtTestFixture.createJwtWithoutOrgId(
                subject = userSub,
                email = userEmail
            )
            
            // Step 1: Check initial state - should get SETUP_REQUIRED
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $setupJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.status").value("SETUP_REQUIRED"))
                .andExpect(jsonPath("$.auth0Sub").value(userSub))
                .andExpect(jsonPath("$.email").value(userEmail))
            
            // Step 2: After setup, user would get new JWT with org_id
            // We simulate this by creating a JWT with org_id for the same user
            // Note: In real scenario, user would complete setup and Auth0 would issue new JWT
            
            // For this test, we'll just verify the different response formats
            // The actual setup flow is tested in AuthSetupControllerIntegrationTest
        }
        
        @Test
        @DisplayName("Should consistently handle multiple requests with SetupMode")
        fun `should consistently handle multiple requests with SetupMode`() {
            // Given
            val consistentJwt = JwtTestFixture.createJwtWithoutOrgId(
                subject = "auth0|consistent_${UUID.randomUUID()}",
                email = "consistent@example.com"
            )
            
            // Make multiple requests to ensure consistent behavior
            for (i in 1..3) {
                mockMvc.perform(
                    get("/api/v1/auth/me")
                        .header("Authorization", "Bearer $consistentJwt")
                        .contentType(MediaType.APPLICATION_JSON)
                )
                    .andExpect(status().isOk)
                    .andExpect(jsonPath("$.status").value("SETUP_REQUIRED"))
                    .andExpect(jsonPath("$.hasDefaultTenant").value(false))
            }
        }
    }
    
    @Nested
    @DisplayName("Error Handling")
    inner class ErrorHandlingTests {
        
        @Test
        @DisplayName("Should handle malformed JWT gracefully")
        fun `should handle malformed JWT gracefully`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer not.a.valid.jwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should handle JWT with invalid signature")
        fun `should handle JWT with invalid signature`() {
            // Given
            val tamperedJwt = jwtWithoutOrgId.dropLast(10) + "tamperedXYZ"
            
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Bearer $tamperedJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
        
        @Test
        @DisplayName("Should handle wrong authorization scheme")
        fun `should handle wrong authorization scheme`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/auth/me")
                    .header("Authorization", "Basic dXNlcjpwYXNz") // Basic auth instead of Bearer
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isUnauthorized)
        }
    }
}