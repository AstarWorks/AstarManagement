package com.astarworks.astarmanagement.modules.financial.expense.application.service

import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.AttachmentResponse
import org.springframework.core.io.Resource
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.time.Instant
import java.util.UUID

/**
 * Service interface for attachment management operations.
 * 
 * This service handles file-related business logic including:
 * - File upload and validation
 * - Attachment lifecycle management (TEMPORARY → LINKED → DELETED)
 * - Security and access control
 * - Storage management and cleanup
 * - Thumbnail generation for images
 */
interface AttachmentService {
    
    /**
     * Uploads a new file attachment with validation and processing.
     * 
     * Validates file type, size, and content. Generates thumbnails for images,
     * stores file securely, and creates attachment metadata.
     * 
     * @param file The multipart file to upload
     * @return The attachment metadata response
     */
    @Transactional
    fun upload(file: MultipartFile): AttachmentResponse
    
    /**
     * Retrieves attachment metadata by ID with security checks.
     * 
     * Ensures the requesting user has access to the attachment
     * based on tenant isolation and ownership rules.
     * 
     * @param id The attachment ID
     * @return The attachment metadata or null if not found/accessible
     */
    @Transactional(readOnly = true)
    fun findById(id: UUID): AttachmentResponse?
    
    /**
     * Downloads the actual file content of an attachment.
     * 
     * Validates access permissions, handles various file types,
     * and provides appropriate content headers for browser handling.
     * 
     * @param id The attachment ID
     * @return The file resource with metadata
     */
    @Transactional(readOnly = true)
    fun downloadFile(id: UUID): Pair<Resource, AttachmentResponse>?
    
    /**
     * Links a temporary attachment to an expense.
     * 
     * Changes attachment status from TEMPORARY to LINKED,
     * removes expiration date, and establishes the relationship.
     * 
     * @param attachmentId The attachment ID to link
     * @param expenseId The expense ID to link to
     */
    @Transactional
    fun linkToExpense(attachmentId: UUID, expenseId: UUID)
    
    /**
     * Finds all attachments linked to a specific expense.
     * 
     * Returns attachments that are currently linked to the expense
     * and accessible to the requesting user.
     * 
     * @param expenseId The expense ID
     * @return List of linked attachment responses
     */
    @Transactional(readOnly = true)
    fun findByExpenseId(expenseId: UUID): List<AttachmentResponse>
    
    /**
     * Soft deletes an attachment with cleanup handling.
     * 
     * Marks attachment for deletion, schedules physical file cleanup,
     * and handles cascade rules for expense relationships.
     * 
     * @param id The attachment ID to delete
     */
    @Transactional
    fun delete(id: UUID)
    
    /**
     * Finds and cleans up expired temporary attachments.
     * 
     * This method is typically called by a scheduled job to clean up
     * temporary attachments that have exceeded their retention period.
     * 
     * @param expiredBefore Only process attachments expired before this time
     * @return Number of attachments cleaned up
     */
    @Transactional
    fun cleanupExpiredTemporary(expiredBefore: Instant): Int
    
    /**
     * Validates if a file upload is allowed based on business rules.
     * 
     * Checks file size limits, allowed MIME types, filename patterns,
     * and other security considerations.
     * 
     * @param file The file to validate
     * @return Validation result with any error messages
     */
    fun validateUpload(file: MultipartFile): ValidationResult
    
    /**
     * Generates a download URL for an attachment.
     * 
     * Creates a secure, time-limited URL for accessing the attachment
     * without requiring additional authentication.
     * 
     * @param id The attachment ID
     * @param expiresIn Duration until URL expires (in seconds)
     * @return The download URL or null if not accessible
     */
    @Transactional(readOnly = true)
    fun generateDownloadUrl(id: UUID, expiresIn: Long = 3600): String?
    
    /**
     * Gets the thumbnail resource for an image attachment.
     * 
     * Returns the generated thumbnail if available, or generates
     * one on-demand for supported image formats.
     * 
     * @param id The attachment ID
     * @return The thumbnail resource or null if not available
     */
    @Transactional(readOnly = true)
    fun getThumbnail(id: UUID): Resource?
}

/**
 * Result of file upload validation.
 */
data class ValidationResult(
    val isValid: Boolean,
    val errors: List<String> = emptyList()
) {
    companion object {
        fun valid() = ValidationResult(true)
        fun invalid(vararg errors: String) = ValidationResult(false, errors.toList())
    }
}