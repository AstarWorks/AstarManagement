package dev.ryuzu.astermanagement.config

import com.fasterxml.jackson.databind.ObjectMapper
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
import org.springframework.session.web.http.HeaderHttpSessionIdResolver
import org.springframework.session.web.http.HttpSessionIdResolver
import java.time.Duration

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