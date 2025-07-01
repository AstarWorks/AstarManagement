package dev.ryuzu.astermanagement.security.ratelimit

import java.time.Duration
import java.time.Instant

/**
 * Information about the current rate limit status
 */
data class RateLimitInfo(
    val key: String,
    val limit: Int,
    val remaining: Int,
    val resetTime: Instant?,
    val windowDuration: Duration
)