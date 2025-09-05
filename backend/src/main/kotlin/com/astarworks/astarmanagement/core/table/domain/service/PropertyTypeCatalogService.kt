package com.astarworks.astarmanagement.core.table.domain.service

import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyTypeCatalogDto
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyTypeCatalogResponse
import com.astarworks.astarmanagement.core.table.api.mapper.PropertyTypeCatalogDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory
import com.astarworks.astarmanagement.core.table.domain.repository.PropertyTypeCatalogRepository
import kotlinx.serialization.json.JsonObject
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Service for managing property type catalog in the flexible table system.
 * 
 * Handles property type operations including:
 * - Property type registration and management
 * - Default property types initialization
 * - Category-based property type retrieval
 * - Property type activation/deactivation
 * - Value validation based on property types
 * - DTO conversions for API responses
 */
@Service
class PropertyTypeCatalogService(
    private val propertyTypeCatalogRepository: PropertyTypeCatalogRepository,
    private val dtoMapper: PropertyTypeCatalogDtoMapper
) {
    private val logger = LoggerFactory.getLogger(PropertyTypeCatalogService::class.java)
    
    
    /**
     * Creates a new property type.
     * 
     * @param catalog The property type catalog
     * @return The created property type
     * @throws IllegalArgumentException if ID already exists
     */
    @Transactional
    fun createPropertyType(catalog: PropertyTypeCatalog): PropertyTypeCatalog {
        logger.info("Creating property type: ${catalog.id}")
        
        if (propertyTypeCatalogRepository.existsById(catalog.id)) {
            throw IllegalArgumentException("Property type with ID '${catalog.id}' already exists")
        }
        
        val savedCatalog = propertyTypeCatalogRepository.save(catalog)
        logger.info("Created property type: ${savedCatalog.id}")
        
        return savedCatalog
    }
    
    /**
     * Updates a property type.
     * 
     * @param id The property type ID
     * @param displayName Optional new display name
     * @param validationSchema Optional new validation schema
     * @param defaultConfig Optional new default config
     * @param description Optional new description
     * @return The updated property type
     * @throws IllegalArgumentException if property type not found
     */
    @Transactional
    fun updatePropertyType(
        id: String,
        validationSchema: JsonObject? = null,
        defaultConfig: JsonObject? = null,
        description: String? = null,
        icon: String? = null,
        uiComponent: String? = null
    ): PropertyTypeCatalog {
        logger.info("Updating property type: $id")
        
        val catalog = getPropertyTypeById(id)
        
        // Don't allow updating system types
        if (isSystemType(id)) {
            throw IllegalStateException("Cannot modify system property type: $id")
        }
        
        val updatedCatalog = catalog.copy(
            validationSchema = validationSchema ?: catalog.validationSchema,
            defaultConfig = defaultConfig ?: catalog.defaultConfig,
            description = description ?: catalog.description,
            icon = icon ?: catalog.icon,
            uiComponent = uiComponent ?: catalog.uiComponent
        )
        
        val savedCatalog = propertyTypeCatalogRepository.save(updatedCatalog)
        logger.info("Updated property type: $id")
        
        return savedCatalog
    }
    
    /**
     * Gets a property type by ID.
     * 
     * @param id The property type ID
     * @return The property type
     * @throws IllegalArgumentException if property type not found
     */
    @Transactional(readOnly = true)
    fun getPropertyTypeById(id: String): PropertyTypeCatalog {
        return propertyTypeCatalogRepository.findById(id)
            ?: throw IllegalArgumentException("Property type with ID '$id' not found")
    }
    
    /**
     * Deletes a property type.
     * 
     * @param id The property type ID
     * @throws IllegalArgumentException if property type not found
     * @throws IllegalStateException if trying to delete system type
     */
    @Transactional
    fun deletePropertyType(id: String) {
        logger.info("Deleting property type: $id")
        
        if (!propertyTypeCatalogRepository.existsById(id)) {
            throw IllegalArgumentException("Property type with ID '$id' not found")
        }
        
        if (isSystemType(id)) {
            throw IllegalStateException("Cannot delete system property type: $id")
        }
        
        propertyTypeCatalogRepository.deleteById(id)
        logger.info("Deleted property type: $id")
    }
    
    /**
     * Gets all property types.
     * 
     * @return List of all property types
     */
    @Transactional(readOnly = true)
    fun getAllPropertyTypes(): List<PropertyTypeCatalog> {
        return propertyTypeCatalogRepository.findAll()
    }
    
    /**
     * Gets all active property types.
     * 
     * @return List of active property types
     */
    @Transactional(readOnly = true)
    fun getActivePropertyTypes(): List<PropertyTypeCatalog> {
        return propertyTypeCatalogRepository.findAllActive()
    }
    
    /**
     * Gets property types by category.
     * 
     * @param category The property type category
     * @return List of property types in the category
     */
    @Transactional(readOnly = true)
    fun getPropertyTypesByCategory(category: PropertyTypeCategory): List<PropertyTypeCatalog> {
        return propertyTypeCatalogRepository.findByCategory(category)
    }
    
    /**
     * Activates a property type.
     * 
     * @param id The property type ID
     * @return The activated property type
     * @throws IllegalArgumentException if property type not found
     */
    @Transactional
    fun activatePropertyType(id: String): PropertyTypeCatalog {
        logger.info("Activating property type: $id")
        
        val catalog = getPropertyTypeById(id)
        val activatedCatalog = catalog.copy(isActive = true)
        val savedCatalog = propertyTypeCatalogRepository.save(activatedCatalog)
        
        logger.info("Activated property type: $id")
        return savedCatalog
    }
    
    /**
     * Deactivates a property type.
     * 
     * @param id The property type ID
     * @return The deactivated property type
     * @throws IllegalArgumentException if property type not found
     * @throws IllegalStateException if trying to deactivate system type
     */
    @Transactional
    fun deactivatePropertyType(id: String): PropertyTypeCatalog {
        logger.info("Deactivating property type: $id")
        
        val catalog = getPropertyTypeById(id)
        
        if (isSystemType(id)) {
            throw IllegalStateException("Cannot deactivate system property type: $id")
        }
        
        val deactivatedCatalog = catalog.copy(isActive = false)
        val savedCatalog = propertyTypeCatalogRepository.save(deactivatedCatalog)
        
        logger.info("Deactivated property type: $id")
        return savedCatalog
    }
    
    
    /**
     * Checks if a property type exists and is valid.
     * 
     * @param id The property type ID
     * @return true if exists and active, false otherwise
     */
    @Transactional(readOnly = true)
    fun isValidPropertyType(id: String): Boolean {
        val catalog = propertyTypeCatalogRepository.findById(id)
        return catalog != null && catalog.isActive
    }
    
    /**
     * Validates a value against a property type.
     * 
     * @param typeId The property type ID
     * @param value The value to validate
     * @return true if valid, false otherwise
     */
    @Transactional(readOnly = true)
    fun validatePropertyValue(typeId: String, value: Any?): Boolean {
        val catalog = propertyTypeCatalogRepository.findById(typeId) ?: return false
        
        if (value == null) {
            // Check if null is allowed (from validation schema)
            val nullableElement = catalog.validationSchema?.get("nullable")
            val nullable = when {
                nullableElement is kotlinx.serialization.json.JsonPrimitive && nullableElement.isString == false -> {
                    try {
                        nullableElement.content.toBoolean()
                    } catch (e: Exception) {
                        true // Default to allowing nulls on parsing error
                    }
                }
                nullableElement is Boolean -> nullableElement
                else -> true // Default to allowing nulls
            }
            return nullable
        }
        
        // Type-specific validation
        return when (typeId) {
            PropertyTypeCatalog.TEXT, PropertyTypeCatalog.LONG_TEXT -> value is String
            PropertyTypeCatalog.NUMBER -> value is Number
            PropertyTypeCatalog.CHECKBOX -> value is Boolean
            PropertyTypeCatalog.DATE -> value is String // ISO date string
            PropertyTypeCatalog.SELECT, PropertyTypeCatalog.MULTI_SELECT -> {
                // TODO: Validate against allowed options
                true
            }
            PropertyTypeCatalog.EMAIL -> {
                value is String && value.contains("@")
            }
            PropertyTypeCatalog.URL -> {
                value is String && (value.startsWith("http://") || value.startsWith("https://"))
            }
            PropertyTypeCatalog.PHONE -> {
                value is String && value.matches(Regex("^[+\\d\\s()-]+$"))
            }
            else -> true
        }
    }
    
    /**
     * Checks if a property type is a system type.
     * System types cannot be modified or deleted.
     * 
     * @param id The property type ID
     * @return true if system type, false otherwise
     */
    private fun isSystemType(id: String): Boolean {
        return id in listOf(
            PropertyTypeCatalog.TEXT,
            PropertyTypeCatalog.LONG_TEXT,
            PropertyTypeCatalog.NUMBER,
            PropertyTypeCatalog.CHECKBOX,
            PropertyTypeCatalog.DATE,
            PropertyTypeCatalog.SELECT,
            PropertyTypeCatalog.MULTI_SELECT
        )
    }
    
    
    // ========================================
    // DTO Conversion Methods for API Layer
    // ========================================
    
    /**
     * Gets all property types as DTOs.
     * 
     * @return List of PropertyTypeCatalogDto
     */
    @Transactional(readOnly = true)
    fun getAllTypesAsDto(): List<PropertyTypeCatalogDto> {
        val types = getAllPropertyTypes()
        return dtoMapper.toDtoList(types)
    }
    
    /**
     * Gets only active property types as DTOs.
     * 
     * @return List of active PropertyTypeCatalogDto
     */
    @Transactional(readOnly = true)
    fun getActiveTypesAsDto(): List<PropertyTypeCatalogDto> {
        val types = getActivePropertyTypes()
        return dtoMapper.toDtoList(types)
    }
    
    /**
     * Gets property types by category as DTOs.
     * 
     * @param category The category to filter by
     * @return List of PropertyTypeCatalogDto in the specified category
     */
    @Transactional(readOnly = true)
    fun getTypesByCategoryAsDto(category: String): List<PropertyTypeCatalogDto> {
        val categoryEnum = try {
            PropertyTypeCategory.valueOf(category.uppercase())
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid category requested: $category")
            return emptyList()
        }
        
        val types = getPropertyTypesByCategory(categoryEnum)
        return dtoMapper.toDtoList(types)
    }
    
    /**
     * Gets a complete catalog response with all types grouped by category.
     * 
     * @param activeOnly Whether to include only active types
     * @return PropertyTypeCatalogResponse with grouped types
     */
    @Transactional(readOnly = true)
    fun getCatalogResponse(activeOnly: Boolean = false): PropertyTypeCatalogResponse {
        val types = if (activeOnly) {
            getActivePropertyTypes()
        } else {
            getAllPropertyTypes()
        }
        return dtoMapper.toCatalogResponse(types)
    }
    
    /**
     * Gets a property type by ID as a DTO.
     * 
     * @param id The property type ID
     * @return PropertyTypeCatalogDto or null if not found
     */
    @Transactional(readOnly = true)
    fun getTypeByIdAsDto(id: String): PropertyTypeCatalogDto? {
        return try {
            val type = getPropertyTypeById(id)
            dtoMapper.toDto(type)
        } catch (e: IllegalArgumentException) {
            logger.debug("Property type not found: $id")
            null
        }
    }
    
    /**
     * Gets summary DTOs for dropdown/list views.
     * Omits detailed configuration for performance.
     * 
     * @param activeOnly Whether to include only active types
     * @return List of summary PropertyTypeCatalogDto
     */
    @Transactional(readOnly = true)
    fun getSummaryTypes(activeOnly: Boolean = true): List<PropertyTypeCatalogDto> {
        val types = if (activeOnly) {
            getActivePropertyTypes()
        } else {
            getAllPropertyTypes()
        }
        return dtoMapper.toSummaryDtoList(types)
    }
    
    /**
     * Gets built-in (non-custom) types as DTOs.
     * 
     * @return List of built-in PropertyTypeCatalogDto
     */
    @Transactional(readOnly = true)
    fun getBuiltInTypesAsDto(): List<PropertyTypeCatalogDto> {
        val types = getAllPropertyTypes().filter { !it.isCustom }
        return dtoMapper.toDtoList(types)
    }
    
    /**
     * Gets custom types as DTOs.
     * 
     * @return List of custom PropertyTypeCatalogDto
     */
    @Transactional(readOnly = true)
    fun getCustomTypesAsDto(): List<PropertyTypeCatalogDto> {
        val types = getAllPropertyTypes().filter { it.isCustom }
        return dtoMapper.toDtoList(types)
    }
}