package dev.ryuzu.astermanagement.dto.document

import jakarta.validation.constraints.*
import java.util.*

/**
 * DTO for document metadata during upload
 */
data class DocumentMetadataDto(
    @field:NotNull(message = "Matter ID is required")
    val matterId: UUID?,
    
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    val description: String?,
    
    @field:Size(max = 10, message = "Maximum 10 tags allowed")
    val tags: List<@Size(max = 50, message = "Tag must not exceed 50 characters") String> = emptyList(),
    
    val isPublic: Boolean = false
)

/**
 * DTO for batch document upload metadata
 */
data class BatchDocumentMetadataDto(
    val matterId: UUID?,
    val commonTags: List<String> = emptyList(),
    val documentMetadata: Map<String, DocumentMetadataDto> = emptyMap()
)

/**
 * DTO for updating document metadata
 */
data class UpdateDocumentMetadataDto(
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    val description: String?,
    
    @field:Size(max = 10, message = "Maximum 10 tags allowed")
    val tags: List<@Size(max = 50, message = "Tag must not exceed 50 characters") String>?
)

/**
 * DTO for version metadata
 */
data class VersionMetadataDto(
    @field:Size(max = 500, message = "Comment must not exceed 500 characters")
    val comment: String?
)