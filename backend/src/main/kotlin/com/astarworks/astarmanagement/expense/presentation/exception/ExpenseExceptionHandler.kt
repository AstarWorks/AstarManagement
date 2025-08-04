package com.astarworks.astarmanagement.expense.presentation.exception

import com.astarworks.astarmanagement.expense.domain.model.*
import com.astarworks.astarmanagement.expense.presentation.response.ErrorDetails
import com.astarworks.astarmanagement.expense.presentation.response.ErrorMeta
import com.astarworks.astarmanagement.expense.presentation.response.ErrorResponse
import com.astarworks.astarmanagement.expense.presentation.response.ValidationErrorDetail
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.context.MessageSource
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.util.*
import jakarta.servlet.http.HttpServletRequest

/**
 * Exception handler specifically for expense-related operations.
 * Has higher precedence than the global exception handler.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class ExpenseExceptionHandler(
    private val messageSource: MessageSource
) {
    companion object {
        private val logger = LoggerFactory.getLogger(ExpenseExceptionHandler::class.java)
    }
    
    @ExceptionHandler(ExpenseNotFoundException::class)
    fun handleNotFound(
        ex: ExpenseNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Resource not found: ${ex.message}")
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(createErrorResponse(
                ex.code,
                HttpStatus.NOT_FOUND,
                ex.message ?: "Resource not found",
                request
            ))
    }
    
    @ExceptionHandler(TagNotFoundException::class)
    fun handleTagNotFound(
        ex: TagNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Tag not found: ${ex.message}")
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(createErrorResponse(
                ex.code,
                HttpStatus.NOT_FOUND,
                ex.message ?: "Tag not found",
                request
            ))
    }
    
    @ExceptionHandler(AttachmentNotFoundException::class)
    fun handleAttachmentNotFound(
        ex: AttachmentNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Attachment not found: ${ex.message}")
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(createErrorResponse(
                ex.code,
                HttpStatus.NOT_FOUND,
                ex.message ?: "Attachment not found",
                request
            ))
    }
    
    @ExceptionHandler(InvalidExpenseDataException::class)
    fun handleInvalidData(
        ex: InvalidExpenseDataException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Invalid data: ${ex.message}")
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(createErrorResponse(
                ex.code,
                HttpStatus.BAD_REQUEST,
                ex.message ?: "Invalid data",
                request
            ))
    }
    
    @ExceptionHandler(InsufficientPermissionException::class)
    fun handleInsufficientPermission(
        ex: InsufficientPermissionException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Insufficient permission: ${ex.message}")
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(createErrorResponse(
                ex.code,
                HttpStatus.FORBIDDEN,
                ex.message ?: "Insufficient permission",
                request
            ))
    }
    
    @ExceptionHandler(FileSizeLimitExceededException::class)
    fun handleFileSizeLimit(
        ex: FileSizeLimitExceededException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("File size limit exceeded: ${ex.message}")
        
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(createErrorResponse(
                ex.code,
                HttpStatus.PAYLOAD_TOO_LARGE,
                ex.message ?: "File size limit exceeded",
                request
            ))
    }
    
    @ExceptionHandler(UnsupportedFileTypeException::class)
    fun handleUnsupportedFileType(
        ex: UnsupportedFileTypeException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Unsupported file type: ${ex.message}")
        
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
            .body(createErrorResponse(
                ex.code,
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                ex.message ?: "Unsupported file type",
                request
            ))
    }
    
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val fieldErrors = ex.bindingResult.fieldErrors
        logger.warn("Validation error: ${fieldErrors.size} field errors")
        
        val errors = fieldErrors.map { fieldError ->
            ValidationErrorDetail(
                field = fieldError.field,
                message = fieldError.defaultMessage ?: "Invalid value",
                rejectedValue = fieldError.rejectedValue
            )
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(createErrorResponse(
                ExpenseErrorCodes.VALIDATION_ERROR,
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                request,
                errors
            ))
    }
    
    @ExceptionHandler(Exception::class)
    fun handleGenericError(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Unexpected error in expense module", ex)
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(createErrorResponse(
                ExpenseErrorCodes.INTERNAL_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                request
            ))
    }
    
    private fun createErrorResponse(
        code: String,
        status: HttpStatus,
        message: String,
        request: HttpServletRequest,
        details: Any? = null
    ): ErrorResponse {
        return ErrorResponse(
            error = ErrorDetails(
                code = code,
                statusCode = status.value(),
                message = message,
                details = details
            ),
            meta = ErrorMeta(
                requestId = MDC.get("requestId") ?: UUID.randomUUID().toString(),
                path = request.requestURI
            )
        )
    }
}