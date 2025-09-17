package com.astarworks.astarmanagement.core.editor.domain.model

/**
 * Convenience aggregate for exposing a document node together with its latest revision
 * and associated metadata. Used by the service layer and, later, controller DTO mapping.
 */
data class DocumentAggregate(
    val node: DocumentNode,
    val latestRevision: DocumentRevision,
    val metadata: DocumentMetadata?,
    val revisionCount: Long,
)
