package dev.ryuzu.astermanagement.dto.common

import io.swagger.v3.oas.annotations.media.Schema
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
@Schema(description = "Standard error response following RFC 7807 Problem Details format")
data class ErrorResponse(
    @Schema(description = "When the error occurred", example = "2025-01-01T10:00:00Z")
    val timestamp: OffsetDateTime = OffsetDateTime.now(),
    
    @Schema(description = "HTTP status code", example = "400")
    val status: Int,
    
    @Schema(description = "HTTP status text", example = "Bad Request")
    val error: String,
    
    @Schema(description = "Human-readable error message", example = "Invalid request data")
    val message: String,
    
    @Schema(description = "The request path that caused the error", example = "/api/v1/matters")
    val path: String,
    
    @Schema(description = "Additional error details (e.g., validation errors)")
    val details: List<ErrorDetail>? = null
) {
    /**
     * Detailed error information for specific fields or validation errors.
     * 
     * @property field The field that caused the error (optional)
     * @property message Specific error message for this field
     * @property code Error code for programmatic handling (optional)
     */
    @Schema(description = "Detailed error information for specific fields or validation errors")
    data class ErrorDetail(
        @Schema(description = "The field that caused the error", example = "caseNumber")
        val field: String? = null,
        
        @Schema(description = "Specific error message for this field", example = "Case number must follow format YYYY-TT-NNNN")
        val message: String,
        
        @Schema(description = "Error code for programmatic handling", example = "VALIDATION_ERROR")
        val code: String? = null
    )
}