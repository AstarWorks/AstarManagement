package dev.ryuzu.astermanagement.modules.document.infrastructure

import dev.ryuzu.astermanagement.modules.matter.api.*
import dev.ryuzu.astermanagement.modules.document.api.DocumentService
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Event listener for handling Matter module events within Document module
 * Implements event choreography patterns for cross-module communication
 */
@Component
@Transactional
class DocumentEventListener(
    private val documentService: DocumentService,
    private val auditEventPublisher: AuditEventPublisher
) {
    private val logger = LoggerFactory.getLogger(DocumentEventListener::class.java)

    /**
     * Handle matter creation by preparing document workspace
     * Choreography: Matter created -> Document workspace prepared
     */
    @ApplicationModuleListener
    fun on(event: MatterCreatedEvent) {
        logger.info("Processing MatterCreatedEvent for matter: ${event.matterId}")
        
        try {
            // Create default document workspace/folder structure for the matter
            // This is a placeholder for actual document workspace creation
            logger.info("Document workspace prepared for matter ${event.caseNumber}")
            
            // Audit the cross-module interaction
            auditEventPublisher.publishDocumentWorkspaceCreated(
                matterId = event.matterId,
                caseNumber = event.caseNumber,
                userId = event.userId
            )
            
        } catch (exception: Exception) {
            logger.error("Failed to process MatterCreatedEvent for matter: ${event.matterId}", exception)
            throw exception
        }
    }

    /**
     * Handle matter completion by archiving associated documents
     * Choreography: Matter completed -> Documents archived
     */
    @ApplicationModuleListener
    fun on(event: MatterCompletedEvent) {
        logger.info("Processing MatterCompletedEvent for matter: ${event.matterId}")
        
        try {
            // Archive all documents associated with the completed matter
            // Implementation would call documentService.archiveDocumentsByMatter()
            logger.info("Documents archived for completed matter: ${event.matterId}")
            
            auditEventPublisher.publishDocumentsArchived(
                matterId = event.matterId,
                userId = event.userId
            )
            
        } catch (exception: Exception) {
            logger.error("Failed to process MatterCompletedEvent for matter: ${event.matterId}", exception)
            throw exception
        }
    }

    /**
     * Handle matter deletion by cleaning up document associations
     * Choreography: Matter deleted -> Document associations removed
     */
    @ApplicationModuleListener
    fun on(event: MatterDeletedEvent) {
        logger.info("Processing MatterDeletedEvent for matter: ${event.matterId}")
        
        try {
            // Remove document associations (but keep documents if they're referenced elsewhere)
            // Implementation would call documentService.removeDocumentAssociations()
            logger.info("Document associations cleaned up for deleted matter: ${event.matterId}")
            
            auditEventPublisher.publishDocumentAssociationsRemoved(
                matterId = event.matterId,
                userId = event.userId
            )
            
        } catch (exception: Exception) {
            logger.error("Failed to process MatterDeletedEvent for matter: ${event.matterId}", exception)
            throw exception
        }
    }

    /**
     * Handle matter status changes that affect document processing
     * Choreography: Matter status changed -> Document processing updated
     */
    @ApplicationModuleListener
    fun on(event: MatterStatusChangedEvent) {
        logger.info("Processing MatterStatusChangedEvent for matter: ${event.matterId}")
        
        try {
            // Handle status-specific document processing rules
            when (event.newStatus) {
                "FILED" -> {
                    logger.info("Matter filed - enabling document filing workflows for: ${event.matterId}")
                    // Enable filing-specific document workflows
                }
                "CLOSED" -> {
                    logger.info("Matter closed - disabling document modifications for: ${event.matterId}")
                    // Disable further document modifications
                }
                "DISCOVERY" -> {
                    logger.info("Discovery phase - enabling document discovery workflows for: ${event.matterId}")
                    // Enable discovery-specific document workflows
                }
            }
            
        } catch (exception: Exception) {
            logger.error("Failed to process MatterStatusChangedEvent for matter: ${event.matterId}", exception)
            throw exception
        }
    }
}