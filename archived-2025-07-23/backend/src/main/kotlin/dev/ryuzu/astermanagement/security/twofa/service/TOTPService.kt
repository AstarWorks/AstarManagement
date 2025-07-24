package dev.ryuzu.astermanagement.security.twofa.service

/**
 * Service interface for Time-based One-Time Password (TOTP) operations.
 * Provides methods for generating secrets, validating codes, and creating QR codes
 * compatible with Google Authenticator and similar apps.
 */
interface TOTPService {
    
    /**
     * Generate a new TOTP secret key.
     * The secret should be a base32-encoded string suitable for authenticator apps.
     * 
     * @return A randomly generated base32-encoded secret key
     */
    fun generateSecret(): String
    
    /**
     * Generate a QR code URL for authenticator app setup.
     * The URL follows the otpauth format standard.
     * 
     * @param email User's email address for identification
     * @param secret The TOTP secret key
     * @return otpauth:// URL string for QR code generation
     */
    fun generateQRCodeUrl(email: String, secret: String): String
    
    /**
     * Validate a TOTP code against a secret.
     * Allows for time window variance to handle clock drift.
     * 
     * @param secret The user's TOTP secret key
     * @param code The 6-digit code to validate
     * @return true if the code is valid, false otherwise
     */
    fun validateCode(secret: String, code: String): Boolean
    
    /**
     * Generate a set of backup codes for account recovery.
     * Each code should be unique and cryptographically secure.
     * 
     * @param count Number of backup codes to generate (default 8)
     * @return List of backup codes in XXXX-XXXX format
     */
    fun generateBackupCodes(count: Int = 8): List<String>
    
    /**
     * Get the current TOTP code for a secret.
     * Useful for testing and administrative purposes.
     * 
     * @param secret The TOTP secret key
     * @return The current 6-digit TOTP code
     */
    fun getCurrentCode(secret: String): String
    
    /**
     * Get the remaining seconds for the current TOTP window.
     * Useful for displaying countdown in UI.
     * 
     * @return Seconds remaining until the next code generation
     */
    fun getRemainingSeconds(): Int
}