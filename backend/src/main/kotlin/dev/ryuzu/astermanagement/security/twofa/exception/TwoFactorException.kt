package dev.ryuzu.astermanagement.security.twofa.exception

/**
 * Base exception for two-factor authentication errors
 */
sealed class TwoFactorException(
    override val message: String,
    val errorCode: String
) : RuntimeException(message) {
    
    /**
     * Invalid TOTP or backup code provided
     */
    class InvalidCode(
        val remainingAttempts: Int? = null
    ) : TwoFactorException(
        message = "Invalid verification code",
        errorCode = "2FA_INVALID_CODE"
    )
    
    /**
     * Invalid backup code provided
     */
    class InvalidBackupCode(
        val remainingAttempts: Int? = null
    ) : TwoFactorException(
        message = "Invalid backup code",
        errorCode = "2FA_INVALID_BACKUP_CODE"
    )
    
    /**
     * Too many failed attempts - rate limited
     */
    class TooManyAttempts(
        val resetInSeconds: Long
    ) : TwoFactorException(
        message = "Too many failed attempts. Please try again later.",
        errorCode = "2FA_RATE_LIMITED"
    )
    
    /**
     * 2FA is not enabled for the user
     */
    class NotEnabled : TwoFactorException(
        message = "Two-factor authentication is not enabled",
        errorCode = "2FA_NOT_ENABLED"
    )
    
    /**
     * 2FA is already enabled for the user
     */
    class AlreadyEnabled : TwoFactorException(
        message = "Two-factor authentication is already enabled",
        errorCode = "2FA_ALREADY_ENABLED"
    )
    
    /**
     * 2FA setup has not been completed
     */
    class NotSetup : TwoFactorException(
        message = "Two-factor authentication has not been set up",
        errorCode = "2FA_NOT_SETUP"
    )
    
    /**
     * Invalid password provided for 2FA operations
     */
    class InvalidPassword : TwoFactorException(
        message = "Invalid password",
        errorCode = "2FA_INVALID_PASSWORD"
    )
    
    /**
     * User not found
     */
    class UserNotFound : TwoFactorException(
        message = "User not found",
        errorCode = "2FA_USER_NOT_FOUND"
    )
    
    /**
     * Invalid session token for 2FA verification
     */
    class InvalidSessionToken : TwoFactorException(
        message = "Invalid or expired session token",
        errorCode = "2FA_INVALID_SESSION"
    )
    
    /**
     * Generic 2FA configuration error
     */
    class ConfigurationError(
        override val message: String
    ) : TwoFactorException(
        message = message,
        errorCode = "2FA_CONFIG_ERROR"
    )
}