package dev.ryuzu.astermanagement.security.penetration

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.transaction.annotation.Transactional
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Comprehensive penetration testing suite for authentication endpoints
 * Tests OWASP Top 10 vulnerabilities and common attack vectors
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthenticationPenetrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    private val testEmail = "test@example.com"
    private val testPassword = "validPassword123!"
    private val invalidPassword = "wrongPassword"

    @BeforeEach
    fun setup() {
        // Setup test user if needed
    }

    @Test
    @DisplayName("Penetration Test: Brute Force Protection")
    fun testBruteForceProtection() {
        // Test multiple failed login attempts
        repeat(5) { attempt ->
            val loginRequest = mapOf(
                "email" to testEmail,
                "password" to "$invalidPassword$attempt"
            )

            mockMvc.perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest))
            ).andExpect(status().isUnauthorized)
        }

        // Sixth attempt should trigger rate limiting
        val loginRequest = mapOf(
            "email" to testEmail,
            "password" to invalidPassword
        )

        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        ).andExpect(status().isTooManyRequests)
    }

    @Test
    @DisplayName("Penetration Test: SQL Injection Attacks")
    fun testSQLInjectionProtection() {
        val sqlInjectionPayloads = listOf(
            "admin' OR '1'='1",
            "admin'; DROP TABLE users;--",
            "admin' UNION SELECT * FROM users--",
            "admin' AND (SELECT COUNT(*) FROM users) > 0--",
            "'; EXEC master..xp_cmdshell 'ping 127.0.0.1';--",
            "admin' OR 1=1#",
            "admin' OR 'a'='a",
            "') OR '1'='1'--",
            "' OR '1'='1' /*",
            "admin' WAITFOR DELAY '0:0:5'--"
        )

        sqlInjectionPayloads.forEach { payload ->
            val loginRequest = mapOf(
                "email" to payload,
                "password" to "testPassword"
            )

            val result = mockMvc.perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest))
            )

            // Should return unauthorized, not internal server error
            result.andExpect(
                status().`is`(
                    org.hamcrest.Matchers.anyOf(
                        org.hamcrest.Matchers.`is`(401),
                        org.hamcrest.Matchers.`is`(400)
                    )
                )
            )

            // Verify no SQL errors in response
            val response = result.andReturn().response.contentAsString
            assertFalse(
                response.contains("SQL", ignoreCase = true) ||
                        response.contains("syntax error", ignoreCase = true) ||
                        response.contains("database", ignoreCase = true),
                "SQL injection payload leaked database information: $payload"
            )
        }
    }

    @Test
    @DisplayName("Penetration Test: XSS Protection")
    fun testXSSProtection() {
        val xssPayloads = listOf(
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "';alert('XSS');//",
            "<svg onload=alert('XSS')>",
            "<%2Fscript%3E%3Cscript%3Ealert('XSS')%3C%2Fscript%3E",
            "<iframe src=\"javascript:alert('XSS')\"></iframe>",
            "<body onload=alert('XSS')>",
            "<input type=\"text\" value=\"\"><script>alert('XSS')</script>",
            "data:text/html,<script>alert('XSS')</script>"
        )

        xssPayloads.forEach { payload ->
            val loginRequest = mapOf(
                "email" to payload,
                "password" to "testPassword"
            )

            val result = mockMvc.perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest))
            ).andExpect(status().`is`(org.hamcrest.Matchers.anyOf(
                org.hamcrest.Matchers.`is`(400),
                org.hamcrest.Matchers.`is`(401)
            )))

            // Verify no script execution in response
            val response = result.andReturn().response.contentAsString
            assertFalse(
                response.contains("<script", ignoreCase = true) ||
                        response.contains("javascript:", ignoreCase = true),
                "XSS payload not properly sanitized: $payload"
            )
        }
    }

    @Test
    @DisplayName("Penetration Test: CSRF Protection")
    fun testCSRFProtection() {
        val loginRequest = mapOf(
            "email" to testEmail,
            "password" to testPassword
        )

        // Attempt login without CSRF token
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .header("Origin", "http://malicious-site.com")
                .header("Referer", "http://malicious-site.com")
        ).andExpect(
            status().`is`(org.hamcrest.Matchers.anyOf(
                org.hamcrest.Matchers.`is`(403),
                org.hamcrest.Matchers.`is`(401)
            ))
        )
    }

    @Test
    @DisplayName("Penetration Test: Session Fixation")
    fun testSessionFixationProtection() {
        // Attempt to fixate session ID
        val fixedSessionId = "MALICIOUS_SESSION_ID"

        val loginRequest = mapOf(
            "email" to testEmail,
            "password" to testPassword
        )

        val result = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .cookie(org.springframework.mock.web.MockCookie("JSESSIONID", fixedSessionId))
        )

        // Session ID should be different after successful login
        val newSessionId = result.andReturn().response.getCookie("JSESSIONID")?.value
        assertTrue(
            newSessionId != fixedSessionId,
            "Session fixation vulnerability detected - session ID not regenerated"
        )
    }

    @Test
    @DisplayName("Penetration Test: JWT Token Manipulation")
    fun testJWTTokenManipulation() {
        // Test with malformed JWT tokens
        val maliciousTokens = listOf(
            "malicious.token.here",
            "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTUxNjIzOTAyMn0.",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.invalid_signature",
            "",
            "Bearer null",
            "Bearer undefined"
        )

        maliciousTokens.forEach { token ->
            mockMvc.perform(
                get("/api/auth/profile")
                    .header("Authorization", "Bearer $token")
            ).andExpect(status().isUnauthorized)
        }
    }

    @Test
    @DisplayName("Penetration Test: Concurrent Attack Simulation")
    fun testConcurrentAttacks() {
        val threadCount = 10
        val attemptsPerThread = 5
        val executor = Executors.newFixedThreadPool(threadCount)
        val latch = CountDownLatch(threadCount)
        val successfulAttacks = mutableListOf<Boolean>()

        repeat(threadCount) { threadId ->
            executor.submit {
                try {
                    repeat(attemptsPerThread) { attempt ->
                        val loginRequest = mapOf(
                            "email" to "user$threadId@example.com",
                            "password" to "wrong$attempt"
                        )

                        val result = mockMvc.perform(
                            post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest))
                        ).andReturn()

                        // Check if any attack bypassed rate limiting
                        if (result.response.status == 200) {
                            successfulAttacks.add(true)
                        }
                    }
                } catch (e: Exception) {
                    // Expected for rate limited requests
                } finally {
                    latch.countDown()
                }
            }
        }

        latch.await(30, TimeUnit.SECONDS)
        executor.shutdown()

        // Verify no concurrent attacks succeeded
        assertTrue(
            successfulAttacks.isEmpty(),
            "Concurrent attacks bypassed security measures: ${successfulAttacks.size} successful attacks"
        )
    }

    @Test
    @DisplayName("Penetration Test: Parameter Pollution")
    fun testParameterPollution() {
        // Test parameter pollution attacks
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("email", testEmail)
                .param("email", "admin@example.com")
                .param("password", testPassword)
                .param("password", "adminPassword")
        ).andExpect(status().`is`(org.hamcrest.Matchers.anyOf(
            org.hamcrest.Matchers.`is`(400),
            org.hamcrest.Matchers.`is`(401),
            org.hamcrest.Matchers.`is`(415) // Unsupported Media Type
        )))
    }

    @Test
    @DisplayName("Penetration Test: HTTP Method Tampering")
    fun testHTTPMethodTampering() {
        val loginRequest = mapOf(
            "email" to testEmail,
            "password" to testPassword
        )

        // Test various HTTP methods on login endpoint
        listOf(
            put("/api/auth/login"),
            patch("/api/auth/login"),
            delete("/api/auth/login"),
            head("/api/auth/login"),
            options("/api/auth/login")
        ).forEach { requestBuilder ->
            mockMvc.perform(
                requestBuilder
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest))
            ).andExpect(status().`is`(org.hamcrest.Matchers.anyOf(
                org.hamcrest.Matchers.`is`(405), // Method Not Allowed
                org.hamcrest.Matchers.`is`(404)  // Not Found
            )))
        }
    }

    @Test
    @DisplayName("Penetration Test: Large Payload DoS")
    fun testLargePayloadDoS() {
        // Test with extremely large payloads
        val largeString = "A".repeat(1_000_000) // 1MB string

        val largePayload = mapOf(
            "email" to largeString,
            "password" to largeString
        )

        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(largePayload))
        ).andExpect(status().`is`(org.hamcrest.Matchers.anyOf(
            org.hamcrest.Matchers.`is`(400), // Bad Request
            org.hamcrest.Matchers.`is`(413), // Payload Too Large
            org.hamcrest.Matchers.`is`(500)  // Internal Server Error (if request size limit exceeded)
        )))
    }
}