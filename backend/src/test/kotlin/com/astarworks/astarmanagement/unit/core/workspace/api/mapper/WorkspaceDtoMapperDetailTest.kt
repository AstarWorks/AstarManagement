package com.astarworks.astarmanagement.unit.core.workspace.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.workspace.api.mapper.WorkspaceDtoMapper
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.buildJsonObject
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for WorkspaceDtoMapper detail response and statistics functionality.
 * Tests complex transformations involving multiple entities and metadata.
 */
@UnitTest
@DisplayName("WorkspaceDtoMapper Detail Tests")
class WorkspaceDtoMapperDetailTest {
    
    private lateinit var mapper: WorkspaceDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = WorkspaceDtoMapper()
    }
    
    @Nested
    @DisplayName("Workspace Detail Response Creation")
    inner class WorkspaceDetailResponseCreation {
        
        @Test
        @DisplayName("Should create detail response with all fields")
        fun `should create detail response with all fields`() {
            // Given
            val workspace = createTestWorkspace(name = "Detailed Workspace")
            
            val statistics = mapper.createStatistics(
                totalTables = 10,
                totalRecords = 500L,
                totalUsers = 5,
                storageUsed = 1024000L,
                lastActivity = Instant.now()
            )
            
            val recentTables = listOf(
                createTestTable(name = "Table 1"),
                createTestTable(name = "Table 2")
            )
            
            val permissions = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    scope = Scope.ALL
                ),
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.WORKSPACE,
                    action = Action.EDIT,
                    scope = Scope.OWN
                )
            )
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                statistics = statistics,
                recentTables = recentTables,
                permissions = permissions
            )
            
            // Then
            assertThat(detailResponse).isNotNull
            assertThat(detailResponse.workspace.name).isEqualTo("Detailed Workspace")
            assertThat(detailResponse.statistics).isEqualTo(statistics)
            assertThat(detailResponse.recentTables).hasSize(2)
            assertThat(detailResponse.permissions).hasSize(2)
            
            // Check table summaries
            assertThat(detailResponse.recentTables!![0].name).isEqualTo("Table 1")
            assertThat(detailResponse.recentTables!![1].name).isEqualTo("Table 2")
        }
        
        @Test
        @DisplayName("Should handle null statistics in detail response")
        fun `should handle null statistics in detail response`() {
            // Given
            val workspace = createTestWorkspace()
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                statistics = null,
                recentTables = null,
                permissions = null
            )
            
            // Then
            assertThat(detailResponse.statistics).isNull()
            assertThat(detailResponse.recentTables).isNull()
            assertThat(detailResponse.permissions).isNull()
            assertThat(detailResponse.workspace).isNotNull
        }
        
        @Test
        @DisplayName("Should use statistics counts in workspace response")
        fun `should use statistics counts in workspace response`() {
            // Given
            val workspace = createTestWorkspace()
            val statistics = mapper.createStatistics(
                totalTables = 15,
                totalRecords = 1000L,
                totalUsers = 10
            )
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                statistics = statistics
            )
            
            // Then
            assertThat(detailResponse.workspace.tableCount).isEqualTo(15)
            assertThat(detailResponse.workspace.recordCount).isEqualTo(1000L)
        }
        
        @Test
        @DisplayName("Should convert tables to table summaries")
        fun `should convert tables to table summaries`() {
            // Given
            val workspace = createTestWorkspace()
            val table1 = createTestTable(
                name = "Users",
                updatedAt = Instant.now().minusSeconds(3600)
            )
            val table2 = createTestTable(
                name = "Projects",
                updatedAt = Instant.now().minusSeconds(1800)
            )
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                recentTables = listOf(table1, table2)
            )
            
            // Then
            assertThat(detailResponse.recentTables).hasSize(2)
            
            val summary1 = detailResponse.recentTables!![0]
            assertThat(summary1.id).isEqualTo(table1.id.value)
            assertThat(summary1.name).isEqualTo("Users")
            assertThat(summary1.recordCount).isEqualTo(0) // Default value
            assertThat(summary1.lastModified).isEqualTo(table1.updatedAt)
            
            val summary2 = detailResponse.recentTables!![1]
            assertThat(summary2.name).isEqualTo("Projects")
            assertThat(summary2.lastModified).isEqualTo(table2.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle empty recent tables list")
        fun `should handle empty recent tables list`() {
            // Given
            val workspace = createTestWorkspace()
            val emptyTables = emptyList<Table>()
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                recentTables = emptyTables
            )
            
            // Then
            assertThat(detailResponse.recentTables).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle complex permission rules")
        fun `should handle complex permission rules`() {
            // Given
            val workspace = createTestWorkspace()
            val permissions = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.CREATE,
                    scope = Scope.ALL
                ),
                PermissionRule.ResourceGroupRule(
                    resourceType = ResourceType.DOCUMENT,
                    action = Action.EDIT,
                    groupId = UUID.randomUUID()
                ),
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.WORKSPACE,
                    action = Action.DELETE,
                    resourceId = workspace.id.value
                )
            )
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                permissions = permissions
            )
            
            // Then
            assertThat(detailResponse.permissions).hasSize(3)
            assertThat(detailResponse.permissions).containsExactlyElementsOf(permissions)
        }
    }
    
    @Nested
    @DisplayName("Workspace Statistics Creation")
    inner class WorkspaceStatisticsCreation {
        
        @Test
        @DisplayName("Should create statistics with all fields")
        fun `should create statistics with all fields`() {
            // Given
            val totalTables = 20
            val totalRecords = 5000L
            val totalUsers = 15
            val storageUsed = 2048000L
            val lastActivity = Instant.now()
            
            // When
            val statistics = mapper.createStatistics(
                totalTables = totalTables,
                totalRecords = totalRecords,
                totalUsers = totalUsers,
                storageUsed = storageUsed,
                lastActivity = lastActivity
            )
            
            // Then
            assertThat(statistics.totalTables).isEqualTo(20)
            assertThat(statistics.totalRecords).isEqualTo(5000L)
            assertThat(statistics.totalUsers).isEqualTo(15)
            assertThat(statistics.storageUsed).isEqualTo(2048000L)
            assertThat(statistics.lastActivity).isEqualTo(lastActivity)
        }
        
        @Test
        @DisplayName("Should create statistics with required fields only")
        fun `should create statistics with required fields only`() {
            // When
            val statistics = mapper.createStatistics(
                totalTables = 5,
                totalRecords = 100L,
                totalUsers = 2
            )
            
            // Then
            assertThat(statistics.totalTables).isEqualTo(5)
            assertThat(statistics.totalRecords).isEqualTo(100L)
            assertThat(statistics.totalUsers).isEqualTo(2)
            assertThat(statistics.storageUsed).isNull()
            assertThat(statistics.lastActivity).isNull()
        }
        
        @Test
        @DisplayName("Should handle zero counts in statistics")
        fun `should handle zero counts in statistics`() {
            // When
            val statistics = mapper.createStatistics(
                totalTables = 0,
                totalRecords = 0L,
                totalUsers = 0
            )
            
            // Then
            assertThat(statistics.totalTables).isEqualTo(0)
            assertThat(statistics.totalRecords).isEqualTo(0L)
            assertThat(statistics.totalUsers).isEqualTo(0)
        }
        
        @Test
        @DisplayName("Should handle large values in statistics")
        fun `should handle large values in statistics`() {
            // When
            val statistics = mapper.createStatistics(
                totalTables = Int.MAX_VALUE,
                totalRecords = Long.MAX_VALUE,
                totalUsers = Int.MAX_VALUE,
                storageUsed = Long.MAX_VALUE
            )
            
            // Then
            assertThat(statistics.totalTables).isEqualTo(Int.MAX_VALUE)
            assertThat(statistics.totalRecords).isEqualTo(Long.MAX_VALUE)
            assertThat(statistics.totalUsers).isEqualTo(Int.MAX_VALUE)
            assertThat(statistics.storageUsed).isEqualTo(Long.MAX_VALUE)
        }
        
        @Test
        @DisplayName("Should preserve timestamp precision in last activity")
        fun `should preserve timestamp precision in last activity`() {
            // Given
            val preciseTimestamp = Instant.parse("2024-01-15T10:30:45.123456789Z")
            
            // When
            val statistics = mapper.createStatistics(
                totalTables = 1,
                totalRecords = 1L,
                totalUsers = 1,
                lastActivity = preciseTimestamp
            )
            
            // Then
            assertThat(statistics.lastActivity).isEqualTo(preciseTimestamp)
        }
    }
    
    @Nested
    @DisplayName("Complex Detail Scenarios")
    inner class ComplexDetailScenarios {
        
        @Test
        @DisplayName("Should handle workspace with many recent tables")
        fun `should handle workspace with many recent tables`() {
            // Given
            val workspace = createTestWorkspace()
            val manyTables = (1..50).map { index ->
                createTestTable(name = "Table $index")
            }
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                recentTables = manyTables
            )
            
            // Then
            assertThat(detailResponse.recentTables).hasSize(50)
            assertThat(detailResponse.recentTables!![0].name).isEqualTo("Table 1")
            assertThat(detailResponse.recentTables!![49].name).isEqualTo("Table 50")
        }
        
        @Test
        @DisplayName("Should handle workspace with no permissions")
        fun `should handle workspace with no permissions`() {
            // Given
            val workspace = createTestWorkspace()
            val emptyPermissions = emptyList<PermissionRule>()
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                permissions = emptyPermissions
            )
            
            // Then
            assertThat(detailResponse.permissions).isEmpty()
        }
        
        @Test
        @DisplayName("Should combine all detail components correctly")
        fun `should combine all detail components correctly`() {
            // Given
            val workspaceId = UUID.randomUUID()
            val workspace = createTestWorkspace(
                id = workspaceId,
                name = "Complete Workspace"
            )
            
            val statistics = mapper.createStatistics(
                totalTables = 3,
                totalRecords = 150L,
                totalUsers = 5,
                storageUsed = 512000L,
                lastActivity = Instant.now()
            )
            
            val tables = (1..3).map { index ->
                createTestTable(name = "Table $index")
            }
            
            val permissions = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.WORKSPACE,
                    action = Action.VIEW,
                    scope = Scope.ALL
                ),
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.WORKSPACE,
                    action = Action.EDIT,
                    resourceId = workspaceId
                )
            )
            
            // When
            val detailResponse = mapper.toDetailResponse(
                workspace = workspace,
                statistics = statistics,
                recentTables = tables,
                permissions = permissions
            )
            
            // Then
            assertThat(detailResponse.workspace.id).isEqualTo(workspaceId)
            assertThat(detailResponse.workspace.name).isEqualTo("Complete Workspace")
            assertThat(detailResponse.workspace.tableCount).isEqualTo(3)
            assertThat(detailResponse.workspace.recordCount).isEqualTo(150L)
            
            assertThat(detailResponse.statistics?.totalTables).isEqualTo(3)
            assertThat(detailResponse.statistics?.totalUsers).isEqualTo(5)
            assertThat(detailResponse.statistics?.storageUsed).isEqualTo(512000L)
            
            assertThat(detailResponse.recentTables).hasSize(3)
            assertThat(detailResponse.permissions).hasSize(2)
        }
    }
    
    // Helper methods
    
    private fun createTestWorkspace(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID? = UUID.randomUUID(),
        name: String = "Test Workspace",
        createdBy: UUID? = UUID.randomUUID(),
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): Workspace {
        return Workspace(
            id = WorkspaceId(id),
            tenantId = tenantId?.let { TenantId(it) },
            name = name,
            createdBy = createdBy?.let { UserId(it) },
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    private fun createTestTable(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID = UUID.randomUUID(),
        name: String = "Test Table",
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): Table {
        return Table(
            id = TableId(id),
            workspaceId = WorkspaceId(workspaceId),
            name = name,
            properties = mapOf(
                "prop1" to PropertyDefinition(
                    typeId = "text",
                    displayName = "Property 1",
                    config = buildJsonObject {}
                )
            ),
            propertyOrder = listOf("prop1"),
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}