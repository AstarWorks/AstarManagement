package com.astarworks.astarmanagement.core.table.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import kotlinx.serialization.json.Json
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import org.springframework.stereotype.Component
import java.sql.ResultSet
import java.util.UUID

/**
 * Mapper between Table domain model and database representations.
 * Handles conversion between ResultSet and Map<String, PropertyDefinition>.
 */
@Component
class TableMapper {
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        encodeDefaults = false
    }
    
    private val mapSerializer = MapSerializer(String.serializer(), PropertyDefinition.serializer())
    
    
    
    
    /**
     * Maps a ResultSet row to a Table domain model.
     * Used by JdbcTemplate-based repository implementation.
     */
    fun mapRowToTable(rs: ResultSet): Table {
        val propertiesJson = rs.getString("properties")
        val properties = if (propertiesJson.isNullOrBlank() || propertiesJson == "{}") {
            emptyMap()
        } else {
            try {
                json.decodeFromString(mapSerializer, propertiesJson)
            } catch (e: Exception) {
                println("Error deserializing properties from ResultSet: ${e.message}")
                emptyMap()
            }
        }
        
        val propertyOrderArray = rs.getString("property_order")
        val propertyOrder = postgresArrayToList(propertyOrderArray)
        
        return Table(
            id = TableId(UUID.fromString(rs.getString("id"))),
            workspaceId = WorkspaceId(UUID.fromString(rs.getString("workspace_id"))),
            name = rs.getString("name"),
            description = rs.getString("description"),
            properties = properties,
            propertyOrder = propertyOrder,
            createdAt = rs.getTimestamp("created_at").toInstant(),
            updatedAt = rs.getTimestamp("updated_at").toInstant()
        )
    }
    
    /**
     * Converts Map<String, PropertyDefinition> to JSON string for database storage.
     */
    fun propertiesToJson(properties: Map<String, PropertyDefinition>): String {
        return if (properties.isEmpty()) {
            "{}"
        } else {
            json.encodeToString(mapSerializer, properties)
        }
    }
    
    /**
     * Converts a List<String> to PostgreSQL array format.
     */
    
    fun listToPostgresArray(list: List<String>): String {
        return "{${list.joinToString(",") { "\"$it\"" }}}"
    }
    
    /**
     * Converts PostgreSQL array string to List<String>.
     */
    private fun postgresArrayToList(array: String?): List<String> {
        if (array == null || array == "{}") return emptyList()
        return array
            .removeSurrounding("{", "}")
            .split(",")
            .map { it.trim().removeSurrounding("\"") }
            .filter { it.isNotEmpty() }
    }
}