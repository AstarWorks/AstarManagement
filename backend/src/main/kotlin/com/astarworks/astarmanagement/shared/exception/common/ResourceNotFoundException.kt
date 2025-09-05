package com.astarworks.astarmanagement.shared.exception.common

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.ErrorCode
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.util.UUID

/**
 * Exception thrown when a requested resource cannot be found.
 * This is typically mapped to HTTP 404 status code.
 * 
 * @property resourceType The type of resource that was not found (e.g., "Workspace", "Table", "Record")
 * @property resourceId The identifier of the resource that was not found
 * @property searchCriteria Additional search criteria used (optional)
 */
class ResourceNotFoundException(
    val resourceType: String,
    val resourceId: Any,
    val searchCriteria: JsonObject? = null,
    message: String? = null
) : BusinessException(
    message = message ?: "$resourceType not found: $resourceId",
    errorCode = ErrorCode.RESOURCE_NOT_FOUND,
    httpStatus = NOT_FOUND,
    details = buildJsonObject {
        put("resourceType", JsonPrimitive(resourceType))
        put("resourceId", JsonPrimitive(resourceId.toString()))
        searchCriteria?.let {
            it.forEach { (key, value) ->
                put("searchCriteria.$key", value)
            }
        }
    }
) {
    companion object {
        /**
         * Creates a ResourceNotFoundException for a Workspace.
         */
        fun workspace(workspaceId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = "Workspace",
                resourceId = workspaceId,
                message = "Workspace not found: $workspaceId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a Table.
         */
        fun table(tableId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = "Table",
                resourceId = tableId,
                message = "Table not found: $tableId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a Record.
         */
        fun record(recordId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = "Record",
                resourceId = recordId,
                message = "Record not found: $recordId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a PropertyType.
         */
        fun propertyType(typeId: String): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = "PropertyType",
                resourceId = typeId,
                message = "Property type not found: $typeId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a Tenant.
         */
        fun tenant(tenantId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = "Tenant",
                resourceId = tenantId,
                message = "Tenant not found: $tenantId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a User.
         */
        fun user(userId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = "User",
                resourceId = userId,
                message = "User not found: $userId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException with search criteria.
         */
        fun withCriteria(
            resourceType: String,
            criteria: Map<String, Any>
        ): ResourceNotFoundException {
            val jsonCriteria = buildJsonObject {
                criteria.forEach { (key, value) ->
                    put(key, JsonPrimitive(value.toString()))
                }
            }
            return ResourceNotFoundException(
                resourceType = resourceType,
                resourceId = "unknown",
                searchCriteria = jsonCriteria,
                message = "$resourceType not found with criteria: $criteria"
            )
        }
    }
}