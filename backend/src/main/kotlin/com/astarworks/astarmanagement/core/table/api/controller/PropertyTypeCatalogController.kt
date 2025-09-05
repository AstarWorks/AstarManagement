package com.astarworks.astarmanagement.core.table.api.controller
import org.springframework.web.server.ResponseStatusException

import com.astarworks.astarmanagement.core.table.api.dto.property.*
import com.astarworks.astarmanagement.core.table.api.mapper.PropertyTypeCatalogDtoMapper
import com.astarworks.astarmanagement.core.table.domain.service.PropertyTypeCatalogService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

/**
 * REST controller for managing property type catalog.
 * Provides endpoints for querying and managing property types in the flexible table system.
 */
@RestController
@RequestMapping("/api/v1/property-types")
@Tag(name = "Property Type Catalog", description = "Manage property types for flexible tables")
class PropertyTypeCatalogController(
    private val propertyTypeCatalogService: PropertyTypeCatalogService,
    private val dtoMapper: PropertyTypeCatalogDtoMapper
) {
    private val logger = LoggerFactory.getLogger(PropertyTypeCatalogController::class.java)
    
    /**
     * Gets all available property types.
     */
    @GetMapping
    @Operation(summary = "Get all property types", description = "Retrieves all available property types in the catalog")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved property types"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun getAllPropertyTypes(
        @Parameter(description = "Include only active types")
        @RequestParam(required = false, defaultValue = "false") activeOnly: Boolean
    ): PropertyTypeCatalogResponse {
        logger.debug("Getting all property types (activeOnly: $activeOnly)")
        
        val response = propertyTypeCatalogService.getCatalogResponse(activeOnly)
        return response
    }
    
    /**
     * Gets property types by category.
     */
    @GetMapping("/category/{category}")
    @Operation(summary = "Get property types by category", description = "Retrieves property types filtered by category")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved property types"),
        ApiResponse(responseCode = "400", description = "Invalid category"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun getPropertyTypesByCategory(
        @Parameter(description = "Category to filter by (basic, advanced, relation, system)")
        @PathVariable category: String
    ): List<PropertyTypeCatalogDto> {
        logger.debug("Getting property types by category: $category")
        
        val types = propertyTypeCatalogService.getTypesByCategoryAsDto(category)
        if (types.isEmpty()) {
            logger.warn("No property types found for category: $category")
        }
        
        return types
    }
    
    /**
     * Gets a specific property type by ID.
     */
    @GetMapping("/{typeId}")
    @Operation(summary = "Get property type by ID", description = "Retrieves a specific property type by its ID")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved property type"),
        ApiResponse(responseCode = "404", description = "Property type not found"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun getPropertyTypeById(
        @Parameter(description = "Property type ID")
        @PathVariable typeId: String
    ): PropertyTypeCatalogDto {
        logger.debug("Getting property type by ID: $typeId")
        
        val type = propertyTypeCatalogService.getTypeByIdAsDto(typeId)
        return type?.let {
            it
        } ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
    }
    
    /**
     * Gets summary property types for dropdowns.
     */
    @GetMapping("/summary")
    @Operation(summary = "Get property type summaries", description = "Retrieves lightweight property type information for UI dropdowns")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved property type summaries"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun getPropertyTypeSummaries(
        @Parameter(description = "Include only active types")
        @RequestParam(required = false, defaultValue = "true") activeOnly: Boolean
    ): List<PropertyTypeCatalogDto> {
        logger.debug("Getting property type summaries (activeOnly: $activeOnly)")
        
        val summaries = propertyTypeCatalogService.getSummaryTypes(activeOnly)
        return summaries
    }
    
    /**
     * Gets built-in property types only.
     */
    @GetMapping("/built-in")
    @Operation(summary = "Get built-in property types", description = "Retrieves only system-provided property types")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved built-in types"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun getBuiltInPropertyTypes(): List<PropertyTypeCatalogDto> {
        logger.debug("Getting built-in property types")
        
        val types = propertyTypeCatalogService.getBuiltInTypesAsDto()
        return types
    }
    
    /**
     * Gets custom property types only.
     */
    @GetMapping("/custom")
    @Operation(summary = "Get custom property types", description = "Retrieves only user-defined custom property types")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved custom types"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    @PreAuthorize("hasPermissionRule('property_type.view.all')")
    fun getCustomPropertyTypes(): List<PropertyTypeCatalogDto> {
        logger.debug("Getting custom property types")
        
        val types = propertyTypeCatalogService.getCustomTypesAsDto()
        return types
    }
    
    /**
     * Creates a new custom property type.
     */
    @PostMapping("/custom")
    @Operation(summary = "Create custom property type", description = "Creates a new user-defined property type")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Property type created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        ApiResponse(responseCode = "409", description = "Property type already exists")
    )
    @PreAuthorize("hasPermissionRule('property_type.create.all')")
    fun createCustomPropertyType(
        @Valid @RequestBody request: CustomPropertyTypeRequest
    ): PropertyTypeCatalogDto {
        logger.info("Creating custom property type: ${request.typeId}")
        
        return try {
            val propertyType = dtoMapper.fromCreateRequest(request)
            val created = propertyTypeCatalogService.createPropertyType(propertyType)
            val dto = dtoMapper.toDto(created)
            
            logger.info("Successfully created custom property type: ${request.typeId}")
            dto
        } catch (e: IllegalArgumentException) {
            logger.error("Failed to create property type: ${e.message}")
            throw ResponseStatusException(HttpStatus.CONFLICT)
        }
    }
    
    /**
     * Updates a custom property type.
     */
    @PatchMapping("/custom/{typeId}")
    @Operation(summary = "Update custom property type", description = "Updates an existing custom property type")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Property type updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden - cannot modify system types"),
        ApiResponse(responseCode = "404", description = "Property type not found")
    )
    @PreAuthorize("hasPermissionRule('property_type.edit.all')")
    fun updateCustomPropertyType(
        @Parameter(description = "Property type ID")
        @PathVariable typeId: String,
        @Valid @RequestBody request: PropertyTypeUpdateRequest
    ): PropertyTypeCatalogDto {
        logger.info("Updating custom property type: $typeId")
        
        return try {
            val updated = propertyTypeCatalogService.updatePropertyType(
                id = typeId,
                validationSchema = request.validationRules ?: request.configSchema,
                defaultConfig = request.defaultConfig,
                description = request.description,
                icon = request.icon
            )
            val dto = dtoMapper.toDto(updated)
            
            logger.info("Successfully updated property type: $typeId")
            dto
        } catch (e: IllegalArgumentException) {
            logger.error("Property type not found: $typeId")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        } catch (e: IllegalStateException) {
            logger.error("Cannot modify system property type: $typeId")
            throw ResponseStatusException(HttpStatus.FORBIDDEN)
        }
    }
    
    /**
     * Activates a property type.
     */
    @PostMapping("/{typeId}/activate")
    @Operation(summary = "Activate property type", description = "Activates a deactivated property type")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Property type activated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Property type not found")
    )
    @PreAuthorize("hasPermissionRule('property_type.activate.all')")
    fun activatePropertyType(
        @Parameter(description = "Property type ID")
        @PathVariable typeId: String
    ): PropertyTypeCatalogDto {
        logger.info("Activating property type: $typeId")
        
        return try {
            val activated = propertyTypeCatalogService.activatePropertyType(typeId)
            val dto = dtoMapper.toDto(activated)
            
            logger.info("Successfully activated property type: $typeId")
            dto
        } catch (e: IllegalArgumentException) {
            logger.error("Property type not found: $typeId")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }
    
    /**
     * Deactivates a property type.
     */
    @PostMapping("/{typeId}/deactivate")
    @Operation(summary = "Deactivate property type", description = "Deactivates an active property type")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Property type deactivated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions or cannot deactivate system type"),
        ApiResponse(responseCode = "404", description = "Property type not found")
    )
    @PreAuthorize("hasPermissionRule('property_type.deactivate.all')")
    fun deactivatePropertyType(
        @Parameter(description = "Property type ID")
        @PathVariable typeId: String
    ): PropertyTypeCatalogDto {
        logger.info("Deactivating property type: $typeId")
        
        return try {
            val deactivated = propertyTypeCatalogService.deactivatePropertyType(typeId)
            val dto = dtoMapper.toDto(deactivated)
            
            logger.info("Successfully deactivated property type: $typeId")
            dto
        } catch (e: IllegalArgumentException) {
            logger.error("Property type not found: $typeId")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        } catch (e: IllegalStateException) {
            logger.error("Cannot deactivate system property type: $typeId")
            throw ResponseStatusException(HttpStatus.FORBIDDEN)
        }
    }
    
    /**
     * Deletes a custom property type.
     */
    @DeleteMapping("/custom/{typeId}")
    @Operation(summary = "Delete custom property type", description = "Permanently deletes a custom property type")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Property type deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden - cannot delete system types"),
        ApiResponse(responseCode = "404", description = "Property type not found"),
        ApiResponse(responseCode = "409", description = "Property type is in use")
    )
    @PreAuthorize("hasPermissionRule('property_type.delete.all')")
    fun deleteCustomPropertyType(
        @Parameter(description = "Property type ID")
        @PathVariable typeId: String
    ): Unit {
        logger.info("Deleting custom property type: $typeId")
        
        return try {
            propertyTypeCatalogService.deletePropertyType(typeId)
            logger.info("Successfully deleted property type: $typeId")
            Unit
        } catch (e: IllegalArgumentException) {
            logger.error("Property type not found: $typeId")
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        } catch (e: IllegalStateException) {
            logger.error("Cannot delete property type: ${e.message}")
            throw ResponseStatusException(HttpStatus.CONFLICT)
        }
    }
}