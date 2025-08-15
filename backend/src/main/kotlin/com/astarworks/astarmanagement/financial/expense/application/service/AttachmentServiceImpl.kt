package com.astarworks.astarmanagement.modules.financial.expense.application.service

import com.astarworks.astarmanagement.modules.financial.expense.application.mapper.AttachmentMapper
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.Attachment
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.AttachmentStatus
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.InsufficientPermissionException
import com.astarworks.astarmanagement.modules.financial.expense.domain.repository.AttachmentRepository
import com.astarworks.astarmanagement.modules.financial.expense.domain.repository.ExpenseRepository
import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.AttachmentResponse
import com.astarworks.astarmanagement.modules.shared.infrastructure.security.SecurityContextService
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Implementation of AttachmentService with file handling and business logic.
 * 
 * This service handles attachment operations including:
 * - File upload and storage
 * - Attachment lifecycle management
 * - Security and access control
 * - Physical file cleanup
 */
@Service
class AttachmentServiceImpl(
    private val attachmentRepository: AttachmentRepository,
    private val expenseRepository: ExpenseRepository,
    private val attachmentMapper: AttachmentMapper,
    private val securityContextService: SecurityContextService
) : AttachmentService {
    
    companion object {
        private const val UPLOAD_DIR = "uploads"
        private const val MAX_FILE_SIZE = 10 * 1024 * 1024L // 10MB
        private const val TEMP_EXPIRY_HOURS = 24L
        
        private val ALLOWED_MIME_TYPES = setOf(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "text/plain",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    }
    
    @Transactional
    override fun upload(file: MultipartFile): AttachmentResponse {
        // Validate the upload
        val validation = validateUpload(file)
        if (!validation.isValid) {
            throw IllegalArgumentException("File validation failed: ${validation.errors.joinToString(", ")}")
        }
        
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        try {
            // Generate unique filename and storage path
            val fileExtension = getFileExtension(file.originalFilename ?: "")
            val uniqueFileName = "${UUID.randomUUID()}.$fileExtension"
            val storagePath = createStoragePath(tenantId, uniqueFileName)
            
            // Ensure upload directory exists
            Files.createDirectories(storagePath.parent)
            
            // Save file to storage
            Files.copy(file.inputStream, storagePath, StandardCopyOption.REPLACE_EXISTING)
            
            // Create attachment entity
            val attachment = Attachment(
                tenantId = tenantId,
                fileName = uniqueFileName,
                originalName = file.originalFilename ?: "unknown",
                fileSize = file.size,
                mimeType = file.contentType ?: "application/octet-stream",
                storagePath = storagePath.toString(),
                status = AttachmentStatus.TEMPORARY,
                linkedAt = null,
                expiresAt = Instant.now().plus(TEMP_EXPIRY_HOURS, ChronoUnit.HOURS),
                uploadedAt = Instant.now(),
                uploadedBy = userId
            )
            
            // Generate thumbnail for images
            if (attachment.isImage()) {
                generateThumbnail(attachment, storagePath)
            }
            
            val savedAttachment = attachmentRepository.save(attachment)
            return attachmentMapper.toResponse(savedAttachment)
            
        } catch (e: IOException) {
            throw RuntimeException("Failed to store file", e)
        }
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: UUID): AttachmentResponse? {
        val tenantId = securityContextService.requireCurrentTenantId()
        val attachment = attachmentRepository.findByIdAndTenantId(id, tenantId)
        return attachment?.let { attachmentMapper.toResponse(it) }
    }
    
    @Transactional(readOnly = true)
    override fun downloadFile(id: UUID): Pair<Resource, AttachmentResponse>? {
        val tenantId = securityContextService.requireCurrentTenantId()
        val attachment = attachmentRepository.findByIdAndTenantId(id, tenantId)
            ?: return null
        
        try {
            val filePath = Paths.get(attachment.storagePath)
            val resource = UrlResource(filePath.toUri())
            
            if (resource.exists() && resource.isReadable) {
                return Pair(resource, attachmentMapper.toResponse(attachment))
            } else {
                throw RuntimeException("File not found or not readable: ${attachment.fileName}")
            }
        } catch (e: Exception) {
            throw RuntimeException("Error accessing file", e)
        }
    }
    
    @Transactional
    override fun linkToExpense(attachmentId: UUID, expenseId: UUID) {
        val tenantId = securityContextService.requireCurrentTenantId()
        
        // Validate attachment exists and is accessible
        val attachment = attachmentRepository.findByIdAndTenantId(attachmentId, tenantId)
            ?: throw IllegalArgumentException("Attachment not found: $attachmentId")
        
        // Validate expense exists and is accessible
        val expense = expenseRepository.findByIdAndTenantId(expenseId, tenantId)
            ?: throw IllegalArgumentException("Expense not found: $expenseId")
        
        // Update attachment status to linked
        attachment.markAsLinked()
        attachmentRepository.save(attachment)
        
        // Note: The actual expense-attachment relationship would be handled
        // through the ExpenseAttachment entity relationship
    }
    
    @Transactional(readOnly = true)
    override fun findByExpenseId(expenseId: UUID): List<AttachmentResponse> {
        val tenantId = securityContextService.requireCurrentTenantId()
        
        // Validate expense exists and is accessible
        expenseRepository.findByIdAndTenantId(expenseId, tenantId)
            ?: throw IllegalArgumentException("Expense not found: $expenseId")
        
        val attachments = attachmentRepository.findByExpenseId(expenseId)
        return attachments.map { attachmentMapper.toResponse(it) }
    }
    
    @Transactional
    override fun delete(id: UUID) {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Find attachment with security check
        val attachment = attachmentRepository.findByIdAndTenantId(id, tenantId)
            ?: throw IllegalArgumentException("Attachment not found: $id")
        
        // Perform soft delete with business logic
        attachment.markDeleted(userId)
        
        // Save the soft-deleted attachment
        attachmentRepository.save(attachment)
        
        // Note: Physical file cleanup could be handled by a scheduled job
        // to avoid blocking the user request
    }
    
    @Transactional
    override fun cleanupExpiredTemporary(expiredBefore: Instant): Int {
        val expiredAttachments = attachmentRepository.findExpiredTemporary(expiredBefore)
        var cleanedCount = 0
        
        for (attachment in expiredAttachments) {
            try {
                // Delete physical file
                val filePath = Paths.get(attachment.storagePath)
                Files.deleteIfExists(filePath)
                
                // Delete thumbnail if exists
                attachment.thumbnailPath?.let { thumbnailPath ->
                    Files.deleteIfExists(Paths.get(thumbnailPath))
                }
                
                // Hard delete from database (or mark for cleanup)
                attachmentRepository.delete(attachment)
                cleanedCount++
                
            } catch (e: Exception) {
                // Log error but continue with other files
                println("Failed to cleanup attachment ${attachment.id}: ${e.message}")
            }
        }
        
        return cleanedCount
    }
    
    override fun validateUpload(file: MultipartFile): ValidationResult {
        val errors = mutableListOf<String>()
        
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            errors.add("File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB")
        }
        
        // Check if file is empty
        if (file.isEmpty) {
            errors.add("File is empty")
        }
        
        // Check MIME type
        val mimeType = file.contentType
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            errors.add("File type not allowed: $mimeType")
        }
        
        // Check filename
        val originalFilename = file.originalFilename
        if (originalFilename.isNullOrBlank()) {
            errors.add("Filename is required")
        } else if (originalFilename.contains("..")) {
            errors.add("Filename contains invalid characters")
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.valid()
        } else {
            ValidationResult.invalid(*errors.toTypedArray())
        }
    }
    
    @Transactional(readOnly = true)
    override fun generateDownloadUrl(id: UUID, expiresIn: Long): String? {
        val attachment = findById(id) ?: return null
        
        // In a real implementation, this would generate a signed URL
        // with expiration time. For now, return a simple URL.
        return "/api/v1/attachments/$id/download"
    }
    
    @Transactional(readOnly = true)
    override fun getThumbnail(id: UUID): Resource? {
        val tenantId = securityContextService.requireCurrentTenantId()
        val attachment = attachmentRepository.findByIdAndTenantId(id, tenantId)
            ?: return null
        
        if (!attachment.isImage() || attachment.thumbnailPath == null) {
            return null
        }
        
        try {
            val thumbnailPath = Paths.get(attachment.thumbnailPath!!)
            val resource = UrlResource(thumbnailPath.toUri())
            
            return if (resource.exists() && resource.isReadable) {
                resource
            } else {
                null
            }
        } catch (e: Exception) {
            return null
        }
    }
    
    private fun createStoragePath(tenantId: UUID, fileName: String): Path {
        val dateFolder = Instant.now().toString().substring(0, 10) // YYYY-MM-DD
        return Paths.get(UPLOAD_DIR, tenantId.toString(), dateFolder, fileName)
    }
    
    private fun getFileExtension(filename: String): String {
        val lastDot = filename.lastIndexOf('.')
        return if (lastDot >= 0) {
            filename.substring(lastDot + 1).lowercase()
        } else {
            "bin"
        }
    }
    
    private fun generateThumbnail(attachment: Attachment, originalPath: Path) {
        // This is a placeholder for thumbnail generation logic
        // In a real implementation, you would use a library like:
        // - Java's BufferedImage
        // - ImageIO
        // - Thumbnailator
        // - Or external services like ImageMagick
        
        try {
            val thumbnailDir = originalPath.parent.resolve("thumbnails")
            Files.createDirectories(thumbnailDir)
            
            val thumbnailFileName = "thumb_${attachment.fileName}"
            val thumbnailPath = thumbnailDir.resolve(thumbnailFileName)
            
            // Placeholder: copy original as thumbnail (in real implementation, resize it)
            Files.copy(originalPath, thumbnailPath, StandardCopyOption.REPLACE_EXISTING)
            
            // Update attachment with thumbnail info
            attachment.thumbnailPath = thumbnailPath.toString()
            attachment.thumbnailSize = Files.size(thumbnailPath)
            
        } catch (e: Exception) {
            // Thumbnail generation failed, but don't fail the upload
            println("Failed to generate thumbnail for ${attachment.fileName}: ${e.message}")
        }
    }
}