package dev.ryuzu.astermanagement.security.lockout

import java.time.Duration
import java.time.Instant

/**
 * Interface for account lockout management
 */
interface AccountLockoutService {
    
    /**
     * Check if an account is currently locked
     */
    fun isAccountLocked(username: String): Boolean
    
    /**
     * Record a failed login attempt
     */
    fun recordFailedAttempt(username: String, ipAddress: String, userAgent: String? = null)
    
    /**
     * Reset failed attempts for an account (after successful login)
     */
    fun resetFailedAttempts(username: String)
    
    /**
     * Lock an account manually
     */
    fun lockAccount(username: String, reason: String, lockedBy: String? = null, duration: Duration? = null)
    
    /**
     * Unlock an account manually
     */
    fun unlockAccount(username: String, unlockedBy: String)
    
    /**
     * Get lockout status information
     */
    fun getLockoutStatus(username: String): AccountLockoutStatus
    
    /**
     * Get failed attempt count for an account
     */
    fun getFailedAttemptCount(username: String): Int
    
    /**
     * Get time until account unlock
     */
    fun getTimeUntilUnlock(username: String): Duration?
    
    /**
     * Check if IP address is blocked due to suspicious activity
     */
    fun isIpBlocked(ipAddress: String): Boolean
    
    /**
     * Block an IP address temporarily
     */
    fun blockIp(ipAddress: String, duration: Duration, reason: String)
    
    /**
     * Get lockout configuration
     */
    fun getLockoutConfig(): AccountLockoutConfig
}

/**
 * Account lockout status information
 */
data class AccountLockoutStatus(
    val username: String,
    val isLocked: Boolean,
    val failedAttempts: Int,
    val maxAttempts: Int,
    val lockedAt: Instant? = null,
    val lockedUntil: Instant? = null,
    val lockReason: String? = null,
    val lockedBy: String? = null,
    val timeUntilUnlock: Duration? = null,
    val canBeUnlocked: Boolean = true
)

/**
 * Account lockout configuration
 */
data class AccountLockoutConfig(
    val maxFailedAttempts: Int = 5,
    val lockoutDuration: Duration = Duration.ofMinutes(30),
    val failedAttemptWindow: Duration = Duration.ofMinutes(15),
    val ipBlockDuration: Duration = Duration.ofHours(1),
    val maxIpFailedAttempts: Int = 20,
    val enableIpBlocking: Boolean = true,
    val enableProgressiveLockout: Boolean = true,
    val notifyOnLockout: Boolean = true
)

/**
 * Progressive lockout durations
 */
enum class LockoutLevel(val duration: Duration, val threshold: Int) {
    FIRST(Duration.ofMinutes(15), 5),
    SECOND(Duration.ofMinutes(30), 7),
    THIRD(Duration.ofHours(1), 10),
    FOURTH(Duration.ofHours(4), 15),
    EXTENDED(Duration.ofHours(24), 20)
}