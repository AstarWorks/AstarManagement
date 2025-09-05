package com.astarworks.astarmanagement.unit.core.table.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.domain.model.PropertyValue
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import kotlinx.serialization.json.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID
import java.util.stream.Stream

@UnitTest
@DisplayName("PropertyValue Domain Model Tests")
class PropertyValueTest {
    
    companion object {
        @JvmStatic
        fun invalidKeyCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun validTextValues(): Stream<JsonElement> {
            return Stream.of(
                JsonPrimitive("simple text"),
                JsonPrimitive(""),
                JsonPrimitive("Unicode テキスト 🎯"),
                JsonPrimitive("Special chars: !@#$%^&*()"),
                JsonPrimitive("a".repeat(1000)), // long text
                JsonNull
            )
        }
        
        @JvmStatic
        fun validNumberValues(): Stream<JsonElement> {
            return Stream.of(
                JsonPrimitive(42),
                JsonPrimitive(42.5),
                JsonPrimitive(0),
                JsonPrimitive(-42),
                JsonPrimitive(Double.MAX_VALUE),
                JsonPrimitive(Double.MIN_VALUE),
                JsonNull
            )
        }
        
        @JvmStatic
        fun validBooleanValues(): Stream<JsonElement> {
            return Stream.of(
                JsonPrimitive(true),
                JsonPrimitive(false),
                JsonNull
            )
        }
        
        @JvmStatic
        fun invalidTextValues(): Stream<JsonElement> {
            return Stream.of(
                JsonPrimitive(42), // number instead of text
                JsonPrimitive(true), // boolean instead of text
                JsonArray(listOf(JsonPrimitive("text"))), // array instead of text
                buildJsonObject { put("key", "value") } // object instead of text
            )
        }
        
        @JvmStatic
        fun invalidNumberValues(): Stream<JsonElement> {
            return Stream.of(
                JsonPrimitive("not a number"), // text instead of number
                JsonPrimitive(true), // boolean instead of number
                JsonArray(listOf(JsonPrimitive(42))), // array instead of number
                buildJsonObject { put("value", 42) } // object instead of number
            )
        }
        
        @JvmStatic
        fun invalidBooleanValues(): Stream<JsonElement> {
            return Stream.of(
                JsonPrimitive(1), // number instead of boolean
                JsonArray(listOf(JsonPrimitive(true))), // array instead of boolean
                buildJsonObject { put("value", true) } // object instead of boolean
            )
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create PropertyValue with valid parameters")
        fun `should create PropertyValue with valid parameters`() {
            // Given
            val key = "test_property"
            val value = JsonPrimitive("test value")
            val typeId = "text"
            
            // When
            val propertyValue = DomainModelTestBuilder.propertyValue(
                key = key,
                value = value,
                typeId = typeId
            )
            
            // Then
            assertEquals(key, propertyValue.key)
            assertEquals(value, propertyValue.value)
            assertEquals(typeId, propertyValue.typeId)
        }
        
        @Test
        @DisplayName("Should create PropertyValue without typeId")
        fun `should create PropertyValue without typeId`() {
            // Given
            val key = "test_property"
            val value = JsonPrimitive("test value")
            
            // When
            val propertyValue = DomainModelTestBuilder.propertyValue(
                key = key,
                value = value,
                typeId = null
            )
            
            // Then
            assertEquals(key, propertyValue.key)
            assertEquals(value, propertyValue.value)
            assertNull(propertyValue.typeId)
        }
        
        @ParameterizedTest(name = "Should reject blank key: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyValueTest#invalidKeyCases")
        fun `should reject blank keys`(invalidKey: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyValue(key = invalidKey)
            }
            assertEquals("Property key must not be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should handle null value")
        fun `should handle null value`() {
            // When
            val propertyValue = DomainModelTestBuilder.propertyValue(
                value = JsonNull,
                typeId = "text"
            )
            
            // Then
            assertEquals(JsonNull, propertyValue.value)
            assertNull(propertyValue.asString())
        }
    }
    
    @Nested
    @DisplayName("Type Validation Tests")
    inner class TypeValidationTests {
        
        @ParameterizedTest(name = "Should accept valid text value: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyValueTest#validTextValues")
        fun `should accept valid text values`(validValue: JsonElement) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyValue(
                    value = validValue,
                    typeId = "text"
                )
            }
        }
        
        @ParameterizedTest(name = "Should reject invalid text value: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyValueTest#invalidTextValues")
        fun `should reject invalid text values`(invalidValue: JsonElement) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyValue(
                    value = invalidValue,
                    typeId = "text"
                )
            }
        }
        
        @ParameterizedTest(name = "Should accept valid number value: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyValueTest#validNumberValues")
        fun `should accept valid number values`(validValue: JsonElement) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyValue(
                    value = validValue,
                    typeId = "number"
                )
            }
        }
        
        @ParameterizedTest(name = "Should reject invalid number value: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyValueTest#invalidNumberValues")
        fun `should reject invalid number values`(invalidValue: JsonElement) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyValue(
                    value = invalidValue,
                    typeId = "number"
                )
            }
        }
        
        @ParameterizedTest(name = "Should accept valid boolean value: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyValueTest#validBooleanValues")
        fun `should accept valid boolean values`(validValue: JsonElement) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyValue(
                    value = validValue,
                    typeId = "checkbox"
                )
            }
        }
        
        @ParameterizedTest(name = "Should reject invalid boolean value: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyValueTest#invalidBooleanValues")
        fun `should reject invalid boolean values`(invalidValue: JsonElement) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyValue(
                    value = invalidValue,
                    typeId = "checkbox"
                )
            }
        }
        
        @Test
        @DisplayName("Should validate multi_select array values")
        fun `should validate multi_select array values`() {
            // Given
            val validArray = JsonArray(listOf(
                JsonPrimitive("option1"),
                JsonPrimitive("option2")
            ))
            val invalidArray = JsonArray(listOf(
                JsonPrimitive(42), // number instead of string
                JsonPrimitive("option2")
            ))
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyValue(
                    value = validArray,
                    typeId = "multi_select"
                )
            }
            
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyValue(
                    value = invalidArray,
                    typeId = "multi_select"
                )
            }
        }
        
        @Test
        @DisplayName("Should validate user type values")
        fun `should validate user type values`() {
            // Given
            val validUserId = JsonPrimitive(UUID.randomUUID().toString())
            val validUserArray = JsonArray(listOf(validUserId))
            val invalidUserValue = JsonPrimitive(42)
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyValue(
                    value = validUserId,
                    typeId = "user"
                )
            }
            
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyValue(
                    value = validUserArray,
                    typeId = "user"
                )
            }
            
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyValue(
                    value = invalidUserValue,
                    typeId = "user"
                )
            }
        }
    }
    
    @Nested
    @DisplayName("Value Conversion Tests")
    inner class ValueConversionTests {
        
        @Test
        @DisplayName("Should convert values with getAs method")
        fun `should convert values with getAs method`() {
            // Given
            val stringValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive("test"))
            val numberValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive(42))
            val booleanValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive(true))
            val nullValue = DomainModelTestBuilder.propertyValue(value = JsonNull)
            
            // When & Then
            assertEquals("test", stringValue.getAs<String>())
            assertEquals(42, numberValue.getAs<Int>())
            assertTrue(booleanValue.getAs<Boolean>()!!)
            assertNull(nullValue.getAs<String>())
        }
        
        @Test
        @DisplayName("Should convert string values with asString")
        fun `should convert string values with asString`() {
            // Given
            val stringValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive("test"))
            val numberValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive(42))
            val nullValue = DomainModelTestBuilder.propertyValue(value = JsonNull)
            
            // When & Then
            assertEquals("test", stringValue.asString())
            assertEquals("42", numberValue.asString())
            assertNull(nullValue.asString())
        }
        
        @Test
        @DisplayName("Should convert number values with asNumber")
        fun `should convert number values with asNumber`() {
            // Given
            val intValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive(42))
            val doubleValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive(3.14))
            val stringValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive("not a number"))
            val nullValue = DomainModelTestBuilder.propertyValue(value = JsonNull)
            
            // When & Then
            assertEquals(42.0, intValue.asNumber()?.toDouble())
            assertEquals(3.14, doubleValue.asNumber()!!.toDouble(), 0.001)
            assertNull(stringValue.asNumber())
            assertNull(nullValue.asNumber())
        }
        
        @Test
        @DisplayName("Should convert boolean values with asBoolean")
        fun `should convert boolean values with asBoolean`() {
            // Given
            val trueValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive(true))
            val falseValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive(false))
            val stringValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive("true"))
            val nullValue = DomainModelTestBuilder.propertyValue(value = JsonNull)
            
            // When & Then
            assertTrue(trueValue.asBoolean()!!)
            assertFalse(falseValue.asBoolean()!!)
            assertTrue(stringValue.asBoolean()!!) // String "true" is converted to boolean true
            assertNull(nullValue.asBoolean())
        }
        
        @Test
        @DisplayName("Should convert array values with asList")
        fun `should convert array values with asList`() {
            // Given
            val arrayValue = DomainModelTestBuilder.propertyValue(
                value = JsonArray(listOf(
                    JsonPrimitive("item1"),
                    JsonPrimitive("item2"),
                    JsonPrimitive(42)
                ))
            )
            val stringValue = DomainModelTestBuilder.propertyValue(value = JsonPrimitive("not an array"))
            
            // When & Then
            val list = arrayValue.asList()
            assertNotNull(list)
            assertEquals(3, list!!.size)
            assertEquals(JsonPrimitive("item1"), list[0])
            
            assertNull(stringValue.asList())
        }
        
        @Test
        @DisplayName("Should convert string array values with asStringList")
        fun `should convert string array values with asStringList`() {
            // Given
            val stringArrayValue = DomainModelTestBuilder.propertyValue(
                value = JsonArray(listOf(
                    JsonPrimitive("item1"),
                    JsonPrimitive("item2")
                ))
            )
            val mixedArrayValue = DomainModelTestBuilder.propertyValue(
                value = JsonArray(listOf(
                    JsonPrimitive("item1"),
                    JsonPrimitive(42), // non-string element
                    JsonPrimitive("item2")
                ))
            )
            
            // When & Then
            val stringList = stringArrayValue.asStringList()
            assertEquals(listOf("item1", "item2"), stringList)
            
            val mixedList = mixedArrayValue.asStringList()
            assertEquals(listOf("item1", "42", "item2"), mixedList) // Non-string elements converted to strings
        }
    }
    
    @Nested
    @DisplayName("Factory Method Tests")
    inner class FactoryMethodTests {
        
        @Test
        @DisplayName("Should create text property value with factory method")
        fun `should create text property value with factory method`() {
            // When
            val textValue = PropertyValue.text("description", "Sample text")
            val nullTextValue = PropertyValue.text("empty_text", null)
            
            // Then
            assertEquals("description", textValue.key)
            assertEquals("Sample text", textValue.asString())
            assertEquals("text", textValue.typeId)
            
            assertEquals("empty_text", nullTextValue.key)
            assertNull(nullTextValue.asString())
            assertEquals(JsonNull, nullTextValue.value)
        }
        
        @Test
        @DisplayName("Should create number property value with factory method")
        fun `should create number property value with factory method`() {
            // When
            val intValue = PropertyValue.number("count", 42)
            val doubleValue = PropertyValue.number("price", 19.99)
            val nullValue = PropertyValue.number("empty_number", null)
            
            // Then
            assertEquals("count", intValue.key)
            assertEquals(42, intValue.asNumber()?.toInt())
            assertEquals("number", intValue.typeId)
            
            assertEquals("price", doubleValue.key)
            assertEquals(19.99, doubleValue.asNumber()!!.toDouble(), 0.001)
            
            assertNull(nullValue.asNumber())
        }
        
        @Test
        @DisplayName("Should create checkbox property value with factory method")
        fun `should create checkbox property value with factory method`() {
            // When
            val trueValue = PropertyValue.checkbox("is_active", true)
            val falseValue = PropertyValue.checkbox("is_deleted", false)
            
            // Then
            assertEquals("is_active", trueValue.key)
            assertTrue(trueValue.asBoolean()!!)
            assertEquals("checkbox", trueValue.typeId)
            
            assertEquals("is_deleted", falseValue.key)
            assertFalse(falseValue.asBoolean()!!)
        }
        
        @Test
        @DisplayName("Should create date property value with factory method")
        fun `should create date property value with factory method`() {
            // Given
            val testDate = LocalDate.of(2024, 12, 25)
            
            // When
            val dateValue = PropertyValue.date("due_date", testDate)
            val nullDateValue = PropertyValue.date("empty_date", null)
            
            // Then
            assertEquals("due_date", dateValue.key)
            assertEquals("2024-12-25", dateValue.asString())
            assertEquals("date", dateValue.typeId)
            
            assertNull(nullDateValue.asString())
        }
        
        @Test
        @DisplayName("Should create datetime property value with factory method")
        fun `should create datetime property value with factory method`() {
            // Given
            val testDateTime = LocalDateTime.of(2024, 12, 25, 14, 30, 0)
            
            // When
            val datetimeValue = PropertyValue.datetime("created_at", testDateTime)
            val nullDatetimeValue = PropertyValue.datetime("empty_datetime", null)
            
            // Then
            assertEquals("created_at", datetimeValue.key)
            assertEquals("2024-12-25T14:30", datetimeValue.asString())
            assertEquals("datetime", datetimeValue.typeId)
            
            assertNull(nullDatetimeValue.asString())
        }
        
        @Test
        @DisplayName("Should create select property value with factory method")
        fun `should create select property value with factory method`() {
            // When
            val selectValue = PropertyValue.select("priority", "high")
            val nullSelectValue = PropertyValue.select("empty_select", null)
            
            // Then
            assertEquals("priority", selectValue.key)
            assertEquals("high", selectValue.asString())
            assertEquals("select", selectValue.typeId)
            
            assertNull(nullSelectValue.asString())
        }
        
        @Test
        @DisplayName("Should create multi-select property value with factory method")
        fun `should create multi-select property value with factory method`() {
            // Given
            val options = listOf("tag1", "tag2", "tag3")
            
            // When
            val multiSelectValue = PropertyValue.multiSelect("tags", options)
            
            // Then
            assertEquals("tags", multiSelectValue.key)
            assertEquals("multi_select", multiSelectValue.typeId)
            
            val retrievedList = multiSelectValue.asStringList()
            assertEquals(options, retrievedList)
        }
        
        @Test
        @DisplayName("Should create user property value with factory method")
        fun `should create user property value with factory method`() {
            // Given
            val userId = UUID.randomUUID()
            
            // When
            val userValue = PropertyValue.user("assigned_to", userId)
            val nullUserValue = PropertyValue.user("empty_user", null)
            
            // Then
            assertEquals("assigned_to", userValue.key)
            assertEquals(userId.toString(), userValue.asString())
            assertEquals("user", userValue.typeId)
            
            assertNull(nullUserValue.asString())
        }
    }
    
    @Nested
    @DisplayName("JSON Conversion Tests")
    inner class JsonConversionTests {
        
        @Test
        @DisplayName("Should create PropertyValue list from JsonObject")
        fun `should create PropertyValue list from JsonObject`() {
            // Given
            val jsonData = buildJsonObject {
                put("title", "Sample Title")
                put("count", 42)
                put("is_active", true)
                put("tags", JsonArray(listOf(
                    JsonPrimitive("tag1"),
                    JsonPrimitive("tag2")
                )))
            }
            
            // When
            val propertyValues = PropertyValue.fromJsonObject(jsonData)
            
            // Then
            assertEquals(4, propertyValues.size)
            
            val titleProperty = propertyValues.find { it.key == "title" }!!
            assertEquals("Sample Title", titleProperty.asString())
            
            val countProperty = propertyValues.find { it.key == "count" }!!
            assertEquals(42, countProperty.asNumber()?.toInt())
            
            val activeProperty = propertyValues.find { it.key == "is_active" }!!
            assertTrue(activeProperty.asBoolean()!!)
            
            val tagsProperty = propertyValues.find { it.key == "tags" }!!
            assertEquals(2, tagsProperty.asList()?.size)
        }
        
        @Test
        @DisplayName("Should convert PropertyValue list to JsonObject")
        fun `should convert PropertyValue list to JsonObject`() {
            // Given
            val propertyValues = listOf(
                PropertyValue.text("title", "Sample Title"),
                PropertyValue.number("count", 42),
                PropertyValue.checkbox("is_active", true),
                PropertyValue.multiSelect("tags", listOf("tag1", "tag2"))
            )
            
            // When
            val jsonObject = PropertyValue.toJsonObject(propertyValues)
            
            // Then
            assertEquals(4, jsonObject.size)
            assertEquals("Sample Title", jsonObject["title"]?.jsonPrimitive?.content)
            assertEquals(42, jsonObject["count"]?.jsonPrimitive?.int)
            assertTrue(jsonObject["is_active"]?.jsonPrimitive?.boolean!!)
            assertEquals(2, (jsonObject["tags"] as JsonArray).size)
        }
        
        @Test
        @DisplayName("Should handle empty JsonObject conversion")
        fun `should handle empty JsonObject conversion`() {
            // Given
            val emptyJson = JsonObject(emptyMap())
            val emptyList = emptyList<PropertyValue>()
            
            // When & Then
            val propertyValues = PropertyValue.fromJsonObject(emptyJson)
            assertTrue(propertyValues.isEmpty())
            
            val jsonObject = PropertyValue.toJsonObject(emptyList)
            assertTrue(jsonObject.isEmpty())
        }
        
        @Test
        @DisplayName("Should handle roundtrip conversion")
        fun `should handle roundtrip conversion`() {
            // Given
            val originalJson = buildJsonObject {
                put("text_field", "Sample text")
                put("number_field", 42.5)
                put("boolean_field", false)
                put("null_field", JsonNull)
                put("array_field", JsonArray(listOf(
                    JsonPrimitive("item1"),
                    JsonPrimitive("item2")
                )))
            }
            
            // When
            val propertyValues = PropertyValue.fromJsonObject(originalJson)
            val convertedJson = PropertyValue.toJsonObject(propertyValues)
            
            // Then
            assertEquals(originalJson, convertedJson)
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val key = "same_property"
            val value = JsonPrimitive("same_value")
            val typeId = "text"
            
            val property1 = DomainModelTestBuilder.propertyValue(
                key = key,
                value = value,
                typeId = typeId
            )
            val property2 = DomainModelTestBuilder.propertyValue(
                key = key,
                value = value,
                typeId = typeId
            )
            
            // Then
            assertEquals(property1, property2)
            assertEquals(property1.hashCode(), property2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseProperty = DomainModelTestBuilder.propertyValue()
            val differentKey = baseProperty.copy(key = "different_key")
            val differentValue = baseProperty.copy(value = JsonPrimitive("different_value"))
            val differentType = baseProperty.copy(value = JsonPrimitive(42), typeId = "number")
            
            // Then
            assertNotEquals(baseProperty, differentKey)
            assertNotEquals(baseProperty, differentValue)
            assertNotEquals(baseProperty, differentType)
        }
        
        @Test
        @DisplayName("Should implement toString with all properties")
        fun `should implement toString with all properties`() {
            // Given
            val property = DomainModelTestBuilder.propertyValue(
                key = "test_key",
                value = JsonPrimitive("test_value"),
                typeId = "text"
            )
            
            // When
            val toString = property.toString()
            
            // Then
            assertTrue(toString.contains("test_key"))
            assertTrue(toString.contains("test_value"))
            assertTrue(toString.contains("text"))
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalProperty = DomainModelTestBuilder.propertyValue(
                key = "original_key",
                value = JsonPrimitive("original_value")
            )
            
            // When
            val copiedProperty = originalProperty.copy(
                key = "copied_key",
                value = JsonPrimitive("copied_value")
            )
            
            // Then
            assertEquals("copied_key", copiedProperty.key)
            assertEquals("copied_value", copiedProperty.asString())
            // Original should remain unchanged
            assertEquals("original_key", originalProperty.key)
        }
    }
    
    @Nested
    @DisplayName("Edge Cases Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle complex JSON values")
        fun `should handle complex JSON values`() {
            // Given
            val complexObject = buildJsonObject {
                put("nested", buildJsonObject {
                    put("value", 42)
                    put("active", true)
                })
                put("array", JsonArray(listOf(
                    JsonPrimitive("item1"),
                    buildJsonObject { put("nested", "value") }
                )))
            }
            
            // When
            val property = DomainModelTestBuilder.propertyValue(value = complexObject)
            
            // Then
            assertEquals(complexObject, property.value)
            // Should handle toString gracefully
            assertDoesNotThrow { property.asString() }
        }
        
        @Test
        @DisplayName("Should handle Unicode in all value types")
        fun `should handle Unicode in all value types`() {
            // Given
            val unicodeString = "テスト値 🎯 José María"
            val unicodeKey = "テストキー"
            
            // When
            val property = PropertyValue.text(unicodeKey, unicodeString)
            
            // Then
            assertEquals(unicodeKey, property.key)
            assertEquals(unicodeString, property.asString())
        }
        
        @Test
        @DisplayName("Should handle boundary numeric values")
        fun `should handle boundary numeric values`() {
            // Given
            val boundaryValues = DomainModelTestBuilder.boundaryNumbers()
            
            // When & Then
            boundaryValues.forEach { (description, number) ->
                assertDoesNotThrow {
                    val property = PropertyValue.number("test", number)
                    assertEquals(number.toDouble(), property.asNumber()!!.toDouble(), 0.001)
                }
            }
        }
        
        @Test
        @DisplayName("Should handle type conversion edge cases")
        fun `should handle type conversion edge cases`() {
            // Given
            val edgeCases = mapOf(
                "empty_string" to JsonPrimitive(""),
                "zero" to JsonPrimitive(0),
                "false" to JsonPrimitive(false),
                "empty_array" to JsonArray(emptyList()),
                "empty_object" to buildJsonObject { }
            )
            
            // When & Then
            edgeCases.forEach { (description, value) ->
                val property = DomainModelTestBuilder.propertyValue(value = value)
                
                // Should not throw exceptions on conversion attempts
                assertDoesNotThrow { 
                    property.asString() 
                }
                assertDoesNotThrow { 
                    property.asNumber() 
                }
                assertDoesNotThrow { 
                    property.asBoolean() 
                }
                assertDoesNotThrow { 
                    property.asList() 
                }
            }
        }
        
        @Test
        @DisplayName("Should handle type validation without throwing for unknown types")
        fun `should handle type validation without throwing for unknown types`() {
            // When & Then - Unknown type should not cause validation error
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyValue(
                    value = JsonPrimitive("any value"),
                    typeId = "unknown_type"
                )
            }
        }
    }
}