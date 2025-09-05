package com.astarworks.astarmanagement.core.workspace.api.exception

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.BusinessException.Companion.BAD_REQUEST
import com.astarworks.astarmanagement.shared.exception.base.BusinessException.Companion.CONFLICT
import com.astarworks.astarmanagement.shared.exception.base.BusinessException.Companion.FORBIDDEN
import com.astarworks.astarmanagement.shared.exception.base.BusinessException.Companion.NOT_FOUND
import com.astarworks.astarmanagement.shared.exception.base.ErrorCode
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * Base exception class for workspace-related errors.
 * All workspace-specific exceptions should extend this class.
 */
abstract class WorkspaceException(
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
 * Exception thrown when a workspace with the same name already exists for a tenant.
 */
class DuplicateWorkspaceNameException(
    val name: String,
    val tenantId: TenantId
) : WorkspaceException(
    message = "Workspace with name '$name' already exists for this tenant",
    errorCode = "WORKSPACE_DUPLICATE_NAME",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("name", JsonPrimitive(name))
        put("tenantId", JsonPrimitive(tenantId.toString()))
    }
) {
    companion object {
        fun of(name: String, tenantId: TenantId) = DuplicateWorkspaceNameException(name, tenantId)
    }
}

/**
 * Exception thrown when the workspace limit for a tenant is exceeded.
 */
class WorkspaceLimitExceededException(
    val tenantId: TenantId,
    val currentCount: Int,
    val limit: Int
) : WorkspaceException(
    message = "Workspace limit exceeded for tenant. Current: $currentCount, Limit: $limit",
    errorCode = "WORKSPACE_LIMIT_EXCEEDED",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("tenantId", JsonPrimitive(tenantId.toString()))
        put("currentCount", JsonPrimitive(currentCount))
        put("limit", JsonPrimitive(limit))
    }
) {
    companion object {
        fun of(tenantId: TenantId, currentCount: Int, limit: Int) = 
            WorkspaceLimitExceededException(tenantId, currentCount, limit)
    }
}

/**
 * Exception thrown when attempting to delete a workspace that is not empty.
 */
class WorkspaceNotEmptyException(
    val workspaceId: WorkspaceId,
    val tableCount: Int
) : WorkspaceException(
    message = "Cannot delete workspace. It contains $tableCount table(s)",
    errorCode = "WORKSPACE_NOT_EMPTY",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("workspaceId", JsonPrimitive(workspaceId.toString()))
        put("tableCount", JsonPrimitive(tableCount))
    }
) {
    companion object {
        fun of(workspaceId: WorkspaceId, tableCount: Int) = 
            WorkspaceNotEmptyException(workspaceId, tableCount)
    }
}

/**
 * Exception thrown when a requested workspace cannot be found.
 */
class WorkspaceNotFoundException(
    val workspaceId: WorkspaceId
) : WorkspaceException(
    message = "Workspace not found: $workspaceId",
    errorCode = "WORKSPACE_NOT_FOUND",
    httpStatus = NOT_FOUND,
    details = buildJsonObject {
        put("workspaceId", JsonPrimitive(workspaceId.toString()))
    }
) {
    companion object {
        fun of(workspaceId: WorkspaceId) = WorkspaceNotFoundException(workspaceId)
        
        fun byName(name: String, tenantId: TenantId) = object : WorkspaceException(
            message = "Workspace with name '$name' not found for tenant",
            errorCode = "WORKSPACE_NOT_FOUND",
            httpStatus = NOT_FOUND,
            details = buildJsonObject {
                put("name", JsonPrimitive(name))
                put("tenantId", JsonPrimitive(tenantId.toString()))
            }
        ) {}
    }
}

/**
 * Exception thrown when workspace access is denied.
 */
class WorkspaceAccessDeniedException(
    val workspaceId: WorkspaceId,
    val userId: UserId,
    val action: String
) : WorkspaceException(
    message = "Access denied to workspace for action: $action",
    errorCode = "WORKSPACE_ACCESS_DENIED",
    httpStatus = FORBIDDEN,
    details = buildJsonObject {
        put("workspaceId", JsonPrimitive(workspaceId.toString()))
        put("userId", JsonPrimitive(userId.toString()))
        put("action", JsonPrimitive(action))
    }
) {
    companion object {
        fun of(workspaceId: WorkspaceId, userId: UserId, action: String) = 
            WorkspaceAccessDeniedException(workspaceId, userId, action)
    }
}