package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.fixture.builder.RLSTestDataBuilder
import com.astarworks.astarmanagement.fixture.builder.RLSTestEnvironment
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.springframework.beans.factory.annotation.Autowired
import org.assertj.core.api.Assertions.assertThat
import org.springframework.test.context.jdbc.Sql

/**
 * 最重要テスト: RLSによるテナント分離の検証
 * 
 * マルチテナントアプリケーションの基本的なセキュリティ要件を検証:
 * - テナント間のデータ分離が正しく機能するか
 * - 正しいテナントのデータのみが見えるか
 * - 間違ったテナントのデータが見えないか
 * 
 * Uses the new RLS API methods from IntegrationTestBase for consistency.
 * Tests actual RLS policies with rls_test_user (without BYPASSRLS).
 * Note: @Transactionalを使わず、より本番環境に近い条件でテスト
 */
@DisplayName("RLS Tenant Isolation Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class RLSTenantIsolationTest : IntegrationTestBase() {

    @Autowired
    private lateinit var dataBuilder: RLSTestDataBuilder

    private lateinit var testEnvironment: RLSTestEnvironment

    @BeforeEach
    fun setUp() {
        // Create test environment using the new API
        testEnvironment = executeAsSystemUser {
            dataBuilder.createMultiTenantRLSEnvironment()
        }
    }

    @AfterEach
    fun tearDown() {
        // RLS context cleanup is handled automatically by the framework
    }

    @Nested
    @DisplayName("Workspace Tenant Isolation")
    inner class WorkspaceIsolationTests {

        @Test
        @DisplayName("Tenant A should only see Tenant A workspaces")
        fun testTenantAWorkspaceIsolation() {
            // Execute in RLS context for Tenant A using the new API
            val visibleWorkspaces = executeWithRLS(
                testEnvironment.tenantAId, 
                testEnvironment.adminUserA.id.value
            ) { jdbc ->
                jdbc.queryForList(
                    "SELECT id, name, tenant_id FROM workspaces ORDER BY name"
                )
            }
            
            // Verify only Tenant A workspaces are visible
            assertThat(visibleWorkspaces)
                .hasSize(3)
                .allSatisfy { workspace ->
                    assertThat(workspace["tenant_id"].toString()).isEqualTo(testEnvironment.tenantAId.toString())
                }
            
            // Verify specific workspace names (from RLSTestDataBuilder)
            val workspaceNames = visibleWorkspaces.map { it["name"] as String }
            assertThat(workspaceNames).containsExactlyInAnyOrder(
                "RLS Workspace A1",
                "RLS Workspace A2", 
                "RLS Workspace A3"
            )
        }

        @Test
        @DisplayName("Tenant B should only see Tenant B workspaces")
        fun testTenantBWorkspaceIsolation() {
            // Execute in RLS context for Tenant B using the new API
            val visibleWorkspaces = executeWithRLS(
                testEnvironment.tenantBId, 
                testEnvironment.adminUserB.id.value
            ) { jdbc ->
                jdbc.queryForList(
                    "SELECT id, name, tenant_id FROM workspaces ORDER BY name"
                )
            }
            
            // Verify only Tenant B workspaces are visible
            assertThat(visibleWorkspaces)
                .hasSize(2)
                .allSatisfy { workspace ->
                    assertThat(workspace["tenant_id"].toString()).isEqualTo(testEnvironment.tenantBId.toString())
                }
            
            // Verify specific workspace names
            val workspaceNames = visibleWorkspaces.map { it["name"] as String }
            assertThat(workspaceNames).containsExactlyInAnyOrder(
                "RLS Workspace B1",
                "RLS Workspace B2"
            )
        }

        @Test
        @DisplayName("Context switching should show different data")
        fun testContextSwitchingIsolation() {
            // First, check Tenant A's view
            val tenantAWorkspaces = executeWithRLS(
                testEnvironment.tenantAId, 
                testEnvironment.adminUserA.id.value
            ) { jdbc ->
                jdbc.queryForObject(
                    "SELECT COUNT(*) FROM workspaces", Long::class.java
                )
            }
            assertThat(tenantAWorkspaces).isEqualTo(3)
            
            // Then, check Tenant B's view
            val tenantBWorkspaces = executeWithRLS(
                testEnvironment.tenantBId, 
                testEnvironment.adminUserB.id.value
            ) { jdbc ->
                jdbc.queryForObject(
                    "SELECT COUNT(*) FROM workspaces", Long::class.java
                )
            }
            assertThat(tenantBWorkspaces).isEqualTo(2)
            
            // Check Tenant A again to ensure isolation
            val tenantAWorkspacesAgain = executeWithRLS(
                testEnvironment.tenantAId, 
                testEnvironment.adminUserA.id.value
            ) { jdbc ->
                jdbc.queryForObject(
                    "SELECT COUNT(*) FROM workspaces", Long::class.java
                )
            }
            assertThat(tenantAWorkspacesAgain).isEqualTo(3)
        }
    }

    @Nested
    @DisplayName("Table Tenant Isolation")
    inner class TableIsolationTests {

        @Test
        @DisplayName("Tenant A should only see Tenant A tables")
        fun testTenantATableIsolation() {
            val visibleTables = executeWithRLS(
                testEnvironment.tenantAId, 
                testEnvironment.adminUserA.id.value
            ) { jdbc ->
                jdbc.queryForList(
                    """SELECT t.id, t.name, w.tenant_id 
                       FROM tables t 
                       JOIN workspaces w ON t.workspace_id = w.id 
                       ORDER BY t.name"""
                )
            }
            
            // Each Tenant A workspace should have tables
            assertThat(visibleTables)
                .isNotEmpty()
                .allSatisfy { table ->
                    assertThat(table["tenant_id"].toString()).isEqualTo(testEnvironment.tenantAId.toString())
                }
        }

        @Test
        @DisplayName("Tenant B should only see Tenant B tables")
        fun testTenantBTableIsolation() {
            val visibleTables = executeWithRLS(
                testEnvironment.tenantBId, 
                testEnvironment.adminUserB.id.value
            ) { jdbc ->
                jdbc.queryForList(
                    """SELECT t.id, t.name, w.tenant_id 
                       FROM tables t 
                       JOIN workspaces w ON t.workspace_id = w.id 
                       ORDER BY t.name"""
                )
            }
            
            assertThat(visibleTables)
                .isNotEmpty()
                .allSatisfy { table ->
                    assertThat(table["tenant_id"].toString()).isEqualTo(testEnvironment.tenantBId.toString())
                }
        }
    }

    @Nested
    @DisplayName("Record Tenant Isolation")
    inner class RecordIsolationTests {

        @Test
        @DisplayName("Tenant A should only see Tenant A records")
        fun testTenantARecordIsolation() {
            val visibleRecords = executeWithRLS(
                testEnvironment.tenantAId, 
                testEnvironment.adminUserA.id.value
            ) { jdbc ->
                jdbc.queryForList(
                    """SELECT r.id, w.tenant_id 
                       FROM records r 
                       JOIN tables t ON r.table_id = t.id 
                       JOIN workspaces w ON t.workspace_id = w.id 
                       ORDER BY r.created_at"""
                )
            }
            
            assertThat(visibleRecords)
                .isNotEmpty()
                .allSatisfy { record ->
                    assertThat(record["tenant_id"].toString()).isEqualTo(testEnvironment.tenantAId.toString())
                }
        }

        @Test
        @DisplayName("Tenant B should only see Tenant B records")
        fun testTenantBRecordIsolation() {
            val visibleRecords = executeWithRLS(
                testEnvironment.tenantBId, 
                testEnvironment.adminUserB.id.value
            ) { jdbc ->
                jdbc.queryForList(
                    """SELECT r.id, w.tenant_id 
                       FROM records r 
                       JOIN tables t ON r.table_id = t.id 
                       JOIN workspaces w ON t.workspace_id = w.id 
                       ORDER BY r.created_at"""
                )
            }
            
            assertThat(visibleRecords)
                .isNotEmpty()
                .allSatisfy { record ->
                    assertThat(record["tenant_id"].toString()).isEqualTo(testEnvironment.tenantBId.toString())
                }
        }
    }

    @Test
    @DisplayName("RLS should work with regular users, not just admins")
    fun testRegularUserIsolation() {
        // Test with regular Tenant A user
        val tenantAWorkspaces = executeWithRLS(
            testEnvironment.tenantAId, 
            testEnvironment.regularUserA.id.value
        ) { jdbc ->
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM workspaces", Long::class.java
            )
        }
        assertThat(tenantAWorkspaces).isEqualTo(3)
        
        // Test with regular Tenant B user
        val tenantBWorkspaces = executeWithRLS(
            testEnvironment.tenantBId, 
            testEnvironment.regularUserB.id.value
        ) { jdbc ->
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM workspaces", Long::class.java
            )
        }
        assertThat(tenantBWorkspaces).isEqualTo(2)
    }
}