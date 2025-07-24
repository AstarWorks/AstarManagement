package dev.ryuzu.astermanagement.config

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.security.session.repository.EnhancedSessionRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializer
import org.springframework.session.FlushMode
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession
import org.springframework.session.events.SessionCreatedEvent
import org.springframework.session.events.SessionDeletedEvent
import org.springframework.session.events.SessionExpiredEvent
import org.springframework.session.web.http.HeaderHttpSessionIdResolver
import org.springframework.session.web.http.HttpSessionIdResolver
import org.springframework.session.web.http.SessionEventHttpSessionListenerAdapter
import java.time.Duration
import java.time.Instant
import jakarta.servlet.http.HttpSessionEvent
import jakarta.servlet.http.HttpSessionListener
import org.springframework.context.event.EventListener

/**
 * Spring Session configuration for distributed session management with Redis.
 * Provides centralized session storage, horizontal scaling support, and advanced session features.
 */
@Configuration
@EnableRedisHttpSession(
    maxInactiveIntervalInSeconds = 1800, // 30 minutes default
    redisNamespace = "aster:sessions",
    flushMode = FlushMode.ON_SAVE
)
class SessionConfig {
    
    companion object {
        private val logger = LoggerFactory.getLogger(SessionConfig::class.java)
    }
    
    /**
     * Configure session ID resolution from X-Auth-Token header.
     * This allows session management in REST APIs without cookies.
     */
    @Bean
    fun httpSessionIdResolver(): HttpSessionIdResolver {
        logger.info("Configuring session ID resolver with X-Auth-Token header")
        return HeaderHttpSessionIdResolver.xAuthToken()
    }
    
    /**
     * Custom Redis serializer for session data using Jackson.
     * Ensures proper serialization of complex session attributes.
     */
    @Bean
    fun springSessionDefaultRedisSerializer(
        objectMapper: ObjectMapper
    ): RedisSerializer<Any> {
        logger.info("Configuring Spring Session Redis serializer with Jackson")
        return GenericJackson2JsonRedisSerializer(objectMapper)
    }
    
    /**
     * Custom session listener for handling session lifecycle events.
     */
    @Bean
    fun customSessionListener(): CustomSessionListener {
        logger.info("Configuring custom session listener")
        return CustomSessionListener()
    }
}

/**
 * Session configuration properties for fine-tuning session behavior.
 */
@ConfigurationProperties(prefix = "aster.session")
@Configuration
data class SessionProperties(
    val timeout: Duration = Duration.ofMinutes(30),
    val maxConcurrentSessions: Int = 3,
    val concurrentSessionPolicy: ConcurrentSessionPolicy = ConcurrentSessionPolicy.INVALIDATE_OLDEST,
    val rememberMeTimeout: Duration = Duration.ofDays(30),
    val ipValidation: Boolean = false,
    val deviceFingerprinting: Boolean = true,
    val absoluteTimeout: Duration = Duration.ofHours(24),
    val inactivityTimeout: Duration = Duration.ofMinutes(30)
)

/**
 * Policy for handling concurrent session limits.
 */
enum class ConcurrentSessionPolicy {
    /**
     * Invalidate the oldest session when limit is reached.
     */
    INVALIDATE_OLDEST,
    
    /**
     * Prevent creation of new session when limit is reached.
     */
    PREVENT_NEW_SESSION,
    
    /**
     * Notify user but allow new session.
     */
    NOTIFY_USER
}

/**
 * Custom session listener for handling session lifecycle events.
 * Provides audit logging and session management capabilities.
 */
class CustomSessionListener : HttpSessionListener {
    
    companion object {
        private val logger = LoggerFactory.getLogger(CustomSessionListener::class.java)
    }
    
    override fun sessionCreated(se: HttpSessionEvent) {
        val sessionId = se.session.id
        val creationTime = Instant.ofEpochMilli(se.session.creationTime)
        
        logger.info("Session created: sessionId={}, creationTime={}", sessionId, creationTime)
        
        // Track session creation metrics
        se.session.setAttribute("session.created.at", creationTime)
        se.session.setAttribute("session.last.accessed.at", creationTime)
    }
    
    override fun sessionDestroyed(se: HttpSessionEvent) {
        val sessionId = se.session.id
        val creationTime = se.session.getAttribute("session.created.at") as? Instant
        val lastAccessedTime = se.session.getAttribute("session.last.accessed.at") as? Instant
        val now = Instant.now()
        
        val sessionDuration = creationTime?.let { Duration.between(it, now) }
        val inactivityDuration = lastAccessedTime?.let { Duration.between(it, now) }
        
        logger.info(
            "Session destroyed: sessionId={}, duration={}, inactivity={}", 
            sessionId, 
            sessionDuration?.toMinutes(),
            inactivityDuration?.toMinutes()
        )
        
        // Clean up any session-specific resources
        cleanupSessionResources(sessionId)
    }
    
    private fun cleanupSessionResources(sessionId: String) {
        // Additional cleanup logic can be added here
        logger.debug("Cleaning up resources for session: {}", sessionId)
    }
}

/**
 * Spring Session event listener for handling Redis session events.
 * Provides comprehensive session lifecycle monitoring and audit logging.
 */
@Configuration
class SessionEventListener {
    
    companion object {
        private val logger = LoggerFactory.getLogger(SessionEventListener::class.java)
    }
    
    @EventListener
    fun handleSessionCreated(event: SessionCreatedEvent) {
        val sessionId = event.sessionId
        
        logger.info("Redis session created: sessionId={}", sessionId)
    }
    
    @EventListener
    fun handleSessionDeleted(event: SessionDeletedEvent) {
        val sessionId = event.sessionId
        
        logger.info("Redis session deleted: sessionId={}", sessionId)
    }
    
    @EventListener
    fun handleSessionExpired(event: SessionExpiredEvent) {
        val sessionId = event.sessionId
        
        logger.info("Redis session expired: sessionId={}", sessionId)
    }
}