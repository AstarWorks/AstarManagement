package com.astarworks.astarmanagement.modules.financial.expense.domain.model

import java.util.*

/**
 * Base exception for all expense-related operations
 */
sealed class ExpenseException(
    message: String,
    val code: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Exception thrown when an expense is not found
 */
class ExpenseNotFoundException(id: UUID) : ExpenseException(
    message = "Expense not found: $id",
    code = "EXPENSE_NOT_FOUND"
)

/**
 * Exception thrown when expense data is invalid
 */
class InvalidExpenseDataException(reason: String) : ExpenseException(
    message = "Invalid expense data: $reason",
    code = "INVALID_EXPENSE_DATA"
)

/**
 * Exception thrown when user has insufficient permissions
 */
class InsufficientPermissionException(action: String) : ExpenseException(
    message = "Insufficient permission for: $action",
    code = "INSUFFICIENT_PERMISSION"
)

/**
 * Exception thrown when a tag is not found
 */
class TagNotFoundException(id: UUID) : ExpenseException(
    message = "Tag not found: $id",
    code = "TAG_NOT_FOUND"
)

/**
 * Exception thrown when an attachment is not found
 */
class AttachmentNotFoundException(id: UUID) : ExpenseException(
    message = "Attachment not found: $id",
    code = "ATTACHMENT_NOT_FOUND"
)

/**
 * Exception thrown when file size exceeds the limit
 */
class FileSizeLimitExceededException(
    maxSize: Long,
    actualSize: Long
) : ExpenseException(
    message = "File size $actualSize exceeds limit of $maxSize bytes",
    code = "FILE_SIZE_LIMIT_EXCEEDED"
)

/**
 * Exception thrown when file type is not supported
 */
class UnsupportedFileTypeException(mimeType: String) : ExpenseException(
    message = "Unsupported file type: $mimeType",
    code = "UNSUPPORTED_FILE_TYPE"
)