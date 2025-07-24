package dev.ryuzu.astermanagement.security.ratelimit.impl

import dev.ryuzu.astermanagement.security.ratelimit.RateLimiter
import dev.ryuzu.astermanagement.security.ratelimit.RateLimitInfo
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant

/**
 * Redis-based rate limiter implementation using sliding window algorithm
 */
@Component
class RedisRateLimiter(
    private val redisTemplate: RedisTemplate<String, String>
) : RateLimiter {

    private val logger = LoggerFactory.getLogger(RedisRateLimiter::class.java)
    
    companion object {
        private const val RATE_LIMIT_PREFIX = "rate_limit:"
        private const val ATTEMPTS_SUFFIX = ":attempts"
        private const val WINDOW_SUFFIX = ":window"
    }

    override fun isAllowed(key: String, limit: Int, window: Duration): Boolean {
        return try {
            val attemptsKey = "$RATE_LIMIT_PREFIX$key$ATTEMPTS_SUFFIX"
            val windowKey = "$RATE_LIMIT_PREFIX$key$WINDOW_SUFFIX"
            val now = Instant.now()
            
            // Clean up expired entries first
            cleanupExpiredEntries(key, window, now)
            
            // Get current attempt count
            val currentAttempts = getCurrentAttempts(attemptsKey)
            
            if (currentAttempts >= limit) {
                logger.debug("Rate limit exceeded for key: {} (attempts: {}, limit: {})", key, currentAttempts, limit)
                return false
            }
            
            // Increment attempts
            incrementAttempts(attemptsKey, windowKey, window, now)
            
            val remainingAttempts = limit - (currentAttempts + 1)
            logger.debug("Rate limit check passed for key: {} (remaining: {})", key, remainingAttempts)
            
            true
        } catch (e: Exception) {
            logger.error("Error checking rate limit for key: $key", e)
            // Fail open - allow request if Redis is unavailable
            true
        }
    }

    override fun getRemainingAttempts(key: String, limit: Int, window: Duration): Int {
        return try {
            val attemptsKey = "$RATE_LIMIT_PREFIX$key$ATTEMPTS_SUFFIX"
            val now = Instant.now()
            
            // Clean up expired entries
            cleanupExpiredEntries(key, window, now)
            
            val currentAttempts = getCurrentAttempts(attemptsKey)
            maxOf(0, limit - currentAttempts)
        } catch (e: Exception) {
            logger.error("Error getting remaining attempts for key: $key", e)
            // Return limit if Redis is unavailable
            limit
        }
    }

    override fun resetLimit(key: String) {
        try {
            val attemptsKey = "$RATE_LIMIT_PREFIX$key$ATTEMPTS_SUFFIX"
            val windowKey = "$RATE_LIMIT_PREFIX$key$WINDOW_SUFFIX"
            
            redisTemplate.delete(attemptsKey)
            redisTemplate.delete(windowKey)
            
            logger.debug("Rate limit reset for key: {}", key)
        } catch (e: Exception) {
            logger.error("Error resetting rate limit for key: $key", e)
        }
    }

    override fun getTimeUntilReset(key: String, window: Duration): Duration? {
        return try {
            val windowKey = "$RATE_LIMIT_PREFIX$key$WINDOW_SUFFIX"
            val ttl = redisTemplate.getExpire(windowKey)
            
            if (ttl > 0) {
                Duration.ofSeconds(ttl)
            } else {
                null
            }
        } catch (e: Exception) {
            logger.error("Error getting time until reset for key: $key", e)
            null
        }
    }

    private fun getCurrentAttempts(attemptsKey: String): Int {
        val attemptsStr = redisTemplate.opsForValue().get(attemptsKey)
        return attemptsStr?.toIntOrNull() ?: 0
    }

    private fun incrementAttempts(attemptsKey: String, windowKey: String, window: Duration, now: Instant) {
        // Use Redis pipeline for atomic operations
        redisTemplate.executePipelined { connection ->
            val ops = redisTemplate.opsForValue()
            
            // Increment attempts
            val newAttempts = ops.increment(attemptsKey) ?: 1
            
            // Set expiration if this is the first attempt in the window
            if (newAttempts == 1L) {
                redisTemplate.expire(attemptsKey, window)
                
                // Store window start time for accurate cleanup
                ops.set(windowKey, now.toEpochMilli().toString(), window)
            }
            
            null
        }
    }

    private fun cleanupExpiredEntries(key: String, window: Duration, now: Instant) {
        try {
            val windowKey = "$RATE_LIMIT_PREFIX$key$WINDOW_SUFFIX"
            val attemptsKey = "$RATE_LIMIT_PREFIX$key$ATTEMPTS_SUFFIX"
            
            val windowStartStr = redisTemplate.opsForValue().get(windowKey)
            if (windowStartStr != null) {
                val windowStart = Instant.ofEpochMilli(windowStartStr.toLong())
                val windowEnd = windowStart.plus(window)
                
                // If current time is past the window end, cleanup
                if (now.isAfter(windowEnd)) {
                    redisTemplate.delete(attemptsKey)
                    redisTemplate.delete(windowKey)
                    logger.debug("Cleaned up expired rate limit entries for key: {}", key)
                }
            }
        } catch (e: Exception) {
            logger.error("Error cleaning up expired entries for key: $key", e)
        }
    }

    override fun getRateLimitInfo(key: String, limit: Int, window: Duration): RateLimitInfo {
        return try {
            val attemptsKey = "$RATE_LIMIT_PREFIX$key$ATTEMPTS_SUFFIX"
            val windowKey = "$RATE_LIMIT_PREFIX$key$WINDOW_SUFFIX"
            val now = Instant.now()
            
            cleanupExpiredEntries(key, window, now)
            
            val currentAttempts = getCurrentAttempts(attemptsKey)
            val remaining = maxOf(0, limit - currentAttempts)
            val timeUntilReset = getTimeUntilReset(key, window)
            
            RateLimitInfo(
                key = key,
                limit = limit,
                remaining = remaining,
                resetTime = timeUntilReset?.let { now.plus(it) },
                windowDuration = window
            )
        } catch (e: Exception) {
            logger.error("Error getting rate limit info for key: $key", e)
            RateLimitInfo(
                key = key,
                limit = limit,
                remaining = limit,
                resetTime = null,
                windowDuration = window
            )
        }
    }
}