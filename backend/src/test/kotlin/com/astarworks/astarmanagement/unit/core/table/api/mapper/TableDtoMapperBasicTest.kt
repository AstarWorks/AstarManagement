package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.mapper.TableDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
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
 * Unit tests for TableDtoMapper basic conversion functionality.
 * Tests fundamental transformations between Table domain model and DTOs.
 */
@UnitTest
@DisplayName("TableDtoMapper Basic Tests")
class TableDtoMapperBasicTest {
    
    private lateinit var mapper: TableDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = TableDtoMapper()
    }
    
    @Nested
    @DisplayName("Table to TableResponse Conversion")
    inner class TableToResponseConversion {
        
        @Test
        @DisplayName("Should convert Table to TableResponse with all fields")
        fun `should convert table to response with all fields`() {
            // Given
            val tableId = UUID.randomUUID()
            val workspaceId = UUID.randomUUID()
            val properties = mapOf(
                "field1" to PropertyDefinition(
                    type = PropertyType.TEXT,
                    displayName = "Field 1",
                    config = buildJsonObject { put("maxLength", 500) }
                ),
                "field2" to PropertyDefinition(
                    type = PropertyType.NUMBER,
                    displayName = "Field 2",
                    config = buildJsonObject { put("min", 0) }
                )
            )
            val propertyOrder = listOf("field1", "field2")
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val table = Table(
                id = TableId(tableId),
                workspaceId = WorkspaceId(workspaceId),
                name = "Test Table",
                properties = properties,
                propertyOrder = propertyOrder,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val response = mapper.toResponse(table)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.id).isEqualTo(tableId)
            assertThat(response.workspaceId).isEqualTo(workspaceId)
            assertThat(response.name).isEqualTo("Test Table")
            assertThat(response.properties).hasSize(2)
            assertThat(response.propertyOrder).isEqualTo(propertyOrder)
            assertThat(response.description).isNull()
            assertThat(response.recordCount).isNull()
            assertThat(response.icon).isNull()
            assertThat(response.color).isNull()
            assertThat(response.settings).isNull()
            assertThat(response.createdAt).isEqualTo(createdAt)
            assertThat(response.updatedAt).isEqualTo(updatedAt)
        }
        
        @Test
        @DisplayName("Should include record count when provided")
        fun `should include record count when provided`() {
            // Given
            val table = createTestTable()
            val recordCount = 100L
            
            // When
            val response = mapper.toResponse(table, recordCount)
            
            // Then
            assertThat(response.recordCount).isEqualTo(100L)
        }
        
        @Test
        @DisplayName("Should handle empty properties")
        fun `should handle empty properties`() {
            // Given
            val table = Table(
                workspaceId = WorkspaceId(UUID.randomUUID()),
                name = "Empty Table",
                properties = emptyMap(),
                propertyOrder = emptyList()
            )
            
            // When
            val response = mapper.toResponse(table)
            
            // Then
            assertThat(response.properties).isEmpty()
            assertThat(response.propertyOrder).isEmpty()
        }
        
        @Test
        @DisplayName("Should preserve property order")
        fun `should preserve property order`() {
            // Given
            val properties = mapOf(
                "c" to createTestPropertyDefinition("Column C"),
                "a" to createTestPropertyDefinition("Column A"),
                "b" to createTestPropertyDefinition("Column B")
            )
            val propertyOrder = listOf("a", "b", "c")
            val table = createTestTable(
                properties = properties,
                propertyOrder = propertyOrder
            )
            
            // When
            val response = mapper.toResponse(table)
            
            // Then
            assertThat(response.propertyOrder).containsExactly("a", "b", "c")
        }
        
        @Test
        @DisplayName("Should preserve exact timestamp precision")
        fun `should preserve exact timestamp precision`() {
            // Given
            val preciseTimestamp = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val table = createTestTable(
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            
            // When
            val response = mapper.toResponse(table)
            
            // Then
            assertThat(response.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.updatedAt).isEqualTo(preciseTimestamp)
        }
        
        @Test
        @DisplayName("Should handle maximum name length")
        fun `should handle maximum name length`() {
            // Given
            val maxLengthName = "T".repeat(255)
            val table = createTestTable(name = maxLengthName)
            
            // When
            val response = mapper.toResponse(table)
            
            // Then
            assertThat(response.name).isEqualTo(maxLengthName)
            assertThat(response.name.length).isEqualTo(255)
        }
    }
    
    @Nested
    @DisplayName("Table to TableSummaryResponse Conversion")
    inner class TableToSummaryResponseConversion {
        
        @Test
        @DisplayName("Should convert Table to TableSummaryResponse")
        fun `should convert table to summary response`() {
            // Given
            val tableId = UUID.randomUUID()
            val workspaceId = UUID.randomUUID()
            val properties = mapOf(
                "prop1" to createTestPropertyDefinition("Property 1"),
                "prop2" to createTestPropertyDefinition("Property 2"),
                "prop3" to createTestPropertyDefinition("Property 3")
            )
            val table = Table(
                id = TableId(tableId),
                workspaceId = WorkspaceId(workspaceId),
                name = "Summary Table",
                properties = properties
            )
            
            // When
            val summary = mapper.toSummaryResponse(table)
            
            // Then
            assertThat(summary).isNotNull
            assertThat(summary.id).isEqualTo(tableId)
            assertThat(summary.workspaceId).isEqualTo(workspaceId)
            assertThat(summary.name).isEqualTo("Summary Table")
            assertThat(summary.propertyCount).isEqualTo(3)
            assertThat(summary.recordCount).isNull()
            assertThat(summary.description).isNull()
            assertThat(summary.updatedAt).isEqualTo(table.updatedAt)
        }
        
        @Test
        @DisplayName("Should include record count in summary when provided")
        fun `should include record count in summary when provided`() {
            // Given
            val table = createTestTable()
            val recordCount = 50L
            
            // When
            val summary = mapper.toSummaryResponse(table, recordCount)
            
            // Then
            assertThat(summary.recordCount).isEqualTo(50L)
        }
        
        @Test
        @DisplayName("Should handle zero properties in summary")
        fun `should handle zero properties in summary`() {
            // Given
            val table = createTestTable(properties = emptyMap())
            
            // When
            val summary = mapper.toSummaryResponse(table)
            
            // Then
            assertThat(summary.propertyCount).isEqualTo(0)
        }
    }
    
    @Nested
    @DisplayName("Table to TableSchemaResponse Conversion")
    inner class TableToSchemaResponseConversion {
        
        @Test
        @DisplayName("Should convert Table to TableSchemaResponse for export")
        fun `should convert table to schema response for export`() {
            // Given
            val tableId = UUID.randomUUID()
            val properties = mapOf(
                "field1" to createTestPropertyDefinition("Field 1"),
                "field2" to createTestPropertyDefinition("Field 2")
            )
            val propertyOrder = listOf("field1", "field2")
            val table = Table(
                id = TableId(tableId),
                workspaceId = WorkspaceId(UUID.randomUUID()),
                name = "Export Table",
                properties = properties,
                propertyOrder = propertyOrder
            )
            
            // When
            val schema = mapper.toSchemaResponse(table)
            
            // Then
            assertThat(schema).isNotNull
            assertThat(schema.id).isEqualTo(tableId)
            assertThat(schema.name).isEqualTo("Export Table")
            assertThat(schema.properties).hasSize(2)
            assertThat(schema.propertyOrder).isEqualTo(propertyOrder)
            assertThat(schema.version).isEqualTo("1.0")
            assertThat(schema.exportedAt).isNotNull
            assertThat(schema.description).isNull()
        }
        
        @Test
        @DisplayName("Should set export timestamp in schema response")
        fun `should set export timestamp in schema response`() {
            // Given
            val table = createTestTable()
            val beforeExport = Instant.now()
            
            // When
            val schema = mapper.toSchemaResponse(table)
            val afterExport = Instant.now()
            
            // Then
            assertThat(schema.exportedAt).isAfterOrEqualTo(beforeExport)
            assertThat(schema.exportedAt).isBeforeOrEqualTo(afterExport)
        }
    }
    
    // Helper methods
    
    private fun createTestTable(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID = UUID.randomUUID(),
        name: String = "Test Table",
        properties: Map<String, PropertyDefinition> = mapOf(
            "defaultProp" to createTestPropertyDefinition("Default Property")
        ),
        propertyOrder: List<String> = properties.keys.toList(),
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): Table {
        return Table(
            id = TableId(id),
            workspaceId = WorkspaceId(workspaceId),
            name = name,
            properties = properties,
            propertyOrder = propertyOrder,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    private fun createTestPropertyDefinition(
        displayName: String,
        type: PropertyType = PropertyType.TEXT,
        required: Boolean = false
    ): PropertyDefinition {
        val config = buildJsonObject {
            if (required) {
                put("required", true)
            }
        }
        return PropertyDefinition(
            type = type,
            displayName = displayName,
            config = config
        )
    }
}