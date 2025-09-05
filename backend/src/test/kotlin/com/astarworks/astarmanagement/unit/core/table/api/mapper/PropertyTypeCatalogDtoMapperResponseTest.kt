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
 * Unit tests for PropertyTypeCatalogDtoMapper response creation functionality.
 * Tests PropertyTypeCatalogResponse generation and category grouping.
 */
@UnitTest
@DisplayName("PropertyTypeCatalogDtoMapper Response Tests")
class PropertyTypeCatalogDtoMapperResponseTest {
    
    private lateinit var mapper: PropertyTypeCatalogDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = PropertyTypeCatalogDtoMapper()
    }
    
    @Nested
    @DisplayName("Catalog Response Creation")
    inner class CatalogResponseCreation {
        
        @Test
        @DisplayName("Should create catalog response with category grouping")
        fun `should create catalog response with category grouping`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog.createTextType(),
                PropertyTypeCatalog.createNumberType(),
                PropertyTypeCatalog.createEmailType(),
                PropertyTypeCatalog.createUserType(),
                createSystemType()
            )
            
            // When
            val response = mapper.toCatalogResponse(domains)
            
            // Then
            assertThat(response.types).hasSize(5)
            assertThat(response.categories).hasSize(4) // basic, advanced, relation, system
            
            // Verify category grouping
            assertThat(response.categories["basic"]).hasSize(2) // text, number
            assertThat(response.categories["advanced"]).hasSize(1) // email
            assertThat(response.categories["relation"]).hasSize(1) // user
            assertThat(response.categories["system"]).hasSize(1) // system type
            
            // Verify types list matches categories content
            val allTypesFromCategories = response.categories.values.flatten()
            assertThat(allTypesFromCategories).hasSize(5)
            assertThat(response.types).containsExactlyInAnyOrderElementsOf(allTypesFromCategories)
        }
        
        @Test
        @DisplayName("Should handle single category with multiple types")
        fun `should handle single category with multiple types`() {
            // Given
            val basicTypes = listOf(
                PropertyTypeCatalog.createTextType(),
                PropertyTypeCatalog.createLongTextType(),
                PropertyTypeCatalog.createNumberType(),
                PropertyTypeCatalog.createCheckboxType(),
                PropertyTypeCatalog.createDateType(),
                PropertyTypeCatalog.createSelectType()
            )
            
            // When
            val response = mapper.toCatalogResponse(basicTypes)
            
            // Then
            assertThat(response.types).hasSize(6)
            assertThat(response.categories).hasSize(1)
            assertThat(response.categories["basic"]).hasSize(6)
            
            // Verify all types are basic category
            val basicCategoryTypes = response.categories["basic"]!!
            assertThat(basicCategoryTypes.all { it.category == "basic" }).isTrue()
            
            // Verify specific types are present
            val typeIds = basicCategoryTypes.map { it.typeId }
            assertThat(typeIds).containsExactlyInAnyOrder(
                "text", "long_text", "number", "checkbox", "date", "select"
            )
        }
        
        @Test
        @DisplayName("Should handle mixed categories correctly")
        fun `should handle mixed categories correctly`() {
            // Given
            val mixedTypes = listOf(
                PropertyTypeCatalog(id = "basic1", category = PropertyTypeCategory.BASIC),
                PropertyTypeCatalog(id = "advanced1", category = PropertyTypeCategory.ADVANCED),
                PropertyTypeCatalog(id = "basic2", category = PropertyTypeCategory.BASIC),
                PropertyTypeCatalog(id = "relation1", category = PropertyTypeCategory.RELATION),
                PropertyTypeCatalog(id = "advanced2", category = PropertyTypeCategory.ADVANCED),
                PropertyTypeCatalog(id = "system1", category = PropertyTypeCategory.SYSTEM)
            )
            
            // When
            val response = mapper.toCatalogResponse(mixedTypes)
            
            // Then
            assertThat(response.categories).hasSize(4)
            assertThat(response.categories["basic"]).hasSize(2)
            assertThat(response.categories["advanced"]).hasSize(2)
            assertThat(response.categories["relation"]).hasSize(1)
            assertThat(response.categories["system"]).hasSize(1)
            
            // Verify type distribution
            assertThat(response.categories["basic"]?.map { it.typeId })
                .containsExactlyInAnyOrder("basic1", "basic2")
            assertThat(response.categories["advanced"]?.map { it.typeId })
                .containsExactlyInAnyOrder("advanced1", "advanced2")
            assertThat(response.categories["relation"]?.map { it.typeId })
                .containsExactly("relation1")
            assertThat(response.categories["system"]?.map { it.typeId })
                .containsExactly("system1")
        }
        
        @Test
        @DisplayName("Should handle empty domain list")
        fun `should handle empty domain list`() {
            // Given
            val emptyDomains = emptyList<PropertyTypeCatalog>()
            
            // When
            val response = mapper.toCatalogResponse(emptyDomains)
            
            // Then
            assertThat(response.types).isEmpty()
            assertThat(response.categories).isEmpty()
        }
    }
    
    @Nested
    @DisplayName("Response Structure Validation")
    inner class ResponseStructureValidation {
        
        @Test
        @DisplayName("Should maintain consistency between types and categories")
        fun `should maintain consistency between types and categories`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog.createTextType(),
                PropertyTypeCatalog.createEmailType(),
                PropertyTypeCatalog.createUserType()
            )
            
            // When
            val response = mapper.toCatalogResponse(domains)
            
            // Then
            // Count types in categories should equal total types
            val typesInCategories = response.categories.values.sumOf { it.size }
            assertThat(typesInCategories).isEqualTo(response.types.size)
            
            // Each type in response.types should be in exactly one category
            val allCategoryTypes = response.categories.values.flatten()
            assertThat(allCategoryTypes).hasSize(response.types.size)
            
            // Type IDs should match between lists
            val responseTypeIds = response.types.map { it.typeId }.sorted()
            val categoryTypeIds = allCategoryTypes.map { it.typeId }.sorted()
            assertThat(responseTypeIds).isEqualTo(categoryTypeIds)
        }
        
        @Test
        @DisplayName("Should preserve DTO conversion accuracy in response")
        fun `should preserve dto conversion accuracy in response`() {
            // Given
            val domain = PropertyTypeCatalog(
                id = "complex_type",
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = buildJsonObject { put("required", true) },
                defaultConfig = buildJsonObject { put("default", "test") },
                uiComponent = "ComplexComponent",
                icon = "🔧",
                description = "Complex test type",
                isActive = false,
                isCustom = true
            )
            
            // When
            val response = mapper.toCatalogResponse(listOf(domain))
            val directDto = mapper.toDto(domain)
            
            // Then
            val responseDto = response.types.first()
            assertThat(responseDto.typeId).isEqualTo(directDto.typeId)
            assertThat(responseDto.category).isEqualTo(directDto.category)
            assertThat(responseDto.uiComponent).isEqualTo(directDto.uiComponent)
            assertThat(responseDto.icon).isEqualTo(directDto.icon)
            assertThat(responseDto.validationRules).isEqualTo(directDto.validationRules)
            assertThat(responseDto.defaultConfig).isEqualTo(directDto.defaultConfig)
            assertThat(responseDto.description).isEqualTo(directDto.description)
            assertThat(responseDto.isActive).isEqualTo(directDto.isActive)
            assertThat(responseDto.isCustom).isEqualTo(directDto.isCustom)
            
            // Verify it's properly categorized
            assertThat(response.categories["advanced"]).hasSize(1)
            assertThat(response.categories["advanced"]?.first()?.typeId).isEqualTo("complex_type")
        }
        
        @Test
        @DisplayName("Should handle duplicate type IDs in different categories")
        fun `should handle duplicate type ids in different categories`() {
            // Given - This scenario shouldn't occur in real usage, but test robustness
            val domains = listOf(
                PropertyTypeCatalog(id = "duplicate", category = PropertyTypeCategory.BASIC),
                PropertyTypeCatalog(id = "duplicate", category = PropertyTypeCategory.ADVANCED),
                PropertyTypeCatalog(id = "unique", category = PropertyTypeCategory.RELATION)
            )
            
            // When
            val response = mapper.toCatalogResponse(domains)
            
            // Then
            assertThat(response.types).hasSize(3)
            assertThat(response.categories).hasSize(3)
            
            // Both duplicates should be present in their respective categories
            assertThat(response.categories["basic"]).hasSize(1)
            assertThat(response.categories["advanced"]).hasSize(1)
            assertThat(response.categories["relation"]).hasSize(1)
            
            assertThat(response.categories["basic"]?.first()?.typeId).isEqualTo("duplicate")
            assertThat(response.categories["advanced"]?.first()?.typeId).isEqualTo("duplicate")
            assertThat(response.categories["relation"]?.first()?.typeId).isEqualTo("unique")
        }
    }
    
    // Helper methods
    
    private fun createSystemType(id: String = "created_time"): PropertyTypeCatalog {
        return PropertyTypeCatalog(
            id = id,
            category = PropertyTypeCategory.SYSTEM,
            defaultConfig = buildJsonObject { put("autoGenerated", true) },
            uiComponent = "TimestampDisplay",
            icon = "🕒",
            description = "System-generated timestamp",
            isActive = true,
            isCustom = false
        )
    }
}