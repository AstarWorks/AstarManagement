package dev.ryuzu.astermanagement.controller.advice

import dev.ryuzu.astermanagement.dto.common.ErrorResponse
import dev.ryuzu.astermanagement.service.exception.*
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.ConstraintViolationException
import org.slf4j.LoggerFactory
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.AuthenticationException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.servlet.NoHandlerFoundException
import java.time.OffsetDateTime

/**
 * Global exception handler for REST controllers.
 * Provides consistent error response formatting across the API.
 */
@RestControllerAdvice
class GlobalExceptionHandler(
    private val messageSource: MessageSource
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Handles validation errors from request body validation.
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val errors = ex.bindingResult.fieldErrors.map { error ->
            ErrorResponse.ErrorDetail(
                field = error.field,
                message = messageSource.getMessage(error, locale),
                code = error.code
            )
        }
        
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = getMessage("validation.failed", locale),
            path = request.requestURI,
            details = errors
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles constraint violation errors from entity validation.
     */
    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraintViolation(
        ex: ConstraintViolationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val errors = ex.constraintViolations.map { violation ->
            ErrorResponse.ErrorDetail(
                field = violation.propertyPath.toString(),
                message = violation.message,
                code = "constraint.violation"
            )
        }
        
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = getMessage("validation.constraint.failed", locale),
            path = request.requestURI,
            details = errors
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles data integrity violations (e.g., unique constraint violations).
     */
    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrityViolation(
        ex: DataIntegrityViolationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        logger.error("Data integrity violation", ex)
        
        val message = when {
            ex.message?.contains("unique", ignoreCase = true) == true -> 
                getMessage("error.duplicate.resource", locale)
            else -> getMessage("error.data.integrity", locale)
        }
        
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.CONFLICT.value(),
            error = HttpStatus.CONFLICT.reasonPhrase,
            message = message,
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
    }
    
    /**
     * Handles UnauthorizedException from our business logic
     */
    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorizedException(
        ex: UnauthorizedException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.UNAUTHORIZED.value(),
            error = HttpStatus.UNAUTHORIZED.reasonPhrase,
            message = ex.message ?: getMessage("error.unauthorized", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response)
    }

    /**
     * Handles authentication errors.
     */
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthenticationException(
        ex: AuthenticationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val message = when (ex) {
            is BadCredentialsException -> getMessage("error.invalid.credentials", locale)
            else -> getMessage("error.authentication.failed", locale)
        }
        
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.UNAUTHORIZED.value(),
            error = HttpStatus.UNAUTHORIZED.reasonPhrase,
            message = message,
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response)
    }
    
    /**
     * Handles access denied errors.
     */
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(
        ex: AccessDeniedException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.FORBIDDEN.value(),
            error = HttpStatus.FORBIDDEN.reasonPhrase,
            message = getMessage("error.access.denied", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response)
    }
    
    /**
     * Handles missing request parameters.
     */
    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingParameter(
        ex: MissingServletRequestParameterException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = getMessage("error.missing.parameter", locale, arrayOf(ex.parameterName)),
            path = request.requestURI,
            details = listOf(
                ErrorResponse.ErrorDetail(
                    field = ex.parameterName,
                    message = "Required parameter is missing",
                    code = "missing.parameter"
                )
            )
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles type mismatch errors.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(
        ex: MethodArgumentTypeMismatchException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = getMessage("error.type.mismatch", locale, arrayOf(ex.name ?: "unknown", ex.requiredType?.simpleName ?: "unknown")),
            path = request.requestURI,
            details = listOf(
                ErrorResponse.ErrorDetail(
                    field = ex.name ?: "unknown",
                    message = "Invalid type: expected ${ex.requiredType?.simpleName ?: "unknown"}",
                    code = "type.mismatch"
                )
            )
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles malformed JSON requests.
     */
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadable(
        ex: HttpMessageNotReadableException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = getMessage("error.invalid.json", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles 404 Not Found errors.
     */
    @ExceptionHandler(NoHandlerFoundException::class)
    fun handleNotFound(
        ex: NoHandlerFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.NOT_FOUND.value(),
            error = HttpStatus.NOT_FOUND.reasonPhrase,
            message = getMessage("error.resource.not.found", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response)
    }
    
    /**
     * Handles business logic exceptions.
     */
    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalState(
        ex: IllegalStateException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = ex.message ?: getMessage("error.invalid.operation", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles business exceptions - matters not found.
     */
    @ExceptionHandler(MatterNotFoundException::class)
    fun handleMatterNotFound(
        ex: MatterNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.NOT_FOUND.value(),
            error = HttpStatus.NOT_FOUND.reasonPhrase,
            message = ex.message ?: getMessage("error.matter.not.found", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response)
    }
    
    /**
     * Handles invalid status transition exceptions.
     */
    @ExceptionHandler(InvalidStatusTransitionException::class)
    fun handleInvalidStatusTransition(
        ex: InvalidStatusTransitionException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = ex.message ?: getMessage("error.invalid.status.transition", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles insufficient permission exceptions.
     */
    @ExceptionHandler(InsufficientPermissionException::class)
    fun handleInsufficientPermission(
        ex: InsufficientPermissionException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.FORBIDDEN.value(),
            error = HttpStatus.FORBIDDEN.reasonPhrase,
            message = ex.message ?: getMessage("error.insufficient.permission", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response)
    }
    
    /**
     * Handles business validation exceptions.
     */
    @ExceptionHandler(ValidationException::class)
    fun handleBusinessValidation(
        ex: ValidationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = getMessage("validation.failed", locale),
            path = request.requestURI,
            details = listOf(
                ErrorResponse.ErrorDetail(
                    field = ex.field,
                    message = ex.message ?: "Validation failed",
                    code = "business.validation"
                )
            )
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles business rule violation exceptions.
     */
    @ExceptionHandler(BusinessRuleViolationException::class)
    fun handleBusinessRuleViolation(
        ex: BusinessRuleViolationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = ex.message ?: getMessage("error.business.rule.violation", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.badRequest().body(response)
    }
    
    /**
     * Handles resource already exists exceptions.
     */
    @ExceptionHandler(ResourceAlreadyExistsException::class)
    fun handleResourceAlreadyExists(
        ex: ResourceAlreadyExistsException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.CONFLICT.value(),
            error = HttpStatus.CONFLICT.reasonPhrase,
            message = ex.message ?: getMessage("error.resource.already.exists", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
    }
    
    /**
     * Handles all other unhandled exceptions.
     */
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val locale = LocaleContextHolder.getLocale()
        logger.error("Unhandled exception", ex)
        
        val response = ErrorResponse(
            timestamp = OffsetDateTime.now(),
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = HttpStatus.INTERNAL_SERVER_ERROR.reasonPhrase,
            message = getMessage("error.internal.server", locale),
            path = request.requestURI
        )
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response)
    }
    
    /**
     * Helper method to get localized messages.
     */
    private fun getMessage(code: String, locale: java.util.Locale, args: Array<Any>? = null): String {
        return try {
            messageSource.getMessage(code, args, locale)
        } catch (ex: Exception) {
            logger.warn("Message not found for code: $code", ex)
            code // Return code as fallback
        }
    }
}