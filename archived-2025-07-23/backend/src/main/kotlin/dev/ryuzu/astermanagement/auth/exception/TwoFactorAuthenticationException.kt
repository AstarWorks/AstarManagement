package dev.ryuzu.astermanagement.auth.exception

import org.springframework.security.core.AuthenticationException

/**
 * Exception thrown when two-factor authentication is required or fails
 * 
 * Used to indicate that additional authentication steps are needed
 * or that 2FA verification has failed.
 */
class TwoFactorAuthenticationException(
    message: String,
    cause: Throwable? = null
) : AuthenticationException(message, cause) {

    companion object {
        fun required(userId: String): TwoFactorAuthenticationException = 
            TwoFactorAuthenticationException("Two-factor authentication required for user: $userId")
            
        fun invalidCode(): TwoFactorAuthenticationException = 
            TwoFactorAuthenticationException("Invalid two-factor authentication code")
            
        fun codeExpired(): TwoFactorAuthenticationException = 
            TwoFactorAuthenticationException("Two-factor authentication code has expired")
    }
}