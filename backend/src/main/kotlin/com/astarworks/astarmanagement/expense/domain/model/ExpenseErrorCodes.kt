package com.astarworks.astarmanagement.expense.domain.model

/**
 * Registry of all error codes used in the expense management system
 */
object ExpenseErrorCodes {
    const val EXPENSE_NOT_FOUND = "EXPENSE_NOT_FOUND"
    const val INVALID_EXPENSE_DATA = "INVALID_EXPENSE_DATA"
    const val TAG_NOT_FOUND = "TAG_NOT_FOUND"
    const val ATTACHMENT_NOT_FOUND = "ATTACHMENT_NOT_FOUND"
    const val FILE_SIZE_LIMIT_EXCEEDED = "FILE_SIZE_LIMIT_EXCEEDED"
    const val UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
    const val INSUFFICIENT_PERMISSION = "INSUFFICIENT_PERMISSION"
    const val VALIDATION_ERROR = "VALIDATION_ERROR"
    const val INTERNAL_ERROR = "INTERNAL_ERROR"
}