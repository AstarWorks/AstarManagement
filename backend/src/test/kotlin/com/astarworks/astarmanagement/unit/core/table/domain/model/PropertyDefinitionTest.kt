package com.astarworks.astarmanagement.unit.core.table.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.astarworks.astarmanagement.core.table.domain.model.SelectOption
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import kotlinx.serialization.json.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
import java.util.stream.Stream

@UnitTest
@DisplayName("PropertyDefinition Domain Model Tests")
class PropertyDefinitionTest {
    
    companion object {
        @JvmStatic
        fun validPropertyTypes(): Stream<String> {
            return DomainModelTestBuilder.validPropertyType().stream()
        }
        
        @JvmStatic
        fun invalidPropertyTypes(): Stream<String> {
            return DomainModelTestBuilder.invalidPropertyType().stream()
        }
        
        @JvmStatic
        fun invalidDisplayNameCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun longDisplayNameCases(): Stream<String> {
            return Stream.of(
                "a".repeat(255),  // exactly at limit
                "a".repeat(256)   // over limit
            )
        }
        
        @JvmStatic
        fun textTypeIds(): Stream<PropertyType> {
            return Stream.of(PropertyType.TEXT, PropertyType.LONG_TEXT)
        }
        
        @JvmStatic
        fun selectTypeIds(): Stream<PropertyType> {
            return Stream.of(PropertyType.SELECT, PropertyType.MULTI_SELECT)
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create PropertyDefinition with valid parameters")
        fun `should create PropertyDefinition with valid parameters`() {
            // Given
            val type = PropertyType.TEXT
            val displayName = "Test Property"
            val config = buildJsonObject {
                put("required", true)
                put("maxLength", 255)
            }
            
            // When
            val property = DomainModelTestBuilder.propertyDefinition(
                type = type,
                displayName = displayName,
                config = config
            )
            
            // Then
            assertEquals(type, property.type)
            assertEquals(displayName, property.displayName)
            assertEquals(config, property.config)
        }
        
        @Test
        @DisplayName("Should create PropertyDefinition with empty config")
        fun `should create PropertyDefinition with empty config`() {
            // Given
            val type = PropertyType.TEXT
            val displayName = "Simple Property"
            
            // When
            val property = DomainModelTestBuilder.propertyDefinition(
                type = type,
                displayName = displayName,
                config = JsonObject(emptyMap())
            )
            
            // Then
            assertEquals(type, property.type)
            assertEquals(displayName, property.displayName)
            assertTrue(property.config.isEmpty())
        }
        
        @ParameterizedTest(name = "Should accept valid property type: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyDefinitionTest#validPropertyTypes")
        fun `should accept valid property types`(validType: String) {
            // When & Then
            assertDoesNotThrow {
                val propertyType = PropertyType.fromValue(validType) ?: throw IllegalArgumentException("Unknown type: $validType")
                DomainModelTestBuilder.propertyDefinition(type = propertyType)
            }
        }
        
        @ParameterizedTest(name = "Should reject invalid property type: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyDefinitionTest#invalidPropertyTypes")
        fun `should reject invalid property types`(invalidType: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                PropertyType.fromValue(invalidType) ?: throw IllegalArgumentException("Unknown type ID: $invalidType")
            }
            assertTrue(exception.message?.contains("Unknown type ID") == true)
        }
        
        @ParameterizedTest(name = "Should reject blank display name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyDefinitionTest#invalidDisplayNameCases")
        fun `should reject blank display names`(invalidDisplayName: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyDefinition(displayName = invalidDisplayName)
            }
            assertEquals("Display name must not be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should accept display name at character limit")
        fun `should accept display name at character limit`() {
            // Given
            val displayNameAt255 = "a".repeat(255)
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.propertyDefinition(displayName = displayNameAt255)
            }
        }
        
        @Test
        @DisplayName("Should reject display name over character limit")
        fun `should reject display name over character limit`() {
            // Given
            val displayNameOver255 = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.propertyDefinition(displayName = displayNameOver255)
            }
            assertEquals("Display name too long (max 255 characters)", exception.message)
        }
    }
    
    @Nested
    @DisplayName("Property Accessor Tests")
    inner class PropertyAccessorTests {
        
        @Test
        @DisplayName("Should access required property correctly")
        fun `should access required property correctly`() {
            // Given
            val requiredProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("required", true) }
            )
            val optionalProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("required", false) }
            )
            val noRequiredProperty = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            assertTrue(requiredProperty.isRequired)
            assertFalse(optionalProperty.isRequired)
            assertFalse(noRequiredProperty.isRequired) // Default false
        }
        
        @Test
        @DisplayName("Should access maxLength property correctly")
        fun `should access maxLength property correctly`() {
            // Given
            val propertyWithMaxLength = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("maxLength", 100) }
            )
            val propertyWithoutMaxLength = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            assertEquals(100, propertyWithMaxLength.maxLength)
            assertNull(propertyWithoutMaxLength.maxLength)
        }
        
        @Test
        @DisplayName("Should access numeric constraints correctly")
        fun `should access numeric constraints correctly`() {
            // Given
            val numericProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject {
                    put("min", 0.0)
                    put("max", 100.0)
                    put("precision", 2)
                }
            )
            
            // When & Then
            assertEquals(0.0, numericProperty.minValue?.toDouble())
            assertEquals(100.0, numericProperty.maxValue?.toDouble())
            assertEquals(2, numericProperty.precision)
        }
        
        @Test
        @DisplayName("Should access default value correctly")
        fun `should access default value correctly`() {
            // Given
            val propertyWithDefault = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("default", "default_value") }
            )
            val propertyWithoutDefault = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            assertEquals(JsonPrimitive("default_value"), propertyWithDefault.defaultValue)
            assertNull(propertyWithoutDefault.defaultValue)
        }
        
        @Test
        @DisplayName("Should access placeholder correctly")
        fun `should access placeholder correctly`() {
            // Given
            val propertyWithPlaceholder = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("placeholder", "Enter text here") }
            )
            val propertyWithoutPlaceholder = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            assertEquals("Enter text here", propertyWithPlaceholder.placeholder)
            assertNull(propertyWithoutPlaceholder.placeholder)
        }
        
        @Test
        @DisplayName("Should access multiple selection flag correctly")
        fun `should access multiple selection flag correctly`() {
            // Given
            val multipleProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("multiple", true) }
            )
            val singleProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("multiple", false) }
            )
            val noMultipleProperty = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            assertTrue(multipleProperty.isMultiple)
            assertFalse(singleProperty.isMultiple)
            assertFalse(noMultipleProperty.isMultiple) // Default false
        }
        
        @Test
        @DisplayName("Should access select options correctly")
        fun `should access select options correctly`() {
            // Given
            val options = DomainModelTestBuilder.selectOptions()
            val selectProperty = DomainModelTestBuilder.selectPropertyDefinition(options = options)
            val propertyWithoutOptions = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            val retrievedOptions = selectProperty.options
            assertNotNull(retrievedOptions)
            assertEquals(3, retrievedOptions!!.size)
            assertEquals("option1", retrievedOptions[0].value)
            assertEquals("Option 1", retrievedOptions[0].label)
            
            assertNull(propertyWithoutOptions.options)
        }
        
        @Test
        @DisplayName("Should handle invalid options format gracefully")
        fun `should handle invalid options format gracefully`() {
            // Given
            val propertyWithInvalidOptions = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject {
                    put("options", JsonArray(listOf(JsonPrimitive("invalid_option_format"))))
                }
            )
            
            // When & Then
            assertNull(propertyWithInvalidOptions.options)
        }
    }
    
    @Nested
    @DisplayName("Configuration Management Tests")
    inner class ConfigurationTests {
        
        @Test
        @DisplayName("Should update config with withConfig method")
        fun `should update config with withConfig method`() {
            // Given
            val originalProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("required", false) }
            )
            
            // When
            val updatedProperty = originalProperty.withConfig {
                put("required", true)
                put("maxLength", 100)
            }
            
            // Then
            assertTrue(updatedProperty.isRequired)
            assertEquals(100, updatedProperty.maxLength)
            // Original should remain unchanged
            assertFalse(originalProperty.isRequired)
        }
        
        @Test
        @DisplayName("Should preserve existing config in withConfig")
        fun `should preserve existing config in withConfig`() {
            // Given
            val originalProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject {
                    put("required", true)
                    put("placeholder", "Enter text")
                }
            )
            
            // When
            val updatedProperty = originalProperty.withConfig {
                put("maxLength", 255) // Add new config
            }
            
            // Then
            assertTrue(updatedProperty.isRequired) // Preserved
            assertEquals("Enter text", updatedProperty.placeholder) // Preserved
            assertEquals(255, updatedProperty.maxLength) // Added
        }
        
        @Test
        @DisplayName("Should update single config value with withConfigValue")
        fun `should update single config value with withConfigValue`() {
            // Given
            val originalProperty = DomainModelTestBuilder.propertyDefinition()
            
            // When
            val updatedProperty = originalProperty.withConfigValue("required", JsonPrimitive(true))
            
            // Then
            assertTrue(updatedProperty.isRequired)
        }
        
        @Test
        @DisplayName("Should make property required with asRequired")
        fun `should make property required with asRequired`() {
            // Given
            val optionalProperty = DomainModelTestBuilder.propertyDefinition()
            
            // When
            val requiredProperty = optionalProperty.asRequired()
            
            // Then
            assertTrue(requiredProperty.isRequired)
            assertFalse(optionalProperty.isRequired) // Original unchanged
        }
        
        @Test
        @DisplayName("Should make property optional with asOptional")
        fun `should make property optional with asOptional`() {
            // Given
            val requiredProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("required", true) }
            )
            
            // When
            val optionalProperty = requiredProperty.asOptional()
            
            // Then
            assertFalse(optionalProperty.isRequired)
            assertTrue(requiredProperty.isRequired) // Original unchanged
        }
    }
    
    @Nested
    @DisplayName("Type-Specific Validation Tests")
    inner class TypeSpecificValidationTests {
        
        @Test
        @DisplayName("Should validate text type constraints")
        fun `should validate text type constraints`() {
            // Given
            val validTextProperty = DomainModelTestBuilder.textPropertyDefinition(maxLength = 100)
            val invalidTextProperty = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.TEXT,
                config = buildJsonObject { put("maxLength", -5) }
            )
            val tooLongTextProperty = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.TEXT,
                config = buildJsonObject { put("maxLength", 10000) }
            )
            
            // When & Then
            assertTrue(validTextProperty.isValid())
            
            val invalidErrors = invalidTextProperty.validate()
            assertFalse(invalidErrors.isEmpty())
            assertTrue(invalidErrors.any { it.contains("Max length must be positive") })
            
            val tooLongErrors = tooLongTextProperty.validate()
            assertTrue(tooLongErrors.any { it.contains("should not exceed 5000") })
        }
        
        @Test
        @DisplayName("Should validate number type constraints")
        fun `should validate number type constraints`() {
            // Given
            val validNumberProperty = DomainModelTestBuilder.numberPropertyDefinition(
                min = 0.0, max = 100.0, precision = 2
            )
            val invalidRangeProperty = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.NUMBER,
                config = buildJsonObject {
                    put("min", 100.0)
                    put("max", 50.0) // min > max
                }
            )
            val invalidPrecisionProperty = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.NUMBER,
                config = buildJsonObject { put("precision", 15) } // > 10
            )
            
            // When & Then
            assertTrue(validNumberProperty.isValid())
            
            val rangeErrors = invalidRangeProperty.validate()
            assertTrue(rangeErrors.any { it.contains("Min value cannot be greater than max value") })
            
            val precisionErrors = invalidPrecisionProperty.validate()
            assertTrue(precisionErrors.any { it.contains("Precision must be between 0 and 10") })
        }
        
        @Test
        @DisplayName("Should validate select type constraints")
        fun `should validate select type constraints`() {
            // Given
            val validSelectProperty = DomainModelTestBuilder.selectPropertyDefinition()
            val emptyOptionsProperty = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.SELECT,
                config = buildJsonObject {
                    put("options", JsonArray(emptyList()))
                }
            )
            val noOptionsProperty = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.SELECT
            )
            
            // When & Then
            assertTrue(validSelectProperty.isValid())
            
            val emptyErrors = emptyOptionsProperty.validate()
            assertTrue(emptyErrors.any { it.contains("must have at least one option") })
            
            val noOptionsErrors = noOptionsProperty.validate()
            assertTrue(noOptionsErrors.any { it.contains("must have at least one option") })
        }
        
        @ParameterizedTest(name = "Should validate text types: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyDefinitionTest#textTypeIds")
        fun `should validate text types with max length`(type: PropertyType) {
            // Given
            val property = DomainModelTestBuilder.propertyDefinition(
                type = type,
                config = buildJsonObject { put("maxLength", 0) }
            )
            
            // When
            val errors = property.validate()
            
            // Then
            assertFalse(errors.isEmpty())
            assertTrue(errors.any { it.contains("Max length must be positive") })
        }
        
        @ParameterizedTest(name = "Should validate select types: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.PropertyDefinitionTest#selectTypeIds")
        fun `should validate select types require options`(type: PropertyType) {
            // Given
            val property = DomainModelTestBuilder.propertyDefinition(type = type)
            
            // When
            val errors = property.validate()
            
            // Then
            assertFalse(errors.isEmpty())
            assertTrue(errors.any { it.contains("must have at least one option") })
        }
    }
    
    @Nested
    @DisplayName("Advanced Property Configuration Tests")
    inner class AdvancedConfigurationTests {
        
        @Test
        @DisplayName("Should handle complex select property configuration")
        fun `should handle complex select property configuration`() {
            // Given
            val options = listOf(
                DomainModelTestBuilder.selectOption("low", "Low Priority", "#00FF00"),
                DomainModelTestBuilder.selectOption("medium", "Medium Priority", "#FFFF00"),
                DomainModelTestBuilder.selectOption("high", "High Priority", "#FF0000")
            )
            val selectProperty = DomainModelTestBuilder.selectPropertyDefinition(
                displayName = "Priority Level",
                options = options,
                isRequired = true,
                isMultiple = false
            )
            
            // When & Then
            assertTrue(selectProperty.isRequired)
            assertFalse(selectProperty.isMultiple)
            assertEquals("Priority Level", selectProperty.displayName)
            assertEquals(PropertyType.SELECT, selectProperty.type)
            
            val retrievedOptions = selectProperty.options!!
            assertEquals(3, retrievedOptions.size)
            assertEquals("low", retrievedOptions[0].value)
            assertEquals("#00FF00", retrievedOptions[0].color)
        }
        
        @Test
        @DisplayName("Should handle multi-select property configuration")
        fun `should handle multi-select property configuration`() {
            // Given
            val multiSelectProperty = DomainModelTestBuilder.selectPropertyDefinition(
                isMultiple = true
            )
            
            // When & Then
            assertEquals(PropertyType.MULTI_SELECT, multiSelectProperty.type)
            assertTrue(multiSelectProperty.isMultiple)
        }
        
        @Test
        @DisplayName("Should handle comprehensive number property configuration")
        fun `should handle comprehensive number property configuration`() {
            // Given
            val numberProperty = DomainModelTestBuilder.numberPropertyDefinition(
                displayName = "Score",
                isRequired = true,
                min = 0.0,
                max = 100.0,
                precision = 1
            )
            
            // When & Then
            assertTrue(numberProperty.isRequired)
            assertEquals(0.0, numberProperty.minValue?.toDouble())
            assertEquals(100.0, numberProperty.maxValue?.toDouble())
            assertEquals(1, numberProperty.precision)
            assertTrue(numberProperty.isValid())
        }
        
        @Test
        @DisplayName("Should handle comprehensive text property configuration")
        fun `should handle comprehensive text property configuration`() {
            // Given
            val textProperty = DomainModelTestBuilder.textPropertyDefinition(
                displayName = "Description",
                isRequired = false,
                maxLength = 500,
                placeholder = "Enter description here",
                isLongText = true
            )
            
            // When & Then
            assertEquals(PropertyType.LONG_TEXT, textProperty.type)
            assertFalse(textProperty.isRequired)
            assertEquals(500, textProperty.maxLength)
            assertEquals("Enter description here", textProperty.placeholder)
            assertTrue(textProperty.isValid())
        }
        
        @Test
        @DisplayName("Should handle all basic property types")
        fun `should handle all basic property types`() {
            // Given
            val propertyTypes = mapOf(
                PropertyType.TEXT to "Short text field",
                PropertyType.LONG_TEXT to "Long text area",
                PropertyType.NUMBER to "Numeric value",
                PropertyType.CHECKBOX to "Boolean flag",
                PropertyType.DATE to "Date picker",
                PropertyType.DATETIME to "Date and time picker",
                PropertyType.EMAIL to "Email address",
                PropertyType.URL to "Web URL",
                PropertyType.FILE to "File attachment"
            )
            
            // When & Then
            propertyTypes.forEach { (type, displayName) ->
                val property = DomainModelTestBuilder.propertyDefinition(
                    type = type,
                    displayName = displayName
                )
                assertEquals(type, property.type)
                assertEquals(displayName, property.displayName)
            }
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val type = PropertyType.TEXT
            val displayName = "Same Property"
            val config = buildJsonObject {
                put("required", true)
                put("maxLength", 100)
            }
            
            val property1 = DomainModelTestBuilder.propertyDefinition(
                type = type,
                displayName = displayName,
                config = config
            )
            val property2 = DomainModelTestBuilder.propertyDefinition(
                type = type,
                displayName = displayName,
                config = config
            )
            
            // Then
            assertEquals(property1, property2)
            assertEquals(property1.hashCode(), property2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseProperty = DomainModelTestBuilder.propertyDefinition()
            val differentType = baseProperty.copy(type = PropertyType.NUMBER)
            val differentName = baseProperty.copy(displayName = "Different Name")
            val differentConfig = baseProperty.copy(
                config = buildJsonObject { put("required", true) }
            )
            
            // Then
            assertNotEquals(baseProperty, differentType)
            assertNotEquals(baseProperty, differentName)
            assertNotEquals(baseProperty, differentConfig)
        }
        
        @Test
        @DisplayName("Should implement toString with all properties")
        fun `should implement toString with all properties`() {
            // Given
            val property = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.TEXT,
                displayName = "Test Property"
            )
            
            // When
            val toString = property.toString()
            
            // Then
            assertTrue(toString.contains("TEXT"))
            assertTrue(toString.contains("Test Property"))
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalProperty = DomainModelTestBuilder.propertyDefinition(
                type = PropertyType.TEXT,
                displayName = "Original Property"
            )
            
            // When
            val copiedProperty = originalProperty.copy(
                type = PropertyType.NUMBER,
                displayName = "Copied Property"
            )
            
            // Then
            assertEquals(PropertyType.NUMBER, copiedProperty.type)
            assertEquals("Copied Property", copiedProperty.displayName)
            assertEquals(originalProperty.config, copiedProperty.config) // Config preserved
            // Original should remain unchanged
            assertEquals(PropertyType.TEXT, originalProperty.type)
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Integration Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle empty JSON configuration")
        fun `should handle empty JSON configuration`() {
            // Given
            val property = DomainModelTestBuilder.propertyDefinition(
                config = JsonObject(emptyMap())
            )
            
            // When & Then
            assertFalse(property.isRequired) // Default values
            assertNull(property.maxLength)
            assertNull(property.minValue)
            assertNull(property.maxValue)
            assertNull(property.defaultValue)
            assertFalse(property.isMultiple)
        }
        
        @Test
        @DisplayName("Should handle Unicode characters in display name")
        fun `should handle Unicode characters in display name`() {
            // Given
            val unicodeDisplayName = "プロパティ名 🎯 José María"
            
            // When
            val property = DomainModelTestBuilder.propertyDefinition(
                displayName = unicodeDisplayName
            )
            
            // Then
            assertEquals(unicodeDisplayName, property.displayName)
        }
        
        @Test
        @DisplayName("Should handle complex nested JSON configuration")
        fun `should handle complex nested JSON configuration`() {
            // Given
            val complexConfig = buildJsonObject {
                put("required", true)
                put("validation", buildJsonObject {
                    put("minLength", 5)
                    put("maxLength", 100)
                    put("pattern", "^[a-zA-Z]+$")
                })
                put("ui", buildJsonObject {
                    put("placeholder", "Enter text")
                    put("helpText", "This is help text")
                })
            }
            
            // When
            val property = DomainModelTestBuilder.propertyDefinition(config = complexConfig)
            
            // Then
            assertTrue(property.isRequired)
            assertEquals(complexConfig, property.config)
        }
        
        @Test
        @DisplayName("Should handle configuration immutability")
        fun `should handle configuration immutability`() {
            // Given
            val originalProperty = DomainModelTestBuilder.propertyDefinition(
                config = buildJsonObject { put("required", false) }
            )
            
            // When
            val updatedProperty = originalProperty.asRequired()
            
            // Then
            assertFalse(originalProperty.isRequired) // Original unchanged
            assertTrue(updatedProperty.isRequired)   // New instance updated
            assertNotSame(originalProperty.config, updatedProperty.config)
        }
        
        @Test
        @DisplayName("Should handle all PropertyTypes validation scenarios")
        fun `should handle all PropertyTypes validation scenarios`() {
            // Given
            val testCases = mapOf(
                PropertyType.TEXT to { config: JsonObjectBuilder -> 
                    config.put("maxLength", 100) 
                },
                PropertyType.LONG_TEXT to { config: JsonObjectBuilder -> 
                    config.put("maxLength", 1000) 
                },
                PropertyType.NUMBER to { config: JsonObjectBuilder -> 
                    config.put("min", 0)
                    config.put("max", 100)
                    config.put("precision", 2)
                },
                PropertyType.SELECT to { config: JsonObjectBuilder ->
                    config.put("options", JsonArray(listOf(
                        buildJsonObject {
                            put("value", "option1")
                            put("label", "Option 1")
                        }
                    )))
                }
            )
            
            // When & Then
            testCases.forEach { (type, configBuilder) ->
                val property = DomainModelTestBuilder.propertyDefinition(
                    type = type,
                    config = buildJsonObject { configBuilder(this) }
                )
                
                assertTrue(property.isValid(), "Property type $type should be valid")
            }
        }
    }
}