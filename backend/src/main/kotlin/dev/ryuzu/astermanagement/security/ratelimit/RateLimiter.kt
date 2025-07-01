package dev.ryuzu.astermanagement.security.ratelimit

import java.time.Duration

/**
 * Rate limiter interface for controlling request frequency
 */
interface RateLimiter {
    
    /**
     * Check if the request is allowed under rate limiting rules
     * 
     * @param key The unique identifier for rate limiting (e.g., IP address, user ID)
     * @param limit Maximum number of requests allowed
     * @param window Time window for the rate limit
     * @return true if request is allowed, false if rate limited
     */
    fun isAllowed(key: String, limit: Int, window: Duration): Boolean
    
    /**
     * Get remaining attempts for the given key
     * 
     * @param key The unique identifier
     * @param limit Maximum number of requests allowed
     * @param window Time window for the rate limit
     * @return Number of remaining attempts, or -1 if unlimited
     */
    fun getRemainingAttempts(key: String, limit: Int, window: Duration): Int
    
    /**
     * Reset the rate limit for the given key
     * 
     * @param key The unique identifier to reset
     */
    fun resetLimit(key: String)
    
    /**
     * Get the time until the rate limit resets
     * 
     * @param key The unique identifier
     * @param window Time window for the rate limit
     * @return Duration until reset, or null if no limit active
     */
    fun getTimeUntilReset(key: String, window: Duration): Duration?
    
    /**
     * Get comprehensive rate limit information
     * 
     * @param key The unique identifier
     * @param limit Maximum number of requests allowed
     * @param window Time window for the rate limit
     * @return RateLimitInfo with current status
     */
    fun getRateLimitInfo(key: String, limit: Int, window: Duration): RateLimitInfo
}