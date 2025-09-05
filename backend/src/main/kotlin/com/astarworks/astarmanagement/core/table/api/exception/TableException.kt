package com.astarworks.astarmanagement.core.table.api.exception

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.ErrorCode
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * Base exception class for table-related errors in the flexible table system.
 * All table-specific exceptions should extend this class.
 */
abstract class TableException(
    message: String,
    errorCode: String,
    httpStatus: Int,
    details: JsonObject? = null,
    cause: Throwable? = null
) : BusinessException(
    message = message,
    errorCode = errorCode,
    httpStatus = httpStatus,
    details = details,
    cause = cause
)

/**
 * Exception thrown when a table with the same name already exists in a workspace.
 */
class DuplicateTableNameException(
    val name: String,
    val workspaceId: WorkspaceId
) : TableException(
    message = "Table with name '$name' already exists in this workspace",
    errorCode = "TABLE_DUPLICATE_NAME",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("name", JsonPrimitive(name))
        put("workspaceId", JsonPrimitive(workspaceId.toString()))
    }
) {
    companion object {
        fun of(name: String, workspaceId: WorkspaceId) = DuplicateTableNameException(name, workspaceId)
    }
}

/**
 * Exception thrown when the table limit for a workspace is exceeded.
 */
class TableLimitExceededException(
    val workspaceId: WorkspaceId,
    val currentCount: Int,
    val limit: Int
) : TableException(
    message = "Table limit exceeded for workspace. Current: $currentCount, Limit: $limit",
    errorCode = "TABLE_LIMIT_EXCEEDED",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("workspaceId", JsonPrimitive(workspaceId.toString()))
        put("currentCount", JsonPrimitive(currentCount))
        put("limit", JsonPrimitive(limit))
    }
) {
    companion object {
        fun of(workspaceId: WorkspaceId, currentCount: Int, limit: Int) = 
            TableLimitExceededException(workspaceId, currentCount, limit)
    }
}

/**
 * Exception thrown when the property limit for a table is exceeded.
 */
class PropertyLimitExceededException(
    val tableId: TableId,
    val currentCount: Int,
    val limit: Int
) : TableException(
    message = "Property limit exceeded for table. Current: $currentCount, Limit: $limit",
    errorCode = "PROPERTY_LIMIT_EXCEEDED",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("tableId", JsonPrimitive(tableId.toString()))
        put("currentCount", JsonPrimitive(currentCount))
        put("limit", JsonPrimitive(limit))
    }
) {
    companion object {
        fun of(tableId: TableId, currentCount: Int, limit: Int) = 
            PropertyLimitExceededException(tableId, currentCount, limit)
    }
}

/**
 * Exception thrown when a property definition is invalid.
 */
class InvalidPropertyDefinitionException(
    val key: String,
    val reason: String,
    val propertyType: String? = null
) : TableException(
    message = "Invalid property definition for '$key': $reason",
    errorCode = "INVALID_PROPERTY_DEFINITION",
    httpStatus = BAD_REQUEST,
    details = buildJsonObject {
        put("key", JsonPrimitive(key))
        put("reason", JsonPrimitive(reason))
        propertyType?.let { put("propertyType", JsonPrimitive(it)) }
    }
) {
    companion object {
        fun of(key: String, reason: String, propertyType: String? = null) = 
            InvalidPropertyDefinitionException(key, reason, propertyType)
        
        fun invalidType(key: String, propertyType: String) = 
            InvalidPropertyDefinitionException(key, "Unknown property type: $propertyType", propertyType)
        
        fun missingConfig(key: String, propertyType: String, missingField: String) = 
            InvalidPropertyDefinitionException(
                key, 
                "Property type '$propertyType' requires configuration field: $missingField", 
                propertyType
            )
        
        fun invalidConfig(key: String, propertyType: String, configError: String) = 
            InvalidPropertyDefinitionException(
                key, 
                "Invalid configuration for property type '$propertyType': $configError", 
                propertyType
            )
    }
}

/**
 * Exception thrown when a property key already exists in a table.
 */
class DuplicatePropertyKeyException(
    val key: String,
    val tableId: TableId
) : TableException(
    message = "Property with key '$key' already exists in this table",
    errorCode = "DUPLICATE_PROPERTY_KEY",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("key", JsonPrimitive(key))
        put("tableId", JsonPrimitive(tableId.toString()))
    }
) {
    companion object {
        fun of(key: String, tableId: TableId) = DuplicatePropertyKeyException(key, tableId)
    }
}

/**
 * Exception thrown when a property is not found in a table.
 */
class PropertyNotFoundException(
    val key: String,
    val tableId: TableId
) : TableException(
    message = "Property '$key' not found in table",
    errorCode = "PROPERTY_NOT_FOUND",
    httpStatus = NOT_FOUND,
    details = buildJsonObject {
        put("key", JsonPrimitive(key))
        put("tableId", JsonPrimitive(tableId.toString()))
    }
) {
    companion object {
        fun of(key: String, tableId: TableId) = PropertyNotFoundException(key, tableId)
    }
}

/**
 * Exception thrown when a table is not found.
 */
class TableNotFoundException(
    val tableId: TableId
) : TableException(
    message = "Table not found: $tableId",
    errorCode = "TABLE_NOT_FOUND",
    httpStatus = NOT_FOUND,
    details = buildJsonObject {
        put("tableId", JsonPrimitive(tableId.toString()))
    }
) {
    companion object {
        fun of(tableId: TableId) = TableNotFoundException(tableId)
        
        fun byName(name: String, workspaceId: WorkspaceId) = object : TableException(
            message = "Table with name '$name' not found in workspace",
            errorCode = "TABLE_NOT_FOUND",
            httpStatus = NOT_FOUND,
            details = buildJsonObject {
                put("name", JsonPrimitive(name))
                put("workspaceId", JsonPrimitive(workspaceId.toString()))
            }
        ) {}
    }
}

/**
 * Exception thrown when property order is invalid (contains unknown keys).
 */
class InvalidPropertyOrderException(
    val invalidKeys: List<String>,
    val validKeys: List<String>
) : TableException(
    message = "Invalid property order. Unknown keys: ${invalidKeys.joinToString()}",
    errorCode = "INVALID_PROPERTY_ORDER",
    httpStatus = BAD_REQUEST,
    details = buildJsonObject {
        put("invalidKeys", JsonPrimitive(invalidKeys.joinToString()))
        put("validKeys", JsonPrimitive(validKeys.joinToString()))
    }
) {
    companion object {
        fun of(invalidKeys: List<String>, validKeys: List<String>) = 
            InvalidPropertyOrderException(invalidKeys, validKeys)
    }
}

/**
 * Exception thrown when table access is denied.
 */
class TableAccessDeniedException(
    val tableId: TableId,
    val userId: UserId,
    val action: String
) : TableException(
    message = "Access denied to table for action: $action",
    errorCode = "TABLE_ACCESS_DENIED",
    httpStatus = FORBIDDEN,
    details = buildJsonObject {
        put("tableId", JsonPrimitive(tableId.toString()))
        put("userId", JsonPrimitive(userId.toString()))
        put("action", JsonPrimitive(action))
    }
) {
    companion object {
        fun of(tableId: TableId, userId: UserId, action: String) = 
            TableAccessDeniedException(tableId, userId, action)
    }
}

/**
 * Exception thrown when attempting to delete a table that contains records.
 */
class TableNotEmptyException(
    val tableId: TableId,
    val recordCount: Long
) : TableException(
    message = "Cannot delete table. It contains $recordCount record(s)",
    errorCode = "TABLE_NOT_EMPTY",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("tableId", JsonPrimitive(tableId.toString()))
        put("recordCount", JsonPrimitive(recordCount))
    }
) {
    companion object {
        fun of(tableId: TableId, recordCount: Long) = 
            TableNotEmptyException(tableId, recordCount)
    }
}