package dev.ryuzu.astermanagement.modules.audit.infrastructure

import dev.ryuzu.astermanagement.modules.matter.api.*
import dev.ryuzu.astermanagement.modules.document.api.*
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Central audit event listener for all module events
 * Implements comprehensive audit trail for all cross-module interactions
 */
@Component
@Transactional
class AuditEventListener(
    private val auditEventPublisher: AuditEventPublisher
) {
    private val logger = LoggerFactory.getLogger(AuditEventListener::class.java)

    // ========== MATTER MODULE EVENTS ==========

    @ApplicationModuleListener
    fun on(event: MatterCreatedEvent) {
        logger.debug("Auditing MatterCreatedEvent: ${event.matterId}")
        auditEventPublisher.publishMatterCreated(
            matterId = event.matterId,
            caseNumber = event.caseNumber,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: MatterUpdatedEvent) {
        logger.debug("Auditing MatterUpdatedEvent: ${event.matterId}")
        auditEventPublisher.publishMatterUpdated(
            matterId = event.matterId,
            changes = event.changes.keys.toList(),
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: MatterStatusChangedEvent) {
        logger.debug("Auditing MatterStatusChangedEvent: ${event.matterId}")
        auditEventPublisher.publishMatterStatusChanged(
            matterId = event.matterId,
            oldStatus = event.oldStatus,
            newStatus = event.newStatus,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: MatterAssignedEvent) {
        logger.debug("Auditing MatterAssignedEvent: ${event.matterId}")
        auditEventPublisher.publishMatterAssigned(
            matterId = event.matterId,
            oldAssignee = event.oldLawyerId,
            newAssignee = event.newLawyerId,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: MatterCompletedEvent) {
        logger.debug("Auditing MatterCompletedEvent: ${event.matterId}")
        auditEventPublisher.publishMatterCompleted(
            matterId = event.matterId,
            completionDate = event.completionDate,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: MatterDeletedEvent) {
        logger.debug("Auditing MatterDeletedEvent: ${event.matterId}")
        auditEventPublisher.publishMatterDeleted(
            matterId = event.matterId,
            userId = event.userId
        )
    }

    // ========== DOCUMENT MODULE EVENTS ==========

    @ApplicationModuleListener
    fun on(event: DocumentUploadedEvent) {
        logger.debug("Auditing DocumentUploadedEvent: ${event.documentId}")
        auditEventPublisher.publishDocumentUploaded(
            documentId = event.documentId,
            fileName = event.fileName,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentProcessedEvent) {
        logger.debug("Auditing DocumentProcessedEvent: ${event.documentId}")
        auditEventPublisher.publishDocumentProcessed(
            documentId = event.documentId,
            status = event.status,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentAssociatedWithMatterEvent) {
        logger.debug("Auditing DocumentAssociatedWithMatterEvent: ${event.documentId} -> ${event.matterId}")
        auditEventPublisher.publishDocumentAssociated(
            documentId = event.documentId,
            matterId = event.matterId,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentDisassociatedFromMatterEvent) {
        logger.debug("Auditing DocumentDisassociatedFromMatterEvent: ${event.documentId} from ${event.matterId}")
        auditEventPublisher.publishDocumentDisassociated(
            documentId = event.documentId,
            matterId = event.matterId,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentUpdatedEvent) {
        logger.debug("Auditing DocumentUpdatedEvent: ${event.documentId}")
        auditEventPublisher.publishDocumentUpdated(
            documentId = event.documentId,
            changes = event.changes.keys.toList(),
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentDeletedEvent) {
        logger.debug("Auditing DocumentDeletedEvent: ${event.documentId}")
        auditEventPublisher.publishDocumentDeleted(
            documentId = event.documentId,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentVersionCreatedEvent) {
        logger.debug("Auditing DocumentVersionCreatedEvent: ${event.documentId}")
        auditEventPublisher.publishDocumentVersionCreated(
            documentId = event.documentId,
            parentDocumentId = event.parentDocumentId,
            versionNumber = event.versionNumber,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentAccessedEvent) {
        logger.debug("Auditing DocumentAccessedEvent: ${event.documentId}")
        auditEventPublisher.publishDocumentAccessed(
            documentId = event.documentId,
            accessType = event.accessType,
            userId = event.userId
        )
    }

    @ApplicationModuleListener
    fun on(event: DocumentIndexedEvent) {
        logger.debug("Auditing DocumentIndexedEvent: ${event.documentId}")
        auditEventPublisher.publishDocumentIndexed(
            documentId = event.documentId,
            wordCount = event.wordCount,
            userId = event.userId
        )
    }
}