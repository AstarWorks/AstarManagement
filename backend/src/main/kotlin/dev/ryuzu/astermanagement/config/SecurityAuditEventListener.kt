package dev.ryuzu.astermanagement.config

import dev.ryuzu.astermanagement.service.AuditService
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.security.authentication.event.AbstractAuthenticationFailureEvent
import org.springframework.security.authentication.event.AuthenticationSuccessEvent
import org.springframework.security.authentication.event.InteractiveAuthenticationSuccessEvent
import org.springframework.security.authorization.event.AuthorizationDeniedEvent
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.time.Instant
import java.util.*

/**
 * Security Audit Event Listener
 * 
 * Listens to Spring Security authentication and authorization events
 * and logs them through the AuditService for comprehensive security auditing.
 */
@Component
class SecurityAuditEventListener(
    private val auditService: AuditService
) {
    
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Handles successful authentication events
     */
    @EventListener
    fun handleAuthenticationSuccess(event: AuthenticationSuccessEvent) {
        val authentication = event.authentication
        val username = authentication.name
        val authorities = authentication.authorities.joinToString(", ") { it.authority }
        
        val requestContext = getRequestContext()
        
        logger.info(
            "SECURITY_AUDIT: Authentication SUCCESS - User: {} | Authorities: {} | IP: {} | UserAgent: {} | Timestamp: {}",
            username, authorities, requestContext.ipAddress, requestContext.userAgent, Instant.now()
        )
        
        // Record in audit system
        try {
            auditService.recordEvent(
                entityType = "Authentication",
                entityId = getUserIdFromAuthentication(authentication),
                action = "LOGIN_SUCCESS",
                description = "User successfully authenticated with authorities: $authorities"
            )
        } catch (e: Exception) {
            logger.warn("Failed to record authentication success audit event for user {}: {}", username, e.message)
        }
    }

    /**
     * Handles interactive authentication success (form login, etc.)
     */
    @EventListener
    fun handleInteractiveAuthenticationSuccess(event: InteractiveAuthenticationSuccessEvent) {
        val authentication = event.authentication
        val username = authentication.name
        
        val requestContext = getRequestContext()
        
        logger.info(
            "SECURITY_AUDIT: Interactive Authentication SUCCESS - User: {} | IP: {} | Session: {} | Timestamp: {}",
            username, requestContext.ipAddress, requestContext.sessionId, Instant.now()
        )
        
        try {
            auditService.recordEvent(
                entityType = "Authentication",
                entityId = getUserIdFromAuthentication(authentication),
                action = "INTERACTIVE_LOGIN_SUCCESS",
                description = "User successfully completed interactive authentication"
            )
        } catch (e: Exception) {
            logger.warn("Failed to record interactive authentication success audit event for user {}: {}", username, e.message)
        }
    }

    /**
     * Handles authentication failure events
     */
    @EventListener
    fun handleAuthenticationFailure(event: AbstractAuthenticationFailureEvent) {
        val authentication = event.authentication
        val username = authentication?.name ?: "unknown"
        val failureReason = event.exception.message ?: "Unknown authentication failure"
        
        val requestContext = getRequestContext()
        
        logger.warn(
            "SECURITY_AUDIT: Authentication FAILURE - User: {} | Reason: {} | IP: {} | UserAgent: {} | Timestamp: {}",
            username, failureReason, requestContext.ipAddress, requestContext.userAgent, Instant.now()
        )
        
        try {
            // Use a generic UUID for failed authentication attempts
            val genericId = UUID.nameUUIDFromBytes("AUTH_FAILURE_$username".toByteArray())
            auditService.recordEvent(
                entityType = "Authentication",
                entityId = genericId,
                action = "LOGIN_FAILURE",
                description = "Authentication failed for user '$username': $failureReason"
            )
        } catch (e: Exception) {
            logger.warn("Failed to record authentication failure audit event for user {}: {}", username, e.message)
        }
    }

    /**
     * Handles authorization denied events (Spring Security 6.x)
     */
    @EventListener
    fun handleAuthorizationDenied(event: AuthorizationDeniedEvent<*>) {
        val authentication = event.authentication.get()
        val username = authentication?.name ?: "anonymous"
        val authorities = authentication?.authorities?.joinToString(", ") { it.authority } ?: "none"
        
        val requestContext = getRequestContext()
        
        logger.warn(
            "SECURITY_AUDIT: Authorization DENIED - User: {} | Authorities: {} | IP: {} | Path: {} | Timestamp: {}",
            username, authorities, requestContext.ipAddress, requestContext.path, Instant.now()
        )
        
        try {
            val userId = if (authentication != null) {
                getUserIdFromAuthentication(authentication)
            } else {
                UUID.nameUUIDFromBytes("ANONYMOUS_ACCESS".toByteArray())
            }
            
            auditService.recordEvent(
                entityType = "Authorization",
                entityId = userId,
                action = "ACCESS_DENIED",
                description = "Access denied for user '$username' with authorities '$authorities' to path '${requestContext.path}'"
            )
        } catch (e: Exception) {
            logger.warn("Failed to record authorization denied audit event for user {}: {}", username, e.message)
        }
    }

    /**
     * Records JWT token validation events
     */
    fun recordJwtValidation(userId: UUID, username: String, success: Boolean, reason: String? = null) {
        val action = if (success) "JWT_VALIDATION_SUCCESS" else "JWT_VALIDATION_FAILURE"
        val description = if (success) {
            "JWT token successfully validated for user '$username'"
        } else {
            "JWT token validation failed for user '$username': ${reason ?: "Unknown reason"}"
        }
        
        val requestContext = getRequestContext()
        val logLevel = if (success) "INFO" else "WARN"
        
        logger.atLevel(org.slf4j.event.Level.valueOf(logLevel)).log(
            "SECURITY_AUDIT: JWT Validation {} - User: {} | IP: {} | Timestamp: {}",
            if (success) "SUCCESS" else "FAILURE", username, requestContext.ipAddress, Instant.now()
        )
        
        try {
            auditService.recordEvent(
                entityType = "JwtValidation",
                entityId = userId,
                action = action,
                description = description
            )
        } catch (e: Exception) {
            logger.warn("Failed to record JWT validation audit event for user {}: {}", username, e.message)
        }
    }

    /**
     * Records token refresh events
     */
    fun recordTokenRefresh(userId: UUID, username: String, success: Boolean, reason: String? = null) {
        val action = if (success) "TOKEN_REFRESH_SUCCESS" else "TOKEN_REFRESH_FAILURE"
        val description = if (success) {
            "Access token successfully refreshed for user '$username'"
        } else {
            "Token refresh failed for user '$username': ${reason ?: "Unknown reason"}"
        }
        
        val requestContext = getRequestContext()
        
        logger.info(
            "SECURITY_AUDIT: Token Refresh {} - User: {} | IP: {} | Timestamp: {}",
            if (success) "SUCCESS" else "FAILURE", username, requestContext.ipAddress, Instant.now()
        )
        
        try {
            auditService.recordEvent(
                entityType = "TokenRefresh",
                entityId = userId,
                action = action,
                description = description
            )
        } catch (e: Exception) {
            logger.warn("Failed to record token refresh audit event for user {}: {}", username, e.message)
        }
    }

    /**
     * Extracts user ID from authentication object
     */
    private fun getUserIdFromAuthentication(authentication: Authentication): UUID {
        return try {
            UUID.fromString(authentication.name)
        } catch (e: IllegalArgumentException) {
            // Fallback: create UUID from username
            UUID.nameUUIDFromBytes(authentication.name.toByteArray())
        }
    }

    /**
     * Gets request context information for audit logging
     */
    private fun getRequestContext(): RequestContext {
        val requestAttributes = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes
        val request = requestAttributes?.request
        
        return RequestContext(
            ipAddress = getClientIpAddress(request),
            userAgent = request?.getHeader("User-Agent") ?: "Unknown",
            sessionId = request?.session?.id ?: "No-Session",
            path = request?.requestURI ?: "Unknown"
        )
    }

    /**
     * Extracts client IP address from request
     */
    private fun getClientIpAddress(request: jakarta.servlet.http.HttpServletRequest?): String {
        if (request == null) return "Unknown"
        
        // Check common proxy headers
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            return xForwardedFor.split(",")[0].trim()
        }
        
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp
        }
        
        return request.remoteAddr ?: "Unknown"
    }

    /**
     * Data class for request context information
     */
    private data class RequestContext(
        val ipAddress: String,
        val userAgent: String,
        val sessionId: String,
        val path: String
    )
}