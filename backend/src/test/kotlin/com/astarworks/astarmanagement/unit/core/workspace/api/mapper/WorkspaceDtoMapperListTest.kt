package com.astarworks.astarmanagement.unit.core.workspace.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.workspace.api.mapper.WorkspaceDtoMapper
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for WorkspaceDtoMapper list operations.
 * Tests batch transformations and list response creation.
 */
@UnitTest
@DisplayName("WorkspaceDtoMapper List Tests")
class WorkspaceDtoMapperListTest {
    
    private lateinit var mapper: WorkspaceDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = WorkspaceDtoMapper()
    }
    
    @Nested
    @DisplayName("Response List Conversion")
    inner class ResponseListConversion {
        
        @Test
        @DisplayName("Should convert list of workspaces to response list")
        fun `should convert list of workspaces to response list`() {
            // Given
            val workspaces = listOf(
                createTestWorkspace(name = "Workspace 1"),
                createTestWorkspace(name = "Workspace 2"),
                createTestWorkspace(name = "Workspace 3")
            )
            
            // When
            val responses = mapper.toResponseList(workspaces)
            
            // Then
            assertThat(responses).hasSize(3)
            assertThat(responses[0].name).isEqualTo("Workspace 1")
            assertThat(responses[1].name).isEqualTo("Workspace 2")
            assertThat(responses[2].name).isEqualTo("Workspace 3")
        }
        
        @Test
        @DisplayName("Should handle empty workspace list")
        fun `should handle empty workspace list`() {
            // Given
            val emptyList = emptyList<Workspace>()
            
            // When
            val responses = mapper.toResponseList(emptyList)
            
            // Then
            assertThat(responses).isEmpty()
        }
        
        @Test
        @DisplayName("Should preserve all fields in list conversion")
        fun `should preserve all fields in list conversion`() {
            // Given
            val tenantId = UUID.randomUUID()
            val userId = UUID.randomUUID()
            val workspace = Workspace(
                id = WorkspaceId(UUID.randomUUID()),
                tenantId = TenantId(tenantId),
                name = "Detailed Workspace",
                createdBy = UserId(userId),
                createdAt = Instant.now().minusSeconds(3600),
                updatedAt = Instant.now()
            )
            
            // When
            val responses = mapper.toResponseList(listOf(workspace))
            
            // Then
            assertThat(responses).hasSize(1)
            val response = responses[0]
            assertThat(response.id).isEqualTo(workspace.id.value)
            assertThat(response.tenantId).isEqualTo(tenantId)
            assertThat(response.name).isEqualTo(workspace.name)
            assertThat(response.createdBy).isEqualTo(userId)
            assertThat(response.createdAt).isEqualTo(workspace.createdAt)
            assertThat(response.updatedAt).isEqualTo(workspace.updatedAt)
        }
        
        @Test
        @DisplayName("Should maintain order in list conversion")
        fun `should maintain order in list conversion`() {
            // Given
            val workspaceA = createTestWorkspace(name = "A Workspace")
            val workspaceZ = createTestWorkspace(name = "Z Workspace")
            val workspaceM = createTestWorkspace(name = "M Workspace")
            val orderedList = listOf(workspaceA, workspaceZ, workspaceM)
            
            // When
            val responses = mapper.toResponseList(orderedList)
            
            // Then
            assertThat(responses[0].name).isEqualTo("A Workspace")
            assertThat(responses[1].name).isEqualTo("Z Workspace")
            assertThat(responses[2].name).isEqualTo("M Workspace")
        }
    }
    
    @Nested
    @DisplayName("Summary Response List Conversion")
    inner class SummaryResponseListConversion {
        
        @Test
        @DisplayName("Should convert list of workspaces to summary response list")
        fun `should convert list of workspaces to summary response list`() {
            // Given
            val workspaces = (1..5).map { index ->
                createTestWorkspace(name = "Workspace $index")
            }
            
            // When
            val summaries = mapper.toSummaryResponseList(workspaces)
            
            // Then
            assertThat(summaries).hasSize(5)
            summaries.forEachIndexed { index, summary ->
                assertThat(summary.name).isEqualTo("Workspace ${index + 1}")
                assertThat(summary.id).isNotNull
                assertThat(summary.createdAt).isNotNull
                assertThat(summary.description).isNull()
            }
        }
        
        @Test
        @DisplayName("Should handle empty list in summary conversion")
        fun `should handle empty list in summary conversion`() {
            // Given
            val emptyList = emptyList<Workspace>()
            
            // When
            val summaries = mapper.toSummaryResponseList(emptyList)
            
            // Then
            assertThat(summaries).isEmpty()
        }
    }
    
    @Nested
    @DisplayName("Workspace List Response Creation")
    inner class WorkspaceListResponseCreation {
        
        @Test
        @DisplayName("Should create WorkspaceListResponse with counts")
        fun `should create workspace list response with counts`() {
            // Given
            val workspace1 = createTestWorkspace(name = "Workspace 1")
            val workspace2 = createTestWorkspace(name = "Workspace 2")
            val workspaces = listOf(workspace1, workspace2)
            
            val tableCounts = mapOf(
                workspace1.id.value to 5,
                workspace2.id.value to 10
            )
            
            val recordCounts = mapOf(
                workspace1.id.value to 100L,
                workspace2.id.value to 200L
            )
            
            // When
            val listResponse = mapper.toListResponse(
                workspaces = workspaces,
                tableCounts = tableCounts,
                recordCounts = recordCounts
            )
            
            // Then
            assertThat(listResponse.workspaces).hasSize(2)
            assertThat(listResponse.totalCount).isEqualTo(2L)
            assertThat(listResponse.hasMore).isFalse
            
            val response1 = listResponse.workspaces[0]
            assertThat(response1.tableCount).isEqualTo(5)
            assertThat(response1.recordCount).isEqualTo(100L)
            
            val response2 = listResponse.workspaces[1]
            assertThat(response2.tableCount).isEqualTo(10)
            assertThat(response2.recordCount).isEqualTo(200L)
        }
        
        @Test
        @DisplayName("Should create WorkspaceListResponse without counts")
        fun `should create workspace list response without counts`() {
            // Given
            val workspaces = listOf(
                createTestWorkspace(name = "Workspace 1"),
                createTestWorkspace(name = "Workspace 2")
            )
            
            // When
            val listResponse = mapper.toListResponse(workspaces)
            
            // Then
            assertThat(listResponse.workspaces).hasSize(2)
            assertThat(listResponse.workspaces[0].tableCount).isNull()
            assertThat(listResponse.workspaces[0].recordCount).isNull()
            assertThat(listResponse.workspaces[1].tableCount).isNull()
            assertThat(listResponse.workspaces[1].recordCount).isNull()
        }
        
        @Test
        @DisplayName("Should handle partial counts in list response")
        fun `should handle partial counts in list response`() {
            // Given
            val workspace1 = createTestWorkspace()
            val workspace2 = createTestWorkspace()
            val workspace3 = createTestWorkspace()
            val workspaces = listOf(workspace1, workspace2, workspace3)
            
            // Only provide counts for workspace1
            val tableCounts = mapOf(workspace1.id.value to 5)
            val recordCounts = mapOf(workspace1.id.value to 100L)
            
            // When
            val listResponse = mapper.toListResponse(
                workspaces = workspaces,
                tableCounts = tableCounts,
                recordCounts = recordCounts
            )
            
            // Then
            assertThat(listResponse.workspaces[0].tableCount).isEqualTo(5)
            assertThat(listResponse.workspaces[0].recordCount).isEqualTo(100L)
            assertThat(listResponse.workspaces[1].tableCount).isNull()
            assertThat(listResponse.workspaces[1].recordCount).isNull()
            assertThat(listResponse.workspaces[2].tableCount).isNull()
            assertThat(listResponse.workspaces[2].recordCount).isNull()
        }
        
        @Test
        @DisplayName("Should create empty WorkspaceListResponse")
        fun `should create empty workspace list response`() {
            // When
            val emptyResponse = mapper.emptyListResponse()
            
            // Then
            assertThat(emptyResponse).isNotNull
            assertThat(emptyResponse.workspaces).isEmpty()
            assertThat(emptyResponse.totalCount).isEqualTo(0L)
            assertThat(emptyResponse.hasMore).isFalse
        }
        
        @Test
        @DisplayName("Should handle large workspace lists")
        fun `should handle large workspace lists`() {
            // Given
            val largeList = (1..1000).map { index ->
                createTestWorkspace(name = "Workspace $index")
            }
            
            // When
            val listResponse = mapper.toListResponse(largeList)
            
            // Then
            assertThat(listResponse.workspaces).hasSize(1000)
            assertThat(listResponse.totalCount).isEqualTo(1000L)
            assertThat(listResponse.workspaces[0].name).isEqualTo("Workspace 1")
            assertThat(listResponse.workspaces[999].name).isEqualTo("Workspace 1000")
        }
    }
    
    @Nested
    @DisplayName("Performance and Consistency")
    inner class PerformanceAndConsistency {
        
        @Test
        @DisplayName("Should maintain distinct IDs in list conversion")
        fun `should maintain distinct ids in list conversion`() {
            // Given
            val workspaces = (1..100).map {
                createTestWorkspace()
            }
            
            // When
            val responses = mapper.toResponseList(workspaces)
            
            // Then
            val uniqueIds = responses.map { it.id }.toSet()
            assertThat(uniqueIds).hasSize(100)
        }
        
        @Test
        @DisplayName("Should handle workspaces with same name")
        fun `should handle workspaces with same name`() {
            // Given
            val sameName = "Duplicate Name"
            val workspaces = (1..3).map {
                createTestWorkspace(name = sameName)
            }
            
            // When
            val responses = mapper.toResponseList(workspaces)
            
            // Then
            assertThat(responses).hasSize(3)
            assertThat(responses).allMatch { it.name == sameName }
            // But IDs should be different
            val ids = responses.map { it.id }.toSet()
            assertThat(ids).hasSize(3)
        }
        
        @Test
        @DisplayName("Should handle mixed tenant workspaces")
        fun `should handle mixed tenant workspaces`() {
            // Given
            val tenant1 = UUID.randomUUID()
            val tenant2 = UUID.randomUUID()
            
            val workspaces = listOf(
                createTestWorkspace(name = "Tenant1 WS1", tenantId = tenant1),
                createTestWorkspace(name = "Tenant1 WS2", tenantId = tenant1),
                createTestWorkspace(name = "Tenant2 WS1", tenantId = tenant2),
                createTestWorkspace(name = "No Tenant WS", tenantId = null)
            )
            
            // When
            val responses = mapper.toResponseList(workspaces)
            
            // Then
            assertThat(responses).hasSize(4)
            assertThat(responses[0].tenantId).isEqualTo(tenant1)
            assertThat(responses[1].tenantId).isEqualTo(tenant1)
            assertThat(responses[2].tenantId).isEqualTo(tenant2)
            assertThat(responses[3].tenantId).isNull()
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
}