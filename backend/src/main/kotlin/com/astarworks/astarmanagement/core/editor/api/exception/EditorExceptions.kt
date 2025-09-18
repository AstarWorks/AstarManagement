package com.astarworks.astarmanagement.core.editor.api.exception

import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.DocumentRevisionId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId

class DocumentNodeNotFoundException private constructor(
    val nodeId: DocumentNodeId,
    val workspaceId: WorkspaceId?,
    message: String,
) : RuntimeException(message) {
    companion object {
        fun of(nodeId: DocumentNodeId) =
            DocumentNodeNotFoundException(nodeId, null, "Document node not found: ${nodeId.value}")

        fun inWorkspace(nodeId: DocumentNodeId, workspaceId: WorkspaceId) =
            DocumentNodeNotFoundException(
                nodeId,
                workspaceId,
                "Document node ${nodeId.value} not found in workspace ${workspaceId.value}"
            )
    }
}

class DocumentRevisionNotFoundException private constructor(
    val revisionId: DocumentRevisionId?,
    val documentId: DocumentNodeId?,
    message: String,
) : RuntimeException(message) {
    companion object {
        fun of(revisionId: DocumentRevisionId) =
            DocumentRevisionNotFoundException(revisionId, null, "Document revision not found: ${revisionId.value}")

        fun forDocument(documentId: DocumentNodeId) =
            DocumentRevisionNotFoundException(null, documentId, "No revisions found for document: ${documentId.value}")
    }
}

class DuplicateDocumentSlugException private constructor(
    val slug: String,
    message: String,
) : RuntimeException(message) {
    companion object {
        fun of(slug: String) = DuplicateDocumentSlugException(slug, "Document slug already exists: $slug")
    }
}

class InvalidFolderOperationException(message: String) : RuntimeException(message)
class InvalidDocumentOperationException(message: String) : RuntimeException(message)
