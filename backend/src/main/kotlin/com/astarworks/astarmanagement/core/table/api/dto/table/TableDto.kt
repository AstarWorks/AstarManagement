package com.astarworks.astarmanagement.core.table.api.dto.table

import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyDefinitionDto
import com.astarworks.astarmanagement.core.table.infrastructure.validation.ValidTableName
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

/**
 * Request DTO for creating a new table.
 */
@Serializable
data class TableCreateRequest(
    @field:NotNull
    @Contextual
    val workspaceId: UUID,
    
    @field:NotBlank
    @field:Size(min = 1, max = 255)
    @field:ValidTableName
    val name: String,
    
    @field:Size(max = 1000)
    val description: String? = null,
    
    @field:Valid
    val properties: List<PropertyDefinitionDto> = emptyList(),
    
    val templateName: String? = null,
    
    val icon: String? = null,
    
    val color: String? = null
) {
    /**
     * Validates that property keys are unique.
     */
    fun hasUniquePropertyKeys(): Boolean {
        val keys = properties.map { it.key }
        return keys.size == keys.toSet().size
    }
    
    /**
     * Gets properties as a map.
     */
    fun getPropertiesMap(): Map<String, PropertyDefinitionDto> {
        return properties.associateBy { it.key }
    }
}

/**
 * Request DTO for updating a table.
 */
@Serializable
data class TableUpdateRequest(
    @field:Size(min = 1, max = 255)
    val name: String? = null,
    
    @field:Size(max = 1000)
    val description: String? = null,
    
    val propertyOrder: List<String>? = null,
    
    val icon: String? = null,
    
    val color: String? = null,
    
    val settings: JsonObject? = null
) {
    /**
     * Checks if the request has any updates.
     */
    fun hasUpdates(): Boolean {
        return name != null || 
               description != null || 
               propertyOrder != null ||
               icon != null ||
               color != null ||
               settings != null
    }
}

/**
 * Response DTO for table information.
 */
@Serializable
data class TableResponse(
    @Contextual
    val id: UUID,
    
    @Contextual
    val workspaceId: UUID,
    
    val name: String,
    
    val description: String? = null,
    
    val properties: Map<String, PropertyDefinitionDto>,
    
    val propertyOrder: List<String>,
    
    val recordCount: Long? = null,
    
    val icon: String? = null,
    
    val color: String? = null,
    
    val settings: JsonObject? = null,
    
    @Contextual
    val createdAt: Instant,
    
    @Contextual
    val updatedAt: Instant
) {
    /**
     * Gets ordered properties based on propertyOrder.
     */
    fun getOrderedProperties(): List<PropertyDefinitionDto> {
        return propertyOrder.mapNotNull { key ->
            properties[key]
        }
    }
    
    /**
     * Creates a summary view.
     */
    fun toSummary(): TableSummaryResponse {
        return TableSummaryResponse(
            id = id,
            workspaceId = workspaceId,
            name = name,
            description = description,
            propertyCount = properties.size,
            recordCount = recordCount,
            icon = icon,
            color = color,
            updatedAt = updatedAt
        )
    }
}

/**
 * Summary response DTO for table listing.
 */
@Serializable
data class TableSummaryResponse(
    @Contextual
    val id: UUID,
    
    @Contextual
    val workspaceId: UUID,
    
    val name: String,
    
    val description: String? = null,
    
    val propertyCount: Int,
    
    val recordCount: Long? = null,
    
    val icon: String? = null,
    
    val color: String? = null,
    
    @Contextual
    val updatedAt: Instant
)

/**
 * Response DTO for table list.
 */
@Serializable
data class TableListResponse(
    val tables: List<TableResponse>,
    
    val totalCount: Long
) {
    companion object {
        /**
         * Creates a table list response.
         */
        fun of(tables: List<TableResponse>): TableListResponse {
            return TableListResponse(
                tables = tables,
                totalCount = tables.size.toLong()
            )
        }
        
        /**
         * Creates an empty table list response.
         */
        fun empty(): TableListResponse {
            return TableListResponse(
                tables = emptyList(),
                totalCount = 0
            )
        }
    }
}


/**
 * Request DTO for duplicating a table.
 */
@Serializable
data class TableDuplicateRequest(
    @field:NotBlank
    val name: String,
    
    val includeRecords: Boolean = false,
    
    @Contextual
    val targetWorkspaceId: UUID? = null
)

/**
 * Response DTO for table schema information.
 * Used for export/import operations.
 */
@Serializable
data class TableSchemaResponse(
    @Contextual
    val id: UUID,
    
    val name: String,
    
    val description: String? = null,
    
    val properties: Map<String, PropertyDefinitionDto>,
    
    val propertyOrder: List<String>,
    
    val version: String = "1.0",
    
    @Contextual
    val exportedAt: Instant = Instant.now()
)