package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.record.RecordFilterRequest
import com.astarworks.astarmanagement.core.table.api.dto.record.RecordSortRequest
import com.astarworks.astarmanagement.core.table.api.dto.record.SortDirection
import com.astarworks.astarmanagement.core.table.api.mapper.RecordDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import kotlinx.serialization.json.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.util.*

/**
 * Unit tests for RecordDtoMapper filtering and sorting functionality.
 * Tests filter application, sorting, field selection, and JSON conversion.
 */
@UnitTest
@DisplayName("RecordDtoMapper Filter Tests")
class RecordDtoMapperFilterTest {
    
    private lateinit var mapper: RecordDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = RecordDtoMapper()
    }
    
    @Nested
    @DisplayName("Filter Application")
    inner class FilterApplication {
        
        @Test
        @DisplayName("Should filter records by single field")
        fun `should filter records by single field`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { 
                    put("status", "active")
                    put("name", "Record 1")
                }),
                createTestRecord(data = buildJsonObject { 
                    put("status", "inactive")
                    put("name", "Record 2")
                }),
                createTestRecord(data = buildJsonObject { 
                    put("status", "active")
                    put("name", "Record 3")
                })
            )
            
            val filter = RecordFilterRequest(
                filters = buildJsonObject {
                    put("status", "active")
                }
            )
            
            // When
            val filtered = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(filtered).hasSize(2)
            assertThat(filtered[0].data["name"]?.toString()).contains("Record 1")
            assertThat(filtered[1].data["name"]?.toString()).contains("Record 3")
        }
        
        @Test
        @DisplayName("Should filter records by multiple fields")
        fun `should filter records by multiple fields`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { 
                    put("status", "active")
                    put("priority", "high")
                }),
                createTestRecord(data = buildJsonObject { 
                    put("status", "active")
                    put("priority", "low")
                }),
                createTestRecord(data = buildJsonObject { 
                    put("status", "inactive")
                    put("priority", "high")
                })
            )
            
            val filter = RecordFilterRequest(
                filters = buildJsonObject {
                    put("status", "active")
                    put("priority", "high")
                }
            )
            
            // When
            val filtered = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(filtered).hasSize(1)
            assertThat(filtered[0].data["status"]?.toString()).contains("active")
            assertThat(filtered[0].data["priority"]?.toString()).contains("high")
        }
        
        @Test
        @DisplayName("Should handle numeric filter values")
        fun `should handle numeric filter values`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("age", 25) }),
                createTestRecord(data = buildJsonObject { put("age", 30) }),
                createTestRecord(data = buildJsonObject { put("age", 25) })
            )
            
            val filter = RecordFilterRequest(
                filters = buildJsonObject {
                    put("age", 25)
                }
            )
            
            // When
            val filtered = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(filtered).hasSize(2)
        }
        
        @Test
        @DisplayName("Should handle boolean filter values")
        fun `should handle boolean filter values`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("active", true) }),
                createTestRecord(data = buildJsonObject { put("active", false) }),
                createTestRecord(data = buildJsonObject { put("active", true) })
            )
            
            val filter = RecordFilterRequest(
                filters = buildJsonObject {
                    put("active", true)
                }
            )
            
            // When
            val filtered = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(filtered).hasSize(2)
        }
        
        @Test
        @DisplayName("Should handle null filter values")
        fun `should handle null filter values`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("optional", JsonNull) }),
                createTestRecord(data = buildJsonObject { put("optional", "value") }),
                createTestRecord(data = buildJsonObject { put("optional", JsonNull) })
            )
            
            val filter = RecordFilterRequest(
                filters = buildJsonObject {
                    put("optional", JsonNull)
                }
            )
            
            // When
            val filtered = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(filtered).hasSize(2)
        }
    }
    
    @Nested
    @DisplayName("Sorting")
    inner class Sorting {
        
        @Test
        @DisplayName("Should sort records ascending")
        fun `should sort records ascending`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("name", "Charlie") }),
                createTestRecord(data = buildJsonObject { put("name", "Alice") }),
                createTestRecord(data = buildJsonObject { put("name", "Bob") })
            )
            
            val filter = RecordFilterRequest(
                sort = RecordSortRequest(
                    field = "name",
                    direction = SortDirection.ASC
                )
            )
            
            // When
            val sorted = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(sorted[0].data["name"]?.toString()).contains("Alice")
            assertThat(sorted[1].data["name"]?.toString()).contains("Bob")
            assertThat(sorted[2].data["name"]?.toString()).contains("Charlie")
        }
        
        @Test
        @DisplayName("Should sort records descending")
        fun `should sort records descending`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("value", 10) }),
                createTestRecord(data = buildJsonObject { put("value", 30) }),
                createTestRecord(data = buildJsonObject { put("value", 20) })
            )
            
            val filter = RecordFilterRequest(
                sort = RecordSortRequest(
                    field = "value",
                    direction = SortDirection.DESC
                )
            )
            
            // When
            val sorted = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(sorted[0].data["value"]?.toString()).contains("30")
            assertThat(sorted[1].data["value"]?.toString()).contains("20")
            assertThat(sorted[2].data["value"]?.toString()).contains("10")
        }
        
        @Test
        @DisplayName("Should handle sorting with null values")
        fun `should handle sorting with null values`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("sortField", "B") }),
                createTestRecord(data = buildJsonObject { /* no sortField */ }),
                createTestRecord(data = buildJsonObject { put("sortField", "A") })
            )
            
            val filter = RecordFilterRequest(
                sort = RecordSortRequest(
                    field = "sortField",
                    direction = SortDirection.ASC
                )
            )
            
            // When
            val sorted = mapper.applyFilter(records, filter)
            
            // Then
            // Nulls should sort first in ascending order
            assertThat(sorted[0].data["sortField"]).isNull()
            assertThat(sorted[1].data["sortField"]?.toString()).contains("A")
            assertThat(sorted[2].data["sortField"]?.toString()).contains("B")
        }
    }
    
    @Nested
    @DisplayName("Filtered Response Creation")
    inner class FilteredResponseCreation {
        
        @Test
        @DisplayName("Should return minimal response with field selection")
        fun `should return minimal response with field selection`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject {
                    put("field1", "value1")
                    put("field2", "value2")
                    put("field3", "value3")
                })
            )
            
            val filter = RecordFilterRequest(
                fields = setOf("field1", "field3")
            )
            
            // When
            val responses = mapper.toFilteredResponse(records, filter)
            
            // Then
            assertThat(responses).hasSize(1)
            val minimalResponse = responses[0] as com.astarworks.astarmanagement.core.table.api.dto.record.RecordMinimalResponse
            assertThat(minimalResponse.data).hasSize(2)
            assertThat(minimalResponse.data.containsKey("field1")).isTrue
            assertThat(minimalResponse.data.containsKey("field3")).isTrue
            assertThat(minimalResponse.data.containsKey("field2")).isFalse
        }
        
        @Test
        @DisplayName("Should return full response without field selection")
        fun `should return full response without field selection`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject {
                    put("field1", "value1")
                    put("field2", "value2")
                })
            )
            
            val filter = RecordFilterRequest()
            
            // When
            val responses = mapper.toFilteredResponse(records, filter)
            
            // Then
            assertThat(responses).hasSize(1)
            val fullResponse = responses[0] as com.astarworks.astarmanagement.core.table.api.dto.record.RecordResponse
            assertThat(fullResponse.data).hasSize(2)
            assertThat(fullResponse.position).isNotNull
            assertThat(fullResponse.createdAt).isNotNull
        }
    }
    
    @Nested
    @DisplayName("Complex Filtering Scenarios")
    inner class ComplexFilteringScenarios {
        
        @Test
        @DisplayName("Should combine filtering and sorting")
        fun `should combine filtering and sorting`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { 
                    put("category", "A")
                    put("value", 30)
                }),
                createTestRecord(data = buildJsonObject { 
                    put("category", "B")
                    put("value", 20)
                }),
                createTestRecord(data = buildJsonObject { 
                    put("category", "A")
                    put("value", 10)
                }),
                createTestRecord(data = buildJsonObject { 
                    put("category", "A")
                    put("value", 20)
                })
            )
            
            val filter = RecordFilterRequest(
                filters = buildJsonObject {
                    put("category", "A")
                },
                sort = RecordSortRequest(
                    field = "value",
                    direction = SortDirection.DESC
                )
            )
            
            // When
            val result = mapper.applyFilter(records, filter)
            
            // Then
            assertThat(result).hasSize(3)
            assertThat(result[0].data["value"]?.toString()).contains("30")
            assertThat(result[1].data["value"]?.toString()).contains("20")
            assertThat(result[2].data["value"]?.toString()).contains("10")
        }
        
        @Test
        @DisplayName("Should handle empty filter request")
        fun `should handle empty filter request`() {
            // Given
            val records = listOf(
                createTestRecord(),
                createTestRecord(),
                createTestRecord()
            )
            
            val emptyFilter = RecordFilterRequest()
            
            // When
            val result = mapper.applyFilter(records, emptyFilter)
            
            // Then
            assertThat(result).hasSize(3)
            assertThat(result).isEqualTo(records)
        }
    }
    
    @Nested
    @DisplayName("Request Data Extraction")
    inner class RequestDataExtraction {
        
        @Test
        @DisplayName("Should extract create data from request")
        fun `should extract create data from request`() {
            // Given
            val data = buildJsonObject {
                put("field1", "value1")
                put("field2", 123)
            }
            val request = com.astarworks.astarmanagement.core.table.api.dto.record.RecordCreateRequest(
                tableId = UUID.randomUUID(),
                data = data
            )
            
            // When
            val extracted = mapper.extractCreateData(request)
            
            // Then
            assertThat(extracted).isEqualTo(data)
        }
        
        @Test
        @DisplayName("Should extract update data from request")
        fun `should extract update data from request`() {
            // Given
            val data = buildJsonObject {
                put("updatedField", "newValue")
            }
            val request = com.astarworks.astarmanagement.core.table.api.dto.record.RecordUpdateRequest(
                data = data
            )
            
            // When
            val extracted = mapper.extractUpdateData(request)
            
            // Then
            assertThat(extracted).isEqualTo(data)
        }
    }
    
    // Helper methods
    
    private fun createTestRecord(
        id: UUID = UUID.randomUUID(),
        tableId: UUID = UUID.randomUUID(),
        data: JsonObject = buildJsonObject { put("test", "value") }
    ): Record {
        return Record(
            id = RecordId(id),
            tableId = TableId(tableId),
            data = data
        )
    }
}