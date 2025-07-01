package dev.ryuzu.astermanagement.security.twofa.service.impl

import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.WriterException
import com.google.zxing.client.j2se.MatrixToImageWriter
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import dev.ryuzu.astermanagement.security.twofa.service.QRCodeGenerator
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.util.*

/**
 * Implementation of QRCodeGenerator using Google's ZXing library.
 * Creates QR codes optimized for authenticator app scanning.
 */
@Service
class QRCodeGeneratorImpl : QRCodeGenerator {
    
    private val qrCodeWriter = QRCodeWriter()
    
    /**
     * Generate QR code as PNG byte array.
     * Uses high error correction level for better scanning reliability.
     */
    override fun generateQRCode(
        data: String, 
        width: Int, 
        height: Int
    ): ByteArray {
        try {
            // Configure QR code generation hints
            val hints = mutableMapOf<EncodeHintType, Any>()
            hints[EncodeHintType.ERROR_CORRECTION] = ErrorCorrectionLevel.H // High error correction
            hints[EncodeHintType.MARGIN] = 2 // Quiet zone border
            hints[EncodeHintType.CHARACTER_SET] = "UTF-8"
            
            // Generate QR code matrix
            val bitMatrix: BitMatrix = qrCodeWriter.encode(
                data,
                BarcodeFormat.QR_CODE,
                width,
                height,
                hints
            )
            
            // Convert to PNG image
            val outputStream = ByteArrayOutputStream()
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream)
            
            return outputStream.toByteArray()
        } catch (e: WriterException) {
            throw QRCodeGenerationException("Failed to generate QR code", e)
        } catch (e: Exception) {
            throw QRCodeGenerationException("Unexpected error during QR code generation", e)
        }
    }
    
    /**
     * Generate QR code as Base64-encoded string.
     * Suitable for JSON responses and direct HTML embedding.
     */
    override fun generateQRCodeBase64(
        data: String, 
        width: Int, 
        height: Int
    ): String {
        val qrCodeBytes = generateQRCode(data, width, height)
        return Base64.getEncoder().encodeToString(qrCodeBytes)
    }
    
    /**
     * Generate complete data URI for HTML img src attribute.
     * Format: data:image/png;base64,[base64-encoded-image]
     */
    override fun generateQRCodeDataUri(
        data: String, 
        width: Int, 
        height: Int
    ): String {
        val base64Image = generateQRCodeBase64(data, width, height)
        return "data:image/png;base64,$base64Image"
    }
    
    companion object {
        /**
         * Validate QR code data length.
         * QR codes have maximum capacity depending on content.
         */
        fun validateDataLength(data: String): Boolean {
            // For alphanumeric mode, QR code version 40 (largest) 
            // with error correction level H can store up to 1,273 characters
            return data.length <= 1000 // Conservative limit
        }
        
        /**
         * Validate dimensions are reasonable for QR code generation.
         */
        fun validateDimensions(width: Int, height: Int): Boolean {
            return width in 100..1000 && height in 100..1000
        }
    }
}

/**
 * Custom exception for QR code generation failures
 */
class QRCodeGenerationException(
    message: String, 
    cause: Throwable? = null
) : RuntimeException(message, cause)