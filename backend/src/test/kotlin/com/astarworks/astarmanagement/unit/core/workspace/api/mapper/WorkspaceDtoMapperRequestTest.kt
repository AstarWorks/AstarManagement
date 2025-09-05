package com.astarworks.astarmanagement.unit.core.workspace.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.workspace.api.dto.WorkspaceCreateRequest
import com.astarworks.astarmanagement.core.workspace.api.dto.WorkspaceUpdateRequest
import com.astarworks.astarmanagement.core.workspace.api.mapper.WorkspaceDtoMapper
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for WorkspaceDtoMapper request processing functionality.
 * Tests create and update request transformations.
 */
@UnitTest
@DisplayName("WorkspaceDtoMapper Request Tests")
class WorkspaceDtoMapperRequestTest {
    
    private lateinit var mapper: WorkspaceDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = WorkspaceDtoMapper()
    }
    
    @Nested
    @DisplayName("Create Request Processing")
    inner class CreateRequestProcessing {
        
        @Test
        @DisplayName("Should extract name from WorkspaceCreateRequest")
        fun `should extract name from workspace create request`() {
            // Given
            val request = WorkspaceCreateRequest(
                name = "New Workspace",
                description = "A new workspace",
                settings = null
            )
            
            // When
            val extractedName = mapper.extractName(request)
            
            // Then
            assertThat(extractedName).isEqualTo("New Workspace")
        }
        
        @Test
        @DisplayName("Should create Workspace from create request")
        fun `should create workspace from create request`() {
            // Given
            val request = WorkspaceCreateRequest(
                name = "Project Workspace"
            )
            val tenantId = UUID.randomUUID()
            val userId = UUID.randomUUID()
            
            // When
            val workspace = mapper.fromCreateRequest(
                request = request,
                tenantId = tenantId,
                createdBy = userId
            )
            
            // Then
            assertThat(workspace).isNotNull
            assertThat(workspace.name).isEqualTo("Project Workspace")
            assertThat(workspace.tenantId?.value).isEqualTo(tenantId)
            assertThat(workspace.createdBy?.value).isEqualTo(userId)
            assertThat(workspace.id).isNotNull
            assertThat(workspace.createdAt).isNotNull
            assertThat(workspace.updatedAt).isNotNull
        }
        
        @Test
        @DisplayName("Should create Workspace without createdBy")
        fun `should create workspace without created by`() {
            // Given
            val request = WorkspaceCreateRequest(name = "Anonymous Workspace")
            val tenantId = UUID.randomUUID()
            
            // When
            val workspace = mapper.fromCreateRequest(
                request = request,
                tenantId = tenantId,
                createdBy = null
            )
            
            // Then
            assertThat(workspace.createdBy).isNull()
            assertThat(workspace.tenantId?.value).isEqualTo(tenantId)
        }
        
        @Test
        @DisplayName("Should handle create request with description")
        fun `should handle create request with description`() {
            // Given
            val request = WorkspaceCreateRequest(
                name = "Documented Workspace",
                description = "This workspace has a description"
            )
            
            // When
            val extractedName = mapper.extractName(request)
            
            // Then
            assertThat(extractedName).isEqualTo("Documented Workspace")
            // Note: Description is not yet stored in domain model
        }
        
        @Test
        @DisplayName("Should handle create request with settings")
        fun `should handle create request with settings`() {
            // Given
            val settings = buildJsonObject {
                put("theme", "dark")
                put("autoSave", true)
            }
            val request = WorkspaceCreateRequest(
                name = "Configured Workspace",
                settings = settings
            )
            
            // When
            val workspace = mapper.fromCreateRequest(
                request = request,
                tenantId = UUID.randomUUID()
            )
            
            // Then
            assertThat(workspace.name).isEqualTo("Configured Workspace")
            // Note: Settings are not yet stored in domain model
        }
        
        @Test
        @DisplayName("Should validate workspace name in create request")
        fun `should validate workspace name in create request`() {
            // Given
            val validRequest = WorkspaceCreateRequest(name = "Valid Name")
            val emptyNameRequest = WorkspaceCreateRequest(name = "")
            val longNameRequest = WorkspaceCreateRequest(name = "W".repeat(256))
            
            // When & Then
            assertThat(validRequest.isValidName()).isTrue
            assertThat(emptyNameRequest.isValidName()).isFalse
            assertThat(longNameRequest.isValidName()).isFalse
        }
        
        @Test
        @DisplayName("Should handle maximum name length in create request")
        fun `should handle maximum name length in create request`() {
            // Given
            val maxLengthName = "W".repeat(255)
            val request = WorkspaceCreateRequest(name = maxLengthName)
            
            // When
            val workspace = mapper.fromCreateRequest(
                request = request,
                tenantId = UUID.randomUUID()
            )
            
            // Then
            assertThat(workspace.name).isEqualTo(maxLengthName)
            assertThat(workspace.name.length).isEqualTo(255)
        }
    }
    
    @Nested
    @DisplayName("Update Request Processing")
    inner class UpdateRequestProcessing {
        
        @Test
        @DisplayName("Should extract name from WorkspaceUpdateRequest")
        fun `should extract name from workspace update request`() {
            // Given
            val request = WorkspaceUpdateRequest(
                name = "Updated Name",
                description = "Updated description"
            )
            
            // When
            val extractedName = mapper.extractName(request)
            
            // Then
            assertThat(extractedName).isEqualTo("Updated Name")
        }
        
        @Test
        @DisplayName("Should handle null name in update request")
        fun `should handle null name in update request`() {
            // Given
            val request = WorkspaceUpdateRequest(
                name = null,
                description = "Only updating description"
            )
            
            // When
            val extractedName = mapper.extractName(request)
            
            // Then
            assertThat(extractedName).isNull()
        }
        
        @Test
        @DisplayName("Should update workspace from request")
        fun `should update workspace from request`() {
            // Given
            val originalTimestamp = Instant.now().minusSeconds(3600)
            val workspace = Workspace(
                name = "Original Name",
                createdAt = originalTimestamp,
                updatedAt = originalTimestamp
            )
            
            val request = WorkspaceUpdateRequest(name = "New Name")
            
            // When
            val updated = mapper.updateFromRequest(workspace, request)
            
            // Then
            assertThat(updated.name).isEqualTo("New Name")
            assertThat(updated.createdAt).isEqualTo(originalTimestamp)
            assertThat(updated.updatedAt).isAfter(originalTimestamp)
        }
        
        @Test
        @DisplayName("Should preserve original name when not updating")
        fun `should preserve original name when not updating`() {
            // Given
            val workspace = createTestWorkspace(name = "Original Name")
            val request = WorkspaceUpdateRequest(
                name = null,
                description = "Just updating description"
            )
            
            // When
            val updated = mapper.updateFromRequest(workspace, request)
            
            // Then
            assertThat(updated.name).isEqualTo("Original Name")
            assertThat(updated.updatedAt).isAfter(workspace.updatedAt)
        }
        
        @Test
        @DisplayName("Should detect updates in update request")
        fun `should detect updates in update request`() {
            // Given
            val requestWithName = WorkspaceUpdateRequest(name = "New Name")
            val requestWithDescription = WorkspaceUpdateRequest(description = "New Description")
            val requestWithSettings = WorkspaceUpdateRequest(settings = buildJsonObject {})
            val emptyRequest = WorkspaceUpdateRequest()
            
            // When & Then
            assertThat(requestWithName.hasUpdates()).isTrue
            assertThat(requestWithDescription.hasUpdates()).isTrue
            assertThat(requestWithSettings.hasUpdates()).isTrue
            assertThat(emptyRequest.hasUpdates()).isFalse
        }
        
        @Test
        @DisplayName("Should update timestamp when applying update")
        fun `should update timestamp when applying update`() {
            // Given
            val originalTime = Instant.now().minusSeconds(7200)
            val workspace = Workspace(
                name = "Test Workspace",
                createdAt = originalTime,
                updatedAt = originalTime
            )
            val request = WorkspaceUpdateRequest(name = "Updated Workspace")
            
            // When
            Thread.sleep(10) // Ensure time difference
            val updated = mapper.updateFromRequest(workspace, request)
            
            // Then
            assertThat(updated.createdAt).isEqualTo(originalTime)
            assertThat(updated.updatedAt).isAfter(originalTime)
        }
    }
    
    @Nested
    @DisplayName("Complex Request Scenarios")
    inner class ComplexRequestScenarios {
        
        @Test
        @DisplayName("Should handle special characters in workspace names")
        fun `should handle special characters in workspace names`() {
            // Given
            val specialNames = listOf(
                "プロジェクト管理",
                "Workspace & Team",
                "Test-Workspace_2024",
                "Workspace #1",
                "O'Brien's Workspace"
            )
            
            specialNames.forEach { name ->
                val createRequest = WorkspaceCreateRequest(name = name)
                val updateRequest = WorkspaceUpdateRequest(name = name)
                
                // When
                val createdWorkspace = mapper.fromCreateRequest(
                    request = createRequest,
                    tenantId = UUID.randomUUID()
                )
                val extractedCreateName = mapper.extractName(createRequest)
                val extractedUpdateName = mapper.extractName(updateRequest)
                
                // Then
                assertThat(createdWorkspace.name).isEqualTo(name)
                assertThat(extractedCreateName).isEqualTo(name)
                assertThat(extractedUpdateName).isEqualTo(name)
            }
        }
        
        @Test
        @DisplayName("Should preserve all fields during update")
        fun `should preserve all fields during update`() {
            // Given
            val workspaceId = UUID.randomUUID()
            val tenantId = UUID.randomUUID()
            val userId = UUID.randomUUID()
            val originalTime = Instant.now().minusSeconds(3600)
            
            val workspace = Workspace(
                id = WorkspaceId(workspaceId),
                tenantId = TenantId(tenantId),
                name = "Original",
                createdBy = UserId(userId),
                createdAt = originalTime,
                updatedAt = originalTime
            )
            
            val request = WorkspaceUpdateRequest(name = "Updated")
            
            // When
            val updated = mapper.updateFromRequest(workspace, request)
            
            // Then
            assertThat(updated.id.value).isEqualTo(workspaceId)
            assertThat(updated.tenantId?.value).isEqualTo(tenantId)
            assertThat(updated.createdBy?.value).isEqualTo(userId)
            assertThat(updated.createdAt).isEqualTo(originalTime)
            assertThat(updated.name).isEqualTo("Updated")
        }
        
        @Test
        @DisplayName("Should handle sequential updates")
        fun `should handle sequential updates`() {
            // Given
            var workspace = createTestWorkspace(name = "Initial")
            val update1 = WorkspaceUpdateRequest(name = "First Update")
            val update2 = WorkspaceUpdateRequest(name = "Second Update")
            val update3 = WorkspaceUpdateRequest(name = "Final Update")
            
            // When
            workspace = mapper.updateFromRequest(workspace, update1)
            workspace = mapper.updateFromRequest(workspace, update2)
            workspace = mapper.updateFromRequest(workspace, update3)
            
            // Then
            assertThat(workspace.name).isEqualTo("Final Update")
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