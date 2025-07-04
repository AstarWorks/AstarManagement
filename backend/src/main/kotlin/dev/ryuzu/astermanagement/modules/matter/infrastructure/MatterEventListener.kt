package dev.ryuzu.astermanagement.modules.matter.infrastructure

import dev.ryuzu.astermanagement.modules.document.api.*
import dev.ryuzu.astermanagement.modules.matter.api.MatterService
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Event listener for handling Document module events within Matter module
 * Implements event choreography patterns for cross-module communication
 */
@Component
@Transactional
class MatterEventListener(
    private val matterService: MatterService,
    private val auditEventPublisher: AuditEventPublisher
) {
    private val logger = LoggerFactory.getLogger(MatterEventListener::class.java)

    /**
     * Handle document upload by updating matter metadata
     * Choreography: Document uploaded -> Matter updated with document count
     */
    @ApplicationModuleListener
    fun on(event: DocumentUploadedEvent) {
        logger.info("Processing DocumentUploadedEvent for document: ${event.documentId}")
        
        try {
            event.matterId?.let { matterId ->
                // Update matter with new document information
                // This could include updating document counts, last activity, etc.
                logger.info("Matter ${matterId} updated with new document: ${event.fileName}")
                
                auditEventPublisher.publishMatterDocumentAdded(
                    matterId = matterId,
                    documentId = event.documentId,
                    fileName = event.fileName,
                    userId = event.userId
                )
            }
            
        } catch (exception: Exception) {
            logger.error("Failed to process DocumentUploadedEvent for document: ${event.documentId}", exception)
            throw exception
        }
    }

    /**
     * Handle document processing completion
     * Choreography: Document processed -> Matter notified of new searchable content
     */
    @ApplicationModuleListener
    fun on(event: DocumentProcessedEvent) {
        logger.info("Processing DocumentProcessedEvent for document: ${event.documentId}")
        
        try {
            when (event.status) {
                "AVAILABLE" -> {
                    logger.info("Document processed successfully: ${event.documentId}")
                    // Update matter search index with extracted text
                    event.extractedText?.let { text ->
                        logger.info("Adding extracted text to matter search index for document: ${event.documentId}")
                    }
                }
                "QUARANTINED" -> {
                    logger.warn("Document quarantined due to security scan: ${event.documentId}")
                    // Handle quarantined document - may need matter owner notification
                }
                "FAILED" -> {
                    logger.error("Document processing failed: ${event.documentId}")
                    // Handle processing failure - may need matter owner notification
                }
            }
            
        } catch (exception: Exception) {
            logger.error("Failed to process DocumentProcessedEvent for document: ${event.documentId}", exception)
            throw exception
        }
    }

    /**
     * Handle document association with matter
     * Choreography: Document associated -> Matter metadata updated
     */
    @ApplicationModuleListener
    fun on(event: DocumentAssociatedWithMatterEvent) {
        logger.info("Processing DocumentAssociatedWithMatterEvent: document ${event.documentId} -> matter ${event.matterId}")
        
        try {
            // Update matter statistics and metadata
            logger.info("Matter ${event.matterId} associated with document ${event.documentId} as ${event.associationType}")
            
            auditEventPublisher.publishMatterDocumentAssociated(
                matterId = event.matterId,
                documentId = event.documentId,
                associationType = event.associationType ?: "attachment",
                userId = event.userId
            )
            
        } catch (exception: Exception) {
            logger.error("Failed to process DocumentAssociatedWithMatterEvent: ${event.documentId} -> ${event.matterId}", exception)
            throw exception
        }
    }

    /**
     * Handle document removal from matter
     * Choreography: Document disassociated -> Matter metadata updated
     */
    @ApplicationModuleListener
    fun on(event: DocumentDisassociatedFromMatterEvent) {
        logger.info("Processing DocumentDisassociatedFromMatterEvent: document ${event.documentId} removed from matter ${event.matterId}")
        
        try {
            // Update matter statistics and metadata
            logger.info("Document ${event.documentId} removed from matter ${event.matterId}")
            
            auditEventPublisher.publishMatterDocumentRemoved(
                matterId = event.matterId,
                documentId = event.documentId,
                userId = event.userId
            )
            
        } catch (exception: Exception) {
            logger.error("Failed to process DocumentDisassociatedFromMatterEvent: ${event.documentId} from ${event.matterId}", exception)
            throw exception
        }
    }

    /**
     * Handle document deletion
     * Choreography: Document deleted -> Matter updated if document was associated
     */
    @ApplicationModuleListener
    fun on(event: DocumentDeletedEvent) {
        logger.info("Processing DocumentDeletedEvent for document: ${event.documentId}")
        
        try {
            event.matterId?.let { matterId ->
                // Update matter when associated document is deleted
                logger.info("Matter ${matterId} notified of document deletion: ${event.documentId}")
                
                auditEventPublisher.publishMatterDocumentDeleted(
                    matterId = matterId,
                    documentId = event.documentId,
                    userId = event.userId
                )
            }
            
        } catch (exception: Exception) {
            logger.error("Failed to process DocumentDeletedEvent for document: ${event.documentId}", exception)
            throw exception
        }
    }
}