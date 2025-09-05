package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyDefinitionDto
import com.astarworks.astarmanagement.core.table.api.dto.property.SelectOptionDto
import com.astarworks.astarmanagement.core.table.api.mapper.TableDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
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
                typeId = "text",
                displayName = "Test Property",
                config = buildJsonObject { 
                    put("maxLength", 500)
                }
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto).isNotNull
            assertThat(dto.typeId).isEqualTo("text")
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
                typeId = "text",
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
                typeId = "select",
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
            assertThat(dto.typeId).isEqualTo("select")
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
                typeId = "number",
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
            assertThat(dto.typeId).isEqualTo("number")
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
                typeId = "text",
                displayName = "Simple Text"
                // config defaults to empty JsonObject
            )
            
            // When
            val dto = mapper.toPropertyDefinitionDto(propertyDef)
            
            // Then
            assertThat(dto.config).isEmpty()
            assertThat(dto.required).isFalse()
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
                typeId = "text",
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
            assertThat(propertyDef.typeId).isEqualTo("text")
            assertThat(propertyDef.displayName).isEqualTo("Test Property")
            assertThat(propertyDef.config["required"]?.jsonPrimitive?.boolean).isTrue()
            assertThat(propertyDef.config["maxLength"]?.jsonPrimitive?.int).isEqualTo(1000)
            // Note: defaultValue and description are not currently embedded in config by the mapper
            // They are DTO-only fields not present in the domain model
        }
        
        @Test
        @DisplayName("Should embed required flag in config")
        fun `should embed required flag in config`() {
            // Given
            val dto = PropertyDefinitionDto(
                key = "requiredProp",
                typeId = "number",
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
            assertThat(propertyDef.typeId).isEqualTo("select")
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
                typeId = "checkbox",  // Using valid PropertyTypes.CHECKBOX instead of "boolean"
                displayName = "Checkbox Field",
                defaultValue = JsonPrimitive(true)
            )
            
            // When
            val propertyDef = mapper.fromPropertyDefinitionDto(dto)
            
            // Then
            // defaultValue is not embedded in config (it's a DTO-only field)
            assertThat(propertyDef.typeId).isEqualTo("checkbox")
            assertThat(propertyDef.displayName).isEqualTo("Checkbox Field")
            // The defaultValue field is preserved in the DTO but not transferred to domain model
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
                typeId = "text",
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
            assertThat(convertedDto.typeId).isEqualTo(originalDto.typeId)
            assertThat(convertedDto.displayName).isEqualTo(originalDto.displayName)
            assertThat(convertedDto.required).isEqualTo(originalDto.required)
            assertThat(convertedDto.config["maxLength"]).isEqualTo(originalDto.config["maxLength"])
            assertThat(convertedDto.config["minLength"]).isEqualTo(originalDto.config["minLength"])
            assertThat(convertedDto.config["pattern"]).isEqualTo(originalDto.config["pattern"])
        }
        
        @Test
        @DisplayName("Should handle complex nested structures in round-trip")
        fun `should handle complex nested structures in round trip`() {
            // Given
            val originalDto = PropertyDefinitionDto(
                key = "complexProp",
                typeId = "select",  // Using valid PropertyTypes.SELECT instead of "custom"
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
                    typeId = "text",
                    displayName = "Field 1",
                    config = buildJsonObject { put("required", true) }
                ),
                "field2" to PropertyDefinition(
                    typeId = "number",
                    displayName = "Field 2"
                ),
                "field3" to PropertyDefinition(
                    typeId = "select",
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
            assertThat(response.properties["field2"]?.typeId).isEqualTo("number")
            assertThat(response.properties["field3"]?.config?.get("options")).isNotNull()
            
            // Verify property order is preserved
            assertThat(response.propertyOrder).containsExactly("field1", "field2", "field3")
        }
    }
}