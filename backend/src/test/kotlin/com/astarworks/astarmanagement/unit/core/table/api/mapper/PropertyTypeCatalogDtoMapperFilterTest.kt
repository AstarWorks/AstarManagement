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
 * Unit tests for PropertyTypeCatalogDtoMapper filtering and summary functionality.
 * Tests filtered list operations and summary DTO generation.
 */
@UnitTest
@DisplayName("PropertyTypeCatalogDtoMapper Filter Tests")
class PropertyTypeCatalogDtoMapperFilterTest {
    
    private lateinit var mapper: PropertyTypeCatalogDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = PropertyTypeCatalogDtoMapper()
    }
    
    @Nested
    @DisplayName("Filtered List Operations")
    inner class FilteredListOperations {
        
        @Test
        @DisplayName("Should filter by activeOnly flag")
        fun `should filter by active only flag`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog(id = "active1", isActive = true, isCustom = false),
                PropertyTypeCatalog(id = "inactive1", isActive = false, isCustom = false),
                PropertyTypeCatalog(id = "active2", isActive = true, isCustom = true),
                PropertyTypeCatalog(id = "inactive2", isActive = false, isCustom = true)
            )
            
            // When
            val activeDtos = mapper.toFilteredDtoList(
                domains = domains,
                activeOnly = true,
                includeCustom = true
            )
            
            // Then
            assertThat(activeDtos).hasSize(2)
            val activeTypeIds = activeDtos.map { it.typeId }
            assertThat(activeTypeIds).containsExactlyInAnyOrder("active1", "active2")
            assertThat(activeDtos.all { it.isActive }).isTrue()
        }
        
        @Test
        @DisplayName("Should filter by includeCustom flag")
        fun `should filter by include custom flag`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog(id = "system1", isActive = true, isCustom = false),
                PropertyTypeCatalog(id = "custom1", isActive = true, isCustom = true),
                PropertyTypeCatalog(id = "system2", isActive = false, isCustom = false),
                PropertyTypeCatalog(id = "custom2", isActive = false, isCustom = true)
            )
            
            // When
            val systemOnlyDtos = mapper.toFilteredDtoList(
                domains = domains,
                activeOnly = false,
                includeCustom = false
            )
            
            // Then
            assertThat(systemOnlyDtos).hasSize(2)
            val systemTypeIds = systemOnlyDtos.map { it.typeId }
            assertThat(systemTypeIds).containsExactlyInAnyOrder("system1", "system2")
            assertThat(systemOnlyDtos.all { !it.isCustom }).isTrue()
        }
        
        @Test
        @DisplayName("Should apply both filters simultaneously")
        fun `should apply both filters simultaneously`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog(id = "active_system", isActive = true, isCustom = false),
                PropertyTypeCatalog(id = "inactive_system", isActive = false, isCustom = false),
                PropertyTypeCatalog(id = "active_custom", isActive = true, isCustom = true),
                PropertyTypeCatalog(id = "inactive_custom", isActive = false, isCustom = true)
            )
            
            // When - Filter for active system types only
            val filteredDtos = mapper.toFilteredDtoList(
                domains = domains,
                activeOnly = true,
                includeCustom = false
            )
            
            // Then
            assertThat(filteredDtos).hasSize(1)
            assertThat(filteredDtos[0].typeId).isEqualTo("active_system")
            assertThat(filteredDtos[0].isActive).isTrue()
            assertThat(filteredDtos[0].isCustom).isFalse()
        }
        
        @Test
        @DisplayName("Should handle empty result from filtering")
        fun `should handle empty result from filtering`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog(id = "inactive_custom", isActive = false, isCustom = true)
            )
            
            // When - Filter for active system types (none available)
            val filteredDtos = mapper.toFilteredDtoList(
                domains = domains,
                activeOnly = true,
                includeCustom = false
            )
            
            // Then
            assertThat(filteredDtos).isEmpty()
        }
        
        @Test
        @DisplayName("Should use default filter parameters correctly")
        fun `should use default filter parameters correctly`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog(id = "active_system", isActive = true, isCustom = false),
                PropertyTypeCatalog(id = "inactive_system", isActive = false, isCustom = false),
                PropertyTypeCatalog(id = "active_custom", isActive = true, isCustom = true),
                PropertyTypeCatalog(id = "inactive_custom", isActive = false, isCustom = true)
            )
            
            // When - Use default parameters (activeOnly = false, includeCustom = true)
            val allDtos = mapper.toFilteredDtoList(domains)
            
            // Then - Should return all types
            assertThat(allDtos).hasSize(4)
            val typeIds = allDtos.map { it.typeId }
            assertThat(typeIds).containsExactlyInAnyOrder(
                "active_system", "inactive_system", "active_custom", "inactive_custom"
            )
        }
    }
    
    @Nested
    @DisplayName("Summary Operations")
    inner class SummaryOperations {
        
        @Test
        @DisplayName("Should create summary DTO with essential fields only")
        fun `should create summary dto with essential fields only`() {
            // Given
            val complexDomain = PropertyTypeCatalog(
                id = "complex_summary",
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = buildJsonObject { 
                    put("required", true)
                    put("complex", "validation") 
                },
                defaultConfig = buildJsonObject { 
                    put("complex", "config") 
                    put("nested", buildJsonObject { put("deep", "value") })
                },
                uiComponent = "ComplexComponent",
                icon = "🔧",
                description = "Complex type with detailed configuration",
                isActive = true,
                isCustom = true
            )
            
            // When
            val summaryDto = mapper.toSummaryDto(complexDomain)
            
            // Then - Essential fields preserved
            assertThat(summaryDto.typeId).isEqualTo("complex_summary")
            assertThat(summaryDto.category).isEqualTo("advanced")
            assertThat(summaryDto.uiComponent).isEqualTo("ComplexComponent")
            assertThat(summaryDto.icon).isEqualTo("🔧")
            assertThat(summaryDto.isActive).isTrue()
            assertThat(summaryDto.isCustom).isTrue()
            
            // Then - Detailed fields omitted
            assertThat(summaryDto.configSchema).isNull()
            assertThat(summaryDto.defaultConfig).isNull()
            assertThat(summaryDto.validationRules).isNull()
            assertThat(summaryDto.description).isNull()
        }
        
        @Test
        @DisplayName("Should create summary DTO list from domains")
        fun `should create summary dto list from domains`() {
            // Given
            val domains = listOf(
                PropertyTypeCatalog(
                    id = "summary1",
                    category = PropertyTypeCategory.BASIC,
                    description = "This will be omitted",
                    validationSchema = buildJsonObject { put("omit", "me") },
                    isActive = true
                ),
                PropertyTypeCatalog(
                    id = "summary2", 
                    category = PropertyTypeCategory.ADVANCED,
                    defaultConfig = buildJsonObject { put("omit", "me") },
                    description = "This will also be omitted",
                    isCustom = true
                ),
                PropertyTypeCatalog(
                    id = "summary3",
                    category = PropertyTypeCategory.RELATION,
                    uiComponent = "KeepThis",
                    icon = "📝"
                )
            )
            
            // When
            val summaryDtos = mapper.toSummaryDtoList(domains)
            
            // Then
            assertThat(summaryDtos).hasSize(3)
            
            // Check each summary DTO
            val summary1 = summaryDtos.find { it.typeId == "summary1" }!!
            assertThat(summary1.category).isEqualTo("basic")
            assertThat(summary1.description).isNull()
            assertThat(summary1.validationRules).isNull()
            assertThat(summary1.isActive).isTrue()
            
            val summary2 = summaryDtos.find { it.typeId == "summary2" }!!
            assertThat(summary2.category).isEqualTo("advanced")
            assertThat(summary2.defaultConfig).isNull()
            assertThat(summary2.description).isNull()
            assertThat(summary2.isCustom).isTrue()
            
            val summary3 = summaryDtos.find { it.typeId == "summary3" }!!
            assertThat(summary3.category).isEqualTo("relation")
            assertThat(summary3.uiComponent).isEqualTo("KeepThis")
            assertThat(summary3.icon).isEqualTo("📝")
        }
        
        @Test
        @DisplayName("Should handle domains with already null detail fields")
        fun `should handle domains with already null detail fields`() {
            // Given
            val minimalDomain = PropertyTypeCatalog(
                id = "minimal",
                category = PropertyTypeCategory.BASIC,
                validationSchema = null,
                defaultConfig = buildJsonObject { }, // Empty but not null
                uiComponent = null,
                icon = null,
                description = null,
                isActive = false,
                isCustom = false
            )
            
            // When
            val summaryDto = mapper.toSummaryDto(minimalDomain)
            
            // Then
            assertThat(summaryDto.typeId).isEqualTo("minimal")
            assertThat(summaryDto.category).isEqualTo("basic")
            assertThat(summaryDto.uiComponent).isNull()
            assertThat(summaryDto.icon).isNull()
            assertThat(summaryDto.configSchema).isNull()
            assertThat(summaryDto.defaultConfig).isNull() // Should be null even if domain has empty object
            assertThat(summaryDto.validationRules).isNull()
            assertThat(summaryDto.description).isNull()
            assertThat(summaryDto.isActive).isFalse()
            assertThat(summaryDto.isCustom).isFalse()
        }
    }
    
    // Helper methods
    
    private fun createTestDomain(
        id: String,
        category: PropertyTypeCategory = PropertyTypeCategory.BASIC,
        isActive: Boolean = true,
        isCustom: Boolean = false
    ): PropertyTypeCatalog {
        return PropertyTypeCatalog(
            id = id,
            category = category,
            isActive = isActive,
            isCustom = isCustom
        )
    }
}