package dev.ryuzu.astermanagement.modules.document.api.dto

import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.util.*

/**
 * Public API DTO for Document entity
 */
data class DocumentDTO(
    val id: UUID,
    val fileId: String,
    val fileName: String,
    val originalFileName: String,
    val contentType: String,
    val fileSize: Long,
    val status: DocumentStatusDTO,
    val description: String?,
    val tags: Set<String>,
    val matterId: UUID?,
    val uploadedBy: UUID,
    val uploadedByName: String?,
    val categoryId: UUID?,
    val categoryName: String?,
    val categoryPath: String?,
    val isPublic: Boolean,
    val isConfidential: Boolean,
    val title: String?,
    val versionNumber: Int,
    val parentDocumentId: UUID?,
    val hasVersions: Boolean,
    val extractedText: String?,
    val pageCount: Int?,
    val wordCount: Int?,
    val checksum: String?,
    val virusScanResult: String?,
    val virusScanDate: OffsetDateTime?,
    val expiresAt: OffsetDateTime?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

/**
 * Request DTO for uploading a new document
 */
data class CreateDocumentRequest(
    val description: String? = null,
    val matterId: UUID? = null,
    val categoryId: UUID? = null,
    val tags: Set<String> = emptySet(),
    val isPublic: Boolean = false,
    val isConfidential: Boolean = false,
    val title: String? = null,
    val expiresAt: OffsetDateTime? = null
)

/**
 * Request DTO for updating document metadata
 */
data class UpdateDocumentRequest(
    val description: String? = null,
    val title: String? = null,
    val tags: Set<String>? = null,
    val categoryId: UUID? = null,
    val isPublic: Boolean? = null,
    val isConfidential: Boolean? = null,
    val expiresAt: OffsetDateTime? = null
)

/**
 * Document status for API
 */
enum class DocumentStatusDTO {
    PENDING,
    UPLOADING,
    SCANNING,
    AVAILABLE,
    QUARANTINED,
    DELETED,
    FAILED;
    
    val displayName: String
        get() = name.lowercase().replaceFirstChar { it.uppercase() }
}

/**
 * Document category DTO
 */
data class DocumentCategoryDTO(
    val id: UUID,
    val name: String,
    val description: String?,
    val path: String,
    val parentId: UUID?,
    val isSystem: Boolean,
    val documentCount: Long? = null
)

/**
 * Document tag DTO
 */
data class DocumentTagDTO(
    val id: UUID,
    val name: String,
    val description: String?,
    val color: String?,
    val isSystem: Boolean,
    val documentCount: Long? = null
)

/**
 * Document-Matter association request
 */
data class DocumentMatterAssociationRequest(
    val documentId: UUID,
    val matterId: UUID,
    val associationType: String? = "attachment" // attachment, evidence, correspondence, etc.
)