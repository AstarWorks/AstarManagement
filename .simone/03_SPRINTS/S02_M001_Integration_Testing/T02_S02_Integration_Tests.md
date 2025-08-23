---
task_id: T02_S02
title: Integration Test Suite
sprint: S02_M001
complexity: Medium
status: planned
created: 2025-01-23
estimated_hours: 16
priority: high
---

## Task Overview

Implement comprehensive integration tests for the Auth0 authentication system, validating the complete flow from frontend authentication through backend JWT validation. This includes testing the Sidebase/nuxt-auth integration with Auth0, Spring Boot JWT validation, cookie handling, and CORS configuration.

## Objectives

- Test backend JWT validation with real Auth0 tokens
- Validate frontend proxy and auth flow using Sidebase/nuxt-auth
- Test cookie security and handling mechanisms  
- Verify CORS configuration for cross-origin requests
- Ensure proper error handling and token refresh flows
- Validate tenant isolation and business context extraction

## Acceptance Criteria

- [ ] Backend tests validate real JWT tokens from Auth0
- [ ] Frontend tests mock Auth0 responses for deterministic testing
- [ ] Cookie security tests pass (httpOnly, secure, sameSite)
- [ ] CORS tests validate allowed origins and headers
- [ ] Test coverage > 80% for authentication components
- [ ] Integration tests run in CI/CD pipeline
- [ ] Performance tests validate JWT validation latency <50ms
- [ ] Error scenarios are properly tested (expired tokens, invalid claims)

## Subtasks

### 1. Backend Integration Tests

**JWT Claims Extraction & Validation**
- [ ] Test real Auth0 JWT token parsing and validation
- [ ] Validate business context extraction from JWT claims
- [ ] Test tenant ID extraction from `org_id` and custom claims
- [ ] Test role mapping from Auth0 roles to business roles
- [ ] Test error handling for malformed or expired tokens

**Security Configuration Tests**
- [ ] Test JwtAuthenticationConverter with various token scenarios
- [ ] Validate SecurityConfig integration with real JWT tokens
- [ ] Test CORS configuration for allowed origins
- [ ] Test API endpoint protection with JWT authentication
- [ ] Validate custom authentication entry points and access denied handlers

### 2. Frontend Integration Tests

**Sidebase/nuxt-auth Integration**
- [ ] Test Auth0 provider configuration and callback handling
- [ ] Mock Auth0 responses for deterministic testing
- [ ] Test JWT token storage and retrieval from cookies
- [ ] Validate session management and token refresh flows
- [ ] Test logout flow and session cleanup

**API Integration Tests**
- [ ] Test authenticated API requests with JWT tokens
- [ ] Validate proxy route functionality
- [ ] Test error handling for 401/403 responses
- [ ] Test automatic token refresh on expiration

### 3. Cookie & Session Security Tests

**Cookie Security Validation**
- [ ] Test httpOnly flag to prevent JavaScript access
- [ ] Validate secure flag for HTTPS-only cookies
- [ ] Test sameSite configuration for CSRF protection
- [ ] Validate cookie expiration and cleanup
- [ ] Test cookie domain and path restrictions

### 4. CORS Integration Tests

**Cross-Origin Request Validation**
- [ ] Test preflight OPTIONS requests for allowed origins
- [ ] Validate Access-Control-Allow-Headers configuration
- [ ] Test actual CORS requests with authentication
- [ ] Validate CORS error handling for disallowed origins
- [ ] Test ngrok tunnel origins for development

### 5. Performance & Load Tests

**JWT Validation Performance**
- [ ] Measure JWT validation latency (target <50ms)
- [ ] Test concurrent authentication requests
- [ ] Validate JWKS caching effectiveness
- [ ] Test authentication under load

## Technical Guidance

### Backend Test Framework Patterns

**Base Test Classes**
```kotlin
// Use existing IntegrationTest base class
@SpringBootTest
@AutoConfigureMockMvc
abstract class IntegrationTest {
    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper
}

// Use existing test configuration
@ActiveProfiles("test")
@TestPropertySource(properties = ["auth.mock.enabled=true"])
```

**JWT Test Token Creation**
```kotlin
// Follow pattern from JwtClaimsExtractionIntegrationTest
private fun createTestJwt(
    subject: String,
    orgId: String? = null,
    customTenantId: String? = null,
    roles: List<String> = emptyList()
): Jwt {
    // Create Spring Security JWT with proper claims
}
```

**MockMvc Testing Pattern**
```kotlin
// Use existing pattern from CorsIntegrationTest
mockMvc.perform(
    post("/api/v1/protected")
        .header("Authorization", "Bearer $validJwtToken")
        .header("Origin", "http://localhost:3000")
        .contentType(MediaType.APPLICATION_JSON)
        .content(requestBody)
)
    .andExpect(status().isOk)
    .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
```

### Frontend Test Framework Patterns

**Vitest Configuration**
```typescript
// Follow existing pattern from auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Nuxt composables
vi.mock('#app', () => ({
  navigateTo: vi.fn(),
  defineNuxtRouteMiddleware: (fn: any) => fn
}))
```

**Auth0 Response Mocking**
```typescript
// Mock Auth0 provider responses
const mockAuth0Response = {
  access_token: 'mock-jwt-token',
  id_token: 'mock-id-token', 
  token_type: 'Bearer',
  expires_in: 3600
}
```

**API Integration Testing**
```typescript
// Test authenticated API calls
const mockApiCall = vi.fn().mockResolvedValue({
  data: { message: 'success' },
  status: 200
})
```

### Mock/Stub Strategies

**Backend JWT Mocking**
- Use Spring Security's Jwt.Builder for test token creation
- Mock JwtDecoder for unit tests, use real decoder for integration tests
- Create test data factories for different user/tenant scenarios

**Frontend Auth0 Mocking**
- Mock NextAuth callbacks and session management
- Create deterministic Auth0 response fixtures
- Mock fetch requests to Auth0 endpoints

**Test Data Factories**
```kotlin
// Backend test data factory
object TestJwtFactory {
    fun createValidJwt(tenantId: String, roles: List<String>): Jwt
    fun createExpiredJwt(): Jwt
    fun createMalformedJwt(): Jwt
}
```

```typescript
// Frontend test data factory
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  roles: ['USER'],
  tenantId: 'test-tenant',
  ...overrides
})
```

### Environment Setup

**Test Configuration**
```properties
# application-test.yml
auth:
  mock:
    enabled: true
  jwt:
    jwks-uri: http://localhost:8080/mock-auth/.well-known/jwks.json
  
cors:
  allowed-origins:
    - http://localhost:3000
    - https://test.ngrok.io
```

**Mock JWKS Endpoint**
- Set up test JWKS endpoint for JWT validation
- Use RSA key pairs for signing test tokens
- Mock Auth0 /.well-known/jwks.json responses

## Implementation Notes

### Integration Test Architecture

**Backend Integration Strategy**
1. **Component Integration**: Test JwtAuthenticationConverter + JwtClaimsExtractor together
2. **Security Integration**: Test SecurityConfig + CORS + JWT validation end-to-end
3. **API Integration**: Test protected endpoints with real authentication flow
4. **Database Integration**: Test tenant isolation with different JWT claims

**Frontend Integration Strategy** 
1. **Auth Provider Integration**: Test Sidebase/nuxt-auth with mocked Auth0
2. **Session Integration**: Test cookie-based session management
3. **API Integration**: Test authenticated requests through proxy
4. **Navigation Integration**: Test middleware-based route protection

**Cross-System Integration**
1. **Token Flow**: Frontend cookie → API Authorization header → Backend validation
2. **Error Flow**: Backend 401 → Frontend token refresh → Retry request
3. **Logout Flow**: Frontend logout → Clear cookies → Backend token invalidation

### Test Environment Requirements

**Development Test Setup**
- Mock Auth0 responses for consistent testing
- Test database with sample tenant/user data
- Mock JWKS endpoint with test certificates
- Docker containers for isolated testing

**CI/CD Test Setup**
- Automated test execution on PR creation
- Test environment provisioning
- Performance benchmarking in CI
- Security vulnerability scanning

### Performance Testing Approach

**JWT Validation Benchmarks**
```kotlin
@Test
fun `JWT validation should complete within 50ms`() {
    val jwt = createTestJwt("user-123", "tenant-456", listOf("USER"))
    
    val duration = measureTimeMillis {
        jwtAuthenticationConverter.convert(jwt)
    }
    
    assertThat(duration).isLessThan(50)
}
```

**Concurrent Request Testing**
```kotlin
@Test
fun `should handle concurrent JWT validation`() {
    val futures = (1..100).map { i ->
        CompletableFuture.supplyAsync {
            jwtAuthenticationConverter.convert(createTestJwt("user-$i"))
        }
    }
    
    val results = CompletableFuture.allOf(*futures.toTypedArray()).get(5, TimeUnit.SECONDS)
    assertThat(results).isCompleted
}
```

## Dependencies

### Technical Dependencies
- Existing JWT validation from Sprint S01 (TX01, TX03)
- JwtClaimsExtractor and JwtAuthenticationConverter components
- SecurityConfig with CORS configuration
- Sidebase/nuxt-auth integration
- Test environment with Auth0 configuration

### Infrastructure Dependencies
- Test Auth0 tenant for integration testing
- Mock server setup for deterministic responses
- CI/CD pipeline configuration
- Test database with sample data
- Docker containers for test isolation

### Knowledge Dependencies
- Understanding of JWT token structure and claims
- Familiarity with Spring Security testing patterns
- Knowledge of Vitest and Vue/Nuxt testing
- CORS configuration and browser security model
- Auth0 integration patterns and best practices

## Testing Approach

### Test Categories

**Unit Tests (Existing)**
- Individual component testing
- Mock external dependencies
- Fast execution (<1s per test)
- High coverage of business logic

**Integration Tests (This Task)**
- Multi-component interaction testing
- Real external service integration where appropriate
- Moderate execution time (1-10s per test)
- Critical path coverage

**End-to-End Tests (Separate Task)**
- Full user journey testing
- Browser-based testing with Playwright
- Slower execution (10s+ per test)
- User story validation

### Test Data Management

**Fixture Management**
```typescript
// Test fixtures for consistent data
export const testFixtures = {
  validJwt: 'eyJ...',
  expiredJwt: 'eyJ...',
  malformedJwt: 'invalid-token',
  
  mockUser: {
    id: 'test-user-123',
    email: 'test@example.com',
    tenantId: 'test-tenant'
  }
}
```

**Database Test Data**
```kotlin
// Test data setup using @DataJpaTest patterns
@TestConfiguration
class TestDataSetup {
    fun setupTestTenant(): Tenant
    fun setupTestUser(): User  
    fun setupTestRoles(): List<Role>
}
```

### Continuous Integration

**Test Pipeline Stages**
1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: Validate component interactions  
3. **Security Tests**: Check for vulnerabilities
4. **Performance Tests**: Validate latency requirements
5. **Coverage Reports**: Ensure adequate test coverage

**Quality Gates**
- All tests must pass before merge
- Coverage threshold: >80% for authentication code
- Performance regression detection
- Security vulnerability scanning
- Code style and linting checks

## Success Criteria

### Functional Validation
- [ ] Complete authentication flow works end-to-end
- [ ] JWT token validation handles all edge cases  
- [ ] Cookie security properly implemented
- [ ] CORS configuration allows required origins
- [ ] Error handling gracefully manages failures
- [ ] Token refresh mechanism works reliably

### Non-Functional Validation  
- [ ] JWT validation latency <50ms (p95)
- [ ] System handles 100+ concurrent auth requests
- [ ] No security vulnerabilities detected
- [ ] Test coverage >80% for auth components
- [ ] CI/CD pipeline executes reliably
- [ ] Documentation covers all testing scenarios

### Operational Validation
- [ ] Tests run consistently in CI environment
- [ ] Test failures provide clear diagnostic information
- [ ] Performance benchmarks track over time
- [ ] Test data setup/teardown works reliably
- [ ] Mock services behave consistently
- [ ] Integration test environment is stable

---

**Related Tasks:**
- TX01_S01_JWT_Validation_Config (Prerequisite)
- TX03_S01_JWT_Claims_Extraction (Prerequisite)  
- T03_S02_Frontend_Auth_Integration (Parallel)
- T04_S02_E2E_Testing (Following)

**Estimated Effort:** 16 hours
**Risk Level:** Medium (depends on Auth0 integration stability)
**Priority:** High (blocks production deployment)