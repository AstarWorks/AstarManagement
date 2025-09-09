package com.astarworks.astarmanagement.unit.core.table.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import kotlinx.serialization.json.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
import java.time.Instant
import java.util.UUID
import java.util.stream.Stream

@UnitTest
@DisplayName("Record Domain Model Tests")
class RecordTest {

    companion object {
        @JvmStatic
        fun invalidPositions(): Stream<Float> {
            return Stream.of(0f, -1f, -100.5f, Float.NEGATIVE_INFINITY)
        }

        @JvmStatic
        fun validPositions(): Stream<Float> {
            return Stream.of(1f, 100f, 1000.5f, 65536f, Float.MAX_VALUE)
        }
    }

    @Nested
    @DisplayName("Record Creation Tests")
    inner class RecordCreationTests {

        @Test
        @DisplayName("Should create record with default values")
        fun `should create record with default values`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()

            // When
            val record = Record(tableId = tableId)

            // Then
            assertNotNull(record.id)
            assertEquals(tableId, record.tableId)
            assertEquals("{}", record.getDataJson())
            assertEquals(Record.DEFAULT_POSITION, record.position)
            assertTrue(record.isEmpty())
            assertNotNull(record.createdAt)
            assertNotNull(record.updatedAt)
        }

        @Test
        @DisplayName("Should create record with custom values")
        fun `should create record with custom values`() {
            // Given
            val recordId = RecordId(UUID.randomUUID())
            val tableId = DomainModelTestBuilder.tableId()
            val data = buildJsonObject {
                put("name", "Test")
                put("age", 25)
            }
            val position = 500f
            val createdAt = Instant.now().minusSeconds(100)
            val updatedAt = Instant.now().minusSeconds(50)

            // When
            val record = Record(
                id = recordId,
                tableId = tableId,
                data = data,
                position = position,
                createdAt = createdAt,
                updatedAt = updatedAt
            )

            // Then
            assertEquals(recordId, record.id)
            assertEquals(tableId, record.tableId)
            assertEquals(data.toString(), record.getDataJson())
            assertEquals(data, record.data)
            assertEquals(position, record.position)
            assertEquals(createdAt, record.createdAt)
            assertEquals(updatedAt, record.updatedAt)
            assertFalse(record.isEmpty())
        }

        @Test
        @DisplayName("Should create record using factory method")
        fun `should create record using factory method`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val data = buildJsonObject {
                put("field1", "value1")
                put("field2", 42)
            }

            // When
            val record = Record.create(tableId, data, 300f)

            // Then
            assertEquals(tableId, record.tableId)
            assertEquals(data.toString(), record.getDataJson())
            assertEquals(data, record.data)
            assertEquals(300f, record.position)
        }

        @ParameterizedTest(name = "Should reject invalid position: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.RecordTest#invalidPositions")
        fun `should reject invalid positions`(invalidPosition: Float) {
            // Given
            val tableId = DomainModelTestBuilder.tableId()

            // When & Then
            assertThrows<IllegalArgumentException> {
                Record(tableId = tableId, position = invalidPosition)
            }
        }

        @ParameterizedTest(name = "Should accept valid position: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.RecordTest#validPositions")
        fun `should accept valid positions`(validPosition: Float) {
            // Given
            val tableId = DomainModelTestBuilder.tableId()

            // When
            val record = Record(tableId = tableId, position = validPosition)

            // Then
            assertEquals(validPosition, record.position)
        }

        @Test
        @DisplayName("Should reject invalid JSON format")
        fun `should reject invalid JSON format`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val invalidJson = "{ invalid json }"

            // When & Then
            assertThrows<IllegalArgumentException> {
                Record.create(tableId, Json.parseToJsonElement(invalidJson).jsonObject)
            }
        }

        @Test
        @DisplayName("Should accept valid JSON formats")
        fun `should accept valid JSON formats`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val validJsons = listOf(
                "{}",
                """{"name": "test"}""",
                """{"nested": {"value": 42}, "array": [1, 2, 3]}"""
            )

            validJsons.forEach { json ->
                // When & Then
                assertDoesNotThrow {
                    Record.create(tableId, Json.parseToJsonElement(json).jsonObject)
                }
            }
        }
    }

    @Nested
    @DisplayName("Record Operations Tests")
    inner class RecordOperationsTests {

        @Test
        @DisplayName("Should update data correctly")
        fun `should update data correctly`() {
            // Given
            val original = Record.create(
                DomainModelTestBuilder.tableId(),
                buildJsonObject { put("old", "value") }
            )
            val newData = buildJsonObject {
                put("new", "value")
                put("count", 10)
            }

            // When
            val updated = original.updateData(newData)

            // Then
            assertEquals(newData.toString(), updated.getDataJson())
            assertEquals(original.id, updated.id)
            assertEquals(original.tableId, updated.tableId)
            assertEquals(original.position, updated.position)
            assertEquals(original.createdAt, updated.createdAt)
            assertTrue(updated.updatedAt.isAfter(original.updatedAt))
        }

        @Test
        @DisplayName("Should update position correctly")
        fun `should update position correctly`() {
            // Given
            val original = Record.create(DomainModelTestBuilder.tableId())
            val newPosition = 999f

            // When
            val updated = original.updatePosition(newPosition)

            // Then
            assertEquals(newPosition, updated.position)
            assertEquals(original.id, updated.id)
            assertEquals(original.tableId, updated.tableId)
            assertEquals(original.getDataJson(), updated.getDataJson())
            assertEquals(original.createdAt, updated.createdAt)
            assertTrue(updated.updatedAt.isAfter(original.updatedAt))
        }

        @Test
        @DisplayName("Should reject invalid position update")
        fun `should reject invalid position update`() {
            // Given
            val record = Record.create(DomainModelTestBuilder.tableId())

            // When & Then
            assertThrows<IllegalArgumentException> {
                record.updatePosition(-1f)
            }
        }

        @Test
        @DisplayName("Should detect empty records correctly")
        fun `should detect empty records correctly`() {
            // Given
            val emptyRecord = Record.create(DomainModelTestBuilder.tableId(), buildJsonObject {})
            val nonEmptyRecord = Record.create(
                DomainModelTestBuilder.tableId(),
                buildJsonObject { put("field", "value") }
            )

            // When & Then
            assertTrue(emptyRecord.isEmpty())
            assertFalse(nonEmptyRecord.isEmpty())
        }
    }

    @Nested
    @DisplayName("Position Calculation Tests")
    inner class PositionCalculationTests {

        @Test
        @DisplayName("Should calculate first position correctly")
        fun `should calculate first position correctly`() {
            // When
            val firstPosition = Record.firstPosition()

            // Then
            assertEquals(Record.DEFAULT_POSITION, firstPosition)
        }

        @Test
        @DisplayName("Should calculate next position correctly")
        fun `should calculate next position correctly`() {
            // Given
            val lastPosition = 1000f

            // When
            val nextPosition = Record.nextPosition(lastPosition)

            // Then
            assertEquals(lastPosition + Record.POSITION_INCREMENT, nextPosition)
        }

        @Test
        @DisplayName("Should calculate position between two records")
        fun `should calculate position between two records`() {
            // Given
            val beforeRecord = Record.create(DomainModelTestBuilder.tableId(), buildJsonObject {}, 100f)
            val afterRecord = Record.create(DomainModelTestBuilder.tableId(), buildJsonObject {}, 300f)

            // When
            val positionBetween = beforeRecord.calculatePositionBetween(beforeRecord, afterRecord)

            // Then
            assertEquals(200f, positionBetween)
        }

        @Test
        @DisplayName("Should calculate position with null before record")
        fun `should calculate position with null before record`() {
            // Given
            val afterRecord = Record.create(DomainModelTestBuilder.tableId(), buildJsonObject {}, 200f)

            // When
            val position = Record.positionBetween(null, 200f)

            // Then
            assertEquals(100f, position)
        }

        @Test
        @DisplayName("Should calculate position with null after record")
        fun `should calculate position with null after record`() {
            // Given
            val beforePosition = 100f

            // When
            val position = Record.positionBetween(beforePosition, null)

            // Then
            assertEquals(beforePosition + Record.POSITION_INCREMENT, position)
        }

        @Test
        @DisplayName("Should calculate default position when both records are null")
        fun `should calculate default position when both records are null`() {
            // When
            val position = Record.positionBetween(null, null)

            // Then
            assertEquals(Record.DEFAULT_POSITION, position)
        }
    }

    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {

        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val recordId = RecordId(UUID.randomUUID())
            val tableId = DomainModelTestBuilder.tableId()
            val data = buildJsonObject { put("field", "value") }
            val createdAt = Instant.now().minusSeconds(60)
            val updatedAt = Instant.now().minusSeconds(30)

            val record1 = Record(
                id = recordId,
                tableId = tableId,
                data = data,
                position = 100f,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            val record2 = Record(
                id = recordId,
                tableId = tableId,
                data = data,
                position = 100f,
                createdAt = createdAt,
                updatedAt = updatedAt
            )

            // Then
            assertEquals(record1, record2)
            assertEquals(record1.hashCode(), record2.hashCode())
        }

        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseRecord = Record.create(DomainModelTestBuilder.tableId(), buildJsonObject { put("test", "data") })
            val differentId = baseRecord.copy(id = RecordId(UUID.randomUUID()))
            val differentTableId = baseRecord.copy(tableId = DomainModelTestBuilder.tableId())
            val differentData = baseRecord.updateData(buildJsonObject { put("different", "data") })
            val differentPosition = baseRecord.copy(position = baseRecord.position + 100f)

            // Then
            assertNotEquals(baseRecord, differentId)
            assertNotEquals(baseRecord, differentTableId)
            assertNotEquals(baseRecord, differentData)
            assertNotEquals(baseRecord, differentPosition)
        }

        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalRecord = Record.create(DomainModelTestBuilder.tableId(), buildJsonObject { put("test", "data") }, 100f)
            val newTableId = DomainModelTestBuilder.tableId()
            val newPosition = 200f
            val newUpdatedAt = Instant.now()

            // When
            val copiedRecord = originalRecord.copy(
                tableId = newTableId,
                position = newPosition,
                updatedAt = newUpdatedAt
            )

            // Then
            assertEquals(originalRecord.id, copiedRecord.id) // unchanged
            assertEquals(newTableId, copiedRecord.tableId) // changed
            assertEquals(originalRecord.getDataJson(), copiedRecord.getDataJson()) // unchanged
            assertEquals(newPosition, copiedRecord.position) // changed
            assertEquals(originalRecord.createdAt, copiedRecord.createdAt) // unchanged
            assertEquals(newUpdatedAt, copiedRecord.updatedAt) // changed
        }
    }

    @Nested
    @DisplayName("Edge Cases Tests")
    inner class EdgeCasesTests {

        @Test
        @DisplayName("Should handle Unicode and special characters in JSON")
        fun `should handle Unicode and special characters in JSON`() {
            // Given
            val unicodeData = buildJsonObject {
                put("japanese", "こんにちは世界")
                put("emoji", "🎯🚀⭐")
                put("special", "!@#$%^&*()")
            }
            val tableId = DomainModelTestBuilder.tableId()

            // When & Then
            val record = Record.create(tableId, unicodeData)
            assertEquals(unicodeData, record.data)
        }

        @Test
        @DisplayName("Should handle very large JSON data")
        fun `should handle very large JSON data`() {
            // Given
            val largeValue = "x".repeat(10000)
            val largeData = buildJsonObject {
                put("large_field", largeValue)
            }
            val tableId = DomainModelTestBuilder.tableId()

            // When & Then
            assertDoesNotThrow {
                Record.create(tableId, largeData)
            }
        }

        @Test
        @DisplayName("Should maintain immutability through operations")
        fun `should maintain immutability through operations`() {
            // Given
            val originalData = buildJsonObject {
                put("field1", "value1")
                put("field2", 42)
            }
            val originalRecord = Record.create(DomainModelTestBuilder.tableId(), originalData, 100f)

            // When performing various operations
            val afterUpdateData = originalRecord.updateData(buildJsonObject { put("field3", "new_value") })
            val afterUpdatePosition = originalRecord.updatePosition(200f)

            // Then - original record should remain unchanged
            assertEquals(originalData.toString(), originalRecord.getDataJson())
            assertEquals(100f, originalRecord.position)

            // And operations should create new instances
            assertNotEquals(originalRecord, afterUpdateData)
            assertNotEquals(originalRecord, afterUpdatePosition)
        }
    }
}