package dev.ryuzu.astermanagement.security.twofa.service

import dev.ryuzu.astermanagement.security.twofa.dto.*
import java.util.*

/**
 * High-level service interface for managing two-factor authentication.
 * Coordinates between TOTP generation, QR codes, encryption, and persistence.
 */
interface TwoFactorAuthenticationService {
    
    /**
     * Setup 2FA for a user - generates secret and QR code.
     * Does not enable 2FA until verified.
     * 
     * @param userId The user's ID
     * @return Setup response with QR code and backup codes
     */
    fun setupTwoFactor(userId: UUID): TwoFactorSetupResponse
    
    /**
     * Enable 2FA after verifying the initial TOTP code.
     * 
     * @param userId The user's ID
     * @param code The TOTP code to verify
     * @return Success/failure response
     */
    fun enableTwoFactor(userId: UUID, code: String): TwoFactorEnableResponse
    
    /**
     * Disable 2FA for a user (requires password verification).
     * 
     * @param userId The user's ID
     * @param password User's password for verification
     * @return Success/failure response
     */
    fun disableTwoFactor(userId: UUID, password: String): TwoFactorDisableResponse
    
    /**
     * Verify a TOTP code during login.
     * 
     * @param userId The user's ID
     * @param code The TOTP code to verify
     * @return Verification result with tokens if successful
     */
    fun verifyTOTPCode(userId: UUID, code: String): TwoFactorVerificationResponse
    
    /**
     * Verify a backup code during login.
     * 
     * @param userId The user's ID
     * @param backupCode The backup code to verify
     * @return Verification result with tokens if successful
     */
    fun verifyBackupCode(userId: UUID, backupCode: String): TwoFactorVerificationResponse
    
    /**
     * Get current 2FA status for a user.
     * 
     * @param userId The user's ID
     * @return Current 2FA status
     */
    fun getTwoFactorStatus(userId: UUID): TwoFactorStatusResponse
    
    /**
     * Regenerate backup codes for a user.
     * 
     * @param userId The user's ID
     * @param password User's password for verification
     * @return New backup codes
     */
    fun regenerateBackupCodes(userId: UUID, password: String): BackupCodesResponse
    
    /**
     * Check if a user has 2FA enabled.
     * 
     * @param userId The user's ID
     * @return true if 2FA is enabled
     */
    fun isTwoFactorEnabled(userId: UUID): Boolean
    
    /**
     * Check if a user is rate limited from 2FA attempts.
     * 
     * @param userId The user's ID
     * @return true if rate limited
     */
    fun isRateLimited(userId: UUID): Boolean
    
    /**
     * Reset failed attempts for a user (admin function).
     * 
     * @param userId The user's ID
     */
    fun resetFailedAttempts(userId: UUID)
}