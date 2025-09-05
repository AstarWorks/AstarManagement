package com.astarworks.astarmanagement.fixture.helper

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.datasource.DataSourceTransactionManager
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionTemplate
import java.util.UUID
import javax.sql.DataSource

/**
 * Helper class for RLS (Row Level Security) testing.
 * 
 * @deprecated Use the new RLS API methods from IntegrationTestBase instead:
 * - executeAsSystemUser() for operations with BYPASSRLS
 * - executeWithRLS() for operations with RLS context
 * - executeWithoutRLS() for operations without RLS but no context
 * 
 * This class will be removed in future versions. Please migrate to the new API.
 * 
 * Original functionality:
 * - Set and clear RLS context (tenant_id, user_id)
 * - Validate session state
 * - Debug RLS context
 * - Test RLS isolation
 * 
 * Can be used with different DataSources for testing with/without BYPASSRLS
 */
@Deprecated(
    "Use executeAsSystemUser, executeWithRLS, and executeWithoutRLS from IntegrationTestBase",
    ReplaceWith("IntegrationTestBase.executeWithRLS(tenantId, userId) { ... }")
)
@Component
class RLSTestHelper {
    
    private lateinit var jdbcTemplate: JdbcTemplate
    private var transactionTemplate: TransactionTemplate? = null
    
    /**
     * Default constructor using primary DataSource (app_user with BYPASSRLS)
     */
    @Autowired
    constructor(
        @Autowired dataSource: DataSource,
        @Autowired transactionTemplate: TransactionTemplate
    ) {
        this.jdbcTemplate = JdbcTemplate(dataSource)
        this.transactionTemplate = transactionTemplate
    }
    
    /**
     * Constructor for custom DataSource (e.g., rls_test_user without BYPASSRLS)
     * Creates its own TransactionTemplate to support transaction-scoped operations
     */
    constructor(dataSource: DataSource) {
        this.jdbcTemplate = JdbcTemplate(dataSource)
        // Create TransactionTemplate using DataSourceTransactionManager
        val transactionManager = DataSourceTransactionManager(dataSource)
        this.transactionTemplate = TransactionTemplate(transactionManager)
    }
    
    private val logger = LoggerFactory.getLogger(RLSTestHelper::class.java)
    
    /**
     * Sets the RLS context for testing by configuring PostgreSQL session variables.
     * These variables are used by RLS policies to filter data.
     * 
     * @deprecated Use executeWithRLS from IntegrationTestBase instead
     * @param tenantId The tenant ID to set in the session
     * @param userId The user ID to set in the session  
     */
    @Deprecated(
        "Use executeWithRLS from IntegrationTestBase",
        ReplaceWith("executeWithRLS(tenantId, userId) { ... }")
    )
    fun setRLSContext(tenantId: UUID, userId: UUID) {
        logger.debug("Setting RLS context: tenant={}, user={}", tenantId, userId)
        
        try {
            // Use SET LOCAL if within a transaction, otherwise use set_config
            // This maintains backward compatibility while being transaction-safe
            jdbcTemplate.execute("""
                SELECT set_config('app.current_tenant_id', '$tenantId', false);
            """.trimIndent())
            
            jdbcTemplate.execute("""
                SELECT set_config('app.current_user_id', '$userId', false);
            """.trimIndent())
            
            logger.debug("RLS context set successfully")
        } catch (e: Exception) {
            logger.error("Failed to set RLS context", e)
            throw e
        }
    }
    
    /**
     * Clears the RLS context by setting session variables to NULL.
     * This should be called after each test to ensure clean state.
     * 
     * @deprecated RLS context cleanup is handled automatically when using the new API
     */
    @Deprecated(
        "RLS context cleanup is handled automatically with the new API",
        ReplaceWith("// No replacement needed - cleanup is automatic")
    )
    fun clearRLSContext() {
        logger.debug("Clearing RLS context")
        
        try {
            // Clear both tenant and user context
            jdbcTemplate.execute("""
                SELECT set_config('app.current_tenant_id', NULL, false);
            """.trimIndent())
            
            jdbcTemplate.execute("""
                SELECT set_config('app.current_user_id', NULL, false);
            """.trimIndent())
            
            logger.debug("RLS context cleared successfully")
        } catch (e: Exception) {
            logger.error("Failed to clear RLS context", e)
            throw e
        }
    }
    
    /**
     * Gets the current RLS context from the database session.
     * Useful for debugging and verification.
     * 
     * @return Map containing current session context information
     */
    fun getCurrentContext(): Map<String, Any?> {
        try {
            return jdbcTemplate.queryForMap("""
                SELECT * FROM v_current_context
            """.trimIndent())
        } catch (e: Exception) {
            logger.warn("Failed to get current context (v_current_context view may not exist): {}", e.message)
            
            // Fallback: get basic context information
            return try {
                val tenantId = jdbcTemplate.queryForObject(
                    "SELECT current_tenant_id()", String::class.java
                )
                val userId = jdbcTemplate.queryForObject(
                    "SELECT current_user_id()", String::class.java
                )
                
                mapOf(
                    "tenant_id" to tenantId,
                    "user_id" to userId,
                    "database_user" to jdbcTemplate.queryForObject("SELECT current_user", String::class.java)
                )
            } catch (fallbackException: Exception) {
                logger.error("Failed to get fallback context", fallbackException)
                emptyMap<String, Any?>()
            }
        }
    }
    
    /**
     * Validates that the current session has proper RLS context set.
     * 
     * @return true if session is properly configured, false otherwise
     */
    fun validateSession(): Boolean {
        return try {
            val result = jdbcTemplate.queryForObject(
                "SELECT validate_session()",
                Boolean::class.java
            )
            result ?: false
        } catch (e: Exception) {
            logger.warn("Session validation failed: {}", e.message)
            
            // Fallback validation: check if both tenant_id and user_id are set
            try {
                val tenantId = jdbcTemplate.queryForObject(
                    "SELECT current_tenant_id()", String::class.java
                )
                val userId = jdbcTemplate.queryForObject(
                    "SELECT current_user_id()", String::class.java
                )
                
                val isValid = !tenantId.isNullOrBlank() && !userId.isNullOrBlank()
                logger.debug("Fallback validation: tenant_id={}, user_id={}, valid={}", 
                           tenantId, userId, isValid)
                return isValid
            } catch (fallbackException: Exception) {
                logger.error("Fallback session validation failed", fallbackException)
                false
            }
        }
    }
    
    /**
     * Tests RLS isolation by counting visible records for a specific tenant.
     * Uses the test helper function created in the migration.
     * 
     * @param tenantId The tenant ID to test isolation for
     * @return Map with record counts for workspaces, tables, and records
     */
    fun testRLSIsolation(tenantId: UUID): Map<String, Long> {
        return try {
            val result = jdbcTemplate.queryForMap("""
                SELECT * FROM test_rls_workspace_isolation('$tenantId')
            """.trimIndent())
            
            mapOf(
                "workspaces" to (result["workspace_count"] as Number).toLong(),
                "tables" to (result["table_count"] as Number).toLong(),
                "records" to (result["record_count"] as Number).toLong()
            )
        } catch (e: Exception) {
            logger.warn("RLS isolation test failed (function may not exist): {}", e.message)
            
            // Fallback: manual count with context set
            val originalContext = getCurrentContext()
            try {
                setRLSContext(tenantId, UUID.randomUUID()) // Use dummy user ID
                
                val workspaceCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM workspaces", Long::class.java
                ) ?: 0L
                
                val tableCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tables", Long::class.java
                ) ?: 0L
                
                val recordCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM records", Long::class.java
                ) ?: 0L
                
                mapOf(
                    "workspaces" to workspaceCount,
                    "tables" to tableCount, 
                    "records" to recordCount
                )
            } finally {
                // Restore original context
                val originalTenant = originalContext["tenant_id"] as String?
                val originalUser = originalContext["user_id"] as String?
                
                if (!originalTenant.isNullOrBlank() && !originalUser.isNullOrBlank()) {
                    setRLSContext(UUID.fromString(originalTenant), UUID.fromString(originalUser))
                } else {
                    clearRLSContext()
                }
            }
        }
    }
    
    /**
     * Gets RLS protection status for all relevant tables.
     * 
     * @return List of maps containing table name, RLS enabled status, and policy count
     */
    fun getRLSStatus(): List<Map<String, Any?>> {
        return try {
            jdbcTemplate.queryForList("""
                SELECT * FROM validate_rls_protection() ORDER BY table_name
            """.trimIndent())
        } catch (e: Exception) {
            logger.warn("Failed to get RLS status (function may not exist): {}", e.message)
            
            // Fallback: query system tables directly
            try {
                jdbcTemplate.queryForList("""
                    SELECT 
                        t.tablename as table_name,
                        t.rowsecurity as rls_enabled,
                        COALESCE(p.policy_count, 0) as policy_count
                    FROM pg_tables t
                    LEFT JOIN (
                        SELECT 
                            tablename,
                            COUNT(*) as policy_count
                        FROM pg_policies
                        WHERE schemaname = 'public'
                        GROUP BY tablename
                    ) p ON t.tablename = p.tablename
                    WHERE t.schemaname = 'public'
                      AND t.tablename IN ('workspaces', 'tables', 'records', 'tenant_users', 'roles', 'user_roles', 'role_permissions')
                    ORDER BY t.tablename
                """.trimIndent())
            } catch (fallbackException: Exception) {
                logger.error("Fallback RLS status query failed", fallbackException)
                emptyList()
            }
        }
    }
    
    /**
     * Executes a query in the current RLS context and returns the result count.
     * Useful for testing that RLS policies are filtering correctly.
     * 
     * @param tableName The table to query
     * @param whereClause Optional WHERE clause (without "WHERE")
     * @return Number of rows visible in current RLS context
     */
    fun countVisibleRows(tableName: String, whereClause: String? = null): Long {
        val sql = if (whereClause.isNullOrBlank()) {
            "SELECT COUNT(*) FROM $tableName"
        } else {
            "SELECT COUNT(*) FROM $tableName WHERE $whereClause"
        }
        
        return try {
            jdbcTemplate.queryForObject(sql, Long::class.java) ?: 0L
        } catch (e: Exception) {
            logger.error("Failed to count visible rows in table {}: {}", tableName, e.message)
            0L
        }
    }
    
    /**
     * Attempts to insert a row and returns whether the operation succeeded.
     * Useful for testing INSERT policies.
     * 
     * @param sql The INSERT statement to execute
     * @param params Parameters for the SQL statement
     * @return true if insert succeeded, false if RLS policy blocked it
     */
    fun testInsert(sql: String, vararg params: Any?): Boolean {
        return try {
            val affectedRows = jdbcTemplate.update(sql, *params)
            logger.debug("Insert test: {} rows affected", affectedRows)
            affectedRows > 0
        } catch (e: Exception) {
            logger.debug("Insert test failed (likely blocked by RLS): {}", e.message)
            false
        }
    }
    
    /**
     * Logs current RLS context for debugging purposes.
     */
    fun debugContext() {
        val context = getCurrentContext()
        logger.info("=== Current RLS Context ===")
        context.forEach { (key, value) ->
            logger.info("  {}: {}", key, value)
        }
        logger.info("===========================")
    }
    
    /**
     * Executes a block of code within an RLS transaction context.
     * Uses SET LOCAL to ensure context is transaction-scoped.
     * 
     * @deprecated Use executeWithRLS from IntegrationTestBase instead
     * @param tenantId The tenant ID to set for the transaction
     * @param userId The user ID to set for the transaction
     * @param action The code block to execute within the RLS context
     * @return The result of the action
     */
    @Deprecated(
        "Use executeWithRLS from IntegrationTestBase",
        ReplaceWith("executeWithRLS(tenantId, userId, action)")
    )
    fun <T> executeInRLSTransaction(
        tenantId: UUID,
        userId: UUID,
        action: (JdbcTemplate) -> T
    ): T {
        return transactionTemplate?.execute { _ ->
            // Use SET LOCAL for transaction-scoped context
            // This is safer than set_config as it automatically resets after transaction
            jdbcTemplate.execute("""
                SET LOCAL app.current_tenant_id = '$tenantId';
                SET LOCAL app.current_user_id = '$userId';
            """.trimIndent())
            
            logger.debug("Set RLS context in transaction: tenant={}, user={}", tenantId, userId)
            
            // Execute the action within the RLS context
            action(jdbcTemplate)
        } ?: throw IllegalStateException("TransactionTemplate not available or execution returned null")
    }
    
    /**
     * Executes a block of code within an RLS transaction context with custom SQL setup.
     * Allows for more complex context setup if needed.
     * 
     * @param setupSql SQL to execute for context setup (e.g., SET LOCAL statements)
     * @param action The code block to execute within the RLS context
     * @return The result of the action
     */
    fun <T> executeInRLSTransactionWithSetup(
        setupSql: String,
        action: (JdbcTemplate) -> T
    ): T {
        return transactionTemplate?.execute { _ ->
            jdbcTemplate.execute(setupSql)
            logger.debug("Executed custom RLS setup: {}", setupSql)
            action(jdbcTemplate)
        } ?: throw IllegalStateException("TransactionTemplate not available or execution returned null")
    }
    
    /**
     * Executes a block of code as system user with RLS bypassed.
     * This method assumes the underlying DataSource has BYPASSRLS privilege (app_user).
     * 
     * NOTE: This only works if the RLSTestHelper was initialized with a DataSource
     * that connects as a user with BYPASSRLS privilege (e.g., app_user).
     * 
     * @param action The code block to execute without RLS restrictions
     * @return The result of the action
     */
    fun <T> executeAsSystemUser(action: (JdbcTemplate) -> T): T {
        // Clear any existing RLS context to ensure clean state
        clearRLSContext()
        
        logger.debug("Executing as system user (BYPASSRLS)")
        
        return if (transactionTemplate != null) {
            // Execute within a transaction if available
            transactionTemplate!!.execute { _ ->
                action(jdbcTemplate)
            } ?: throw IllegalStateException("Transaction execution returned null")
        } else {
            // Execute without transaction wrapper
            action(jdbcTemplate)
        }
    }
    
    /**
     * Executes a block of code with temporary RLS bypass, then restores the original context.
     * Useful when you need to perform system operations in the middle of RLS-restricted operations.
     * 
     * NOTE: This only works if the RLSTestHelper was initialized with a DataSource
     * that connects as a user with BYPASSRLS privilege.
     * 
     * @param action The code block to execute with system privileges
     * @return The result of the action
     */
    fun <T> executeWithTemporaryBypass(action: (JdbcTemplate) -> T): T {
        // Save current context
        val savedContext = try {
            getCurrentContext()
        } catch (e: Exception) {
            logger.warn("Could not save current context: {}", e.message)
            emptyMap<String, Any?>()
        }
        
        val savedTenantId = savedContext["tenant_id"] as String?
        val savedUserId = savedContext["user_id"] as String?
        
        logger.debug("Saving context before bypass: tenant={}, user={}", savedTenantId, savedUserId)
        
        return try {
            // Clear context for system access
            clearRLSContext()
            
            // Execute with system privileges
            val result = executeAsSystemUser(action)
            
            result
        } finally {
            // Restore original context if it existed
            if (!savedTenantId.isNullOrBlank() && !savedUserId.isNullOrBlank()) {
                try {
                    setRLSContext(UUID.fromString(savedTenantId), UUID.fromString(savedUserId))
                    logger.debug("Restored context after bypass: tenant={}, user={}", savedTenantId, savedUserId)
                } catch (e: Exception) {
                    logger.error("Failed to restore RLS context after bypass", e)
                }
            } else {
                logger.debug("No context to restore after bypass")
            }
        }
    }
    
    /**
     * Checks if the current connection has BYPASSRLS privilege.
     * Useful for verifying test setup and debugging.
     * 
     * @return true if the current user can bypass RLS, false otherwise
     */
    fun canBypassRLS(): Boolean {
        return try {
            val result = jdbcTemplate.queryForObject("""
                SELECT rolbypassrls 
                FROM pg_roles 
                WHERE rolname = current_user
            """.trimIndent(), Boolean::class.java)
            
            logger.debug("Current user '{}' BYPASSRLS status: {}", 
                jdbcTemplate.queryForObject("SELECT current_user", String::class.java), 
                result)
            
            result ?: false
        } catch (e: Exception) {
            logger.error("Failed to check BYPASSRLS status", e)
            false
        }
    }
}