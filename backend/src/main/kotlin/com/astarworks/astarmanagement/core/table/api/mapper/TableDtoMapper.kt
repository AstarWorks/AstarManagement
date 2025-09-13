package com.astarworks.astarmanagement.core.table.api.mapper

import com.astarworks.astarmanagement.core.table.api.dto.table.*
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyDefinitionDto
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import kotlinx.serialization.json.*
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

/**
 * Mapper for converting between Table domain models and DTOs.
 * Handles transformations for API layer communication.
 */
@Component
class TableDtoMapper {
    
    /**
     * Converts a Table domain model to TableResponse DTO.
     * 
     * @param table The Table domain model
     * @param recordCount Optional record count
     * @return The corresponding TableResponse DTO
     */
    fun toResponse(
        table: Table,
        recordCount: Long? = null
    ): TableResponse {
        val propertyDtos = table.properties.mapValues { (key, definition) ->
            toPropertyDefinitionDto(definition).copy(key = key)
        }
        
        return TableResponse(
            id = table.id.value,
            workspaceId = table.workspaceId.value,
            name = table.name,
            description = table.description,
            properties = propertyDtos,
            propertyOrder = table.propertyOrder,
            recordCount = recordCount,
            icon = null, // Icon field not in domain model yet
            color = null, // Color field not in domain model yet
            settings = null, // Settings field not in domain model yet
            createdAt = table.createdAt,
            updatedAt = table.updatedAt
        )
    }
    
    /**
     * Converts a list of Table domain models to TableResponse DTOs.
     * 
     * @param tables List of Table domain models
     * @param recordCounts Optional map of table ID to record count
     * @return List of corresponding TableResponse DTOs
     */
    fun toResponseList(
        tables: List<Table>,
        recordCounts: Map<UUID, Long>? = null
    ): List<TableResponse> {
        return tables.map { table ->
            toResponse(table, recordCounts?.get(table.id.value))
        }
    }
    
    /**
     * Converts a Table to TableSummaryResponse.
     * 
     * @param table The Table domain model
     * @param recordCount Optional record count
     * @return The corresponding TableSummaryResponse DTO
     */
    fun toSummaryResponse(
        table: Table,
        recordCount: Long? = null
    ): TableSummaryResponse {
        return TableSummaryResponse(
            id = table.id.value,
            workspaceId = table.workspaceId.value,
            name = table.name,
            description = table.description,
            propertyCount = table.properties.size,
            recordCount = recordCount,
            icon = null, // Icon field not in domain model yet
            color = null, // Color field not in domain model yet
            updatedAt = table.updatedAt
        )
    }
    
    /**
     * Converts a list of Tables to TableSummaryResponse DTOs.
     * 
     * @param tables List of Table domain models
     * @param recordCounts Optional map of table ID to record count
     * @return List of corresponding TableSummaryResponse DTOs
     */
    fun toSummaryResponseList(
        tables: List<Table>,
        recordCounts: Map<UUID, Long>? = null
    ): List<TableSummaryResponse> {
        return tables.map { table ->
            toSummaryResponse(table, recordCounts?.get(table.id.value))
        }
    }
    
    /**
     * Creates a TableListResponse from a list of Tables.
     * 
     * @param tables List of Table domain models
     * @param recordCounts Optional map of table ID to record count
     * @return TableListResponse DTO
     */
    fun toListResponse(
        tables: List<Table>,
        recordCounts: Map<UUID, Long>? = null
    ): TableListResponse {
        val responses = toResponseList(tables, recordCounts)
        return TableListResponse.of(responses)
    }
    
    /**
     * Converts a Table to TableSchemaResponse for export.
     * 
     * @param table The Table domain model
     * @return The corresponding TableSchemaResponse DTO
     */
    fun toSchemaResponse(table: Table): TableSchemaResponse {
        val propertyDtos = table.properties.mapValues { (key, definition) ->
            toPropertyDefinitionDto(definition).copy(key = key)
        }
        
        return TableSchemaResponse(
            id = table.id.value,
            name = table.name,
            description = table.description,
            properties = propertyDtos,
            propertyOrder = table.propertyOrder,
            version = "1.0",
            exportedAt = Instant.now()
        )
    }
    
    /**
     * Converts a PropertyDefinition domain model to PropertyDefinitionDto.
     * 
     * @param definition The PropertyDefinition domain model
     * @return The corresponding PropertyDefinitionDto
     */
    fun toPropertyDefinitionDto(definition: PropertyDefinition): PropertyDefinitionDto {
        // Extract top-level fields from config
        val isRequired = definition.config["required"]?.let { element ->
            when (element) {
                is kotlinx.serialization.json.JsonPrimitive -> element.booleanOrNull ?: false
                else -> false
            }
        } ?: false
        
        // Extract defaultValue from config["default"]
        val defaultValue = definition.config["default"]
        
        // Extract description from config
        val description = definition.config["description"]?.let { element ->
            when (element) {
                is kotlinx.serialization.json.JsonPrimitive -> element.contentOrNull
                else -> null
            }
        }
        
        // Build DTO config (excluding required, default, and description)
        val dtoConfig = buildJsonObject {
            definition.config.forEach { (key, value) ->
                if (key !in listOf("required", "default", "description")) {
                    put(key, value)
                }
            }
        }
        
        return PropertyDefinitionDto(
            key = "", // Key will be set from the map key
            type = definition.type,
            displayName = definition.displayName,
            config = if (dtoConfig.isEmpty()) JsonObject(emptyMap()) else dtoConfig,
            required = isRequired,
            defaultValue = defaultValue,
            description = description
        )
    }
    
    /**
     * Converts PropertyDefinitionDto to PropertyDefinition domain model.
     * 
     * @param dto The PropertyDefinitionDto
     * @return The corresponding PropertyDefinition domain model
     */
    fun fromPropertyDefinitionDto(dto: PropertyDefinitionDto): PropertyDefinition {
        // Build config for domain model including DTOs top-level fields
        val domainConfig = buildJsonObject {
            // Copy existing config elements
            dto.config?.forEach { (key, value) ->
                put(key, value)
            }
            
            // Add 'required' to config if true
            if (dto.required) {
                put("required", JsonPrimitive(true))
            }
            
            // Add defaultValue to config["default"] if present
            dto.defaultValue?.let {
                put("default", it)
            }
            
            // Add description to config if present
            dto.description?.let {
                put("description", JsonPrimitive(it))
            }
        }
        
        return PropertyDefinition(
            type = dto.type,
            displayName = dto.displayName,
            config = domainConfig
        )
    }
    
    /**
     * Creates property definitions from a list of PropertyDefinitionDtos.
     * 
     * @param dtos List of PropertyDefinitionDto
     * @return Map of property key to PropertyDefinition
     */
    fun fromPropertyDefinitionDtos(dtos: List<PropertyDefinitionDto>): Map<String, PropertyDefinition> {
        return dtos.associate { dto ->
            dto.key to fromPropertyDefinitionDto(dto)
        }
    }
    
    /**
     * Extracts table creation parameters from TableCreateRequest.
     * 
     * @param request The TableCreateRequest DTO
     * @return Tuple of (workspaceId, name, properties)
     */
    fun extractCreateParams(request: TableCreateRequest): Triple<UUID, String, Map<String, PropertyDefinition>> {
        val properties = fromPropertyDefinitionDtos(request.properties)
        return Triple(request.workspaceId, request.name, properties)
    }
    
    
    /**
     * Updates a Table domain model from an update request.
     * Only updates non-null fields from the request.
     * 
     * @param table The existing Table domain model
     * @param request The TableUpdateRequest DTO
     * @return Updated Table domain model
     */
    fun updateFromRequest(
        table: Table,
        request: TableUpdateRequest
    ): Table {
        var updated = table
        
        request.name?.let {
            updated = updated.copy(name = it)
        }
        
        request.propertyOrder?.let {
            // Validate that all keys exist in properties
            val propertyKeys = table.properties.keys
            val invalidKeys = it.filter { key -> key !in propertyKeys }
            if (invalidKeys.isNotEmpty()) {
                throw IllegalArgumentException("Invalid property keys in order: $invalidKeys")
            }
            updated = updated.copy(propertyOrder = it)
        }
        
        // Update timestamp
        updated = updated.copy(updatedAt = Instant.now())
        
        return updated
    }
    
    /**
     * Creates an empty TableListResponse.
     * 
     * @return Empty TableListResponse DTO
     */
    fun emptyListResponse(): TableListResponse {
        return TableListResponse.empty()
    }
    
    /**
     * Validates property definitions from a create request.
     * 
     * @param request The TableCreateRequest DTO
     * @return List of validation errors (empty if valid)
     */
    fun validateCreateRequest(request: TableCreateRequest): List<String> {
        val errors = mutableListOf<String>()
        
        // Check for unique property keys
        if (!request.hasUniquePropertyKeys()) {
            errors.add("Property keys must be unique")
        }
        
        // Check for valid property type IDs
        request.properties.forEach { property ->
            if (property.key.isBlank()) {
                errors.add("Property key cannot be blank")
            }
            if (property.key.length > 50) {
                errors.add("Property key '${property.key}' exceeds maximum length of 50")
            }
            // Additional type validation would be done by the service layer
        }
        
        return errors
    }
    
    /**
     * Creates a TableDuplicateRequest for copying a table.
     * 
     * @param name New table name
     * @param includeRecords Whether to include records
     * @param targetWorkspaceId Optional target workspace ID
     * @return TableDuplicateRequest DTO
     */
    fun createDuplicateRequest(
        name: String,
        includeRecords: Boolean = false,
        targetWorkspaceId: UUID? = null
    ): TableDuplicateRequest {
        return TableDuplicateRequest(
            name = name,
            includeRecords = includeRecords,
            targetWorkspaceId = targetWorkspaceId
        )
    }
}