package com.astarworks.astarmanagement.core.editor.domain.model

import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.time.Instant
import kotlinx.serialization.json.JsonObject

/**
 * Supplemental metadata associated with a document node.
 */
data class DocumentMetadata(
    val documentId: DocumentNodeId,
    val tenantId: TenantId,
    val workspaceId: WorkspaceId,
    val metadata: JsonObject = JsonObject(emptyMap()),
    val tags: List<String> = emptyList(),
    val isPublished: Boolean = false,
    val isFavorited: Boolean = false,
    val lastViewedAt: Instant? = null,
    val lastIndexedAt: Instant? = null,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {

    init {
        require(tags.distinct().size == tags.size) { "DocumentMetadata tags must be unique" }
        require(tags.all { it.isNotBlank() }) { "DocumentMetadata tags must not contain blank values" }
    }

    fun withTags(newTags: List<String>): DocumentMetadata {
        require(newTags.distinct().size == newTags.size) { "DocumentMetadata tags must be unique" }
        require(newTags.all { it.isNotBlank() }) { "DocumentMetadata tags must not contain blank values" }
        return copy(tags = newTags, updatedAt = Instant.now())
    }

    fun markPublished(published: Boolean): DocumentMetadata = copy(
        isPublished = published,
        updatedAt = Instant.now()
    )

    fun markFavorited(favorited: Boolean): DocumentMetadata = copy(
        isFavorited = favorited,
        updatedAt = Instant.now()
    )
}
