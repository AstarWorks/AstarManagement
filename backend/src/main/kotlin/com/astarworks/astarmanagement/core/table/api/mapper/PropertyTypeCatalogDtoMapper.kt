package com.astarworks.astarmanagement.core.table.api.mapper

import com.astarworks.astarmanagement.core.table.api.dto.property.CustomPropertyTypeRequest
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyTypeCatalogDto
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyTypeCatalogResponse
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory
import kotlinx.serialization.json.JsonObject
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Mapper for converting between PropertyTypeCatalog domain models and DTOs.
 * Handles transformations for API layer communication.
 */
@Component
class PropertyTypeCatalogDtoMapper {
    
    /**
     * Converts a PropertyTypeCatalog domain model to PropertyTypeCatalogDto.
     * 
     * @param domain The PropertyTypeCatalog domain model
     * @return The corresponding PropertyTypeCatalogDto
     */
    fun toDto(domain: PropertyTypeCatalog): PropertyTypeCatalogDto {
        return PropertyTypeCatalogDto(
            typeId = domain.id,
            category = domain.category.name.lowercase(),
            uiComponent = domain.uiComponent,
            icon = domain.icon,
            configSchema = domain.validationSchema,
            defaultConfig = domain.defaultConfig,
            validationRules = domain.validationSchema,
            description = domain.description,
            isCustom = domain.isCustom,
            isActive = domain.isActive
        )
    }
    
    /**
     * Converts a list of PropertyTypeCatalog domain models to DTOs.
     * 
     * @param domains List of PropertyTypeCatalog domain models
     * @return List of corresponding PropertyTypeCatalogDtos
     */
    fun toDtoList(domains: List<PropertyTypeCatalog>): List<PropertyTypeCatalogDto> {
        return domains.map { toDto(it) }
    }
    
    /**
     * Creates a PropertyTypeCatalogResponse from a list of domain models.
     * Groups the types by category for organized presentation.
     * 
     * @param domains List of PropertyTypeCatalog domain models
     * @return PropertyTypeCatalogResponse with grouped types
     */
    fun toCatalogResponse(domains: List<PropertyTypeCatalog>): PropertyTypeCatalogResponse {
        val dtos = toDtoList(domains)
        return PropertyTypeCatalogResponse.from(dtos)
    }
    
    /**
     * Creates a PropertyTypeCatalog domain model from a CustomPropertyTypeRequest.
     * Used when creating new custom property types.
     * 
     * @param request The CustomPropertyTypeRequest DTO
     * @return A new PropertyTypeCatalog domain model
     */
    fun fromCreateRequest(request: CustomPropertyTypeRequest): PropertyTypeCatalog {
        return PropertyTypeCatalog(
            id = request.typeId,
            category = PropertyTypeCategory.valueOf(request.category.uppercase()),
            validationSchema = request.validationRules,
            defaultConfig = request.defaultConfig ?: JsonObject(emptyMap()),
            uiComponent = request.uiComponent,
            icon = request.icon,
            description = request.description,
            isActive = true,
            isCustom = true
        )
    }
    
    /**
     * Updates a PropertyTypeCatalog domain model with values from an update request.
     * Only updates non-null fields from the request.
     * 
     * @param domain The existing PropertyTypeCatalog domain model
     * @param description Optional new description
     * @param icon Optional new icon
     * @param configSchema Optional new config schema
     * @param defaultConfig Optional new default config
     * @param validationRules Optional new validation rules
     * @param isActive Optional new active status
     * @return Updated PropertyTypeCatalog domain model
     */
    fun updateFromRequest(
        domain: PropertyTypeCatalog,
        description: String? = null,
        icon: String? = null,
        configSchema: JsonObject? = null,
        defaultConfig: JsonObject? = null,
        validationRules: JsonObject? = null,
        isActive: Boolean? = null
    ): PropertyTypeCatalog {
        return domain.copy(
            description = description ?: domain.description,
            icon = icon ?: domain.icon,
            validationSchema = validationRules ?: configSchema ?: domain.validationSchema,
            defaultConfig = defaultConfig ?: domain.defaultConfig,
            isActive = isActive ?: domain.isActive
        )
    }
    
    /**
     * Filters and converts domain models to DTOs based on criteria.
     * Useful for filtered API responses.
     * 
     * @param domains List of PropertyTypeCatalog domain models
     * @param activeOnly Whether to include only active types
     * @param includeCustom Whether to include custom types
     * @return Filtered list of PropertyTypeCatalogDtos
     */
    fun toFilteredDtoList(
        domains: List<PropertyTypeCatalog>,
        activeOnly: Boolean = false,
        includeCustom: Boolean = true
    ): List<PropertyTypeCatalogDto> {
        var filtered = domains
        
        if (activeOnly) {
            filtered = filtered.filter { it.isActive }
        }
        
        if (!includeCustom) {
            filtered = filtered.filter { !it.isCustom }
        }
        
        return toDtoList(filtered)
    }
    
    /**
     * Creates a summary DTO with minimal information.
     * Used for list views and dropdowns.
     * 
     * @param domain The PropertyTypeCatalog domain model
     * @return A PropertyTypeCatalogDto with essential fields only
     */
    fun toSummaryDto(domain: PropertyTypeCatalog): PropertyTypeCatalogDto {
        return PropertyTypeCatalogDto(
            typeId = domain.id,
            category = domain.category.name.lowercase(),
            uiComponent = domain.uiComponent,
            icon = domain.icon,
            configSchema = null,  // Omit detailed config for summary
            defaultConfig = null, // Omit detailed config for summary
            validationRules = null,
            description = null,   // Omit description for summary
            isCustom = domain.isCustom,
            isActive = domain.isActive
        )
    }
    
    /**
     * Creates a list of summary DTOs.
     * 
     * @param domains List of PropertyTypeCatalog domain models
     * @return List of summary PropertyTypeCatalogDtos
     */
    fun toSummaryDtoList(domains: List<PropertyTypeCatalog>): List<PropertyTypeCatalogDto> {
        return domains.map { toSummaryDto(it) }
    }
}