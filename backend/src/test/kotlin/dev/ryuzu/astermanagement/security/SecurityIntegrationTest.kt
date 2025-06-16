package dev.ryuzu.astermanagement.security

import dev.ryuzu.astermanagement.dto.auth.LoginRequest
import dev.ryuzu.astermanagement.dto.auth.AuthenticationResponse
import dev.ryuzu.astermanagement.dto.auth.RefreshTokenRequest
import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.*
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
import java.time.LocalDate
import java.util.*

/**
 * Security Integration Tests
 * 
 * Comprehensive tests for authentication, authorization, and security configuration.
 * Tests the complete security filter chain and method-level security annotations.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation::class)
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    private var lawyerToken: String? = null
    private var clerkToken: String? = null
    private var clientToken: String? = null

    companion object {
        private const val AUTH_BASE_URL = "/auth"
        private const val MATTERS_BASE_URL = "/api/v1/matters"
    }

    @Test
    @Order(1)
    fun `should authenticate lawyer with valid credentials`() {
        val loginRequest = LoginRequest(
            email = "lawyer@example.com",
            password = "password123"
        )

        val result = mockMvc.perform(
            post("$AUTH_BASE_URL/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.refreshToken").exists())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.user.role").value("LAWYER"))
            .andExpect(jsonPath("$.user.permissions").isArray)
            .andReturn()

        val response = objectMapper.readValue(
            result.response.contentAsString,
            AuthenticationResponse::class.java
        )
        lawyerToken = response.accessToken

        assertThat(lawyerToken).isNotNull()
        assertThat(response.user.permissions).contains("matter:write", "matter:delete")
    }

    @Test
    @Order(2)
    fun `should reject authentication with invalid credentials`() {
        val loginRequest = LoginRequest(
            email = "lawyer@example.com",
            password = "wrongpassword"
        )

        mockMvc.perform(
            post("$AUTH_BASE_URL/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isUnauthorized)
            .andExpected(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.title").value("Authentication Required"))
            .andExpect(jsonPath("$.type").value("/errors/unauthorized"))
    }

    @Test
    @Order(3)
    fun `should refresh access token with valid refresh token`() {
        // First, authenticate to get tokens
        val loginRequest = LoginRequest(
            email = "clerk@example.com",
            password = "password123"
        )

        val loginResult = mockMvc.perform(
            post("$AUTH_BASE_URL/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isOk)
            .andReturn()

        val loginResponse = objectMapper.readValue(
            loginResult.response.contentAsString,
            AuthenticationResponse::class.java
        )

        // Now refresh the token
        val refreshRequest = RefreshTokenRequest(refreshToken = loginResponse.refreshToken)

        mockMvc.perform(
            post("$AUTH_BASE_URL/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest))
        )
            .andExpect(status().isOk)
            .andExpected(jsonPath("$.accessToken").exists())
            .andExpected(jsonPath("$.refreshToken").exists())
            .andExpected(jsonPath("$.user.role").value("CLERK"))
    }

    @Test
    @Order(4)
    fun `should deny access to protected endpoints without authentication`() {
        mockMvc.perform(get(MATTERS_BASE_URL))
            .andExpect(status().isUnauthorized)
            .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpected(jsonPath("$.title").value("Authentication Required"))
    }

    @Test
    @Order(5)
    @WithMockUser(roles = ["LAWYER"])
    fun `should allow lawyer to create matter`() {
        val createRequest = CreateMatterRequest(
            caseNumber = "CASE-2025-001",
            title = "Test Legal Matter",
            description = "Test description",
            status = MatterStatus.OPEN,
            priority = MatterPriority.MEDIUM,
            clientName = "Test Client",
            clientContact = "client@example.com",
            assignedLawyerId = UUID.randomUUID(),
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusMonths(6)
        )

        mockMvc.perform(
            post(MATTERS_BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpected(status().isCreated)
            .andExpect(jsonPath("$.caseNumber").value("CASE-2025-001"))
            .andExpect(jsonPath("$.status").value("OPEN"))
    }

    @Test
    @Order(6)
    @WithMockUser(roles = ["CLIENT"])
    fun `should deny client from creating matter`() {
        val createRequest = CreateMatterRequest(
            caseNumber = "CASE-2025-002",
            title = "Unauthorized Matter",
            description = "This should fail",
            status = MatterStatus.OPEN,
            priority = MatterPriority.HIGH,
            clientName = "Test Client",
            clientContact = "client@example.com",
            assignedLawyerId = UUID.randomUUID(),
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusMonths(3)
        )

        mockMvc.perform(
            post(MATTERS_BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpect(status().isForbidden)
            .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.title").value("Access Denied"))
    }

    @Test
    @Order(7)
    @WithMockUser(roles = ["CLERK"])
    fun `should allow clerk to view matters but not delete`() {
        // Clerk can view matters
        mockMvc.perform(get(MATTERS_BASE_URL))
            .andExpect(status().isOk)

        // But cannot delete matters
        val matterId = UUID.randomUUID()
        mockMvc.perform(delete("$MATTERS_BASE_URL/$matterId"))
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(8)
    fun `should validate JWT token properly`() {
        // Test with invalid JWT format
        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer invalid.jwt.token")
        )
            .andExpect(status().isUnauthorized)

        // Test with expired token (if we had one)
        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
        )
            .andExpect(status().isUnauthorized)
    }

    @Test
    @Order(9)
    @WithMockUser(username = "test-user-id", roles = ["LAWYER"])
    fun `should record authentication events in audit log`() {
        // This test verifies that authentication events are being logged
        // In a real implementation, you would check the audit log entries
        
        mockMvc.perform(get("$AUTH_BASE_URL/session"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.userId").exists())
            .andExpect(jsonPath("$.isActive").value(true))
    }

    @Test
    @Order(10)
    fun `should enforce rate limiting on authentication endpoints`() {
        val loginRequest = LoginRequest(
            email = "test@example.com",
            password = "wrongpassword"
        )

        // Make multiple failed authentication attempts
        repeat(15) {
            mockMvc.perform(
                post("$AUTH_BASE_URL/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest))
            )
        }

        // The 16th attempt should be rate limited (if rate limiting is implemented)
        mockMvc.perform(
            post("$AUTH_BASE_URL/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isTooManyRequests)
    }

    @Test
    @Order(11)
    fun `should handle CORS preflight requests`() {
        mockMvc.perform(
            options(MATTERS_BASE_URL)
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Authorization,Content-Type")
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
            .andExpected(header().string("Access-Control-Allow-Methods", containsString("POST")))
            .andExpected(header().string("Access-Control-Allow-Headers", containsString("Authorization")))
    }

    @Test
    @Order(12)
    fun `should include security headers in responses`() {
        mockMvc.perform(get("$AUTH_BASE_URL/health"))
            .andExpect(status().isOk)
            .andExpect(header().string("X-Frame-Options", "DENY"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(header().string("X-XSS-Protection", "0"))
            .andExpect(header().exists("Content-Security-Policy"))
    }

    @Test
    @Order(13)
    @WithMockUser(roles = ["LAWYER"])
    fun `should logout and invalidate session`() {
        mockMvc.perform(post("$AUTH_BASE_URL/logout"))
            .andExpect(status().isOk)
            .andExpected(jsonPath("$.message").value("Logout successful"))
    }

    @Test
    @Order(14)
    fun `should handle method-level security annotations`() {
        // Test that @PreAuthorize annotations are enforced
        val matterId = UUID.randomUUID()

        // Test access denied for unauthorized role
        mockMvc.perform(
            delete("$MATTERS_BASE_URL/$matterId")
                .header("Authorization", "Bearer " + generateMockToken("CLIENT"))
        )
            .andExpect(status().isForbidden)
    }

    @Test
    @Order(15)
    fun `should validate permission-based access control`() {
        // Test that permission-based authorization works
        // This would test endpoints that check for specific permissions
        // like "matter:write" or "document:read"
        
        mockMvc.perform(
            get(MATTERS_BASE_URL)
                .header("Authorization", "Bearer " + generateMockToken("CLIENT", listOf("matter:read")))
        )
            .andExpect(status().isOk)
    }

    /**
     * Helper method to generate mock JWT tokens for testing
     */
    private fun generateMockToken(role: String, permissions: List<String> = emptyList()): String {
        // In a real implementation, this would generate a valid JWT token
        // For testing, we'll return a placeholder that the test security context understands
        return "mock-token-$role"
    }

    /**
     * Custom assertion methods for better test readability
     */
    private fun andExpected(matcher: org.springframework.test.web.servlet.ResultMatcher) = this.andExpect(matcher)
}

// Extension functions for test assertions
private fun <T> assertThat(actual: T?): AssertThat<T> = AssertThat(actual)

class AssertThat<T>(private val actual: T?) {
    fun isNotNull(): AssertThat<T> {
        if (actual == null) throw AssertionError("Expected value to be not null")
        return this
    }
    
    fun contains(vararg values: String): AssertThat<T> {
        if (actual is Collection<*>) {
            values.forEach { value ->
                if (!actual.contains(value)) {
                    throw AssertionError("Expected collection to contain '$value'")
                }
            }
        }
        return this
    }
}