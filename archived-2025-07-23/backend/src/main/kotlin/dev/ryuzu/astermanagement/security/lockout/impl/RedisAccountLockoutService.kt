package dev.ryuzu.astermanagement.security.lockout.impl

import dev.ryuzu.astermanagement.security.audit.AuditLogger
import dev.ryuzu.astermanagement.security.lockout.*
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.util.concurrent.TimeUnit

/**
 * Redis-based account lockout service implementation
 */
@Service
class RedisAccountLockoutService(
    private val redisTemplate: RedisTemplate<String, String>,
    private val auditLogger: AuditLogger,
    @Value("\${security.lockout.max-failed-attempts:5}") private val maxFailedAttempts: Int,
    @Value("\${security.lockout.duration:PT30M}") private val defaultLockoutDuration: String,
    @Value("\${security.lockout.failed-attempt-window:PT15M}") private val failedAttemptWindow: String,
    @Value("\${security.lockout.ip-block-duration:PT1H}") private val ipBlockDuration: String,
    @Value("\${security.lockout.max-ip-failed-attempts:20}") private val maxIpFailedAttempts: Int,
    @Value("\${security.lockout.enable-progressive:true}") private val enableProgressiveLockout: Boolean,
    @Value("\${security.lockout.enable-ip-blocking:true}") private val enableIpBlocking: Boolean
) : AccountLockoutService {

    private val logger = LoggerFactory.getLogger(RedisAccountLockoutService::class.java)

    companion object {
        private const val FAILED_ATTEMPTS_PREFIX = "lockout:failed:"
        private const val LOCKOUT_PREFIX = "lockout:locked:"
        private const val IP_BLOCK_PREFIX = "lockout:ip:"
        private const val ATTEMPT_HISTORY_PREFIX = "lockout:history:"
        private const val LOCKOUT_COUNT_PREFIX = "lockout:count:"
    }

    override fun isAccountLocked(username: String): Boolean {
        return try {
            val lockoutKey = "$LOCKOUT_PREFIX$username"
            val lockoutData = redisTemplate.opsForValue().get(lockoutKey)
            
            if (lockoutData != null) {
                val lockoutInfo = parseLockoutData(lockoutData)
                val now = Instant.now()
                
                // Check if lockout has expired
                if (lockoutInfo.lockedUntil?.isAfter(now) == true) {
                    logger.debug("Account {} is locked until {}", username, lockoutInfo.lockedUntil)
                    return true
                } else if (lockoutInfo.lockedUntil?.isBefore(now) == true) {
                    // Lockout expired, remove it
                    unlockAccountInternal(username, "automatic_expiration")
                }
            }
            
            false
        } catch (e: Exception) {
            logger.error("Error checking account lock status for: $username", e)
            // Fail safe - don't lock if we can't determine status
            false
        }
    }

    override fun recordFailedAttempt(username: String, ipAddress: String, userAgent: String?) {
        try {
            val now = Instant.now()
            val failedAttemptsKey = "$FAILED_ATTEMPTS_PREFIX$username"
            val attemptHistoryKey = "$ATTEMPT_HISTORY_PREFIX$username"
            val ipKey = "$IP_BLOCK_PREFIX$ipAddress"
            
            // Record the failed attempt with timestamp
            val attemptData = "${now.toEpochMilli()}:$ipAddress"
            redisTemplate.opsForList().leftPush(attemptHistoryKey, attemptData)
            redisTemplate.expire(attemptHistoryKey, Duration.parse(failedAttemptWindow))
            
            // Clean up old attempts outside the window
            cleanupOldAttempts(attemptHistoryKey, Duration.parse(failedAttemptWindow))
            
            // Count current attempts in window
            val currentAttempts = countAttemptsInWindow(attemptHistoryKey, Duration.parse(failedAttemptWindow))
            
            // Update failed attempts counter
            redisTemplate.opsForValue().set(
                failedAttemptsKey, 
                currentAttempts.toString(), 
                Duration.parse(failedAttemptWindow)
            )
            
            logger.debug("Recorded failed attempt for {} (attempts: {})", username, currentAttempts)
            
            // Check if account should be locked
            if (currentAttempts >= maxFailedAttempts) {
                val lockoutDuration = calculateLockoutDuration(username, currentAttempts)
                lockAccountInternal(username, "max_failed_attempts", null, lockoutDuration, ipAddress, userAgent)
            }
            
            // Handle IP blocking if enabled
            if (enableIpBlocking) {
                handleIpBlocking(ipAddress, userAgent)
            }
            
            // Log failed attempt
            auditLogger.logAuthenticationAttempt(
                username = username,
                success = false,
                ipAddress = ipAddress,
                userAgent = userAgent,
                additionalDetails = mapOf(
                    "failedAttempts" to currentAttempts,
                    "maxAttempts" to maxFailedAttempts,
                    "willLockAfter" to (maxFailedAttempts - currentAttempts)
                )
            )
            
        } catch (e: Exception) {
            logger.error("Error recording failed attempt for: $username", e)
        }
    }

    override fun resetFailedAttempts(username: String) {
        try {
            val failedAttemptsKey = "$FAILED_ATTEMPTS_PREFIX$username"
            val attemptHistoryKey = "$ATTEMPT_HISTORY_PREFIX$username"
            
            redisTemplate.delete(failedAttemptsKey)
            redisTemplate.delete(attemptHistoryKey)
            
            logger.debug("Reset failed attempts for user: {}", username)
        } catch (e: Exception) {
            logger.error("Error resetting failed attempts for: $username", e)
        }
    }

    override fun lockAccount(username: String, reason: String, lockedBy: String?, duration: Duration?) {
        try {
            val lockoutDuration = duration ?: Duration.parse(defaultLockoutDuration)
            lockAccountInternal(username, reason, lockedBy, lockoutDuration)
        } catch (e: Exception) {
            logger.error("Error manually locking account: $username", e)
        }
    }

    override fun unlockAccount(username: String, unlockedBy: String) {
        try {
            unlockAccountInternal(username, unlockedBy)
            resetFailedAttempts(username)
            
            // Log unlock event
            auditLogger.logSuspiciousActivity(
                details = mapOf(
                    "activityType" to "account_unlocked",
                    "username" to username,
                    "unlockedBy" to unlockedBy,
                    "manual" to true
                ),
                ipAddress = "system",
                riskScore = 30
            )
            
            logger.info("Account unlocked manually: {} by {}", username, unlockedBy)
        } catch (e: Exception) {
            logger.error("Error unlocking account: $username", e)
        }
    }

    override fun getLockoutStatus(username: String): AccountLockoutStatus {
        return try {
            val lockoutKey = "$LOCKOUT_PREFIX$username"
            val failedAttemptsKey = "$FAILED_ATTEMPTS_PREFIX$username"
            
            val lockoutData = redisTemplate.opsForValue().get(lockoutKey)
            val failedAttempts = redisTemplate.opsForValue().get(failedAttemptsKey)?.toIntOrNull() ?: 0
            
            if (lockoutData != null) {
                val lockoutInfo = parseLockoutData(lockoutData)
                val now = Instant.now()
                val timeUntilUnlock = if (lockoutInfo.lockedUntil?.isAfter(now) == true) {
                    Duration.between(now, lockoutInfo.lockedUntil)
                } else null
                
                AccountLockoutStatus(
                    username = username,
                    isLocked = timeUntilUnlock != null,
                    failedAttempts = failedAttempts,
                    maxAttempts = maxFailedAttempts,
                    lockedAt = lockoutInfo.lockedAt,
                    lockedUntil = lockoutInfo.lockedUntil,
                    lockReason = lockoutInfo.reason,
                    lockedBy = lockoutInfo.lockedBy,
                    timeUntilUnlock = timeUntilUnlock
                )
            } else {
                AccountLockoutStatus(
                    username = username,
                    isLocked = false,
                    failedAttempts = failedAttempts,
                    maxAttempts = maxFailedAttempts
                )
            }
        } catch (e: Exception) {
            logger.error("Error getting lockout status for: $username", e)
            AccountLockoutStatus(
                username = username,
                isLocked = false,
                failedAttempts = 0,
                maxAttempts = maxFailedAttempts
            )
        }
    }

    override fun getFailedAttemptCount(username: String): Int {
        return try {
            val failedAttemptsKey = "$FAILED_ATTEMPTS_PREFIX$username"
            redisTemplate.opsForValue().get(failedAttemptsKey)?.toIntOrNull() ?: 0
        } catch (e: Exception) {
            logger.error("Error getting failed attempt count for: $username", e)
            0
        }
    }

    override fun getTimeUntilUnlock(username: String): Duration? {
        return try {
            val lockoutKey = "$LOCKOUT_PREFIX$username"
            val lockoutData = redisTemplate.opsForValue().get(lockoutKey)
            
            if (lockoutData != null) {
                val lockoutInfo = parseLockoutData(lockoutData)
                val now = Instant.now()
                
                if (lockoutInfo.lockedUntil?.isAfter(now) == true) {
                    Duration.between(now, lockoutInfo.lockedUntil)
                } else null
            } else null
        } catch (e: Exception) {
            logger.error("Error getting time until unlock for: $username", e)
            null
        }
    }

    override fun isIpBlocked(ipAddress: String): Boolean {
        if (!enableIpBlocking) return false
        
        return try {
            val ipKey = "$IP_BLOCK_PREFIX$ipAddress"
            redisTemplate.hasKey(ipKey)
        } catch (e: Exception) {
            logger.error("Error checking IP block status for: $ipAddress", e)
            false
        }
    }

    override fun blockIp(ipAddress: String, duration: Duration, reason: String) {
        if (!enableIpBlocking) return
        
        try {
            val ipKey = "$IP_BLOCK_PREFIX$ipAddress"
            val blockData = "${Instant.now().toEpochMilli()}:$reason"
            
            redisTemplate.opsForValue().set(ipKey, blockData, duration)
            
            logger.warn("Blocked IP address: {} for {} (reason: {})", ipAddress, duration, reason)
            
            // Log IP blocking
            auditLogger.logSuspiciousActivity(
                details = mapOf(
                    "activityType" to "ip_blocked",
                    "reason" to reason,
                    "duration" to duration.toString(),
                    "automated" to true
                ),
                ipAddress = ipAddress,
                riskScore = 70
            )
        } catch (e: Exception) {
            logger.error("Error blocking IP: $ipAddress", e)
        }
    }

    override fun getLockoutConfig(): AccountLockoutConfig {
        return AccountLockoutConfig(
            maxFailedAttempts = maxFailedAttempts,
            lockoutDuration = Duration.parse(defaultLockoutDuration),
            failedAttemptWindow = Duration.parse(failedAttemptWindow),
            ipBlockDuration = Duration.parse(ipBlockDuration),
            maxIpFailedAttempts = maxIpFailedAttempts,
            enableIpBlocking = enableIpBlocking,
            enableProgressiveLockout = enableProgressiveLockout
        )
    }

    private fun lockAccountInternal(
        username: String, 
        reason: String, 
        lockedBy: String?, 
        duration: Duration, 
        ipAddress: String? = null, 
        userAgent: String? = null
    ) {
        val now = Instant.now()
        val lockedUntil = now.plus(duration)
        val lockoutKey = "$LOCKOUT_PREFIX$username"
        
        val lockoutData = "${now.toEpochMilli()}:${lockedUntil.toEpochMilli()}:$reason:${lockedBy ?: "system"}"
        redisTemplate.opsForValue().set(lockoutKey, lockoutData, duration)
        
        // Increment lockout count for progressive lockout
        if (enableProgressiveLockout) {
            val countKey = "$LOCKOUT_COUNT_PREFIX$username"
            redisTemplate.opsForValue().increment(countKey)
            redisTemplate.expire(countKey, Duration.ofDays(30)) // Reset count after 30 days
        }
        
        logger.warn("Account locked: {} for {} (reason: {})", username, duration, reason)
        
        // Log account lockout
        auditLogger.logAccountLockout(
            username = username,
            reason = reason,
            ipAddress = ipAddress ?: "unknown",
            userAgent = userAgent,
            additionalDetails = mapOf(
                "lockoutDuration" to duration.toString(),
                "lockedBy" to (lockedBy ?: "system"),
                "lockedUntil" to lockedUntil.toString(),
                "progressive" to enableProgressiveLockout
            )
        )
    }

    private fun unlockAccountInternal(username: String, unlockedBy: String) {
        val lockoutKey = "$LOCKOUT_PREFIX$username"
        redisTemplate.delete(lockoutKey)
        
        logger.info("Account unlocked: {} by {}", username, unlockedBy)
    }

    private fun calculateLockoutDuration(username: String, currentAttempts: Int): Duration {
        if (!enableProgressiveLockout) {
            return Duration.parse(defaultLockoutDuration)
        }
        
        // Get historical lockout count
        val countKey = "$LOCKOUT_COUNT_PREFIX$username"
        val lockoutCount = redisTemplate.opsForValue().get(countKey)?.toIntOrNull() ?: 0
        
        // Calculate progressive duration
        return when {
            lockoutCount >= LockoutLevel.EXTENDED.threshold -> LockoutLevel.EXTENDED.duration
            lockoutCount >= LockoutLevel.FOURTH.threshold -> LockoutLevel.FOURTH.duration
            lockoutCount >= LockoutLevel.THIRD.threshold -> LockoutLevel.THIRD.duration
            lockoutCount >= LockoutLevel.SECOND.threshold -> LockoutLevel.SECOND.duration
            else -> LockoutLevel.FIRST.duration
        }
    }

    private fun handleIpBlocking(ipAddress: String, userAgent: String?) {
        val ipKey = "$IP_BLOCK_PREFIX$ipAddress:attempts"
        val attempts = redisTemplate.opsForValue().increment(ipKey) ?: 1
        
        // Set expiration for attempt counter
        if (attempts == 1L) {
            redisTemplate.expire(ipKey, Duration.parse(failedAttemptWindow))
        }
        
        // Block IP if too many attempts
        if (attempts >= maxIpFailedAttempts) {
            blockIp(ipAddress, Duration.parse(ipBlockDuration), "excessive_failed_attempts")
        }
    }

    private fun cleanupOldAttempts(historyKey: String, window: Duration) {
        try {
            val cutoffTime = Instant.now().minus(window).toEpochMilli()
            val attempts = redisTemplate.opsForList().range(historyKey, 0, -1) ?: emptyList()
            
            attempts.forEach { attempt ->
                val timestamp = attempt.split(":")[0].toLongOrNull()
                if (timestamp != null && timestamp < cutoffTime) {
                    redisTemplate.opsForList().remove(historyKey, 1, attempt)
                }
            }
        } catch (e: Exception) {
            logger.error("Error cleaning up old attempts for key: $historyKey", e)
        }
    }

    private fun countAttemptsInWindow(historyKey: String, window: Duration): Int {
        return try {
            val cutoffTime = Instant.now().minus(window).toEpochMilli()
            val attempts = redisTemplate.opsForList().range(historyKey, 0, -1) ?: emptyList()
            
            attempts.count { attempt ->
                val timestamp = attempt.split(":")[0].toLongOrNull()
                timestamp != null && timestamp >= cutoffTime
            }
        } catch (e: Exception) {
            logger.error("Error counting attempts in window for key: $historyKey", e)
            0
        }
    }

    private fun parseLockoutData(lockoutData: String): LockoutInfo {
        val parts = lockoutData.split(":")
        return LockoutInfo(
            lockedAt = if (parts.isNotEmpty()) Instant.ofEpochMilli(parts[0].toLong()) else null,
            lockedUntil = if (parts.size > 1) Instant.ofEpochMilli(parts[1].toLong()) else null,
            reason = if (parts.size > 2) parts[2] else null,
            lockedBy = if (parts.size > 3) parts[3] else null
        )
    }

    private data class LockoutInfo(
        val lockedAt: Instant?,
        val lockedUntil: Instant?,
        val reason: String?,
        val lockedBy: String?
    )
}