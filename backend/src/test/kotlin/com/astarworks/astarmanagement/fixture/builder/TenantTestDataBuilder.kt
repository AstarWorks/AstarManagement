package com.astarworks.astarmanagement.fixture.builder

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.support.TransactionTemplate
import java.sql.Connection
import java.util.*

/**
 * Test Data Builder for creating tenant test data following the Builder pattern.
 * Provides a fluent API for constructing test data with sensible defaults.
 * 
 * IMPORTANT: This builder must be used within executeAsSystemUser block
 * to ensure proper RLS bypass for test data setup.
 * 
 * Usage from IntegrationTestBase subclass:
 * ```
 * val testData = executeAsSystemUser {
 *     TenantTestDataBuilder(jdbcTemplate)
 *         .withName("Test Tenant")
 *         .withAdminUser("admin@test.com")
 *         .withRegularUser("user@test.com")
 *         .withCustomRole("viewer", "Viewer Role")
 *         .build()
 * }
 * ```
 * 
 * @author Astar Management System
 */
class TenantTestDataBuilder(private val jdbcTemplate: JdbcTemplate) {
    
    private var tenantId: UUID = UUID.randomUUID()
    private var tenantName: String = "Test Tenant ${System.currentTimeMillis()}"
    private val users = mutableListOf<UserData>()
    private val roles = mutableListOf<RoleData>()
    private val userRoles = mutableListOf<UserRoleAssignment>()
    private var includeWorkspace = false
    private var workspaceName: String? = null
    
    /**
     * Set specific tenant ID
     */
    fun withTenantId(id: UUID) = apply {
        this.tenantId = id
    }
    
    /**
     * Set specific tenant ID from string
     */
    fun withTenantId(id: String) = apply {
        this.tenantId = UUID.fromString(id)
    }
    
    /**
     * Set tenant name
     */
    fun withName(name: String) = apply {
        this.tenantName = name
    }
    
    /**
     * Add an admin user with default admin role
     */
    fun withAdminUser(email: String = "admin@test.com") = apply {
        val userId = UUID.randomUUID()
        val adminRole = roles.find { it.name == "admin" } 
            ?: RoleData(UUID.randomUUID(), "admin", "Administrator").also { roles.add(it) }
        
        users.add(UserData(userId, email))
        userRoles.add(UserRoleAssignment(userId, adminRole.id))
    }
    
    /**
     * Add a regular user with default user role
     */
    fun withRegularUser(email: String = "user@test.com") = apply {
        val userId = UUID.randomUUID()
        val userRole = roles.find { it.name == "user" }
            ?: RoleData(UUID.randomUUID(), "user", "User").also { roles.add(it) }
        
        users.add(UserData(userId, email))
        userRoles.add(UserRoleAssignment(userId, userRole.id))
    }
    
    /**
     * Add a custom role
     */
    fun withCustomRole(name: String, displayName: String? = null) = apply {
        roles.add(RoleData(UUID.randomUUID(), name, displayName ?: name))
    }
    
    /**
     * Add a user with specific role
     */
    fun withUserInRole(email: String, roleName: String) = apply {
        val userId = UUID.randomUUID()
        val role = roles.find { it.name == roleName }
            ?: throw IllegalArgumentException("Role $roleName not found. Add role first.")
        
        users.add(UserData(userId, email))
        userRoles.add(UserRoleAssignment(userId, role.id))
    }
    
    /**
     * Include a workspace for this tenant
     */
    fun withWorkspace(name: String? = null) = apply {
        includeWorkspace = true
        workspaceName = name ?: "$tenantName Workspace"
    }
    
    /**
     * Clean up any existing data for this tenant before creating new data
     */
    private fun cleanupExistingTenant() {
        // Note: This cleanup is intentionally commented out to avoid transaction issues
        // The test framework should handle cleanup via @BeforeEach/@AfterEach
        // Keeping this method for future use if needed
    }
    
    /**
     * Build and persist the test data.
     * 
     * IMPORTANT: This method must be called from within executeAsSystemUser block
     * in IntegrationTestBase subclasses to ensure proper RLS bypass.
     */
    fun build(): TenantTestData {
        // Create or update tenant
        val tenantSlug = tenantName.lowercase().replace(" ", "-").replace(Regex("[^a-z0-9-]"), "")
        
        // Use UPSERT (INSERT ... ON CONFLICT) to handle existing tenants
        println("Creating/updating tenant with ID: $tenantId, name: $tenantName, slug: $tenantSlug")
        
        try {
            // Use ON CONFLICT to handle existing tenant gracefully
            val rowsAffected = jdbcTemplate.update("""
                INSERT INTO tenants (id, slug, name, is_active, created_at, updated_at) 
                VALUES (?, ?, ?, TRUE, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name,
                    slug = EXCLUDED.slug,
                    is_active = TRUE,
                    updated_at = NOW()
            """, tenantId, tenantSlug, tenantName)
            
            println("Tenant setup complete: $tenantId (rows affected: $rowsAffected)")
            
        } catch (e: Exception) {
            println("ERROR: Failed to create/update tenant: ${e.message}")
            throw e
        }
        
        // Create users and tenant_users
        val tenantUserIds = mutableMapOf<UUID, UUID>()
        users.forEach { user ->
            // Create or update user using UPSERT
            val testAuth0Sub = "auth0|test_${user.id}"
            jdbcTemplate.update("""
                INSERT INTO users (id, auth0_sub, email, created_at, updated_at) 
                VALUES (?, ?, ?, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET 
                    email = EXCLUDED.email,
                    updated_at = NOW()
            """, user.id, testAuth0Sub, user.email)
            
            // Get or create tenant_user
            val existingTenantUserId = jdbcTemplate.query(
                "SELECT id FROM tenant_users WHERE tenant_id = ? AND user_id = ?",
                { rs, _ -> rs.getObject("id", UUID::class.java) },
                tenantId, user.id
            ).firstOrNull()
            
            val tenantUserId = existingTenantUserId ?: UUID.randomUUID()
            tenantUserIds[user.id] = tenantUserId
            
            // Create tenant_user if not exists using UPSERT
            if (existingTenantUserId == null) {
                jdbcTemplate.update("""
                    INSERT INTO tenant_users (id, tenant_id, user_id, is_active, joined_at) 
                    VALUES (?, ?, ?, TRUE, NOW())
                    ON CONFLICT (tenant_id, user_id) DO UPDATE SET
                        is_active = TRUE
                """, tenantUserId, tenantId, user.id)
            }
        }
        
        // Create roles using UPSERT
        roles.forEach { role ->
            jdbcTemplate.update("""
                INSERT INTO roles (id, tenant_id, name, display_name, created_at, updated_at) 
                VALUES (?, ?, ?, ?, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    updated_at = NOW()
            """, role.id, tenantId, role.name, role.displayName)
        }
        
        // Assign user roles using UPSERT
        userRoles.forEach { assignment ->
            val tenantUserId = tenantUserIds[assignment.userId]
                ?: throw IllegalStateException("Tenant user ID not found for user ${assignment.userId}")
            
            jdbcTemplate.update("""
                INSERT INTO user_roles (tenant_user_id, role_id, assigned_at) 
                VALUES (?, ?, NOW())
                ON CONFLICT (tenant_user_id, role_id) DO NOTHING
            """, tenantUserId, assignment.roleId)
        }
        
        // Create workspace if requested
        var workspaceId: UUID? = null
        if (includeWorkspace) {
            workspaceId = UUID.randomUUID()
            
            // Use UPSERT for workspace - need to handle missing created_by field
            val createdBy = users.firstOrNull()?.id
            if (createdBy != null) {
                jdbcTemplate.update("""
                    INSERT INTO workspaces (id, tenant_id, name, created_by, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                    ON CONFLICT (tenant_id, name) DO UPDATE SET
                        updated_at = NOW()
                    RETURNING id
                """, workspaceId, tenantId, workspaceName, createdBy)
            } else {
                // If no users, create workspace without created_by (may fail if column is NOT NULL)
                println("Warning: Creating workspace without created_by user")
                jdbcTemplate.update("""
                    INSERT INTO workspaces (id, tenant_id, name, created_at, updated_at) 
                    VALUES (?, ?, ?, NOW(), NOW())
                    ON CONFLICT (tenant_id, name) DO UPDATE SET
                        updated_at = NOW()
                    RETURNING id
                """, workspaceId, tenantId, workspaceName)
            }
        }
        
        return TenantTestData(
            tenantId = tenantId,
            tenantName = tenantName,
            users = users.map { TestUser(it.id, it.email, tenantUserIds[it.id]!!) },
            roles = roles.map { TestRole(it.id, it.name, it.displayName) },
            workspaceId = workspaceId
        )
    }
    
    // Internal data classes
    private data class UserData(val id: UUID, val email: String)
    private data class RoleData(val id: UUID, val name: String, val displayName: String?)
    private data class UserRoleAssignment(val userId: UUID, val roleId: UUID)
}

/**
 * Result of building test tenant data
 */
data class TenantTestData(
    val tenantId: UUID,
    val tenantName: String,
    val users: List<TestUser>,
    val roles: List<TestRole>,
    val workspaceId: UUID? = null
) {
    fun getAdminUser(): TestUser? = users.firstOrNull { user ->
        // Check if user has admin role (would need to track this in builder)
        user.email.contains("admin")
    }
    
    fun getRegularUser(): TestUser? = users.firstOrNull { user ->
        !user.email.contains("admin")
    }
}

data class TestUser(
    val id: UUID,
    val email: String,
    val tenantUserId: UUID
)

data class TestRole(
    val id: UUID,
    val name: String,
    val displayName: String?
)