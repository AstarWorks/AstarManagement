package dev.ryuzu.astermanagement.security.twofa.dto

import com.fasterxml.jackson.annotation.JsonInclude
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

/**
 * Request to setup 2FA - no parameters needed, user is identified by auth token
 */
data class TwoFactorSetupRequest(
    val dummy: String? = null // Placeholder for future extensions
)

/**
 * Response containing QR code and backup codes for 2FA setup
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class TwoFactorSetupResponse(
    val qrCodeUrl: String,
    val qrCodeImage: String, // Base64 encoded PNG
    val backupCodes: List<String>,
    val secret: String? = null, // Only included in dev/test environments
    val message: String = "Please scan the QR code with your authenticator app"
)

/**
 * Request to enable 2FA with initial code verification
 */
data class TwoFactorEnableRequest(
    @field:NotBlank(message = "Verification code is required")
    @field:Pattern(regexp = "^\\d{6}$", message = "Code must be 6 digits")
    val code: String
)

/**
 * Response for 2FA enable operation
 */
data class TwoFactorEnableResponse(
    val success: Boolean,
    val message: String,
    val remainingBackupCodes: Int? = null
)

/**
 * Request to disable 2FA
 */
data class TwoFactorDisableRequest(
    @field:NotBlank(message = "Password is required")
    val password: String
)

/**
 * Response for 2FA disable operation
 */
data class TwoFactorDisableResponse(
    val success: Boolean,
    val message: String
)

/**
 * Request to verify TOTP code during login
 */
data class TwoFactorVerificationRequest(
    @field:NotBlank(message = "Code is required")
    @field:Size(min = 6, max = 8, message = "Invalid code length")
    val code: String,
    
    @field:NotBlank(message = "Session token is required")
    val sessionToken: String
)

/**
 * Request to verify backup code during login
 */
data class BackupCodeVerificationRequest(
    @field:NotBlank(message = "Backup code is required")
    @field:Pattern(
        regexp = "^[A-Z0-9]{4}-[A-Z0-9]{4}$", 
        message = "Invalid backup code format"
    )
    val backupCode: String,
    
    @field:NotBlank(message = "Session token is required")
    val sessionToken: String
)

/**
 * Response for 2FA verification (TOTP or backup code)
 */
data class TwoFactorVerificationResponse(
    val success: Boolean,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val message: String,
    val remainingBackupCodes: Int? = null,
    val shouldRegenerateBackupCodes: Boolean = false
)

/**
 * Request to get 2FA status - no parameters needed
 */
data class TwoFactorStatusRequest(
    val dummy: String? = null
)

/**
 * Response containing current 2FA status
 */
data class TwoFactorStatusResponse(
    val enabled: Boolean,
    val method: String = "TOTP",
    val lastUsed: Instant? = null,
    val backupCodesRemaining: Int? = null,
    val setupCompleted: Boolean,
    val rateLimited: Boolean = false,
    val rateLimitResetIn: Long? = null // seconds
)

/**
 * Request to regenerate backup codes
 */
data class RegenerateBackupCodesRequest(
    @field:NotBlank(message = "Password is required")
    val password: String
)

/**
 * Response containing new backup codes
 */
data class BackupCodesResponse(
    val backupCodes: List<String>,
    val generatedAt: Instant,
    val message: String = "Please store these codes safely. Each can only be used once."
)

/**
 * Error response for 2FA operations
 */
data class TwoFactorErrorResponse(
    val error: String,
    val message: String,
    val timestamp: Instant = Instant.now(),
    val remainingAttempts: Int? = null,
    val rateLimitResetIn: Long? = null // seconds
)

/**
 * Session token for partial authentication (after password, before 2FA)
 */
data class TwoFactorSessionToken(
    val userId: String,
    val email: String,
    val issuedAt: Instant,
    val expiresAt: Instant
)