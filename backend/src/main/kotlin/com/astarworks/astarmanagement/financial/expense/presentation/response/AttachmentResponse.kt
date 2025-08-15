package com.astarworks.astarmanagement.modules.financial.expense.presentation.response

import com.astarworks.astarmanagement.modules.financial.expense.domain.model.AttachmentStatus
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for attachment data.
 * Includes file metadata and status information.
 */
data class AttachmentResponse(
    val id: UUID,
    val fileName: String,
    val originalName: String,
    val fileSize: Long,
    val mimeType: String,
    val status: AttachmentStatus,
    val thumbnailPath: String?,
    val uploadedAt: Instant,
    val uploadedBy: UUID,
    val linkedAt: Instant?,
    val expiresAt: Instant?,
    val downloadUrl: String?,
    val thumbnailUrl: String?,
    val isImage: Boolean,
    val isPdf: Boolean,
    val fileExtension: String
)