package dev.ryuzu.astermanagement.security.twofa.entity

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import jakarta.persistence.*
import java.time.Instant
import java.util.*

/**
 * Entity representing user's two-factor authentication configuration.
 * Stores encrypted TOTP secret, backup codes, and 2FA status for each user.
 * 
 * This entity uses a one-to-one relationship with the User entity and stores
 * sensitive information like TOTP secrets in encrypted form for security.
 */
@Entity
@Table(
    name = "user_two_factor",
    indexes = [
        Index(name = "idx_two_factor_enabled", columnList = "enabled"),
        Index(name = "idx_two_factor_last_used", columnList = "last_used_at")
    ]
)
class UserTwoFactor : BaseEntity() {

    /**
     * Foreign key to the user this 2FA configuration belongs to.
     * Using UUID directly instead of entity reference to avoid circular dependencies.
     */
    @Column(name = "user_id", nullable = false, unique = true)
    var userId: UUID = UUID.randomUUID()

    /**
     * Encrypted TOTP secret key.
     * This is encrypted using AES-256 before storage and decrypted only when needed.
     * The raw secret is never exposed in logs or API responses.
     */
    @Column(name = "encrypted_secret", nullable = false, length = 500)
    var encryptedSecret: String = ""

    /**
     * Whether 2FA is currently enabled for this user.
     * When false, the user has set up 2FA but temporarily disabled it.
     */
    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = false

    /**
     * JSON array of hashed backup codes.
     * Each code is hashed with bcrypt and can only be used once.
     * Format: ["$2a$10$...", "$2a$10$...", ...]
     */
    @Column(name = "backup_codes", columnDefinition = "TEXT")
    var backupCodes: String? = null

    /**
     * Number of backup codes that have been used.
     * Used to track when user should be warned about regenerating codes.
     */
    @Column(name = "used_backup_codes_count", nullable = false)
    var usedBackupCodesCount: Int = 0

    /**
     * Timestamp when this 2FA was last successfully used.
     * Used for security monitoring and inactive 2FA warnings.
     */
    @Column(name = "last_used_at")
    var lastUsedAt: Instant? = null

    /**
     * Counter for failed verification attempts.
     * Reset on successful verification, used for rate limiting.
     */
    @Column(name = "failed_attempts", nullable = false)
    var failedAttempts: Int = 0

    /**
     * Timestamp of the last failed attempt.
     * Used with failedAttempts for rate limiting calculations.
     */
    @Column(name = "last_failed_attempt_at")
    var lastFailedAttemptAt: Instant? = null

    /**
     * Method used for 2FA (for future extensibility).
     * Currently only TOTP is supported.
     */
    @Column(name = "method", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    var method: TwoFactorMethod = TwoFactorMethod.TOTP

    /**
     * Additional configuration as JSON (for future extensibility).
     * Can store provider-specific settings or user preferences.
     */
    @Column(name = "configuration", columnDefinition = "TEXT")
    var configuration: String? = null

    /**
     * Update the last used timestamp
     */
    fun markAsUsed() {
        lastUsedAt = Instant.now()
        resetFailedAttempts()
    }

    /**
     * Increment failed attempts counter
     */
    fun incrementFailedAttempts() {
        failedAttempts++
        lastFailedAttemptAt = Instant.now()
    }

    /**
     * Reset failed attempts counter
     */
    fun resetFailedAttempts() {
        failedAttempts = 0
        lastFailedAttemptAt = null
    }

    /**
     * Check if the user is currently rate limited
     */
    fun isRateLimited(maxAttempts: Int = 5, windowMinutes: Long = 15): Boolean {
        if (failedAttempts < maxAttempts) return false
        
        val lastAttempt = lastFailedAttemptAt ?: return false
        val windowEnd = lastAttempt.plusSeconds(windowMinutes * 60)
        
        return Instant.now().isBefore(windowEnd)
    }

    /**
     * Get the remaining rate limit window in seconds
     */
    fun getRateLimitRemainingSeconds(windowMinutes: Long = 15): Long {
        val lastAttempt = lastFailedAttemptAt ?: return 0
        val windowEnd = lastAttempt.plusSeconds(windowMinutes * 60)
        val now = Instant.now()
        
        return if (now.isBefore(windowEnd)) {
            windowEnd.epochSecond - now.epochSecond
        } else {
            0
        }
    }

    /**
     * Mark a backup code as used (increment counter)
     */
    fun useBackupCode() {
        usedBackupCodesCount++
        markAsUsed()
    }

    /**
     * Check if user should be warned about low backup codes
     */
    fun shouldWarnAboutBackupCodes(totalCodes: Int = 8): Boolean {
        val remainingCodes = totalCodes - usedBackupCodesCount
        return remainingCodes <= 2
    }

    /**
     * Reset backup codes (when regenerating)
     */
    fun resetBackupCodes(newBackupCodes: String) {
        backupCodes = newBackupCodes
        usedBackupCodesCount = 0
    }

    companion object {
        /**
         * Create a new UserTwoFactor instance
         */
        fun create(
            userId: UUID,
            encryptedSecret: String,
            backupCodes: String? = null,
            enabled: Boolean = false
        ): UserTwoFactor {
            return UserTwoFactor().apply {
                this.userId = userId
                this.encryptedSecret = encryptedSecret
                this.backupCodes = backupCodes
                this.enabled = enabled
            }
        }
    }
}

/**
 * Enum representing supported two-factor authentication methods
 */
enum class TwoFactorMethod {
    /**
     * Time-based One-Time Password (Google Authenticator compatible)
     */
    TOTP,
    
    /**
     * SMS-based verification (future implementation)
     */
    SMS,
    
    /**
     * Email-based verification (future implementation)
     */
    EMAIL
}