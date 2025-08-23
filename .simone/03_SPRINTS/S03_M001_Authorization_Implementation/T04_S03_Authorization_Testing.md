---
task_id: T04_S03
title: "Authorization Testing Suite"
sprint: S03
status: pending
complexity: medium
priority: high
category: testing
domains: ["security", "testing", "authorization"]
estimate_hours: 6
created: 2025-01-23
---

# T04_S03: Authorization Testing Suite

## 📋 Overview

Create comprehensive test suite for authorization functionality, covering all role/permission combinations, tenant isolation, and edge cases to ensure security requirements are met.

## 🎯 Objectives

- Test all role-based access scenarios
- Verify tenant isolation is bulletproof
- Test authorization edge cases
- Measure performance impact
- Create security regression tests

## 📝 Acceptance Criteria

- [ ] >90% code coverage for authorization code
- [ ] All permission matrix combinations tested
- [ ] Tenant isolation tests passing
- [ ] Performance tests show <5ms impact
- [ ] Security penetration tests passing
- [ ] Test documentation complete

## 🔧 Technical Implementation

### Base Test Configuration

```kotlin
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class AuthorizationTestBase {
    
    @Autowired
    protected lateinit var mockMvc: MockMvc
    
    @Autowired
    protected lateinit var jwtEncoder: JwtEncoder
    
    protected fun createJwtToken(
        userId: String = "test-user",
        tenantId: String = "test-tenant",
        roles: List<String> = listOf("MEMBER")
    ): String {
        val claims = Jwt.withTokenValue("test-token")
            .header("alg", "RS256")
            .claim("sub", userId)
            .claim("https://astar.com/tenant_id", tenantId)
            .claim("https://astar.com/roles", roles)
            .build()
        
        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
    }
    
    protected fun withAuth(
        userId: String = "test-user",
        tenantId: String = "test-tenant",
        role: BusinessRole = BusinessRole.MEMBER
    ): RequestPostProcessor {
        val token = createJwtToken(userId, tenantId, listOf(role.name))
        return MockMvcRequestPostProcessors.jwt().jwt { jwt ->
            jwt.claim("sub", userId)
               .claim("https://astar.com/tenant_id", tenantId)
               .claim("https://astar.com/roles", listOf(role.name))
        }
    }
}
```

### Role-Based Access Tests

```kotlin
@SpringBootTest
class RoleBasedAccessTest : AuthorizationTestBase() {
    
    @Test
    fun `VIEWER can only read resources`() {
        // Test read access - should succeed
        mockMvc.perform(
            get("/api/v1/expenses")
                .with(withAuth(role = BusinessRole.VIEWER))
        )
        .andExpect(status().isOk)
        
        // Test create access - should fail
        mockMvc.perform(
            post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"amount": 1000, "description": "Test"}""")
                .with(withAuth(role = BusinessRole.VIEWER))
        )
        .andExpect(status().isForbidden)
        
        // Test delete access - should fail
        mockMvc.perform(
            delete("/api/v1/expenses/1")
                .with(withAuth(role = BusinessRole.VIEWER))
        )
        .andExpect(status().isForbidden)
    }
    
    @Test
    fun `MEMBER can create and edit own resources`() {
        val memberId = "member-123"
        
        // Create expense as MEMBER
        val createResult = mockMvc.perform(
            post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"amount": 1000, "description": "Test"}""")
                .with(withAuth(userId = memberId, role = BusinessRole.MEMBER))
        )
        .andExpect(status().isCreated)
        .andReturn()
        
        val expenseId = extractId(createResult)
        
        // Edit own expense - should succeed
        mockMvc.perform(
            put("/api/v1/expenses/$expenseId")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"amount": 2000, "description": "Updated"}""")
                .with(withAuth(userId = memberId, role = BusinessRole.MEMBER))
        )
        .andExpect(status().isOk)
        
        // Try to delete - should fail (MEMBER can't delete)
        mockMvc.perform(
            delete("/api/v1/expenses/$expenseId")
                .with(withAuth(userId = memberId, role = BusinessRole.MEMBER))
        )
        .andExpect(status().isForbidden)
    }
    
    @Test
    fun `OWNER has full access to all resources`() {
        // Test all CRUD operations
        val operations = listOf(
            { mockMvc.perform(get("/api/v1/expenses").with(withAuth(role = BusinessRole.OWNER))) },
            { mockMvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"amount": 1000}""")
                .with(withAuth(role = BusinessRole.OWNER))) },
            { mockMvc.perform(put("/api/v1/expenses/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"amount": 2000}""")
                .with(withAuth(role = BusinessRole.OWNER))) },
            { mockMvc.perform(delete("/api/v1/expenses/1")
                .with(withAuth(role = BusinessRole.OWNER))) }
        )
        
        operations.forEach { operation ->
            operation().andExpect(status().isNot(status().isForbidden))
        }
    }
}
```

### Tenant Isolation Tests

```kotlin
@SpringBootTest
@Transactional
class TenantIsolationTest : AuthorizationTestBase() {
    
    @Autowired
    private lateinit var expenseRepository: ExpenseRepository
    
    @Test
    fun `users cannot access data from different tenants`() {
        // Setup: Create expenses in different tenants
        val tenantAExpense = createExpense(tenantId = "tenant-a")
        val tenantBExpense = createExpense(tenantId = "tenant-b")
        
        // User from tenant A tries to access tenant B data
        mockMvc.perform(
            get("/api/v1/expenses/${tenantBExpense.id}")
                .with(withAuth(tenantId = "tenant-a", role = BusinessRole.OWNER))
        )
        .andExpect(status().isNotFound)  // Should not find the resource
        
        // Verify tenant A can access own data
        mockMvc.perform(
            get("/api/v1/expenses/${tenantAExpense.id}")
                .with(withAuth(tenantId = "tenant-a", role = BusinessRole.OWNER))
        )
        .andExpect(status().isOk)
    }
    
    @Test
    fun `list operations only return tenant-specific data`() {
        // Create data in multiple tenants
        createExpense(tenantId = "tenant-a", description = "Tenant A Expense")
        createExpense(tenantId = "tenant-b", description = "Tenant B Expense")
        
        // Tenant A user lists expenses
        val result = mockMvc.perform(
            get("/api/v1/expenses")
                .with(withAuth(tenantId = "tenant-a"))
        )
        .andExpect(status().isOk)
        .andReturn()
        
        val expenses = parseJsonArray(result.response.contentAsString)
        
        // Should only see tenant A data
        assertThat(expenses).hasSize(1)
        assertThat(expenses[0].description).isEqualTo("Tenant A Expense")
    }
}
```

### Performance Tests

```kotlin
@SpringBootTest
class AuthorizationPerformanceTest : AuthorizationTestBase() {
    
    @Test
    fun `authorization adds less than 5ms latency`() {
        val iterations = 100
        val timingsWithAuth = mutableListOf<Long>()
        val timingsWithoutAuth = mutableListOf<Long>()
        
        // Measure with authorization
        repeat(iterations) {
            val start = System.currentTimeMillis()
            mockMvc.perform(
                get("/api/v1/expenses")
                    .with(withAuth(role = BusinessRole.MEMBER))
            )
            timingsWithAuth.add(System.currentTimeMillis() - start)
        }
        
        // Measure without authorization (public endpoint)
        repeat(iterations) {
            val start = System.currentTimeMillis()
            mockMvc.perform(get("/api/v1/health"))
            timingsWithoutAuth.add(System.currentTimeMillis() - start)
        }
        
        val avgWithAuth = timingsWithAuth.average()
        val avgWithoutAuth = timingsWithoutAuth.average()
        val overhead = avgWithAuth - avgWithoutAuth
        
        assertThat(overhead).isLessThan(5.0)
        println("Authorization overhead: ${overhead}ms")
    }
}
```

### Edge Case Tests

```kotlin
@SpringBootTest
class AuthorizationEdgeCaseTest : AuthorizationTestBase() {
    
    @Test
    fun `missing tenant context returns 401`() {
        val tokenWithoutTenant = createJwtToken(
            userId = "user",
            tenantId = null,  // No tenant
            roles = listOf("MEMBER")
        )
        
        mockMvc.perform(
            get("/api/v1/expenses")
                .header("Authorization", "Bearer $tokenWithoutTenant")
        )
        .andExpect(status().isUnauthorized)
    }
    
    @Test
    fun `invalid role returns 403`() {
        mockMvc.perform(
            get("/api/v1/expenses")
                .with(withAuth(role = "INVALID_ROLE"))
        )
        .andExpect(status().isForbidden)
    }
    
    @Test
    fun `expired token returns 401`() {
        val expiredToken = createExpiredToken()
        
        mockMvc.perform(
            get("/api/v1/expenses")
                .header("Authorization", "Bearer $expiredToken")
        )
        .andExpect(status().isUnauthorized)
    }
}
```

### Security Matrix Validation

```kotlin
@SpringBootTest
class PermissionMatrixTest : AuthorizationTestBase() {
    
    data class PermissionTest(
        val endpoint: String,
        val method: HttpMethod,
        val role: BusinessRole,
        val expectedStatus: Int
    )
    
    @Test
    fun `verify complete permission matrix`() {
        val tests = listOf(
            // Expenses - View
            PermissionTest("/api/v1/expenses", HttpMethod.GET, BusinessRole.OWNER, 200),
            PermissionTest("/api/v1/expenses", HttpMethod.GET, BusinessRole.MEMBER, 200),
            PermissionTest("/api/v1/expenses", HttpMethod.GET, BusinessRole.VIEWER, 200),
            
            // Expenses - Create
            PermissionTest("/api/v1/expenses", HttpMethod.POST, BusinessRole.OWNER, 201),
            PermissionTest("/api/v1/expenses", HttpMethod.POST, BusinessRole.MEMBER, 201),
            PermissionTest("/api/v1/expenses", HttpMethod.POST, BusinessRole.VIEWER, 403),
            
            // Users - Manage
            PermissionTest("/api/v1/users/invite", HttpMethod.POST, BusinessRole.OWNER, 200),
            PermissionTest("/api/v1/users/invite", HttpMethod.POST, BusinessRole.MEMBER, 403),
            PermissionTest("/api/v1/users/invite", HttpMethod.POST, BusinessRole.VIEWER, 403),
            
            // Settings - Edit
            PermissionTest("/api/v1/settings/tenant", HttpMethod.PUT, BusinessRole.OWNER, 200),
            PermissionTest("/api/v1/settings/tenant", HttpMethod.PUT, BusinessRole.MEMBER, 403),
            PermissionTest("/api/v1/settings/tenant", HttpMethod.PUT, BusinessRole.VIEWER, 403)
        )
        
        tests.forEach { test ->
            val request = when (test.method) {
                HttpMethod.GET -> get(test.endpoint)
                HttpMethod.POST -> post(test.endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}")
                HttpMethod.PUT -> put(test.endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}")
                HttpMethod.DELETE -> delete(test.endpoint)
                else -> throw IllegalArgumentException("Unsupported method")
            }
            
            mockMvc.perform(request.with(withAuth(role = test.role)))
                .andExpect(status().`is`(test.expectedStatus))
        }
    }
}
```

## 📋 Subtasks

### Test Implementation
- [ ] Create base test configuration
- [ ] Implement role-based access tests
- [ ] Implement tenant isolation tests
- [ ] Implement performance tests
- [ ] Implement edge case tests
- [ ] Implement permission matrix tests

### Test Coverage
- [ ] Achieve >90% coverage
- [ ] Document untested edge cases
- [ ] Create regression test suite

## 🧪 Testing Strategy

### Test Categories
- Unit tests for authorization logic
- Integration tests for end-to-end flows
- Performance tests for latency impact
- Security tests for penetration attempts

## 🔗 Dependencies

- All authorization implementation complete
- Test database configuration
- Mock JWT token generation

## ✅ Definition of Done

- [ ] All test categories implemented
- [ ] >90% code coverage achieved
- [ ] Performance requirements met
- [ ] No security vulnerabilities found
- [ ] Test documentation complete
- [ ] CI/CD pipeline updated