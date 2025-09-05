package com.astarworks.astarmanagement.unit.core.table.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.domain.model.PropertyValue
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import kotlinx.serialization.json.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
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

        @JvmStatic
        fun jsonDataCases(): Stream<JsonObject> {
            return Stream.of(
                JsonObject(emptyMap()),
                buildJsonObject {
                    put("name", "Test Name")
                    put("age", 30)
                    put("active", true)
                },
                buildJsonObject {
                    put("text_field", "Sample text")
                    put("number_field", 42)
                    put("boolean_field", false)
                    put("array_field", JsonArray(listOf(
                        JsonPrimitive("item1"), 
                        JsonPrimitive("item2")
                    )))
                }
            )
        }
    }

    @Nested
    @DisplayName("Construction and Initialization Tests")
    inner class ConstructionTests {

        @Test
        @DisplayName("Should create Record with valid parameters")
        fun `should create Record with valid parameters`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val data = buildJsonObject {
                put("name", "Test Record")
                put("value", 123)
            }

            // When
            val record = DomainModelTestBuilder.record(
                tableId = tableId,
                data = data,
                position = 100f
            )

            // Then
            assertNotNull(record.id)
            assertEquals(tableId, record.tableId)
            assertEquals(data, record.data)
            assertEquals(100f, record.position)
            assertTrue(record.createdAt.isBefore(Instant.now().plusSeconds(1)))
            assertTrue(record.updatedAt.isBefore(Instant.now().plusSeconds(1)))
        }

        @Test
        @DisplayName("Should create Record with default values")
        fun `should create Record with default values`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()

            // When
            val record = Record(tableId = tableId)

            // Then
            assertNotNull(record.id)
            assertEquals(tableId, record.tableId)
            assertTrue(record.data.isEmpty())
            assertEquals(Record.DEFAULT_POSITION, record.position)
        }

        @Test
        @DisplayName("Should create Record from JsonObject constructor")
        fun `should create Record from JsonObject constructor`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val data = buildJsonObject {
                put("field1", "value1")
                put("field2", 42)
            }

            // When
            val record = Record(
                tableId = tableId,
                data = data,
                position = 200f
            )

            // Then
            assertEquals(tableId, record.tableId)
            assertEquals(data, record.data)
            assertEquals(200f, record.position)
        }

        @ParameterizedTest(name = "Should reject invalid position: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.RecordTest#invalidPositions")
        fun `should reject invalid positions`(invalidPosition: Float) {
            // Given
            val tableId = DomainModelTestBuilder.tableId()

            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                Record(tableId = tableId, position = invalidPosition)
            }
            assertEquals("Position must be positive", exception.message)
        }

        @ParameterizedTest(name = "Should accept valid position: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.RecordTest#validPositions")
        fun `should accept valid positions`(validPosition: Float) {
            // Given
            val tableId = DomainModelTestBuilder.tableId()

            // When & Then
            val record = Record(tableId = tableId, position = validPosition)
            assertEquals(validPosition, record.position)
        }

        @Test
        @DisplayName("Should handle malformed JSON gracefully")
        fun `should handle malformed JSON gracefully`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val malformedJson = "{ invalid json }"

            // When
            val record = Record.fromJson(
                tableId = tableId,
                dataJson = malformedJson
            )

            // Then
            assertTrue(record.data.isEmpty()) // Should return empty JsonObject on parse error
        }

        @Test
        @DisplayName("Should parse valid JSON correctly")
        fun `should parse valid JSON correctly`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val validJson = """{"name":"John","age":30,"active":true}"""

            // When
            val record = Record.fromJson(
                tableId = tableId,
                dataJson = validJson
            )

            // Then
            assertFalse(record.data.isEmpty())
            assertEquals("John", record.data["name"]?.jsonPrimitive?.content)
            assertEquals(30, record.data["age"]?.jsonPrimitive?.int)
            assertEquals(true, record.data["active"]?.jsonPrimitive?.boolean)
        }
    }

    @Nested
    @DisplayName("Data Access Tests")
    inner class DataAccessTests {

        @Test
        @DisplayName("Should get values correctly")
        fun `should get values correctly`() {
            // Given
            val data = buildJsonObject {
                put("string_field", "text value")
                put("number_field", 42)
                put("boolean_field", true)
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When & Then
            assertEquals(JsonPrimitive("text value"), record.getValue("string_field"))
            assertEquals(JsonPrimitive(42), record.getValue("number_field"))
            assertEquals(JsonPrimitive(true), record.getValue("boolean_field"))
            assertNull(record.getValue("non_existent_field"))
        }

        @Test
        @DisplayName("Should get type-safe values correctly")
        fun `should get type-safe values correctly`() {
            // Given
            val data = buildJsonObject {
                put("string_field", "hello world")
                put("int_field", 123)
                put("long_field", 123456789L)
                put("float_field", 3.14f)
                put("double_field", 2.718281828)
                put("boolean_field", false)
                put("array_field", JsonArray(listOf(JsonPrimitive("a"), JsonPrimitive("b"))))
                put("object_field", buildJsonObject { put("nested", "value") })
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When & Then
            assertEquals("hello world", record.getValueAs<String>("string_field"))
            assertEquals(123, record.getValueAs<Int>("int_field"))
            assertEquals(123456789L, record.getValueAs<Long>("long_field"))
            assertEquals(3.14f, record.getValueAs<Float>("float_field")!!, 0.001f)
            assertEquals(2.718281828, record.getValueAs<Double>("double_field")!!, 0.000000001)
            assertEquals(false, record.getValueAs<Boolean>("boolean_field"))
            assertNotNull(record.getValueAs<List<JsonElement>>("array_field"))
            assertNotNull(record.getValueAs<Map<String, JsonElement>>("object_field"))
        }

        @Test
        @DisplayName("Should return null for wrong type conversions")
        fun `should return null for wrong type conversions`() {
            // Given
            val data = buildJsonObject {
                put("string_field", "not a number")
                put("number_field", 42)
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When & Then
            assertNull(record.getValueAs<Int>("string_field"))
            assertNull(record.getValueAs<String>("number_field"))
            assertNull(record.getValueAs<Boolean>("non_existent"))
        }

        @Test
        @DisplayName("Should handle null values correctly")
        fun `should handle null values correctly`() {
            // Given
            val data = buildJsonObject {
                put("null_field", JsonNull)
                put("string_field", "value")
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When & Then
            assertEquals(JsonNull, record.getValue("null_field"))
            assertNull(record.getValueAs<String>("null_field"))
        }

        @Test
        @DisplayName("Should check key existence correctly")
        fun `should check key existence correctly`() {
            // Given
            val data = buildJsonObject {
                put("existing_key", "value")
                put("null_key", JsonNull)
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When & Then
            assertTrue(record.hasKey("existing_key"))
            assertTrue(record.hasKey("null_key")) // null values still count as existing keys
            assertFalse(record.hasKey("non_existent_key"))
        }

        @Test
        @DisplayName("Should detect empty records correctly")
        fun `should detect empty records correctly`() {
            // Given
            val emptyRecord = DomainModelTestBuilder.record(data = JsonObject(emptyMap()))
            val nonEmptyRecord = DomainModelTestBuilder.record(data = buildJsonObject { put("key", "value") })

            // When & Then
            assertTrue(emptyRecord.isEmpty())
            assertFalse(nonEmptyRecord.isEmpty())
        }
    }

    @Nested
    @DisplayName("Data Manipulation Tests")
    inner class DataManipulationTests {

        @Test
        @DisplayName("Should set single value correctly")
        fun `should set single value correctly`() {
            // Given
            val originalData = buildJsonObject {
                put("existing_field", "old_value")
            }
            val record = DomainModelTestBuilder.record(data = originalData)
            val newValue = JsonPrimitive("new_value")

            // When
            val updatedRecord = record.setValue("existing_field", newValue)

            // Then
            assertEquals(newValue, updatedRecord.getValue("existing_field"))
            assertNotEquals(record.updatedAt, updatedRecord.updatedAt)
            // Original record should remain unchanged
            assertEquals("old_value", record.getValueAs<String>("existing_field"))
        }

        @Test
        @DisplayName("Should add new value correctly")
        fun `should add new value correctly`() {
            // Given
            val record = DomainModelTestBuilder.record(data = JsonObject(emptyMap()))
            val newValue = JsonPrimitive(42)

            // When
            val updatedRecord = record.setValue("new_field", newValue)

            // Then
            assertEquals(newValue, updatedRecord.getValue("new_field"))
            assertTrue(updatedRecord.hasKey("new_field"))
            assertFalse(record.hasKey("new_field"))
        }

        @Test
        @DisplayName("Should set multiple values correctly")
        fun `should set multiple values correctly`() {
            // Given
            val originalData = buildJsonObject {
                put("field1", "old_value1")
                put("field2", "old_value2")
            }
            val record = DomainModelTestBuilder.record(data = originalData)
            val newValues = buildJsonObject {
                put("field2", "new_value2")
                put("field3", "new_value3")
            }

            // When
            val updatedRecord = record.setValues(newValues)

            // Then
            assertEquals("old_value1", updatedRecord.getValueAs<String>("field1")) // unchanged
            assertEquals("new_value2", updatedRecord.getValueAs<String>("field2")) // updated
            assertEquals("new_value3", updatedRecord.getValueAs<String>("field3")) // added
        }

        @Test
        @DisplayName("Should remove value correctly")
        fun `should remove value correctly`() {
            // Given
            val data = buildJsonObject {
                put("field1", "value1")
                put("field2", "value2")
                put("field3", "value3")
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val updatedRecord = record.removeValue("field2")

            // Then
            assertTrue(updatedRecord.hasKey("field1"))
            assertFalse(updatedRecord.hasKey("field2"))
            assertTrue(updatedRecord.hasKey("field3"))
        }

        @Test
        @DisplayName("Should handle removing non-existent value")
        fun `should handle removing non-existent value`() {
            // Given
            val data = buildJsonObject {
                put("field1", "value1")
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val updatedRecord = record.removeValue("non_existent_field")

            // Then
            assertEquals(record.data, updatedRecord.data)
            assertNotEquals(record.updatedAt, updatedRecord.updatedAt) // updatedAt should still change
        }

        @Test
        @DisplayName("Should clear all values correctly")
        fun `should clear all values correctly`() {
            // Given
            val data = buildJsonObject {
                put("field1", "value1")
                put("field2", 42)
                put("field3", true)
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val clearedRecord = record.clearValues()

            // Then
            assertTrue(clearedRecord.isEmpty())
            assertEquals(JsonObject(emptyMap()), clearedRecord.data)
            assertNotEquals(record.updatedAt, clearedRecord.updatedAt)
        }
    }

    @Nested
    @DisplayName("Position Management Tests")
    inner class PositionManagementTests {

        @Test
        @DisplayName("Should update position correctly")
        fun `should update position correctly`() {
            // Given
            val record = DomainModelTestBuilder.record(position = 100f)
            val newPosition = 200f

            // When
            val updatedRecord = record.updatePosition(newPosition)

            // Then
            assertEquals(newPosition, updatedRecord.position)
            assertNotEquals(record.updatedAt, updatedRecord.updatedAt)
        }

        @Test
        @DisplayName("Should reject invalid position updates")
        fun `should reject invalid position updates`() {
            // Given
            val record = DomainModelTestBuilder.record(position = 100f)

            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                record.updatePosition(-1f)
            }
            assertEquals("Position must be positive", exception.message)
        }

        @Test
        @DisplayName("Should calculate position between records correctly")
        fun `should calculate position between records correctly`() {
            // Given
            val beforeRecord = DomainModelTestBuilder.record(position = 100f)
            val afterRecord = DomainModelTestBuilder.record(position = 200f)
            val record = DomainModelTestBuilder.record()

            // When
            val positionBetween = record.calculatePositionBetween(beforeRecord, afterRecord)

            // Then
            assertEquals(150f, positionBetween)
        }

        @Test
        @DisplayName("Should calculate position when no before record")
        fun `should calculate position when no before record`() {
            // Given
            val afterRecord = DomainModelTestBuilder.record(position = 200f)
            val record = DomainModelTestBuilder.record()

            // When
            val position = record.calculatePositionBetween(null, afterRecord)

            // Then
            assertEquals(100f, position) // 200 / 2
        }

        @Test
        @DisplayName("Should calculate position when no after record")
        fun `should calculate position when no after record`() {
            // Given
            val beforeRecord = DomainModelTestBuilder.record(position = 100f)
            val record = DomainModelTestBuilder.record()

            // When
            val position = record.calculatePositionBetween(beforeRecord, null)

            // Then
            assertEquals(100f + Record.POSITION_INCREMENT, position)
        }

        @Test
        @DisplayName("Should calculate default position when no surrounding records")
        fun `should calculate default position when no surrounding records`() {
            // Given
            val record = DomainModelTestBuilder.record()

            // When
            val position = record.calculatePositionBetween(null, null)

            // Then
            assertEquals(Record.DEFAULT_POSITION, position)
        }
    }

    @Nested
    @DisplayName("Factory Methods Tests")
    inner class FactoryMethodsTests {

        @Test
        @DisplayName("Should create record with factory method")
        fun `should create record with factory method`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val data = buildJsonObject {
                put("name", "Factory Test")
                put("value", 42)
            }

            // When
            val record = Record.create(tableId, data, 500f)

            // Then
            assertEquals(tableId, record.tableId)
            assertEquals(data, record.data)
            assertEquals(500f, record.position)
        }

        @Test
        @DisplayName("Should create record from JSON string")
        fun `should create record from JSON string`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val recordId = RecordId(UUID.randomUUID())
            val jsonString = """{"field1":"value1","field2":42}"""
            val createdAt = Instant.now().minusSeconds(60)
            val updatedAt = Instant.now().minusSeconds(30)

            // When
            val record = Record.fromJson(
                id = recordId,
                tableId = tableId,
                dataJson = jsonString,
                position = 300f,
                createdAt = createdAt,
                updatedAt = updatedAt
            )

            // Then
            assertEquals(recordId, record.id)
            assertEquals(tableId, record.tableId)
            assertEquals("value1", record.getValueAs<String>("field1"))
            assertEquals(42, record.getValueAs<Int>("field2"))
            assertEquals(300f, record.position)
            assertEquals(createdAt, record.createdAt)
            assertEquals(updatedAt, record.updatedAt)
        }

        @Test
        @DisplayName("Should create record from PropertyValues")
        fun `should create record from PropertyValues`() {
            // Given
            val tableId = DomainModelTestBuilder.tableId()
            val propertyValues = listOf(
                PropertyValue("name", JsonPrimitive("Test Name")),
                PropertyValue("age", JsonPrimitive(25)),
                PropertyValue("active", JsonPrimitive(true))
            )

            // When
            val record = Record.fromPropertyValues(tableId, propertyValues, 400f)

            // Then
            assertEquals(tableId, record.tableId)
            assertEquals("Test Name", record.getValueAs<String>("name"))
            assertEquals(25, record.getValueAs<Int>("age"))
            assertEquals(true, record.getValueAs<Boolean>("active"))
            assertEquals(400f, record.position)
        }

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
        @DisplayName("Should calculate position between using companion method")
        fun `should calculate position between using companion method`() {
            // When & Then
            assertEquals(Record.DEFAULT_POSITION, Record.positionBetween(null, null))
            assertEquals(50f, Record.positionBetween(null, 100f))
            assertEquals(200f + Record.POSITION_INCREMENT, Record.positionBetween(200f, null))
            assertEquals(150f, Record.positionBetween(100f, 200f))
        }
    }

    @Nested
    @DisplayName("PropertyValue Conversion Tests")
    inner class PropertyValueConversionTests {

        @Test
        @DisplayName("Should convert to PropertyValues correctly")
        fun `should convert to PropertyValues correctly`() {
            // Given
            val data = buildJsonObject {
                put("string_field", "text value")
                put("number_field", 123)
                put("boolean_field", false)
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val propertyValues = record.toPropertyValues()

            // Then
            assertEquals(3, propertyValues.size)
            
            val stringValue = propertyValues.find { it.key == "string_field" }
            assertNotNull(stringValue)
            assertEquals(JsonPrimitive("text value"), stringValue?.value)

            val numberValue = propertyValues.find { it.key == "number_field" }
            assertNotNull(numberValue)
            assertEquals(JsonPrimitive(123), numberValue?.value)

            val booleanValue = propertyValues.find { it.key == "boolean_field" }
            assertNotNull(booleanValue)
            assertEquals(JsonPrimitive(false), booleanValue?.value)
        }

        @Test
        @DisplayName("Should handle empty record conversion")
        fun `should handle empty record conversion`() {
            // Given
            val record = DomainModelTestBuilder.record(data = JsonObject(emptyMap()))

            // When
            val propertyValues = record.toPropertyValues()

            // Then
            assertTrue(propertyValues.isEmpty())
        }

        @Test
        @DisplayName("Should handle complex data types in conversion")
        fun `should handle complex data types in conversion`() {
            // Given
            val data = buildJsonObject {
                put("array_field", JsonArray(listOf(JsonPrimitive("a"), JsonPrimitive("b"))))
                put("object_field", buildJsonObject { put("nested", "value") })
                put("null_field", JsonNull)
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val propertyValues = record.toPropertyValues()

            // Then
            assertEquals(3, propertyValues.size)
            
            val arrayValue = propertyValues.find { it.key == "array_field" }
            assertNotNull(arrayValue)
            assertTrue(arrayValue?.value is JsonArray)

            val objectValue = propertyValues.find { it.key == "object_field" }
            assertNotNull(objectValue)
            assertTrue(objectValue?.value is JsonObject)

            val nullValue = propertyValues.find { it.key == "null_field" }
            assertNotNull(nullValue)
            assertEquals(JsonNull, nullValue?.value)
        }
    }

    @Nested
    @DisplayName("Validation Tests")
    inner class ValidationTests {

        @Test
        @DisplayName("Should validate against table successfully")
        fun `should validate against table successfully`() {
            // Given
            val table = DomainModelTestBuilder.table(
                properties = mapOf(
                    "name" to DomainModelTestBuilder.textPropertyDefinition(displayName = "Name", isRequired = true),
                    "age" to DomainModelTestBuilder.numberPropertyDefinition(displayName = "Age", isRequired = false)
                )
            )
            val data = buildJsonObject {
                put("name", "John Doe")
                put("age", 30)
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val errors = record.validate(table)

            // Then
            assertTrue(errors.isEmpty())
        }

        @Test
        @DisplayName("Should detect missing required fields")
        fun `should detect missing required fields`() {
            // Given
            val table = DomainModelTestBuilder.table(
                properties = mapOf(
                    "name" to DomainModelTestBuilder.textPropertyDefinition(displayName = "Name", isRequired = true),
                    "email" to DomainModelTestBuilder.emailPropertyDefinition(displayName = "Email", isRequired = true),
                    "age" to DomainModelTestBuilder.numberPropertyDefinition(displayName = "Age", isRequired = false)
                )
            )
            val data = buildJsonObject {
                put("age", 30) // missing required 'name' and 'email'
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val errors = record.validate(table)

            // Then
            assertEquals(2, errors.size)
            assertTrue(errors.any { it.contains("Required field 'name' is missing") })
            assertTrue(errors.any { it.contains("Required field 'email' is missing") })
        }

        @Test
        @DisplayName("Should detect unknown fields")
        fun `should detect unknown fields`() {
            // Given
            val table = DomainModelTestBuilder.table(
                properties = mapOf(
                    "name" to DomainModelTestBuilder.textPropertyDefinition(displayName = "Name"),
                    "age" to DomainModelTestBuilder.numberPropertyDefinition(displayName = "Age")
                )
            )
            val data = buildJsonObject {
                put("name", "John Doe")
                put("age", 30)
                put("unknown_field1", "value1")
                put("unknown_field2", "value2")
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val errors = record.validate(table)

            // Then
            assertEquals(2, errors.size)
            assertTrue(errors.any { it.contains("Unknown field 'unknown_field1'") })
            assertTrue(errors.any { it.contains("Unknown field 'unknown_field2'") })
        }

        @Test
        @DisplayName("Should detect both missing required and unknown fields")
        fun `should detect both missing required and unknown fields`() {
            // Given
            val table = DomainModelTestBuilder.table(
                properties = mapOf(
                    "name" to DomainModelTestBuilder.textPropertyDefinition(displayName = "Name", isRequired = true),
                    "age" to DomainModelTestBuilder.numberPropertyDefinition(displayName = "Age", isRequired = false)
                )
            )
            val data = buildJsonObject {
                put("unknown_field", "unknown_value") // missing required 'name'
            }
            val record = DomainModelTestBuilder.record(data = data)

            // When
            val errors = record.validate(table)

            // Then
            assertEquals(2, errors.size)
            assertTrue(errors.any { it.contains("Required field 'name' is missing") })
            assertTrue(errors.any { it.contains("Unknown field 'unknown_field'") })
        }

        @Test
        @DisplayName("Should validate empty record against table with all optional fields")
        fun `should validate empty record against table with all optional fields`() {
            // Given
            val table = DomainModelTestBuilder.table(
                properties = mapOf(
                    "name" to DomainModelTestBuilder.textPropertyDefinition(displayName = "Name", isRequired = false),
                    "age" to DomainModelTestBuilder.numberPropertyDefinition(displayName = "Age", isRequired = false)
                )
            )
            val record = DomainModelTestBuilder.record(data = JsonObject(emptyMap()))

            // When
            val errors = record.validate(table)

            // Then
            assertTrue(errors.isEmpty())
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
            val data = buildJsonObject {
                put("field", "value")
            }
            val createdAt = Instant.now().minusSeconds(60)
            val updatedAt = Instant.now().minusSeconds(30)

            val record1 = Record.fromJson(
                id = recordId,
                tableId = tableId,
                dataJson = data.toString(),
                position = 100f,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            val record2 = Record.fromJson(
                id = recordId,
                tableId = tableId,
                dataJson = data.toString(),
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
            val baseRecord = DomainModelTestBuilder.record()
            val differentId = baseRecord.copy(id = RecordId(UUID.randomUUID()))
            val differentTableId = baseRecord.copy(tableId = DomainModelTestBuilder.tableId())
            val differentData = baseRecord.copy(
                dataJson = buildJsonObject { put("different", "data") }.toString()
            )
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
            val originalRecord = DomainModelTestBuilder.record(position = 100f)
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
            assertEquals(originalRecord.data, copiedRecord.data) // unchanged
            assertEquals(newPosition, copiedRecord.position) // changed
            assertEquals(originalRecord.createdAt, copiedRecord.createdAt) // unchanged
            assertEquals(newUpdatedAt, copiedRecord.updatedAt) // changed
        }

        @Test
        @DisplayName("Should maintain data integrity during copy")
        fun `should maintain data integrity during copy`() {
            // Given
            val data = buildJsonObject {
                put("name", "Original Name")
                put("value", 123)
            }
            val originalRecord = DomainModelTestBuilder.record(data = data)

            // When
            val copiedRecord = originalRecord.copy(position = originalRecord.position + 100f)

            // Then
            assertEquals(originalRecord.data, copiedRecord.data)
            assertEquals(originalRecord.getDataJson(), copiedRecord.getDataJson())
            assertEquals("Original Name", copiedRecord.getValueAs<String>("name"))
            assertEquals(123, copiedRecord.getValueAs<Int>("value"))
        }

        @Test
        @DisplayName("Should implement toString with relevant information")
        fun `should implement toString with relevant information`() {
            // Given
            val data = buildJsonObject {
                put("name", "Test Record")
            }
            val record = DomainModelTestBuilder.record(data = data, position = 500f)

            // When
            val toString = record.toString()

            // Then
            assertTrue(toString.contains(record.id.toString()))
            assertTrue(toString.contains(record.tableId.toString()))
            assertTrue(toString.contains("500.0"))
        }
    }

    @Nested
    @DisplayName("Edge Cases and Complex Scenarios Tests")
    inner class EdgeCasesTests {

        @ParameterizedTest(name = "Should handle complex JSON data: case {index}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.RecordTest#jsonDataCases")
        fun `should handle complex JSON data`(jsonData: JsonObject) {
            // Given
            val tableId = DomainModelTestBuilder.tableId()

            // When & Then
            val record = Record(tableId = tableId, data = jsonData)
            assertEquals(jsonData, record.data)
        }

        @Test
        @DisplayName("Should handle deeply nested JSON structures")
        fun `should handle deeply nested JSON structures`() {
            // Given
            val deeplyNested = buildJsonObject {
                put("level1", buildJsonObject {
                    put("level2", buildJsonObject {
                        put("level3", buildJsonObject {
                            put("deep_value", "found it!")
                            put("deep_array", JsonArray(listOf(
                                JsonPrimitive(1),
                                JsonPrimitive(2),
                                buildJsonObject { put("nested_in_array", true) }
                            )))
                        })
                    })
                })
            }
            val record = DomainModelTestBuilder.record(data = deeplyNested)

            // When
            val level1 = record.getValue("level1") as? JsonObject
            val level2 = level1?.get("level2") as? JsonObject
            val level3 = level2?.get("level3") as? JsonObject

            // Then
            assertNotNull(level1)
            assertNotNull(level2)
            assertNotNull(level3)
            assertEquals("found it!", level3?.get("deep_value")?.jsonPrimitive?.content)
        }

        @Test
        @DisplayName("Should handle Unicode and special characters")
        fun `should handle Unicode and special characters`() {
            // Given
            val unicodeData = buildJsonObject {
                put("japanese", "こんにちは世界")
                put("emoji", "🎯🚀⭐")
                put("special_chars", "!@#$%^&*()_+-={}[]|\\:;\"'<>?,./")
                put("mixed", "Hello 世界 🌍!")
            }
            val record = DomainModelTestBuilder.record(data = unicodeData)

            // When & Then
            assertEquals("こんにちは世界", record.getValueAs<String>("japanese"))
            assertEquals("🎯🚀⭐", record.getValueAs<String>("emoji"))
            assertEquals("!@#$%^&*()_+-={}[]|\\:;\"'<>?,./", record.getValueAs<String>("special_chars"))
            assertEquals("Hello 世界 🌍!", record.getValueAs<String>("mixed"))
        }

        @Test
        @DisplayName("Should handle maximum position values")
        fun `should handle maximum position values`() {
            // Given & When
            val record = DomainModelTestBuilder.record(position = Record.MAX_POSITION)

            // Then
            assertEquals(Record.MAX_POSITION, record.position)
        }

        @Test
        @DisplayName("Should handle position calculations near boundaries")
        fun `should handle position calculations near boundaries`() {
            // Given
            val minRecord = DomainModelTestBuilder.record(position = Record.MIN_POSITION)
            val maxRecord = DomainModelTestBuilder.record(position = Record.MAX_POSITION)

            // When & Then
            assertTrue(Record.positionBetween(null, Record.MIN_POSITION) > 0)
            // Note: MAX_POSITION + POSITION_INCREMENT results in Float.MAX_VALUE (no overflow in this case)
            val nextAfterMax = Record.positionBetween(Record.MAX_POSITION, null)
            assertEquals(Record.MAX_POSITION + Record.POSITION_INCREMENT, nextAfterMax)
        }

        @Test
        @DisplayName("Should handle very large JSON data")
        fun `should handle very large JSON data`() {
            // Given
            val largeValue = "x".repeat(10000)
            val largeData = buildJsonObject {
                put("large_field", largeValue)
                (1..100).forEach { i ->
                    put("field_$i", "value_$i")
                }
            }

            // When & Then
            val record = DomainModelTestBuilder.record(data = largeData)
            assertEquals(largeValue, record.getValueAs<String>("large_field"))
            assertEquals(101, record.data.size) // 1 large field + 100 indexed fields
        }

        @Test
        @DisplayName("Should maintain immutability through operations")
        fun `should maintain immutability through operations`() {
            // Given
            val originalData = buildJsonObject {
                put("field1", "value1")
                put("field2", 42)
            }
            val originalRecord = DomainModelTestBuilder.record(data = originalData, position = 100f)

            // When performing various operations
            val afterSetValue = originalRecord.setValue("field3", JsonPrimitive("new_value"))
            val afterRemoveValue = originalRecord.removeValue("field1")
            val afterUpdatePosition = originalRecord.updatePosition(200f)
            val afterClear = originalRecord.clearValues()

            // Then - original record should remain unchanged
            assertEquals(originalData, originalRecord.data)
            assertEquals(100f, originalRecord.position)
            assertEquals(2, originalRecord.data.size)

            // And operations should create new instances
            assertNotEquals(originalRecord, afterSetValue)
            assertNotEquals(originalRecord, afterRemoveValue)
            assertNotEquals(originalRecord, afterUpdatePosition)
            assertNotEquals(originalRecord, afterClear)
        }
    }
}