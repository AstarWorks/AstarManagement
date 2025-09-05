package com.astarworks.astarmanagement.shared.exception.dto

import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import java.time.Instant

/**
 * Standard error response DTO for API error responses.
 * This class provides a consistent structure for all error responses across the application.
 * 
 * @property code A unique error code identifying the type of error
 * @property message A human-readable error message
 * @property details Additional details about the error (optional)
 * @property timestamp The time when the error occurred
 * @property path The request path that caused the error (optional)
 * @property traceId A unique identifier for tracing the error (optional)
 */
@Serializable
data class ErrorResponse(
    @SerialName("code")
    val code: String,
    
    @SerialName("message")
    val message: String,
    
    @SerialName("details")
    val details: JsonObject? = null,
    
    @SerialName("timestamp")
    @Contextual
    val timestamp: Instant = Instant.now(),
    
    @SerialName("path")
    val path: String? = null,
    
    @SerialName("traceId")
    val traceId: String? = null
) {
    companion object {
        /**
         * Creates a simple error response with just code and message.
         */
        fun of(code: String, message: String): ErrorResponse {
            return ErrorResponse(
                code = code,
                message = message
            )
        }
        
        /**
         * Creates an error response with additional details.
         */
        fun withDetails(
            code: String,
            message: String,
            details: JsonObject
        ): ErrorResponse {
            return ErrorResponse(
                code = code,
                message = message,
                details = details
            )
        }
        
        /**
         * Creates a validation error response.
         */
        fun validationError(
            message: String = "Validation failed",
            violations: List<ValidationError>
        ): ErrorResponse {
            return ErrorResponse(
                code = "VALIDATION_ERROR",
                message = message,
                details = buildJsonObject {
                    put("violations", kotlinx.serialization.json.Json.encodeToJsonElement(kotlinx.serialization.serializer(), violations))
                }
            )
        }
        
        /**
         * Creates a not found error response.
         */
        fun notFound(
            resourceType: String,
            resourceId: Any
        ): ErrorResponse {
            return ErrorResponse(
                code = "RESOURCE_NOT_FOUND",
                message = "$resourceType not found",
                details = buildJsonObject {
                    put("resourceType", JsonPrimitive(resourceType))
                    put("resourceId", JsonPrimitive(resourceId.toString()))
                }
            )
        }
        
        /**
         * Creates a conflict error response.
         */
        fun conflict(
            message: String,
            conflictingResource: Any? = null
        ): ErrorResponse {
            val details = conflictingResource?.let {
                buildJsonObject {
                    put("conflictingResource", JsonPrimitive(it.toString()))
                }
            }
            
            return ErrorResponse(
                code = "CONFLICT",
                message = message,
                details = details
            )
        }
        
        /**
         * Creates an unauthorized error response.
         */
        fun unauthorized(
            message: String = "Authentication required"
        ): ErrorResponse {
            return ErrorResponse(
                code = "UNAUTHORIZED",
                message = message
            )
        }
        
        /**
         * Creates a forbidden error response.
         */
        fun forbidden(
            message: String = "Access denied",
            requiredPermission: String? = null
        ): ErrorResponse {
            val details = requiredPermission?.let {
                buildJsonObject {
                    put("requiredPermission", JsonPrimitive(it))
                }
            }
            
            return ErrorResponse(
                code = "FORBIDDEN",
                message = message,
                details = details
            )
        }
        
        /**
         * Creates an internal server error response.
         * In production, sensitive details should be omitted.
         */
        fun internalError(
            message: String = "An internal error occurred",
            debugInfo: String? = null,
            includeDebugInfo: Boolean = false
        ): ErrorResponse {
            val details = if (includeDebugInfo && debugInfo != null) {
                buildJsonObject {
                    put("debug", JsonPrimitive(debugInfo))
                }
            } else {
                null
            }
            
            return ErrorResponse(
                code = "INTERNAL_ERROR",
                message = message,
                details = details
            )
        }
    }
}

/**
 * Represents a single validation error for a field.
 * 
 * @property field The name of the field that failed validation
 * @property message The validation error message
 * @property rejectedValue The value that was rejected (optional)
 */
@Serializable
data class ValidationError(
    @SerialName("field")
    val field: String,
    
    @SerialName("message")
    val message: String,
    
    @SerialName("rejectedValue")
    @Contextual
    val rejectedValue: Any? = null
)