package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.mapper.PropertyTypeCatalogDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory
import kotlinx.serialization.json.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Unit tests for PropertyTypeCatalogDtoMapper basic conversion functionality.
 * Tests fundamental transformations between PropertyTypeCatalog domain model and DTOs.
 */
@UnitTest
@DisplayName("PropertyTypeCatalogDtoMapper Basic Tests")
class PropertyTypeCatalogDtoMapperBasicTest {
    
    private lateinit var mapper: PropertyTypeCatalogDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = PropertyTypeCatalogDtoMapper()
    }
    
    @Nested
    @DisplayName("Basic Domain to DTO Conversion")
    inner class BasicDomainToDtoConversion {
        
        @Test
        @DisplayName("Should convert PropertyTypeCatalog to DTO with all fields")
        fun `should convert property type catalog to dto with all fields`() {
            // Given
            val validationSchema = buildJsonObject {
                put("required", true)
                put("maxLength", 255)
            }
            val defaultConfig = buildJsonObject {
                put("placeholder", "Enter text...")
                put("rows", 1)
            }
            
            val domain = PropertyTypeCatalog(
                id = "rich_text",
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = validationSchema,
                defaultConfig = defaultConfig,
                uiComponent = "RichTextEditor",
                icon = "📝",
                description = "Rich text editor with formatting",
                isActive = true,
                isCustom = false
            )
            
            // When
            val dto = mapper.toDto(domain)
            
            // Then
            assertThat(dto.typeId).isEqualTo("rich_text")
            assertThat(dto.category).isEqualTo("advanced") // lowercase conversion
            assertThat(dto.uiComponent).isEqualTo("RichTextEditor")
            assertThat(dto.icon).isEqualTo("📝")
            assertThat(dto.configSchema).isEqualTo(validationSchema)
            assertThat(dto.defaultConfig).isEqualTo(defaultConfig)
            assertThat(dto.validationRules).isEqualTo(validationSchema)
            assertThat(dto.description).isEqualTo("Rich text editor with formatting")
            assertThat(dto.isActive).isTrue()
            assertThat(dto.isCustom).isFalse()
        }
        
        @Test
        @DisplayName("Should convert category names to lowercase")
        fun `should convert category names to lowercase`() {
            // Given
            val basicDomain = PropertyTypeCatalog(id = "text", category = PropertyTypeCategory.BASIC)
            val advancedDomain = PropertyTypeCatalog(id = "email", category = PropertyTypeCategory.ADVANCED)
            val relationDomain = PropertyTypeCatalog(id = "user", category = PropertyTypeCategory.RELATION)
            val systemDomain = PropertyTypeCatalog(id = "created_time", category = PropertyTypeCategory.SYSTEM)
            
            // When & Then
            assertThat(mapper.toDto(basicDomain).category).isEqualTo("basic")
            assertThat(mapper.toDto(advancedDomain).category).isEqualTo("advanced")
            assertThat(mapper.toDto(relationDomain).category).isEqualTo("relation")
            assertThat(mapper.toDto(systemDomain).category).isEqualTo("system")
        }
        
        @Test
        @DisplayName("Should handle null optional fields")
        fun `should handle null optional fields`() {
            // Given
            val domain = PropertyTypeCatalog(
                id = "simple_text",
                category = PropertyTypeCategory.BASIC,
                validationSchema = null,
                defaultConfig = buildJsonObject { },
                uiComponent = null,
                icon = null,
                description = null,
                isActive = true,
                isCustom = false
            )
            
            // When
            val dto = mapper.toDto(domain)
            
            // Then
            assertThat(dto.typeId).isEqualTo("simple_text")
            assertThat(dto.category).isEqualTo("basic")
            assertThat(dto.uiComponent).isNull()
            assertThat(dto.icon).isNull()
            assertThat(dto.configSchema).isNull()
            assertThat(dto.defaultConfig).isNotNull() // Empty JsonObject
            assertThat(dto.validationRules).isNull()
            assertThat(dto.description).isNull()
            assertThat(dto.isActive).isTrue()
            assertThat(dto.isCustom).isFalse()
        }
        
        @Test
        @DisplayName("Should handle complex validation schema")
        fun `should handle complex validation schema`() {
            // Given
            val complexSchema = buildJsonObject {
                put("type", "object")
                putJsonObject("properties") {
                    putJsonObject("minLength") {
                        put("type", "integer")
                        put("minimum", 0)
                    }
                    putJsonObject("maxLength") {
                        put("type", "integer")
                        put("maximum", 10000)
                    }
                }
                putJsonArray("required") {
                    add("minLength")
                }
            }
            
            val domain = PropertyTypeCatalog(
                id = "validated_text",
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = complexSchema
            )
            
            // When
            val dto = mapper.toDto(domain)
            
            // Then
            assertThat(dto.validationRules).isEqualTo(complexSchema)
            assertThat(dto.configSchema).isEqualTo(complexSchema)
            val properties = dto.validationRules?.get("properties")?.jsonObject
            assertThat(properties).isNotNull()
            assertThat(properties?.get("minLength")).isNotNull()
            assertThat(properties?.get("maxLength")).isNotNull()
        }
    }
    
    @Nested
    @DisplayName("List Conversion Operations")
    inner class ListConversionOperations {
        
        @Test
        @DisplayName("Should convert list of domains to DTOs")
        fun `should convert list of domains to dtos`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog.createTextType(),
                PropertyTypeCatalog.createNumberType(),
                PropertyTypeCatalog.createSelectType()
            )
            
            // When
            val dtos = mapper.toDtoList(domains)
            
            // Then
            assertThat(dtos).hasSize(3)
            assertThat(dtos[0].typeId).isEqualTo("text")
            assertThat(dtos[0].category).isEqualTo("basic")
            assertThat(dtos[1].typeId).isEqualTo("number")
            assertThat(dtos[1].category).isEqualTo("basic")
            assertThat(dtos[2].typeId).isEqualTo("select")
            assertThat(dtos[2].category).isEqualTo("basic")
        }
        
        @Test
        @DisplayName("Should handle empty list")
        fun `should handle empty list`() {
            // Given
            val emptyDomains = emptyList<PropertyTypeCatalog>()
            
            // When
            val dtos = mapper.toDtoList(emptyDomains)
            
            // Then
            assertThat(dtos).isEmpty()
        }
        
        @Test
        @DisplayName("Should preserve domain object order in list")
        fun `should preserve domain object order in list`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog(id = "z_type", category = PropertyTypeCategory.BASIC),
                PropertyTypeCatalog(id = "a_type", category = PropertyTypeCategory.ADVANCED),
                PropertyTypeCatalog(id = "m_type", category = PropertyTypeCategory.RELATION)
            )
            
            // When
            val dtos = mapper.toDtoList(domains)
            
            // Then
            assertThat(dtos).hasSize(3)
            assertThat(dtos[0].typeId).isEqualTo("z_type")
            assertThat(dtos[1].typeId).isEqualTo("a_type")
            assertThat(dtos[2].typeId).isEqualTo("m_type")
        }
        
        @Test
        @DisplayName("Should handle large dataset efficiently")
        fun `should handle large dataset efficiently`() {
            // Given
            val largeDomains = (1..100).map { index ->
                PropertyTypeCatalog(
                    id = "type_$index",
                    category = PropertyTypeCategory.values()[index % 4],
                    description = "Description for type $index"
                )
            }
            
            // When
            val startTime = System.currentTimeMillis()
            val dtos = mapper.toDtoList(largeDomains)
            val endTime = System.currentTimeMillis()
            
            // Then
            assertThat(dtos).hasSize(100)
            assertThat(dtos.first().typeId).isEqualTo("type_1")
            assertThat(dtos.last().typeId).isEqualTo("type_100")
            assertThat(endTime - startTime).isLessThan(1000) // Should complete within 1 second
            
            // Verify all conversions are correct
            assertThat(dtos.all { it.typeId.startsWith("type_") }).isTrue()
            assertThat(dtos.all { it.category in listOf("basic", "advanced", "relation", "system") }).isTrue()
        }
    }
    
    // Helper methods for creating test data
    
    private fun createCustomType(id: String = "custom_type"): PropertyTypeCatalog {
        return PropertyTypeCatalog(
            id = id,
            category = PropertyTypeCategory.ADVANCED,
            validationSchema = buildJsonObject { put("custom", true) },
            defaultConfig = buildJsonObject { put("customDefault", "value") },
            uiComponent = "CustomComponent",
            icon = "🔧",
            description = "Custom property type",
            isActive = true,
            isCustom = true
        )
    }
}