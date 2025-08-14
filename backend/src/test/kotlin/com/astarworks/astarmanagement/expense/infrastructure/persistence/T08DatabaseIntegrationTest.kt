package com.astarworks.astarmanagement.expense.infrastructure.persistence

import org.assertj.core.api.Assertions.*
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.sql.DriverManager

/**
 * T08 Database Integration Test - validates core infrastructure requirements.
 * 
 * This test runs without Spring context to avoid JPA entity loading issues.
 * It validates:
 * - Testcontainers PostgreSQL setup
 * - Flyway migration execution
 * - RLS policies
 * - Performance indexes
 */
@Testcontainers
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class T08DatabaseIntegrationTest {
    
    companion object {
        @Container
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:15-alpine")
            .withDatabaseName("astarmanagement_test")
            .withUsername("test")
            .withPassword("test")
            .withCommand("postgres", "-c", "shared_preload_libraries=pg_stat_statements")
    }
    
    @BeforeAll
    fun setup() {
        // Run Flyway migrations
        val flyway = Flyway.configure()
            .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
            .locations("classpath:db/migration")
            .load()
        
        flyway.migrate()
    }
    
    @Test
    fun `T08-AC1 - PostgreSQL 15 runs via Testcontainers`() {
        // Verify container is running
        assertThat(postgres.isRunning).isTrue()
        
        // Connect and check version
        DriverManager.getConnection(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password
        ).use { connection ->
            val statement = connection.createStatement()
            val resultSet = statement.executeQuery("SELECT version()")
            
            assertThat(resultSet.next()).isTrue()
            val version = resultSet.getString(1)
            assertThat(version).contains("PostgreSQL 15")
            
            println("✅ T08-AC1 PASSED: PostgreSQL 15 running via Testcontainers")
            println("   Version: $version")
        }
    }
    
    @Test
    fun `T08-AC2 - Flyway migrations execute successfully`() {
        DriverManager.getConnection(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password
        ).use { connection ->
            // Check key tables exist
            val tables = mutableListOf<String>()
            val resultSet = connection.createStatement().executeQuery("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """.trimIndent())
            
            while (resultSet.next()) {
                tables.add(resultSet.getString("table_name"))
            }
            
            assertThat(tables).contains(
                "expenses",
                "tags",
                "expense_tags",
                "attachments",
                "expense_attachments",
                "users",
                "tenants"
            )
            
            println("✅ T08-AC2 PASSED: All migrations executed")
            println("   Found ${tables.size} tables")
        }
    }
    
    @Test
    fun `T08-AC3 - RLS policies exist on expense tables`() {
        DriverManager.getConnection(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password
        ).use { connection ->
            // Check RLS is enabled
            val rlsResult = connection.createStatement().executeQuery("""
                SELECT relrowsecurity 
                FROM pg_class 
                WHERE relname = 'expenses'
            """.trimIndent())
            
            assertThat(rlsResult.next()).isTrue()
            assertThat(rlsResult.getBoolean("relrowsecurity")).isTrue()
            
            // Check policies
            val policies = mutableListOf<String>()
            val policyResult = connection.createStatement().executeQuery("""
                SELECT policyname 
                FROM pg_policies 
                WHERE tablename = 'expenses'
            """.trimIndent())
            
            while (policyResult.next()) {
                policies.add(policyResult.getString("policyname"))
            }
            
            assertThat(policies).isNotEmpty()
            
            println("✅ T08-AC3 PASSED: RLS enabled with ${policies.size} policies")
            policies.forEach { println("   - $it") }
        }
    }
    
    @Test
    fun `T08-AC4 - RLS support functions exist`() {
        DriverManager.getConnection(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password
        ).use { connection ->
            val result = connection.createStatement().executeQuery("""
                SELECT routine_name 
                FROM information_schema.routines 
                WHERE routine_schema = 'public'
                AND routine_name = 'current_tenant_id'
            """.trimIndent())
            
            assertThat(result.next()).isTrue()
            
            println("✅ T08-AC4 PASSED: RLS support functions configured")
        }
    }
    
    @Test
    fun `T08-AC5 - Performance indexes exist`() {
        DriverManager.getConnection(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password
        ).use { connection ->
            val indexes = mutableListOf<String>()
            val result = connection.createStatement().executeQuery("""
                SELECT indexname 
                FROM pg_indexes
                WHERE tablename = 'expenses'
                AND schemaname = 'public'
                ORDER BY indexname
            """.trimIndent())
            
            while (result.next()) {
                indexes.add(result.getString("indexname"))
            }
            
            assertThat(indexes).hasSizeGreaterThanOrEqualTo(5)
            
            // Test query performance
            val start = System.currentTimeMillis()
            connection.createStatement().executeQuery("SELECT COUNT(*) FROM expenses")
            val duration = System.currentTimeMillis() - start
            
            assertThat(duration).isLessThan(100)
            
            println("✅ T08-AC5 PASSED: Performance indexes configured")
            println("   Found ${indexes.size} indexes")
            println("   Query time: ${duration}ms")
        }
    }
}