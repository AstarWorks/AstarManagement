package com.astarworks.astarmanagement.expense.presentation.response

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.Instant

/**
 * Standard error response format for expense API
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ErrorResponse(
    val success: Boolean = false,
    val error: ErrorDetails,
    val meta: ErrorMeta? = null
)

/**
 * Detailed error information
 */
data class ErrorDetails(
    val code: String,
    val statusCode: Int,
    val message: String,
    val details: Any? = null
)

/**
 * Additional metadata for error tracking
 */
data class ErrorMeta(
    val timestamp: Instant = Instant.now(),
    val requestId: String,
    val path: String? = null
)

/**
 * Validation error details for field-specific errors
 */
data class ValidationErrorDetail(
    val field: String,
    val message: String,
    val rejectedValue: Any? = null
)