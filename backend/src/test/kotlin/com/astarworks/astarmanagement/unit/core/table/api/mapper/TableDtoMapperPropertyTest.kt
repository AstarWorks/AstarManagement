package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyDefinitionDto
import com.astarworks.astarmanagement.core.table.api.dto.property.SelectOptionDto
import com.astarworks.astarmanagement.core.table.api.mapper.TableDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import kotlinx.serialization.json.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.util.*

/**
 * Unit tests for TableDtoMapper PropertyDefinition conversion functionality.
 * Tests the critical mapping between domain PropertyDefinition and DTO PropertyDefinitionDto.
 */
@UnitTest
@DisplayName("TableDtoMapper Property Tests")
class TableDtoMapperPropertyTest {
    
    private lateinit var mapper: TableDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = TableDtoMapper()
    }
    
    @Nested
    @DisplayName("PropertyDefinition to PropertyDefinitionDto Conversion")
    inner class PropertyDefinitionToDtoConversion {
        
        @Test
        @DisplayName("Should convert basic PropertyDefinition to DTO")
        fun `should convert basic property definition to dto`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.TEXT,
                displayName = "Test Property",
                config = buildJsonObject { 
                    put("maxLength", 500)
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto).isNotNull
            assertThat(dto.type).isEqualTo(PropertyType.TEXT)
            assertThat(dto.displayName).isEqualTo("Test Property")
            assertThat(dto.config["maxLength"]?.jsonPrimitive?.int).isEqualTo(500)
            assertThat(dto.required).isFalse() // Default value
            assertThat(dto.defaultValue).isNull()
            assertThat(dto.description).isNull()
        }
        
        @Test
        @DisplayName("Should extract required flag from config")
        fun `should extract required flag from config`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.TEXT,
                displayName = "Required Field",
                config = buildJsonObject { 
                    put("required", true)
                    put("maxLength", 255)
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto.required).isTrue()
            assertThat(dto.config.containsKey("required")).isFalse() // Should be removed from config
            assertThat(dto.config["maxLength"]).isNotNull()
        }
        
        @Test
        @DisplayName("Should handle complex config with nested objects")
        fun `should handle complex config with nested objects`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.SELECT,
                displayName = "Status Field",
                config = buildJsonObject {
                    putJsonArray("options") {
                        addJsonObject {
                            put("value", "pending")
                            put("label", "Pending")
                            put("color", "#808080")
                        }
                        addJsonObject {
                            put("value", "approved")
                            put("label", "Approved")
                            put("color", "#00AA00")
                        }
                    }
                    put("multiple", false)
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto.type).isEqualTo(PropertyType.SELECT)
            val options = dto.config["options"]?.jsonArray
            assertThat(options).isNotNull()
            assertThat(options?.size).isEqualTo(2)
            assertThat(options?.get(0)?.jsonObject?.get("value")?.jsonPrimitive?.content).isEqualTo("pending")
        }
        
        @Test
        @DisplayName("Should handle number type with validation")
        fun `should handle number type with validation`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.NUMBER,
                displayName = "Age",
                config = buildJsonObject {
                    put("min", 0)
                    put("max", 150)
                    put("required", false)
                    put("decimals", 0)
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto.type).isEqualTo(PropertyType.NUMBER)
            assertThat(dto.config["min"]?.jsonPrimitive?.int).isEqualTo(0)
            assertThat(dto.config["max"]?.jsonPrimitive?.int).isEqualTo(150)
            assertThat(dto.config["decimals"]?.jsonPrimitive?.int).isEqualTo(0)
            assertThat(dto.required).isFalse()
        }
        
        @Test
        @DisplayName("Should handle empty config")
        fun `should handle empty config`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.TEXT,
                displayName = "Simple Text"
                // config defaults to empty JsonObject
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto.config).isEmpty()
            assertThat(dto.required).isFalse()
        }
        
        @Test
        @DisplayName("Should extract default value from config")
        fun `should extract default value from config`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.TEXT,
                displayName = "Text with Default",
                config = buildJsonObject {
                    put("default", "Default Text Value")
                    put("maxLength", 100)
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto.defaultValue?.jsonPrimitive?.content).isEqualTo("Default Text Value")
            assertThat(dto.config["maxLength"]?.jsonPrimitive?.int).isEqualTo(100)
            assertThat(dto.config.containsKey("default")).isFalse() // Should be removed from config
        }
        
        @Test
        @DisplayName("Should extract description from config")
        fun `should extract description from config`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.NUMBER,
                displayName = "Documented Number",
                config = buildJsonObject {
                    put("description", "This is a number field for age")
                    put("min", 0)
                    put("max", 120)
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto.description).isEqualTo("This is a number field for age")
            assertThat(dto.config["min"]?.jsonPrimitive?.int).isEqualTo(0)
            assertThat(dto.config["max"]?.jsonPrimitive?.int).isEqualTo(120)
            assertThat(dto.config.containsKey("description")).isFalse() // Should be removed from config
        }
        
        @Test
        @DisplayName("Should handle complex default values")
        fun `should handle complex default values`() {
            // Given
            val propertyDef = PropertyDefinition(
                type = PropertyType.SELECT,
                displayName = "Select with Default",
                config = buildJsonObject {
                    put("default", buildJsonObject {
                        put("value", "option1")
                        put("label", "Option 1")
                    })
                    putJsonArray("options") {
                        addJsonObject {
                            put("value", "option1")
                            put("label", "Option 1")
                        }
                        addJsonObject {
                            put("value", "option2")
                            put("label", "Option 2")
                        }
                    }
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            val defaultValue = dto.defaultValue?.jsonObject
            assertThat(defaultValue).isNotNull()
            assertThat(defaultValue?.get("value")?.jsonPrimitive?.content).isEqualTo("option1")
            assertThat(defaultValue?.get("label")?.jsonPrimitive?.content).isEqualTo("Option 1")
            assertThat(dto.config["options"]).isNotNull()
            assertThat(dto.config.containsKey("default")).isFalse()
        }
    }
    
    @Nested
    @DisplayName("PropertyDefinitionDto to PropertyDefinition Conversion")
    inner class PropertyDtoToDefinitionConversion {
        
        @Test
        @DisplayName("Should convert DTO to PropertyDefinition")
        fun `should convert dto to property definition`() {
            // Given
            val dto = PropertyDefinitionDto(
                key = "testProp",
                type = PropertyType.TEXT,
                displayName = "Test Property",
                config = buildJsonObject {
                    put("maxLength", 1000)
                },
                required = true,
                defaultValue = JsonPrimitive("default"),
                description = "Test description"
            )
            
            // When
            val propertyDef = mapper.fromPropertyDefinitionDto(dto)
            
            // Then
            assertThat(propertyDef).isNotNull
            assertThat(propertyDef.type).isEqualTo(PropertyType.TEXT)
            assertThat(propertyDef.displayName).isEqualTo("Test Property")
            assertThat(propertyDef.config["required"]?.jsonPrimitive?.boolean).isTrue()
            assertThat(propertyDef.config["maxLength"]?.jsonPrimitive?.int).isEqualTo(1000)
            // defaultValue and description should now be embedded in config
            assertThat(propertyDef.config["default"]?.jsonPrimitive?.content).isEqualTo("default")
            assertThat(propertyDef.config["description"]?.jsonPrimitive?.content).isEqualTo("Test description")
        }
        
        @Test
        @DisplayName("Should embed required flag in config")
        fun `should embed required flag in config`() {
            // Given
            val dto = PropertyDefinitionDto(
                key = "requiredProp",
                type = PropertyType.NUMBER,
                displayName = "Required Number",
                required = true
            )
            
            // When
            val propertyDef = mapper.fromPropertyDefinitionDto(dto)
            
            // Then
            assertThat(propertyDef.config["required"]?.jsonPrimitive?.boolean).isTrue()
        }
        
        @Test
        @DisplayName("Should preserve select options in config")
        fun `should preserve select options in config`() {
            // Given
            val dto = PropertyDefinitionDto.select(
                key = "priority",
                displayName = "Priority",
                options = listOf(
                    SelectOptionDto("low", "Low", "#0066CC"),
                    SelectOptionDto("medium", "Medium", "#FFA500"),
                    SelectOptionDto("high", "High", "#CC0000")
                ),
                required = false,
                multiple = false
            )
            
            // When
            val propertyDef = mapper.fromPropertyDefinitionDto(dto)
            
            // Then
            assertThat(propertyDef.type).isEqualTo(PropertyType.SELECT)
            val options = propertyDef.config["options"]?.jsonArray
            assertThat(options?.size).isEqualTo(3)
            val firstOption = options?.get(0)?.jsonObject
            assertThat(firstOption?.get("value")?.jsonPrimitive?.content).isEqualTo("low")
            assertThat(firstOption?.get("label")?.jsonPrimitive?.content).isEqualTo("Low")
            assertThat(firstOption?.get("color")?.jsonPrimitive?.content).isEqualTo("#0066CC")
        }
        
        @Test
        @DisplayName("Should handle DTO with default value")
        fun `should handle dto with default value`() {
            // Given
            val dto = PropertyDefinitionDto(
                key = "withDefault",
                type = PropertyType.CHECKBOX,
                displayName = "Checkbox Field",
                defaultValue = JsonPrimitive(true)
            )
            
            // When
            val propertyDef = mapper.fromPropertyDefinitionDto(dto)
            
            // Then
            assertThat(propertyDef.type).isEqualTo(PropertyType.CHECKBOX)
            assertThat(propertyDef.displayName).isEqualTo("Checkbox Field")
            // defaultValue should now be transferred to config["default"]
            assertThat(propertyDef.config["default"]?.jsonPrimitive?.boolean).isTrue()
        }
    }
    
    @Nested
    @DisplayName("Bidirectional Conversion")
    inner class BidirectionalConversion {
        
        @Test
        @DisplayName("Should maintain data integrity in round-trip conversion")
        fun `should maintain data integrity in round trip conversion`() {
            // Given
            val originalDto = PropertyDefinitionDto(
                key = "roundTripProp",
                type = PropertyType.TEXT,
                displayName = "Round Trip Property",
                config = buildJsonObject {
                    put("maxLength", 500)
                    put("minLength", 10)
                    put("pattern", "^[A-Z].*")
                },
                required = true,
                defaultValue = JsonPrimitive("DEFAULT"),
                description = "Test round-trip conversion"
            )
            
            // When
            val propertyDef = mapper.fromPropertyDefinitionDto(originalDto)
            val convertedDto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            // Note: key is not preserved in the conversion (it's stored separately in the map)
            assertThat(convertedDto.type).isEqualTo(originalDto.type)
            assertThat(convertedDto.displayName).isEqualTo(originalDto.displayName)
            assertThat(convertedDto.required).isEqualTo(originalDto.required)
            assertThat(convertedDto.config["maxLength"]).isEqualTo(originalDto.config["maxLength"])
            assertThat(convertedDto.config["minLength"]).isEqualTo(originalDto.config["minLength"])
            assertThat(convertedDto.config["pattern"]).isEqualTo(originalDto.config["pattern"])
            // defaultValue and description should be preserved in round-trip
            assertThat(convertedDto.defaultValue).isEqualTo(originalDto.defaultValue)
            assertThat(convertedDto.description).isEqualTo(originalDto.description)
        }
        
        @Test
        @DisplayName("Should handle complex nested structures in round-trip")
        fun `should handle complex nested structures in round trip`() {
            // Given
            val originalDto = PropertyDefinitionDto(
                key = "complexProp",
                type = PropertyType.SELECT,
                displayName = "Complex Property",
                config = buildJsonObject {
                    putJsonObject("validation") {
                        put("required", true)
                        putJsonArray("rules") {
                            add("notEmpty")
                            add("unique")
                        }
                    }
                    putJsonArray("allowedValues") {
                        add("value1")
                        add("value2")
                        add("value3")
                    }
                },
                required = false
            )
            
            // When
            val propertyDef = mapper.fromPropertyDefinitionDto(originalDto)
            val convertedDto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            val validation = convertedDto.config["validation"]?.jsonObject
            assertThat(validation).isNotNull()
            assertThat(validation?.get("required")?.jsonPrimitive?.boolean).isTrue()
            
            val rules = validation?.get("rules")?.jsonArray
            assertThat(rules?.size).isEqualTo(2)
            assertThat(rules?.get(0)?.jsonPrimitive?.content).isEqualTo("notEmpty")
            
            val allowedValues = convertedDto.config["allowedValues"]?.jsonArray
            assertThat(allowedValues?.size).isEqualTo(3)
        }
    }
    
    @Nested
    @DisplayName("Table Properties Conversion")
    inner class TablePropertiesConversion {
        
        @Test
        @DisplayName("Should convert all table properties to DTOs")
        fun `should convert all table properties to dtos`() {
            // Given
            val properties = mapOf(
                "field1" to PropertyDefinition(
                    type = PropertyType.TEXT,
                    displayName = "Field 1",
                    config = buildJsonObject { put("required", true) }
                ),
                "field2" to PropertyDefinition(
                    type = PropertyType.NUMBER,
                    displayName = "Field 2"
                ),
                "field3" to PropertyDefinition(
                    type = PropertyType.SELECT,
                    displayName = "Field 3",
                    config = buildJsonObject {
                        putJsonArray("options") {
                            addJsonObject {
                                put("value", "opt1")
                                put("label", "Option 1")
                            }
                        }
                    }
                )
            )
            
            val table = Table(
                workspaceId = WorkspaceId(UUID.randomUUID()),
                name = "Test Table",
                properties = properties,
                propertyOrder = listOf("field1", "field2", "field3")
            )
            
            // When
            val response = mapper.toResponse(table)
            
            // Then
            assertThat(response.properties).hasSize(3)
            assertThat(response.properties["field1"]?.required).isTrue()
            assertThat(response.properties["field2"]?.type).isEqualTo(PropertyType.NUMBER)
            assertThat(response.properties["field3"]?.config?.get("options")).isNotNull()
            
            // Verify property order is preserved
            assertThat(response.propertyOrder).containsExactly("field1", "field2", "field3")
        }
    }
}