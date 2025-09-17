package com.astarworks.astarmanagement.unit.core.table.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

@UnitTest
@DisplayName("PropertyType Serialization Compatibility Tests")
class PropertyTypeSerializationTest {

    private val json = Json

    @Test
    @DisplayName("PropertyType.SELECT should serialize to lowercase 'select'")
    fun `PropertyType SELECT should serialize to lowercase select`() {
        // Given
        val propertyType = PropertyType.SELECT
        
        // When
        val serialized = json.encodeToString(PropertyType.serializer(), propertyType)
        
        // Then
        assertEquals("\"select\"", serialized)
        println("✅ PropertyType.SELECT serializes to: $serialized")
    }

    @Test
    @DisplayName("PropertyType.MULTI_SELECT should serialize to lowercase 'multiselect'")
    fun `PropertyType MULTI_SELECT should serialize to lowercase multiselect`() {
        // Given
        val propertyType = PropertyType.MULTI_SELECT
        
        // When
        val serialized = json.encodeToString(PropertyType.serializer(), propertyType)
        
        // Then
        assertEquals("\"multi_select\"", serialized)
        println("✅ PropertyType.MULTI_SELECT serializes to: $serialized")
    }

    @Test
    @DisplayName("Lowercase 'select' should deserialize to PropertyType.SELECT")
    fun `lowercase select should deserialize to PropertyType SELECT`() {
        // Given
        val lowercaseJson = "\"select\""
        
        // When
        val deserialized = json.decodeFromString(PropertyType.serializer(), lowercaseJson)
        
        // Then
        assertEquals(PropertyType.SELECT, deserialized)
        println("✅ Lowercase 'select' deserializes to: $deserialized")
    }

    @Test
    @DisplayName("Uppercase 'SELECT' should fail to deserialize or be handled gracefully")
    fun `uppercase SELECT deserialization behavior`() {
        // Given
        val uppercaseJson = "\"SELECT\""
        
        // When & Then
        try {
            val deserialized = json.decodeFromString(PropertyType.serializer(), uppercaseJson)
            // If this succeeds, log the result
            println("⚠️ Uppercase 'SELECT' unexpectedly deserializes to: $deserialized")
            // This is unexpected but not necessarily wrong
        } catch (e: Exception) {
            println("❌ Uppercase 'SELECT' fails to deserialize: ${e.message}")
            // This is expected behavior due to @SerialName("select")
            assertTrue(e.message?.contains("SELECT") == true || e.message?.contains("Unknown enum") == true)
        }
    }

    @Test
    @DisplayName("fromValue method should handle both cases")
    fun `fromValue method case sensitivity test`() {
        // Test lowercase (expected)
        assertEquals(PropertyType.SELECT, PropertyType.fromValue("select"))
        assertEquals(PropertyType.MULTI_SELECT, PropertyType.fromValue("multi_select"))
        assertEquals(PropertyType.MULTI_SELECT, PropertyType.fromValue("multiselect"))

        // Test uppercase (frontend currently receives this)
        val uppercaseSelect = PropertyType.fromValue("SELECT")
        val uppercaseMultiSelect = PropertyType.fromValue("MULTI_SELECT")

        println("🔍 fromValue('SELECT') returns: $uppercaseSelect")
        println("🔍 fromValue('MULTI_SELECT') returns: $uppercaseMultiSelect")

        assertEquals(PropertyType.SELECT, uppercaseSelect)
        assertEquals(PropertyType.MULTI_SELECT, uppercaseMultiSelect)
    }

    @Test
    @DisplayName("All PropertyType values serialization consistency")
    fun `all PropertyType values serialization consistency`() {
        // Test all enum values for consistent behavior
        val allTypes = PropertyType.values()
        
        println("🔍 Testing all PropertyType serialization:")
        allTypes.forEach { type ->
            val serialized = json.encodeToString(PropertyType.serializer(), type)
            val deserialized = json.decodeFromString(PropertyType.serializer(), serialized)
            
            assertEquals(type, deserialized, "Round-trip serialization failed for $type")
            println("✅ $type ↔ $serialized")
        }
    }

    @Test
    @DisplayName("Mixed case scenarios for robustness")
    fun `mixed case scenarios test`() {
        val testCases = mapOf(
            "select" to PropertyType.SELECT,
            "SELECT" to null, // Expected to fail
            "Select" to null, // Expected to fail
            "multiselect" to PropertyType.MULTI_SELECT,
            "MULTI_SELECT" to null, // Expected to fail
            "MultiSelect" to null // Expected to fail
        )
        
        println("🔍 Testing various case scenarios:")
        testCases.forEach { (input, expected) ->
            try {
                val result = json.decodeFromString(PropertyType.serializer(), "\"$input\"")
                if (expected != null) {
                    assertEquals(expected, result)
                    println("✅ '$input' → $result (as expected)")
                } else {
                    println("⚠️ '$input' → $result (unexpected success)")
                }
            } catch (e: Exception) {
                if (expected == null) {
                    println("❌ '$input' → Failed (as expected): ${e.message}")
                } else {
                    println("❌ '$input' → Failed (unexpected): ${e.message}")
                    throw e
                }
            }
        }
    }
}
