# Database Integration Tests

This directory contains comprehensive database integration tests for the expense management system's repository layer.

## Overview

These tests validate:
- Row Level Security (RLS) enforcement at the database level
- Multi-tenant data isolation
- Complex query behavior with real PostgreSQL
- Transaction management and rollback scenarios
- Performance benchmarks for critical operations

## Test Infrastructure

### Testcontainers Setup
- Uses PostgreSQL 15 (matching production) via Testcontainers
- Automatically runs Flyway migrations including RLS policies
- Provides isolated database instance per test class
- No manual database setup required

### Base Test Class
`DatabaseIntegrationTestBase` provides:
- PostgreSQL container lifecycle management
- Security context helpers for multi-tenant testing
- Transaction management for test isolation
- Raw SQL execution for RLS validation

## Running the Tests

### Prerequisites
- Docker must be installed and running
- Sufficient memory for PostgreSQL container (minimum 512MB)

### Execute All Database Integration Tests
```bash
./gradlew test --tests "*DatabaseIntegrationTest"
```

### Execute Specific Test Class
```bash
./gradlew test --tests "ExpenseRepositoryDatabaseIntegrationTest"
./gradlew test --tests "TagRepositoryDatabaseIntegrationTest"
./gradlew test --tests "AttachmentRepositoryDatabaseIntegrationTest"
```

### Execute Single Test Method
```bash
./gradlew test --tests "ExpenseRepositoryDatabaseIntegrationTest.should enforce RLS at database level for tenant isolation"
```

## Test Categories

### 1. RLS Enforcement Tests
- Validate tenant isolation at database level
- Test cross-tenant access prevention
- Verify PostgreSQL session variables
- Direct SQL query validation

### 2. CRUD Operation Tests
- Basic save, find, update, delete
- Bulk operations
- Entity lifecycle management
- Audit field maintenance

### 3. Complex Query Tests
- Multi-criteria filtering
- Pagination with large datasets
- Sorting and ordering
- JOIN operations (tags, attachments)

### 4. Performance Tests
- Query execution benchmarks (<100ms requirement)
- Large dataset handling (1000+ records)
- Concurrent access scenarios
- Index effectiveness

### 5. Data Integrity Tests
- Foreign key constraints
- Soft delete behavior
- Transaction rollback
- Balance calculation accuracy

## Key Test Patterns

### Multi-Tenant Context Testing
```kotlin
// Test with different tenant contexts
withTenantContext(tenant1Id, user1Id, user1) {
    // Operations execute in tenant1 context
}

withTenantContext(tenant2Id, user2Id, user2) {
    // Operations execute in tenant2 context
}
```

### RLS Validation
```kotlin
// Direct SQL queries to validate RLS
val count = queryRawSql<Array<Any>>(
    "SELECT COUNT(*) FROM expenses WHERE deleted_at IS NULL"
)
// Should only return current tenant's data
```

### Performance Validation
```kotlin
val startTime = System.currentTimeMillis()
// Execute operation
val elapsed = System.currentTimeMillis() - startTime
assertThat(elapsed).isLessThan(100) // Must complete within 100ms
```

## Troubleshooting

### Container Startup Issues
- Ensure Docker daemon is running
- Check available disk space
- Verify no port conflicts on PostgreSQL default port

### Test Failures
- Check test logs for SQL statements
- Verify Flyway migrations completed successfully
- Ensure RLS policies are properly initialized

### Performance Issues
- Increase Docker memory allocation
- Check for missing database indexes
- Review query execution plans

## Best Practices

1. **Test Isolation**: Each test method runs in its own transaction that's rolled back
2. **Data Builders**: Use provided helper methods for consistent test data
3. **Context Switching**: Always restore original context after tenant switches
4. **Performance Assertions**: Include timing validations for critical paths
5. **Direct SQL Validation**: Verify RLS works at database level, not just application

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:
- Testcontainers handles container lifecycle automatically
- No external database setup required
- Tests clean up after themselves
- Parallel execution supported at class level

## Maintenance

When adding new repository methods:
1. Add corresponding integration tests
2. Include RLS validation for tenant-scoped operations
3. Add performance benchmarks for complex queries
4. Test both positive and negative scenarios
5. Validate audit trail updates