---
task_id: T09_S04
sprint_sequence_id: S04
status: open
complexity: Medium
last_updated: 2025-01-18T00:00:00Z
---

# Task: Security Test Suite

## Description
Develop a comprehensive security test suite for the AsterManagement application including unit tests for security components, integration tests for authentication/authorization flows, and penetration testing scenarios. This ensures all security measures are properly tested and vulnerabilities are caught before production deployment.

## Goal / Objectives
- Create unit tests for all security components (JWT, encryption, validation)
- Develop integration tests for authentication and authorization flows
- Write penetration testing scenarios for common attack vectors
- Implement security regression tests
- Achieve >80% test coverage for security-critical code
- Document security testing procedures for team

## Acceptance Criteria
- [ ] JWT token generation and validation tests implemented
- [ ] Authentication flow tests cover all scenarios (login, logout, refresh)
- [ ] Authorization tests verify role-based access for all endpoints
- [ ] Input validation tests check for SQL injection and XSS
- [ ] Rate limiting tests verify proper enforcement
- [ ] Encryption/decryption tests ensure data protection
- [ ] Security header tests confirm proper configuration
- [ ] Penetration test scenarios documented and automated
- [ ] Security test coverage exceeds 80%
- [ ] All security tests integrated into CI/CD pipeline

## Subtasks
- [ ] Write unit tests for JWT service
- [ ] Create authentication integration tests
- [ ] Implement authorization test scenarios
- [ ] Add input validation security tests
- [ ] Write rate limiting behavior tests
- [ ] Test field-level encryption functionality
- [ ] Create security header validation tests
- [ ] Develop automated penetration test suite
- [ ] Add security regression test cases
- [ ] Document test execution procedures

## Technical Guidance

### JWT Security Tests
```kotlin
@SpringBootTest
class JwtSecurityTest {
    @Autowired
    private lateinit var tokenService: SecureTokenService
    
    @Autowired
    private lateinit var jwtDecoder: JwtDecoder
    
    @Test
    fun `should generate valid JWT with correct claims`() {
        // Given
        val user = User(
            id = 123L,
            username = "john.doe",
            roles = setOf(Role.LAWYER)
        )
        
        // When
        val tokenPair = tokenService.generateTokenPair(user)
        val jwt = jwtDecoder.decode(tokenPair.accessToken)
        
        // Then
        assertThat(jwt.subject).isEqualTo("123")
        assertThat(jwt.getClaimAsStringList("roles")).containsExactly("LAWYER")
        assertThat(jwt.expiresAt).isAfter(Instant.now())
        assertThat(jwt.expiresAt).isBefore(Instant.now().plus(16, ChronoUnit.MINUTES))
    }
    
    @Test
    fun `should reject expired tokens`() {
        // Given - create an expired token
        val expiredToken = createExpiredToken()
        
        // When/Then
        assertThrows<JwtValidationException> {
            jwtDecoder.decode(expiredToken)
        }
    }
    
    @Test
    fun `should reject tokens with invalid signature`() {
        // Given
        val tamperedToken = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMifQ.invalid_signature"
        
        // When/Then
        assertThrows<JwtValidationException> {
            jwtDecoder.decode(tamperedToken)
        }
    }
    
    @Test
    fun `refresh token should be properly hashed before storage`() {
        // Given
        val user = User(id = 123L, username = "test")
        
        // When
        val tokenPair = tokenService.generateTokenPair(user)
        val storedToken = refreshTokenRepository.findByUserId(123L)
        
        // Then
        assertThat(storedToken?.token).isNotEqualTo(tokenPair.refreshToken)
        assertThat(storedToken?.token).matches("^[A-Za-z0-9+/=]{44}$") // Base64 SHA-256 hash
    }
}
```

### Authentication Flow Tests
```kotlin
@SpringBootTest
@AutoConfigureMockMvc
class AuthenticationIntegrationTest {
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Test
    fun `should authenticate valid user and return tokens`() {
        // Given
        val loginRequest = """
            {
                "username": "john.doe",
                "password": "SecurePass123!"
            }
        """
        
        // When/Then
        mockMvc.post("/api/v1/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = loginRequest
        }.andExpect {
            status { isOk() }
            jsonPath("$.accessToken") { exists() }
            jsonPath("$.refreshToken") { exists() }
            jsonPath("$.expiresIn") { value(900) } // 15 minutes
        }
    }
    
    @Test
    fun `should reject invalid credentials`() {
        // Given
        val loginRequest = """
            {
                "username": "john.doe",
                "password": "WrongPassword"
            }
        """
        
        // When/Then
        mockMvc.post("/api/v1/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = loginRequest
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.error") { value("Invalid credentials") }
        }
    }
    
    @Test
    fun `should enforce account lockout after failed attempts`() {
        // Given
        val loginRequest = """
            {
                "username": "john.doe",
                "password": "WrongPassword"
            }
        """
        
        // When - Make 5 failed attempts
        repeat(5) {
            mockMvc.post("/api/v1/auth/login") {
                contentType = MediaType.APPLICATION_JSON
                content = loginRequest
            }
        }
        
        // Then - Account should be locked
        mockMvc.post("/api/v1/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = loginRequest.replace("WrongPassword", "SecurePass123!")
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.error") { value("Account locked due to multiple failed attempts") }
        }
    }
    
    @Test
    fun `should refresh access token with valid refresh token`() {
        // Given - Login first to get tokens
        val loginResponse = performLogin("john.doe", "SecurePass123!")
        val refreshToken = loginResponse.refreshToken
        
        // When
        mockMvc.post("/api/v1/auth/refresh") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"refreshToken": "$refreshToken"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.accessToken") { exists() }
            jsonPath("$.accessToken") { value(not(loginResponse.accessToken)) }
        }
    }
}
```

### Authorization Tests
```kotlin
@SpringBootTest
@AutoConfigureMockMvc
class AuthorizationTest {
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `lawyer should access matter creation endpoint`() {
        mockMvc.post("/api/v1/matters") {
            contentType = MediaType.APPLICATION_JSON
            content = validMatterRequest()
        }.andExpect {
            status { isOk() }
        }
    }
    
    @Test
    @WithMockUser(roles = ["CLIENT"])
    fun `client should not access matter creation endpoint`() {
        mockMvc.post("/api/v1/matters") {
            contentType = MediaType.APPLICATION_JSON
            content = validMatterRequest()
        }.andExpect {
            status { isForbidden() }
        }
    }
    
    @Test
    @WithMockUser(roles = ["CLERK"])
    fun `clerk should only view but not delete matters`() {
        // Can view
        mockMvc.get("/api/v1/matters/123")
            .andExpect { status { isOk() } }
        
        // Cannot delete
        mockMvc.delete("/api/v1/matters/123")
            .andExpect { status { isForbidden() } }
    }
    
    @Test
    fun `unauthenticated requests should be rejected`() {
        mockMvc.get("/api/v1/matters")
            .andExpect { status { isUnauthorized() } }
    }
    
    @Test
    @WithMockUser(username = "john.doe", roles = ["LAWYER"])
    fun `user should only access own client data`() {
        // Can access own client
        mockMvc.get("/api/v1/clients/123") // owned by john.doe
            .andExpect { status { isOk() } }
        
        // Cannot access other lawyer's client
        mockMvc.get("/api/v1/clients/456") // owned by jane.smith
            .andExpect { status { isForbidden() } }
    }
}
```

### Input Validation Security Tests
```kotlin
@SpringBootTest
@AutoConfigureMockMvc
class InputValidationSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should reject SQL injection attempts in search`() {
        val sqlInjectionPayloads = listOf(
            "'; DROP TABLE matters; --",
            "1' OR '1'='1",
            "1'; UPDATE users SET role='ADMIN' WHERE '1'='1",
            "1' UNION SELECT * FROM users--"
        )
        
        sqlInjectionPayloads.forEach { payload ->
            mockMvc.get("/api/v1/matters/search") {
                param("query", payload)
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.error") { value("Invalid search query") }
            }
        }
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should sanitize XSS attempts in matter creation`() {
        val xssPayloads = listOf(
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "javascript:alert('XSS')"
        )
        
        xssPayloads.forEach { payload ->
            val request = """
                {
                    "title": "$payload",
                    "description": "Test",
                    "clientName": "John Doe",
                    "caseNumber": "CA2024-123456"
                }
            """
            
            mockMvc.post("/api/v1/matters") {
                contentType = MediaType.APPLICATION_JSON
                content = request
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.errors[0].field") { value("title") }
                jsonPath("$.errors[0].message") { value("Title contains invalid characters") }
            }
        }
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should reject oversized inputs`() {
        val oversizedTitle = "A".repeat(300) // Limit is 255
        
        val request = """
            {
                "title": "$oversizedTitle",
                "description": "Test",
                "clientName": "John Doe",
                "caseNumber": "CA2024-123456"
            }
        """
        
        mockMvc.post("/api/v1/matters") {
            contentType = MediaType.APPLICATION_JSON
            content = request
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.errors[0].field") { value("title") }
            jsonPath("$.errors[0].message") { value("Title must not exceed 255 characters") }
        }
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should validate file upload types and sizes`() {
        // Test malicious file types
        val maliciousFile = MockMultipartFile(
            "file",
            "malware.exe",
            "application/x-msdownload",
            "malicious content".toByteArray()
        )
        
        mockMvc.multipart("/api/v1/documents/upload") {
            file(maliciousFile)
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.error") { value("File type not allowed") }
        }
        
        // Test oversized file
        val oversizedFile = MockMultipartFile(
            "file",
            "large.pdf",
            "application/pdf",
            ByteArray(11 * 1024 * 1024) // 11MB, limit is 10MB
        )
        
        mockMvc.multipart("/api/v1/documents/upload") {
            file(oversizedFile)
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.error") { value("File size exceeds maximum allowed size") }
        }
    }
}
```

### Penetration Testing Scenarios
```kotlin
@SpringBootTest
@AutoConfigureMockMvc
class PenetrationTest {
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Test
    fun `should prevent authentication bypass attempts`() {
        // Test various authentication bypass techniques
        val bypassAttempts = listOf(
            // Missing authentication header
            null to null,
            // Invalid token format
            "Authorization" to "Bearer invalid.token.here",
            // SQL injection in token
            "Authorization" to "Bearer ' OR '1'='1",
            // Token for different algorithm
            "Authorization" to "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9."
        )
        
        bypassAttempts.forEach { (header, value) ->
            val request = mockMvc.get("/api/v1/matters")
            if (header != null && value != null) {
                request.header(header, value)
            }
            request.andExpect { status { isUnauthorized() } }
        }
    }
    
    @Test
    fun `should prevent path traversal attacks`() {
        val pathTraversalPayloads = listOf(
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd"
        )
        
        pathTraversalPayloads.forEach { payload ->
            mockMvc.get("/api/v1/documents/download") {
                param("filename", payload)
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.error") { value("Invalid filename") }
            }
        }
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should prevent IDOR attacks`() {
        // Try to access another user's matter by ID manipulation
        val validMatterId = 123L // Owned by current user
        val otherMatterId = 456L // Owned by different user
        
        // Should access own matter
        mockMvc.get("/api/v1/matters/$validMatterId")
            .andExpect { status { isOk() } }
        
        // Should not access other's matter
        mockMvc.get("/api/v1/matters/$otherMatterId")
            .andExpect { status { isForbidden() } }
        
        // Try various ID manipulation techniques
        val idManipulations = listOf(
            "${validMatterId}' OR '1'='1",
            "${validMatterId} UNION SELECT * FROM matters",
            "${validMatterId}; DELETE FROM matters WHERE 1=1"
        )
        
        idManipulations.forEach { payload ->
            mockMvc.get("/api/v1/matters/$payload")
                .andExpect { status { isBadRequest() } }
        }
    }
    
    @Test
    fun `should enforce rate limiting under load`() {
        // Simulate brute force attack
        val executor = Executors.newFixedThreadPool(10)
        val latch = CountDownLatch(50)
        val rateLimitHit = AtomicBoolean(false)
        
        repeat(50) {
            executor.submit {
                try {
                    val result = mockMvc.post("/api/v1/auth/login") {
                        contentType = MediaType.APPLICATION_JSON
                        content = """{"username": "test", "password": "wrong"}"""
                    }.andReturn()
                    
                    if (result.response.status == 429) {
                        rateLimitHit.set(true)
                    }
                } finally {
                    latch.countDown()
                }
            }
        }
        
        latch.await(10, TimeUnit.SECONDS)
        executor.shutdown()
        
        assertThat(rateLimitHit.get()).isTrue()
    }
}
```

### Security Regression Tests
```kotlin
@SpringBootTest
class SecurityRegressionTest {
    
    @Test
    fun `CVE-2022-42889 Text4Shell should be mitigated`() {
        // Verify commons-text version is patched
        val commonsTextVersion = getLibraryVersion("org.apache.commons", "commons-text")
        assertThat(commonsTextVersion).isGreaterThanOrEqualTo("1.10.0")
    }
    
    @Test
    fun `JWT should not use none algorithm`() {
        // Try to use a token with 'none' algorithm
        val noneAlgorithmToken = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGVzIjpbIkFETUlOIl19."
        
        mockMvc.get("/api/v1/matters") {
            header("Authorization", "Bearer $noneAlgorithmToken")
        }.andExpect {
            status { isUnauthorized() }
        }
    }
    
    @Test
    fun `sensitive endpoints should not be exposed`() {
        val sensitiveEndpoints = listOf(
            "/actuator/env",
            "/actuator/configprops",
            "/actuator/heapdump",
            "/swagger-ui.html",
            "/v3/api-docs"
        )
        
        sensitiveEndpoints.forEach { endpoint ->
            mockMvc.get(endpoint)
                .andExpect { 
                    status { 
                        isOneOf(
                            HttpStatus.NOT_FOUND,
                            HttpStatus.UNAUTHORIZED,
                            HttpStatus.FORBIDDEN
                        ) 
                    } 
                }
        }
    }
}
```

### Test Utilities
```kotlin
object SecurityTestUtils {
    fun createExpiredToken(): String {
        val header = """{"alg":"RS256","typ":"JWT"}"""
        val payload = """{"sub":"123","exp":${Instant.now().minusSeconds(3600).epochSecond}}"""
        
        val encodedHeader = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(header.toByteArray())
        val encodedPayload = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(payload.toByteArray())
        
        // Note: This creates an invalid signature for testing
        return "$encodedHeader.$encodedPayload.invalid_signature"
    }
    
    fun performLogin(username: String, password: String): TokenResponse {
        // Helper method to perform login and extract tokens
        val response = mockMvc.post("/api/v1/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"username": "$username", "password": "$password"}"""
        }.andReturn()
        
        return objectMapper.readValue(response.response.contentAsString, TokenResponse::class.java)
    }
}
```

## Implementation Notes

### Test Coverage Requirements
1. **Authentication**: 100% coverage of auth endpoints
2. **Authorization**: Test every role/endpoint combination
3. **Input Validation**: Test all input fields with malicious data
4. **Encryption**: Verify encryption/decryption for all sensitive fields
5. **Rate Limiting**: Test limits for all protected endpoints

### CI/CD Integration
```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Security Test Suite
        run: |
          ./gradlew test --tests "*SecurityTest"
          ./gradlew test --tests "*AuthenticationTest"
          ./gradlew test --tests "*AuthorizationTest"
          ./gradlew test --tests "*PenetrationTest"
          
      - name: Generate Security Test Report
        run: ./gradlew jacocoTestReport
        
      - name: Check Security Test Coverage
        run: |
          ./gradlew jacocoTestCoverageVerification
          # Fail if security coverage < 80%
```

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.kt, file2.kt
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed