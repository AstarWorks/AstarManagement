package dev.ryuzu.astermanagement.security.encryption.impl

import dev.ryuzu.astermanagement.security.encryption.EncryptionException
import dev.ryuzu.astermanagement.security.encryption.EncryptionService
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.util.*
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * AES-GCM encryption service implementation.
 * Uses AES-256-GCM for authenticated encryption with associated data.
 * 
 * Security features:
 * - AES-256 encryption
 * - GCM mode for authenticated encryption
 * - Random IV for each encryption
 * - Base64 encoding for storage
 */
@Service
class AESEncryptionService(
    @Value("\${app.security.encryption.key}")
    private val encryptionKeyBase64: String
) : EncryptionService {
    
    companion object {
        private const val ALGORITHM = "AES"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val KEY_SIZE = 256
        private const val GCM_IV_LENGTH = 12 // 96 bits
        private const val GCM_TAG_LENGTH = 128 // 128 bits
    }
    
    private val secretKey: SecretKey by lazy {
        try {
            val keyBytes = Base64.getDecoder().decode(encryptionKeyBase64)
            if (keyBytes.size * 8 != KEY_SIZE) {
                throw EncryptionException("Invalid key size. Expected $KEY_SIZE bits, got ${keyBytes.size * 8} bits")
            }
            SecretKeySpec(keyBytes, ALGORITHM)
        } catch (e: Exception) {
            throw EncryptionException("Failed to initialize encryption key", e)
        }
    }
    
    private val secureRandom = SecureRandom()
    
    /**
     * Encrypt plain text using AES-GCM.
     * Returns Base64 encoded string containing IV + ciphertext.
     */
    override fun encrypt(plainText: String): String {
        return try {
            val plainBytes = plainText.toByteArray(Charsets.UTF_8)
            val encryptedBytes = encryptBytes(plainBytes)
            Base64.getEncoder().encodeToString(encryptedBytes)
        } catch (e: Exception) {
            throw EncryptionException("Failed to encrypt text", e)
        }
    }
    
    /**
     * Decrypt Base64 encoded encrypted text.
     * Expects format: IV (12 bytes) + ciphertext (including auth tag).
     */
    override fun decrypt(encryptedText: String): String {
        return try {
            val encryptedBytes = Base64.getDecoder().decode(encryptedText)
            val decryptedBytes = decryptBytes(encryptedBytes)
            String(decryptedBytes, Charsets.UTF_8)
        } catch (e: Exception) {
            throw EncryptionException("Failed to decrypt text", e)
        }
    }
    
    /**
     * Encrypt byte array using AES-GCM.
     * Returns: IV (12 bytes) + ciphertext (including 16-byte auth tag).
     */
    override fun encryptBytes(data: ByteArray): ByteArray {
        return try {
            // Generate random IV
            val iv = ByteArray(GCM_IV_LENGTH)
            secureRandom.nextBytes(iv)
            
            // Initialize cipher
            val cipher = Cipher.getInstance(TRANSFORMATION)
            val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec)
            
            // Encrypt data
            val ciphertext = cipher.doFinal(data)
            
            // Combine IV and ciphertext
            val combined = ByteArray(iv.size + ciphertext.size)
            System.arraycopy(iv, 0, combined, 0, iv.size)
            System.arraycopy(ciphertext, 0, combined, iv.size, ciphertext.size)
            
            combined
        } catch (e: Exception) {
            throw EncryptionException("Failed to encrypt data", e)
        }
    }
    
    /**
     * Decrypt byte array encrypted with encryptBytes.
     * Expects: IV (12 bytes) + ciphertext (including auth tag).
     */
    override fun decryptBytes(encryptedData: ByteArray): ByteArray {
        return try {
            if (encryptedData.size < GCM_IV_LENGTH) {
                throw EncryptionException("Invalid encrypted data: too short")
            }
            
            // Extract IV
            val iv = ByteArray(GCM_IV_LENGTH)
            System.arraycopy(encryptedData, 0, iv, 0, GCM_IV_LENGTH)
            
            // Extract ciphertext
            val ciphertext = ByteArray(encryptedData.size - GCM_IV_LENGTH)
            System.arraycopy(encryptedData, GCM_IV_LENGTH, ciphertext, 0, ciphertext.size)
            
            // Initialize cipher
            val cipher = Cipher.getInstance(TRANSFORMATION)
            val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec)
            
            // Decrypt data
            cipher.doFinal(ciphertext)
        } catch (e: Exception) {
            throw EncryptionException("Failed to decrypt data", e)
        }
    }
    
    /**
     * Generate a new AES-256 key.
     * Returns Base64-encoded key suitable for configuration.
     */
    override fun generateKey(): String {
        return try {
            val keyGen = KeyGenerator.getInstance(ALGORITHM)
            keyGen.init(KEY_SIZE, secureRandom)
            val key = keyGen.generateKey()
            Base64.getEncoder().encodeToString(key.encoded)
        } catch (e: Exception) {
            throw EncryptionException("Failed to generate encryption key", e)
        }
    }
    
    /**
     * Validate encryption service configuration.
     * Performs a test encryption/decryption to ensure everything works.
     */
    override fun isConfigured(): Boolean {
        return try {
            val testData = "test_encryption_${System.currentTimeMillis()}"
            val encrypted = encrypt(testData)
            val decrypted = decrypt(encrypted)
            testData == decrypted
        } catch (e: Exception) {
            false
        }
    }
}