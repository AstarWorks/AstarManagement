package dev.ryuzu.astermanagement.storage.exception

import dev.ryuzu.astermanagement.service.exception.BusinessException

/**
 * Base exception class for all storage-related errors.
 * Extends the existing BusinessException hierarchy to maintain consistency
 * with the established error handling patterns in the codebase.
 * 
 * This exception hierarchy provides structured error handling for different
 * types of storage failures, enabling proper error recovery and user feedback.
 */
abstract class StorageException(
    message: String,
    cause: Throwable? = null,
    val errorCode: String? = null,
    val context: Map<String, Any> = emptyMap()
) : BusinessException(message, cause) {
    
    /**
     * Get additional context information as a formatted string
     */
    fun getContextString(): String {
        if (context.isEmpty()) return ""
        return context.entries.joinToString(", ") { "${it.key}=${it.value}" }
    }
    
    /**
     * Get error details for logging or debugging
     */
    fun getErrorDetails(): Map<String, Any> {
        val details = mutableMapOf<String, Any>(
            "message" to (message ?: ""),
            "errorCode" to (errorCode ?: "UNKNOWN"),
            "exceptionType" to this::class.simpleName!!
        )
        
        if (context.isNotEmpty()) {
            details.putAll(context)
        }
        
        cause?.let { c -> details["cause"] = c.message ?: c::class.simpleName!! }
        
        return details
    }
}

/**
 * Exception thrown when a requested storage object is not found
 */
class StorageObjectNotFoundException(
    bucketName: String,
    objectName: String,
    cause: Throwable? = null
) : StorageException(
    message = "Object not found: $bucketName/$objectName",
    cause = cause,
    errorCode = "STORAGE_OBJECT_NOT_FOUND",
    context = mapOf(
        "bucketName" to bucketName,
        "objectName" to objectName
    )
)

/**
 * Exception thrown when access to storage is denied due to insufficient permissions
 */
class StorageAccessDeniedException(
    operation: String,
    resource: String,
    cause: Throwable? = null
) : StorageException(
    message = "Storage access denied for operation '$operation' on resource '$resource'",
    cause = cause,
    errorCode = "STORAGE_ACCESS_DENIED",
    context = mapOf(
        "operation" to operation,
        "resource" to resource
    )
)

/**
 * Exception thrown when storage quota or limits are exceeded
 */
class StorageQuotaExceededException(
    quotaType: String,
    limit: String,
    attempted: String,
    cause: Throwable? = null
) : StorageException(
    message = "Storage quota exceeded: $quotaType limit is $limit, attempted $attempted",
    cause = cause,
    errorCode = "STORAGE_QUOTA_EXCEEDED",
    context = mapOf(
        "quotaType" to quotaType,
        "limit" to limit,
        "attempted" to attempted
    )
)

/**
 * Exception thrown when storage connectivity issues occur
 */
class StorageConnectionException(
    endpoint: String,
    operation: String,
    cause: Throwable? = null
) : StorageException(
    message = "Failed to connect to storage endpoint '$endpoint' for operation '$operation'",
    cause = cause,
    errorCode = "STORAGE_CONNECTION_FAILED",
    context = mapOf(
        "endpoint" to endpoint,
        "operation" to operation
    )
)

/**
 * Exception thrown when storage authentication fails
 */
class StorageAuthenticationException(
    provider: String,
    cause: Throwable? = null
) : StorageException(
    message = "Storage authentication failed for provider '$provider'",
    cause = cause,
    errorCode = "STORAGE_AUTHENTICATION_FAILED",
    context = mapOf("provider" to provider)
)

/**
 * Exception thrown when storage configuration is invalid
 */
class StorageConfigurationException(
    configurationIssue: String,
    cause: Throwable? = null
) : StorageException(
    message = "Storage configuration error: $configurationIssue",
    cause = cause,
    errorCode = "STORAGE_CONFIGURATION_ERROR",
    context = mapOf("issue" to configurationIssue)
)

/**
 * Exception thrown when an invalid object name or bucket name is used
 */
class StorageInvalidNameException(
    nameType: String,
    invalidName: String,
    reason: String,
    cause: Throwable? = null
) : StorageException(
    message = "Invalid $nameType name '$invalidName': $reason",
    cause = cause,
    errorCode = "STORAGE_INVALID_NAME",
    context = mapOf(
        "nameType" to nameType,
        "invalidName" to invalidName,
        "reason" to reason
    )
)

/**
 * Exception thrown when a storage operation fails due to conflict
 */
class StorageConflictException(
    operation: String,
    resource: String,
    conflictReason: String,
    cause: Throwable? = null
) : StorageException(
    message = "Storage conflict during '$operation' on '$resource': $conflictReason",
    cause = cause,
    errorCode = "STORAGE_CONFLICT",
    context = mapOf(
        "operation" to operation,
        "resource" to resource,
        "conflictReason" to conflictReason
    )
)

/**
 * Exception thrown when storage operation times out
 */
class StorageTimeoutException(
    operation: String,
    timeoutDuration: String,
    cause: Throwable? = null
) : StorageException(
    message = "Storage operation '$operation' timed out after $timeoutDuration",
    cause = cause,
    errorCode = "STORAGE_TIMEOUT",
    context = mapOf(
        "operation" to operation,
        "timeoutDuration" to timeoutDuration
    )
)

/**
 * Exception thrown when storage data is corrupted or invalid
 */
class StorageDataCorruptionException(
    bucketName: String,
    objectName: String,
    corruptionDetails: String,
    cause: Throwable? = null
) : StorageException(
    message = "Data corruption detected in $bucketName/$objectName: $corruptionDetails",
    cause = cause,
    errorCode = "STORAGE_DATA_CORRUPTION",
    context = mapOf(
        "bucketName" to bucketName,
        "objectName" to objectName,
        "corruptionDetails" to corruptionDetails
    )
)

/**
 * Exception thrown when storage service is temporarily unavailable
 */
class StorageServiceUnavailableException(
    provider: String,
    retryAfter: String? = null,
    cause: Throwable? = null
) : StorageException(
    message = "Storage service '$provider' is temporarily unavailable" + 
              (retryAfter?.let { " (retry after $it)" } ?: ""),
    cause = cause,
    errorCode = "STORAGE_SERVICE_UNAVAILABLE",
    context = buildMap {
        put("provider", provider)
        retryAfter?.let { put("retryAfter", it) }
    }
)

/**
 * Exception thrown when unsupported storage operation is attempted
 */
class StorageUnsupportedOperationException(
    operation: String,
    provider: String,
    cause: Throwable? = null
) : StorageException(
    message = "Operation '$operation' is not supported by provider '$provider'",
    cause = cause,
    errorCode = "STORAGE_UNSUPPORTED_OPERATION",
    context = mapOf(
        "operation" to operation,
        "provider" to provider
    )
)

/**
 * Exception thrown when storage integrity check fails
 */
class StorageIntegrityException(
    bucketName: String,
    objectName: String,
    expectedChecksum: String,
    actualChecksum: String,
    cause: Throwable? = null
) : StorageException(
    message = "Integrity check failed for $bucketName/$objectName: expected $expectedChecksum, got $actualChecksum",
    cause = cause,
    errorCode = "STORAGE_INTEGRITY_FAILED",
    context = mapOf(
        "bucketName" to bucketName,
        "objectName" to objectName,
        "expectedChecksum" to expectedChecksum,
        "actualChecksum" to actualChecksum
    )
)

/**
 * Exception thrown when file size exceeds configured limits
 */
class StorageFileSizeExceededException(
    fileName: String,
    fileSize: Long,
    maxSize: Long,
    cause: Throwable? = null
) : StorageException(
    message = "File '$fileName' size ($fileSize bytes) exceeds maximum allowed size ($maxSize bytes)",
    cause = cause,
    errorCode = "STORAGE_FILE_SIZE_EXCEEDED",
    context = mapOf(
        "fileName" to fileName,
        "fileSize" to fileSize,
        "maxSize" to maxSize
    )
)

/**
 * Exception thrown when unsupported file type is uploaded
 */
class StorageUnsupportedFileTypeException(
    fileName: String,
    mimeType: String,
    allowedTypes: List<String>,
    cause: Throwable? = null
) : StorageException(
    message = "File '$fileName' has unsupported type '$mimeType'. Allowed types: ${allowedTypes.joinToString(", ")}",
    cause = cause,
    errorCode = "STORAGE_UNSUPPORTED_FILE_TYPE",
    context = mapOf(
        "fileName" to fileName,
        "mimeType" to mimeType,
        "allowedTypes" to allowedTypes
    )
)

/**
 * Generic storage exception for unexpected errors
 */
class StorageGenericException(
    operation: String,
    details: String,
    cause: Throwable? = null
) : StorageException(
    message = "Storage operation '$operation' failed: $details",
    cause = cause,
    errorCode = "STORAGE_GENERIC_ERROR",
    context = mapOf(
        "operation" to operation,
        "details" to details
    )
)