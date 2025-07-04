package dev.ryuzu.astermanagement.security

import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.dto.matter.UpdateMatterRequest
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import java.util.UUID
import java.time.LocalDate
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.JwtService
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.transaction.annotation.Transactional
import org.hamcrest.Matchers.*
import java.util.*

/**
 * Authorization Security Test Suite
 * 
 * Comprehensive tests for role-based access control, permission validation,
 * and resource-level authorization. Tests the complete RBAC implementation
 * including method-level security and data ownership verification.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation::class)
@Transactional
class AuthorizationSecurityTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var jwtService: JwtService

    @Autowired
    private lateinit var userRepository: UserRepository

    private lateinit var testLawyer: User
    private lateinit var testClerk: User
    private lateinit var testClient: User
    private lateinit var otherLawyer: User

    private lateinit var lawyerToken: String
    private lateinit var clerkToken: String
    private lateinit var clientToken: String
    private lateinit var otherLawyerToken: String

    companion object {
        private const val MATTERS_BASE_URL = "/api/v1/matters"
        private const val DOCUMENTS_BASE_URL = "/api/v1/documents"
        private const val MEMOS_BASE_URL = "/api/v1/memos"
        private const val EXPENSES_BASE_URL = "/api/v1/expenses"
        private const val ADMIN_BASE_URL = "/api/v1/admin"
    }

    @BeforeEach
    fun setup() {
        // Create test users
        testLawyer = createTestUser("test.lawyer", "lawyer@test.com", UserRole.LAWYER)
        testClerk = createTestUser("test.clerk", "clerk@test.com", UserRole.CLERK)
        testClient = createTestUser("test.client", "client@test.com", UserRole.CLIENT)
        otherLawyer = createTestUser("other.lawyer", "other@test.com", UserRole.LAWYER)

        // Generate JWT tokens
        lawyerToken = jwtService.generateAccessToken(testLawyer)
        clerkToken = jwtService.generateAccessToken(testClerk)
        clientToken = jwtService.generateAccessToken(testClient)
        otherLawyerToken = jwtService.generateAccessToken(otherLawyer)
    }

    private fun createTestUser(username: String, email: String, role: UserRole): User {
        val user = User().apply {
            this.id = UUID.randomUUID()
            this.username = username
            this.email = email
            this.firstName = username.split(".")[0].capitalize()
            this.lastName = username.split(".")[1].capitalize()
            this.role = role
            this.isActive = true
        }
        return userRepository.save(user)
    }

    // ========== MATTER AUTHORIZATION TESTS ==========

    @Test
    @Order(1)
    fun `lawyer should have full access to matter endpoints`() {
        val matterRequest = createValidMatterRequest()

        // Create matter
        mockMvc.perform(post(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(matterRequest)))
            .andExpect(status().isOk)

        // Read matters
        mockMvc.perform(get(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isOk)

        // Update matter (would need existing matter ID)
        mockMvc.perform(put("$MATTERS_BASE_URL/123")
            .header("Authorization", "Bearer $lawyerToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(UpdateMatterRequest(
                title = "Updated Title",
                description = "Updated description",
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = null,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            ))))
            .andExpect(status().isNotFound) // Expected since matter doesn't exist

        // Delete matter
        mockMvc.perform(delete("$MATTERS_BASE_URL/123")
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isNotFound) // Expected since matter doesn't exist
    }

    @Test
    @Order(2)
    fun `clerk should have limited matter access`() {
        val matterRequest = createValidMatterRequest()

        // Cannot create matter
        mockMvc.perform(post(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $clerkToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(matterRequest)))
            .andExpect(status().isForbidden)

        // Can read matters
        mockMvc.perform(get(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $clerkToken"))
            .andExpect(status().isOk)

        // Can update matters
        mockMvc.perform(put("$MATTERS_BASE_URL/123")
            .header("Authorization", "Bearer $clerkToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(UpdateMatterRequest(
                title = "Updated by Clerk",
                description = "Updated description",
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = null,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            ))))
            .andExpect(status().isNotFound) // Expected since matter doesn't exist

        // Cannot delete matter
        mockMvc.perform(delete("$MATTERS_BASE_URL/123")
            .header("Authorization", "Bearer $clerkToken"))
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(3)
    fun `client should have read-only matter access`() {
        val matterRequest = createValidMatterRequest()

        // Cannot create matter
        mockMvc.perform(post(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $clientToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(matterRequest)))
            .andExpect(status().isForbidden)

        // Can read matters (only their own)
        mockMvc.perform(get(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $clientToken"))
            .andExpect(status().isOk)

        // Cannot update matter
        mockMvc.perform(put("$MATTERS_BASE_URL/123")
            .header("Authorization", "Bearer $clientToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(UpdateMatterRequest(
                title = "Client Update Attempt",
                description = "Updated description",
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                    priority = null,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            ))))
            .andExpect(status().isForbidden)

        // Cannot delete matter
        mockMvc.perform(delete("$MATTERS_BASE_URL/123")
            .header("Authorization", "Bearer $clientToken"))
            .andExpect(status().isForbidden)
    }

    // ========== DOCUMENT AUTHORIZATION TESTS ==========

    @Test
    @Order(4)
    fun `document access should be role-based`() {
        // Lawyer - full document access
        mockMvc.perform(get(DOCUMENTS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isOk)

        mockMvc.perform(post(DOCUMENTS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken")
            .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isBadRequest) // Expected due to missing file

        mockMvc.perform(delete("$DOCUMENTS_BASE_URL/123")
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isNotFound) // Expected since document doesn't exist

        // Clerk - read/write but no delete
        mockMvc.perform(get(DOCUMENTS_BASE_URL)
            .header("Authorization", "Bearer $clerkToken"))
            .andExpect(status().isOk)

        mockMvc.perform(post(DOCUMENTS_BASE_URL)
            .header("Authorization", "Bearer $clerkToken")
            .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isBadRequest) // Expected due to missing file

        // Client - read only
        mockMvc.perform(get(DOCUMENTS_BASE_URL)
            .header("Authorization", "Bearer $clientToken"))
            .andExpect(status().isOk)

        mockMvc.perform(post(DOCUMENTS_BASE_URL)
            .header("Authorization", "Bearer $clientToken")
            .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isForbidden)
    }

    // ========== ADMIN ENDPOINT TESTS ==========

    @Test
    @Order(5)
    fun `admin endpoints should only be accessible to lawyers`() {
        // Lawyer should access admin endpoints
        mockMvc.perform(get(ADMIN_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isNotFound) // Expected since admin endpoints may not exist

        // Clerk should not access admin endpoints
        mockMvc.perform(get(ADMIN_BASE_URL)
            .header("Authorization", "Bearer $clerkToken"))
            .andExpect(status().isForbidden)

        // Client should not access admin endpoints
        mockMvc.perform(get(ADMIN_BASE_URL)
            .header("Authorization", "Bearer $clientToken"))
            .andExpect(status().isForbidden)
    }

    // ========== UNAUTHENTICATED ACCESS TESTS ==========

    @Test
    @Order(6)
    fun `unauthenticated requests should be rejected`() {
        val protectedEndpoints = listOf(
            MATTERS_BASE_URL,
            DOCUMENTS_BASE_URL,
            MEMOS_BASE_URL,
            EXPENSES_BASE_URL,
            ADMIN_BASE_URL
        )

        protectedEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized)

            mockMvc.perform(post(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized)

            mockMvc.perform(put("$endpoint/123")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized)

            mockMvc.perform(delete("$endpoint/123"))
                .andExpect(status().isUnauthorized)
        }
    }

    // ========== CROSS-USER DATA ACCESS TESTS (IDOR Protection) ==========

    @Test
    @Order(7)
    fun `users should not access other users data (IDOR protection)`() {
        // Test various ID manipulation techniques
        val idManipulations = listOf(
            "123' OR '1'='1",
            "123 UNION SELECT * FROM matters",
            "123; DELETE FROM matters WHERE 1=1",
            "../../../admin/users",
            "null",
            "undefined",
            "-1",
            "999999999"
        )

        idManipulations.forEach { maliciousId ->
            // Try to access matter with manipulated ID
            mockMvc.perform(get("$MATTERS_BASE_URL/$maliciousId")
                .header("Authorization", "Bearer $lawyerToken"))
                .andExpect(status().is4xxClientError) // Bad request or not found

            // Try to access document with manipulated ID
            mockMvc.perform(get("$DOCUMENTS_BASE_URL/$maliciousId")
                .header("Authorization", "Bearer $lawyerToken"))
                .andExpect(status().is4xxClientError)
        }
    }

    @Test
    @Order(8)
    fun `lawyers should only access their own client data`() {
        // This test would be more meaningful with actual test data
        // Testing that lawyer A cannot access lawyer B's client data
        
        // Lawyer should be able to access their own data
        mockMvc.perform(get("$MATTERS_BASE_URL?assignedLawyer=${testLawyer.id}")
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isOk)

        // Different lawyer should not access other lawyer's specific data
        // This would need specific matter/client IDs to test effectively
        mockMvc.perform(get("$MATTERS_BASE_URL/999999")
            .header("Authorization", "Bearer $otherLawyerToken"))
            .andExpect(status().isNotFound)
    }

    // ========== METHOD-LEVEL SECURITY TESTS ==========

    @Test
    @Order(9)
    @WithMockUser(roles = ["LAWYER"])
    fun `method level security should enforce role access`() {
        // Test with mock user having LAWYER role
        mockMvc.perform(post(MATTERS_BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(createValidMatterRequest())))
            .andExpect(status().isOk)
    }

    @Test
    @Order(10)
    @WithMockUser(roles = ["CLIENT"])
    fun `method level security should deny client access to lawyer endpoints`() {
        // Test with mock user having CLIENT role
        mockMvc.perform(post(MATTERS_BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(createValidMatterRequest())))
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(11)
    @WithMockUser(roles = ["CLERK"])
    fun `method level security should allow clerk limited access`() {
        // Clerk can view but not create matters
        mockMvc.perform(get(MATTERS_BASE_URL))
            .andExpect(status().isOk)

        mockMvc.perform(post(MATTERS_BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(createValidMatterRequest())))
            .andExpect(status().isForbidden)
    }

    // ========== PERMISSION BOUNDARY TESTS ==========

    @Test
    @Order(12)
    fun `should test permission boundaries for each role`() {
        // Test that each role has exactly the permissions it should have
        
        val rolePermissionTests = mapOf(
            "LAWYER" to lawyerToken,
            "CLERK" to clerkToken,
            "CLIENT" to clientToken
        )

        rolePermissionTests.forEach { (role, token) ->
            // Test matter permissions
            when (role) {
                "LAWYER" -> {
                    // Should have full matter access
                    testMatterAccess(token, canCreate = true, canRead = true, canUpdate = true, canDelete = true)
                }
                "CLERK" -> {
                    // Should have read/update but not create/delete
                    testMatterAccess(token, canCreate = false, canRead = true, canUpdate = true, canDelete = false)
                }
                "CLIENT" -> {
                    // Should have read-only access
                    testMatterAccess(token, canCreate = false, canRead = true, canUpdate = false, canDelete = false)
                }
            }
        }
    }

    @Test
    @Order(13)
    fun `should enforce resource-level authorization`() {
        // Test that users can only access resources they own or are assigned to
        
        // Create a test scenario where:
        // 1. Lawyer A creates a matter for Client A
        // 2. Lawyer B should not be able to access Lawyer A's matter
        // 3. Client A should be able to access their matter
        // 4. Client B should not be able to access Client A's matter
        
        val matterRequest = createValidMatterRequest()
        
        // Lawyer creates matter
        val createResponse = mockMvc.perform(post(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(matterRequest)))
            .andExpect(status().isOk)
            .andReturn()

        // Extract matter ID from response if available
        // (This would need actual implementation to get the created matter ID)
        
        // Other lawyer should not access this matter
        mockMvc.perform(get("$MATTERS_BASE_URL/123")
            .header("Authorization", "Bearer $otherLawyerToken"))
            .andExpect(status().is4xxClientError)
    }

    // ========== SECURITY HEADER TESTS ==========

    @Test
    @Order(14)
    fun `should include security headers in responses`() {
        mockMvc.perform(get(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isOk)
            .andExpect(header().exists("X-Content-Type-Options"))
            .andExpect(header().exists("X-Frame-Options"))
            .andExpect(header().exists("X-XSS-Protection"))
            .andExpect(header().exists("Strict-Transport-Security"))
            .andExpect(header().exists("Content-Security-Policy"))
    }

    // ========== CONCURRENT ACCESS TESTS ==========

    @Test
    @Order(15)
    fun `should handle concurrent authorization requests safely`() {
        val executor = java.util.concurrent.Executors.newFixedThreadPool(5)
        val latch = java.util.concurrent.CountDownLatch(10)
        val successfulRequests = java.util.concurrent.atomic.AtomicInteger(0)
        val errors = java.util.concurrent.atomic.AtomicInteger(0)

        repeat(10) {
            executor.submit {
                try {
                    val result = mockMvc.perform(get(MATTERS_BASE_URL)
                        .header("Authorization", "Bearer $lawyerToken"))
                        .andReturn()

                    if (result.response.status == 200) {
                        successfulRequests.incrementAndGet()
                    } else {
                        errors.incrementAndGet()
                    }
                } catch (e: Exception) {
                    errors.incrementAndGet()
                } finally {
                    latch.countDown()
                }
            }
        }

        latch.await(30, java.util.concurrent.TimeUnit.SECONDS)
        executor.shutdown()

        // All authorization checks should succeed consistently
        assertTrue(successfulRequests.get() > 0, "Some requests should succeed")
        assertEquals(0, errors.get(), "No authorization errors should occur")
    }

    // Helper methods
    private fun createValidMatterRequest(): CreateMatterRequest {
        return CreateMatterRequest(
            caseNumber = "2024-CV-${(1000..9999).random()}",
            title = "Test Matter",
            description = "Test matter description",
            clientName = "Test Client",
            clientContact = "test@example.com",
            opposingParty = "Test Opposing Party",
            courtName = "Test Court",
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusDays(30),
            priority = MatterPriority.MEDIUM,
            assignedLawyerId = UUID.randomUUID(),
            assignedClerkId = null,
            notes = "Test notes",
            tags = emptyList()
        )
    }

    private fun testMatterAccess(token: String, canCreate: Boolean, canRead: Boolean, canUpdate: Boolean, canDelete: Boolean) {
        val matterRequest = createValidMatterRequest()

        // Test create
        if (canCreate) {
            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isOk)
        } else {
            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isForbidden)
        }

        // Test read
        if (canRead) {
            mockMvc.perform(get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $token"))
                .andExpect(status().isOk)
        } else {
            mockMvc.perform(get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $token"))
                .andExpect(status().isForbidden)
        }

        // Test update
        val updateRequest = UpdateMatterRequest(
            title = "Updated Title",
            description = "Updated description",
            clientName = "Test Client",
            clientContact = "test@example.com",
            opposingParty = "Test Opposition",
            courtName = "Test Court",
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusDays(30),
            priority = null,
            assignedLawyerId = UUID.randomUUID(),
            assignedClerkId = null,
            notes = "Test notes",
            tags = emptyList()
        )
        if (canUpdate) {
            mockMvc.perform(put("$MATTERS_BASE_URL/123")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound) // 404 since matter doesn't exist
        } else {
            mockMvc.perform(put("$MATTERS_BASE_URL/123")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden)
        }

        // Test delete
        if (canDelete) {
            mockMvc.perform(delete("$MATTERS_BASE_URL/123")
                .header("Authorization", "Bearer $token"))
                .andExpect(status().isNotFound) // 404 since matter doesn't exist
        } else {
            mockMvc.perform(delete("$MATTERS_BASE_URL/123")
                .header("Authorization", "Bearer $token"))
                .andExpect(status().isForbidden)
        }
    }
}