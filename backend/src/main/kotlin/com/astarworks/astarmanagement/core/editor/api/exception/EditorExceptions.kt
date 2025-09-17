package com.astarworks.astarmanagement.core.editor.api.exception

import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.DocumentRevisionId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId

class DocumentNodeNotFoundException private constructor(message: String) : RuntimeException(message) {
    companion object {
        fun of(nodeId: DocumentNodeId) = DocumentNodeNotFoundException("Document node not found: ${nodeId.value}")
        fun inWorkspace(nodeId: DocumentNodeId, workspaceId: WorkspaceId) =
            DocumentNodeNotFoundException("Document node ${nodeId.value} not found in workspace ${workspaceId.value}")
    }
}

class DocumentRevisionNotFoundException private constructor(message: String) : RuntimeException(message) {
    companion object {
        fun of(revisionId: DocumentRevisionId) =
            DocumentRevisionNotFoundException("Document revision not found: ${revisionId.value}")

        fun forDocument(documentId: DocumentNodeId) =
            DocumentRevisionNotFoundException("No revisions found for document: ${documentId.value}")
    }
}

class DuplicateDocumentSlugException private constructor(message: String) : RuntimeException(message) {
    companion object {
        fun of(slug: String) = DuplicateDocumentSlugException("Document slug already exists: $slug")
    }
}

class InvalidFolderOperationException(message: String) : RuntimeException(message)
class InvalidDocumentOperationException(message: String) : RuntimeException(message)
