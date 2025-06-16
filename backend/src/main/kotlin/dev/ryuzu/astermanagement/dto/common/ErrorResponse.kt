package dev.ryuzu.astermanagement.dto.common

import java.time.OffsetDateTime

/**
 * Standard error response format for API errors.
 * Follows a consistent structure for all error responses.
 * 
 * @property timestamp When the error occurred
 * @property status HTTP status code
 * @property error HTTP status text
 * @property message Human-readable error message
 * @property path The request path that caused the error
 * @property details Additional error details (e.g., validation errors)
 */
data class ErrorResponse(
    val timestamp: OffsetDateTime = OffsetDateTime.now(),
    val status: Int,
    val error: String,
    val message: String,
    val path: String,
    val details: List<ErrorDetail>? = null
) {
    /**
     * Detailed error information for specific fields or validation errors.
     * 
     * @property field The field that caused the error (optional)
     * @property message Specific error message for this field
     * @property code Error code for programmatic handling (optional)
     */
    data class ErrorDetail(
        val field: String? = null,
        val message: String,
        val code: String? = null
    )
}