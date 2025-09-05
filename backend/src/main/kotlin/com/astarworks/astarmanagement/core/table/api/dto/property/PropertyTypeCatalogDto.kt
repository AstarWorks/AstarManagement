package com.astarworks.astarmanagement.core.table.api.dto.property

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import kotlinx.serialization.SerialName
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * DTO for property type catalog item.
 * Represents a type that can be used for property definitions.
 * No display names or i18n keys - frontend handles localization based on typeId.
 */
@Serializable
data class PropertyTypeCatalogDto(
    @field:NotBlank
    val typeId: String,
    
    val category: String,
    
    val uiComponent: String? = null,
    
    val icon: String? = null,
    
    val configSchema: JsonObject? = null,
    
    val defaultConfig: JsonObject? = null,
    
    val validationRules: JsonObject? = null,
    
    val description: String? = null,
    
    val isCustom: Boolean = false,
    
    val isActive: Boolean = true
) {
    /**
     * Creates a property definition with this type.
     */
    fun createPropertyDefinition(
        key: String,
        displayName: String,
        config: JsonObject? = null
    ): PropertyDefinitionDto {
        return PropertyDefinitionDto(
            key = key,
            typeId = typeId,
            displayName = displayName,
            config = config ?: defaultConfig ?: JsonObject(emptyMap())
        )
    }
    
    /**
     * Checks if a configuration is valid for this type.
     */
    fun isConfigValid(config: JsonObject): Boolean {
        if (configSchema == null) return true
        
        // Basic validation - check required fields
        val requiredFields = configSchema
            .filter { (_, schema) -> 
                (schema as? JsonObject)?.get("required")?.let { 
                    (it as? JsonPrimitive)?.booleanOrNull == true 
                } ?: false
            }
            .keys
        
        return requiredFields.all { field -> config.containsKey(field) }
    }
}

/**
 * Response DTO for property type catalog listing.
 */
@Serializable
data class PropertyTypeCatalogResponse(
    val types: List<PropertyTypeCatalogDto>,
    
    val categories: Map<String, List<PropertyTypeCatalogDto>>
) {
    companion object {
        /**
         * Creates a catalog response from a list of types.
         */
        fun from(types: List<PropertyTypeCatalogDto>): PropertyTypeCatalogResponse {
            val categories = types.groupBy { it.category }
            return PropertyTypeCatalogResponse(
                types = types,
                categories = categories
            )
        }
        
        /**
         * Creates an empty catalog response.
         */
        fun empty(): PropertyTypeCatalogResponse {
            return PropertyTypeCatalogResponse(
                types = emptyList(),
                categories = emptyMap()
            )
        }
    }
}

/**
 * Request DTO for registering a custom property type.
 */
@Serializable
data class CustomPropertyTypeRequest(
    @field:NotBlank
    @field:Size(min = 3, max = 50)
    val typeId: String,
    
    val category: String = "custom",
    
    @field:Size(max = 500)
    val description: String? = null,
    
    val icon: String? = null,
    
    val uiComponent: String? = null,
    
    val configSchema: JsonObject? = null,
    
    val defaultConfig: JsonObject? = null,
    
    val validationRules: JsonObject? = null
)

/**
 * Request DTO for updating a custom property type.
 */
@Serializable
data class PropertyTypeUpdateRequest(
    val description: String? = null,
    
    val icon: String? = null,
    
    val configSchema: JsonObject? = null,
    
    val defaultConfig: JsonObject? = null,
    
    val validationRules: JsonObject? = null,
    
    val isActive: Boolean? = null
)