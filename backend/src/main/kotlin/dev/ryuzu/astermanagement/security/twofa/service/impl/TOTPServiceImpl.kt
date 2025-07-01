package dev.ryuzu.astermanagement.security.twofa.service.impl

import com.warrenstrange.googleauth.GoogleAuthenticator
import com.warrenstrange.googleauth.GoogleAuthenticatorConfig
import com.warrenstrange.googleauth.GoogleAuthenticatorKey
import dev.ryuzu.astermanagement.security.twofa.service.TOTPService
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import java.util.concurrent.TimeUnit

/**
 * Implementation of TOTPService using Google Authenticator library.
 * Provides TOTP functionality compatible with Google Authenticator,
 * Microsoft Authenticator, and other RFC 6238 compliant apps.
 */
@Service
class TOTPServiceImpl(
    @Value("\${app.security.totp.issuer:AsterManagement}")
    private val issuer: String,
    
    @Value("\${app.security.totp.window-size:3}")
    private val windowSize: Int = 3,
    
    @Value("\${app.security.totp.code-digits:6}")
    private val codeDigits: Int = 6,
    
    @Value("\${app.security.totp.time-step-seconds:30}")
    private val timeStepSeconds: Long = 30
) : TOTPService {

    private val googleAuthenticator: GoogleAuthenticator
    private val secureRandom = SecureRandom()
    
    init {
        val config = GoogleAuthenticatorConfig.GoogleAuthenticatorConfigBuilder()
            .setWindowSize(windowSize) // Allow ±1 time window for clock drift
            .setCodeDigits(codeDigits) // 6-digit codes
            .setTimeStepSizeInMillis(TimeUnit.SECONDS.toMillis(timeStepSeconds))
            .build()
        
        googleAuthenticator = GoogleAuthenticator(config)
    }
    
    /**
     * Generate a new TOTP secret key.
     * Uses Google Authenticator's secure key generation.
     */
    override fun generateSecret(): String {
        val key: GoogleAuthenticatorKey = googleAuthenticator.createCredentials()
        return key.key
    }
    
    /**
     * Generate QR code URL in otpauth format.
     * Format: otpauth://totp/[issuer]:[account]?secret=[secret]&issuer=[issuer]
     */
    override fun generateQRCodeUrl(email: String, secret: String): String {
        val encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8)
        val encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8)
        
        return StringBuilder("otpauth://totp/")
            .append(encodedIssuer).append(":")
            .append(encodedEmail)
            .append("?secret=").append(secret)
            .append("&issuer=").append(encodedIssuer)
            .append("&algorithm=SHA1") // SHA1 for compatibility
            .append("&digits=").append(codeDigits)
            .append("&period=").append(timeStepSeconds)
            .toString()
    }
    
    /**
     * Validate TOTP code with time window tolerance.
     * Accepts codes from current window ± windowSize.
     */
    override fun validateCode(secret: String, code: String): Boolean {
        return try {
            val codeInt = code.toInt()
            googleAuthenticator.authorize(secret, codeInt)
        } catch (e: NumberFormatException) {
            false
        }
    }
    
    /**
     * Generate cryptographically secure backup codes.
     * Format: XXXX-XXXX (8 alphanumeric characters)
     */
    override fun generateBackupCodes(count: Int): List<String> {
        val codes = mutableListOf<String>()
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        
        repeat(count) {
            val code = StringBuilder()
            repeat(8) { i ->
                if (i == 4) code.append("-")
                code.append(chars[secureRandom.nextInt(chars.length)])
            }
            codes.add(code.toString())
        }
        
        return codes
    }
    
    /**
     * Get current TOTP code for testing/admin purposes.
     * Should not be exposed to regular users.
     */
    override fun getCurrentCode(secret: String): String {
        val code = googleAuthenticator.getTotpPassword(secret)
        return code.toString().padStart(codeDigits, '0')
    }
    
    /**
     * Calculate remaining seconds in current time window.
     * Useful for UI countdown displays.
     */
    override fun getRemainingSeconds(): Int {
        val currentTimeMillis = System.currentTimeMillis()
        val timeStepMillis = TimeUnit.SECONDS.toMillis(timeStepSeconds)
        val currentWindow = currentTimeMillis / timeStepMillis
        val nextWindowMillis = (currentWindow + 1) * timeStepMillis
        val remainingMillis = nextWindowMillis - currentTimeMillis
        
        return (remainingMillis / 1000).toInt()
    }
    
    companion object {
        /**
         * Validate that a string is a valid TOTP code format
         */
        fun isValidCodeFormat(code: String): Boolean {
            return code.matches(Regex("^\\d{6}$"))
        }
        
        /**
         * Validate that a string is a valid backup code format
         */
        fun isValidBackupCodeFormat(code: String): Boolean {
            return code.matches(Regex("^[A-Z0-9]{4}-[A-Z0-9]{4}$"))
        }
    }
}