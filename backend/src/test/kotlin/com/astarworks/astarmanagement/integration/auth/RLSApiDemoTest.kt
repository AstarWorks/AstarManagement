package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.BeforeEach
import org.assertj.core.api.Assertions.assertThat
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.jdbc.Sql
import java.time.Instant
import java.util.UUID

/**
 * Demonstration of the new RLS testing API.
 * Shows best practices for testing with and without RLS.
 */
@DisplayName("RLS API Demo Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class RLSApiDemoTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var membershipRepository: TenantMembershipRepository
    
    @Autowired
    private lateinit var workspaceRepository: WorkspaceRepository
    
    private lateinit var tenant1Id: UUID
    private lateinit var tenant2Id: UUID
    private lateinit var user1Id: UUID
    private lateinit var user2Id: UUID
    private lateinit var workspace1Id: UUID
    private lateinit var workspace2Id: UUID
    
    @BeforeEach
    fun setUp() {
        // Generate unique IDs and slugs
        val uniqueSuffix = UUID.randomUUID().toString().substring(0, 8)
        
        // Always use executeAsSystemUser for test data setup with Entity-based approach
        executeAsSystemUser {
            tenant1Id = UUID.randomUUID()
            tenant2Id = UUID.randomUUID()
            user1Id = UUID.randomUUID()
            user2Id = UUID.randomUUID()
            workspace1Id = UUID.randomUUID()
            workspace2Id = UUID.randomUUID()
            
            // Create test tenants using repository
            tenantRepository.save(
                Tenant(
                    id = TenantId(tenant1Id),
                    slug = "tenant1-$uniqueSuffix",
                    name = "Tenant 1",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            tenantRepository.save(
                Tenant(
                    id = TenantId(tenant2Id),
                    slug = "tenant2-$uniqueSuffix",
                    name = "Tenant 2",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create test users using repository
            userRepository.save(
                User(
                    id = UserId(user1Id),
                    auth0Sub = "auth0|user1",
                    email = "user1@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            userRepository.save(
                User(
                    id = UserId(user2Id),
                    auth0Sub = "auth0|user2",
                    email = "user2@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // Create tenant_users relationships using repository
            membershipRepository.save(
                TenantMembership(
                    tenantId = TenantId(tenant1Id),
                    userId = UserId(user1Id),
                    isActive = true,
                    joinedAt = Instant.now()
                )
            )
            membershipRepository.save(
                TenantMembership(
                    tenantId = TenantId(tenant2Id),
                    userId = UserId(user2Id),
                    isActive = true,
                    joinedAt = Instant.now()
                )
            )
            
            // Create workspaces for each tenant using repository
            workspaceRepository.save(
                Workspace(
                    id = WorkspaceId(workspace1Id),
                    tenantId = TenantId(tenant1Id),
                    name = "Workspace 1",
                    createdBy = UserId(user1Id),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            workspaceRepository.save(
                Workspace(
                    id = WorkspaceId(workspace2Id),
                    tenantId = TenantId(tenant2Id),
                    name = "Workspace 2",
                    createdBy = UserId(user2Id),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }
    }
    
    @Test
    @DisplayName("Pattern 1: Test tenant isolation with RLS")
    fun testTenantIsolationWithRLS() {
        // User 1 should only see Workspace 1
        executeWithRLS(tenant1Id, user1Id) { jdbc ->
            val workspaces = jdbc.queryForList("SELECT * FROM workspaces")
            assertThat(workspaces).hasSize(1)
            assertThat(workspaces[0]["id"]).isEqualTo(workspace1Id)
            assertThat(workspaces[0]["name"]).isEqualTo("Workspace 1")
        }
        
        // User 2 should only see Workspace 2
        executeWithRLS(tenant2Id, user2Id) { jdbc ->
            val workspaces = jdbc.queryForList("SELECT * FROM workspaces")
            assertThat(workspaces).hasSize(1)
            assertThat(workspaces[0]["id"]).isEqualTo(workspace2Id)
            assertThat(workspaces[0]["name"]).isEqualTo("Workspace 2")
        }
    }
    
    @Test
    @DisplayName("Pattern 2: Mixed system and RLS operations")
    fun testMixedOperations() {
        // Start with RLS context
        executeWithRLS(tenant1Id, user1Id) { jdbc ->
            val visibleWorkspaces = jdbc.queryForList("SELECT * FROM workspaces")
            assertThat(visibleWorkspaces).hasSize(1)
            
            // Need to check something across all tenants? Use executeWithTemporaryBypass
            val totalWorkspaces = executeWithTemporaryBypass { systemJdbc ->
                systemJdbc.queryForObject(
                    "SELECT COUNT(*) FROM workspaces",
                    Long::class.java
                )
            }
            
            assertThat(totalWorkspaces).isEqualTo(2L)
            
            // Back in RLS context automatically
            val stillRestricted = jdbc.queryForList("SELECT * FROM workspaces")
            assertThat(stillRestricted).hasSize(1)
        }
    }
    
    @Test
    @DisplayName("Pattern 3: Verify complete data isolation")
    fun testCompleteDataIsolation() {
        val tableId = UUID.randomUUID()
        
        // Create a table in tenant1 as system user
        executeAsSystemUser {
            jdbcTemplate.update(
                "INSERT INTO tables (id, workspace_id, name, properties, property_order) VALUES (?, ?, ?, ?::jsonb, ?::text[])",
                tableId, workspace1Id, "Private Table", "{}", "{}"
            )
        }
        
        // User1 in tenant1 can see the table
        executeWithRLS(tenant1Id, user1Id) { jdbc ->
            val tables = jdbc.queryForList(
                "SELECT * FROM tables WHERE id = ?",
                tableId
            )
            assertThat(tables).hasSize(1)
        }
        
        // User2 in tenant2 cannot see the table
        executeWithRLS(tenant2Id, user2Id) { jdbc ->
            val tables = jdbc.queryForList(
                "SELECT * FROM tables WHERE id = ?",
                tableId
            )
            assertThat(tables).isEmpty()
        }
        
        // Cleanup
        executeAsSystemUser {
            jdbcTemplate.update("DELETE FROM tables WHERE id = ?", tableId)
        }
    }
    
    @Test
    @DisplayName("Pattern 4: Test data migration scenario")
    fun testDataMigration() {
        // Simulate migrating data from a legacy table
        val legacyTableName = "legacy_data_${UUID.randomUUID().toString().replace("-", "")}"
        
        // Create and populate legacy table as system user
        executeWithoutRLS { jdbc ->
            try {
                jdbc.execute("CREATE TABLE $legacyTableName (id UUID PRIMARY KEY, data TEXT)")
                // Grant permissions to rls_test_user to access the table
                jdbc.execute("GRANT ALL ON TABLE $legacyTableName TO rls_test_user")
                jdbc.update("INSERT INTO $legacyTableName (id, data) VALUES (?, ?)", 
                    UUID.randomUUID(), "Legacy Record 1")
                jdbc.update("INSERT INTO $legacyTableName (id, data) VALUES (?, ?)", 
                    UUID.randomUUID(), "Legacy Record 2")
            } catch (e: Exception) {
                println("Error creating legacy table: ${e.message}")
                throw e
            }
        }
        
        // Migrate data to tenant-aware table
        executeAsSystemUser {
            try {
                jdbcTemplate.execute("""
                    ALTER TABLE $legacyTableName 
                    ADD COLUMN tenant_id UUID REFERENCES tenants(id)
                """.trimIndent())
                
                jdbcTemplate.update("""
                    UPDATE $legacyTableName 
                    SET tenant_id = ?
                """.trimIndent(), tenant1Id)
                
                // Enable RLS on the migrated table
                jdbcTemplate.execute("ALTER TABLE $legacyTableName ENABLE ROW LEVEL SECURITY")
                
                jdbcTemplate.execute("""
                    CREATE POLICY "${legacyTableName}_tenant_isolation" ON $legacyTableName
                    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant_id', true))
                """.trimIndent())
            } catch (e: Exception) {
                println("Error during migration: ${e.message}")
                throw e
            }
        }
        
        // Verify migration worked - user1 can see migrated data
        executeWithRLS(tenant1Id, user1Id) { jdbc ->
            val records = jdbc.queryForList("SELECT * FROM $legacyTableName")
            assertThat(records).hasSize(2)
        }
        
        // Verify isolation - user2 cannot see migrated data
        executeWithRLS(tenant2Id, user2Id) { jdbc ->
            val records = jdbc.queryForList("SELECT * FROM $legacyTableName")
            assertThat(records).isEmpty()
        }
        
        // Cleanup
        executeAsSystemUser {
            jdbcTemplate.execute("DROP TABLE IF EXISTS $legacyTableName CASCADE")
        }
    }
    
    @Test
    @DisplayName("Pattern 5: Test cross-tenant admin operations")
    fun testCrossTenantAdminOperations() {
        // Count workspaces across all tenants (admin operation)
        val totalCount = executeWithoutRLS { jdbc ->
            jdbc.queryForObject("SELECT COUNT(*) FROM workspaces", Long::class.java)
        }
        assertThat(totalCount).isEqualTo(2L)
        
        // Get workspace statistics per tenant
        val stats = executeAsSystemUser {
            jdbcTemplate.queryForList("""
                SELECT tenant_id, COUNT(*) as workspace_count
                FROM workspaces
                GROUP BY tenant_id
            """.trimIndent())
        }
        
        assertThat(stats).hasSize(2)
        assertThat(stats).allSatisfy { row ->
            assertThat(row["workspace_count"]).isEqualTo(1L)
        }
        
        // Verify each tenant's isolation still works
        executeWithRLS(tenant1Id, user1Id) { jdbc ->
            val count = jdbc.queryForObject("SELECT COUNT(*) FROM workspaces", Long::class.java)
            assertThat(count).isEqualTo(1L)
        }
    }
    
    @Test
    @DisplayName("Pattern 6: Verify RLS bypass capability")
    fun testVerifyRLSBypassCapability() {
        // Get the system JdbcTemplate
        val systemJdbc = getSystemJdbcTemplate()
        
        // Verify it can see all data
        val allWorkspaces = systemJdbc.queryForList("SELECT * FROM workspaces")
        assertThat(allWorkspaces).hasSize(2)
        
        // Verify different execution methods
        val countWithBypass = executeWithoutRLS { jdbc ->
            jdbc.queryForObject("SELECT COUNT(*) FROM workspaces", Long::class.java)
        }
        assertThat(countWithBypass).isEqualTo(2L)
        
        val countWithRLS = executeWithRLS(tenant1Id, user1Id) { jdbc ->
            jdbc.queryForObject("SELECT COUNT(*) FROM workspaces", Long::class.java)
        }
        assertThat(countWithRLS).isEqualTo(1L)
    }
}