package com.astarworks.astarmanagement.unit.core.workspace.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.workspace.api.mapper.WorkspaceDtoMapper
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for WorkspaceDtoMapper basic conversion functionality.
 * Tests fundamental transformations between Workspace domain model and DTOs.
 */
@UnitTest
@DisplayName("WorkspaceDtoMapper Basic Tests")
class WorkspaceDtoMapperBasicTest {
    
    private lateinit var mapper: WorkspaceDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = WorkspaceDtoMapper()
    }
    
    @Nested
    @DisplayName("Workspace to WorkspaceResponse Conversion")
    inner class WorkspaceToResponseConversion {
        
        @Test
        @DisplayName("Should convert Workspace to WorkspaceResponse with all fields")
        fun `should convert workspace to response with all fields`() {
            // Given
            val workspaceId = UUID.randomUUID()
            val tenantId = UUID.randomUUID()
            val userId = UUID.randomUUID()
            val teamId = UUID.randomUUID()
            val createdAt = Instant.now().minusSeconds(7200)
            val updatedAt = Instant.now()
            
            val workspace = Workspace(
                id = WorkspaceId(workspaceId),
                tenantId = TenantId(tenantId),
                name = "Test Workspace",
                createdBy = UserId(userId),
                teamId = TeamId(teamId),
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val response = mapper.toResponse(workspace)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.id).isEqualTo(workspaceId)
            assertThat(response.tenantId).isEqualTo(tenantId)
            assertThat(response.name).isEqualTo("Test Workspace")
            assertThat(response.createdBy).isEqualTo(userId)
            assertThat(response.teamId).isEqualTo(teamId)
            assertThat(response.createdAt).isEqualTo(createdAt)
            assertThat(response.updatedAt).isEqualTo(updatedAt)
            assertThat(response.description).isNull()
            assertThat(response.tableCount).isNull()
            assertThat(response.recordCount).isNull()
            assertThat(response.settings).isNull()
        }
        
        @Test
        @DisplayName("Should handle null optional fields")
        fun `should handle null optional fields`() {
            // Given
            val workspace = Workspace(
                name = "Minimal Workspace",
                tenantId = null,
                createdBy = null,
                teamId = null
            )
            
            // When
            val response = mapper.toResponse(workspace)
            
            // Then
            assertThat(response.tenantId).isNull()
            assertThat(response.createdBy).isNull()
            assertThat(response.teamId).isNull()
            assertThat(response.name).isEqualTo("Minimal Workspace")
        }
        
        @Test
        @DisplayName("Should include optional counts when provided")
        fun `should include optional counts when provided`() {
            // Given
            val workspace = createTestWorkspace()
            val tableCount = 5
            val recordCount = 100L
            
            // When
            val response = mapper.toResponse(
                workspace = workspace,
                tableCount = tableCount,
                recordCount = recordCount
            )
            
            // Then
            assertThat(response.tableCount).isEqualTo(5)
            assertThat(response.recordCount).isEqualTo(100L)
        }
        
        @Test
        @DisplayName("Should preserve exact timestamp precision")
        fun `should preserve exact timestamp precision`() {
            // Given
            val preciseTimestamp = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val workspace = Workspace(
                name = "Precise Workspace",
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            
            // When
            val response = mapper.toResponse(workspace)
            
            // Then
            assertThat(response.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.updatedAt).isEqualTo(preciseTimestamp)
        }
        
        @Test
        @DisplayName("Should handle workspace with maximum name length")
        fun `should handle workspace with maximum name length`() {
            // Given
            val maxLengthName = "W".repeat(255)
            val workspace = Workspace(name = maxLengthName)
            
            // When
            val response = mapper.toResponse(workspace)
            
            // Then
            assertThat(response.name).isEqualTo(maxLengthName)
            assertThat(response.name.length).isEqualTo(255)
        }
        
        @Test
        @DisplayName("Should handle zero counts correctly")
        fun `should handle zero counts correctly`() {
            // Given
            val workspace = createTestWorkspace()
            
            // When
            val response = mapper.toResponse(
                workspace = workspace,
                tableCount = 0,
                recordCount = 0L
            )
            
            // Then
            assertThat(response.tableCount).isEqualTo(0)
            assertThat(response.recordCount).isEqualTo(0L)
        }
        
        @Test
        @DisplayName("Should handle large count values")
        fun `should handle large count values`() {
            // Given
            val workspace = createTestWorkspace()
            val largeTableCount = Int.MAX_VALUE
            val largeRecordCount = Long.MAX_VALUE
            
            // When
            val response = mapper.toResponse(
                workspace = workspace,
                tableCount = largeTableCount,
                recordCount = largeRecordCount
            )
            
            // Then
            assertThat(response.tableCount).isEqualTo(Int.MAX_VALUE)
            assertThat(response.recordCount).isEqualTo(Long.MAX_VALUE)
        }
    }
    
    @Nested
    @DisplayName("Workspace to WorkspaceSummaryResponse Conversion")
    inner class WorkspaceToSummaryResponseConversion {
        
        @Test
        @DisplayName("Should convert Workspace to WorkspaceSummaryResponse")
        fun `should convert workspace to summary response`() {
            // Given
            val workspaceId = UUID.randomUUID()
            val createdAt = Instant.now().minusSeconds(3600)
            val workspace = Workspace(
                id = WorkspaceId(workspaceId),
                name = "Summary Workspace",
                createdAt = createdAt
            )
            
            // When
            val summary = mapper.toSummaryResponse(workspace)
            
            // Then
            assertThat(summary).isNotNull
            assertThat(summary.id).isEqualTo(workspaceId)
            assertThat(summary.name).isEqualTo("Summary Workspace")
            assertThat(summary.description).isNull()
            assertThat(summary.createdAt).isEqualTo(createdAt)
        }
        
        @Test
        @DisplayName("Should exclude detailed fields in summary")
        fun `should exclude detailed fields in summary`() {
            // Given
            val workspace = Workspace(
                name = "Detailed Workspace",
                tenantId = TenantId(UUID.randomUUID()),
                createdBy = UserId(UUID.randomUUID()),
                teamId = TeamId(UUID.randomUUID())
            )
            
            // When
            val summary = mapper.toSummaryResponse(workspace)
            
            // Then
            // Summary should only contain id, name, description, createdAt
            assertThat(summary.id).isEqualTo(workspace.id.value)
            assertThat(summary.name).isEqualTo(workspace.name)
            assertThat(summary.createdAt).isEqualTo(workspace.createdAt)
            // No other fields from full response
        }
        
        @Test
        @DisplayName("Should handle special characters in workspace name")
        fun `should handle special characters in workspace name`() {
            // Given
            val specialNames = listOf(
                "プロジェクト管理",
                "Workspace & Team",
                "Test-Workspace_2024",
                "Workspace #1",
                "Team's Workspace"
            )
            
            specialNames.forEach { name ->
                val workspace = Workspace(name = name)
                
                // When
                val summary = mapper.toSummaryResponse(workspace)
                
                // Then
                assertThat(summary.name).isEqualTo(name)
            }
        }
    }
    
    // Helper methods
    
    private fun createTestWorkspace(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID? = UUID.randomUUID(),
        name: String = "Test Workspace",
        createdBy: UUID? = UUID.randomUUID(),
        teamId: UUID? = null,
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): Workspace {
        return Workspace(
            id = WorkspaceId(id),
            tenantId = tenantId?.let { TenantId(it) },
            name = name,
            createdBy = createdBy?.let { UserId(it) },
            teamId = teamId?.let { TeamId(it) },
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}