package dev.ryuzu.astermanagement.domain.audit

/**
 * Audit event types corresponding to the database enum
 * Defines all possible audit events in the system
 */
enum class AuditEventType {
    // Matter-related events
    MATTER_CREATED,
    MATTER_UPDATED, 
    MATTER_STATUS_CHANGED,
    MATTER_DELETED,
    
    // Document-related events
    DOCUMENT_UPLOADED,
    DOCUMENT_ACCESSED,
    DOCUMENT_MODIFIED,
    DOCUMENT_DELETED,
    
    // Authentication events
    USER_LOGIN,
    USER_LOGOUT,
    AUTHENTICATION_FAILED,
    AUTHORIZATION_DENIED,
    
    // Memo-related events
    MEMO_CREATED,
    MEMO_UPDATED,
    MEMO_DELETED,
    
    // Expense-related events
    EXPENSE_CREATED,
    EXPENSE_UPDATED,
    EXPENSE_DELETED,
    
    // System events
    SECURITY_EVENT,
    SYSTEM_EVENT,
    DATA_EXPORT,
    BULK_OPERATION
}

/**
 * Document access types for document audit events
 */
enum class DocumentAccessType {
    VIEW,
    DOWNLOAD,
    PRINT,
    EXPORT
}

/**
 * Security event subtypes for detailed security auditing
 */
enum class SecurityEventType {
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    TOKEN_REFRESH,
    PERMISSION_DENIED,
    PASSWORD_CHANGED,
    ACCOUNT_LOCKED,
    SUSPICIOUS_ACTIVITY
}