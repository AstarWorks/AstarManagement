package dev.ryuzu.astermanagement.dto.document

import dev.ryuzu.astermanagement.modules.document.domain.Document
import dev.ryuzu.astermanagement.modules.document.domain.DocumentStatus
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.util.*

/**
 * Data transfer object for Document entity
 */
data class DocumentDto(
    val id: UUID,
    val fileId: String,
    val fileName: String,
    val originalFileName: String,
    val contentType: String,
    val fileSize: Long,
    val status: DocumentStatus,
    val matterId: UUID?,
    val matterTitle: String?,
    val description: String?,
    val tags: List<String>,
    val uploadedBy: String,
    val uploadedAt: LocalDateTime,
    val virusScanResult: String?,
    val virusScanDate: OffsetDateTime?,
    val downloadUrl: String,
    val thumbnailUrl: String?,
    val isPublic: Boolean,
    val expiresAt: OffsetDateTime?,
    val versionNumber: Int,
    val hasVersions: Boolean
)

/**
 * Extension function to convert Document entity to DTO
 */
fun Document.toDto(): DocumentDto {
    return DocumentDto(
        id = this.id!!,
        fileId = this.fileId,
        fileName = this.fileName,
        originalFileName = this.originalFileName,
        contentType = this.contentType,
        fileSize = this.fileSize,
        status = this.status,
        matterId = this.matter?.id,
        matterTitle = this.matter?.title,
        description = this.description,
        tags = this.tags.toList(),
        uploadedBy = this.uploadedBy?.let { "${it.firstName} ${it.lastName}" } ?: "Unknown",
        uploadedAt = this.createdAt ?: throw IllegalStateException("Created at cannot be null"),
        virusScanResult = this.virusScanResult,
        virusScanDate = this.virusScanDate,
        downloadUrl = "/api/v1/documents/${this.id}/download",
        thumbnailUrl = if (isPreviewable()) "/api/v1/documents/${this.id}/thumbnail" else null,
        isPublic = this.isPublic,
        expiresAt = this.expiresAt,
        versionNumber = this.versionNumber,
        hasVersions = this.versions.isNotEmpty()
    )
}

/**
 * Check if document type supports preview/thumbnail
 */
private fun Document.isPreviewable(): Boolean {
    return contentType.startsWith("image/") || contentType == "application/pdf"
}