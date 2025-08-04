package com.astarworks.astarmanagement.expense.presentation.exception

import com.astarworks.astarmanagement.expense.domain.model.*
import com.astarworks.astarmanagement.expense.presentation.response.ErrorResponse
import com.astarworks.astarmanagement.expense.presentation.response.ValidationErrorDetail
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.Assertions.*
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.whenever
import org.mockito.kotlin.mock
import org.slf4j.MDC
import org.springframework.context.MessageSource
import org.springframework.http.HttpStatus
import org.springframework.validation.BindingResult
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import java.util.*
import jakarta.servlet.http.HttpServletRequest

@ExtendWith(MockitoExtension::class)
class ExpenseExceptionHandlerTest {

    @Mock
    private lateinit var messageSource: MessageSource

    @Mock
    private lateinit var request: HttpServletRequest

    @Mock
    private lateinit var bindingResult: BindingResult

    private lateinit var exceptionHandler: ExpenseExceptionHandler

    @BeforeEach
    fun setUp() {
        exceptionHandler = ExpenseExceptionHandler(messageSource)
        
        // Set up common mock behaviors
        whenever(request.requestURI).thenReturn("/api/v1/expenses")
        
        // Set up MDC with request ID
        MDC.put("requestId", "test-request-id-123")
    }

    @Test
    fun `should handle ExpenseNotFoundException with 404 status`() {
        // Given
        val expenseId = UUID.randomUUID()
        val exception = ExpenseNotFoundException(expenseId)

        // When
        val response = exceptionHandler.handleNotFound(exception, request)

        // Then
        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(false, errorResponse.success)
        assertEquals(ExpenseErrorCodes.EXPENSE_NOT_FOUND, errorResponse.error.code)
        assertEquals(HttpStatus.NOT_FOUND.value(), errorResponse.error.statusCode)
        assertEquals("Expense not found: $expenseId", errorResponse.error.message)
        
        assertNotNull(errorResponse.meta)
        assertEquals("test-request-id-123", errorResponse.meta!!.requestId)
        assertEquals("/api/v1/expenses", errorResponse.meta!!.path)
    }

    @Test
    fun `should handle TagNotFoundException with 404 status`() {
        // Given
        val tagId = UUID.randomUUID()
        val exception = TagNotFoundException(tagId)

        // When
        val response = exceptionHandler.handleTagNotFound(exception, request)

        // Then
        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.TAG_NOT_FOUND, errorResponse.error.code)
        assertEquals("Tag not found: $tagId", errorResponse.error.message)
    }

    @Test
    fun `should handle AttachmentNotFoundException with 404 status`() {
        // Given
        val attachmentId = UUID.randomUUID()
        val exception = AttachmentNotFoundException(attachmentId)

        // When
        val response = exceptionHandler.handleAttachmentNotFound(exception, request)

        // Then
        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.ATTACHMENT_NOT_FOUND, errorResponse.error.code)
        assertEquals("Attachment not found: $attachmentId", errorResponse.error.message)
    }

    @Test
    fun `should handle InvalidExpenseDataException with 400 status`() {
        // Given
        val exception = InvalidExpenseDataException("Amount cannot be negative")

        // When
        val response = exceptionHandler.handleInvalidData(exception, request)

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.INVALID_EXPENSE_DATA, errorResponse.error.code)
        assertEquals("Invalid expense data: Amount cannot be negative", errorResponse.error.message)
    }

    @Test
    fun `should handle InsufficientPermissionException with 403 status`() {
        // Given
        val exception = InsufficientPermissionException("delete expense")

        // When
        val response = exceptionHandler.handleInsufficientPermission(exception, request)

        // Then
        assertEquals(HttpStatus.FORBIDDEN, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.INSUFFICIENT_PERMISSION, errorResponse.error.code)
        assertEquals("Insufficient permission for: delete expense", errorResponse.error.message)
    }

    @Test
    fun `should handle FileSizeLimitExceededException with 413 status`() {
        // Given
        val exception = FileSizeLimitExceededException(1000000, 2000000)

        // When
        val response = exceptionHandler.handleFileSizeLimit(exception, request)

        // Then
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.FILE_SIZE_LIMIT_EXCEEDED, errorResponse.error.code)
        assertEquals("File size 2000000 exceeds limit of 1000000 bytes", errorResponse.error.message)
    }

    @Test
    fun `should handle UnsupportedFileTypeException with 415 status`() {
        // Given
        val exception = UnsupportedFileTypeException("application/exe")

        // When
        val response = exceptionHandler.handleUnsupportedFileType(exception, request)

        // Then
        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.UNSUPPORTED_FILE_TYPE, errorResponse.error.code)
        assertEquals("Unsupported file type: application/exe", errorResponse.error.message)
    }

    @Test
    fun `should handle MethodArgumentNotValidException with validation details`() {
        // Given
        val fieldError1 = FieldError("expense", "amount", "rejected_value", false, null, null, "Amount is required")
        val fieldError2 = FieldError("expense", "description", "", false, null, null, "Description cannot be empty")
        
        whenever(bindingResult.fieldErrors).thenReturn(listOf(fieldError1, fieldError2))
        
        val exception = MethodArgumentNotValidException(mock<org.springframework.core.MethodParameter>(), bindingResult)

        // When
        val response = exceptionHandler.handleValidationErrors(exception, request)

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.VALIDATION_ERROR, errorResponse.error.code)
        assertEquals("Validation failed", errorResponse.error.message)
        
        // Check validation details
        assertNotNull(errorResponse.error.details)
        val validationErrors = errorResponse.error.details as List<*>
        assertEquals(2, validationErrors.size)
        
        val firstError = validationErrors[0] as ValidationErrorDetail
        assertEquals("amount", firstError.field)
        assertEquals("Amount is required", firstError.message)
        assertEquals("rejected_value", firstError.rejectedValue)
    }

    @Test
    fun `should handle generic Exception with 500 status`() {
        // Given
        val exception = RuntimeException("Unexpected error")

        // When
        val response = exceptionHandler.handleGenericError(exception, request)

        // Then
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
        
        val errorResponse = response.body as ErrorResponse
        assertEquals(ExpenseErrorCodes.INTERNAL_ERROR, errorResponse.error.code)
        assertEquals("An unexpected error occurred", errorResponse.error.message)
    }

    @Test
    fun `should generate request ID when MDC is empty`() {
        // Given
        MDC.clear() // Remove the request ID from MDC
        val exception = ExpenseNotFoundException(UUID.randomUUID())

        // When
        val response = exceptionHandler.handleNotFound(exception, request)

        // Then
        val errorResponse = response.body as ErrorResponse
        assertNotNull(errorResponse.meta)
        assertNotNull(errorResponse.meta!!.requestId)
        // Should be a UUID format
        assertEquals(36, errorResponse.meta!!.requestId.length)
    }
}