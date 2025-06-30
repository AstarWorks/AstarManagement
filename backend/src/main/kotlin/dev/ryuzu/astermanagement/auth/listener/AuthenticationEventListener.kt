package dev.ryuzu.astermanagement.auth.listener

import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.security.authentication.event.*
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import java.time.Instant

/**
 * Event listener for authentication events
 * 
 * Provides comprehensive audit logging for all authentication attempts,
 * both successful and failed, to support security monitoring and compliance.
 */
@Component
class AuthenticationEventListener {

    private val logger = LoggerFactory.getLogger(AuthenticationEventListener::class.java)
    
    /**
     * Handles successful authentication events
     */
    @EventListener
    fun handleAuthenticationSuccess(event: AuthenticationSuccessEvent) {
        val authentication = event.authentication
        val userDetails = authentication.principal
        
        when (userDetails) {
            is UserPrincipal -> {
                logger.info(
                    "Authentication successful: userId={}, email={}, role={}, authorities={}, timestamp={}", 
                    userDetails.id, 
                    userDetails.email, 
                    userDetails.role,
                    userDetails.authorities.map { it.authority },
                    Instant.now()
                )
            }
            else -> {
                logger.info(
                    "Authentication successful: principal={}, authorities={}, timestamp={}", 
                    authentication.name,
                    authentication.authorities.map { it.authority },
                    Instant.now()
                )
            }
        }
    }
    
    /**
     * Handles authentication failure events
     */
    @EventListener
    fun handleAuthenticationFailure(event: AbstractAuthenticationFailureEvent) {
        val authentication = event.authentication
        val exception = event.exception
        
        logger.warn(
            "Authentication failed: principal={}, reason={}, exception={}, timestamp={}", 
            authentication.name,
            exception.message,
            exception.javaClass.simpleName,
            Instant.now()
        )
        
        // Log specific failure types for security monitoring
        when (event) {
            is AuthenticationFailureBadCredentialsEvent -> {
                logger.warn("Bad credentials attempt for user: {}", authentication.name)
            }
            is AuthenticationFailureDisabledEvent -> {
                logger.warn("Attempt to authenticate disabled account: {}", authentication.name)
            }
            is AuthenticationFailureLockedEvent -> {
                logger.warn("Attempt to authenticate locked account: {}", authentication.name)
            }
            is AuthenticationFailureExpiredEvent -> {
                logger.warn("Attempt to authenticate expired account: {}", authentication.name)
            }
            is AuthenticationFailureCredentialsExpiredEvent -> {
                logger.warn("Authentication with expired credentials: {}", authentication.name)
            }
        }
    }
    
    /**
     * Handles interactive authentication success events
     * Typically triggered by form-based authentication
     */
    @EventListener
    fun handleInteractiveAuthenticationSuccess(event: InteractiveAuthenticationSuccessEvent) {
        val authentication = event.authentication
        
        logger.info(
            "Interactive authentication successful: principal={}, source={}, timestamp={}", 
            authentication.name,
            event.generatedBy?.simpleName ?: "unknown",
            Instant.now()
        )
    }
    
    /**
     * Handles logout events
     * Note: Spring Security doesn't have a built-in logout event, 
     * but we can create custom events for this
     */
    fun handleLogout(userId: String, sessionId: String? = null) {
        logger.info(
            "User logout: userId={}, sessionId={}, timestamp={}", 
            userId,
            sessionId ?: "unknown",
            Instant.now()
        )
    }
    
    /**
     * Handles session creation events
     */
    fun handleSessionCreated(userId: String, sessionId: String, deviceInfo: Map<String, String>) {
        logger.info(
            "Session created: userId={}, sessionId={}, device={}, timestamp={}", 
            userId,
            sessionId,
            deviceInfo.getOrDefault("userAgent", "unknown"),
            Instant.now()
        )
    }
    
    /**
     * Handles session invalidation events
     */
    fun handleSessionInvalidated(userId: String, sessionId: String, reason: String) {
        logger.info(
            "Session invalidated: userId={}, sessionId={}, reason={}, timestamp={}", 
            userId,
            sessionId,
            reason,
            Instant.now()
        )
    }
    
    /**
     * Handles token refresh events
     */
    fun handleTokenRefresh(userId: String, oldTokenId: String?, newTokenId: String?) {
        logger.info(
            "Token refreshed: userId={}, oldTokenId={}, newTokenId={}, timestamp={}", 
            userId,
            oldTokenId ?: "unknown",
            newTokenId ?: "unknown",
            Instant.now()
        )
    }
    
    /**
     * Handles security violation attempts
     */
    fun handleSecurityViolation(userId: String?, violationType: String, details: String) {
        logger.warn(
            "Security violation: userId={}, type={}, details={}, timestamp={}", 
            userId ?: "anonymous",
            violationType,
            details,
            Instant.now()
        )
    }
    
    /**
     * Handles two-factor authentication events
     */
    fun handleTwoFactorAuthenticationAttempt(userId: String, success: Boolean, method: String) {
        if (success) {
            logger.info(
                "2FA successful: userId={}, method={}, timestamp={}", 
                userId,
                method,
                Instant.now()
            )
        } else {
            logger.warn(
                "2FA failed: userId={}, method={}, timestamp={}", 
                userId,
                method,
                Instant.now()
            )
        }
    }
}