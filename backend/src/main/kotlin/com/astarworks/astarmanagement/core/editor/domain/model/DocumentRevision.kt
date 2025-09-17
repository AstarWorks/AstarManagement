package com.astarworks.astarmanagement.core.editor.domain.model

import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.DocumentRevisionId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.time.Instant
import java.util.UUID

/**
 * Immutable snapshot of a document's content at a specific revision number.
 */
data class DocumentRevision(
    val id: DocumentRevisionId = DocumentRevisionId(UUID.randomUUID()),
    val tenantId: TenantId,
    val workspaceId: WorkspaceId,
    val documentId: DocumentNodeId,
    val revisionNumber: Int,
    val titleSnapshot: String,
    val authorId: UserId,
    val summary: String? = null,
    val contentPlaintext: String? = null,
    val contentType: String = DEFAULT_CONTENT_TYPE,
    val sizeBytes: Long? = null,
    val checksum: String? = null,
    val ciphertext: ByteArray? = null,
    val dekCiphertext: ByteArray? = null,
    val nonce: ByteArray? = null,
    val compression: String? = null,
    val createdAt: Instant = Instant.now()
) {

    init {
        require(revisionNumber > 0) { "DocumentRevision revisionNumber must be positive" }
        require(titleSnapshot.isNotBlank()) { "DocumentRevision titleSnapshot must not be blank" }
        require(contentType.isNotBlank()) { "DocumentRevision contentType must not be blank" }
        sizeBytes?.let { require(it >= 0) { "DocumentRevision sizeBytes must not be negative" } }
    }

    companion object {
        const val DEFAULT_CONTENT_TYPE: String = "text/markdown"
    }
}
