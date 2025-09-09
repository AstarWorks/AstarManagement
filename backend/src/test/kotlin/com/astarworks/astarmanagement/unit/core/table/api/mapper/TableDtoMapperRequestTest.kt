package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyDefinitionDto
import com.astarworks.astarmanagement.core.table.api.dto.table.TableCreateRequest
import com.astarworks.astarmanagement.core.table.api.dto.table.TableUpdateRequest
import com.astarworks.astarmanagement.core.table.api.dto.table.TableDuplicateRequest
import com.astarworks.astarmanagement.core.table.api.mapper.TableDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.util.*

/**
 * Unit tests for TableDtoMapper request processing functionality.
 * Tests conversion of various request DTOs to domain operations.
 */
@UnitTest
@DisplayName("TableDtoMapper Request Tests")
class TableDtoMapperRequestTest {
    
    private lateinit var mapper: TableDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = TableDtoMapper()
    }
    
    @Nested
    @DisplayName("Create Request Processing")
    inner class CreateRequestProcessing {
        
        @Test
        @DisplayName("Should process create request with basic fields")
        fun `should process create request with basic fields`() {
            // Given
            val workspaceId = UUID.randomUUID()
            val request = TableCreateRequest(
                workspaceId = workspaceId,
                name = "New Table",
                description = "Test table description"
            )
            
            // When
            val (extractedWorkspaceId, extractedName, extractedProperties) = mapper.extractCreateParams(request)
            
            // Then
            assertThat(extractedWorkspaceId).isEqualTo(workspaceId)
            assertThat(extractedName).isEqualTo("New Table")
            assertThat(extractedProperties).isEmpty()
        }
        
        @Test
        @DisplayName("Should process create request with properties")
        fun `should process create request with properties`() {
            // Given
            val properties = listOf(
                PropertyDefinitionDto.text(
                    key = "title",
                    displayName = "Title",
                    maxLength = 255,
                    required = true
                ),
                PropertyDefinitionDto.number(
                    key = "amount",
                    displayName = "Amount",
                    min = 0,
                    required = false
                )
            )
            
            val request = TableCreateRequest(
                workspaceId = UUID.randomUUID(),
                name = "Table with Properties",
                properties = properties
            )
            
            // When
            val (_, _, extractedProperties) = mapper.extractCreateParams(request)
            
            // Then
            assertThat(extractedProperties).hasSize(2)
            assertThat(extractedProperties["title"]).isNotNull
            assertThat(extractedProperties["title"]?.type).isEqualTo(PropertyType.TEXT)
            assertThat(extractedProperties["title"]?.displayName).isEqualTo("Title")
            assertThat(extractedProperties["amount"]).isNotNull
            assertThat(extractedProperties["amount"]?.type).isEqualTo(PropertyType.NUMBER)
        }
        
        @Test
        @DisplayName("Should handle template name in create request")
        fun `should handle template name in create request`() {
            // Given
            val request = TableCreateRequest(
                workspaceId = UUID.randomUUID(),
                name = "Template-based Table",
                templateName = "project_management"
            )
            
            // When
            val (_, extractedName, _) = mapper.extractCreateParams(request)
            
            // Then
            assertThat(extractedName).isEqualTo("Template-based Table")
            // Template processing would be handled by service layer
        }
        
        @Test
        @DisplayName("Should validate unique property keys")
        fun `should validate unique property keys`() {
            // Given
            val properties = listOf(
                PropertyDefinitionDto.text("field1", "Field 1"),
                PropertyDefinitionDto.text("field2", "Field 2"),
                PropertyDefinitionDto.text("field1", "Duplicate Field") // Duplicate key
            )
            
            val request = TableCreateRequest(
                workspaceId = UUID.randomUUID(),
                name = "Table with Duplicates",
                properties = properties
            )
            
            // When
            val hasUniqueKeys = request.hasUniquePropertyKeys()
            
            // Then
            assertThat(hasUniqueKeys).isFalse()
        }
        
        @Test
        @DisplayName("Should handle icon and color in create request")
        fun `should handle icon and color in create request`() {
            // Given
            val request = TableCreateRequest(
                workspaceId = UUID.randomUUID(),
                name = "Styled Table",
                icon = "📊",
                color = "#0066CC"
            )
            
            // When
            val (_, extractedName, _) = mapper.extractCreateParams(request)
            
            // Then
            assertThat(extractedName).isEqualTo("Styled Table")
            // Icon and color would be stored in metadata by service layer
        }
    }
    
    @Nested
    @DisplayName("Update Request Processing")
    inner class UpdateRequestProcessing {
        
        @Test
        @DisplayName("Should apply name update to table")
        fun `should apply name update to table`() {
            // Given
            val existingTable = createTestTable(name = "Old Name")
            val request = TableUpdateRequest(
                name = "New Name"
            )
            
            // When
            val updatedTable = mapper.updateFromRequest(existingTable, request)
            
            // Then
            assertThat(updatedTable.name).isEqualTo("New Name")
            assertThat(updatedTable.updatedAt).isAfter(existingTable.updatedAt)
        }
        
        @Test
        @DisplayName("Should apply property order update")
        fun `should apply property order update`() {
            // Given
            val existingTable = createTestTable(
                propertyOrder = listOf("field1", "field2", "field3")
            )
            val request = TableUpdateRequest(
                propertyOrder = listOf("field3", "field1", "field2")
            )
            
            // When
            val updatedTable = mapper.updateFromRequest(existingTable, request)
            
            // Then
            assertThat(updatedTable.propertyOrder).containsExactly("field3", "field1", "field2")
        }
        
        @Test
        @DisplayName("Should handle partial updates")
        fun `should handle partial updates`() {
            // Given
            val existingTable = createTestTable(
                name = "Original Name",
                propertyOrder = listOf("a", "b", "c")
            )
            val request = TableUpdateRequest(
                description = "New description only"
                // name and propertyOrder not provided
            )
            
            // When
            val updatedTable = mapper.updateFromRequest(existingTable, request)
            
            // Then
            assertThat(updatedTable.name).isEqualTo("Original Name") // Unchanged
            assertThat(updatedTable.propertyOrder).containsExactly("a", "b", "c") // Unchanged
        }
        
        @Test
        @DisplayName("Should detect if request has updates")
        fun `should detect if request has updates`() {
            // Given
            val requestWithUpdates = TableUpdateRequest(name = "New Name")
            val emptyRequest = TableUpdateRequest()
            
            // When & Then
            assertThat(requestWithUpdates.hasUpdates()).isTrue()
            assertThat(emptyRequest.hasUpdates()).isFalse()
        }
        
        @Test
        @DisplayName("Should handle settings update")
        fun `should handle settings update`() {
            // Given
            val existingTable = createTestTable()
            val settings = buildJsonObject {
                put("defaultView", "kanban")
                put("sortBy", "createdAt")
            }
            val request = TableUpdateRequest(settings = settings)
            
            // When
            val updatedTable = mapper.updateFromRequest(existingTable, request)
            
            // Then
            assertThat(updatedTable).isNotNull
            // Settings would be stored in metadata by service layer
        }
    }
    
    @Nested
    @DisplayName("Duplicate Request Processing")
    inner class DuplicateRequestProcessing {
        
        @Test
        @DisplayName("Should create duplicate request")
        fun `should create duplicate request`() {
            // Given
            val name = "Duplicated Table"
            val includeRecords = false
            
            // When
            val request = mapper.createDuplicateRequest(
                name = name,
                includeRecords = includeRecords
            )
            
            // Then
            assertThat(request.name).isEqualTo("Duplicated Table")
            assertThat(request.includeRecords).isFalse()
            assertThat(request.targetWorkspaceId).isNull()
        }
        
        @Test
        @DisplayName("Should create duplicate request with target workspace")
        fun `should create duplicate request with target workspace`() {
            // Given
            val name = "Cross-Workspace Copy"
            val targetWorkspaceId = UUID.randomUUID()
            
            // When
            val request = mapper.createDuplicateRequest(
                name = name,
                includeRecords = true,
                targetWorkspaceId = targetWorkspaceId
            )
            
            // Then
            assertThat(request.name).isEqualTo("Cross-Workspace Copy")
            assertThat(request.includeRecords).isTrue()
            assertThat(request.targetWorkspaceId).isEqualTo(targetWorkspaceId)
        }
        
        @Test
        @DisplayName("Should validate create request")
        fun `should validate create request`() {
            // Given
            val validRequest = TableCreateRequest(
                workspaceId = UUID.randomUUID(),
                name = "Valid Table",
                properties = listOf(
                    PropertyDefinitionDto.text("field1", "Field 1")
                )
            )
            
            val invalidRequest = TableCreateRequest(
                workspaceId = UUID.randomUUID(),
                name = "Invalid Table",
                properties = listOf(
                    PropertyDefinitionDto.text("field1", "Field 1"),
                    PropertyDefinitionDto.text("field1", "Duplicate Field")
                )
            )
            
            // When
            val validErrors = mapper.validateCreateRequest(validRequest)
            val invalidErrors = mapper.validateCreateRequest(invalidRequest)
            
            // Then
            assertThat(validErrors).isEmpty()
            assertThat(invalidErrors).isNotEmpty()
            assertThat(invalidErrors[0]).contains("unique")
        }
    }
    
    // Helper methods
    
    private fun createTestTable(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID = UUID.randomUUID(),
        name: String = "Test Table",
        propertyOrder: List<String> = emptyList()
    ): Table {
        val properties = if (propertyOrder.isNotEmpty()) {
            propertyOrder.associateWith { key ->
                com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition(
                    type = PropertyType.TEXT,
                    displayName = key.replaceFirstChar { it.uppercase() }
                )
            }
        } else {
            emptyMap()
        }
        
        return Table(
            id = TableId(id),
            workspaceId = WorkspaceId(workspaceId),
            name = name,
            properties = properties,
            propertyOrder = propertyOrder
        )
    }
}