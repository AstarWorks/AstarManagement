package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.property.CustomPropertyTypeRequest
import com.astarworks.astarmanagement.core.table.api.mapper.PropertyTypeCatalogDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Unit tests for PropertyTypeCatalogDtoMapper request processing functionality.
 * Tests creation and update operations from request DTOs.
 */
@UnitTest
@DisplayName("PropertyTypeCatalogDtoMapper Request Tests")
class PropertyTypeCatalogDtoMapperRequestTest {
    
    private lateinit var mapper: PropertyTypeCatalogDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = PropertyTypeCatalogDtoMapper()
    }
    
    @Nested
    @DisplayName("Create Request Processing")
    inner class CreateRequestProcessing {
        
        @Test
        @DisplayName("Should create PropertyTypeCatalog from CustomPropertyTypeRequest")
        fun `should create property type catalog from custom request`() {
            // Given
            val validationRules = buildJsonObject {
                put("required", true)
                put("minLength", 5)
                put("pattern", "^[A-Za-z]+$")
            }
            val defaultConfig = buildJsonObject {
                put("placeholder", "Enter custom value")
                put("autoComplete", true)
            }
            
            val request = CustomPropertyTypeRequest(
                typeId = "custom_text_field",
                category = "advanced",
                description = "Custom text field with validation",
                icon = "📝",
                uiComponent = "CustomTextInput",
                configSchema = null,
                defaultConfig = defaultConfig,
                validationRules = validationRules
            )
            
            // When
            val domain = mapper.fromCreateRequest(request)
            
            // Then
            assertThat(domain.id).isEqualTo("custom_text_field")
            assertThat(domain.category).isEqualTo(PropertyTypeCategory.ADVANCED) // uppercase conversion
            assertThat(domain.validationSchema).isEqualTo(validationRules)
            assertThat(domain.defaultConfig).isEqualTo(defaultConfig)
            assertThat(domain.uiComponent).isEqualTo("CustomTextInput")
            assertThat(domain.icon).isEqualTo("📝")
            assertThat(domain.description).isEqualTo("Custom text field with validation")
            assertThat(domain.isActive).isTrue() // Auto-set to true
            assertThat(domain.isCustom).isTrue() // Auto-set to true
        }
        
        @Test
        @DisplayName("Should convert category string to enum correctly")
        fun `should convert category string to enum correctly`() {
            // Given & When & Then
            val basicRequest = CustomPropertyTypeRequest(typeId = "test1", category = "basic")
            assertThat(mapper.fromCreateRequest(basicRequest).category)
                .isEqualTo(PropertyTypeCategory.BASIC)
            
            val advancedRequest = CustomPropertyTypeRequest(typeId = "test2", category = "advanced")
            assertThat(mapper.fromCreateRequest(advancedRequest).category)
                .isEqualTo(PropertyTypeCategory.ADVANCED)
            
            val relationRequest = CustomPropertyTypeRequest(typeId = "test3", category = "relation")
            assertThat(mapper.fromCreateRequest(relationRequest).category)
                .isEqualTo(PropertyTypeCategory.RELATION)
            
            val systemRequest = CustomPropertyTypeRequest(typeId = "test4", category = "system")
            assertThat(mapper.fromCreateRequest(systemRequest).category)
                .isEqualTo(PropertyTypeCategory.SYSTEM)
            
            // Test case insensitive conversion
            val mixedCaseRequest = CustomPropertyTypeRequest(typeId = "test5", category = "AdVaNcEd")
            assertThat(mapper.fromCreateRequest(mixedCaseRequest).category)
                .isEqualTo(PropertyTypeCategory.ADVANCED)
        }
        
        @Test
        @DisplayName("Should handle null defaultConfig by creating empty JsonObject")
        fun `should handle null default config by creating empty json object`() {
            // Given
            val request = CustomPropertyTypeRequest(
                typeId = "minimal_type",
                category = "basic",
                defaultConfig = null
            )
            
            // When
            val domain = mapper.fromCreateRequest(request)
            
            // Then
            assertThat(domain.defaultConfig).isNotNull()
            assertThat(domain.defaultConfig).isEqualTo(JsonObject(emptyMap()))
            assertThat(domain.defaultConfig.isEmpty()).isTrue()
        }
        
        @Test
        @DisplayName("Should automatically set isCustom and isActive flags")
        fun `should automatically set custom and active flags`() {
            // Given
            val request = CustomPropertyTypeRequest(
                typeId = "auto_flags_test",
                category = "basic"
            )
            
            // When
            val domain = mapper.fromCreateRequest(request)
            
            // Then
            assertThat(domain.isCustom).isTrue()
            assertThat(domain.isActive).isTrue()
        }
        
        @Test
        @DisplayName("Should handle optional fields correctly")
        fun `should handle optional fields correctly`() {
            // Given
            val minimalRequest = CustomPropertyTypeRequest(
                typeId = "minimal_custom",
                category = "basic" // Use valid category
                // All other fields use default values
            )
            
            // When
            val domain = mapper.fromCreateRequest(minimalRequest)
            
            // Then
            assertThat(domain.id).isEqualTo("minimal_custom")
            assertThat(domain.category).isEqualTo(PropertyTypeCategory.BASIC)
            assertThat(domain.validationSchema).isNull()
            assertThat(domain.defaultConfig).isEqualTo(JsonObject(emptyMap()))
            assertThat(domain.uiComponent).isNull()
            assertThat(domain.icon).isNull()
            assertThat(domain.description).isNull()
            assertThat(domain.isActive).isTrue()
            assertThat(domain.isCustom).isTrue()
        }
    }
    
    @Nested
    @DisplayName("Update Request Processing")
    inner class UpdateRequestProcessing {
        
        @Test
        @DisplayName("Should update PropertyTypeCatalog with provided values")
        fun `should update property type catalog with provided values`() {
            // Given
            val existingDomain = PropertyTypeCatalog(
                id = "existing_type",
                category = PropertyTypeCategory.BASIC,
                description = "Original description",
                icon = "🔧",
                isActive = true
            )
            
            val newValidationRules = buildJsonObject { put("newRule", "value") }
            val newDefaultConfig = buildJsonObject { put("newDefault", "config") }
            
            // When
            val updatedDomain = mapper.updateFromRequest(
                domain = existingDomain,
                description = "Updated description",
                icon = "📝",
                validationRules = newValidationRules,
                defaultConfig = newDefaultConfig,
                isActive = false
            )
            
            // Then
            assertThat(updatedDomain.id).isEqualTo("existing_type") // Unchanged
            assertThat(updatedDomain.category).isEqualTo(PropertyTypeCategory.BASIC) // Unchanged
            assertThat(updatedDomain.description).isEqualTo("Updated description")
            assertThat(updatedDomain.icon).isEqualTo("📝")
            assertThat(updatedDomain.validationSchema).isEqualTo(newValidationRules)
            assertThat(updatedDomain.defaultConfig).isEqualTo(newDefaultConfig)
            assertThat(updatedDomain.isActive).isFalse()
        }
        
        @Test
        @DisplayName("Should preserve existing values when update parameters are null")
        fun `should preserve existing values when update parameters are null`() {
            // Given
            val originalValidationSchema = buildJsonObject { put("original", "validation") }
            val originalDefaultConfig = buildJsonObject { put("original", "config") }
            
            val existingDomain = PropertyTypeCatalog(
                id = "preserve_test",
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = originalValidationSchema,
                defaultConfig = originalDefaultConfig,
                uiComponent = "OriginalComponent",
                icon = "🔧",
                description = "Original description",
                isActive = true
            )
            
            // When - Update with all null parameters
            val updatedDomain = mapper.updateFromRequest(
                domain = existingDomain,
                description = null,
                icon = null,
                configSchema = null,
                defaultConfig = null,
                validationRules = null,
                isActive = null
            )
            
            // Then - All values should be preserved
            assertThat(updatedDomain.id).isEqualTo("preserve_test")
            assertThat(updatedDomain.category).isEqualTo(PropertyTypeCategory.ADVANCED)
            assertThat(updatedDomain.validationSchema).isEqualTo(originalValidationSchema)
            assertThat(updatedDomain.defaultConfig).isEqualTo(originalDefaultConfig)
            assertThat(updatedDomain.uiComponent).isEqualTo("OriginalComponent")
            assertThat(updatedDomain.icon).isEqualTo("🔧")
            assertThat(updatedDomain.description).isEqualTo("Original description")
            assertThat(updatedDomain.isActive).isTrue()
        }
        
        @Test
        @DisplayName("Should handle partial updates correctly")
        fun `should handle partial updates correctly`() {
            // Given
            val existingDomain = PropertyTypeCatalog(
                id = "partial_update",
                category = PropertyTypeCategory.RELATION,
                description = "Keep this description",
                icon = "Keep this icon",
                isActive = true
            )
            
            // When - Update only description and isActive
            val updatedDomain = mapper.updateFromRequest(
                domain = existingDomain,
                description = "New description",
                isActive = false
                // Other parameters are null/default
            )
            
            // Then
            assertThat(updatedDomain.description).isEqualTo("New description")
            assertThat(updatedDomain.isActive).isFalse()
            assertThat(updatedDomain.icon).isEqualTo("Keep this icon") // Preserved
            assertThat(updatedDomain.id).isEqualTo("partial_update") // Preserved
            assertThat(updatedDomain.category).isEqualTo(PropertyTypeCategory.RELATION) // Preserved
        }
        
        @Test
        @DisplayName("Should handle validationRules vs configSchema precedence")
        fun `should handle validation rules vs config schema precedence`() {
            // Given
            val existingDomain = PropertyTypeCatalog(
                id = "precedence_test",
                category = PropertyTypeCategory.BASIC,
                validationSchema = buildJsonObject { put("original", "schema") }
            )
            
            val newValidationRules = buildJsonObject { put("validation", "rules") }
            val newConfigSchema = buildJsonObject { put("config", "schema") }
            
            // When - Both validationRules and configSchema provided
            val updatedDomain = mapper.updateFromRequest(
                domain = existingDomain,
                configSchema = newConfigSchema,
                validationRules = newValidationRules
            )
            
            // Then - validationRules should take precedence
            assertThat(updatedDomain.validationSchema).isEqualTo(newValidationRules)
            assertThat(updatedDomain.validationSchema).isNotEqualTo(newConfigSchema)
        }
    }
    
    // Helper methods
    
    private fun createMinimalRequest(typeId: String): CustomPropertyTypeRequest {
        return CustomPropertyTypeRequest(
            typeId = typeId,
            category = "basic"
        )
    }
    
    private fun createComplexRequest(): CustomPropertyTypeRequest {
        return CustomPropertyTypeRequest(
            typeId = "complex_type",
            category = "advanced",
            description = "Complex custom type with full configuration",
            icon = "🔧",
            uiComponent = "ComplexInput",
            configSchema = buildJsonObject { put("schemaType", "complex") },
            defaultConfig = buildJsonObject { put("defaultValue", "complex") },
            validationRules = buildJsonObject { put("required", true) }
        )
    }
}