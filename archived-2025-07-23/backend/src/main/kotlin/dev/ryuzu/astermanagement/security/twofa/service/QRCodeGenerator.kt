package dev.ryuzu.astermanagement.security.twofa.service

/**
 * Service interface for generating QR codes.
 * Provides methods to create QR code images in various formats
 * for two-factor authentication setup.
 */
interface QRCodeGenerator {
    
    /**
     * Generate a QR code as a byte array (PNG format).
     * 
     * @param data The data to encode in the QR code
     * @param width Width of the QR code in pixels (default 300)
     * @param height Height of the QR code in pixels (default 300)
     * @return PNG image data as byte array
     */
    fun generateQRCode(
        data: String, 
        width: Int = 300, 
        height: Int = 300
    ): ByteArray
    
    /**
     * Generate a QR code as a Base64-encoded string.
     * Suitable for embedding directly in HTML/JSON responses.
     * 
     * @param data The data to encode in the QR code
     * @param width Width of the QR code in pixels (default 300)
     * @param height Height of the QR code in pixels (default 300)
     * @return Base64-encoded PNG image string
     */
    fun generateQRCodeBase64(
        data: String, 
        width: Int = 300, 
        height: Int = 300
    ): String
    
    /**
     * Generate a data URI for direct HTML embedding.
     * Returns a complete data:image/png;base64,... string.
     * 
     * @param data The data to encode in the QR code
     * @param width Width of the QR code in pixels (default 300)
     * @param height Height of the QR code in pixels (default 300)
     * @return Data URI string for direct HTML usage
     */
    fun generateQRCodeDataUri(
        data: String, 
        width: Int = 300, 
        height: Int = 300
    ): String
}