package dev.ryuzu.astermanagement.security.session.service

import dev.ryuzu.astermanagement.security.session.model.*
import java.util.UUID

/**
 * High-level session service interface providing business logic for session management.
 * Builds on top of the repository layer to provide comprehensive session operations.
 */
interface SessionService {
    
    /**
     * Create a new authenticated session for a user.
     * 
     * @param userId The user ID
     * @param request Session creation request with metadata
     * @return The created session
     */
    fun createSession(userId: String, request: SessionCreationRequest): Session
    
    /**
     * Validate and retrieve an active session.
     * 
     * @param sessionId The session ID to validate
     * @return The session if valid and active, null otherwise
     */
    fun validateSession(sessionId: String): Session?
    
    /**
     * Refresh a session, extending its expiration time.
     * 
     * @param sessionId The session to refresh
     * @return The refreshed session, or null if session doesn't exist
     */
    fun refreshSession(sessionId: String): Session?
    
    /**
     * Update session attributes and metadata.
     * 
     * @param sessionId The session to update
     * @param request Update request
     * @return The updated session
     */
    fun updateSession(sessionId: String, request: SessionUpdateRequest): Session
    
    /**
     * Invalidate a specific session.
     * 
     * @param sessionId The session to invalidate
     * @param reason Reason for invalidation (for audit purposes)
     * @return true if session was invalidated
     */
    fun invalidateSession(sessionId: String, reason: String = "User logout"): Boolean
    
    /**
     * Invalidate all sessions for a user.
     * 
     * @param userId The user whose sessions to invalidate
     * @param reason Reason for invalidation
     * @return Number of sessions invalidated
     */
    fun invalidateAllUserSessions(userId: String, reason: String = "Security logout"): Int
    
    /**
     * Invalidate all sessions for a user except the current one.
     * 
     * @param userId The user whose sessions to invalidate
     * @param currentSessionId The session to keep active
     * @param reason Reason for invalidation
     * @return Number of sessions invalidated
     */
    fun invalidateOtherUserSessions(
        userId: String, 
        currentSessionId: String, 
        reason: String = "User requested"
    ): Int
    
    /**
     * List all active sessions for a user.
     * 
     * @param userId The user whose sessions to list
     * @return List of active sessions with anonymized sensitive data
     */
    fun listUserSessions(userId: String): List<SessionInfo>
    
    /**
     * Get detailed session information.
     * 
     * @param sessionId The session ID
     * @param userId Optional user ID for authorization check
     * @return Session details if authorized
     */
    fun getSessionDetails(sessionId: String, userId: String? = null): SessionDetails?
    
    /**
     * Analyze session for security risks.
     * 
     * @param sessionId The session to analyze
     * @return Security analysis result
     */
    fun analyzeSessionSecurity(sessionId: String): SessionSecurityAnalysis
    
    /**
     * Get session activity for a user.
     * 
     * @param userId The user ID
     * @param days Number of days to look back
     * @return Session activity summary
     */
    fun getUserSessionActivity(userId: String, days: Int = 30): SessionActivity
    
    /**
     * Get system-wide session statistics.
     * 
     * @return Session statistics for monitoring
     */
    fun getSessionStatistics(): SessionStatistics
    
    /**
     * Clean up expired sessions and perform maintenance.
     * 
     * @return Number of sessions cleaned up
     */
    fun performSessionMaintenance(): Int
}

/**
 * Request model for creating a new session.
 */
data class SessionCreationRequest(
    val ipAddress: String,
    val userAgent: String,
    val deviceId: String? = null,
    val location: String? = null,
    val loginMethod: LoginMethod = LoginMethod.PASSWORD,
    val twoFactorVerified: Boolean = false,
    val rememberMe: Boolean = false,
    val initialAttributes: Map<String, Any> = emptyMap()
)

/**
 * Request model for updating a session.
 */
data class SessionUpdateRequest(
    val attributes: Map<String, Any>? = null,
    val roles: Set<String>? = null,
    val permissions: Set<String>? = null,
    val extendExpiration: Boolean = true
)

/**
 * Public session information (sanitized for external use).
 */
data class SessionInfo(
    val id: String,
    val createdAt: java.time.Instant,
    val lastAccessedAt: java.time.Instant,
    val expiresAt: java.time.Instant,
    val deviceInfo: String, // Anonymized device info
    val location: String?,
    val loginMethod: LoginMethod,
    val current: Boolean = false
)

/**
 * Detailed session information for administrative purposes.
 */
data class SessionDetails(
    val session: Session,
    val securityScore: Int,
    val flags: Set<String> = emptySet(),
    val recentActivity: List<String> = emptyList()
)

/**
 * Session security analysis result.
 */
data class SessionSecurityAnalysis(
    val sessionId: String,
    val riskScore: Int, // 0-100
    val riskFactors: List<String>,
    val recommendations: List<String>,
    val shouldInvalidate: Boolean = false
)

/**
 * User session activity summary.
 */
data class SessionActivity(
    val userId: String,
    val totalSessions: Int,
    val averageSessionDuration: Long, // minutes
    val uniqueIpAddresses: Int,
    val uniqueDevices: Int,
    val loginMethods: Map<LoginMethod, Int>,
    val timeframe: String
)