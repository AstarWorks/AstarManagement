package dev.ryuzu.astermanagement.modules.document.api

import org.springframework.modulith.events.Externalized
import java.time.LocalDateTime
import java.util.*

/**
 * Document module events for inter-module communication
 */

/**
 * Base interface for all document events
 */
sealed interface DocumentEvent {
    val documentId: UUID
    val timestamp: LocalDateTime
    val userId: UUID
}

/**
 * Published when a document is uploaded
 */
@Externalized("document.uploaded::#{documentId}")
data class DocumentUploadedEvent(
    override val documentId: UUID,
    val fileId: String,
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val matterId: UUID?,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when document processing completes (OCR, virus scan, etc.)
 */
@Externalized("document.processed::#{documentId}")
data class DocumentProcessedEvent(
    override val documentId: UUID,
    val status: String, // AVAILABLE, QUARANTINED, FAILED
    val extractedText: String?,
    val pageCount: Int?,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when a document is associated with a matter
 */
@Externalized("document.associated::#{documentId}")
data class DocumentAssociatedWithMatterEvent(
    override val documentId: UUID,
    val matterId: UUID,
    val associationType: String?,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when a document is removed from a matter
 */
@Externalized("document.disassociated::#{documentId}")
data class DocumentDisassociatedFromMatterEvent(
    override val documentId: UUID,
    val matterId: UUID,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when document metadata is updated
 */
@Externalized("document.updated::#{documentId}")
data class DocumentUpdatedEvent(
    override val documentId: UUID,
    val changes: Map<String, Any?>,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when a document is deleted
 */
@Externalized("document.deleted::#{documentId}")
data class DocumentDeletedEvent(
    override val documentId: UUID,
    val matterId: UUID?,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when a document version is created
 */
@Externalized("document.version.created::#{documentId}")
data class DocumentVersionCreatedEvent(
    override val documentId: UUID,
    val parentDocumentId: UUID,
    val versionNumber: Int,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when document access is requested (for audit purposes)
 */
@Externalized("document.accessed::#{documentId}")
data class DocumentAccessedEvent(
    override val documentId: UUID,
    val accessType: String, // view, download, preview
    val matterId: UUID?,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent

/**
 * Published when document content is extracted/indexed
 */
@Externalized("document.indexed::#{documentId}")
data class DocumentIndexedEvent(
    override val documentId: UUID,
    val extractedText: String?,
    val wordCount: Int?,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent