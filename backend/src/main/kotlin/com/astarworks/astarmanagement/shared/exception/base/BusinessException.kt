package com.astarworks.astarmanagement.shared.exception.base

import com.astarworks.astarmanagement.shared.exception.dto.ErrorResponse
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.time.Instant

/**
 * Base exception class for all business logic exceptions.
 * Provides a structured way to handle application-specific errors with HTTP status codes.
 * 
 * All domain-specific exceptions should extend this class to ensure consistent
 * error handling across the application.
 * 
 * @property message The error message
 * @property errorCode A unique error code for this type of error
 * @property httpStatus The HTTP status code to return
 * @property details Additional details about the error (optional)
 * @property cause The underlying cause of this exception (optional)
 */
abstract class BusinessException(
    message: String,
    val errorCode: String,
    val httpStatus: Int,
    val details: JsonObject? = null,
    cause: Throwable? = null
) : RuntimeException(message, cause) {
    
    /**
     * Converts this exception to an ErrorResponse DTO.
     * This method is used by exception handlers to create consistent API responses.
     * 
     * @return ErrorResponse containing error details
     */
    fun toErrorResponse(): ErrorResponse {
        return ErrorResponse(
            code = errorCode,
            message = message ?: "An error occurred",
            details = details,
            timestamp = Instant.now()
        )
    }
    
    /**
     * Creates a copy of this exception with additional details.
     * Useful for adding context-specific information when rethrowing exceptions.
     * 
     * @param additionalDetails Map of additional details to merge with existing details
     * @return A new exception instance with merged details
     */
    fun withDetails(additionalDetails: Map<String, Any>): BusinessException {
        val mergedDetails = buildJsonObject {
            // Add existing details if present
            details?.let { existingDetails ->
                existingDetails.forEach { (key, value) ->
                    put(key, value)
                }
            }
            // Add new details
            additionalDetails.forEach { (key, value) ->
                put(key, JsonPrimitive(value.toString()))
            }
        }
        return object : BusinessException(
            message = this@BusinessException.message ?: "",
            errorCode = this@BusinessException.errorCode,
            httpStatus = this@BusinessException.httpStatus,
            details = mergedDetails,
            cause = this@BusinessException.cause
        ) {}
    }
    
    /**
     * Checks if this exception represents a client error (4xx status codes).
     */
    fun isClientError(): Boolean = httpStatus in 400..499
    
    /**
     * Checks if this exception represents a server error (5xx status codes).
     */
    fun isServerError(): Boolean = httpStatus in 500..599
    
    companion object {
        // Common HTTP status codes as constants for convenience
        const val BAD_REQUEST = 400
        const val UNAUTHORIZED = 401
        const val FORBIDDEN = 403
        const val NOT_FOUND = 404
        const val CONFLICT = 409
        const val UNPROCESSABLE_ENTITY = 422
        const val INTERNAL_SERVER_ERROR = 500
        const val SERVICE_UNAVAILABLE = 503
    }
}