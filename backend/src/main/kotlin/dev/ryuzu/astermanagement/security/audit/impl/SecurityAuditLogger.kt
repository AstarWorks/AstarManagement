package dev.ryuzu.astermanagement.security.audit.impl

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.security.audit.*
import dev.ryuzu.astermanagement.security.audit.entity.AuditEvent
import dev.ryuzu.astermanagement.security.audit.repository.AuditEventRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.*

/**
 * Comprehensive security audit logger implementation
 * Handles all security-related event logging with async processing
 */
@Service
class SecurityAuditLogger(
    private val auditEventRepository: AuditEventRepository,
    private val objectMapper: ObjectMapper
) : AuditLogger {

    private val logger = LoggerFactory.getLogger(SecurityAuditLogger::class.java)

    @Async
    @Transactional
    override fun logAuthenticationAttempt(
        username: String,
        success: Boolean,
        ipAddress: String,
        userAgent: String?,
        additionalDetails: Map<String, Any>
    ) {
        try {
            val event = if (success) {
                // For successful auth, we'd typically have user ID from context
                // This is simplified - in real implementation, we'd get the actual user ID
                AuditEvent.authenticationSuccess(
                    userId = username, // Simplified - should be actual user ID
                    username = username,
                    ipAddress = ipAddress,
                    sessionId = UUID.randomUUID().toString(), // Should be actual session ID
                    userAgent = userAgent,
                    details = additionalDetails
                )
            } else {
                AuditEvent.authenticationFailure(
                    username = username,
                    ipAddress = ipAddress,
                    userAgent = userAgent,
                    reason = additionalDetails["reason"] as? String,
                    details = additionalDetails
                )
            }

            auditEventRepository.save(event)

            // Check for suspicious activity after failed attempts
            if (!success) {
                checkSuspiciousAuthenticationActivity(username, ipAddress, userAgent)
            }

            logger.debug("Logged authentication attempt for user: {} (success: {})", username, success)
        } catch (e: Exception) {
            logger.error("Failed to log authentication attempt for user: $username", e)
        }
    }

    @Async
    @Transactional
    override fun logPasswordChange(
        userId: String,
        ipAddress: String,
        userAgent: String?,
        additionalDetails: Map<String, Any>
    ) {
        try {
            val event = AuditEvent(
                eventType = SecurityEventType.PASSWORD_CHANGE,
                userId = userId,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = RiskLevel.MEDIUM,
                riskScore = 35,
                message = "User changed password",
                details = additionalDetails + mapOf(
                    "securityEvent" to "password_change",
                    "timestamp" to Instant.now().toString()
                ),
                outcome = "SUCCESS",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )

            auditEventRepository.save(event)
            logger.debug("Logged password change for user: {}", userId)
        } catch (e: Exception) {
            logger.error("Failed to log password change for user: $userId", e)
        }
    }

    @Async
    @Transactional
    override fun logAccountLockout(
        username: String,
        reason: String,
        ipAddress: String,
        userAgent: String?,
        additionalDetails: Map<String, Any>
    ) {
        try {
            val event = AuditEvent(
                eventType = SecurityEventType.ACCOUNT_LOCKOUT,
                username = username,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = RiskLevel.HIGH,
                riskScore = 75,
                message = "Account locked: $reason",
                details = additionalDetails + mapOf(
                    "lockoutReason" to reason,
                    "automated" to true,
                    "requiresManualUnlock" to true
                ),
                outcome = "LOCKED",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )

            auditEventRepository.save(event)
            logger.warn("Logged account lockout for user: {} (reason: {})", username, reason)
        } catch (e: Exception) {
            logger.error("Failed to log account lockout for user: $username", e)
        }
    }

    @Async
    @Transactional
    override fun logSuspiciousActivity(
        details: Map<String, Any>,
        ipAddress: String,
        userAgent: String?,
        riskScore: Int
    ) {
        try {
            val activityType = details["activityType"] as? String ?: "unknown"
            
            val event = AuditEvent.suspiciousActivity(
                ipAddress = ipAddress,
                userAgent = userAgent,
                activityType = activityType,
                riskScore = riskScore,
                details = details
            )

            auditEventRepository.save(event)
            
            // Log to security monitoring if high risk
            if (riskScore >= 70) {
                logger.warn("HIGH RISK suspicious activity detected: {} from IP: {}", activityType, ipAddress)
            } else {
                logger.info("Suspicious activity detected: {} from IP: {}", activityType, ipAddress)
            }
        } catch (e: Exception) {
            logger.error("Failed to log suspicious activity from IP: $ipAddress", e)
        }
    }

    @Async
    @Transactional
    override fun logPrivilegeEscalation(
        userId: String,
        fromRole: String,
        toRole: String,
        grantedBy: String,
        ipAddress: String,
        userAgent: String?
    ) {
        try {
            val event = AuditEvent(
                eventType = SecurityEventType.PRIVILEGE_ESCALATION,
                userId = userId,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = RiskLevel.HIGH,
                riskScore = 80,
                message = "Privilege escalation: $fromRole -> $toRole",
                details = mapOf(
                    "fromRole" to fromRole,
                    "toRole" to toRole,
                    "grantedBy" to grantedBy,
                    "escalationType" to "role_change"
                ),
                outcome = "GRANTED",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )

            auditEventRepository.save(event)
            logger.warn("Logged privilege escalation for user: {} ({} -> {})", userId, fromRole, toRole)
        } catch (e: Exception) {
            logger.error("Failed to log privilege escalation for user: $userId", e)
        }
    }

    @Async
    @Transactional
    override fun logDataAccess(
        userId: String,
        resourceType: String,
        resourceId: String,
        action: String,
        ipAddress: String,
        userAgent: String?,
        additionalDetails: Map<String, Any>
    ) {
        try {
            val username = additionalDetails["username"] as? String ?: userId
            
            val event = AuditEvent.dataAccess(
                userId = userId,
                username = username,
                resourceType = resourceType,
                resourceId = resourceId,
                action = action,
                ipAddress = ipAddress,
                userAgent = userAgent,
                details = additionalDetails
            )

            auditEventRepository.save(event)
            logger.debug("Logged data access: {} {} {} by user {}", action, resourceType, resourceId, userId)
        } catch (e: Exception) {
            logger.error("Failed to log data access for user: $userId", e)
        }
    }

    @Async
    @Transactional
    override fun logSessionEvent(
        userId: String?,
        sessionId: String,
        eventType: SessionEventType,
        ipAddress: String,
        userAgent: String?,
        additionalDetails: Map<String, Any>
    ) {
        try {
            val securityEventType = when (eventType) {
                SessionEventType.CREATED -> SecurityEventType.SESSION_CREATED
                SessionEventType.TERMINATED -> SecurityEventType.SESSION_TERMINATED
                SessionEventType.TIMEOUT -> SecurityEventType.SESSION_TIMEOUT
                else -> SecurityEventType.SESSION_CREATED
            }

            val event = AuditEvent(
                eventType = securityEventType,
                userId = userId,
                sessionId = sessionId,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = RiskLevel.LOW,
                riskScore = 15,
                message = "Session ${eventType.name.lowercase()}",
                details = additionalDetails + mapOf(
                    "sessionEventType" to eventType.name,
                    "sessionId" to sessionId
                ),
                outcome = eventType.name,
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )

            auditEventRepository.save(event)
            logger.debug("Logged session event: {} for session: {}", eventType, sessionId)
        } catch (e: Exception) {
            logger.error("Failed to log session event for session: $sessionId", e)
        }
    }

    @Async
    @Transactional
    override fun logRateLimitEvent(
        key: String,
        ipAddress: String,
        endpoint: String,
        limitExceeded: Boolean,
        currentAttempts: Int,
        maxAttempts: Int,
        userAgent: String?
    ) {
        try {
            val event = AuditEvent(
                eventType = SecurityEventType.RATE_LIMIT_EXCEEDED,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = if (limitExceeded) RiskLevel.MEDIUM else RiskLevel.LOW,
                riskScore = if (limitExceeded) 50 else 20,
                message = if (limitExceeded) "Rate limit exceeded" else "Rate limit warning",
                details = mapOf(
                    "key" to key,
                    "endpoint" to endpoint,
                    "limitExceeded" to limitExceeded,
                    "currentAttempts" to currentAttempts,
                    "maxAttempts" to maxAttempts,
                    "rateLimitType" to "request_rate"
                ),
                outcome = if (limitExceeded) "BLOCKED" else "WARNING",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )

            auditEventRepository.save(event)
            
            if (limitExceeded) {
                logger.warn("Rate limit exceeded for key: {} on endpoint: {}", key, endpoint)
            }
        } catch (e: Exception) {
            logger.error("Failed to log rate limit event for key: $key", e)
        }
    }

    @Async
    @Transactional
    override fun logConfigurationChange(
        userId: String,
        configKey: String,
        oldValue: String?,
        newValue: String?,
        ipAddress: String,
        userAgent: String?
    ) {
        try {
            val event = AuditEvent(
                eventType = SecurityEventType.CONFIGURATION_CHANGE,
                userId = userId,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = RiskLevel.HIGH,
                riskScore = 75,
                message = "Configuration changed: $configKey",
                details = mapOf(
                    "configKey" to configKey,
                    "oldValue" to (oldValue ?: "null"),
                    "newValue" to (newValue ?: "null"),
                    "changeType" to "configuration"
                ),
                outcome = "MODIFIED",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )

            auditEventRepository.save(event)
            logger.warn("Logged configuration change: {} by user: {}", configKey, userId)
        } catch (e: Exception) {
            logger.error("Failed to log configuration change for user: $userId", e)
        }
    }

    @Async
    @Transactional
    override fun logSecurityError(
        errorType: String,
        errorMessage: String,
        ipAddress: String,
        userAgent: String?,
        additionalDetails: Map<String, Any>
    ) {
        try {
            val event = AuditEvent(
                eventType = SecurityEventType.SECURITY_ERROR,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = RiskLevel.CRITICAL,
                riskScore = 90,
                message = "Security error: $errorType - $errorMessage",
                details = additionalDetails + mapOf(
                    "errorType" to errorType,
                    "errorMessage" to errorMessage,
                    "category" to "security_error"
                ),
                outcome = "ERROR",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )

            auditEventRepository.save(event)
            logger.error("Logged security error: {} from IP: {}", errorType, ipAddress)
        } catch (e: Exception) {
            logger.error("Failed to log security error from IP: $ipAddress", e)
        }
    }

    /**
     * Check for suspicious authentication patterns
     */
    private fun checkSuspiciousAuthenticationActivity(username: String, ipAddress: String, userAgent: String?) {
        try {
            val since = Instant.now().minus(Duration.ofMinutes(15))
            
            // Check recent failures from this user
            val userFailures = auditEventRepository.countFailedAuthenticationAttempts(username, since)
            
            // Check recent failures from this IP
            val ipFailures = auditEventRepository.countFailedAuthenticationAttemptsFromIP(ipAddress, since)
            
            // Determine risk score based on patterns
            var riskScore = 30 // Base risk for any failed attempt
            
            if (userFailures >= 3) riskScore += 20
            if (userFailures >= 5) riskScore += 30
            if (ipFailures >= 10) riskScore += 25
            if (ipFailures >= 20) riskScore += 35
            
            // Log suspicious activity if risk is elevated
            if (riskScore >= 50) {
                logSuspiciousActivity(
                    details = mapOf(
                        "activityType" to "multiple_failed_logins",
                        "username" to username,
                        "userFailures" to userFailures,
                        "ipFailures" to ipFailures,
                        "timeWindow" to "15_minutes"
                    ),
                    ipAddress = ipAddress,
                    userAgent = userAgent,
                    riskScore = riskScore
                )
            }
        } catch (e: Exception) {
            logger.error("Error checking suspicious authentication activity", e)
        }
    }
}