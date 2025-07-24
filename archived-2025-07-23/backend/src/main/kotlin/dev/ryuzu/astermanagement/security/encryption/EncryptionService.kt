package dev.ryuzu.astermanagement.security.encryption

/**
 * Service interface for encrypting and decrypting sensitive data.
 * Used for protecting TOTP secrets and other sensitive information in the database.
 */
interface EncryptionService {
    
    /**
     * Encrypt a plain text string.
     * 
     * @param plainText The text to encrypt
     * @return Encrypted text as Base64-encoded string
     * @throws EncryptionException if encryption fails
     */
    fun encrypt(plainText: String): String
    
    /**
     * Decrypt an encrypted string.
     * 
     * @param encryptedText Base64-encoded encrypted text
     * @return Decrypted plain text
     * @throws EncryptionException if decryption fails
     */
    fun decrypt(encryptedText: String): String
    
    /**
     * Encrypt raw bytes.
     * 
     * @param data The data to encrypt
     * @return Encrypted data
     * @throws EncryptionException if encryption fails
     */
    fun encryptBytes(data: ByteArray): ByteArray
    
    /**
     * Decrypt raw bytes.
     * 
     * @param encryptedData The encrypted data
     * @return Decrypted data
     * @throws EncryptionException if decryption fails
     */
    fun decryptBytes(encryptedData: ByteArray): ByteArray
    
    /**
     * Generate a new encryption key.
     * Useful for key rotation or initial setup.
     * 
     * @return Base64-encoded encryption key
     */
    fun generateKey(): String
    
    /**
     * Validate that the encryption service is properly configured.
     * 
     * @return true if the service is ready to use
     */
    fun isConfigured(): Boolean
}

/**
 * Exception thrown when encryption or decryption operations fail
 */
class EncryptionException(
    message: String, 
    cause: Throwable? = null
) : RuntimeException(message, cause)