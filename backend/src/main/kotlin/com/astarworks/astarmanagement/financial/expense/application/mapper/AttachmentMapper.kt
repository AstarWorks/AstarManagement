package com.astarworks.astarmanagement.modules.financial.expense.application.mapper

import com.astarworks.astarmanagement.modules.financial.expense.domain.model.Attachment
import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.AttachmentResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

/**
 * Mapper for converting between Attachment domain models and DTOs.
 */
@Component
class AttachmentMapper(
    @Value("\${app.base-url:http://localhost:8080}")
    private val baseUrl: String
) {
    /**
     * Converts an Attachment domain model to AttachmentResponse DTO.
     * @param attachment The domain model to convert
     * @return The response DTO
     */
    fun toResponse(attachment: Attachment): AttachmentResponse {
        return AttachmentResponse(
            id = attachment.id,
            fileName = attachment.fileName,
            originalName = attachment.originalName,
            fileSize = attachment.fileSize,
            mimeType = attachment.mimeType,
            status = attachment.status,
            thumbnailPath = attachment.thumbnailPath,
            uploadedAt = attachment.uploadedAt,
            uploadedBy = attachment.uploadedBy,
            linkedAt = attachment.linkedAt,
            expiresAt = attachment.expiresAt,
            downloadUrl = generateDownloadUrl(attachment),
            thumbnailUrl = generateThumbnailUrl(attachment),
            isImage = attachment.isImage(),
            isPdf = attachment.isPdf(),
            fileExtension = attachment.getFileExtension()
        )
    }
    
    /**
     * Converts a list of Attachment domain models to response DTOs.
     * @param attachments The list of domain models
     * @return The list of response DTOs
     */
    fun toResponseList(attachments: List<Attachment>): List<AttachmentResponse> {
        return attachments.map { toResponse(it) }
    }
    
    /**
     * Generates the download URL for an attachment.
     * @param attachment The attachment
     * @return The download URL
     */
    private fun generateDownloadUrl(attachment: Attachment): String {
        return "$baseUrl/api/v1/attachments/${attachment.id}/download"
    }
    
    /**
     * Generates the thumbnail URL for an image attachment.
     * @param attachment The attachment
     * @return The thumbnail URL if available, null otherwise
     */
    private fun generateThumbnailUrl(attachment: Attachment): String? {
        return if (attachment.isImage() && attachment.thumbnailPath != null) {
            "$baseUrl/api/v1/attachments/${attachment.id}/thumbnail"
        } else {
            null
        }
    }
}