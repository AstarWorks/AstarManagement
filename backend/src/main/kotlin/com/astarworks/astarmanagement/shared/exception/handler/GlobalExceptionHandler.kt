package com.astarworks.astarmanagement.shared.exception.handler

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.common.*
import com.astarworks.astarmanagement.shared.exception.dto.ErrorResponse
import com.astarworks.astarmanagement.shared.exception.dto.ValidationError
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.core.env.Environment
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.AuthenticationException
import org.springframework.validation.FieldError
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.servlet.NoHandlerFoundException
import java.util.UUID

/**
 * Global exception handler for the entire application.
 * Provides consistent error responses across all APIs.
 * 
 * This handler has the lowest precedence, allowing module-specific handlers
 * to handle their exceptions first.
 */
@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
class GlobalExceptionHandler(
    private val environment: Environment,
    private val request: HttpServletRequest
) {
    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    
    /**
     * Handles all BusinessException and its subclasses.
     */
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(
        ex: BusinessException,
        request: HttpServletRequest,
        response: HttpServletResponse
    ): ErrorResponse {
        logException(ex, ex.isClientError())
        response.status = ex.httpStatus
        
        return ex.toErrorResponse().copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles ResourceNotFoundException specifically.
     */
    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleResourceNotFound(
        ex: ResourceNotFoundException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Resource not found", ex)
        response.status = HttpStatus.NOT_FOUND.value()
        
        return ex.toErrorResponse().copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles ValidationException specifically.
     */
    @ExceptionHandler(ValidationException::class)
    fun handleValidation(
        ex: ValidationException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Validation failed", ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return ex.toErrorResponse().copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles ConflictException specifically.
     */
    @ExceptionHandler(ConflictException::class)
    fun handleConflict(
        ex: ConflictException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Conflict occurred", ex)
        response.status = HttpStatus.CONFLICT.value()
        
        return ex.toErrorResponse().copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles UnauthorizedException specifically.
     */
    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorized(
        ex: UnauthorizedException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Authentication failed", ex)
        response.status = HttpStatus.UNAUTHORIZED.value()
        
        return ex.toErrorResponse().copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles ForbiddenException specifically.
     */
    @ExceptionHandler(ForbiddenException::class)
    fun handleForbidden(
        ex: ForbiddenException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Access denied", ex)
        response.status = HttpStatus.FORBIDDEN.value()
        
        return ex.toErrorResponse().copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles Spring's MethodArgumentNotValidException for @Valid annotation failures.
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValid(
        ex: MethodArgumentNotValidException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Request validation failed", ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        val violations = ex.bindingResult.allErrors.map { error ->
            when (error) {
                is FieldError -> ValidationError(
                    field = error.field,
                    message = error.defaultMessage ?: "Invalid value",
                    rejectedValue = error.rejectedValue
                )
                else -> ValidationError(
                    field = "unknown",
                    message = error.defaultMessage ?: "Validation error"
                )
            }
        }
        
        return ErrorResponse.validationError(
            message = "Request validation failed",
            violations = violations
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles missing request parameters.
     */
    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingParameter(
        ex: MissingServletRequestParameterException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Missing request parameter", ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return ErrorResponse.validationError(
            message = "Missing required parameter: ${ex.parameterName}",
            violations = listOf(
                ValidationError(
                    field = ex.parameterName,
                    message = "Required parameter is missing"
                )
            )
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles type mismatch in method arguments.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(
        ex: MethodArgumentTypeMismatchException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Type mismatch", ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        val expectedType = ex.requiredType?.simpleName ?: "unknown"
        return ErrorResponse.validationError(
            message = "Invalid parameter type",
            violations = listOf(
                ValidationError(
                    field = ex.name,
                    message = "Expected type: $expectedType",
                    rejectedValue = ex.value
                )
            )
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles invalid JSON in request body.
     */
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleMessageNotReadable(
        ex: HttpMessageNotReadableException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Invalid request body", ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return ErrorResponse.of(
            code = "INVALID_REQUEST_BODY",
            message = "Invalid request body: ${extractReadableMessage(ex)}"
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles unsupported HTTP methods.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException::class)
    fun handleMethodNotSupported(
        ex: HttpRequestMethodNotSupportedException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning("Method not supported", ex)
        response.status = HttpStatus.METHOD_NOT_ALLOWED.value()
        
        val supportedMethods = ex.supportedMethods?.joinToString(", ") ?: "none"
        return ErrorResponse.of(
            code = "METHOD_NOT_ALLOWED",
            message = "Method ${ex.method} not allowed. Supported methods: $supportedMethods"
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
    }
    
    /**
     * Handles unsupported media types.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException::class)
    fun handleMediaTypeNotSupported(
        ex: HttpMediaTypeNotSupportedException
    ): ResponseEntity<ErrorResponse> {
        logWarning("Media type not supported", ex)
        
        val supportedTypes = ex.supportedMediaTypes.joinToString(", ")
        val response = ErrorResponse.of(
            code = "UNSUPPORTED_MEDIA_TYPE",
            message = "Media type not supported. Supported types: $supportedTypes"
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
        
        return ResponseEntity
            .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
            .body(response)
    }
    
    /**
     * Handles 404 - endpoint not found.
     */
    @ExceptionHandler(NoHandlerFoundException::class)
    fun handleNoHandlerFound(
        ex: NoHandlerFoundException
    ): ResponseEntity<ErrorResponse> {
        logWarning("Endpoint not found", ex)
        
        val response = ErrorResponse.of(
            code = "ENDPOINT_NOT_FOUND",
            message = "Endpoint not found: ${ex.requestURL}"
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
        
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(response)
    }
    
    /**
     * Handles database constraint violations.
     */
    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrityViolation(
        ex: DataIntegrityViolationException
    ): ResponseEntity<ErrorResponse> {
        logWarning("Data integrity violation", ex)
        
        val message = if (isProduction()) {
            "Operation failed due to data constraints"
        } else {
            extractConstraintMessage(ex)
        }
        
        val response = ErrorResponse.of(
            code = "DATA_INTEGRITY_VIOLATION",
            message = message
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
        
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(response)
    }
    
    /**
     * Handles Spring Security authentication exceptions.
     */
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthentication(
        ex: AuthenticationException
    ): ResponseEntity<ErrorResponse> {
        logWarning("Authentication failed", ex)
        
        val (code, message) = when (ex) {
            is BadCredentialsException -> "INVALID_CREDENTIALS" to "Invalid username or password"
            else -> "AUTHENTICATION_FAILED" to "Authentication failed"
        }
        
        val response = ErrorResponse.of(code, message).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
        
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(response)
    }
    
    /**
     * Handles Spring Security access denied exceptions.
     */
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(
        ex: AccessDeniedException
    ): ResponseEntity<ErrorResponse> {
        logWarning("Access denied", ex)
        
        val response = ErrorResponse.forbidden().copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
        
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(response)
    }
    
    /**
     * Handles IllegalArgumentException.
     */
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(
        ex: IllegalArgumentException
    ): ResponseEntity<ErrorResponse> {
        logWarning("Invalid argument", ex)
        
        val response = ErrorResponse.of(
            code = "INVALID_ARGUMENT",
            message = ex.message ?: "Invalid argument provided"
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(response)
    }
    
    /**
     * Handles IllegalStateException.
     */
    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalState(
        ex: IllegalStateException
    ): ResponseEntity<ErrorResponse> {
        logWarning("Invalid state", ex)
        
        val response = ErrorResponse.of(
            code = "INVALID_STATE",
            message = ex.message ?: "Operation not allowed in current state"
        ).copy(
            path = request.requestURI,
            traceId = getTraceId()
        )
        
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(response)
    }
    
    /**
     * Handles all other exceptions as internal server errors.
     * This is the catch-all handler.
     */
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception
    ): ResponseEntity<ErrorResponse> {
        logError("Unexpected error", ex)
        
        val response = if (isProduction()) {
            ErrorResponse.internalError().copy(
                path = request.requestURI,
                traceId = getTraceId()
            )
        } else {
            ErrorResponse.internalError(
                message = ex.message ?: "An unexpected error occurred",
                debugInfo = ex.stackTraceToString(),
                includeDebugInfo = true
            ).copy(
                path = request.requestURI,
                traceId = getTraceId()
            )
        }
        
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(response)
    }
    
    // === Helper Methods ===
    
    private fun logException(ex: Exception, isClientError: Boolean) {
        if (isClientError) {
            logWarning(ex.message ?: "Client error", ex)
        } else {
            logError(ex.message ?: "Server error", ex)
        }
    }
    
    private fun logWarning(message: String, ex: Exception) {
        logger.warn("$message: ${ex.message}")
        logger.debug("Stack trace:", ex)
    }
    
    private fun logError(message: String, ex: Exception) {
        logger.error("$message: ${ex.message}", ex)
    }
    
    private fun getTraceId(): String {
        return MDC.get("traceId") ?: UUID.randomUUID().toString()
    }
    
    private fun isProduction(): Boolean {
        return environment.activeProfiles.contains("prod") || 
               environment.activeProfiles.contains("production")
    }
    
    private fun extractReadableMessage(ex: HttpMessageNotReadableException): String {
        val message = ex.mostSpecificCause.message ?: ex.message ?: "Malformed JSON"
        
        // Simplify common JSON parsing errors
        return when {
            message.contains("Cannot deserialize") -> "Invalid data format"
            message.contains("Unrecognized field") -> {
                val field = message.substringAfter("\"").substringBefore("\"")
                "Unknown field: $field"
            }
            message.contains("Required property") -> {
                val property = message.substringAfter("'").substringBefore("'")
                "Missing required field: $property"
            }
            else -> message.take(200) // Limit message length
        }
    }
    
    private fun extractConstraintMessage(ex: DataIntegrityViolationException): String {
        val message = ex.mostSpecificCause.message ?: ex.message ?: "Data constraint violation"
        
        // Extract constraint name if possible
        return when {
            message.contains("unique constraint", ignoreCase = true) -> "Duplicate value not allowed"
            message.contains("foreign key", ignoreCase = true) -> "Referenced data not found"
            message.contains("not null", ignoreCase = true) -> "Required value is missing"
            else -> "Data constraint violation"
        }
    }
}