package dev.ryuzu.astermanagement.auth.exception

import org.springframework.security.core.AuthenticationException

/**
 * Custom exception for JWT token-related errors
 * 
 * Provides detailed information about token validation failures
 * for proper error handling and security audit logging.
 */
class TokenException(
    val reason: Reason,
    message: String? = null,
    cause: Throwable? = null
) : AuthenticationException(message ?: reason.defaultMessage, cause) {

    enum class Reason(val defaultMessage: String) {
        EXPIRED("Token has expired"),
        INVALID_SIGNATURE("Token signature is invalid"),
        MALFORMED("Token is malformed"),
        BLACKLISTED("Token has been revoked"),
        INVALID("Token is invalid")
    }

    companion object {
        fun expired(message: String? = null): TokenException = 
            TokenException(Reason.EXPIRED, message)
            
        fun invalidSignature(message: String? = null): TokenException = 
            TokenException(Reason.INVALID_SIGNATURE, message)
            
        fun malformed(message: String? = null): TokenException = 
            TokenException(Reason.MALFORMED, message)
            
        fun blacklisted(message: String? = null): TokenException = 
            TokenException(Reason.BLACKLISTED, message)
            
        fun invalid(message: String? = null): TokenException = 
            TokenException(Reason.INVALID, message)
    }
}