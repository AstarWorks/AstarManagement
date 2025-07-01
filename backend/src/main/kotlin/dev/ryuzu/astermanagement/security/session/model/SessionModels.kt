package dev.ryuzu.astermanagement.security.session.model

import java.io.Serializable
import java.time.Instant
import java.util.UUID

/**
 * Session metadata capturing details about the session creation context.
 */
data class SessionMetadata(
    val ipAddress: String,
    val userAgent: String,
    val deviceId: String? = null,
    val deviceFingerprint: String? = null,
    val location: String? = null,
    val loginMethod: LoginMethod = LoginMethod.PASSWORD,
    val twoFactorVerified: Boolean = false,
    val rememberMe: Boolean = false
) : Serializable

/**
 * Method used to authenticate the session.
 */
enum class LoginMethod {
    PASSWORD,
    TWO_FACTOR,
    SSO,
    BIOMETRIC,
    API_KEY
}

/**
 * Enhanced session model with comprehensive tracking.
 */
data class Session(
    val id: String,
    val userId: String,
    val metadata: SessionMetadata,
    val createdAt: Instant,
    val lastAccessedAt: Instant,
    val expiresAt: Instant,
    val absoluteExpiresAt: Instant, // Maximum session lifetime regardless of activity
    val attributes: MutableMap<String, Any> = mutableMapOf(),
    val roles: Set<String> = emptySet(),
    val permissions: Set<String> = emptySet(),
    val riskScore: Int = 0, // 0-100, higher means more suspicious
    val active: Boolean = true
) : Serializable {
    
    /**
     * Check if session is expired.
     */
    fun isExpired(): Boolean {
        val now = Instant.now()
        return now.isAfter(expiresAt) || now.isAfter(absoluteExpiresAt) || !active
    }
    
    /**
     * Check if session needs refresh.
     */
    fun needsRefresh(): Boolean {
        val refreshThreshold = expiresAt.minusSeconds(300) // 5 minutes before expiry
        return Instant.now().isAfter(refreshThreshold)
    }
    
    /**
     * Calculate session age in minutes.
     */
    fun getAgeInMinutes(): Long {
        return java.time.Duration.between(createdAt, Instant.now()).toMinutes()
    }
    
    /**
     * Calculate idle time in minutes.
     */
    fun getIdleTimeInMinutes(): Long {
        return java.time.Duration.between(lastAccessedAt, Instant.now()).toMinutes()
    }
}

/**
 * Session update request model.
 */
data class SessionUpdate(
    val attributes: Map<String, Any>? = null,
    val roles: Set<String>? = null,
    val permissions: Set<String>? = null,
    val metadata: SessionMetadata? = null,
    val extendExpiration: Boolean = true
)

/**
 * Session event types for auditing.
 */
enum class SessionEventType {
    CREATED,
    ACCESSED,
    UPDATED,
    EXTENDED,
    INVALIDATED,
    EXPIRED,
    CONCURRENT_LIMIT_REACHED,
    SUSPICIOUS_ACTIVITY_DETECTED
}

/**
 * Session event for audit logging.
 */
data class SessionEvent(
    val sessionId: String,
    val userId: String,
    val eventType: SessionEventType,
    val timestamp: Instant = Instant.now(),
    val details: Map<String, Any> = emptyMap(),
    val ipAddress: String? = null,
    val userAgent: String? = null
) : Serializable

/**
 * Session statistics for monitoring.
 */
data class SessionStatistics(
    val totalSessions: Long,
    val activeSessions: Long,
    val expiredSessions: Long,
    val averageSessionDuration: Long, // in minutes
    val sessionsPerUser: Map<String, Int>,
    val sessionsByLoginMethod: Map<LoginMethod, Long>,
    val suspiciousSessions: Long,
    val timestamp: Instant = Instant.now()
)