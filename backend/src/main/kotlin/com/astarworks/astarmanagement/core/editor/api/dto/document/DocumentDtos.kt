package com.astarworks.astarmanagement.core.editor.api.dto.document

import com.astarworks.astarmanagement.core.editor.api.dto.common.EditorNodeResponse
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class DocumentCreateRequest(
    @Contextual
    val workspaceId: UUID,
    @Contextual
    val parentId: UUID? = null,
    @field:NotBlank
    @field:Size(min = 1, max = 255)
    val title: String,
    val summary: String? = null,
    val content: String? = null,
    val contentType: String? = null,
    val metadata: JsonObject? = null,
    val tags: List<String>? = null,
    val isPublished: Boolean? = null,
    val isFavorited: Boolean? = null,
    val position: Double? = null,
)

@Serializable
data class DocumentUpdateRequest(
    @field:Size(min = 1, max = 255)
    val title: String? = null,
    val summary: String? = null,
    val content: String? = null,
    val contentType: String? = null,
    val metadata: JsonObject? = null,
    val tags: List<String>? = null,
    val isPublished: Boolean? = null,
    val isFavorited: Boolean? = null,
)

@Serializable
data class DocumentResponse(
    val node: EditorNodeResponse,
    val latestRevision: DocumentRevisionResponse,
    val metadata: DocumentMetadataResponse? = null,
    val revisionCount: Long,
)

@Serializable
data class DocumentRevisionResponse(
    @Contextual
    val id: UUID,
    val revisionNumber: Int,
    val titleSnapshot: String,
    val summary: String? = null,
    val content: String? = null,
    val contentType: String,
    val sizeBytes: Long? = null,
    val checksum: String? = null,
    @Contextual
    val authorId: UUID,
    @Contextual
    val createdAt: Instant,
)

@Serializable
data class DocumentMetadataResponse(
    val metadata: JsonObject,
    val tags: List<String>,
    val isPublished: Boolean,
    val isFavorited: Boolean,
    @Contextual
    val lastViewedAt: Instant? = null,
    @Contextual
    val lastIndexedAt: Instant? = null,
    @Contextual
    val createdAt: Instant,
    @Contextual
    val updatedAt: Instant,
)

@Serializable
data class DocumentRevisionsResponse(
    val revisions: List<DocumentRevisionSummaryResponse>,
)

@Serializable
data class DocumentRevisionSummaryResponse(
    @Contextual
    val id: UUID,
    val revisionNumber: Int,
    val titleSnapshot: String,
    val summary: String? = null,
    val contentType: String,
    val sizeBytes: Long? = null,
    val checksum: String? = null,
    @Contextual
    val authorId: UUID,
    @Contextual
    val createdAt: Instant,
)

@Serializable
data class DocumentDeletionResponse(
    val deleted: Boolean,
)
