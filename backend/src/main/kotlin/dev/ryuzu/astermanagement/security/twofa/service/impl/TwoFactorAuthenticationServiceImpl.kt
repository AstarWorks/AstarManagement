package dev.ryuzu.astermanagement.security.twofa.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.security.encryption.EncryptionService
import dev.ryuzu.astermanagement.security.twofa.dto.*
import dev.ryuzu.astermanagement.security.twofa.entity.UserTwoFactor
import dev.ryuzu.astermanagement.security.twofa.exception.TwoFactorException
import dev.ryuzu.astermanagement.security.twofa.repository.UserTwoFactorRepository
import dev.ryuzu.astermanagement.security.twofa.service.QRCodeGenerator
import dev.ryuzu.astermanagement.security.twofa.service.TOTPService
import dev.ryuzu.astermanagement.security.twofa.service.TwoFactorAuthenticationService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

/**
 * Implementation of TwoFactorAuthenticationService.
 * Manages the complete 2FA lifecycle including setup, verification, and management.
 */
@Service
@Transactional
class TwoFactorAuthenticationServiceImpl(
    private val totpService: TOTPService,
    private val qrCodeGenerator: QRCodeGenerator,
    private val encryptionService: EncryptionService,
    private val userTwoFactorRepository: UserTwoFactorRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val objectMapper: ObjectMapper,
    
    @Value("\${app.security.totp.backup-codes-count:8}")
    private val backupCodesCount: Int = 8,
    
    @Value("\${app.security.totp.rate-limit.max-attempts:5}")
    private val maxAttempts: Int = 5,
    
    @Value("\${app.security.totp.rate-limit.window-minutes:15}")
    private val rateLimitWindowMinutes: Long = 15,
    
    @Value("\${app.security.totp.show-secret:false}")
    private val showSecretInResponse: Boolean = false
) : TwoFactorAuthenticationService {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Setup 2FA for a user - generates secret and QR code.
     */
    override fun setupTwoFactor(userId: UUID): TwoFactorSetupResponse {
        logger.info("Setting up 2FA for user: $userId")
        
        // Check if user already has 2FA
        val existing = userTwoFactorRepository.findByUserId(userId)
        if (existing?.enabled == true) {
            throw TwoFactorException.AlreadyEnabled()
        }
        
        // Get user email for QR code
        val user = userRepository.findById(userId).orElseThrow {
            TwoFactorException.UserNotFound()
        }
        
        // Generate new secret
        val secret = totpService.generateSecret()
        val encryptedSecret = encryptionService.encrypt(secret)
        
        // Generate backup codes
        val backupCodes = totpService.generateBackupCodes(backupCodesCount)
        val hashedBackupCodes = backupCodes.map { code ->
            passwordEncoder.encode(code)
        }
        val backupCodesJson = objectMapper.writeValueAsString(hashedBackupCodes)
        
        // Save or update 2FA configuration (not enabled yet)
        val twoFactor = existing ?: UserTwoFactor()
        twoFactor.apply {
            this.userId = userId
            this.encryptedSecret = encryptedSecret
            this.backupCodes = backupCodesJson
            this.enabled = false
            this.usedBackupCodesCount = 0
            this.resetFailedAttempts()
        }
        userTwoFactorRepository.save(twoFactor)
        
        // Generate QR code
        val qrCodeUrl = totpService.generateQRCodeUrl(user.email, secret)
        val qrCodeImage = qrCodeGenerator.generateQRCodeBase64(qrCodeUrl)
        
        logger.info("2FA setup completed for user: $userId")
        
        return TwoFactorSetupResponse(
            qrCodeUrl = qrCodeUrl,
            qrCodeImage = qrCodeImage,
            backupCodes = backupCodes,
            secret = if (showSecretInResponse) secret else null
        )
    }
    
    /**
     * Enable 2FA after verifying the initial TOTP code.
     */
    override fun enableTwoFactor(userId: UUID, code: String): TwoFactorEnableResponse {
        logger.info("Enabling 2FA for user: $userId")
        
        val twoFactor = userTwoFactorRepository.findByUserId(userId)
            ?: throw TwoFactorException.NotSetup()
        
        if (twoFactor.enabled) {
            throw TwoFactorException.AlreadyEnabled()
        }
        
        // Decrypt secret and verify code
        val secret = encryptionService.decrypt(twoFactor.encryptedSecret)
        if (!totpService.validateCode(secret, code)) {
            logger.warn("Invalid 2FA code during enable for user: $userId")
            throw TwoFactorException.InvalidCode()
        }
        
        // Enable 2FA
        twoFactor.enabled = true
        twoFactor.markAsUsed()
        userTwoFactorRepository.save(twoFactor)
        
        logger.info("2FA enabled successfully for user: $userId")
        
        return TwoFactorEnableResponse(
            success = true,
            message = "Two-factor authentication has been enabled",
            remainingBackupCodes = backupCodesCount
        )
    }
    
    /**
     * Disable 2FA for a user (requires password verification).
     */
    override fun disableTwoFactor(userId: UUID, password: String): TwoFactorDisableResponse {
        logger.info("Disabling 2FA for user: $userId")
        
        val twoFactor = userTwoFactorRepository.findByUserId(userId)
            ?: throw TwoFactorException.NotEnabled()
        
        if (!twoFactor.enabled) {
            throw TwoFactorException.NotEnabled()
        }
        
        // Verify user password
        val user = userRepository.findById(userId).orElseThrow {
            TwoFactorException.UserNotFound()
        }
        
        if (!passwordEncoder.matches(password, user.password)) {
            logger.warn("Invalid password during 2FA disable for user: $userId")
            throw TwoFactorException.InvalidPassword()
        }
        
        // Delete 2FA configuration
        userTwoFactorRepository.delete(twoFactor)
        
        logger.info("2FA disabled successfully for user: $userId")
        
        return TwoFactorDisableResponse(
            success = true,
            message = "Two-factor authentication has been disabled"
        )
    }
    
    /**
     * Verify a TOTP code during login.
     */
    override fun verifyTOTPCode(userId: UUID, code: String): TwoFactorVerificationResponse {
        logger.debug("Verifying TOTP code for user: $userId")
        
        val twoFactor = userTwoFactorRepository.findByUserId(userId)
            ?: throw TwoFactorException.NotEnabled()
        
        if (!twoFactor.enabled) {
            throw TwoFactorException.NotEnabled()
        }
        
        // Check rate limiting
        if (twoFactor.isRateLimited(maxAttempts, rateLimitWindowMinutes)) {
            val remainingSeconds = twoFactor.getRateLimitRemainingSeconds(rateLimitWindowMinutes)
            logger.warn("User $userId is rate limited. Reset in $remainingSeconds seconds")
            throw TwoFactorException.TooManyAttempts(remainingSeconds)
        }
        
        // Decrypt secret and verify code
        val secret = encryptionService.decrypt(twoFactor.encryptedSecret)
        if (!totpService.validateCode(secret, code)) {
            twoFactor.incrementFailedAttempts()
            userTwoFactorRepository.save(twoFactor)
            
            val remainingAttempts = maxAttempts - twoFactor.failedAttempts
            logger.warn("Invalid TOTP code for user: $userId. Remaining attempts: $remainingAttempts")
            
            throw TwoFactorException.InvalidCode(remainingAttempts)
        }
        
        // Success - update last used
        twoFactor.markAsUsed()
        userTwoFactorRepository.save(twoFactor)
        
        logger.info("TOTP verification successful for user: $userId")
        
        return TwoFactorVerificationResponse(
            success = true,
            message = "Verification successful",
            remainingBackupCodes = backupCodesCount - twoFactor.usedBackupCodesCount,
            shouldRegenerateBackupCodes = twoFactor.shouldWarnAboutBackupCodes(backupCodesCount)
        )
    }
    
    /**
     * Verify a backup code during login.
     */
    override fun verifyBackupCode(userId: UUID, backupCode: String): TwoFactorVerificationResponse {
        logger.debug("Verifying backup code for user: $userId")
        
        val twoFactor = userTwoFactorRepository.findByUserId(userId)
            ?: throw TwoFactorException.NotEnabled()
        
        if (!twoFactor.enabled) {
            throw TwoFactorException.NotEnabled()
        }
        
        // Check rate limiting
        if (twoFactor.isRateLimited(maxAttempts, rateLimitWindowMinutes)) {
            val remainingSeconds = twoFactor.getRateLimitRemainingSeconds(rateLimitWindowMinutes)
            logger.warn("User $userId is rate limited. Reset in $remainingSeconds seconds")
            throw TwoFactorException.TooManyAttempts(remainingSeconds)
        }
        
        // Get hashed backup codes
        val hashedBackupCodes = objectMapper.readValue(
            twoFactor.backupCodes ?: "[]",
            List::class.java
        ) as List<String>
        
        // Find matching backup code
        val matchingCode = hashedBackupCodes.find { hashedCode ->
            passwordEncoder.matches(backupCode.uppercase(), hashedCode)
        }
        
        if (matchingCode == null) {
            twoFactor.incrementFailedAttempts()
            userTwoFactorRepository.save(twoFactor)
            
            val remainingAttempts = maxAttempts - twoFactor.failedAttempts
            logger.warn("Invalid backup code for user: $userId. Remaining attempts: $remainingAttempts")
            
            throw TwoFactorException.InvalidBackupCode(remainingAttempts)
        }
        
        // Remove used backup code
        val updatedCodes = hashedBackupCodes.filter { it != matchingCode }
        twoFactor.backupCodes = objectMapper.writeValueAsString(updatedCodes)
        twoFactor.useBackupCode()
        userTwoFactorRepository.save(twoFactor)
        
        logger.info("Backup code verification successful for user: $userId")
        
        return TwoFactorVerificationResponse(
            success = true,
            message = "Verification successful",
            remainingBackupCodes = updatedCodes.size,
            shouldRegenerateBackupCodes = updatedCodes.size <= 2
        )
    }
    
    /**
     * Get current 2FA status for a user.
     */
    override fun getTwoFactorStatus(userId: UUID): TwoFactorStatusResponse {
        val twoFactor = userTwoFactorRepository.findByUserId(userId)
        
        return if (twoFactor == null) {
            TwoFactorStatusResponse(
                enabled = false,
                setupCompleted = false
            )
        } else {
            val rateLimited = twoFactor.isRateLimited(maxAttempts, rateLimitWindowMinutes)
            TwoFactorStatusResponse(
                enabled = twoFactor.enabled,
                method = twoFactor.method.name,
                lastUsed = twoFactor.lastUsedAt,
                backupCodesRemaining = if (twoFactor.enabled) {
                    backupCodesCount - twoFactor.usedBackupCodesCount
                } else null,
                setupCompleted = true,
                rateLimited = rateLimited,
                rateLimitResetIn = if (rateLimited) {
                    twoFactor.getRateLimitRemainingSeconds(rateLimitWindowMinutes)
                } else null
            )
        }
    }
    
    /**
     * Regenerate backup codes for a user.
     */
    override fun regenerateBackupCodes(userId: UUID, password: String): BackupCodesResponse {
        logger.info("Regenerating backup codes for user: $userId")
        
        val twoFactor = userTwoFactorRepository.findByUserId(userId)
            ?: throw TwoFactorException.NotEnabled()
        
        if (!twoFactor.enabled) {
            throw TwoFactorException.NotEnabled()
        }
        
        // Verify user password
        val user = userRepository.findById(userId).orElseThrow {
            TwoFactorException.UserNotFound()
        }
        
        if (!passwordEncoder.matches(password, user.password)) {
            logger.warn("Invalid password during backup code regeneration for user: $userId")
            throw TwoFactorException.InvalidPassword()
        }
        
        // Generate new backup codes
        val backupCodes = totpService.generateBackupCodes(backupCodesCount)
        val hashedBackupCodes = backupCodes.map { code ->
            passwordEncoder.encode(code)
        }
        
        // Update backup codes
        twoFactor.resetBackupCodes(objectMapper.writeValueAsString(hashedBackupCodes))
        userTwoFactorRepository.save(twoFactor)
        
        logger.info("Backup codes regenerated successfully for user: $userId")
        
        return BackupCodesResponse(
            backupCodes = backupCodes,
            generatedAt = Instant.now()
        )
    }
    
    /**
     * Check if a user has 2FA enabled.
     */
    override fun isTwoFactorEnabled(userId: UUID): Boolean {
        return userTwoFactorRepository.existsByUserIdAndEnabledTrue(userId)
    }
    
    /**
     * Check if a user is rate limited from 2FA attempts.
     */
    override fun isRateLimited(userId: UUID): Boolean {
        val twoFactor = userTwoFactorRepository.findByUserId(userId)
        return twoFactor?.isRateLimited(maxAttempts, rateLimitWindowMinutes) ?: false
    }
    
    /**
     * Reset failed attempts for a user (admin function).
     */
    override fun resetFailedAttempts(userId: UUID) {
        logger.info("Resetting failed attempts for user: $userId")
        userTwoFactorRepository.resetFailedAttempts(userId)
    }
}