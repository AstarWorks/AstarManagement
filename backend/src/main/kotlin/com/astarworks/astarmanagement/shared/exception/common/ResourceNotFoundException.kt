package com.astarworks.astarmanagement.shared.exception.common

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.ErrorCodeEnum
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
    val resourceType: ResourceType,
    val resourceId: Any,
    val searchCriteria: JsonObject? = null,
    message: String? = null
) : BusinessException(
    message = message ?: "${resourceType.displayName} not found: $resourceId",
    errorCode = ErrorCodeEnum.RESOURCE_NOT_FOUND.code,
    httpStatus = NOT_FOUND,
    details = buildJsonObject {
        put("resourceType", JsonPrimitive(resourceType.name))
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
                resourceType = ResourceType.WORKSPACE,
                resourceId = workspaceId,
                message = "Workspace not found: $workspaceId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a Table.
         */
        fun table(tableId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = ResourceType.TABLE,
                resourceId = tableId,
                message = "Table not found: $tableId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a Record.
         */
        fun record(recordId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = ResourceType.RECORD,
                resourceId = recordId,
                message = "Record not found: $recordId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a PropertyType.
         */
        fun propertyType(typeId: String): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = ResourceType.PROPERTY_TYPE,
                resourceId = typeId,
                message = "Property type not found: $typeId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a Tenant.
         */
        fun tenant(tenantId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = ResourceType.TENANT,
                resourceId = tenantId,
                message = "Tenant not found: $tenantId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException for a User.
         */
        fun user(userId: UUID): ResourceNotFoundException {
            return ResourceNotFoundException(
                resourceType = ResourceType.USER,
                resourceId = userId,
                message = "User not found: $userId"
            )
        }
        
        /**
         * Creates a ResourceNotFoundException with search criteria.
         */
        fun withCriteria(
            resourceType: ResourceType,
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
                message = "${resourceType.displayName} not found with criteria: $criteria"
            )
        }
    }
}