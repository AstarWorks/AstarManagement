package dev.ryuzu.astermanagement.service

import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.time.Duration
import java.util.*
import java.util.concurrent.TimeUnit

/**
 * Two-Factor Authentication Service
 * 
 * Provides infrastructure for 2FA implementation including:
 * - TOTP (Time-based One-Time Password) generation
 * - SMS/Email OTP generation and validation
 * - Backup codes generation and management
 * - 2FA enrollment and verification workflows
 */
@Service
class TwoFactorAuthService(
    private val redisTemplate: RedisTemplate<String, String>
) {

    companion object {
        private const val OTP_PREFIX = "2fa_otp:"
        private const val BACKUP_CODES_PREFIX = "2fa_backup:"
        private const val ENROLLMENT_PREFIX = "2fa_enrollment:"
        private const val OTP_LENGTH = 6
        private const val OTP_EXPIRY_MINUTES = 5L
        private const val BACKUP_CODE_COUNT = 10
        private const val BACKUP_CODE_LENGTH = 8
    }

    private val secureRandom = SecureRandom()

    /**
     * Generates and stores OTP for user
     */
    fun generateOTP(userId: UUID, type: TwoFactorType): String {
        val otp = generateRandomOTP()
        val key = "$OTP_PREFIX${userId}_${type.name.lowercase()}"
        
        // Store OTP with expiration
        redisTemplate.opsForValue().set(key, otp, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES)
        
        return otp
    }

    /**
     * Validates OTP for user
     */
    fun validateOTP(userId: UUID, otp: String, type: TwoFactorType): Boolean {
        val key = "$OTP_PREFIX${userId}_${type.name.lowercase()}"
        val storedOtp = redisTemplate.opsForValue().get(key)
        
        if (storedOtp == otp) {
            // Remove OTP after successful validation (one-time use)
            redisTemplate.delete(key)
            return true
        }
        
        return false
    }

    /**
     * Generates backup codes for user
     */
    fun generateBackupCodes(userId: UUID): List<String> {
        val backupCodes = (1..BACKUP_CODE_COUNT).map {
            generateRandomBackupCode()
        }
        
        val key = "$BACKUP_CODES_PREFIX$userId"
        val codesJson = backupCodes.joinToString(",")
        
        // Store backup codes (no expiration)
        redisTemplate.opsForValue().set(key, codesJson)
        
        return backupCodes
    }

    /**
     * Validates and consumes backup code
     */
    fun validateBackupCode(userId: UUID, code: String): Boolean {
        val key = "$BACKUP_CODES_PREFIX$userId"
        val storedCodes = redisTemplate.opsForValue().get(key) ?: return false
        
        val codesList = storedCodes.split(",").toMutableList()
        
        if (codesList.contains(code)) {
            // Remove used backup code
            codesList.remove(code)
            val updatedCodes = codesList.joinToString(",")
            
            if (updatedCodes.isNotEmpty()) {
                redisTemplate.opsForValue().set(key, updatedCodes)
            } else {
                redisTemplate.delete(key)
            }
            
            return true
        }
        
        return false
    }

    /**
     * Gets remaining backup codes count
     */
    fun getRemainingBackupCodes(userId: UUID): Int {
        val key = "$BACKUP_CODES_PREFIX$userId"
        val storedCodes = redisTemplate.opsForValue().get(key) ?: return 0
        
        return storedCodes.split(",").filter { it.isNotBlank() }.size
    }

    /**
     * Starts 2FA enrollment process
     */
    fun startEnrollment(userId: UUID, type: TwoFactorType): TwoFactorEnrollment {
        val enrollmentId = UUID.randomUUID()
        val secret = generateSecret()
        
        val enrollment = TwoFactorEnrollment(
            enrollmentId = enrollmentId,
            userId = userId,
            type = type,
            secret = secret,
            isCompleted = false,
            createdAt = System.currentTimeMillis()
        )
        
        // Store enrollment data temporarily
        val key = "$ENROLLMENT_PREFIX$enrollmentId"
        val enrollmentData = mapOf(
            "userId" to userId.toString(),
            "type" to type.name,
            "secret" to secret,
            "isCompleted" to "false",
            "createdAt" to enrollment.createdAt.toString()
        )
        
        redisTemplate.opsForHash<String, String>().putAll(key, enrollmentData)
        redisTemplate.expire(key, Duration.ofMinutes(15)) // 15 minutes to complete enrollment
        
        return enrollment
    }

    /**
     * Completes 2FA enrollment
     */
    fun completeEnrollment(enrollmentId: UUID, verificationCode: String): Boolean {
        val key = "$ENROLLMENT_PREFIX$enrollmentId"
        val enrollmentData = redisTemplate.opsForHash<String, String>().entries(key)
        
        if (enrollmentData.isEmpty()) {
            return false
        }
        
        val userId = UUID.fromString(enrollmentData["userId"] ?: return false)
        val type = TwoFactorType.valueOf(enrollmentData["type"] ?: return false)
        
        // Validate the verification code
        val isValid = when (type) {
            TwoFactorType.EMAIL, TwoFactorType.SMS -> validateOTP(userId, verificationCode, type)
            TwoFactorType.TOTP -> validateTOTP(enrollmentData["secret"] ?: return false, verificationCode)
        }
        
        if (isValid) {
            // Mark enrollment as completed
            redisTemplate.opsForHash<String, String>().put(key, "isCompleted", "true")
            redisTemplate.expire(key, Duration.ofHours(1)) // Keep for audit purposes
            
            // TODO: Store 2FA configuration in database for the user
            // This would typically involve updating the user entity with 2FA settings
            
            return true
        }
        
        return false
    }

    /**
     * Checks if user has 2FA enabled
     */
    fun is2FAEnabled(userId: UUID): Boolean {
        // TODO: Check database for user's 2FA configuration
        // For now, return false as placeholder
        return false
    }

    /**
     * Gets user's 2FA methods
     */
    fun getUserTwoFactorMethods(userId: UUID): List<TwoFactorType> {
        // TODO: Retrieve from database
        // For now, return empty list as placeholder
        return emptyList()
    }

    /**
     * Disables 2FA for user
     */
    fun disable2FA(userId: UUID): Boolean {
        // Remove backup codes
        redisTemplate.delete("$BACKUP_CODES_PREFIX$userId")
        
        // Remove any pending OTPs
        TwoFactorType.values().forEach { type ->
            redisTemplate.delete("$OTP_PREFIX${userId}_${type.name.lowercase()}")
        }
        
        // TODO: Update database to disable 2FA for user
        
        return true
    }

    /**
     * Generates random OTP
     */
    private fun generateRandomOTP(): String {
        val otp = StringBuilder()
        repeat(OTP_LENGTH) {
            otp.append(secureRandom.nextInt(10))
        }
        return otp.toString()
    }

    /**
     * Generates random backup code
     */
    private fun generateRandomBackupCode(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        val code = StringBuilder()
        repeat(BACKUP_CODE_LENGTH) {
            code.append(chars[secureRandom.nextInt(chars.length)])
        }
        return code.toString()
    }

    /**
     * Generates secret for TOTP
     */
    private fun generateSecret(): String {
        val bytes = ByteArray(20)
        secureRandom.nextBytes(bytes)
        return Base64.getEncoder().encodeToString(bytes)
    }

    /**
     * Validates TOTP code (placeholder implementation)
     */
    private fun validateTOTP(secret: String, code: String): Boolean {
        // TODO: Implement actual TOTP validation using secret
        // This would typically use libraries like Google Authenticator compatible TOTP
        return code.length == 6 && code.all { it.isDigit() }
    }
}

/**
 * Two-Factor Authentication types
 */
enum class TwoFactorType {
    EMAIL,
    SMS,
    TOTP // Time-based One-Time Password (Google Authenticator, etc.)
}

/**
 * Two-Factor Authentication enrollment data
 */
data class TwoFactorEnrollment(
    val enrollmentId: UUID,
    val userId: UUID,
    val type: TwoFactorType,
    val secret: String,
    val isCompleted: Boolean,
    val createdAt: Long
)