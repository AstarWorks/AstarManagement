package com.astarworks.astarmanagement.integration.api.table

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.context.jdbc.Sql
import org.springframework.jdbc.core.JdbcTemplate
import com.astarworks.astarmanagement.fixture.builder.RLSTestDataBuilder
import com.astarworks.astarmanagement.fixture.builder.RLSTestEnvironment
import java.util.UUID
import javax.sql.DataSource
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.repository.TableRepository
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.assertj.core.api.Assertions.assertThat
import java.util.*

/**
 * TableController Integration Test - RLS Enabled
 * 
 * テナント分離機能をRLS（Row Level Security）有効環境で検証するテスト。
 * 通常のTableControllerIntegrationTestとは異なり、
 * RLSを有効にしてデータベースレベルでのテナント分離を検証する。
 * 
 * 期待動作:
 * - 異なるテナント間でのデータアクセスは403 Forbiddenエラー
 * - RLSポリシーによる自動的なテナント分離
 * - データベースレベルでのセキュリティ境界
 * 
 * Uses the new RLS API methods from IntegrationTestBase for better consistency.
 */
@SpringBootTest
@DisplayName("Table Controller Integration Tests - RLS Enabled")
@TestPropertySource(properties = ["app.security.rls.enabled=true"])  // Enable RLS for these tests
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class TableControllerRLSIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var dataBuilder: RLSTestDataBuilder
    
    @Autowired
    private lateinit var tableService: TableService
    
    @Autowired
    private lateinit var tableRepository: TableRepository
    
    @Autowired
    private lateinit var workspaceRepository: WorkspaceRepository
    
    @Autowired
    private lateinit var primaryDataSource: DataSource
    
    private lateinit var testEnvironment: SimpleRLSTestEnvironment

    @BeforeEach
    fun setUp() {
        // Create test environment using the new API
        testEnvironment = executeAsSystemUser {
            createTestEnvironmentDirectly()
        }
    }
    
    /**
     * Creates test environment using the new RLS API for consistency
     */
    private fun createTestEnvironmentDirectly(): SimpleRLSTestEnvironment {
        // Create tenant A with admin (using random IDs to avoid conflicts)
        val randomSuffix = UUID.randomUUID().toString().substring(0, 8)
        
        // Create tenant A
        val tenantAResult = jdbcTemplate.queryForMap(
            "SELECT * FROM setup_test_tenant_with_roles(?, ?, ?)",
            "RLS Test Tenant A $randomSuffix",
            "org_table_test_a_$randomSuffix", 
            "admin-a-$randomSuffix@table-test.com"
        )
        
        // Create tenant B
        val tenantBResult = jdbcTemplate.queryForMap(
            "SELECT * FROM setup_test_tenant_with_roles(?, ?, ?)",
            "RLS Test Tenant B $randomSuffix",
            "org_table_test_b_$randomSuffix",
            "admin-b-$randomSuffix@table-test.com"
        )
        
        val tenantAId = UUID.fromString(tenantAResult["tenant_id"].toString())
        val tenantBId = UUID.fromString(tenantBResult["tenant_id"].toString())
        
        // Create workspaces using the setup functions
        val workspaceAId = createWorkspaceForTenant(
            tenantAId,
            "Test Workspace A $randomSuffix"
        )
        
        val workspaceBId = createWorkspaceForTenant(
            tenantBId,
            "Test Workspace B $randomSuffix"
        )
        
        // Return simplified test environment structure
        return SimpleRLSTestEnvironment(
            tenantAId = tenantAId,
            tenantBId = tenantBId,
            adminUserAId = UUID.fromString(tenantAResult["admin_user_id"].toString()),
            adminUserBId = UUID.fromString(tenantBResult["admin_user_id"].toString()),
            workspaceAId = workspaceAId,
            workspaceBId = workspaceBId
        )
    }
    
    private fun createWorkspaceForTenant(tenantId: UUID, name: String): UUID {
        val workspaceId = UUID.randomUUID()
        executeAsSystemUser {
            jdbcTemplate.update("""
                INSERT INTO workspaces (id, tenant_id, name, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            """, workspaceId, tenantId, name)
        }
        return workspaceId
    }
    
    @AfterEach
    fun tearDown() {
        // RLS context cleanup is handled automatically by the framework
    }

    @Nested
    @DisplayName("RLS Tenant Isolation")
    inner class RLSTenantIsolation {
        
        @Test
        @DisplayName("Tables created in tenant A should only be visible to tenant A")
        fun createTable_InTenantA_OnlyVisibleToTenantA() {
            // Create table in Tenant A workspace through service (simulating controller action)
            val tenantATable = executeWithRLS(
                testEnvironment.tenantAId,
                testEnvironment.adminUserAId
            ) { _ ->
                tableService.createTable(
                    workspaceId = WorkspaceId(testEnvironment.workspaceAId),
                    name = "Tenant A Table",
                    description = "Test table for tenant A"
                )
            }
            
            // Verify Tenant A can see their table
            val tenantAVisibleTables = executeWithRLS(
                testEnvironment.tenantAId,
                testEnvironment.adminUserAId
            ) { jdbc ->
                jdbc.queryForList(
                    "SELECT id, name FROM tables WHERE id = ?",
                    tenantATable.id.value
                )
            }
            
            assertThat(tenantAVisibleTables).hasSize(1)
            assertThat(tenantAVisibleTables[0]["name"]).isEqualTo("Tenant A Table")
            
            // Verify Tenant B cannot see Tenant A's table (RLS enforcement)
            val tenantBVisibleTables = executeWithRLS(
                testEnvironment.tenantBId,
                testEnvironment.adminUserBId
            ) { jdbc ->
                jdbc.queryForList(
                    "SELECT id, name FROM tables WHERE id = ?",
                    tenantATable.id.value
                )
            }
            
            assertThat(tenantBVisibleTables).isEmpty()
        }
        
        @Test
        @DisplayName("Should fail when accessing table from different tenant")
        fun getTable_CrossTenant_ShouldFail() {
            // Create table in Tenant A
            val privateTable = executeWithRLS(
                testEnvironment.tenantAId,
                testEnvironment.adminUserAId
            ) { _ ->
                tableService.createTable(
                    workspaceId = WorkspaceId(testEnvironment.workspaceAId),
                    name = "Private Table",
                    description = "This table should not be visible to tenant B"
                )
            }
            
            // Tenant B tries to access Tenant A's table - should be blocked by RLS
            val tenantBResult = executeWithRLS(
                testEnvironment.tenantBId,
                testEnvironment.adminUserBId
            ) { jdbc ->
                jdbc.queryForList(
                    "SELECT * FROM tables WHERE id = ?",
                    privateTable.id.value
                )
            }
            
            // RLS should block access completely
            assertThat(tenantBResult).isEmpty()
        }
        
        @Test
        @DisplayName("Table listing should respect tenant isolation") 
        fun listTables_TenantIsolation() {
            // Create tables in both tenants
            executeWithRLS(
                testEnvironment.tenantAId,
                testEnvironment.adminUserAId
            ) { _ ->
                tableService.createTable(
                    workspaceId = WorkspaceId(testEnvironment.workspaceAId),
                    name = "Tenant A Table 1"
                )
                tableService.createTable(
                    workspaceId = WorkspaceId(testEnvironment.workspaceAId),
                    name = "Tenant A Table 2"
                )
            }
            
            executeWithRLS(
                testEnvironment.tenantBId,
                testEnvironment.adminUserBId
            ) { _ ->
                tableService.createTable(
                    workspaceId = WorkspaceId(testEnvironment.workspaceBId),
                    name = "Tenant B Table 1"
                )
            }
            
            // Tenant A lists all their tables
            val tenantATables = executeWithRLS(
                testEnvironment.tenantAId,
                testEnvironment.adminUserAId
            ) { jdbc ->
                jdbc.queryForList("SELECT name FROM tables ORDER BY name")
            }
            
            assertThat(tenantATables)
                .extracting("name")
                .contains(
                    "Tenant A Table 1",
                    "Tenant A Table 2"
                )
            
            // Tenant B lists all their tables
            val tenantBTables = executeWithRLS(
                testEnvironment.tenantBId,
                testEnvironment.adminUserBId
            ) { jdbc ->
                jdbc.queryForList("SELECT name FROM tables ORDER BY name")
            }
            
            assertThat(tenantBTables)
                .extracting("name")
                .contains("Tenant B Table 1")
        }
        
        @Test
        @DisplayName("Should fail when deleting table from different tenant")
        fun deleteTable_CrossTenant_ShouldFail() {
            // Create table in Tenant A
            val protectedTable = executeWithRLS(
                testEnvironment.tenantAId,
                testEnvironment.adminUserAId
            ) { _ ->
                tableService.createTable(
                    workspaceId = WorkspaceId(testEnvironment.workspaceAId),
                    name = "Table to Protect",
                    description = "This table should be protected from other tenants"
                )
            }
            
            // Tenant B tries to delete Tenant A's table - should be blocked by RLS
            val deleteAttempt = executeWithRLS(
                testEnvironment.tenantBId,
                testEnvironment.adminUserBId
            ) { jdbc ->
                jdbc.update(
                    "DELETE FROM tables WHERE id = ?",
                    protectedTable.id.value
                )
            }
            
            // DELETE should affect 0 rows due to RLS
            assertThat(deleteAttempt).isEqualTo(0)
            
            // Verify table still exists for Tenant A
            val tableStillExists = executeWithRLS(
                testEnvironment.tenantAId,
                testEnvironment.adminUserAId
            ) { jdbc ->
                jdbc.queryForList(
                    "SELECT name FROM tables WHERE id = ?",
                    protectedTable.id.value
                )
            }
            
            assertThat(tableStillExists).hasSize(1)
            assertThat(tableStillExists[0]["name"]).isEqualTo("Table to Protect")
        }
    }
}

/**
 * Simplified test environment for TableController RLS tests
 */
data class SimpleRLSTestEnvironment(
    val tenantAId: UUID,
    val tenantBId: UUID,
    val adminUserAId: UUID,
    val adminUserBId: UUID,
    val workspaceAId: UUID,
    val workspaceBId: UUID
)