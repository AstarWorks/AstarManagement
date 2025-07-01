package dev.ryuzu.astermanagement.security.audit

import java.time.Instant

/**
 * Interface for comprehensive security audit logging
 */
interface AuditLogger {
    
    /**
     * Log authentication attempt (success or failure)
     */
    fun logAuthenticationAttempt(
        username: String,
        success: Boolean,
        ipAddress: String,
        userAgent: String? = null,
        additionalDetails: Map<String, Any> = emptyMap()
    )
    
    /**
     * Log password change event
     */
    fun logPasswordChange(
        userId: String,
        ipAddress: String,
        userAgent: String? = null,
        additionalDetails: Map<String, Any> = emptyMap()
    )
    
    /**
     * Log account lockout event
     */
    fun logAccountLockout(
        username: String,
        reason: String,
        ipAddress: String,
        userAgent: String? = null,
        additionalDetails: Map<String, Any> = emptyMap()
    )
    
    /**
     * Log suspicious activity
     */
    fun logSuspiciousActivity(
        details: Map<String, Any>,
        ipAddress: String,
        userAgent: String? = null,
        riskScore: Int = 50
    )
    
    /**
     * Log privilege escalation events
     */
    fun logPrivilegeEscalation(
        userId: String,
        fromRole: String,
        toRole: String,
        grantedBy: String,
        ipAddress: String,
        userAgent: String? = null
    )
    
    /**
     * Log data access events
     */
    fun logDataAccess(
        userId: String,
        resourceType: String,
        resourceId: String,
        action: String,
        ipAddress: String,
        userAgent: String? = null,
        additionalDetails: Map<String, Any> = emptyMap()
    )
    
    /**
     * Log session events (creation, termination, timeout)
     */
    fun logSessionEvent(
        userId: String?,
        sessionId: String,
        eventType: SessionEventType,
        ipAddress: String,
        userAgent: String? = null,
        additionalDetails: Map<String, Any> = emptyMap()
    )
    
    /**
     * Log rate limiting events
     */
    fun logRateLimitEvent(
        key: String,
        ipAddress: String,
        endpoint: String,
        limitExceeded: Boolean,
        currentAttempts: Int,
        maxAttempts: Int,
        userAgent: String? = null
    )
    
    /**
     * Log configuration changes
     */
    fun logConfigurationChange(
        userId: String,
        configKey: String,
        oldValue: String?,
        newValue: String?,
        ipAddress: String,
        userAgent: String? = null
    )
    
    /**
     * Log error events for security monitoring
     */
    fun logSecurityError(
        errorType: String,
        errorMessage: String,
        ipAddress: String,
        userAgent: String? = null,
        additionalDetails: Map<String, Any> = emptyMap()
    )
}

/**
 * Types of session events for audit logging
 */
enum class SessionEventType {
    CREATED,
    AUTHENTICATED,
    TERMINATED,
    TIMEOUT,
    REFRESH,
    CONCURRENT_LIMIT_EXCEEDED,
    SUSPICIOUS_ACTIVITY
}

/**
 * Security event types for categorization
 */
enum class SecurityEventType {
    AUTHENTICATION_SUCCESS,
    AUTHENTICATION_FAILURE,
    AUTHORIZATION_FAILURE,
    PASSWORD_CHANGE,
    ACCOUNT_LOCKOUT,
    ACCOUNT_UNLOCK,
    PRIVILEGE_ESCALATION,
    DATA_ACCESS,
    DATA_EXPORT,
    SESSION_CREATED,
    SESSION_TERMINATED,
    SESSION_TIMEOUT,
    RATE_LIMIT_EXCEEDED,
    SUSPICIOUS_ACTIVITY,
    CONFIGURATION_CHANGE,
    SECURITY_ERROR,
    TWO_FACTOR_ENABLED,
    TWO_FACTOR_DISABLED,
    TWO_FACTOR_VERIFICATION
}

/**
 * Risk levels for security events
 */
enum class RiskLevel {
    LOW,      // 0-30
    MEDIUM,   // 31-70
    HIGH,     // 71-90
    CRITICAL  // 91-100
}

/**
 * Extension function to convert risk score to risk level
 */
fun Int.toRiskLevel(): RiskLevel = when {
    this <= 30 -> RiskLevel.LOW
    this <= 70 -> RiskLevel.MEDIUM
    this <= 90 -> RiskLevel.HIGH
    else -> RiskLevel.CRITICAL
}