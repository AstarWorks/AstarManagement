package dev.ryuzu.astermanagement.auth.service

/**
 * Enumeration of possible JWT token validation results
 * 
 * Provides detailed information about why token validation failed,
 * enabling proper error handling and security audit logging.
 */
enum class TokenValidationResult {
    /**
     * Token is valid and can be used for authentication
     */
    VALID,
    
    /**
     * Token has expired (exp claim is before current time)
     */
    EXPIRED,
    
    /**
     * Token signature is invalid (token has been tampered with)
     */
    SIGNATURE_INVALID,
    
    /**
     * Token is malformed (cannot be decoded as JWT)
     */
    MALFORMED,
    
    /**
     * Token issuer doesn't match expected issuer
     */
    INVALID_ISSUER,
    
    /**
     * Token is missing required subject claim
     */
    MISSING_SUBJECT,
    
    /**
     * Token is invalid for other reasons
     */
    INVALID;
    
    /**
     * Check if this result indicates a valid token
     */
    val isValid: Boolean
        get() = this == VALID
    
    /**
     * Check if this result indicates an expired token
     */
    val isExpired: Boolean
        get() = this == EXPIRED
    
    /**
     * Get human-readable description of the validation result
     */
    val description: String
        get() = when (this) {
            VALID -> "Token is valid"
            EXPIRED -> "Token has expired"
            SIGNATURE_INVALID -> "Token signature is invalid"
            MALFORMED -> "Token is malformed"
            INVALID_ISSUER -> "Token issuer is invalid"
            MISSING_SUBJECT -> "Token is missing subject"
            INVALID -> "Token is invalid"
        }
}