# T08_S02_M002_Database_Integration_Tests

## Meta Information
- **Task ID**: T08_S02_M002_Database_Integration_Tests
- **Title**: Database Integration Tests
- **Sprint**: S02 - Database Foundation
- **Milestone**: M002 - Expense Database Implementation
- **Estimated Time**: 4 hours
- **Priority**: High
- **Status**: Pending
- **Assignee**: TBD
- **Created**: 2025-08-05
- **Type**: Testing/Quality Assurance

## Description

Implement comprehensive integration tests for all database operations to ensure reliability and multi-tenant security. This task focuses on testing database interactions with real PostgreSQL using Testcontainers, validating Row Level Security (RLS) policies, and ensuring proper tenant isolation across all expense-related repository operations.

The tests will verify that:
- All CRUD operations work correctly with PostgreSQL
- RLS policies enforce strict tenant isolation
- Complex queries and filtering operations perform as expected
- Transaction rollback and data isolation work properly
- Performance requirements are met for critical operations

## Research Summary

Based on codebase analysis, the following infrastructure is already in place:

### Existing Test Infrastructure
- **Base Classes**: 
  - `IntegrationTest.kt` - Spring Boot integration tests with MockMvc
  - `RepositoryTest.kt` - JPA repository tests with `@DataJpaTest`
  - `UnitTest.kt` - Unit test marker interface
- **Test Configuration**: `TestConfig.kt` with fixed clock at 2024-01-15T10:00:00Z
- **Test Fixtures**: 
  - `ExpenseFixtures.kt` - DSL builders for Expense domain objects
  - `TagFixtures.kt` - DSL builders for Tag objects
- **Dependencies**: Testcontainers (PostgreSQL, MinIO), Spring Boot Test, MockK, Kotest

### Repository Interfaces to Test
1. **ExpenseRepository** - CRUD, filtering, pagination, balance calculations
2. **TagRepository** - CRUD, scope filtering, usage analytics, duplicate checking
3. **AttachmentRepository** - CRUD, expense associations, temporary file cleanup

### RLS Implementation
- Comprehensive RLS policies already implemented in V017__Create_tenant_foundation.sql
- Additional RLS for tags (V023) and attachments (V024)
- Tenant context functions for RLS enforcement

## Acceptance Criteria

### Core Requirements
- [ ] Integration tests cover all repository methods for ExpenseRepository, TagRepository, and AttachmentRepository  
- [ ] Tests use real PostgreSQL via Testcontainers (not H2 in-memory)
- [ ] RLS policies are validated to prevent cross-tenant data access
- [ ] Complex filtering and pagination scenarios are tested
- [ ] Transaction rollback and data consistency are verified
- [ ] Test data isolation ensures no test interference
- [ ] Performance benchmarks for critical queries (< 100ms for single tenant operations)

### Multi-Tenant Security
- [ ] Tests verify tenant isolation for all repository operations
- [ ] Cross-tenant access attempts are blocked and tested
- [ ] RLS policy enforcement is validated at database level
- [ ] Edge cases with null/invalid tenant IDs are covered

### Data Integrity
- [ ] Foreign key constraints are tested (expense-tag relationships, attachments)
- [ ] Audit trail fields (createdAt, updatedAt, deletedAt) are properly maintained
- [ ] Soft delete operations work correctly and don't affect queries
- [ ] Balance calculation accuracy is verified

### Test Coverage
- [ ] Minimum 90% code coverage for all repository implementations
- [ ] All custom JPQL queries are integration tested
- [ ] Error scenarios and edge cases are covered
- [ ] Concurrent access scenarios are tested

## Technical Implementation

### Test Infrastructure Setup

```kotlin
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = [
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.url=jdbc:tc:postgresql:15:///testdb",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect"
])
abstract class DatabaseIntegrationTestBase {
    
    companion object {
        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
            .withInitScript("db/init-test-db.sql")
    }
    
    @Autowired
    lateinit var entityManager: TestEntityManager
    
    @BeforeEach
    fun setupTenantContext() {
        // Set up tenant context for RLS testing
    }
}
```

### Test Categories

#### 1. CRUD Operations Tests
- Basic save, find, update, delete operations
- Bulk operations and batch processing
- Entity state transitions and lifecycle

#### 2. Multi-Tenant Security Tests
```kotlin
@Test
fun `should prevent cross-tenant data access`() {
    // Test RLS enforcement
    val tenant1 = UUID.randomUUID()
    val tenant2 = UUID.randomUUID()
    
    // Create expense for tenant1
    val expense = expenseRepository.save(
        ExpenseFixtures.expense(tenantId = tenant1)
    )
    
    // Attempt to access from tenant2 context
    setTenantContext(tenant2)
    val result = expenseRepository.findByIdAndTenantId(expense.id, tenant2)
    
    assertThat(result).isNull()
}
```

#### 3. Complex Query Tests
- Filtering by multiple criteria (date range, category, tags, case)
- Pagination with large datasets
- Sorting and ordering scenarios
- Tag-based filtering with JOIN operations

#### 4. Performance Tests
- Query execution time benchmarks
- Large dataset handling (1000+ records per tenant)
- Concurrent access scenarios
- Index effectiveness validation

#### 5. Data Integrity Tests
- Foreign key constraint validation
- Audit field automatic updates
- Soft delete behavior
- Balance calculation accuracy

#### 6. Edge Case Tests
- Null and empty value handling
- Invalid UUID handling
- Boundary conditions (max values, empty results)
- Malformed query parameters

## Implementation Notes

### Testcontainers Configuration
- Use PostgreSQL 15 to match production
- Include RLS policy setup in test initialization script
- Configure connection pooling similar to production
- Enable SQL logging for debugging complex queries

### Multi-Tenant Testing Strategy
- Create helper methods for tenant context switching
- Use separate tenants for each test to ensure isolation
- Validate RLS at both application and database levels
- Test with realistic multi-tenant data volumes

### Transaction Management
- Use `@Rollback` to ensure test isolation
- Test both successful and failed transaction scenarios  
- Verify proper cleanup of test data
- Test nested transaction behavior

### Performance Considerations
- Set realistic timeouts for integration tests
- Use `@DirtiesContext` sparingly to avoid slow test execution
- Implement test data builders for efficient setup
- Monitor test execution times and optimize slow tests

## Subtasks

### Phase 1: Test Infrastructure (1 hour)
- [ ] Create DatabaseIntegrationTestBase with Testcontainers
- [ ] Set up PostgreSQL test container with RLS policies
- [ ] Configure test data builders and fixtures
- [ ] Implement tenant context helpers

### Phase 2: Repository Integration Tests (2 hours)
- [ ] ExpenseRepository integration tests (CRUD, filtering, pagination)
- [ ] TagRepository integration tests (scope handling, usage analytics)
- [ ] AttachmentRepository integration tests (file associations, cleanup)
- [ ] Cross-repository relationship tests

### Phase 3: Security and Performance Tests (1 hour)
- [ ] RLS policy enforcement tests
- [ ] Cross-tenant access prevention tests
- [ ] Performance benchmark tests
- [ ] Concurrent access scenario tests

## Success Metrics

- **Coverage**: >90% code coverage for repository implementations
- **Performance**: All single-tenant queries < 100ms
- **Security**: 100% RLS policy compliance, zero cross-tenant data leaks
- **Reliability**: All tests pass consistently in CI/CD pipeline
- **Maintainability**: Clear test organization and documentation

## Risk Mitigation

- **Flaky Tests**: Use fixed time with TestConfig, proper test isolation
- **Performance Degradation**: Monitor query execution plans, validate indexes
- **Security Gaps**: Comprehensive RLS testing, security-focused code review
- **Test Maintenance**: Well-structured test hierarchy, clear naming conventions

## Definition of Done

- [ ] All repository methods have integration tests
- [ ] RLS policies are validated through tests
- [ ] Performance benchmarks are established and passing
- [ ] Test suite runs reliably in CI/CD pipeline
- [ ] Code coverage meets minimum threshold (90%)
- [ ] Security review completed with focus on tenant isolation
- [ ] Documentation updated with test execution instructions

## Dependencies

- Completed tasks: T06_S02_M002 (Test Data Seeder), T07_S02_M002 (Repository Implementation)
- Database migrations: V017, V023, V024 (RLS policies)
- Test infrastructure: Testcontainers, PostgreSQL 15

## Related Files

- `/backend/src/test/kotlin/com/astarworks/astarmanagement/base/RepositoryTest.kt`
- `/backend/src/test/kotlin/com/astarworks/astarmanagement/expense/fixtures/ExpenseFixtures.kt`
- `/backend/src/main/kotlin/com/astarworks/astarmanagement/expense/domain/repository/*.kt`
- `/backend/src/main/kotlin/com/astarworks/astarmanagement/expense/infrastructure/persistence/*.kt`
- `/backend/src/main/resources/db/migration/V017__Create_tenant_foundation.sql`
- `/backend/build.gradle.kts` (Testcontainers dependencies)