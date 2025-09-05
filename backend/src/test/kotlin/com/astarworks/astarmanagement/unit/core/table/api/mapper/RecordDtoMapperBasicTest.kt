package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
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
import java.time.Instant
import java.util.*

/**
 * Unit tests for RecordDtoMapper basic conversion functionality.
 * Tests fundamental transformations between Record domain model and DTOs.
 */
@UnitTest
@DisplayName("RecordDtoMapper Basic Tests")
class RecordDtoMapperBasicTest {
    
    private lateinit var mapper: RecordDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = RecordDtoMapper()
    }
    
    @Nested
    @DisplayName("Record to RecordResponse Conversion")
    inner class RecordToResponseConversion {
        
        @Test
        @DisplayName("Should convert Record to RecordResponse with all fields")
        fun `should convert record to response with all fields`() {
            // Given
            val recordId = UUID.randomUUID()
            val tableId = UUID.randomUUID()
            val data = buildJsonObject {
                put("name", "Test Record")
                put("value", 42)
                put("active", true)
            }
            val position = 1024f
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val record = Record(
                id = RecordId(recordId),
                tableId = TableId(tableId),
                data = data,
                position = position,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val response = mapper.toResponse(record)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.id).isEqualTo(recordId)
            assertThat(response.tableId).isEqualTo(tableId)
            assertThat(response.data).isEqualTo(data)
            assertThat(response.position).isEqualTo(position)
            assertThat(response.createdAt).isEqualTo(createdAt)
            assertThat(response.updatedAt).isEqualTo(updatedAt)
        }
        
        @Test
        @DisplayName("Should handle empty data in Record")
        fun `should handle empty data in record`() {
            // Given
            val record = createTestRecord(
                data = buildJsonObject {}
            )
            
            // When
            val response = mapper.toResponse(record)
            
            // Then
            assertThat(response.data).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle complex JsonObject data")
        fun `should handle complex json object data`() {
            // Given
            val complexData = buildJsonObject {
                put("string", "text value")
                put("number", 123.45)
                put("boolean", false)
                put("null", JsonNull)
                putJsonArray("array") {
                    add("item1")
                    add(42)
                    add(true)
                }
                putJsonObject("nested") {
                    put("key1", "value1")
                    put("key2", 99)
                }
            }
            
            val record = createTestRecord(data = complexData)
            
            // When
            val response = mapper.toResponse(record)
            
            // Then
            assertThat(response.data).isEqualTo(complexData)
            assertThat(response.data["string"]).isEqualTo(JsonPrimitive("text value"))
            assertThat(response.data["number"]).isEqualTo(JsonPrimitive(123.45))
            assertThat(response.data["boolean"]).isEqualTo(JsonPrimitive(false))
            assertThat(response.data["null"]).isEqualTo(JsonNull)
            assertThat(response.data["array"]).isInstanceOf(JsonArray::class.java)
            assertThat(response.data["nested"]).isInstanceOf(JsonObject::class.java)
        }
        
        @Test
        @DisplayName("Should preserve exact timestamp precision")
        fun `should preserve exact timestamp precision`() {
            // Given
            val preciseTimestamp = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val record = createTestRecord(
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            
            // When
            val response = mapper.toResponse(record)
            
            // Then
            assertThat(response.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.updatedAt).isEqualTo(preciseTimestamp)
        }
        
        @Test
        @DisplayName("Should handle various position values")
        fun `should handle various position values`() {
            // Given
            val positions = listOf(1f, 100f, 65536f, Float.MAX_VALUE)
            
            positions.forEach { position ->
                val record = createTestRecord(position = position)
                
                // When
                val response = mapper.toResponse(record)
                
                // Then
                assertThat(response.position).isEqualTo(position)
            }
        }
    }
    
    @Nested
    @DisplayName("Record to RecordSummaryResponse Conversion")
    inner class RecordToSummaryResponseConversion {
        
        @Test
        @DisplayName("Should convert Record to SummaryResponse with primary field")
        fun `should convert record to summary response with primary field`() {
            // Given
            val recordId = UUID.randomUUID()
            val updatedAt = Instant.now()
            val data = buildJsonObject {
                put("primaryField", "Primary Value")
                put("secondaryField", "Secondary Value")
            }
            
            val record = Record(
                id = RecordId(recordId),
                tableId = TableId(UUID.randomUUID()),
                data = data,
                updatedAt = updatedAt
            )
            
            // When
            val summary = mapper.toSummaryResponse(record)
            
            // Then
            assertThat(summary).isNotNull
            assertThat(summary.id).isEqualTo(recordId)
            assertThat(summary.primaryField).isEqualTo(JsonPrimitive("Primary Value"))
            assertThat(summary.updatedAt).isEqualTo(updatedAt)
        }
        
        @Test
        @DisplayName("Should handle empty data in summary")
        fun `should handle empty data in summary`() {
            // Given
            val record = createTestRecord(data = buildJsonObject {})
            
            // When
            val summary = mapper.toSummaryResponse(record)
            
            // Then
            assertThat(summary.primaryField).isNull()
        }
        
        @Test
        @DisplayName("Should use first field as primary field")
        fun `should use first field as primary field`() {
            // Given
            val data = buildJsonObject {
                put("field1", "First")
                put("field2", "Second")
                put("field3", "Third")
            }
            val record = createTestRecord(data = data)
            
            // When
            val summary = mapper.toSummaryResponse(record)
            
            // Then
            assertThat(summary.primaryField).isEqualTo(JsonPrimitive("First"))
        }
    }
    
    @Nested
    @DisplayName("Record to RecordMinimalResponse Conversion")
    inner class RecordToMinimalResponseConversion {
        
        @Test
        @DisplayName("Should convert with selected fields only")
        fun `should convert with selected fields only`() {
            // Given
            val data = buildJsonObject {
                put("field1", "Value1")
                put("field2", 42)
                put("field3", true)
                put("field4", "Value4")
            }
            val record = createTestRecord(data = data)
            val selectedFields = setOf("field1", "field3")
            
            // When
            val minimal = mapper.toMinimalResponse(record, selectedFields)
            
            // Then
            assertThat(minimal.data).hasSize(2)
            assertThat(minimal.data["field1"]).isEqualTo(JsonPrimitive("Value1"))
            assertThat(minimal.data["field3"]).isEqualTo(JsonPrimitive(true))
            assertThat(minimal.data.containsKey("field2")).isFalse
            assertThat(minimal.data.containsKey("field4")).isFalse
        }
        
        @Test
        @DisplayName("Should handle empty field selection")
        fun `should handle empty field selection`() {
            // Given
            val data = buildJsonObject {
                put("field1", "Value1")
                put("field2", "Value2")
            }
            val record = createTestRecord(data = data)
            val emptyFields = emptySet<String>()
            
            // When
            val minimal = mapper.toMinimalResponse(record, emptyFields)
            
            // Then
            assertThat(minimal.data).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle non-existent field selection")
        fun `should handle non existent field selection`() {
            // Given
            val data = buildJsonObject {
                put("existingField", "Value")
            }
            val record = createTestRecord(data = data)
            val nonExistentFields = setOf("nonExistent1", "nonExistent2")
            
            // When
            val minimal = mapper.toMinimalResponse(record, nonExistentFields)
            
            // Then
            assertThat(minimal.data).isEmpty()
        }
    }
    
    // Helper methods
    
    private fun createTestRecord(
        id: UUID = UUID.randomUUID(),
        tableId: UUID = UUID.randomUUID(),
        data: JsonObject = buildJsonObject { put("test", "value") },
        position: Float = 65536f,
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): Record {
        return Record(
            id = RecordId(id),
            tableId = TableId(tableId),
            data = data,
            position = position,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}