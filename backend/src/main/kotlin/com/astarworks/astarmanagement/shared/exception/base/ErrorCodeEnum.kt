package com.astarworks.astarmanagement.shared.exception.base

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Centralized error code definitions for the application.
 * These codes are used across different modules to maintain consistency
 * in error reporting.
 * 
 * Error code format: MODULE_ERROR_TYPE
 * - MODULE: The module where the error originated (e.g., WORKSPACE, TABLE, RECORD)
 * - ERROR_TYPE: The specific type of error (e.g., NOT_FOUND, VALIDATION_ERROR)
 */
@Serializable
enum class ErrorCodeEnum(
    val code: String,
    val category: ErrorCategory,
    val httpStatus: Int
) {
    // === Common Error Codes ===
    @SerialName("RESOURCE_NOT_FOUND")
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", ErrorCategory.COMMON, 404),
    
    @SerialName("VALIDATION_ERROR")
    VALIDATION_ERROR("VALIDATION_ERROR", ErrorCategory.COMMON, 400),
    
    @SerialName("CONFLICT")
    CONFLICT("CONFLICT", ErrorCategory.COMMON, 409),
    
    @SerialName("UNAUTHORIZED")
    UNAUTHORIZED("UNAUTHORIZED", ErrorCategory.COMMON, 401),
    
    @SerialName("FORBIDDEN")
    FORBIDDEN("FORBIDDEN", ErrorCategory.COMMON, 403),
    
    @SerialName("INTERNAL_ERROR")
    INTERNAL_ERROR("INTERNAL_ERROR", ErrorCategory.COMMON, 500),
    
    @SerialName("BAD_REQUEST")
    BAD_REQUEST("BAD_REQUEST", ErrorCategory.COMMON, 400),
    
    @SerialName("SERVICE_UNAVAILABLE")
    SERVICE_UNAVAILABLE("SERVICE_UNAVAILABLE", ErrorCategory.COMMON, 503),
    
    // === Workspace Error Codes ===
    @SerialName("WORKSPACE_NOT_FOUND")
    WORKSPACE_NOT_FOUND("WORKSPACE_NOT_FOUND", ErrorCategory.WORKSPACE, 404),
    
    @SerialName("WORKSPACE_LIMIT_EXCEEDED")
    WORKSPACE_LIMIT_EXCEEDED("WORKSPACE_LIMIT_EXCEEDED", ErrorCategory.WORKSPACE, 409),
    
    @SerialName("WORKSPACE_NAME_DUPLICATE")
    WORKSPACE_NAME_DUPLICATE("WORKSPACE_NAME_DUPLICATE", ErrorCategory.WORKSPACE, 409),
    
    @SerialName("WORKSPACE_ACCESS_DENIED")
    WORKSPACE_ACCESS_DENIED("WORKSPACE_ACCESS_DENIED", ErrorCategory.WORKSPACE, 403),
    
    @SerialName("WORKSPACE_INVALID_NAME")
    WORKSPACE_INVALID_NAME("WORKSPACE_INVALID_NAME", ErrorCategory.WORKSPACE, 400),
    
    // === Table Error Codes ===
    @SerialName("TABLE_NOT_FOUND")
    TABLE_NOT_FOUND("TABLE_NOT_FOUND", ErrorCategory.TABLE, 404),
    
    @SerialName("TABLE_LIMIT_EXCEEDED")
    TABLE_LIMIT_EXCEEDED("TABLE_LIMIT_EXCEEDED", ErrorCategory.TABLE, 409),
    
    @SerialName("TABLE_NAME_DUPLICATE")
    TABLE_NAME_DUPLICATE("TABLE_NAME_DUPLICATE", ErrorCategory.TABLE, 409),
    
    @SerialName("TABLE_INVALID_SCHEMA")
    TABLE_INVALID_SCHEMA("TABLE_INVALID_SCHEMA", ErrorCategory.TABLE, 400),
    
    @SerialName("TABLE_PROPERTY_LIMIT_EXCEEDED")
    TABLE_PROPERTY_LIMIT_EXCEEDED("TABLE_PROPERTY_LIMIT_EXCEEDED", ErrorCategory.TABLE, 409),
    
    @SerialName("TABLE_INVALID_PROPERTY")
    TABLE_INVALID_PROPERTY("TABLE_INVALID_PROPERTY", ErrorCategory.TABLE, 400),
    
    @SerialName("TABLE_TEMPLATE_NOT_FOUND")
    TABLE_TEMPLATE_NOT_FOUND("TABLE_TEMPLATE_NOT_FOUND", ErrorCategory.TABLE, 404),
    
    // === Record Error Codes ===
    @SerialName("RECORD_NOT_FOUND")
    RECORD_NOT_FOUND("RECORD_NOT_FOUND", ErrorCategory.RECORD, 404),
    
    @SerialName("RECORD_VALIDATION_FAILED")
    RECORD_VALIDATION_FAILED("RECORD_VALIDATION_FAILED", ErrorCategory.RECORD, 400),
    
    @SerialName("RECORD_BATCH_SIZE_EXCEEDED")
    RECORD_BATCH_SIZE_EXCEEDED("RECORD_BATCH_SIZE_EXCEEDED", ErrorCategory.RECORD, 400),
    
    @SerialName("RECORD_INVALID_DATA")
    RECORD_INVALID_DATA("RECORD_INVALID_DATA", ErrorCategory.RECORD, 400),
    
    @SerialName("RECORD_POSITION_CONFLICT")
    RECORD_POSITION_CONFLICT("RECORD_POSITION_CONFLICT", ErrorCategory.RECORD, 409),
    
    @SerialName("RECORD_TABLE_MISMATCH")
    RECORD_TABLE_MISMATCH("RECORD_TABLE_MISMATCH", ErrorCategory.RECORD, 400),
    
    // === Property Type Error Codes ===
    @SerialName("PROPERTY_TYPE_NOT_FOUND")
    PROPERTY_TYPE_NOT_FOUND("PROPERTY_TYPE_NOT_FOUND", ErrorCategory.PROPERTY, 404),
    
    @SerialName("PROPERTY_TYPE_INVALID")
    PROPERTY_TYPE_INVALID("PROPERTY_TYPE_INVALID", ErrorCategory.PROPERTY, 400),
    
    @SerialName("PROPERTY_TYPE_DUPLICATE")
    PROPERTY_TYPE_DUPLICATE("PROPERTY_TYPE_DUPLICATE", ErrorCategory.PROPERTY, 409),
    
    @SerialName("PROPERTY_TYPE_IN_USE")
    PROPERTY_TYPE_IN_USE("PROPERTY_TYPE_IN_USE", ErrorCategory.PROPERTY, 409),
    
    @SerialName("PROPERTY_TYPE_SYSTEM_MODIFICATION")
    PROPERTY_TYPE_SYSTEM_MODIFICATION("PROPERTY_TYPE_SYSTEM_MODIFICATION", ErrorCategory.PROPERTY, 403),
    
    // === Tenant Error Codes ===
    @SerialName("TENANT_NOT_FOUND")
    TENANT_NOT_FOUND("TENANT_NOT_FOUND", ErrorCategory.TENANT, 404),
    
    @SerialName("TENANT_INACTIVE")
    TENANT_INACTIVE("TENANT_INACTIVE", ErrorCategory.TENANT, 403),
    
    @SerialName("TENANT_LIMIT_EXCEEDED")
    TENANT_LIMIT_EXCEEDED("TENANT_LIMIT_EXCEEDED", ErrorCategory.TENANT, 409),
    
    @SerialName("TENANT_CONTEXT_MISSING")
    TENANT_CONTEXT_MISSING("TENANT_CONTEXT_MISSING", ErrorCategory.TENANT, 400),
    
    // === User Error Codes ===
    @SerialName("USER_NOT_FOUND")
    USER_NOT_FOUND("USER_NOT_FOUND", ErrorCategory.USER, 404),
    
    @SerialName("USER_INACTIVE")
    USER_INACTIVE("USER_INACTIVE", ErrorCategory.USER, 403),
    
    @SerialName("USER_EMAIL_DUPLICATE")
    USER_EMAIL_DUPLICATE("USER_EMAIL_DUPLICATE", ErrorCategory.USER, 409),
    
    @SerialName("USER_INVALID_CREDENTIALS")
    USER_INVALID_CREDENTIALS("USER_INVALID_CREDENTIALS", ErrorCategory.USER, 401),
    
    // === Permission Error Codes ===
    @SerialName("PERMISSION_DENIED")
    PERMISSION_DENIED("PERMISSION_DENIED", ErrorCategory.PERMISSION, 403),
    
    @SerialName("PERMISSION_INVALID_FORMAT")
    PERMISSION_INVALID_FORMAT("PERMISSION_INVALID_FORMAT", ErrorCategory.PERMISSION, 400),
    
    @SerialName("PERMISSION_ROLE_NOT_FOUND")
    PERMISSION_ROLE_NOT_FOUND("PERMISSION_ROLE_NOT_FOUND", ErrorCategory.PERMISSION, 404);
    
    /**
     * Checks if this error code represents a client error (4xx status codes).
     */
    fun isClientError(): Boolean = httpStatus in 400..499
    
    /**
     * Checks if this error code represents a server error (5xx status codes).
     */
    fun isServerError(): Boolean = httpStatus in 500..599
    
    /**
     * Checks if this error code belongs to a specific category.
     */
    fun isInCategory(category: ErrorCategory): Boolean = this.category == category
    
    companion object {
        /**
         * Finds an error code by its string value.
         * @param code The error code string
         * @return The corresponding ErrorCodeEnum, or null if not found
         */
        fun fromCode(code: String): ErrorCodeEnum? {
            return entries.find { it.code == code }
        }
        
        /**
         * Finds an error code by its string value (required).
         * @param code The error code string
         * @return The corresponding ErrorCodeEnum
         * @throws IllegalArgumentException if the code is not found
         */
        fun fromCodeRequired(code: String): ErrorCodeEnum {
            return fromCode(code) 
                ?: throw IllegalArgumentException("Unknown error code: $code")
        }
        
        /**
         * Gets all error codes in a specific category.
         * @param category The error category
         * @return List of error codes in the category
         */
        fun getByCategory(category: ErrorCategory): List<ErrorCodeEnum> {
            return entries.filter { it.category == category }
        }
        
        /**
         * Generates a module-specific error code string.
         * This is for backward compatibility with the old ErrorCode object.
         * 
         * @param module The module name (e.g., "WORKSPACE", "TABLE")
         * @param errorType The error type (e.g., "NOT_FOUND", "VALIDATION_ERROR")
         * @return The formatted error code string
         */
        fun generate(module: String, errorType: String): String {
            return "${module.uppercase()}_${errorType.uppercase()}"
        }
    }
}

/**
 * Error code categories for grouping related errors.
 */
enum class ErrorCategory {
    COMMON,      // Common errors used across modules
    WORKSPACE,   // Workspace-related errors
    TABLE,       // Table-related errors
    RECORD,      // Record-related errors
    PROPERTY,    // Property type-related errors
    TENANT,      // Tenant-related errors
    USER,        // User-related errors
    PERMISSION   // Permission-related errors
}