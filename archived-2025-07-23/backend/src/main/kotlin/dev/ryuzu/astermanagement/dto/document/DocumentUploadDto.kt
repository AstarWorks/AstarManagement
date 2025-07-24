package dev.ryuzu.astermanagement.dto.document

import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime
import java.util.*

/**
 * Internal request object for document upload
 */
data class DocumentUploadRequest(
    val file: MultipartFile,
    val matterId: UUID?,
    val description: String?,
    val tags: List<String>,
    val isPublic: Boolean
)

/**
 * Response for batch upload operations
 */
data class BatchUploadResponseDto(
    val totalFiles: Int,
    val successCount: Int,
    val failureCount: Int,
    val results: List<BatchUploadResultDto>
)

/**
 * Individual result for batch upload
 */
data class BatchUploadResultDto(
    val fileName: String,
    val success: Boolean,
    val documentId: UUID?,
    val error: String?
)

/**
 * Document upload progress tracking
 */
data class UploadProgressDto(
    val documentId: UUID,
    val fileName: String,
    val totalBytes: Long,
    val uploadedBytes: Long,
    val percentComplete: Int,
    val status: UploadStatus,
    val estimatedTimeRemaining: Long?, // seconds
    val message: String?
)

/**
 * Upload status enumeration
 */
enum class UploadStatus {
    PENDING,
    UPLOADING,
    PROCESSING,
    SCANNING,
    COMPLETED,
    FAILED
}

/**
 * Paged response for document search
 */
data class PagedDocumentResponseDto(
    val content: List<DocumentDto>,
    val totalElements: Long,
    val totalPages: Int,
    val number: Int,
    val size: Int,
    val first: Boolean,
    val last: Boolean
)

/**
 * Document version information
 */
data class DocumentVersionDto(
    val id: UUID,
    val fileId: String,
    val versionNumber: Int,
    val fileName: String,
    val fileSize: Long,
    val uploadedBy: String,
    val uploadedAt: LocalDateTime,
    val comment: String?,
    val downloadUrl: String
)

/**
 * File validation result
 */
data class ValidationResult(
    val isValid: Boolean,
    val errors: List<String> = emptyList()
)