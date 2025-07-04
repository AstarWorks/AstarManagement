package dev.ryuzu.astermanagement.modules.audit.api

/**
 * Public API enum for audit event types
 * This defines all possible audit event types in the system
 */
enum class AuditEventType {
    // Matter events
    MATTER_CREATED,
    MATTER_UPDATED,
    MATTER_STATUS_CHANGED,
    MATTER_DELETED,
    
    // Document events
    DOCUMENT_UPLOADED,
    DOCUMENT_ACCESSED,
    DOCUMENT_MODIFIED,
    DOCUMENT_DELETED,
    
    // Authentication events
    USER_LOGIN,
    USER_LOGOUT,
    AUTHENTICATION_FAILED,
    AUTHORIZATION_DENIED,
    
    // Security events
    SECURITY_EVENT,
    
    // System events
    SYSTEM_EVENT,
    
    // Operational events
    BULK_OPERATION,
    DATA_EXPORT,
    
    // Memo events
    MEMO_CREATED,
    MEMO_UPDATED,
    MEMO_DELETED,
    
    // Expense events
    EXPENSE_CREATED,
    EXPENSE_UPDATED,
    EXPENSE_DELETED
}

/**
 * Security event subtypes
 */
enum class SecurityEventType {
    UNAUTHORIZED_ACCESS_ATTEMPT,
    PERMISSION_ESCALATION_ATTEMPT,
    SUSPICIOUS_ACTIVITY,
    DATA_BREACH_ATTEMPT,
    SYSTEM_COMPROMISE_ATTEMPT,
    SESSION_HIJACKING_ATTEMPT,
    PASSWORD_POLICY_VIOLATION,
    ACCOUNT_LOCKOUT,
    TWO_FACTOR_AUTH_FAILURE,
    API_RATE_LIMIT_EXCEEDED
}

/**
 * Document access types
 */
enum class DocumentAccessType {
    VIEW,
    DOWNLOAD,
    PRINT,
    SHARE,
    EDIT,
    DELETE
}