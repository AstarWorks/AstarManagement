package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.table.TableListResponse
import com.astarworks.astarmanagement.core.table.api.mapper.TableDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
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
import java.time.Instant
import java.util.*

/**
 * Unit tests for TableDtoMapper list and pagination functionality.
 * Tests bulk operations, list transformations, and summary generation.
 */
@UnitTest
@DisplayName("TableDtoMapper List Tests")
class TableDtoMapperListTest {
    
    private lateinit var mapper: TableDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = TableDtoMapper()
    }
    
    @Nested
    @DisplayName("List Response Creation")
    inner class ListResponseCreation {
        
        @Test
        @DisplayName("Should create list response from tables")
        fun `should create list response from tables`() {
            // Given
            val tables = listOf(
                createTestTable(name = "Table 1"),
                createTestTable(name = "Table 2"),
                createTestTable(name = "Table 3")
            )
            
            // When
            val listResponse = mapper.toListResponse(tables)
            
            // Then
            assertThat(listResponse).isNotNull
            assertThat(listResponse.tables).hasSize(3)
            assertThat(listResponse.totalCount).isEqualTo(3)
            assertThat(listResponse.tables[0].name).isEqualTo("Table 1")
            assertThat(listResponse.tables[1].name).isEqualTo("Table 2")
            assertThat(listResponse.tables[2].name).isEqualTo("Table 3")
        }
        
        @Test
        @DisplayName("Should handle empty list")
        fun `should handle empty list`() {
            // Given
            val emptyList = emptyList<Table>()
            
            // When
            val listResponse = mapper.toListResponse(emptyList)
            
            // Then
            assertThat(listResponse.tables).isEmpty()
            assertThat(listResponse.totalCount).isEqualTo(0)
            assertThat(listResponse).isEqualTo(TableListResponse.empty())
        }
        
        @Test
        @DisplayName("Should include record counts when provided")
        fun `should include record counts when provided`() {
            // Given
            val tables = listOf(
                createTestTable(name = "Table A"),
                createTestTable(name = "Table B"),
                createTestTable(name = "Table C")
            )
            val recordCounts = mapOf(
                tables[0].id.value to 100L,
                tables[1].id.value to 250L,
                tables[2].id.value to 0L
            )
            
            // When
            val listResponse = mapper.toListResponse(tables, recordCounts)
            
            // Then
            assertThat(listResponse.tables[0].recordCount).isEqualTo(100L)
            assertThat(listResponse.tables[1].recordCount).isEqualTo(250L)
            assertThat(listResponse.tables[2].recordCount).isEqualTo(0L)
        }
        
        @Test
        @DisplayName("Should handle partial record counts")
        fun `should handle partial record counts`() {
            // Given
            val tables = listOf(
                createTestTable(name = "Table 1"),
                createTestTable(name = "Table 2"),
                createTestTable(name = "Table 3")
            )
            val partialCounts = mapOf(
                tables[0].id.value to 50L
                // Table 2 and 3 have no count data
            )
            
            // When
            val listResponse = mapper.toListResponse(tables, partialCounts)
            
            // Then
            assertThat(listResponse.tables[0].recordCount).isEqualTo(50L)
            assertThat(listResponse.tables[1].recordCount).isNull()
            assertThat(listResponse.tables[2].recordCount).isNull()
        }
    }
    
    @Nested
    @DisplayName("Summary List Creation")
    inner class SummaryListCreation {
        
        @Test
        @DisplayName("Should create summary list from tables")
        fun `should create summary list from tables`() {
            // Given
            val tables = listOf(
                createTestTable(
                    name = "Complex Table",
                    properties = mapOf(
                        "field1" to createTestPropertyDefinition("Field 1"),
                        "field2" to createTestPropertyDefinition("Field 2"),
                        "field3" to createTestPropertyDefinition("Field 3")
                    )
                ),
                createTestTable(
                    name = "Simple Table",
                    properties = mapOf(
                        "onlyField" to createTestPropertyDefinition("Only Field")
                    )
                )
            )
            
            // When
            val summaries = mapper.toSummaryResponseList(tables)
            
            // Then
            assertThat(summaries).hasSize(2)
            assertThat(summaries[0].name).isEqualTo("Complex Table")
            assertThat(summaries[0].propertyCount).isEqualTo(3)
            assertThat(summaries[1].name).isEqualTo("Simple Table")
            assertThat(summaries[1].propertyCount).isEqualTo(1)
        }
        
        @Test
        @DisplayName("Should include metadata in summaries")
        fun `should include metadata in summaries`() {
            // Given
            val specificTime = Instant.parse("2024-01-15T10:00:00Z")
            val table = createTestTable(
                name = "Metadata Table",
                updatedAt = specificTime
            )
            
            // When
            val summaries = mapper.toSummaryResponseList(listOf(table))
            
            // Then
            assertThat(summaries[0].updatedAt).isEqualTo(specificTime)
        }
    }
    
    @Nested
    @DisplayName("Bulk Operations")
    inner class BulkOperations {
        
        @Test
        @DisplayName("Should process bulk table conversion")
        fun `should process bulk table conversion`() {
            // Given
            val tables = (1..100).map { i ->
                createTestTable(
                    name = "Table $i",
                    properties = mapOf(
                        "prop$i" to createTestPropertyDefinition("Property $i")
                    )
                )
            }
            
            // When
            val listResponse = mapper.toListResponse(tables)
            
            // Then
            assertThat(listResponse.tables).hasSize(100)
            assertThat(listResponse.totalCount).isEqualTo(100)
            assertThat(listResponse.tables[49].name).isEqualTo("Table 50")
        }
        
        @Test
        @DisplayName("Should maintain order in list conversion")
        fun `should maintain order in list conversion`() {
            // Given
            val tables = listOf(
                createTestTable(name = "Z Table", createdAt = Instant.now()),
                createTestTable(name = "A Table", createdAt = Instant.now().minusSeconds(3600)),
                createTestTable(name = "M Table", createdAt = Instant.now().minusSeconds(1800))
            )
            
            // When
            val listResponse = mapper.toListResponse(tables)
            
            // Then
            // Order should be preserved as provided
            assertThat(listResponse.tables[0].name).isEqualTo("Z Table")
            assertThat(listResponse.tables[1].name).isEqualTo("A Table")
            assertThat(listResponse.tables[2].name).isEqualTo("M Table")
        }
    }
    
    @Nested
    @DisplayName("Performance Considerations")
    inner class PerformanceConsiderations {
        
        @Test
        @DisplayName("Should handle large property sets efficiently")
        fun `should handle large property sets efficiently`() {
            // Given
            val largePropertySet = (1..50).associate { i ->
                "field$i" to createTestPropertyDefinition("Field $i")
            }
            
            val tables = listOf(
                createTestTable(
                    name = "Large Table",
                    properties = largePropertySet,
                    propertyOrder = largePropertySet.keys.toList()
                )
            )
            
            // When
            val startTime = System.currentTimeMillis()
            val listResponse = mapper.toListResponse(tables)
            val endTime = System.currentTimeMillis()
            
            // Then
            assertThat(listResponse.tables[0].properties).hasSize(50)
            assertThat(listResponse.tables[0].propertyOrder).hasSize(50)
            assertThat(endTime - startTime).isLessThan(1000) // Should complete within 1 second
        }
        
        @Test
        @DisplayName("Should optimize summary generation")
        fun `should optimize summary generation`() {
            // Given
            val tables = (1..1000).map { i ->
                createTestTable(
                    name = "Table $i",
                    properties = mapOf(
                        "field1" to createTestPropertyDefinition("Field 1"),
                        "field2" to createTestPropertyDefinition("Field 2")
                    )
                )
            }
            
            // When
            val startTime = System.currentTimeMillis()
            val summaries = mapper.toSummaryResponseList(tables)
            val endTime = System.currentTimeMillis()
            
            // Then
            assertThat(summaries).hasSize(1000)
            assertThat(summaries.all { it.propertyCount == 2 }).isTrue()
            assertThat(endTime - startTime).isLessThan(1000) // Should complete within 1 second
        }
    }
    
    // Helper methods
    
    private fun createTestTable(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID = UUID.randomUUID(),
        name: String = "Test Table",
        properties: Map<String, PropertyDefinition> = emptyMap(),
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
        typeId: String = "text"
    ): PropertyDefinition {
        return PropertyDefinition(
            typeId = typeId,
            displayName = displayName,
            config = buildJsonObject { 
                put("maxLength", 500)
            }
        )
    }
}