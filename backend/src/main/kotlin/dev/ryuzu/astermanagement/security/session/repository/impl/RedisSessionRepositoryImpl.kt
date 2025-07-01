package dev.ryuzu.astermanagement.security.session.repository.impl

import dev.ryuzu.astermanagement.config.SessionProperties
import dev.ryuzu.astermanagement.config.ConcurrentSessionPolicy
import dev.ryuzu.astermanagement.security.session.exception.*
import dev.ryuzu.astermanagement.security.session.model.*
import dev.ryuzu.astermanagement.security.session.repository.EnhancedSessionRepository
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration
import java.time.Instant
import java.util.*

/**
 * Redis-based implementation of enhanced session repository.
 * Provides distributed session management with advanced features.
 */
@Repository
class RedisSessionRepositoryImpl(
    private val redisTemplate: RedisTemplate<String, Any>,
    private val sessionProperties: SessionProperties
) : EnhancedSessionRepository {
    
    companion object {
        private val logger = LoggerFactory.getLogger(RedisSessionRepositoryImpl::class.java)
        private const val SESSION_PREFIX = "session:"
        private const val USER_SESSIONS_PREFIX = "user:sessions:"
        private const val SESSION_INDEX_PREFIX = "session:index:"
        private const val SESSION_STATS_KEY = "session:stats"
    }
    
    override fun createSession(userId: String, metadata: SessionMetadata): Session {
        logger.debug("Creating session for user: {}", userId)
        
        // Check concurrent session limit
        val currentSessions = listUserSessions(userId)
        if (currentSessions.size >= sessionProperties.maxConcurrentSessions) {
            handleConcurrentSessionLimit(userId, currentSessions)
        }
        
        val sessionId = generateSessionId()
        val now = Instant.now()
        val session = Session(
            id = sessionId,
            userId = userId,
            metadata = metadata,
            createdAt = now,
            lastAccessedAt = now,
            expiresAt = now.plus(sessionProperties.timeout),
            absoluteExpiresAt = now.plus(sessionProperties.absoluteTimeout)
        )
        
        try {
            // Store session
            val sessionKey = "$SESSION_PREFIX$sessionId"
            redisTemplate.opsForValue().set(
                sessionKey,
                session,
                Duration.between(now, session.absoluteExpiresAt)
            )
            
            // Add to user sessions set
            val userSessionsKey = "$USER_SESSIONS_PREFIX$userId"
            redisTemplate.opsForSet().add(userSessionsKey, sessionId)
            redisTemplate.expire(userSessionsKey, Duration.between(now, session.absoluteExpiresAt))
            
            // Index by IP for security monitoring
            if (metadata.ipAddress.isNotBlank()) {
                val ipIndexKey = "$SESSION_INDEX_PREFIX${metadata.ipAddress}"
                redisTemplate.opsForSet().add(ipIndexKey, sessionId)
                redisTemplate.expire(ipIndexKey, sessionProperties.timeout)
            }
            
            logger.info("Session created successfully: {} for user: {}", sessionId, userId)
            return session
            
        } catch (exception: Exception) {
            logger.error("Failed to create session for user: {}", userId, exception)
            throw SessionStoreException("Failed to create session", exception)
        }
    }
    
    override fun getSession(sessionId: String): Session? {
        logger.trace("Retrieving session: {}", sessionId)
        
        try {
            val sessionKey = "$SESSION_PREFIX$sessionId"
            val session = redisTemplate.opsForValue().get(sessionKey) as? Session
            
            return session?.let { sessionData ->
                when {
                    sessionData.isExpired() -> {
                        logger.debug("Session expired, invalidating: {}", sessionId)
                        invalidateSession(sessionId)
                        null
                    }
                    else -> {
                        // Update last accessed time
                        val updatedSession = sessionData.copy(lastAccessedAt = Instant.now())
                        redisTemplate.opsForValue().set(
                            sessionKey,
                            updatedSession,
                            Duration.between(Instant.now(), sessionData.absoluteExpiresAt)
                        )
                        logger.trace("Session accessed: {}", sessionId)
                        updatedSession
                    }
                }
            }
            
        } catch (exception: Exception) {
            logger.error("Failed to retrieve session: {}", sessionId, exception)
            throw SessionStoreException("Failed to retrieve session", exception)
        }
    }
    
    override fun updateSession(sessionId: String, updates: SessionUpdate): Session {
        logger.debug("Updating session: {}", sessionId)
        
        val session = getSession(sessionId) 
            ?: throw SessionNotFoundException(sessionId)
        
        try {
            val now = Instant.now()
            val updatedSession = session.copy(
                lastAccessedAt = now,
                attributes = if (updates.attributes != null) {
                    session.attributes.apply { putAll(updates.attributes) }
                } else session.attributes,
                roles = updates.roles ?: session.roles,
                permissions = updates.permissions ?: session.permissions,
                metadata = updates.metadata ?: session.metadata,
                expiresAt = if (updates.extendExpiration) {
                    now.plus(sessionProperties.timeout)
                } else session.expiresAt
            )
            
            val sessionKey = "$SESSION_PREFIX$sessionId"
            redisTemplate.opsForValue().set(
                sessionKey,
                updatedSession,
                Duration.between(now, updatedSession.absoluteExpiresAt)
            )
            
            logger.debug("Session updated successfully: {}", sessionId)
            return updatedSession
            
        } catch (exception: Exception) {
            logger.error("Failed to update session: {}", sessionId, exception)
            throw SessionStoreException("Failed to update session", exception)
        }
    }
    
    override fun invalidateSession(sessionId: String): Boolean {
        logger.debug("Invalidating session: {}", sessionId)
        
        try {
            val sessionKey = "$SESSION_PREFIX$sessionId"
            val session = redisTemplate.opsForValue().get(sessionKey) as? Session
            
            // Remove from Redis
            val deleted = redisTemplate.delete(sessionKey)
            
            // Remove from user sessions set
            session?.let { sessionData ->
                val userSessionsKey = "$USER_SESSIONS_PREFIX${sessionData.userId}"
                redisTemplate.opsForSet().remove(userSessionsKey, sessionId)
                
                // Remove from IP index
                val ipIndexKey = "$SESSION_INDEX_PREFIX${sessionData.metadata.ipAddress}"
                redisTemplate.opsForSet().remove(ipIndexKey, sessionId)
            }
            
            logger.info("Session invalidated: {} (existed: {})", sessionId, deleted)
            return deleted
            
        } catch (exception: Exception) {
            logger.error("Failed to invalidate session: {}", sessionId, exception)
            throw SessionStoreException("Failed to invalidate session", exception)
        }
    }
    
    override fun invalidateUserSessions(userId: String): Int {
        logger.debug("Invalidating all sessions for user: {}", userId)
        
        return try {
            val userSessions = listUserSessions(userId)
            var invalidatedCount = 0
            
            for (session in userSessions) {
                if (invalidateSession(session.id)) {
                    invalidatedCount++
                }
            }
            
            logger.info("Invalidated {} sessions for user: {}", invalidatedCount, userId)
            invalidatedCount
            
        } catch (exception: Exception) {
            logger.error("Failed to invalidate user sessions: {}", userId, exception)
            throw SessionStoreException("Failed to invalidate user sessions", exception)
        }
    }
    
    override fun invalidateUserSessionsExcept(userId: String, exceptSessionId: String): Int {
        logger.debug("Invalidating sessions for user: {} except: {}", userId, exceptSessionId)
        
        return try {
            val userSessions = listUserSessions(userId)
            var invalidatedCount = 0
            
            for (session in userSessions) {
                if (session.id != exceptSessionId && invalidateSession(session.id)) {
                    invalidatedCount++
                }
            }
            
            logger.info("Invalidated {} sessions for user: {} except: {}", invalidatedCount, userId, exceptSessionId)
            invalidatedCount
            
        } catch (exception: Exception) {
            logger.error("Failed to invalidate user sessions except: {}", exceptSessionId, exception)
            throw SessionStoreException("Failed to invalidate user sessions", exception)
        }
    }
    
    override fun listUserSessions(userId: String): List<Session> {
        logger.trace("Listing sessions for user: {}", userId)
        
        return try {
            val userSessionsKey = "$USER_SESSIONS_PREFIX$userId"
            val sessionIds = redisTemplate.opsForSet().members(userSessionsKey) as? Set<String> ?: emptySet()
            
            val sessions = sessionIds.mapNotNull { sessionId ->
                getSession(sessionId)
            }.sortedByDescending { it.lastAccessedAt }
            
            logger.trace("Found {} active sessions for user: {}", sessions.size, userId)
            sessions
            
        } catch (exception: Exception) {
            logger.error("Failed to list user sessions: {}", userId, exception)
            throw SessionStoreException("Failed to list user sessions", exception)
        }
    }
    
    override fun countUserSessions(userId: String): Int {
        return try {
            val userSessionsKey = "$USER_SESSIONS_PREFIX$userId"
            redisTemplate.opsForSet().size(userSessionsKey)?.toInt() ?: 0
        } catch (exception: Exception) {
            logger.error("Failed to count user sessions: {}", userId, exception)
            0
        }
    }
    
    override fun extendSession(sessionId: String, extensionMinutes: Long): Boolean {
        logger.debug("Extending session: {} by {} minutes", sessionId, extensionMinutes)
        
        val session = getSession(sessionId) ?: return false
        
        try {
            val now = Instant.now()
            val newExpiresAt = now.plusSeconds(extensionMinutes * 60)
            
            // Don't extend beyond absolute expiration
            val finalExpiresAt = if (newExpiresAt.isAfter(session.absoluteExpiresAt)) {
                session.absoluteExpiresAt
            } else {
                newExpiresAt
            }
            
            val extendedSession = session.copy(
                expiresAt = finalExpiresAt,
                lastAccessedAt = now
            )
            
            val sessionKey = "$SESSION_PREFIX$sessionId"
            redisTemplate.opsForValue().set(
                sessionKey,
                extendedSession,
                Duration.between(now, session.absoluteExpiresAt)
            )
            
            logger.debug("Session extended: {} until {}", sessionId, finalExpiresAt)
            return true
            
        } catch (exception: Exception) {
            logger.error("Failed to extend session: {}", sessionId, exception)
            return false
        }
    }
    
    override fun touchSession(sessionId: String): Boolean {
        return try {
            val session = getSession(sessionId)
            session != null
        } catch (exception: Exception) {
            logger.error("Failed to touch session: {}", sessionId, exception)
            false
        }
    }
    
    override fun findSessions(ipAddress: String?, userAgent: String?, activeOnly: Boolean): List<Session> {
        logger.debug("Finding sessions - IP: {}, UserAgent: {}, ActiveOnly: {}", ipAddress, userAgent, activeOnly)
        
        return try {
            val allSessions = mutableListOf<Session>()
            
            if (ipAddress != null) {
                val ipIndexKey = "$SESSION_INDEX_PREFIX$ipAddress"
                val sessionIds = redisTemplate.opsForSet().members(ipIndexKey) as? Set<String> ?: emptySet()
                
                for (sessionId in sessionIds) {
                    getSession(sessionId)?.let { session ->
                        if (!activeOnly || !session.isExpired()) {
                            if (userAgent == null || session.metadata.userAgent.contains(userAgent, ignoreCase = true)) {
                                allSessions.add(session)
                            }
                        }
                    }
                }
            }
            
            allSessions.sortedByDescending { it.lastAccessedAt }
            
        } catch (exception: Exception) {
            logger.error("Failed to find sessions", exception)
            emptyList()
        }
    }
    
    override fun cleanupExpiredSessions(): Int {
        logger.debug("Starting cleanup of expired sessions")
        
        return try {
            var cleanedCount = 0
            val pattern = "${SESSION_PREFIX}*"
            val sessionKeys = redisTemplate.keys(pattern)
            
            for (sessionKey in sessionKeys) {
                try {
                    val session = redisTemplate.opsForValue().get(sessionKey) as? Session
                    if (session?.isExpired() == true) {
                        val sessionId = sessionKey.removePrefix(SESSION_PREFIX)
                        if (invalidateSession(sessionId)) {
                            cleanedCount++
                        }
                    }
                } catch (e: Exception) {
                    logger.warn("Failed to cleanup session key: {}", sessionKey, e)
                }
            }
            
            logger.info("Cleaned up {} expired sessions", cleanedCount)
            cleanedCount
            
        } catch (exception: Exception) {
            logger.error("Failed to cleanup expired sessions", exception)
            0
        }
    }
    
    override fun getSessionStatistics(): Map<String, Long> {
        logger.debug("Generating session statistics")
        
        return try {
            val pattern = "${SESSION_PREFIX}*"
            val sessionKeys = redisTemplate.keys(pattern)
            
            var totalSessions = 0L
            var activeSessions = 0L
            var expiredSessions = 0L
            val loginMethods = mutableMapOf<LoginMethod, Long>()
            
            for (sessionKey in sessionKeys) {
                try {
                    val session = redisTemplate.opsForValue().get(sessionKey) as? Session
                    if (session != null) {
                        totalSessions++
                        if (session.isExpired()) {
                            expiredSessions++
                        } else {
                            activeSessions++
                        }
                        
                        val method = session.metadata.loginMethod
                        loginMethods[method] = loginMethods.getOrDefault(method, 0) + 1
                    }
                } catch (e: Exception) {
                    logger.warn("Failed to analyze session key: {}", sessionKey, e)
                }
            }
            
            val stats = mutableMapOf<String, Long>(
                "total_sessions" to totalSessions,
                "active_sessions" to activeSessions,
                "expired_sessions" to expiredSessions
            )
            
            // Add login method statistics
            loginMethods.forEach { (method, count) ->
                stats["sessions_${method.name.lowercase()}"] = count
            }
            
            logger.debug("Session statistics generated: {}", stats)
            stats
            
        } catch (exception: Exception) {
            logger.error("Failed to generate session statistics", exception)
            emptyMap()
        }
    }
    
    /**
     * Handle concurrent session limit based on configured policy.
     */
    private fun handleConcurrentSessionLimit(userId: String, currentSessions: List<Session>) {
        when (sessionProperties.concurrentSessionPolicy) {
            ConcurrentSessionPolicy.INVALIDATE_OLDEST -> {
                // Invalidate oldest sessions to make room
                val sessionsToInvalidate = currentSessions
                    .sortedBy { it.createdAt }
                    .take(currentSessions.size - sessionProperties.maxConcurrentSessions + 1)
                
                sessionsToInvalidate.forEach { session ->
                    invalidateSession(session.id)
                    logger.info("Invalidated oldest session {} for user {} due to concurrent session limit", 
                        session.id, userId)
                }
            }
            
            ConcurrentSessionPolicy.PREVENT_NEW_SESSION -> {
                throw ConcurrentSessionLimitException(
                    userId = userId,
                    currentSessionCount = currentSessions.size,
                    maxAllowedSessions = sessionProperties.maxConcurrentSessions
                )
            }
            
            ConcurrentSessionPolicy.NOTIFY_USER -> {
                logger.warn("User {} exceeded concurrent session limit ({}/{}), but allowing new session", 
                    userId, currentSessions.size, sessionProperties.maxConcurrentSessions)
                // Allow the new session but could trigger notification
            }
        }
    }
    
    /**
     * Generate a cryptographically secure session ID.
     */
    private fun generateSessionId(): String {
        return UUID.randomUUID().toString().replace("-", "")
    }
}