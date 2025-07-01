package dev.ryuzu.astermanagement.security.session.repository

import dev.ryuzu.astermanagement.security.session.model.Session
import dev.ryuzu.astermanagement.security.session.model.SessionMetadata
import dev.ryuzu.astermanagement.security.session.model.SessionUpdate
import java.util.UUID

/**
 * Enhanced session repository interface for advanced session management.
 * Extends basic CRUD operations with concurrent session control, metadata tracking, and bulk operations.
 */
interface EnhancedSessionRepository {
    
    /**
     * Create a new session with metadata.
     * Enforces concurrent session limits based on configuration.
     * 
     * @param userId The ID of the user creating the session
     * @param metadata Session metadata including IP, user agent, etc.
     * @return The created session
     * @throws ConcurrentSessionLimitException if session limit is exceeded
     */
    fun createSession(userId: String, metadata: SessionMetadata): Session
    
    /**
     * Retrieve a session by ID.
     * Automatically handles session expiration and updates last accessed time.
     * 
     * @param sessionId The session ID to retrieve
     * @return The session if found and valid, null otherwise
     */
    fun getSession(sessionId: String): Session?
    
    /**
     * Update session attributes and metadata.
     * 
     * @param sessionId The session to update
     * @param updates The updates to apply
     * @return The updated session
     * @throws SessionNotFoundException if session doesn't exist
     */
    fun updateSession(sessionId: String, updates: SessionUpdate): Session
    
    /**
     * Invalidate a specific session.
     * 
     * @param sessionId The session to invalidate
     * @return true if session was invalidated, false if not found
     */
    fun invalidateSession(sessionId: String): Boolean
    
    /**
     * Invalidate all sessions for a user.
     * 
     * @param userId The user whose sessions to invalidate
     * @return The number of sessions invalidated
     */
    fun invalidateUserSessions(userId: String): Int
    
    /**
     * Invalidate all sessions for a user except the specified one.
     * 
     * @param userId The user whose sessions to invalidate
     * @param exceptSessionId The session ID to keep active
     * @return The number of sessions invalidated
     */
    fun invalidateUserSessionsExcept(userId: String, exceptSessionId: String): Int
    
    /**
     * List all active sessions for a user.
     * 
     * @param userId The user whose sessions to list
     * @return List of active sessions sorted by last access time (newest first)
     */
    fun listUserSessions(userId: String): List<Session>
    
    /**
     * Count active sessions for a user.
     * 
     * @param userId The user to count sessions for
     * @return The number of active sessions
     */
    fun countUserSessions(userId: String): Int
    
    /**
     * Extend session expiration time.
     * 
     * @param sessionId The session to extend
     * @param extensionMinutes Number of minutes to extend
     * @return true if extended, false if session not found
     */
    fun extendSession(sessionId: String, extensionMinutes: Long = 30): Boolean
    
    /**
     * Touch session to update last accessed time.
     * 
     * @param sessionId The session to touch
     * @return true if touched, false if session not found
     */
    fun touchSession(sessionId: String): Boolean
    
    /**
     * Find sessions by criteria.
     * 
     * @param ipAddress Optional IP address filter
     * @param userAgent Optional user agent filter
     * @param activeOnly If true, only return non-expired sessions
     * @return List of matching sessions
     */
    fun findSessions(
        ipAddress: String? = null,
        userAgent: String? = null,
        activeOnly: Boolean = true
    ): List<Session>
    
    /**
     * Clean up expired sessions.
     * 
     * @return The number of sessions cleaned up
     */
    fun cleanupExpiredSessions(): Int
    
    /**
     * Get session statistics for monitoring.
     * 
     * @return Map of statistics (total_sessions, active_sessions, expired_sessions, etc.)
     */
    fun getSessionStatistics(): Map<String, Long>
}