package dev.ryuzu.astermanagement.config

import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.concurrent.TimeUnit

/**
 * Rate Limiting Configuration using Redis
 * 
 * Implements rate limiting for authentication endpoints to prevent
 * brute force attacks and abuse.
 */
@Configuration
class RateLimitingConfiguration

/**
 * Simple rate limiting service using Redis
 */
@Component
class SimpleRateLimitingService(
    private val redisTemplate: RedisTemplate<String, String>
) {
    
    companion object {
        private const val RATE_LIMIT_PREFIX = "rate_limit:"
        private const val MAX_ATTEMPTS = 5
        private const val WINDOW_DURATION_MINUTES = 1L
    }
    
    /**
     * Check if IP address is within rate limit
     * @param ipAddress Client IP address
     * @return true if within limit, false if rate limit exceeded
     */
    fun isWithinRateLimit(ipAddress: String): Boolean {
        val key = "$RATE_LIMIT_PREFIX$ipAddress"
        val currentCount = redisTemplate.opsForValue().get(key)?.toIntOrNull() ?: 0
        
        return currentCount < MAX_ATTEMPTS
    }
    
    /**
     * Increment rate limit counter for IP address
     * @param ipAddress Client IP address
     * @return remaining attempts
     */
    fun incrementAndGetRemaining(ipAddress: String): Int {
        val key = "$RATE_LIMIT_PREFIX$ipAddress"
        val currentCount = redisTemplate.opsForValue().get(key)?.toIntOrNull() ?: 0
        
        if (currentCount == 0) {
            // First attempt, set with expiration
            redisTemplate.opsForValue().set(key, "1", WINDOW_DURATION_MINUTES, TimeUnit.MINUTES)
        } else {
            // Increment existing counter
            redisTemplate.opsForValue().increment(key)
        }
        
        return maxOf(0, MAX_ATTEMPTS - (currentCount + 1))
    }
    
    /**
     * Get remaining attempts for IP address
     */
    fun getRemainingAttempts(ipAddress: String): Int {
        val key = "$RATE_LIMIT_PREFIX$ipAddress"
        val currentCount = redisTemplate.opsForValue().get(key)?.toIntOrNull() ?: 0
        return maxOf(0, MAX_ATTEMPTS - currentCount)
    }
    
    /**
     * Get reset time for rate limit window
     */
    fun getResetTime(): Long {
        return System.currentTimeMillis() / 1000 + (WINDOW_DURATION_MINUTES * 60)
    }
}