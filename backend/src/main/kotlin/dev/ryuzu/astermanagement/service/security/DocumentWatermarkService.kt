package dev.ryuzu.astermanagement.service.security

import dev.ryuzu.astermanagement.domain.document.Document
import dev.ryuzu.astermanagement.domain.document.security.DocumentAccessLevel
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.security.audit.impl.SecurityAuditLogger
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.service.PermissionUtils
import dev.ryuzu.astermanagement.util.ClientInfoExtractor
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.awt.Color
import java.awt.Font
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import javax.imageio.ImageIO

/**
 * Service for applying watermarks to documents based on access level and user permissions
 * Provides different watermarking strategies for various document types and security levels
 */
@Service
class DocumentWatermarkService(
    private val permissionUtils: PermissionUtils,
    private val securityAuditLogger: SecurityAuditLogger,
    private val clientInfoExtractor: ClientInfoExtractor,
    @Value("\${app.watermark.enabled:true}") private val watermarkEnabled: Boolean,
    @Value("\${app.watermark.opacity:0.3}") private val defaultOpacity: Float,
    @Value("\${app.watermark.font-size:24}") private val defaultFontSize: Int
) {
    
    private val logger = LoggerFactory.getLogger(DocumentWatermarkService::class.java)
    
    /**
     * Check if a document should be watermarked for a specific user
     */
    fun shouldWatermark(document: Document, user: User): Boolean {
        if (!watermarkEnabled) return false
        
        // Check if user has watermark bypass permission
        if (hasWatermarkBypassPermission(user)) {
            return false
        }
        
        val accessLevel = determineDocumentAccessLevel(document)
        return accessLevel.requiresWatermark
    }
    
    /**
     * Apply watermark to document content (for PDF documents)
     * This is a basic implementation - in production, you'd use a PDF library like iText
     */
    fun applyPDFWatermark(
        documentContent: ByteArray,
        document: Document,
        user: User,
        ipAddress: String? = null
    ): ByteArray {
        try {
            if (!shouldWatermark(document, user)) {
                return documentContent
            }
            
            val watermarkText = generateWatermarkText(document, user)
            val opacity = calculateOpacity(document)
            
            // For now, return original content with logging
            // In production, implement PDF watermarking using iText library
            logWatermarkApplication(document, user, "PDF", watermarkText, ipAddress)
            
            // TODO: Implement actual PDF watermarking
            // val pdfDocument = PDDocument.load(ByteArrayInputStream(documentContent))
            // Apply watermark to each page
            // Return watermarked PDF bytes
            
            return documentContent
            
        } catch (e: Exception) {
            logger.error("Failed to apply PDF watermark to document ${document.id}", e)
            return documentContent
        }
    }
    
    /**
     * Apply watermark to image content
     */
    fun applyImageWatermark(
        imageContent: ByteArray,
        document: Document,
        user: User,
        ipAddress: String? = null
    ): ByteArray {
        try {
            if (!shouldWatermark(document, user)) {
                return imageContent
            }
            
            val watermarkText = generateWatermarkText(document, user)
            val opacity = calculateOpacity(document)
            
            val inputStream = ByteArrayInputStream(imageContent)
            val originalImage = ImageIO.read(inputStream)
            
            val watermarkedImage = addWatermarkToImage(originalImage, watermarkText, opacity)
            
            val outputStream = ByteArrayOutputStream()
            val formatName = getImageFormat(document.contentType)
            ImageIO.write(watermarkedImage, formatName, outputStream)
            
            val watermarkedBytes = outputStream.toByteArray()
            
            logWatermarkApplication(document, user, "IMAGE", watermarkText, ipAddress)
            
            return watermarkedBytes
            
        } catch (e: Exception) {
            logger.error("Failed to apply image watermark to document ${document.id}", e)
            return imageContent
        }
    }
    
    /**
     * Generate preview image with watermark for document thumbnails
     */
    fun generateWatermarkedPreview(
        document: Document,
        user: User,
        previewWidth: Int = 200,
        previewHeight: Int = 300
    ): ByteArray? {
        try {
            if (!shouldWatermark(document, user)) {
                return null
            }
            
            val watermarkText = generateWatermarkText(document, user)
            val previewImage = createDocumentPreview(document, previewWidth, previewHeight)
            val watermarkedPreview = addWatermarkToImage(previewImage, watermarkText, 0.5f)
            
            val outputStream = ByteArrayOutputStream()
            ImageIO.write(watermarkedPreview, "PNG", outputStream)
            
            return outputStream.toByteArray()
            
        } catch (e: Exception) {
            logger.error("Failed to generate watermarked preview for document ${document.id}", e)
            return null
        }
    }
    
    /**
     * Get watermark template for a specific access level
     */
    fun getWatermarkTemplate(accessLevel: DocumentAccessLevel): WatermarkTemplate {
        return when (accessLevel) {
            DocumentAccessLevel.PUBLIC -> WatermarkTemplate(
                text = null,
                opacity = 0.0f,
                color = Color.LIGHT_GRAY,
                fontSize = defaultFontSize,
                rotation = 0.0
            )
            DocumentAccessLevel.INTERNAL -> WatermarkTemplate(
                text = "INTERNAL USE ONLY",
                opacity = 0.2f,
                color = Color.GRAY,
                fontSize = defaultFontSize,
                rotation = -30.0
            )
            DocumentAccessLevel.CONFIDENTIAL -> WatermarkTemplate(
                text = "CONFIDENTIAL",
                opacity = 0.4f,
                color = Color.RED,
                fontSize = defaultFontSize + 4,
                rotation = -45.0
            )
            DocumentAccessLevel.RESTRICTED -> WatermarkTemplate(
                text = "RESTRICTED - ATTORNEY-CLIENT PRIVILEGE",
                opacity = 0.6f,
                color = Color.RED,
                fontSize = defaultFontSize + 2,
                rotation = -30.0
            )
        }
    }
    
    /**
     * Create custom watermark for specific user and document combination
     */
    fun createCustomWatermark(
        document: Document,
        user: User,
        customText: String? = null,
        includeTimestamp: Boolean = true,
        includeUserInfo: Boolean = true
    ): String {
        val accessLevel = determineDocumentAccessLevel(document)
        val baseTemplate = getWatermarkTemplate(accessLevel)
        
        val parts = mutableListOf<String>()
        
        // Add base watermark text if no custom text provided
        if (customText != null) {
            parts.add(customText)
        } else if (baseTemplate.text != null) {
            parts.add(baseTemplate.text)
        }
        
        // Add user information
        if (includeUserInfo) {
            parts.add("Accessed by: ${user.email}")
        }
        
        // Add timestamp
        if (includeTimestamp) {
            val timestamp = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
            parts.add("Downloaded: $timestamp")
        }
        
        return parts.joinToString(" | ")
    }
    
    // Private helper methods
    
    private fun hasWatermarkBypassPermission(user: User): Boolean {
        return permissionUtils.userRoleHasPermission(user.role, Permission.DOCUMENT_WATERMARK_BYPASS)
    }
    
    private fun determineDocumentAccessLevel(document: Document): DocumentAccessLevel {
        return DocumentAccessLevel.determineAccessLevel(
            isConfidential = document.isConfidential,
            hasPrivilegedTags = document.hasTag("privileged") || document.hasTag("attorney-client"),
            isClientDocument = document.matter != null
        )
    }
    
    private fun generateWatermarkText(document: Document, user: User): String {
        val accessLevel = determineDocumentAccessLevel(document)
        return createCustomWatermark(document, user)
    }
    
    private fun calculateOpacity(document: Document): Float {
        val accessLevel = determineDocumentAccessLevel(document)
        val template = getWatermarkTemplate(accessLevel)
        return template.opacity
    }
    
    private fun addWatermarkToImage(
        originalImage: BufferedImage,
        watermarkText: String,
        opacity: Float
    ): BufferedImage {
        val width = originalImage.width
        val height = originalImage.height
        
        val watermarkedImage = BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB)
        val graphics = watermarkedImage.createGraphics()
        
        // Enable anti-aliasing for better text quality
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON)
        
        // Draw the original image
        graphics.drawImage(originalImage, 0, 0, null)
        
        // Configure watermark appearance
        val font = Font("Arial", Font.BOLD, calculateFontSize(width, height))
        graphics.font = font
        graphics.color = Color(255, 0, 0, (255 * opacity).toInt()) // Red with specified opacity
        
        // Calculate text positioning
        val fontMetrics = graphics.fontMetrics
        val textWidth = fontMetrics.stringWidth(watermarkText)
        val textHeight = fontMetrics.height
        
        // Apply rotation for diagonal watermark
        graphics.rotate(Math.toRadians(-30.0), width / 2.0, height / 2.0)
        
        // Draw watermark text in multiple positions for coverage
        val positions = generateWatermarkPositions(width, height, textWidth, textHeight)
        positions.forEach { (x, y) ->
            graphics.drawString(watermarkText, x, y)
        }
        
        graphics.dispose()
        return watermarkedImage
    }
    
    private fun calculateFontSize(imageWidth: Int, imageHeight: Int): Int {
        val baseSize = minOf(imageWidth, imageHeight) / 20
        return maxOf(12, minOf(baseSize, 48)) // Between 12 and 48 pixels
    }
    
    private fun generateWatermarkPositions(
        width: Int,
        height: Int,
        textWidth: Int,
        textHeight: Int
    ): List<Pair<Int, Int>> {
        val positions = mutableListOf<Pair<Int, Int>>()
        val spacingX = textWidth + 100
        val spacingY = textHeight + 50
        
        var y = textHeight
        while (y < height) {
            var x = -textWidth / 2
            while (x < width) {
                positions.add(x to y)
                x += spacingX
            }
            y += spacingY
        }
        
        return positions
    }
    
    private fun createDocumentPreview(document: Document, width: Int, height: Int): BufferedImage {
        val preview = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
        val graphics = preview.createGraphics()
        
        // Create a simple document representation
        graphics.color = Color.WHITE
        graphics.fillRect(0, 0, width, height)
        
        graphics.color = Color.BLACK
        graphics.drawRect(0, 0, width - 1, height - 1)
        
        // Add document icon or content preview
        graphics.color = Color.DARK_GRAY
        val font = Font("Arial", Font.BOLD, 12)
        graphics.font = font
        
        val text = document.getDisplayTitle()
        val truncatedText = if (text.length > 20) text.substring(0, 17) + "..." else text
        graphics.drawString(truncatedText, 10, 25)
        
        graphics.dispose()
        return preview
    }
    
    private fun getImageFormat(contentType: String): String {
        return when (contentType.lowercase()) {
            "image/jpeg", "image/jpg" -> "JPEG"
            "image/png" -> "PNG"
            "image/gif" -> "GIF"
            "image/bmp" -> "BMP"
            else -> "PNG" // Default to PNG
        }
    }
    
    private fun logWatermarkApplication(
        document: Document,
        user: User,
        type: String,
        watermarkText: String,
        ipAddress: String?
    ) {
        try {
            securityAuditLogger.logDataAccess(
                userId = user.id!!.toString(),
                resourceType = "DOCUMENT",
                resourceId = document.id!!.toString(),
                action = "WATERMARK_APPLIED",
                ipAddress = ipAddress ?: "unknown",
                userAgent = null,
                additionalDetails = mapOf(
                    "watermarkType" to type,
                    "watermarkText" to watermarkText,
                    "documentTitle" to document.getDisplayTitle(),
                    "accessLevel" to determineDocumentAccessLevel(document).name
                )
            )
        } catch (e: Exception) {
            logger.warn("Failed to log watermark application", e)
        }
    }
}

/**
 * Template for watermark configuration
 */
data class WatermarkTemplate(
    val text: String?,
    val opacity: Float,
    val color: Color,
    val fontSize: Int,
    val rotation: Double
)