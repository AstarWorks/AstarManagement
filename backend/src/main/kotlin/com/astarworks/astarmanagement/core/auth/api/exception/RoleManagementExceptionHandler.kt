package com.astarworks.astarmanagement.core.auth.api.exception

import com.astarworks.astarmanagement.shared.exception.dto.ErrorResponse
import com.astarworks.astarmanagement.core.auth.domain.exception.RoleManagementException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.core.env.Environment
import org.springframework.http.HttpStatus
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.util.UUID

/**
 * Global exception handler for role management related exceptions.
 * Provides consistent error responses across all role management APIs.
 * 
 * Features:
 * - Unified error response format
 * - Appropriate HTTP status codes
 * - Detailed logging for debugging
 * - Environment-aware error details (hide sensitive info in production)
 * - Request tracking with correlation IDs
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class RoleManagementExceptionHandler(
    private val environment: Environment,
    private val request: HttpServletRequest
) {
    private val logger = LoggerFactory.getLogger(RoleManagementExceptionHandler::class.java)
    
    // === RoleManagementException Handlers ===
    
    /**
     * Handles RoleNotFoundException - HTTP 404
     */
    @ExceptionHandler(RoleManagementException.RoleNotFoundException::class)
    fun handleRoleNotFound(
        ex: RoleManagementException.RoleNotFoundException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.NOT_FOUND.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Role not found",
            details = mapOf("roleId" to ex.roleId.toString())
        )
    }
    
    /**
     * Handles DuplicateRoleException - HTTP 409
     */
    @ExceptionHandler(RoleManagementException.DuplicateRoleException::class)
    fun handleDuplicateRole(
        ex: RoleManagementException.DuplicateRoleException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.CONFLICT.value()
        
        val details = mutableMapOf<String, Any>("roleName" to ex.name)
        ex.tenantId?.let { details["tenantId"] = it.toString() }
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Duplicate role",
            details = details
        )
    }
    
    /**
     * Handles SystemRoleException - HTTP 403
     */
    @ExceptionHandler(RoleManagementException.SystemRoleException::class)
    fun handleSystemRole(
        ex: RoleManagementException.SystemRoleException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.FORBIDDEN.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "System role operation not allowed"
        )
    }
    
    /**
     * Handles InvalidPermissionException - HTTP 400
     */
    @ExceptionHandler(RoleManagementException.InvalidPermissionException::class)
    fun handleInvalidPermission(
        ex: RoleManagementException.InvalidPermissionException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        val details = mutableMapOf<String, Any>("permission" to ex.permission)
        ex.reason?.let { details["reason"] = it }
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Invalid permission",
            details = details
        )
    }
    
    /**
     * Handles RoleInUseException - HTTP 409
     */
    @ExceptionHandler(RoleManagementException.RoleInUseException::class)
    fun handleRoleInUse(
        ex: RoleManagementException.RoleInUseException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.CONFLICT.value()
        
        val details = mutableMapOf<String, Any>("roleId" to ex.roleId.toString())
        ex.userCount?.let { details["userCount"] = it }
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Role is in use",
            details = details
        )
    }
    
    /**
     * Handles RoleTenantMismatchException - HTTP 403
     */
    @ExceptionHandler(RoleManagementException.RoleTenantMismatchException::class)
    fun handleRoleTenantMismatch(
        ex: RoleManagementException.RoleTenantMismatchException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.FORBIDDEN.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Role tenant mismatch",
            details = if (isDevelopment()) {
                mapOf(
                    "roleId" to ex.roleId.toString(),
                    "expectedTenantId" to ex.expectedTenantId.toString(),
                    "actualTenantId" to (ex.actualTenantId?.toString() ?: "null")
                )
            } else {
                null
            }
        )
    }
    
    /**
     * Handles TemplateNotFoundException - HTTP 404
     */
    @ExceptionHandler(RoleManagementException.TemplateNotFoundException::class)
    fun handleTemplateNotFound(
        ex: RoleManagementException.TemplateNotFoundException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.NOT_FOUND.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Template not found",
            details = mapOf("templateName" to ex.templateName)
        )
    }
    
    /**
     * Handles TemplateApplicationException - HTTP 400
     */
    @ExceptionHandler(RoleManagementException.TemplateApplicationException::class)
    fun handleTemplateApplication(
        ex: RoleManagementException.TemplateApplicationException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Template application failed",
            details = mapOf(
                "templateName" to ex.templateName,
                "reason" to ex.reason
            )
        )
    }
    
    /**
     * Handles RoleImportExportException - HTTP 400
     */
    @ExceptionHandler(RoleManagementException.RoleImportExportException::class)
    fun handleRoleImportExport(
        ex: RoleManagementException.RoleImportExportException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Import/Export operation failed",
            details = mapOf(
                "operation" to ex.operation,
                "reason" to ex.reason
            )
        )
    }
    
    /**
     * Handles InvalidRoleNameException - HTTP 400
     */
    @ExceptionHandler(RoleManagementException.InvalidRoleNameException::class)
    fun handleInvalidRoleName(
        ex: RoleManagementException.InvalidRoleNameException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Invalid role name",
            details = mapOf(
                "name" to ex.name,
                "reason" to ex.reason
            )
        )
    }
    
    /**
     * Handles InvalidRoleColorException - HTTP 400
     */
    @ExceptionHandler(RoleManagementException.InvalidRoleColorException::class)
    fun handleInvalidRoleColor(
        ex: RoleManagementException.InvalidRoleColorException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Invalid role color",
            details = mapOf("color" to ex.color)
        )
    }
    
    /**
     * Handles RoleLimitExceededException - HTTP 403
     */
    @ExceptionHandler(RoleManagementException.RoleLimitExceededException::class)
    fun handleRoleLimitExceeded(
        ex: RoleManagementException.RoleLimitExceededException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.FORBIDDEN.value()
        
        return createErrorResponse(
            code = ex.code,
            message = ex.message ?: "Role limit exceeded",
            details = mapOf(
                "tenantId" to ex.tenantId.toString(),
                "currentCount" to ex.currentCount,
                "limit" to ex.limit
            )
        )
    }
    
    // === Standard Exception Handlers ===
    
    /**
     * Handles validation exceptions - HTTP 400
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        ex: MethodArgumentNotValidException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        val errors = ex.bindingResult.fieldErrors.associate { fieldError ->
            fieldError.field to (fieldError.defaultMessage ?: "Invalid value")
        }
        
        return createErrorResponse(
            code = "VALIDATION_ERROR",
            message = "Validation failed",
            details = mapOf("errors" to errors)
        )
    }
    
    /**
     * Handles IllegalArgumentException - HTTP 400
     */
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(
        ex: IllegalArgumentException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.BAD_REQUEST.value()
        
        return createErrorResponse(
            code = "INVALID_ARGUMENT",
            message = ex.message ?: "Invalid argument"
        )
    }
    
    /**
     * Handles IllegalStateException - HTTP 409
     */
    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalState(
        ex: IllegalStateException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.CONFLICT.value()
        
        return createErrorResponse(
            code = "ILLEGAL_STATE",
            message = ex.message ?: "Operation not allowed in current state"
        )
    }
    
    /**
     * Handles AccessDeniedException - HTTP 403
     */
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(
        ex: AccessDeniedException,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(ex)
        response.status = HttpStatus.FORBIDDEN.value()
        
        return createErrorResponse(
            code = "ACCESS_DENIED",
            message = "Access denied"
        )
    }
    
    /**
     * Handles NotImplementedError - HTTP 501
     */
    @ExceptionHandler(NotImplementedError::class)
    fun handleNotImplemented(
        ex: NotImplementedError,
        response: HttpServletResponse
    ): ErrorResponse {
        logWarning(Exception(ex.message, ex))
        response.status = HttpStatus.NOT_IMPLEMENTED.value()
        
        return createErrorResponse(
            code = "NOT_IMPLEMENTED",
            message = ex.message ?: "Feature not yet implemented"
        )
    }
    
    /**
     * Handles generic exceptions - HTTP 500
     * Only handles exceptions not covered by more specific handlers
     */
    @ExceptionHandler(RoleManagementException::class)
    fun handleGenericRoleManagementException(
        ex: RoleManagementException,
        response: HttpServletResponse
    ): ErrorResponse {
        logError(ex)
        response.status = HttpStatus.INTERNAL_SERVER_ERROR.value()
        
        // Hide details in production
        val message = if (isDevelopment()) {
            ex.message ?: "Internal server error"
        } else {
            "An error occurred while processing your request"
        }
        
        return createErrorResponse(
            code = "INTERNAL_ERROR",
            message = message,
            details = if (isDevelopment()) {
                mapOf(
                    "exception" to ex.javaClass.simpleName,
                    "stackTrace" to ex.stackTrace.take(5).map { it.toString() }
                )
            } else {
                null
            }
        )
    }
    
    // === Helper Methods ===
    
    /**
     * Creates a standardized error response.
     */
    private fun createErrorResponse(
        code: String,
        message: String,
        details: Map<String, Any>? = null
    ): ErrorResponse {
        val requestId = MDC.get("requestId") ?: UUID.randomUUID().toString()
        
        val enrichedDetails = mutableMapOf<String, Any>("requestId" to requestId)
        details?.let { enrichedDetails.putAll(it) }
        
        // Add request context in development
        if (isDevelopment()) {
            enrichedDetails["path"] = request.requestURI
            enrichedDetails["method"] = request.method
        }
        
        val jsonDetails = if (enrichedDetails.isNotEmpty()) {
            buildJsonObject {
                enrichedDetails.forEach { (key, value) ->
                    put(key, JsonPrimitive(value.toString()))
                }
            }
        } else null

        return ErrorResponse(
            code = code,
            message = message,
            details = jsonDetails,
            timestamp = Instant.now()
        )
    }
    
    /**
     * Logs warning level errors.
     */
    private fun logWarning(ex: Exception) {
        val requestInfo = buildRequestInfo()
        logger.warn("Warning: $requestInfo - ${ex.message}")
    }
    
    /**
     * Logs error level exceptions.
     */
    private fun logError(ex: Exception) {
        val requestInfo = buildRequestInfo()
        logger.error("Error: $requestInfo", ex)
    }
    
    /**
     * Builds request information for logging.
     */
    private fun buildRequestInfo(): Map<String, Any?> {
        return mapOf(
            "method" to request.method,
            "path" to request.requestURI,
            "user" to SecurityContextHolder.getContext().authentication?.name,
            "remoteAddr" to request.remoteAddr
        )
    }
    
    /**
     * Checks if the application is running in development mode.
     */
    private fun isDevelopment(): Boolean {
        val profiles = environment.activeProfiles
        return profiles.contains("dev") || 
               profiles.contains("local") || 
               profiles.contains("test")
    }
}