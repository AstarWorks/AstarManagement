package com.astarworks.astarmanagement.shared.exception.common

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.ErrorCodeEnum
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.util.UUID

/**
 * Exception thrown when a conflict occurs, typically due to duplicate resources
 * or concurrent modifications.
 * This is typically mapped to HTTP 409 status code.
 * 
 * @property conflictType The type of conflict (e.g., "DUPLICATE", "VERSION_MISMATCH", "STATE_CONFLICT")
 * @property conflictingResource The resource that caused the conflict (optional)
 * @property existingResource The existing resource that conflicts (optional)
 */
class ConflictException(
    val conflictType: ConflictType,
    val conflictingResource: Any? = null,
    val existingResource: Any? = null,
    message: String,
    cause: Throwable? = null
) : BusinessException(
    message = message,
    errorCode = ErrorCodeEnum.CONFLICT.code,
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("conflictType", JsonPrimitive(conflictType.name))
        conflictingResource?.let { put("conflictingResource", JsonPrimitive(it.toString())) }
        existingResource?.let { put("existingResource", JsonPrimitive(it.toString())) }
    },
    cause = cause
) {
    companion object {
        
        /**
         * Creates a ConflictException for duplicate workspace name.
         */
        fun duplicateWorkspaceName(
            name: String,
            tenantId: UUID
        ): ConflictException {
            return ConflictException(
                conflictType = ConflictType.DUPLICATE,
                conflictingResource = buildJsonObject {
                    put("name", JsonPrimitive(name))
                    put("tenantId", JsonPrimitive(tenantId.toString()))
                },
                message = "Workspace with name '$name' already exists for this tenant"
            )
        }
        
        /**
         * Creates a ConflictException for duplicate table name.
         */
        fun duplicateTableName(
            name: String,
            workspaceId: UUID
        ): ConflictException {
            return ConflictException(
                conflictType = ConflictType.DUPLICATE,
                conflictingResource = buildJsonObject {
                    put("name", JsonPrimitive(name))
                    put("workspaceId", JsonPrimitive(workspaceId.toString()))
                },
                message = "Table with name '$name' already exists in this workspace"
            )
        }
        
        /**
         * Creates a ConflictException for duplicate property key.
         */
        fun duplicatePropertyKey(
            key: String,
            tableId: UUID
        ): ConflictException {
            return ConflictException(
                conflictType = ConflictType.DUPLICATE,
                conflictingResource = buildJsonObject {
                    put("key", JsonPrimitive(key))
                    put("tableId", JsonPrimitive(tableId.toString()))
                },
                message = "Property with key '$key' already exists in this table"
            )
        }
        
        /**
         * Creates a ConflictException for version mismatch (optimistic locking).
         */
        fun versionMismatch(
            resourceType: String,
            resourceId: Any,
            expectedVersion: Any,
            actualVersion: Any
        ): ConflictException {
            return ConflictException(
                conflictType = ConflictType.VERSION_MISMATCH,
                conflictingResource = buildJsonObject {
                    put("resourceType", JsonPrimitive(resourceType))
                    put("resourceId", JsonPrimitive(resourceId.toString()))
                    put("expectedVersion", JsonPrimitive(expectedVersion.toString()))
                    put("actualVersion", JsonPrimitive(actualVersion.toString()))
                },
                message = "$resourceType has been modified by another user. Expected version: $expectedVersion, actual: $actualVersion"
            )
        }
        
        /**
         * Creates a ConflictException for state conflict.
         */
        fun invalidState(
            resourceType: String,
            resourceId: Any,
            currentState: String,
            requiredState: String
        ): ConflictException {
            return ConflictException(
                conflictType = ConflictType.STATE_CONFLICT,
                conflictingResource = buildJsonObject {
                    put("resourceType", JsonPrimitive(resourceType))
                    put("resourceId", JsonPrimitive(resourceId.toString()))
                    put("currentState", JsonPrimitive(currentState))
                    put("requiredState", JsonPrimitive(requiredState))
                },
                message = "$resourceType is in invalid state. Current: $currentState, required: $requiredState"
            )
        }
        
        /**
         * Creates a ConflictException for resource in use.
         */
        fun resourceInUse(
            resourceType: String,
            resourceId: Any,
            usedBy: String? = null
        ): ConflictException {
            val message = if (usedBy != null) {
                "$resourceType cannot be modified or deleted because it is being used by $usedBy"
            } else {
                "$resourceType cannot be modified or deleted because it is currently in use"
            }
            
            return ConflictException(
                conflictType = ConflictType.DEPENDENCY,
                conflictingResource = buildJsonObject {
                    put("resourceType", JsonPrimitive(resourceType))
                    put("resourceId", JsonPrimitive(resourceId.toString()))
                    put("usedBy", JsonPrimitive(usedBy ?: "unknown"))
                },
                message = message
            )
        }
        
        /**
         * Creates a ConflictException for resource locked.
         */
        fun resourceLocked(
            resourceType: String,
            resourceId: Any,
            lockedBy: String? = null,
            lockedUntil: Any? = null
        ): ConflictException {
            val details = buildJsonObject {
                put("resourceType", JsonPrimitive(resourceType))
                put("resourceId", JsonPrimitive(resourceId.toString()))
                lockedBy?.let { put("lockedBy", JsonPrimitive(it)) }
                lockedUntil?.let { put("lockedUntil", JsonPrimitive(it.toString())) }
            }
            
            return ConflictException(
                conflictType = ConflictType.LOCK_CONFLICT,
                conflictingResource = details,
                message = "$resourceType is currently locked and cannot be modified"
            )
        }
        
        /**
         * Creates a ConflictException for limit exceeded.
         */
        fun limitExceeded(
            resourceType: String,
            currentCount: Int,
            limit: Int
        ): ConflictException {
            return ConflictException(
                conflictType = ConflictType.STATE_CONFLICT,
                conflictingResource = buildJsonObject {
                    put("resourceType", JsonPrimitive(resourceType))
                    put("currentCount", JsonPrimitive(currentCount))
                    put("limit", JsonPrimitive(limit))
                },
                message = "$resourceType limit exceeded. Current: $currentCount, limit: $limit"
            )
        }
    }
}