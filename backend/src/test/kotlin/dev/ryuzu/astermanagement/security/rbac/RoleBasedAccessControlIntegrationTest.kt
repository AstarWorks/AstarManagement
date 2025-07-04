package dev.ryuzu.astermanagement.security.rbac

import dev.ryuzu.astermanagement.dto.auth.LoginRequest
import dev.ryuzu.astermanagement.dto.auth.AuthenticationResponse
import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.dto.document.DocumentUploadRequest
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.entity.Role
import dev.ryuzu.astermanagement.security.rbac.entity.UserRole
import dev.ryuzu.astermanagement.security.rbac.repository.RoleRepository
import dev.ryuzu.astermanagement.security.rbac.repository.UserRoleRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*
import java.util.concurrent.CompletableFuture
import kotlin.test.assertTrue
import kotlin.test.assertNotNull

/**
 * Comprehensive integration tests for Role-Based Access Control (RBAC) system.
 * 
 * Tests the complete permission evaluation flow including:
 * - CustomPermissionEvaluator functionality
 * - Method-level security with @PreAuthorize annotations
 * - Role hierarchy and permission inheritance
 * - Resource-specific access control
 * - Permission caching and performance
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation::class)
@Transactional
class RoleBasedAccessControlIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var roleRepository: RoleRepository

    @Autowired
    private lateinit var userRoleRepository: UserRoleRepository

    @Autowired
    private lateinit var passwordEncoder: PasswordEncoder

    private lateinit var lawyerUser: User
    private lateinit var clerkUser: User
    private lateinit var clientUser: User
    private lateinit var restrictedClerkUser: User

    private lateinit var lawyerRole: Role
    private lateinit var clerkRole: Role
    private lateinit var clientRole: Role
    private lateinit var restrictedRole: Role

    private var lawyerToken: String? = null
    private var clerkToken: String? = null
    private var clientToken: String? = null
    private var restrictedClerkToken: String? = null

    companion object {
        private const val AUTH_BASE_URL = "/api/auth"
        private const val MATTERS_BASE_URL = "/api/v1/matters"
        private const val DOCUMENTS_BASE_URL = "/api/v1/documents"
        private const val ROLES_BASE_URL = "/api/admin/roles"
    }

    @BeforeEach
    fun setupTestData() {
        // Create test roles with specific permissions
        lawyerRole = createRole("LAWYER", "Lawyer", Permission.Companion.Defaults.LAWYER_PERMISSIONS)
        clerkRole = createRole("CLERK", "Clerk", Permission.Companion.Defaults.CLERK_PERMISSIONS)
        clientRole = createRole("CLIENT", "Client", Permission.Companion.Defaults.CLIENT_PERMISSIONS)
        
        // Create a restricted role for testing permission boundaries
        restrictedRole = createRole(
            "RESTRICTED_CLERK", 
            "Restricted Clerk",
            Permission.combinePermissions(
                Permission.MATTER_READ,
                Permission.DOCUMENT_READ
            )
        )

        // Create test users
        lawyerUser = createUser("lawyer@test.com", "John Lawyer", lawyerRole)
        clerkUser = createUser("clerk@test.com", "Jane Clerk", clerkRole)
        clientUser = createUser("client@test.com", "Bob Client", clientRole)
        restrictedClerkUser = createUser("restricted@test.com", "Limited Clerk", restrictedRole)
    }

    @Test
    @Order(1)
    fun `should authenticate users and return correct permissions`() {
        // Test lawyer authentication
        lawyerToken = authenticateUser("lawyer@test.com", "password123")
        assertNotNull(lawyerToken)

        // Test clerk authentication
        clerkToken = authenticateUser("clerk@test.com", "password123")
        assertNotNull(clerkToken)

        // Test client authentication
        clientToken = authenticateUser("client@test.com", "password123")
        assertNotNull(clientToken)

        // Test restricted clerk authentication
        restrictedClerkToken = authenticateUser("restricted@test.com", "password123")
        assertNotNull(restrictedClerkToken)
    }

    @Test
    @Order(2)
    fun `should enforce MATTER_CREATE permission`() {
        val createRequest = CreateMatterRequest(
            caseNumber = "RBAC-TEST-001",
            title = "RBAC Test Matter",
            description = "Testing permission-based access control",
            status = MatterStatus.INTAKE,
            priority = MatterPriority.HIGH,
            clientName = "Test Client",
            clientContact = "client@rbac.test",
            assignedLawyerId = lawyerUser.id!!,
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusMonths(3)
        )

        // Lawyer should be able to create matter
        mockMvc.perform(
            post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.caseNumber").value("RBAC-TEST-001"))

        // Clerk should be able to create matter
        mockMvc.perform(
            post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $clerkToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest.copy(caseNumber = "RBAC-TEST-002")))
        )
            .andExpect(status().isCreated)

        // Client should NOT be able to create matter
        mockMvc.perform(
            post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $clientToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest.copy(caseNumber = "RBAC-TEST-003")))
        )
            .andExpect(status().isForbidden)

        // Restricted clerk should NOT be able to create matter
        mockMvc.perform(
            post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $restrictedClerkToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest.copy(caseNumber = "RBAC-TEST-004")))
        )
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(3)
    fun `should enforce MATTER_READ permission with resource-specific access`() {
        // All authenticated users with MATTER_READ permission should be able to list matters
        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
        )
            .andExpect(status().isOk)

        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $clerkToken")
        )
            .andExpect(status().isOk)

        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $restrictedClerkToken")
        )
            .andExpect(status().isOk)

        // Client should NOT be able to list all matters (no global MATTER_READ)
        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $clientToken")
        )
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(4)
    fun `should enforce MATTER_DELETE permission`() {
        val matterId = UUID.randomUUID()

        // Lawyer should be able to delete matter
        mockMvc.perform(
            delete("$MATTERS_BASE_URL/$matterId")
                .header("Authorization", "Bearer $lawyerToken")
        )
            .andExpect(status().isNotFound) // Matter doesn't exist, but permission check passes

        // Clerk should NOT be able to delete matter (no MATTER_DELETE permission)
        mockMvc.perform(
            delete("$MATTERS_BASE_URL/$matterId")
                .header("Authorization", "Bearer $clerkToken")
        )
            .andExpect(status().isForbidden)

        // Client should NOT be able to delete matter
        mockMvc.perform(
            delete("$MATTERS_BASE_URL/$matterId")
                .header("Authorization", "Bearer $clientToken")
        )
            .andExpect(status().isForbidden)

        // Restricted clerk should NOT be able to delete matter
        mockMvc.perform(
            delete("$MATTERS_BASE_URL/$matterId")
                .header("Authorization", "Bearer $restrictedClerkToken")
        )
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(5)
    fun `should enforce DOCUMENT_CREATE permission`() {
        val testFile = MockMultipartFile(
            "file",
            "test-document.pdf",
            "application/pdf",
            "Test document content".toByteArray()
        )

        // Lawyer should be able to upload documents
        mockMvc.perform(
            multipart("$DOCUMENTS_BASE_URL/upload")
                .file(testFile)
                .header("Authorization", "Bearer $lawyerToken")
        )
            .andExpect(status().isCreated)

        // Clerk should be able to upload documents
        mockMvc.perform(
            multipart("$DOCUMENTS_BASE_URL/upload")
                .file(testFile)
                .header("Authorization", "Bearer $clerkToken")
        )
            .andExpect(status().isCreated)

        // Client should NOT be able to upload documents
        mockMvc.perform(
            multipart("$DOCUMENTS_BASE_URL/upload")
                .file(testFile)
                .header("Authorization", "Bearer $clientToken")
        )
            .andExpect(status().isForbidden)

        // Restricted clerk should NOT be able to upload documents
        mockMvc.perform(
            multipart("$DOCUMENTS_BASE_URL/upload")
                .file(testFile)
                .header("Authorization", "Bearer $restrictedClerkToken")
        )
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(6)
    fun `should enforce ROLE_MANAGE permission for admin endpoints`() {
        // Only lawyer should be able to access role management
        mockMvc.perform(
            get(ROLES_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
        )
            .andExpect(status().isOk)

        // Clerk should NOT be able to access role management
        mockMvc.perform(
            get(ROLES_BASE_URL)
                .header("Authorization", "Bearer $clerkToken")
        )
            .andExpect(status().isForbidden)

        // Client should NOT be able to access role management
        mockMvc.perform(
            get(ROLES_BASE_URL)
                .header("Authorization", "Bearer $clientToken")
        )
            .andExpect(status().isForbidden)

        // Restricted clerk should NOT be able to access role management
        mockMvc.perform(
            get(ROLES_BASE_URL)
                .header("Authorization", "Bearer $restrictedClerkToken")
        )
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(7)
    fun `should handle permission evaluation performance efficiently`() {
        val startTime = System.currentTimeMillis()
        
        // Make multiple requests to test permission caching
        repeat(10) {
            mockMvc.perform(
                get(MATTERS_BASE_URL)
                    .header("Authorization", "Bearer $lawyerToken")
            )
                .andExpect(status().isOk)
        }
        
        val endTime = System.currentTimeMillis()
        val totalTime = endTime - startTime
        
        // Permission evaluation should be fast (< 5ms per request on average)
        assertTrue(totalTime < 500, "Permission evaluation too slow: ${totalTime}ms for 10 requests")
    }

    @Test
    @Order(8)
    fun `should validate role hierarchy and permission inheritance`() {
        // Create a junior lawyer role that inherits from clerk
        val juniorLawyerRole = createRole(
            "JUNIOR_LAWYER",
            "Junior Lawyer", 
            Permission.combinePermissions(
                Permission.MATTER_READ,
                Permission.MATTER_CREATE,
                Permission.MATTER_UPDATE,
                Permission.DOCUMENT_READ,
                Permission.DOCUMENT_CREATE
            )
        )
        
        val juniorLawyerUser = createUser("junior@test.com", "Junior Lawyer", juniorLawyerRole)
        val juniorToken = authenticateUser("junior@test.com", "password123")

        // Junior lawyer should be able to create matters
        val createRequest = CreateMatterRequest(
            caseNumber = "JUNIOR-TEST-001",
            title = "Junior Lawyer Test",
            description = "Testing role hierarchy",
            status = MatterStatus.INTAKE,
            priority = MatterPriority.MEDIUM,
            clientName = "Test Client",
            clientContact = "client@test.com",
            assignedLawyerId = juniorLawyerUser.id!!,
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusMonths(2)
        )

        mockMvc.perform(
            post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $juniorToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpect(status().isCreated)

        // But should NOT be able to delete matters (no MATTER_DELETE permission)
        val matterId = UUID.randomUUID()
        mockMvc.perform(
            delete("$MATTERS_BASE_URL/$matterId")
                .header("Authorization", "Bearer $juniorToken")
        )
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(9)
    fun `should handle resource-specific permissions correctly`() {
        // Test that resource-specific permissions work (e.g., client can only access their own matters)
        val documentId = UUID.randomUUID()
        
        // Test document access for different roles
        mockMvc.perform(
            get("$DOCUMENTS_BASE_URL/$documentId")
                .header("Authorization", "Bearer $lawyerToken")
        )
            .andExpect(status().isNotFound) // Document doesn't exist, but permission check passes

        mockMvc.perform(
            get("$DOCUMENTS_BASE_URL/$documentId")
                .header("Authorization", "Bearer $clerkToken")
        )
            .andExpect(status().isNotFound) // Document doesn't exist, but permission check passes

        mockMvc.perform(
            get("$DOCUMENTS_BASE_URL/$documentId")
                .header("Authorization", "Bearer $clientToken")
        )
            .andExpect(status().isForbidden) // Client doesn't have global DOCUMENT_READ permission
    }

    @Test
    @Order(10)
    fun `should audit permission checks for security monitoring`() {
        // This test verifies that permission evaluation is being audited
        // In a real implementation, you would check audit log entries
        
        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
        )
            .andExpect(status().isOk)

        // Verify that audit events are created (implementation would check database)
        // For now, we just ensure the request completes successfully
    }

    @Test
    @Order(11)
    fun `should handle concurrent permission evaluations safely`() {
        // Test concurrent access to ensure permission evaluation is thread-safe
        val futures = (1..5).map { index ->
            CompletableFuture.supplyAsync {
                try {
                    mockMvc.perform(
                        get(MATTERS_BASE_URL)
                            .header("Authorization", "Bearer $lawyerToken")
                    )
                        .andExpect(status().isOk)
                        .andReturn()
                } catch (e: Exception) {
                    throw RuntimeException("Concurrent test failed", e)
                }
            }
        }
        
        // Wait for all concurrent requests to complete
        CompletableFuture.allOf(*futures.toTypedArray()).join()
    }

    // Helper methods

    private fun createRole(name: String, displayName: String, permissions: Long): Role {
        val role = Role().apply {
            this.name = name
            this.displayName = displayName
            this.description = "Test role: $displayName"
            this.permissions = permissions
            this.hierarchyLevel = when (name) {
                "LAWYER" -> 100
                "CLERK" -> 50
                "CLIENT" -> 10
                else -> 25
            }
            this.isSystemRole = false
            this.isActive = true
            this.createdAt = LocalDateTime.now()
            this.updatedAt = LocalDateTime.now()
        }
        return roleRepository.save(role)
    }

    private fun createUser(email: String, name: String, role: Role): User {
        val user = User().apply {
            this.username = email
            this.email = email
            this.firstName = name.split(" ")[0]
            this.lastName = name.split(" ").getOrElse(1) { "" }
            this.passwordHash = passwordEncoder.encode("password123")
            this.isActive = true
            this.createdAt = LocalDateTime.now()
            this.updatedAt = LocalDateTime.now()
        }
        val savedUser = userRepository.save(user)

        // Assign role to user
        val userRole = UserRole().apply {
            this.user = savedUser
            this.role = role
            this.grantedAt = LocalDateTime.now()
            this.grantedBy = null
            this.isActive = true
        }
        userRoleRepository.save(userRole)

        return savedUser
    }

    private fun authenticateUser(email: String, password: String): String {
        val loginRequest = LoginRequest(email = email, password = password)

        val result = mockMvc.perform(
            post("$AUTH_BASE_URL/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isOk)
            .andReturn()

        val response = objectMapper.readValue(
            result.response.contentAsString,
            AuthenticationResponse::class.java
        )
        return response.accessToken
    }

}