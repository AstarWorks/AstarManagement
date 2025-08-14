package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.SimpleDatabaseTestBase
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.test.context.ActiveProfiles

/**
 * Simplified database integration test that validates T08 requirements:
 * - Testcontainers PostgreSQL connectivity
 * - Basic RLS validation
 * - Flyway migration execution
 * 
 * This test avoids complex entity relationships to focus on core infrastructure.
 */
@ActiveProfiles("test")
class SimpleDbIntegrationTest : SimpleDatabaseTestBase() {

    @Test
    fun `T08-AC1 - should start PostgreSQL 15 using Testcontainers`() {
        // Verify container is running
        assertThat(postgres.isRunning).isTrue()
        
        // Verify PostgreSQL version
        val result = queryRawSql<Map<String, Any>>("SELECT version()")
        assertThat(result).isNotEmpty()
        
        val version = result[0]["version"] as String
        assertThat(version).contains("PostgreSQL 15")
        
        println("✓ T08-AC1: PostgreSQL 15 running via Testcontainers")
    }

    @Test
    fun `T08-AC2 - should execute Flyway migrations successfully`() {
        // Verify key tables exist
        val tables = queryRawSql<Map<String, Any>>("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        assertThat(tables).isNotEmpty()
        
        // Check for key tables
        val tableNames = tables.map { it["table_name"] as String }
        assertThat(tableNames).contains(
            "expenses",
            "tags", 
            "expense_tags",
            "attachments",
            "expense_attachments",
            "users",
            "tenants"
        )
        
        println("✓ T08-AC2: All migrations executed successfully")
        println("  Found ${tables.size} tables")
    }

    @Test  
    fun `T08-AC3 - should have RLS policies on expense tables`() {
        // Check RLS is enabled on expenses table
        val rlsEnabled = queryRawSql<Map<String, Any>>("""
            SELECT relrowsecurity 
            FROM pg_class 
            WHERE relname = 'expenses'
        """)
        
        assertThat(rlsEnabled).isNotEmpty()
        val isEnabled = rlsEnabled[0]["relrowsecurity"] as Boolean
        assertThat(isEnabled).isTrue()
        
        // Check RLS policies exist
        val policies = queryRawSql<Map<String, Any>>("""
            SELECT policyname, cmd, permissive
            FROM pg_policies 
            WHERE tablename = 'expenses'
            ORDER BY policyname
        """)
        
        assertThat(policies).isNotEmpty()
        
        println("✓ T08-AC3: RLS enabled with ${policies.size} policies")
        policies.forEach { policy ->
            println("  - Policy: ${policy["policyname"]}, Command: ${policy["cmd"]}, Permissive: ${policy["permissive"]}")
        }
    }

    @Test
    fun `T08-AC4 - should have current_tenant_id function for RLS`() {
        // Verify the RLS support function exists
        val functions = queryRawSql<Map<String, Any>>("""
            SELECT routine_name, routine_type
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name = 'current_tenant_id'
        """)
        
        assertThat(functions).isNotEmpty()
        
        println("✓ T08-AC4: RLS support functions configured")
    }

    @Test
    fun `T08-AC5 - should validate basic performance indexes`() {
        // Check indexes on expenses table
        val indexes = queryRawSql<Map<String, Any>>("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'expenses'
            AND schemaname = 'public'
            ORDER BY indexname
        """)
        
        assertThat(indexes).hasSizeGreaterThanOrEqualTo(5)
        
        println("✓ T08-AC5: Performance indexes configured")
        println("  Found ${indexes.size} indexes on expenses table")
        
        // Measure simple query performance
        val startTime = System.currentTimeMillis()
        queryRawSql<Map<String, Any>>("SELECT COUNT(*) FROM expenses")
        val queryTime = System.currentTimeMillis() - startTime
        
        assertThat(queryTime).isLessThan(100) // Should be very fast
        println("  Query performance: ${queryTime}ms")
    }
}