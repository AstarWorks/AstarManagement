package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.domain.repository.TableRepository
import com.astarworks.astarmanagement.core.table.domain.repository.RecordRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import kotlinx.serialization.json.JsonObject
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.jdbc.Sql
import org.assertj.core.api.Assertions.assertThat
import java.time.Instant
import java.util.UUID

/**
 * Basic RLS functionality tests to verify the infrastructure is working.
 * Demonstrates the use of new RLS API methods from IntegrationTestBase.
 */
@DisplayName("RLS Basic Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class RLSBasicTest : IntegrationTestBase() {

    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var membershipRepository: TenantMembershipRepository
    
    @Autowired
    private lateinit var workspaceRepository: WorkspaceRepository
    
    @Autowired
    private lateinit var tableRepository: TableRepository
    
    @Autowired
    private lateinit var recordRepository: RecordRepository

    @Test
    @DisplayName("Should set and clear RLS context using new API")
    fun testBasicRLSContext() {
        val tenantId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        
        // Create test data as system user using Entity-based approach
        val uniqueSuffix = UUID.randomUUID().toString().substring(0, 8)
        executeAsSystemUser {
            // Create tenant using repository
            val tenant = tenantRepository.save(
                Tenant(
                    id = TenantId(tenantId),
                    slug = "test-tenant-$uniqueSuffix",
                    name = "Test Tenant",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create user using repository
            val user = userRepository.save(
                User(
                    id = UserId(userId),
                    auth0Sub = "auth0|test",
                    email = "test@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }

        // Verify that Entity-based approach created data correctly
        executeAsSystemUser {
            // Verify tenant was created with correct data
            val createdTenant = jdbcTemplate.queryForMap(
                "SELECT * FROM tenants WHERE id = ?",
                tenantId
            )
            assertThat(createdTenant["id"]).isEqualTo(tenantId)
            assertThat(createdTenant["slug"]).isEqualTo("test-tenant-$uniqueSuffix")
            assertThat(createdTenant["name"]).isEqualTo("Test Tenant")
            assertThat(createdTenant["is_active"]).isEqualTo(true)
            
            // Verify user was created with correct data
            val createdUser = jdbcTemplate.queryForMap(
                "SELECT * FROM users WHERE id = ?",
                userId
            )
            assertThat(createdUser["id"]).isEqualTo(userId)
            assertThat(createdUser["auth0_sub"]).isEqualTo("auth0|test")
            assertThat(createdUser["email"]).isEqualTo("test@example.com")
        }
        
        // Test RLS context within executeWithRLS
        executeWithRLS(tenantId, userId) { jdbc ->
            // Inside this block, RLS context is automatically set
            val result = jdbc.queryForObject(
                "SELECT current_setting('app.current_tenant_id', true)",
                String::class.java
            )
            assertThat(result).isEqualTo(tenantId.toString())
            
            val userResult = jdbc.queryForObject(
                "SELECT current_setting('app.current_user_id', true)",
                String::class.java
            )
            assertThat(userResult).isEqualTo(userId.toString())
        }
        
        // After the block, context is automatically cleared
        // Verify context is cleared by checking with system user
        executeAsSystemUser {
            val result = jdbcTemplate.queryForObject(
                "SELECT current_setting('app.current_tenant_id', true)",
                String::class.java
            )
            assertThat(result).isNullOrEmpty()
        }
    }

    @Test
    @DisplayName("Should validate RLS session state using new API")
    fun testSessionValidation() {
        val tenantId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val uniqueSuffix = UUID.randomUUID().toString().substring(0, 8)

        // Without any data, session should be invalid
        // We can use the helper directly within executeWithRLS
        executeWithRLS(tenantId, userId) { jdbc ->
            val validSession = jdbc.queryForObject(
                "SELECT validate_session()",
                Boolean::class.java
            )
            assertThat(validSession).isFalse()  // False because no tenant_users record exists
        }
        
        // Create tenant and user but no membership using Entity-based approach
        executeAsSystemUser {
            // Create tenant using repository
            tenantRepository.save(
                Tenant(
                    id = TenantId(tenantId),
                    slug = "test-tenant-validation-$uniqueSuffix",
                    name = "Test Tenant",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create user using repository
            userRepository.save(
                User(
                    id = UserId(userId),
                    auth0Sub = "auth0|validation",
                    email = "validation@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }
        
        // Still invalid without tenant_users record
        executeWithRLS(tenantId, userId) { jdbc ->
            val validSession = jdbc.queryForObject(
                "SELECT validate_session()",
                Boolean::class.java
            )
            assertThat(validSession).isFalse()
        }
        
        // Create tenant_users membership using Entity-based approach
        executeAsSystemUser {
            membershipRepository.save(
                TenantMembership(
                    tenantId = TenantId(tenantId),
                    userId = UserId(userId),
                    isActive = true,
                    joinedAt = Instant.now()
                )
            )
        }
        
        // Now session should be valid
        executeWithRLS(tenantId, userId) { jdbc ->
            val validSession = jdbc.queryForObject(
                "SELECT validate_session()",
                Boolean::class.java
            )
            assertThat(validSession).isTrue()
        }
    }

    @Test
    @DisplayName("Should get RLS status for protected tables using new API")
    fun testRLSStatus() {
        // Use executeAsSystemUser to check RLS status
        executeAsSystemUser {
            val rlsStatus = jdbcTemplate.queryForList("""
                SELECT 
                    schemaname,
                    tablename as table_name,
                    rowsecurity as rls_enabled,
                    (SELECT COUNT(*) FROM pg_policies WHERE tablename = c.tablename) as policy_count
                FROM pg_tables c
                WHERE schemaname = 'public' 
                AND tablename IN ('tenants', 'users', 'workspaces', 'tenant_users')
                ORDER BY tablename
            """.trimIndent())
            
            // Should have status for key tables
            assertThat(rlsStatus).isNotEmpty()
            
            // Log status for verification
            rlsStatus.forEach { status ->
                println("Table: ${status["table_name"]}, RLS Enabled: ${status["rls_enabled"]}, Policies: ${status["policy_count"]}")
            }
            
            // Verify RLS is enabled on critical tables
            val workspaceStatus = rlsStatus.find { it["table_name"] == "workspaces" }
            assertThat(workspaceStatus).isNotNull
            assertThat(workspaceStatus?.get("rls_enabled")).isEqualTo(true)
        }
    }

    @Test
    @DisplayName("Should count visible rows with RLS context using new API")
    fun testVisibleRowCounting() {
        val tenantId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val workspaceId = UUID.randomUUID()
        val uniqueSuffix = UUID.randomUUID().toString().substring(0, 8)
        
        // Setup test data using Entity-based approach
        executeAsSystemUser {
            // Create tenant
            tenantRepository.save(
                Tenant(
                    id = TenantId(tenantId),
                    slug = "count-tenant-$uniqueSuffix",
                    name = "Count Tenant",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create user
            userRepository.save(
                User(
                    id = UserId(userId),
                    auth0Sub = "auth0|count",
                    email = "count@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create membership
            membershipRepository.save(
                TenantMembership(
                    tenantId = TenantId(tenantId),
                    userId = UserId(userId),
                    isActive = true,
                    joinedAt = Instant.now()
                )
            )
            
            // Create workspace
            workspaceRepository.save(
                Workspace(
                    id = WorkspaceId(workspaceId),
                    tenantId = TenantId(tenantId),
                    name = "Count Workspace",
                    createdBy = UserId(userId),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }
        
        // With RLS context, should see only tenant's data
        executeWithRLS(tenantId, userId) { jdbc ->
            val count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM workspaces",
                Long::class.java
            )
            assertThat(count).isEqualTo(1L)
        }
        
        // Different tenant should see no data
        val otherTenantId = UUID.randomUUID()
        executeWithRLS(otherTenantId, userId) { jdbc ->
            val count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM workspaces",
                Long::class.java
            )
            assertThat(count).isEqualTo(0L)
        }
    }

    @Test
    @DisplayName("Should test RLS isolation using new API")
    fun testRLSIsolationFunction() {
        val tenantId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val uniqueSuffix = UUID.randomUUID().toString().substring(0, 8)
        
        // Setup test data with multiple tables using Entity-based approach
        executeAsSystemUser {
            // Create tenant and user
            tenantRepository.save(
                Tenant(
                    id = TenantId(tenantId),
                    slug = "isolation-tenant-$uniqueSuffix",
                    name = "Isolation Tenant",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            userRepository.save(
                User(
                    id = UserId(userId),
                    auth0Sub = "auth0|isolation",
                    email = "isolation@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            membershipRepository.save(
                TenantMembership(
                    tenantId = TenantId(tenantId),
                    userId = UserId(userId),
                    isActive = true,
                    joinedAt = Instant.now()
                )
            )
            
            // Create workspace
            val workspaceId = UUID.randomUUID()
            val workspace = workspaceRepository.save(
                Workspace(
                    id = WorkspaceId(workspaceId),
                    tenantId = TenantId(tenantId),
                    name = "Isolation Workspace",
                    createdBy = UserId(userId),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create table
            val tableId = UUID.randomUUID()
            val table = tableRepository.save(
                Table(
                    id = TableId(tableId),
                    workspaceId = WorkspaceId(workspaceId),
                    name = "Isolation Table",
                    properties = emptyMap(),
                    propertyOrder = emptyList(),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create record
            recordRepository.save(
                Record(
                    tableId = TableId(tableId),
                    data = kotlinx.serialization.json.JsonObject(emptyMap())
                )
            )
        }
        
        // Test isolation with RLS context
        executeWithRLS(tenantId, userId) { jdbc ->
            val workspaceCount = jdbc.queryForObject("SELECT COUNT(*) FROM workspaces", Long::class.java)
            val tableCount = jdbc.queryForObject("SELECT COUNT(*) FROM tables", Long::class.java)
            val recordCount = jdbc.queryForObject("SELECT COUNT(*) FROM records", Long::class.java)
            
            assertThat(workspaceCount).isEqualTo(1L)
            assertThat(tableCount).isEqualTo(1L)
            assertThat(recordCount).isEqualTo(1L)
            
            println("Isolation test results for tenant $tenantId:")
            println("  workspaces: $workspaceCount")
            println("  tables: $tableCount")
            println("  records: $recordCount")
        }
    }

    @Test
    @DisplayName("Should verify RLS bypass capability using new API")
    fun testRLSBypassCapability() {
        // Test that executeAsSystemUser can bypass RLS
        val systemCanBypass = executeAsSystemUser {
            val result = jdbcTemplate.queryForObject(
                "SELECT current_user",
                String::class.java
            )
            // app_user has BYPASSRLS privilege
            result == "app_user"
        }
        assertThat(systemCanBypass).isTrue()
        
        // Test that executeWithRLS uses rls_test_user without bypass
        val tenantId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        executeWithRLS(tenantId, userId) { jdbc ->
            val result = jdbc.queryForObject(
                "SELECT current_user",
                String::class.java
            )
            // rls_test_user does not have BYPASSRLS privilege
            assertThat(result).isEqualTo("rls_test_user")
        }
    }
    
    @Test
    @DisplayName("Should demonstrate executeAsSystemUser method")
    fun testExecuteAsSystemUser() {
        val testTenantId = UUID.randomUUID()
        val testWorkspaceId = UUID.randomUUID()
        val testUserId = UUID.randomUUID()
        val uniqueSuffix = UUID.randomUUID().toString().substring(0, 8)
        
        // Use new executeAsSystemUser method from IntegrationTestBase with Entity-based approach
        executeAsSystemUser {
            // This runs with BYPASSRLS - can setup test data freely
            tenantRepository.save(
                Tenant(
                    id = TenantId(testTenantId),
                    slug = "system-tenant-$uniqueSuffix",
                    name = "Test Tenant",
                    auth0OrgId = "org_test",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create user first to satisfy foreign key constraint
            userRepository.save(
                User(
                    id = UserId(testUserId),
                    auth0Sub = "auth0|system",
                    email = "system@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            workspaceRepository.save(
                Workspace(
                    id = WorkspaceId(testWorkspaceId),
                    tenantId = TenantId(testTenantId),
                    name = "Test Workspace",
                    createdBy = UserId(testUserId),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }
        
        // Verify data was created
        val count = executeWithoutRLS { jdbc ->
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM workspaces WHERE id = ?",
                Long::class.java,
                testWorkspaceId
            )
        }
        
        assertThat(count).isEqualTo(1L)
        
        // Cleanup is handled by @Sql annotation
    }
    
    @Test
    @DisplayName("Should demonstrate executeWithRLS method")
    fun testExecuteWithRLS() {
        val tenant1Id = UUID.randomUUID()
        val tenant2Id = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val uniqueSuffix = UUID.randomUUID().toString().substring(0, 8)
        
        // Setup test data as system user using Entity-based approach
        executeAsSystemUser {
            // Create two tenants with unique slugs
            tenantRepository.save(
                Tenant(
                    id = TenantId(tenant1Id),
                    slug = "rls-tenant1-$uniqueSuffix",
                    name = "Tenant 1",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            tenantRepository.save(
                Tenant(
                    id = TenantId(tenant2Id),
                    slug = "rls-tenant2-$uniqueSuffix",
                    name = "Tenant 2",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create user
            userRepository.save(
                User(
                    id = UserId(userId),
                    auth0Sub = "auth0|rls",
                    email = "rls@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create tenant memberships
            membershipRepository.save(
                TenantMembership(
                    tenantId = TenantId(tenant1Id),
                    userId = UserId(userId),
                    isActive = true,
                    joinedAt = Instant.now()
                )
            )
            membershipRepository.save(
                TenantMembership(
                    tenantId = TenantId(tenant2Id),
                    userId = UserId(userId),
                    isActive = true,
                    joinedAt = Instant.now()
                )
            )
            
            // Create workspaces for each tenant
            workspaceRepository.save(
                Workspace(
                    tenantId = TenantId(tenant1Id),
                    name = "Workspace 1",
                    createdBy = UserId(userId),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            workspaceRepository.save(
                Workspace(
                    tenantId = TenantId(tenant2Id),
                    name = "Workspace 2",
                    createdBy = UserId(userId),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }
        
        // Test RLS isolation - user in tenant1 should only see tenant1's workspace
        executeWithRLS(tenant1Id, userId) { jdbc ->
            val workspaces = jdbc.queryForList("SELECT * FROM workspaces")
            assertThat(workspaces).hasSize(1)
            assertThat(workspaces[0]["name"]).isEqualTo("Workspace 1")
        }
        
        // Test RLS isolation - user in tenant2 should only see tenant2's workspace
        executeWithRLS(tenant2Id, userId) { jdbc ->
            val workspaces = jdbc.queryForList("SELECT * FROM workspaces")
            assertThat(workspaces).hasSize(1)
            assertThat(workspaces[0]["name"]).isEqualTo("Workspace 2")
        }
        
        // Cleanup is handled by @Sql annotation
    }
}