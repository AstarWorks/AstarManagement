package com.astarworks.astarmanagement.fixture

import com.astarworks.astarmanagement.fixture.builder.TenantTestDataBuilder
import org.springframework.jdbc.core.JdbcTemplate
import java.util.*

/**
 * Object Mother pattern implementation for test fixtures.
 * Provides pre-configured test data objects for common test scenarios.
 * 
 * This follows the Object Mother pattern to provide consistent,
 * reusable test data across all tests.
 * 
 * @author Astar Management System
 */
object TestFixtures {
    
    // Fixed UUIDs for deterministic testing
    object Ids {
        // Tenant IDs
        val TENANT_ALPHA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        val TENANT_BETA = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
        val TENANT_GAMMA = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc")
        
        // User IDs
        val ADMIN_ALPHA = UUID.fromString("11111111-1111-1111-1111-111111111111")
        val USER_ALPHA = UUID.fromString("22222222-2222-2222-2222-222222222222")
        val ADMIN_BETA = UUID.fromString("33333333-3333-3333-3333-333333333333")
        val USER_BETA = UUID.fromString("44444444-4444-4444-4444-444444444444")
        
        // Role IDs
        val ROLE_ADMIN = UUID.fromString("aaaa1111-1111-1111-1111-111111111111")
        val ROLE_USER = UUID.fromString("aaaa2222-2222-2222-2222-222222222222")
        val ROLE_VIEWER = UUID.fromString("aaaa3333-3333-3333-3333-333333333333")
    }
    
    /**
     * Standard tenant configurations
     * 
     * IMPORTANT: These methods should be called within executeAsSystemUser block
     * when used in IntegrationTestBase subclasses to ensure proper RLS bypass.
     */
    object Tenants {
        /**
         * Create a minimal tenant with just an admin user.
         * Must be called within executeAsSystemUser block.
         */
        fun minimal(jdbcTemplate: JdbcTemplate) = TenantTestDataBuilder(jdbcTemplate)
            .withTenantId(Ids.TENANT_ALPHA)
            .withName("Minimal Tenant")
            .withAdminUser("admin@minimal.test")
            .build()
        
        /**
         * Create a standard tenant with admin and regular user.
         * Must be called within executeAsSystemUser block.
         */
        fun standard(jdbcTemplate: JdbcTemplate) = TenantTestDataBuilder(jdbcTemplate)
            .withTenantId(Ids.TENANT_ALPHA)
            .withName("Standard Tenant")
            .withAdminUser("admin@standard.test")
            .withRegularUser("user@standard.test")
            .build()
        
        /**
         * Create a complete tenant with multiple roles and workspace.
         * Must be called within executeAsSystemUser block.
         */
        fun complete(jdbcTemplate: JdbcTemplate) = TenantTestDataBuilder(jdbcTemplate)
            .withTenantId(Ids.TENANT_ALPHA)
            .withName("Complete Tenant")
            .withAdminUser("admin@complete.test")
            .withRegularUser("user@complete.test")
            .withCustomRole("viewer", "Viewer Role")
            .withUserInRole("viewer@complete.test", "viewer")
            .withWorkspace("Main Workspace")
            .build()
        
        /**
         * Create multiple isolated tenants for cross-tenant testing.
         * Must be called within executeAsSystemUser block.
         */
        fun isolated(jdbcTemplate: JdbcTemplate): IsolatedTenants {
            val alpha = TenantTestDataBuilder(jdbcTemplate)
                .withTenantId(Ids.TENANT_ALPHA)
                .withName("Tenant Alpha")
                .withAdminUser("admin@alpha.test")
                .withRegularUser("user@alpha.test")
                .withWorkspace()
                .build()
            
            val beta = TenantTestDataBuilder(jdbcTemplate)
                .withTenantId(Ids.TENANT_BETA)
                .withName("Tenant Beta")
                .withAdminUser("admin@beta.test")
                .withRegularUser("user@beta.test")
                .withWorkspace()
                .build()
            
            return IsolatedTenants(alpha, beta)
        }
    }
    
    /**
     * User configurations for testing
     */
    object Users {
        val ADMIN_EMAIL = "admin@test.com"
        val USER_EMAIL = "user@test.com"
        val VIEWER_EMAIL = "viewer@test.com"
        val INACTIVE_EMAIL = "inactive@test.com"
    }
    
    /**
     * Role configurations
     */
    object Roles {
        const val ADMIN = "admin"
        const val USER = "user"
        const val VIEWER = "viewer"
        const val CUSTOM = "custom"
    }
    
    /**
     * JWT tokens for testing
     */
    object Tokens {
        // These would typically be generated with your JWT secret
        const val VALID_ADMIN_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
        const val VALID_USER_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        const val EXPIRED_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        const val INVALID_TOKEN = "Bearer invalid.token.here"
    }
    
    /**
     * SQL fixtures for direct database setup
     * 
     * @deprecated These direct SQL operations should be replaced with RLS API methods:
     * - Use executeAsSystemUser for setup operations
     * - Use executeWithRLS for operations with RLS context
     * - Use executeWithoutRLS for operations without RLS context
     */
    @Deprecated("Use RLS API methods from IntegrationTestBase instead")
    object Sql {
        const val CLEAR_ALL = """
            DELETE FROM user_roles;
            DELETE FROM roles;
            DELETE FROM workspaces;
            DELETE FROM tenant_users;
            DELETE FROM tenants;
            DELETE FROM users;
        """
        
        @Deprecated("Use executeWithRLS from IntegrationTestBase")
        const val SETUP_RLS_CONTEXT = """
            SET app.current_tenant_id = :tenantId;
            SET app.current_user_id = :userId;
        """
        
        @Deprecated("RLS context is automatically cleared when using executeWithRLS")
        const val CLEAR_RLS_CONTEXT = """
            RESET app.current_tenant_id;
            RESET app.current_user_id;
        """
    }
    
    /**
     * Cleanup utilities
     * Note: These methods should be called from within executeAsSystemUser blocks
     * in IntegrationTestBase subclasses to ensure proper RLS bypass
     */
    object Cleanup {
        fun clearTenant(jdbcTemplate: JdbcTemplate, tenantId: UUID) {
            // Clear in reverse dependency order
            // IMPORTANT: This should be called within executeAsSystemUser block
            jdbcTemplate.update(
                "DELETE FROM user_roles WHERE tenant_user_id IN (SELECT id FROM tenant_users WHERE tenant_id = ?)",
                tenantId
            )
            jdbcTemplate.update("DELETE FROM roles WHERE tenant_id = ?", tenantId)
            jdbcTemplate.update("DELETE FROM workspaces WHERE tenant_id = ?", tenantId)
            jdbcTemplate.update("DELETE FROM tenant_users WHERE tenant_id = ?", tenantId)
            jdbcTemplate.update("DELETE FROM tenants WHERE id = ?", tenantId)
        }
        
        fun clearAll(jdbcTemplate: JdbcTemplate) {
            // Clear test data only, not migration data
            // IMPORTANT: This should be called within executeAsSystemUser block
            // Use specific test IDs to avoid clearing unrelated data
            val testTenantIds = listOf(
                Ids.TENANT_ALPHA.toString(),
                Ids.TENANT_BETA.toString(),
                Ids.TENANT_GAMMA.toString()
            )
            
            // Clear in reverse dependency order
            jdbcTemplate.update("""
                DELETE FROM user_roles 
                WHERE tenant_user_id IN (
                    SELECT id FROM tenant_users 
                    WHERE tenant_id IN (${testTenantIds.joinToString(",") { "'$it'::UUID" }})
                )
            """)
            
            jdbcTemplate.update("""
                DELETE FROM roles 
                WHERE tenant_id IN (${testTenantIds.joinToString(",") { "'$it'::UUID" }})
            """)
            
            jdbcTemplate.update("""
                DELETE FROM workspaces 
                WHERE tenant_id IN (${testTenantIds.joinToString(",") { "'$it'::UUID" }})
            """)
            
            jdbcTemplate.update("""
                DELETE FROM tenant_users 
                WHERE tenant_id IN (${testTenantIds.joinToString(",") { "'$it'::UUID" }})
            """)
            
            jdbcTemplate.update("""
                DELETE FROM tenants 
                WHERE id IN (${testTenantIds.joinToString(",") { "'$it'::UUID" }})
            """)
            
            // Also clear test users associated with these tenants
            jdbcTemplate.update("""
                DELETE FROM users 
                WHERE id IN (
                    '${Ids.ADMIN_ALPHA}'::UUID,
                    '${Ids.USER_ALPHA}'::UUID,
                    '${Ids.ADMIN_BETA}'::UUID,
                    '${Ids.USER_BETA}'::UUID
                )
            """)
        }
    }
}

/**
 * Container for isolated tenant test data
 */
data class IsolatedTenants(
    val alpha: com.astarworks.astarmanagement.fixture.builder.TenantTestData,
    val beta: com.astarworks.astarmanagement.fixture.builder.TenantTestData
)