package com.astarworks.astarmanagement.base

import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.test.context.ActiveProfiles
import org.junit.jupiter.api.Tag
import com.astarworks.astarmanagement.config.TestSecurityConfig
import com.astarworks.astarmanagement.config.TestContainerConfig
import org.junit.jupiter.api.parallel.Execution
import org.junit.jupiter.api.parallel.ExecutionMode
import org.springframework.context.annotation.Import
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.test.web.servlet.MockMvc
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.jdbc.datasource.DataSourceTransactionManager
import javax.sql.DataSource
import org.springframework.beans.factory.annotation.Qualifier
import com.astarworks.astarmanagement.shared.infrastructure.security.RLSInterceptor
import java.util.UUID

/**
 * Base class for integration tests.
 *
 * Integration tests should:
 * - Test complete request-response flow
 * - Use real implementations (no mocks)
 * - Validate end-to-end behavior
 * - Test cross-cutting concerns
 * - Make up only 5-10% of all tests
 * 
 * Note: @Transactional is intentionally NOT used here to:
 * - Test actual transaction boundaries
 * - Verify commit/rollback behavior
 * - Test cross-transaction features like RLS
 * - Simulate production environment more accurately
 */
@Tag("integration")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(TestSecurityConfig::class, TestContainerConfig::class)
@Execution(ExecutionMode.SAME_THREAD)
abstract class IntegrationTestBase {

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    protected lateinit var jdbcTemplate: JdbcTemplate
    
    @Autowired
    @Qualifier("rlsDataSource")
    protected lateinit var rlsDataSource: DataSource
    
    @Autowired(required = false)
    protected var rlsInterceptor: RLSInterceptor? = null
    
    @Autowired(required = false)
    protected var transactionTemplate: TransactionTemplate? = null
    
    @Value("\${app.security.rls.enabled:false}")
    protected var rlsEnabled: Boolean = false
    
    @Autowired
    protected lateinit var dataSource: DataSource
    
    /**
     * Execute a block of code with RLS context.
     * Always uses RLS-enforced data source to ensure proper tenant isolation.
     * This method uses rls_test_user which does NOT have BYPASSRLS privilege,
     * ensuring that RLS policies are properly enforced during tests.
     */
    protected fun <T> withRLSContext(tenantId: UUID, userId: UUID, block: (JdbcTemplate) -> T): T {
        // Use RLS-enforced data source (rls_test_user) with transaction-scoped context
        val rlsJdbcTemplate = JdbcTemplate(rlsDataSource)
        val transactionManager = DataSourceTransactionManager(rlsDataSource)
        val transactionTemplate = TransactionTemplate(transactionManager)
        
        return transactionTemplate.execute { _ ->
            // Use SET LOCAL for transaction-scoped context
            // This is safer than set_config as it automatically resets after transaction
            rlsJdbcTemplate.execute("""
                SET LOCAL app.current_tenant_id = '$tenantId';
                SET LOCAL app.current_user_id = '$userId';
            """.trimIndent())
            
            // Execute the action within the RLS context
            block(rlsJdbcTemplate)
        } ?: throw IllegalStateException("Transaction execution returned null")
    }
    
    /**
     * Execute a block of code with RLS enabled for specific tenant and user.
     * This is an alias for withRLSContext for clearer intent.
     * 
     * @param tenantId The tenant ID to set in RLS context
     * @param userId The user ID to set in RLS context
     * @param block The code to execute with RLS enabled
     * @return The result of the block execution
     */
    protected fun <T> executeWithRLS(tenantId: UUID, userId: UUID, block: (JdbcTemplate) -> T): T {
        return withRLSContext(tenantId, userId, block)
    }
    
    /**
     * Execute a block of code as system user with RLS bypassed.
     * Uses app_user which has BYPASSRLS privilege.
     * Useful for test data setup and cleanup.
     * 
     * @param block The code to execute without RLS restrictions
     * @return The result of the block execution
     */
    protected fun <T> executeAsSystemUser(block: () -> T): T {
        // Use primary data source with app_user (has BYPASSRLS)
        // This allows unrestricted access to all data
        return block()
    }
    
    /**
     * Execute database operations without RLS restrictions.
     * Provides a JdbcTemplate that bypasses RLS policies.
     * Uses app_user which has BYPASSRLS privilege.
     * 
     * @param block The code to execute with system JdbcTemplate
     * @return The result of the block execution
     */
    protected fun <T> executeWithoutRLS(block: (JdbcTemplate) -> T): T {
        // Use the primary jdbcTemplate which connects as app_user
        return block(jdbcTemplate)
    }
    
    /**
     * Execute database operations with NULL RLS context.
     * Uses RLS-enforced data source but with NULL tenant/user context.
     * This tests that RLS policies properly deny access when context is not set.
     * 
     * @param block The code to execute with NULL RLS context
     * @return The result of the block execution
     */
    protected fun <T> executeWithNullRLSContext(block: (JdbcTemplate) -> T): T {
        // Use RLS-enforced data source (rls_test_user) with NULL context
        val rlsJdbcTemplate = JdbcTemplate(rlsDataSource)
        val transactionManager = DataSourceTransactionManager(rlsDataSource)
        val transactionTemplate = TransactionTemplate(transactionManager)
        
        return transactionTemplate.execute { _ ->
            // Reset context to empty/unset state
            // Use RESET to clear the session variables (equivalent to NULL)
            rlsJdbcTemplate.execute("""
                RESET app.current_tenant_id;
                RESET app.current_user_id;
            """.trimIndent())
            
            // Execute the action with NULL RLS context
            block(rlsJdbcTemplate)
        } ?: throw IllegalStateException("Transaction execution returned null")
    }
    
    /**
     * Get a JdbcTemplate that bypasses RLS.
     * Uses the primary DataSource with app_user (BYPASSRLS).
     * 
     * @return JdbcTemplate with system privileges
     */
    protected fun getSystemJdbcTemplate(): JdbcTemplate {
        return jdbcTemplate
    }
    
    /**
     * Execute a block with temporary RLS bypass.
     * Useful when you need to switch between RLS and non-RLS operations.
     * 
     * @param block The code to execute with system privileges
     * @return The result of the block execution
     */
    protected fun <T> executeWithTemporaryBypass(block: (JdbcTemplate) -> T): T {
        // Use the primary jdbcTemplate which connects as app_user with BYPASSRLS
        return block(jdbcTemplate)
    }
    
    /**
     * Check if RLS is enabled for this test.
     */
    protected fun isRLSEnabled(): Boolean = rlsEnabled
    
    /**
     * Cleans up all test data from the database.
     * This includes all application tables but preserves system tables and functions.
     */
    protected fun cleanupDatabase() {
        jdbcTemplate.execute("""
            -- Clean up all test data
            TRUNCATE TABLE 
                records,
                tables,
                workspaces,
                resource_group_memberships,
                resource_group_permissions,
                resource_groups,
                role_permissions,
                user_roles,
                roles,
                tenant_users,
                user_profiles,
                users,
                tenants,
                active_sessions
            RESTART IDENTITY CASCADE;
        """.trimIndent())
    }
    
    /**
     * Disables Row Level Security for testing.
     * This allows tests to manipulate data without RLS constraints.
     */
    protected fun disableRowLevelSecurity() {
        val tables = listOf(
            "tenants", "users", "user_profiles", "roles",
            "user_roles", "role_permissions", "workspaces",
            "tables", "records",
            "resource_groups", "resource_group_memberships", "resource_group_permissions"
        )
        
        tables.forEach { table ->
            jdbcTemplate.execute("ALTER TABLE $table DISABLE ROW LEVEL SECURITY")
        }
    }
    
    /**
     * Enables Row Level Security after test setup.
     * Call this after setting up test data to test RLS behavior.
     */
    protected fun enableRowLevelSecurity() {
        val tables = listOf(
            "tenants", "users", "user_profiles", "roles",
            "user_roles", "role_permissions", "workspaces",
            "tables", "records",
            "resource_groups", "resource_group_memberships", "resource_group_permissions"
        )
        
        tables.forEach { table ->
            jdbcTemplate.execute("ALTER TABLE $table ENABLE ROW LEVEL SECURITY")
        }
    }
    
    /**
     * Clears any caches that might affect test isolation.
     * Override this method to add specific cache clearing logic.
     */
    protected open fun clearCaches() {
        // Default implementation does nothing
        // Subclasses can override to clear specific caches
    }
}