# RLS Testing Guide

## Overview

This guide explains how to effectively test Row Level Security (RLS) in the Astar Management backend. The testing framework provides flexible methods to execute code with or without RLS restrictions.

## Architecture

### Two DataSource Configuration

The test environment uses two PostgreSQL users:

1. **`app_user`** (Primary DataSource)
   - Has `BYPASSRLS` privilege
   - Used for fast general testing and test data setup
   - Default for most test operations

2. **`rls_test_user`** (RLS DataSource)
   - Does NOT have `BYPASSRLS` privilege
   - Used for testing RLS policies are working correctly
   - Ensures tenant isolation is properly enforced

## IntegrationTestBase Methods

### RLS Bypass Methods (System User)

#### `executeAsSystemUser`
Execute code with full system privileges, bypassing all RLS restrictions.

```kotlin
@Test
fun testWithSystemPrivileges() {
    executeAsSystemUser {
        // This code runs without any RLS restrictions
        val tenant = createTestTenant()
        val users = createTestUsers()
        // Can access and modify any data across all tenants
    }
}
```

#### `executeWithoutRLS`
Execute database operations with a JdbcTemplate that bypasses RLS.

```kotlin
@Test
fun setupTestData() {
    executeWithoutRLS { jdbc ->
        // Direct database operations without RLS
        jdbc.update("INSERT INTO tenants (id, name) VALUES (?, ?)", tenantId, "Test Tenant")
        jdbc.update("INSERT INTO users (id, email) VALUES (?, ?)", userId, "test@example.com")
    }
}
```

#### `getSystemJdbcTemplate`
Get a JdbcTemplate with system privileges for direct use.

```kotlin
@Test
fun cleanupAfterTest() {
    val systemJdbc = getSystemJdbcTemplate()
    systemJdbc.execute("TRUNCATE TABLE workspaces CASCADE")
}
```

### RLS Enforcement Methods

#### `executeWithRLS`
Execute code with RLS enabled for a specific tenant and user.

```kotlin
@Test
fun testTenantIsolation() {
    // Setup data as system user
    executeAsSystemUser {
        createWorkspaceForTenant(tenant1Id)
        createWorkspaceForTenant(tenant2Id)
    }
    
    // Test that user1 can only see tenant1's data
    executeWithRLS(tenant1Id, user1Id) { jdbc ->
        val visibleWorkspaces = jdbc.queryForList("SELECT * FROM workspaces")
        assertThat(visibleWorkspaces).hasSize(1)
        assertThat(visibleWorkspaces[0]["tenant_id"]).isEqualTo(tenant1Id)
    }
}
```

#### `withRLSContext`
Alias for `executeWithRLS` - maintained for backward compatibility.

```kotlin
@Test
fun testWithRLSContext() {
    withRLSContext(tenantId, userId) { jdbc ->
        // This code executes with RLS restrictions
        val records = jdbc.queryForList("SELECT * FROM records")
        // Will only see records for the specified tenant
    }
}
```

### Mixed Operations

#### `executeWithTemporaryBypass`
Temporarily bypass RLS, then restore the original context.

```kotlin
@Test
fun testMixedOperations() {
    // Start with RLS context
    executeWithRLS(tenantId, userId) { jdbc ->
        val userRecords = jdbc.queryForList("SELECT * FROM records")
        
        // Temporarily bypass RLS for system operation
        executeWithTemporaryBypass { systemJdbc ->
            // Perform system-level operation
            systemJdbc.update("UPDATE system_stats SET last_check = NOW()")
        }
        
        // Back to RLS context automatically
        val moreRecords = jdbc.queryForList("SELECT * FROM workspaces")
    }
}
```

## RLSTestHelper Methods

The `RLSTestHelper` class provides lower-level RLS testing utilities:

### Context Management

- `setRLSContext(tenantId, userId)` - Set RLS session variables
- `clearRLSContext()` - Clear RLS session variables
- `getCurrentContext()` - Get current RLS context information
- `validateSession()` - Check if session has valid RLS context

### Execution Methods

- `executeInRLSTransaction(tenantId, userId, action)` - Execute in RLS transaction
- `executeAsSystemUser(action)` - Execute with BYPASSRLS (if DataSource allows)
- `executeWithTemporaryBypass(action)` - Temporarily bypass then restore context
- `canBypassRLS()` - Check if current connection can bypass RLS

### Testing Utilities

- `countVisibleRows(tableName)` - Count rows visible in current RLS context
- `testInsert(sql, params)` - Test if INSERT is allowed by RLS policies
- `testRLSIsolation(tenantId)` - Test isolation for a specific tenant
- `getRLSStatus()` - Get RLS protection status for all tables
- `debugContext()` - Log current RLS context for debugging

## Best Practices

### 1. Clear Test Data Setup

Always use system privileges for test data setup:

```kotlin
@BeforeEach
fun setUp() {
    executeAsSystemUser {
        // Create test tenants, users, and initial data
        tenantId = createTestTenant("Test Tenant")
        userId = createTestUser("test@example.com", tenantId)
        workspaceId = createWorkspace("Test Workspace", tenantId)
    }
}
```

### 2. Explicit RLS Testing

Be explicit about when RLS should be enforced:

```kotlin
@Test
fun testDataIsolation() {
    // Explicitly test with RLS enabled
    executeWithRLS(tenant1Id, user1Id) { jdbc ->
        // This should only see tenant1's data
    }
    
    // Explicitly test cross-tenant isolation
    executeWithRLS(tenant2Id, user2Id) { jdbc ->
        // This should only see tenant2's data
    }
}
```

### 3. Cleanup with System Privileges

Always clean up test data with system privileges:

```kotlin
@AfterEach
fun tearDown() {
    executeWithoutRLS { jdbc ->
        jdbc.execute("DELETE FROM workspaces WHERE id = ?", workspaceId)
        jdbc.execute("DELETE FROM users WHERE id = ?", userId)
        jdbc.execute("DELETE FROM tenants WHERE id = ?", tenantId)
    }
}
```

### 4. Verify RLS Status

Check RLS status when debugging test failures:

```kotlin
@Test
fun debugRLSIssues() {
    val rlsHelper = RLSTestHelper(rlsDataSource)
    
    // Check if RLS is properly configured
    val rlsStatus = rlsHelper.getRLSStatus()
    rlsStatus.forEach { status ->
        println("Table: ${status["table_name"]}, RLS: ${status["rls_enabled"]}")
    }
    
    // Check current context
    rlsHelper.debugContext()
    
    // Verify bypass capability
    val canBypass = rlsHelper.canBypassRLS()
    println("Can bypass RLS: $canBypass")
}
```

## Common Patterns

### Pattern 1: Full Workflow Test

```kotlin
@Test
fun testCompleteWorkflow() {
    // 1. Setup as system user
    val (tenantId, userId, workspaceId) = executeAsSystemUser {
        val t = createTenant()
        val u = createUser(t)
        val w = createWorkspace(t)
        Triple(t, u, w)
    }
    
    // 2. Test normal operations with RLS
    executeWithRLS(tenantId, userId) { jdbc ->
        // User can see their workspace
        val workspaces = jdbc.queryForList("SELECT * FROM workspaces")
        assertThat(workspaces).hasSize(1)
        
        // User can create records in their workspace
        val recordId = createRecord(workspaceId)
        assertThat(recordId).isNotNull()
    }
    
    // 3. Verify isolation from another tenant
    executeWithRLS(otherTenantId, otherUserId) { jdbc ->
        // Other user cannot see the workspace
        val workspaces = jdbc.queryForList("SELECT * FROM workspaces")
        assertThat(workspaces).isEmpty()
    }
    
    // 4. Cleanup as system user
    executeAsSystemUser {
        deleteWorkspace(workspaceId)
        deleteUser(userId)
        deleteTenant(tenantId)
    }
}
```

### Pattern 2: Migration Testing

```kotlin
@Test
fun testDataMigration() {
    // Run migration without RLS restrictions
    executeWithoutRLS { jdbc ->
        jdbc.execute("ALTER TABLE old_table ADD COLUMN tenant_id UUID")
        jdbc.update("UPDATE old_table SET tenant_id = ?", defaultTenantId)
    }
    
    // Verify migration worked with RLS enabled
    executeWithRLS(defaultTenantId, adminUserId) { jdbc ->
        val migratedCount = jdbc.queryForObject(
            "SELECT COUNT(*) FROM old_table", 
            Long::class.java
        )
        assertThat(migratedCount).isGreaterThan(0)
    }
}
```

### Pattern 3: Cross-Tenant Operations

```kotlin
@Test
fun testCrossTenantOperation() {
    // Admin user with special privileges
    executeAsSystemUser {
        // Create admin user with cross-tenant access
        grantCrossTenantAccess(adminUserId)
    }
    
    // Test that admin can access multiple tenants
    val tenant1Data = executeWithRLS(tenant1Id, adminUserId) { jdbc ->
        jdbc.queryForList("SELECT * FROM workspaces")
    }
    
    val tenant2Data = executeWithRLS(tenant2Id, adminUserId) { jdbc ->
        jdbc.queryForList("SELECT * FROM workspaces")
    }
    
    assertThat(tenant1Data).isNotEmpty()
    assertThat(tenant2Data).isNotEmpty()
}
```

## Troubleshooting

### Issue: Tests fail with "permission denied"

**Solution**: Ensure you're using the correct execution method:
- Use `executeAsSystemUser` or `executeWithoutRLS` for setup
- Use `executeWithRLS` only when testing RLS policies

### Issue: Cannot see expected data with RLS

**Solution**: Verify the RLS context:
```kotlin
rlsHelper.debugContext()  // Check current tenant and user IDs
rlsHelper.validateSession()  // Verify session is valid
```

### Issue: RLS not being enforced

**Solution**: Check which DataSource is being used:
```kotlin
val canBypass = rlsHelper.canBypassRLS()
if (canBypass) {
    // You're using app_user (BYPASSRLS)
    // Switch to executeWithRLS for RLS enforcement
}
```

### Issue: Context not restored after test

**Solution**: Always use try-finally or the provided methods:
```kotlin
// Good: Automatic cleanup
executeWithTemporaryBypass { jdbc ->
    // System operations
}  // Context automatically restored

// Bad: Manual management prone to errors
rlsHelper.clearRLSContext()
// If test fails here, context is not restored
rlsHelper.setRLSContext(tenantId, userId)
```

## Summary

The RLS testing framework provides:

1. **Clear separation** between RLS-enforced and bypassed operations
2. **Flexible methods** for different testing scenarios
3. **Automatic context management** to prevent test pollution
4. **Debugging utilities** for troubleshooting RLS issues

Always be explicit about whether RLS should be enforced or bypassed in your tests. This makes tests more maintainable and intentions clearer.