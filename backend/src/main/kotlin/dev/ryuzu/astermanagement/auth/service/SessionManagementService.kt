package dev.ryuzu.astermanagement.auth.service

import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.*

/**
 * Service for managing user sessions in Redis
 * 
 * Provides functionality to create, track, and invalidate user sessions
 * across multiple devices and applications. Supports forced logout
 * and session monitoring for security purposes.
 */
@Service
class SessionManagementService(
    private val redisTemplate: RedisTemplate<String, String>
) {
    
    companion object {
        private const val SESSION_PREFIX = "session:"
        private const val USER_SESSIONS_PREFIX = "user:sessions:"
        private const val SESSION_DATA_PREFIX = "session:data:"
        private const val DEFAULT_SESSION_DURATION_HOURS = 24L
    }
    
    /**
     * Creates a new user session with associated data
     * 
     * @param userId The ID of the user
     * @param sessionData Additional session data (device info, IP, etc.)
     * @param duration Optional session duration (defaults to 24 hours)
     * @return Generated session ID
     */
    fun createSession(userId: UUID, sessionData: Map<String, String>, duration: Duration = Duration.ofHours(DEFAULT_SESSION_DURATION_HOURS)): String {
        val sessionId = UUID.randomUUID().toString()
        val sessionKey = "$SESSION_PREFIX$sessionId"
        val sessionDataKey = "$SESSION_DATA_PREFIX$sessionId"
        
        // Store basic session info
        redisTemplate.opsForValue().set(sessionKey, userId.toString(), duration)
        
        // Store session data if provided
        if (sessionData.isNotEmpty()) {
            redisTemplate.opsForHash<String, String>().putAll(sessionDataKey, sessionData)
            redisTemplate.expire(sessionDataKey, duration)
        }
        
        // Track session for the user
        redisTemplate.opsForSet().add("$USER_SESSIONS_PREFIX$userId", sessionId)
        redisTemplate.expire("$USER_SESSIONS_PREFIX$userId", duration.plusHours(1)) // Slightly longer to ensure cleanup
        
        return sessionId
    }
    
    /**
     * Validates if a session exists and is active
     * 
     * @param sessionId The session ID to validate
     * @return The user ID if session is valid, null otherwise
     */
    fun validateSession(sessionId: String): UUID? {
        val userIdString = redisTemplate.opsForValue().get("$SESSION_PREFIX$sessionId")
        return userIdString?.let { 
            try {
                UUID.fromString(it)
            } catch (e: IllegalArgumentException) {
                null
            }
        }
    }
    
    /**
     * Gets session data for a given session ID
     * 
     * @param sessionId The session ID
     * @return Map of session data or empty map if not found
     */
    fun getSessionData(sessionId: String): Map<String, String> {
        val sessionDataKey = "$SESSION_DATA_PREFIX$sessionId"
        return redisTemplate.opsForHash<String, String>().entries(sessionDataKey)
    }
    
    /**
     * Updates session data
     * 
     * @param sessionId The session ID
     * @param data New data to add/update
     */
    fun updateSessionData(sessionId: String, data: Map<String, String>) {
        val sessionDataKey = "$SESSION_DATA_PREFIX$sessionId"
        if (data.isNotEmpty()) {
            redisTemplate.opsForHash<String, String>().putAll(sessionDataKey, data)
        }
    }
    
    /**
     * Extends session expiration time
     * 
     * @param sessionId The session ID to extend
     * @param duration New duration from now
     */
    fun extendSession(sessionId: String, duration: Duration = Duration.ofHours(DEFAULT_SESSION_DURATION_HOURS)) {
        val sessionKey = "$SESSION_PREFIX$sessionId"
        val sessionDataKey = "$SESSION_DATA_PREFIX$sessionId"
        
        redisTemplate.expire(sessionKey, duration)
        if (redisTemplate.hasKey(sessionDataKey)) {
            redisTemplate.expire(sessionDataKey, duration)
        }
    }
    
    /**
     * Invalidates a specific session
     * 
     * @param sessionId The session ID to invalidate
     */
    fun invalidateSession(sessionId: String) {
        val sessionKey = "$SESSION_PREFIX$sessionId"
        val sessionDataKey = "$SESSION_DATA_PREFIX$sessionId"
        
        // Get user ID before deleting session
        val userId = validateSession(sessionId)
        
        // Delete session data
        redisTemplate.delete(sessionKey)
        redisTemplate.delete(sessionDataKey)
        
        // Remove from user's session list
        userId?.let { 
            redisTemplate.opsForSet().remove("$USER_SESSIONS_PREFIX$it", sessionId)
        }
    }
    
    /**
     * Invalidates all sessions for a specific user
     * Useful for forced logout from all devices
     * 
     * @param userId The user ID whose sessions to invalidate
     */
    fun invalidateAllUserSessions(userId: UUID) {
        val userSessionsKey = "$USER_SESSIONS_PREFIX$userId"
        val sessions = redisTemplate.opsForSet().members(userSessionsKey) ?: emptySet()
        
        // Delete all sessions
        sessions.forEach { sessionId ->
            redisTemplate.delete("$SESSION_PREFIX$sessionId")
            redisTemplate.delete("$SESSION_DATA_PREFIX$sessionId")
        }
        
        // Clear user session tracking
        redisTemplate.delete(userSessionsKey)
    }
    
    /**
     * Gets all active session IDs for a user
     * 
     * @param userId The user ID
     * @return Set of active session IDs
     */
    fun getActiveSessions(userId: UUID): Set<String> {
        val userSessionsKey = "$USER_SESSIONS_PREFIX$userId"
        val allSessions = redisTemplate.opsForSet().members(userSessionsKey) ?: emptySet()
        
        // Filter to only return actually active sessions
        return allSessions.filter { sessionId ->
            redisTemplate.hasKey("$SESSION_PREFIX$sessionId")
        }.toSet()
    }
    
    /**
     * Gets detailed information about all active sessions for a user
     * 
     * @param userId The user ID
     * @return List of session information including ID and data
     */
    fun getActiveSessionsWithData(userId: UUID): List<SessionInfo> {
        return getActiveSessions(userId).map { sessionId ->
            SessionInfo(
                sessionId = sessionId,
                userId = userId,
                sessionData = getSessionData(sessionId),
                isActive = redisTemplate.hasKey("$SESSION_PREFIX$sessionId")
            )
        }
    }
    
    /**
     * Cleans up expired sessions from user session lists
     * Should be called periodically by a scheduled task
     * 
     * @param userId The user ID to clean up
     * @return Number of cleaned up sessions
     */
    fun cleanupExpiredSessions(userId: UUID): Int {
        val userSessionsKey = "$USER_SESSIONS_PREFIX$userId"
        val allSessions = redisTemplate.opsForSet().members(userSessionsKey) ?: emptySet()
        var cleanedCount = 0
        
        allSessions.forEach { sessionId ->
            if (!redisTemplate.hasKey("$SESSION_PREFIX$sessionId")) {
                redisTemplate.opsForSet().remove(userSessionsKey, sessionId)
                redisTemplate.delete("$SESSION_DATA_PREFIX$sessionId")
                cleanedCount++
            }
        }
        
        return cleanedCount
    }
    
    /**
     * Gets the count of active sessions for a user
     * 
     * @param userId The user ID
     * @return Number of active sessions
     */
    fun getActiveSessionCount(userId: UUID): Long {
        return getActiveSessions(userId).size.toLong()
    }
}

/**
 * Data class representing session information
 */
data class SessionInfo(
    val sessionId: String,
    val userId: UUID,
    val sessionData: Map<String, String>,
    val isActive: Boolean
)