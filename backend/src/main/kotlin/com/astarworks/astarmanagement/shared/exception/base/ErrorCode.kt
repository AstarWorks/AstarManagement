package com.astarworks.astarmanagement.shared.exception.base

/**
 * Centralized error code definitions for the application.
 * These codes are used across different modules to maintain consistency
 * in error reporting.
 * 
 * Error code format: MODULE_ERROR_TYPE
 * - MODULE: The module where the error originated (e.g., WORKSPACE, TABLE, RECORD)
 * - ERROR_TYPE: The specific type of error (e.g., NOT_FOUND, VALIDATION_ERROR)
 */
object ErrorCode {
    
    // === Common Error Codes ===
    const val RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    const val VALIDATION_ERROR = "VALIDATION_ERROR"
    const val CONFLICT = "CONFLICT"
    const val UNAUTHORIZED = "UNAUTHORIZED"
    const val FORBIDDEN = "FORBIDDEN"
    const val INTERNAL_ERROR = "INTERNAL_ERROR"
    const val BAD_REQUEST = "BAD_REQUEST"
    const val SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    
    // === Workspace Error Codes ===
    const val WORKSPACE_NOT_FOUND = "WORKSPACE_NOT_FOUND"
    const val WORKSPACE_LIMIT_EXCEEDED = "WORKSPACE_LIMIT_EXCEEDED"
    const val WORKSPACE_NAME_DUPLICATE = "WORKSPACE_NAME_DUPLICATE"
    const val WORKSPACE_ACCESS_DENIED = "WORKSPACE_ACCESS_DENIED"
    const val WORKSPACE_INVALID_NAME = "WORKSPACE_INVALID_NAME"
    
    // === Table Error Codes ===
    const val TABLE_NOT_FOUND = "TABLE_NOT_FOUND"
    const val TABLE_LIMIT_EXCEEDED = "TABLE_LIMIT_EXCEEDED"
    const val TABLE_NAME_DUPLICATE = "TABLE_NAME_DUPLICATE"
    const val TABLE_INVALID_SCHEMA = "TABLE_INVALID_SCHEMA"
    const val TABLE_PROPERTY_LIMIT_EXCEEDED = "TABLE_PROPERTY_LIMIT_EXCEEDED"
    const val TABLE_INVALID_PROPERTY = "TABLE_INVALID_PROPERTY"
    const val TABLE_TEMPLATE_NOT_FOUND = "TABLE_TEMPLATE_NOT_FOUND"
    
    // === Record Error Codes ===
    const val RECORD_NOT_FOUND = "RECORD_NOT_FOUND"
    const val RECORD_VALIDATION_FAILED = "RECORD_VALIDATION_FAILED"
    const val RECORD_BATCH_SIZE_EXCEEDED = "RECORD_BATCH_SIZE_EXCEEDED"
    const val RECORD_INVALID_DATA = "RECORD_INVALID_DATA"
    const val RECORD_POSITION_CONFLICT = "RECORD_POSITION_CONFLICT"
    const val RECORD_TABLE_MISMATCH = "RECORD_TABLE_MISMATCH"
    
    // === Property Type Error Codes ===
    const val PROPERTY_TYPE_NOT_FOUND = "PROPERTY_TYPE_NOT_FOUND"
    const val PROPERTY_TYPE_INVALID = "PROPERTY_TYPE_INVALID"
    const val PROPERTY_TYPE_DUPLICATE = "PROPERTY_TYPE_DUPLICATE"
    const val PROPERTY_TYPE_IN_USE = "PROPERTY_TYPE_IN_USE"
    const val PROPERTY_TYPE_SYSTEM_MODIFICATION = "PROPERTY_TYPE_SYSTEM_MODIFICATION"
    
    // === Tenant Error Codes ===
    const val TENANT_NOT_FOUND = "TENANT_NOT_FOUND"
    const val TENANT_INACTIVE = "TENANT_INACTIVE"
    const val TENANT_LIMIT_EXCEEDED = "TENANT_LIMIT_EXCEEDED"
    const val TENANT_CONTEXT_MISSING = "TENANT_CONTEXT_MISSING"
    
    // === User Error Codes ===
    const val USER_NOT_FOUND = "USER_NOT_FOUND"
    const val USER_INACTIVE = "USER_INACTIVE"
    const val USER_EMAIL_DUPLICATE = "USER_EMAIL_DUPLICATE"
    const val USER_INVALID_CREDENTIALS = "USER_INVALID_CREDENTIALS"
    
    // === Permission Error Codes ===
    const val PERMISSION_DENIED = "PERMISSION_DENIED"
    const val PERMISSION_INVALID_FORMAT = "PERMISSION_INVALID_FORMAT"
    const val PERMISSION_ROLE_NOT_FOUND = "PERMISSION_ROLE_NOT_FOUND"
    
    /**
     * Generates a module-specific error code.
     * 
     * @param module The module name (e.g., "WORKSPACE", "TABLE")
     * @param errorType The error type (e.g., "NOT_FOUND", "VALIDATION_ERROR")
     * @return The formatted error code
     */
    fun generate(module: String, errorType: String): String {
        return "${module.uppercase()}_${errorType.uppercase()}"
    }
}