package dev.ryuzu.astermanagement.security.twofa.repository

import dev.ryuzu.astermanagement.security.twofa.entity.UserTwoFactor
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

/**
 * Repository interface for UserTwoFactor entity operations.
 * Provides methods for managing user two-factor authentication settings.
 */
@Repository
interface UserTwoFactorRepository : JpaRepository<UserTwoFactor, UUID> {

    /**
     * Find 2FA configuration by user ID
     */
    fun findByUserId(userId: UUID): UserTwoFactor?

    /**
     * Check if a user has 2FA configuration
     */
    fun existsByUserId(userId: UUID): Boolean

    /**
     * Check if a user has 2FA enabled
     */
    fun existsByUserIdAndEnabledTrue(userId: UUID): Boolean

    /**
     * Find all users with 2FA enabled
     */
    fun findByEnabledTrue(): List<UserTwoFactor>

    /**
     * Count users with 2FA enabled
     */
    fun countByEnabledTrue(): Long

    /**
     * Find users who haven't used 2FA recently
     */
    @Query("""
        SELECT u FROM UserTwoFactor u 
        WHERE u.enabled = true 
        AND (u.lastUsedAt IS NULL OR u.lastUsedAt < :threshold)
    """)
    fun findInactiveUsers(@Param("threshold") threshold: Instant): List<UserTwoFactor>

    /**
     * Find users with high failed attempt counts
     */
    @Query("""
        SELECT u FROM UserTwoFactor u 
        WHERE u.failedAttempts >= :minAttempts 
        AND u.lastFailedAttemptAt > :since
    """)
    fun findUsersWithFailedAttempts(
        @Param("minAttempts") minAttempts: Int,
        @Param("since") since: Instant
    ): List<UserTwoFactor>

    /**
     * Reset failed attempts for users outside the rate limit window
     */
    @Modifying
    @Query("""
        UPDATE UserTwoFactor u 
        SET u.failedAttempts = 0, u.lastFailedAttemptAt = null 
        WHERE u.failedAttempts > 0 
        AND u.lastFailedAttemptAt < :threshold
    """)
    fun resetExpiredFailedAttempts(@Param("threshold") threshold: Instant): Int

    /**
     * Find users with low backup codes remaining
     */
    @Query("""
        SELECT u FROM UserTwoFactor u 
        WHERE u.enabled = true 
        AND u.usedBackupCodesCount >= :minUsedCodes
    """)
    fun findUsersWithLowBackupCodes(@Param("minUsedCodes") minUsedCodes: Int = 6): List<UserTwoFactor>

    /**
     * Update last used timestamp
     */
    @Modifying
    @Query("""
        UPDATE UserTwoFactor u 
        SET u.lastUsedAt = :timestamp 
        WHERE u.userId = :userId
    """)
    fun updateLastUsed(
        @Param("userId") userId: UUID,
        @Param("timestamp") timestamp: Instant = Instant.now()
    )

    /**
     * Increment failed attempts
     */
    @Modifying
    @Query("""
        UPDATE UserTwoFactor u 
        SET u.failedAttempts = u.failedAttempts + 1, 
            u.lastFailedAttemptAt = :timestamp 
        WHERE u.userId = :userId
    """)
    fun incrementFailedAttempts(
        @Param("userId") userId: UUID,
        @Param("timestamp") timestamp: Instant = Instant.now()
    )

    /**
     * Reset failed attempts
     */
    @Modifying
    @Query("""
        UPDATE UserTwoFactor u 
        SET u.failedAttempts = 0, u.lastFailedAttemptAt = null 
        WHERE u.userId = :userId
    """)
    fun resetFailedAttempts(@Param("userId") userId: UUID)

    /**
     * Enable or disable 2FA for a user
     */
    @Modifying
    @Query("""
        UPDATE UserTwoFactor u 
        SET u.enabled = :enabled, u.updatedAt = :timestamp 
        WHERE u.userId = :userId
    """)
    fun setEnabled(
        @Param("userId") userId: UUID,
        @Param("enabled") enabled: Boolean,
        @Param("timestamp") timestamp: Instant = Instant.now()
    )

    /**
     * Update backup codes
     */
    @Modifying
    @Query("""
        UPDATE UserTwoFactor u 
        SET u.backupCodes = :backupCodes, 
            u.usedBackupCodesCount = 0, 
            u.updatedAt = :timestamp 
        WHERE u.userId = :userId
    """)
    fun updateBackupCodes(
        @Param("userId") userId: UUID,
        @Param("backupCodes") backupCodes: String,
        @Param("timestamp") timestamp: Instant = Instant.now()
    )

    /**
     * Increment used backup codes counter
     */
    @Modifying
    @Query("""
        UPDATE UserTwoFactor u 
        SET u.usedBackupCodesCount = u.usedBackupCodesCount + 1, 
            u.lastUsedAt = :timestamp 
        WHERE u.userId = :userId
    """)
    fun incrementUsedBackupCodes(
        @Param("userId") userId: UUID,
        @Param("timestamp") timestamp: Instant = Instant.now()
    )

    /**
     * Delete 2FA configuration for a user
     */
    fun deleteByUserId(userId: UUID)

    /**
     * Get 2FA usage statistics
     */
    @Query("""
        SELECT COUNT(u) as totalUsers,
               COUNT(CASE WHEN u.enabled = true THEN 1 END) as enabledUsers,
               COUNT(CASE WHEN u.lastUsedAt > :activeThreshold THEN 1 END) as activeUsers,
               AVG(u.failedAttempts) as avgFailedAttempts
        FROM UserTwoFactor u
    """)
    fun getTwoFactorStatistics(
        @Param("activeThreshold") activeThreshold: Instant
    ): TwoFactorStatistics

    /**
     * Projection interface for 2FA statistics
     */
    interface TwoFactorStatistics {
        val totalUsers: Long
        val enabledUsers: Long
        val activeUsers: Long
        val avgFailedAttempts: Double?

        fun getEnabledPercentage(): Double {
            return if (totalUsers > 0) {
                (enabledUsers.toDouble() / totalUsers.toDouble()) * 100.0
            } else {
                0.0
            }
        }

        fun getActivePercentage(): Double {
            return if (enabledUsers > 0) {
                (activeUsers.toDouble() / enabledUsers.toDouble()) * 100.0
            } else {
                0.0
            }
        }
    }
}