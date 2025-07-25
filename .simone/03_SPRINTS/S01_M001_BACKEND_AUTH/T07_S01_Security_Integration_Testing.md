# T07_S01 - Security Integration & Testing

## Task Overview
**Duration**: 8 hours  
**Priority**: Critical  
**Dependencies**: T01_S01_Spring_Security_Configuration, T02_S01_JWT_Service_Implementation, T03_S01_Authentication_API_Endpoints, T04_S01_User_Entity_Repository_Layer, T05_S01_User_Service_Business_Logic, T06_S01_RBAC_System_Implementation  
**Sprint**: S01_M001_BACKEND_AUTH  

## Objective
Complete end-to-end security integration testing, implement comprehensive test suites, and perform security hardening to ensure the authentication infrastructure meets legal practice security requirements and is production-ready.

## Background
This final task of the S01_M001_BACKEND_AUTH sprint integrates all authentication components and validates the complete security infrastructure through comprehensive testing. The implementation must meet Japanese legal practice security standards with proper audit trails and compliance verification.

## Technical Requirements

### 1. Security Integration Testing
Create comprehensive test suites validating the complete authentication flow:

**Location**: `backend/modules/auth/test/integration/`

**Test Categories**:
- End-to-end authentication flows (login → API access → logout)
- JWT token lifecycle management (generation → validation → refresh → expiration)
- RBAC permission enforcement across all endpoints
- Multi-tenant data isolation verification
- Security vulnerability testing (OWASP Top 10)

### 2. Performance & Load Testing
Validate authentication system performance under load:

**Performance Targets**:
- Authentication endpoint: <200ms response time
- JWT token validation: <10ms per token
- Permission checks: <5ms per check
- Database queries: <50ms for user operations
- Concurrent users: Support 100+ simultaneous authentications

### 3. Security Hardening
Implement additional security measures for production readiness:

**Security Enhancements**:
- Rate limiting configuration for authentication endpoints
- Request/response sanitization and validation
- Security headers configuration
- Audit logging integration
- Error message security (no information leakage)

### 4. Compliance Testing
Verify legal practice compliance requirements:

**Compliance Areas**:
- Attorney-client privilege data protection
- Multi-tenant isolation verification
- Audit trail completeness
- Japanese data protection law compliance
- Password policy enforcement

## Implementation Guidance

### End-to-End Authentication Testing
Create comprehensive integration tests covering complete user journeys:

```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(OrderAnnotation::class)
class AuthenticationFlowIntegrationTest {

    @Test
    @Order(1)
    fun `should complete full authentication lifecycle`() {
        // 1. User registration
        val createUserRequest = CreateUserRequest(
            username = "lawyer@lawfirm.jp",
            email = "lawyer@lawfirm.jp",
            password = "SecurePass123!",
            firstName = "田中",
            lastName = "太郎",
            role = UserRole.LAWYER
        )
        
        val userResponse = testRestTemplate.postForEntity(
            "/api/users",
            createUserRequest,
            CreateUserResponse::class.java
        )
        assertThat(userResponse.statusCode).isEqualTo(HttpStatus.CREATED)
        
        // 2. User login
        val loginRequest = LoginRequest(
            email = "lawyer@lawfirm.jp",
            password = "SecurePass123!"
        )
        
        val loginResponse = testRestTemplate.postForEntity(
            "/api/auth/login",
            loginRequest,
            LoginResponse::class.java
        )
        assertThat(loginResponse.statusCode).isEqualTo(HttpStatus.OK)
        val tokens = loginResponse.body!!
        
        // 3. Access protected resource
        val headers = HttpHeaders()
        headers.setBearerAuth(tokens.accessToken)
        val entity = HttpEntity<Any>(headers)
        
        val profileResponse = testRestTemplate.exchange(
            "/api/auth/me",
            HttpMethod.GET,
            entity,
            UserProfileResponse::class.java
        )
        assertThat(profileResponse.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(profileResponse.body!!.email).isEqualTo("lawyer@lawfirm.jp")
        
        // 4. Token refresh
        val refreshRequest = RefreshTokenRequest(tokens.refreshToken)
        val refreshResponse = testRestTemplate.postForEntity(
            "/api/auth/refresh",
            refreshRequest,
            TokenResponse::class.java
        )
        assertThat(refreshResponse.statusCode).isEqualTo(HttpStatus.OK)
        
        // 5. Logout
        val logoutResponse = testRestTemplate.postForEntity(
            "/api/auth/logout",
            refreshRequest,
            Void::class.java
        )
        assertThat(logoutResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        
        // 6. Verify token invalidation
        val invalidAccessResponse = testRestTemplate.exchange(
            "/api/auth/me",
            HttpMethod.GET,
            entity,
            ErrorResponse::class.java
        )
        assertThat(invalidAccessResponse.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

    @Test
    @Order(2)
    fun `should enforce RBAC permissions correctly`() {
        // Create users with different roles
        val lawyer = createAndLoginUser("lawyer", UserRole.LAWYER)
        val clerk = createAndLoginUser("clerk", UserRole.CLERK)
        val client = createAndLoginUser("client", UserRole.CLIENT)
        
        // Test lawyer permissions (should have full access)
        val lawyerHeaders = createAuthHeaders(lawyer.accessToken)
        val lawyerResponse = testRestTemplate.exchange(
            "/api/cases",
            HttpMethod.GET,
            HttpEntity<Any>(lawyerHeaders),
            List::class.java
        )
        assertThat(lawyerResponse.statusCode).isEqualTo(HttpStatus.OK)
        
        // Test clerk permissions (should have limited access)
        val clerkHeaders = createAuthHeaders(clerk.accessToken)
        val clerkResponse = testRestTemplate.exchange(
            "/api/cases",
            HttpMethod.GET,
            HttpEntity<Any>(clerkHeaders),
            List::class.java
        )
        assertThat(clerkResponse.statusCode).isEqualTo(HttpStatus.OK)
        
        // Test client permissions (should have minimal access)
        val clientHeaders = createAuthHeaders(client.accessToken)
        val clientResponse = testRestTemplate.exchange(
            "/api/users",
            HttpMethod.GET,
            HttpEntity<Any>(clientHeaders),
            ErrorResponse::class.java
        )
        assertThat(clientResponse.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }
}
```

### Multi-Tenant Security Testing
Verify tenant isolation works correctly:

```kotlin
@Test
fun `should enforce tenant isolation in authentication`() {
    // Create users in different tenants
    val tenant1User = createUserInTenant("tenant1", "user1@tenant1.jp")
    val tenant2User = createUserInTenant("tenant2", "user2@tenant2.jp")
    
    // Login users from different tenants
    val tenant1Login = authenticateUser("user1@tenant1.jp", "password")
    val tenant2Login = authenticateUser("user2@tenant2.jp", "password")
    
    // Verify tenant isolation in JWT claims
    val tenant1Claims = jwtService.extractClaims(tenant1Login.accessToken)
    val tenant2Claims = jwtService.extractClaims(tenant2Login.accessToken)
    
    assertThat(tenant1Claims["tenantId"]).isNotEqualTo(tenant2Claims["tenantId"])
    
    // Verify cross-tenant access is blocked
    val tenant1Headers = createAuthHeaders(tenant1Login.accessToken)
    setTenantContext("tenant2") // Simulate cross-tenant access attempt
    
    val crossTenantResponse = testRestTemplate.exchange(
        "/api/users",
        HttpMethod.GET,
        HttpEntity<Any>(tenant1Headers),
        ErrorResponse::class.java
    )
    assertThat(crossTenantResponse.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
}
```

### Security Vulnerability Testing
Test against common security vulnerabilities:

```kotlin
@Test
fun `should prevent SQL injection in authentication`() {
    val maliciousLoginRequest = LoginRequest(
        email = "test@example.com'; DROP TABLE users; --",
        password = "password"
    )
    
    val response = testRestTemplate.postForEntity(
        "/api/auth/login",
        maliciousLoginRequest,
        ErrorResponse::class.java
    )
    
    // Should fail safely without executing injection
    assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    
    // Verify users table still exists
    val userCount = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM users",
        Int::class.java
    )
    assertThat(userCount).isGreaterThan(0)
}

@Test
fun `should prevent JWT token manipulation`() {
    val validToken = generateValidToken()
    
    // Attempt to modify token payload
    val tokenParts = validToken.split(".")
    val maliciousPayload = Base64.getEncoder().encodeToString(
        """{"sub":"admin","role":"SUPER_ADMIN"}""".toByteArray()
    )
    val maliciousToken = "${tokenParts[0]}.$maliciousPayload.${tokenParts[2]}"
    
    val headers = HttpHeaders()
    headers.setBearerAuth(maliciousToken)
    
    val response = testRestTemplate.exchange(
        "/api/auth/me",
        HttpMethod.GET,
        HttpEntity<Any>(headers),
        ErrorResponse::class.java
    )
    
    assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
}
```

### Performance Testing Implementation
Validate system performance under load:

```kotlin
@Test
fun `should handle concurrent authentication requests`() {
    val numberOfThreads = 50
    val requestsPerThread = 10
    val executorService = Executors.newFixedThreadPool(numberOfThreads)
    val latch = CountDownLatch(numberOfThreads)
    val results = ConcurrentLinkedQueue<Long>()
    
    repeat(numberOfThreads) { threadIndex ->
        executorService.submit {
            try {
                repeat(requestsPerThread) { requestIndex ->
                    val startTime = System.currentTimeMillis()
                    
                    val loginRequest = LoginRequest(
                        email = "user${threadIndex}_${requestIndex}@test.jp",
                        password = "TestPassword123!"
                    )
                    
                    val response = testRestTemplate.postForEntity(
                        "/api/auth/login",
                        loginRequest,
                        LoginResponse::class.java
                    )
                    
                    val endTime = System.currentTimeMillis()
                    results.add(endTime - startTime)
                    
                    if (response.statusCode == HttpStatus.OK) {
                        // Verify token is valid
                        assertThat(jwtService.validateToken(response.body!!.accessToken)).isTrue()
                    }
                }
            } finally {
                latch.countDown()
            }
        }
    }
    
    latch.await(30, TimeUnit.SECONDS)
    executorService.shutdown()
    
    // Analyze results
    val responseTimes = results.toList()
    val averageTime = responseTimes.average()
    val maxTime = responseTimes.maxOrNull() ?: 0
    val p95Time = responseTimes.sorted().let { 
        it[(it.size * 0.95).toInt()] 
    }
    
    println("Authentication Performance Results:")
    println("Average response time: ${averageTime}ms")
    println("Max response time: ${maxTime}ms")
    println("95th percentile: ${p95Time}ms")
    
    // Assert performance targets
    assertThat(averageTime).isLessThan(200.0)
    assertThat(p95Time).isLessThan(500)
}
```

### Security Configuration Validation
Verify security configurations are properly applied:

```kotlin
@Test
fun `should have proper security headers configured`() {
    val response = testRestTemplate.getForEntity(
        "/api/auth/me",
        String::class.java
    )
    
    val headers = response.headers
    
    // Verify security headers
    assertThat(headers["X-Content-Type-Options"]).contains("nosniff")
    assertThat(headers["X-Frame-Options"]).contains("DENY")
    assertThat(headers["X-XSS-Protection"]).contains("1; mode=block")
    assertThat(headers["Strict-Transport-Security"]).isNotEmpty()
    assertThat(headers["Content-Security-Policy"]).isNotEmpty()
}

@Test
fun `should enforce rate limiting on authentication endpoints`() {
    val maxAttempts = 5
    val email = "test@ratelimit.jp"
    
    // Attempt authentication more times than allowed
    repeat(maxAttempts + 2) { attempt ->
        val loginRequest = LoginRequest(
            email = email,
            password = "WrongPassword123!"
        )
        
        val response = testRestTemplate.postForEntity(
            "/api/auth/login",
            loginRequest,
            ErrorResponse::class.java
        )
        
        if (attempt < maxAttempts) {
            assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        } else {
            // Should be rate limited
            assertThat(response.statusCode).isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
            assertThat(response.body?.code).isEqualTo("RATE_LIMIT_EXCEEDED")
        }
    }
}
```

## Implementation Steps

1. **Create Integration Test Infrastructure** (2 hours)
   - Test configuration with Testcontainers
   - Test data setup and cleanup
   - Helper methods for common test operations
   - Mock external service integrations

2. **Implement Authentication Flow Tests** (2 hours)
   - End-to-end authentication scenarios
   - Token lifecycle management tests
   - Error handling and edge cases
   - Multi-tenant isolation verification

3. **Security Vulnerability Testing** (2 hours)
   - OWASP Top 10 vulnerability tests
   - Input validation and sanitization tests
   - JWT security tests
   - SQL injection prevention tests

4. **Performance and Load Testing** (1.5 hours)
   - Concurrent authentication tests
   - Performance benchmarking
   - Database query optimization verification
   - Memory and resource usage tests

5. **Compliance and Audit Testing** (0.5 hours)
   - Audit trail verification
   - Legal compliance checks
   - Data protection validation
   - Security configuration verification

## Testing Requirements

### Integration Test Coverage
Target >90% coverage across all authentication modules:
- Authentication flows
- JWT token operations
- RBAC permission checks
- Multi-tenant isolation
- Security hardening features

### Performance Test Benchmarks
- Authentication response time: <200ms (average)
- JWT validation: <10ms per token
- Permission checks: <5ms per check
- Concurrent user support: 100+ simultaneous users
- Database query performance: <50ms

### Security Test Validation
- OWASP Top 10 vulnerability protection
- Input validation effectiveness
- Error message security (no information leakage)
- Rate limiting functionality
- Security header configuration

## Success Criteria

- [ ] All authentication flows work end-to-end
- [ ] RBAC permissions enforced correctly across all endpoints
- [ ] Multi-tenant isolation prevents cross-tenant data access
- [ ] Performance targets met under concurrent load
- [ ] Security vulnerabilities properly mitigated
- [ ] Rate limiting prevents brute-force attacks
- [ ] Audit logging captures all security events
- [ ] Compliance requirements validated
- [ ] Integration test coverage >90%
- [ ] No security information leakage in error responses

## Security Considerations

### Legal Practice Requirements
- Attorney-client privilege: Verify no confidential data exposure
- Multi-tenant isolation: Complete separation between law firms
- Audit compliance: All authentication events logged
- Japanese data protection: Compliance with local regulations

### Production Security Hardening
- Rate limiting configuration for production loads
- Security headers for browser protection
- Error message sanitization
- JWT token security best practices
- Database security configuration

## Performance Considerations

- Authentication endpoint optimization
- Database query performance tuning
- JWT token generation/validation efficiency
- Connection pool configuration
- Memory usage optimization for concurrent users

## Files to Create/Modify

- `backend/modules/auth/test/integration/AuthenticationFlowIntegrationTest.kt`
- `backend/modules/auth/test/integration/MultiTenantSecurityTest.kt`
- `backend/modules/auth/test/integration/SecurityVulnerabilityTest.kt`
- `backend/modules/auth/test/integration/PerformanceTest.kt`
- `backend/modules/auth/test/integration/ComplianceTest.kt`
- `backend/modules/auth/config/SecurityTestConfiguration.kt`
- `backend/modules/auth/test/util/TestDataBuilder.kt`
- `backend/modules/auth/test/util/SecurityTestUtils.kt`

## Architectural References

### Clean Architecture Guidelines
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md`
- **Relevance**: Integration testing must validate all architectural layers work together properly while maintaining layer separation
- **Key Guidance**: Test domain logic independently of infrastructure, verify clean boundaries between layers, ensure integration tests cover complete user scenarios without violating architectural principles

### Legal Domain Security Requirements  
- **Reference**: `CLAUDE.md` - Legal Domain Implementation Checklist
- **Relevance**: Security testing must validate legal practice compliance including multi-tenant isolation and attorney-client privilege protection
- **Key Guidance**: Test cross-tenant data isolation thoroughly, verify audit logging captures all required events, validate role hierarchy enforcement matches legal practice requirements

### Technology Stack Standards
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md` - Technology Stack section
- **Relevance**: Integration testing must utilize Testcontainers with PostgreSQL and proper Spring Boot test configurations
- **Key Guidance**: Use @SpringBootTest with Testcontainers for database integration, implement proper test data management, achieve performance targets through load testing

## Related Tasks

- T01_S01_Spring_Security_Configuration
- T02_S01_JWT_Service_Implementation
- T03_S01_Authentication_API_Endpoints
- T04_S01_User_Entity_Repository_Layer
- T05_S01_User_Service_Business_Logic
- T06_S01_RBAC_System_Implementation

---

**Note**: This final integration task validates the complete authentication infrastructure is production-ready and meets legal practice security requirements. Comprehensive testing is critical before deployment.