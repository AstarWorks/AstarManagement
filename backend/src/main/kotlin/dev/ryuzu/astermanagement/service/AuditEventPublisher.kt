package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.config.AuditContext
import dev.ryuzu.astermanagement.config.AuditContextProvider
import dev.ryuzu.astermanagement.domain.audit.*
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import java.net.InetAddress
import java.util.*

/**
 * Service for publishing audit events throughout the application
 * Provides type-safe methods for creating and publishing audit events with context
 */
@Service
class AuditEventPublisher(
    private val applicationEventPublisher: ApplicationEventPublisher,
    private val auditContextProvider: AuditContextProvider,
) : BaseService() {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Matter-related audit event publishing
     */
    fun publishMatterCreated(
        matterId: UUID,
        matterTitle: String,
        clientName: String,
        assignedLawyer: String?,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.MatterCreated(
            matterId = matterId.toString(),
            matterTitle = matterTitle,
            clientName = clientName,
            assignedLawyer = assignedLawyer,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "create_matter",
                "matterType" to "legal_case"
            ))
        )
        
        publishEvent(event, context)
    }
    
    fun publishMatterStatusChanged(
        matterId: UUID,
        oldStatus: String,
        newStatus: String,
        reason: String?,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.MatterStatusChanged(
            matterId = matterId.toString(),
            oldStatus = oldStatus,
            newStatus = newStatus,
            reason = reason,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "status_change",
                "changeType" to "matter_status"
            ))
        )
        
        publishEvent(event, context)
    }
    
    fun publishMatterUpdated(
        matterId: UUID,
        fieldsChanged: List<String>,
        oldValues: Map<String, Any?>,
        newValues: Map<String, Any?>,
        reason: String? = null,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.MatterUpdated(
            matterId = matterId.toString(),
            fieldsChanged = fieldsChanged,
            oldValues = oldValues,
            newValues = newValues,
            userId = effectiveUserId,
            reason = reason,
            metadata = buildMetadata(context, mapOf(
                "operation" to "update_matter",
                "fieldsCount" to fieldsChanged.size
            ))
        )
        
        publishEvent(event, context)
    }
    
    fun publishMatterDeleted(
        matterId: UUID,
        matterTitle: String,
        reason: String?,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.MatterDeleted(
            matterId = matterId.toString(),
            matterTitle = matterTitle,
            reason = reason,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "delete_matter",
                "deletion_type" to "soft_delete"
            ))
        )
        
        publishEvent(event, context)
    }
    
    /**
     * Document-related audit event publishing
     */
    fun publishDocumentUploaded(
        documentId: UUID,
        matterId: UUID,
        documentName: String,
        documentType: String,
        fileSize: Long,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.DocumentUploaded(
            documentId = documentId.toString(),
            matterId = matterId.toString(),
            documentName = documentName,
            documentType = documentType,
            fileSize = fileSize,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "upload_document",
                "fileSize" to fileSize,
                "documentType" to documentType
            ))
        )
        
        publishEvent(event, context)
    }
    
    fun publishDocumentAccessed(
        documentId: UUID,
        matterId: UUID,
        documentName: String,
        accessType: DocumentAccessType,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.DocumentAccessed(
            documentId = documentId.toString(),
            matterId = matterId.toString(),
            documentName = documentName,
            accessType = accessType,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "access_document",
                "accessType" to accessType.name
            ))
        )
        
        publishEvent(event, context)
    }
    
    /**
     * Authentication and security event publishing
     */
    fun publishUserLogin(
        userId: UUID,
        username: String,
        loginMethod: String,
        success: Boolean,
        failureReason: String? = null
    ) {
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.UserLogin(
            userId = userId.toString(),
            username = username,
            loginMethod = loginMethod,
            success = success,
            failureReason = failureReason,
            metadata = buildMetadata(context, mapOf(
                "operation" to "user_login",
                "loginMethod" to loginMethod,
                "success" to success
            ))
        )
        
        publishEvent(event, context)
    }
    
    fun publishAuthenticationFailed(
        attemptedUsername: String,
        failureReason: String,
        ipAddress: String? = null
    ) {
        val context = auditContextProvider.getCurrentContext()
        val effectiveIpAddress = ipAddress ?: context.ipAddress
        
        val event = AuditEvent.AuthenticationFailed(
            attemptedUsername = attemptedUsername,
            failureReason = failureReason,
            ipAddress = effectiveIpAddress,
            metadata = buildMetadata(context, mapOf(
                "operation" to "authentication_failed",
                "attemptedUsername" to attemptedUsername,
                "failureReason" to failureReason
            ))
        )
        
        publishEvent(event, context)
    }
    
    fun publishAuthorizationDenied(
        userId: UUID,
        username: String,
        resourceAccessed: String,
        requiredPermission: String,
        userPermissions: List<String>
    ) {
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.AuthorizationDenied(
            userId = userId.toString(),
            username = username,
            resourceAccessed = resourceAccessed,
            requiredPermission = requiredPermission,
            userPermissions = userPermissions,
            metadata = buildMetadata(context, mapOf(
                "operation" to "authorization_denied",
                "resourceAccessed" to resourceAccessed,
                "requiredPermission" to requiredPermission
            ))
        )
        
        publishEvent(event, context)
    }
    
    /**
     * Security event publishing
     */
    fun publishSecurityEvent(
        eventSubType: SecurityEventType,
        resourceAccessed: String?,
        success: Boolean,
        details: String?,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.SecurityEvent(
            eventSubType = eventSubType,
            resourceAccessed = resourceAccessed,
            success = success,
            details = details,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "security_event",
                "securityEventType" to eventSubType.name,
                "success" to success
            ))
        )
        
        publishEvent(event, context)
    }
    
    /**
     * Bulk operation event publishing
     */
    fun publishBulkOperation(
        operationType: String,
        entityType: String,
        affectedEntityIds: List<String>,
        criteria: String?,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.BulkOperation(
            operationType = operationType,
            entityType = entityType,
            affectedEntityIds = affectedEntityIds,
            criteria = criteria,
            recordCount = affectedEntityIds.size,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "bulk_operation",
                "operationType" to operationType,
                "entityType" to entityType,
                "recordCount" to affectedEntityIds.size
            ))
        )
        
        publishEvent(event, context)
    }
    
    /**
     * Data export event publishing
     */
    fun publishDataExport(
        exportType: String,
        entityType: String,
        entityId: String,
        exportFormat: String,
        recordCount: Int,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        val event = AuditEvent.DataExport(
            exportType = exportType,
            entityType = entityType,
            entityId = entityId,
            exportFormat = exportFormat,
            recordCount = recordCount,
            userId = effectiveUserId,
            metadata = buildMetadata(context, mapOf(
                "operation" to "data_export",
                "exportType" to exportType,
                "exportFormat" to exportFormat,
                "recordCount" to recordCount
            ))
        )
        
        publishEvent(event, context)
    }
    
    /**
     * Generic audit event publishing with correlation support
     */
    fun publishCustomEvent(
        eventType: AuditEventType,
        entityType: String,
        entityId: String,
        details: Map<String, Any> = emptyMap(),
        correlationId: String? = null,
        userId: String? = null
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        // Use a generic system event for custom events
        val event = AuditEvent.SystemEvent(
            systemEventType = eventType.name,
            component = entityType,
            description = "Custom audit event: ${eventType.name}",
            severity = "INFO",
            userId = effectiveUserId,
            metadata = buildMetadata(context, details + mapOf(
                "operation" to "custom_event",
                "originalEventType" to eventType.name,
                "correlationId" to correlationId
            ).filterValues { it != null })
        )
        
        publishEvent(event, context)
    }
    
    /**
     * Core event publishing method
     */
    private fun publishEvent(event: AuditEvent, context: AuditContext) {
        try {
            logger.debug("Publishing audit event: ${event.eventType} for ${event.entityType}:${event.entityId}")
            applicationEventPublisher.publishEvent(event)
            
            // Also publish to the audit context for immediate processing if needed
            publishToAuditContext(event, context)
            
        } catch (e: Exception) {
            logger.error("Failed to publish audit event: ${event.eventType}", e)
            // In production, you might want to store failed events for retry
            handleFailedEventPublication(event, e)
        }
    }
    
    /**
     * Publishes event to audit context for immediate processing
     */
    private fun publishToAuditContext(event: AuditEvent, context: AuditContext) {
        // This could be used for real-time audit processing, streaming, etc.
        logger.trace("Audit event published to context: ${event.eventType}")
    }
    
    /**
     * Handles failed event publication
     */
    private fun handleFailedEventPublication(event: AuditEvent, exception: Exception) {
        // In production, implement retry logic, dead letter queue, or fallback storage
        logger.error("Failed to publish audit event: ${event.eventType} for ${event.entityType}:${event.entityId}", exception)
        
        // Could store in a dead letter table or queue for manual review
        // deadLetterService.storeFailedAuditEvent(event, exception)
    }
    
    /**
     * Builds metadata map combining context and event-specific data
     */
    private fun buildMetadata(context: AuditContext, eventData: Map<String, Any?>): Map<String, Any> {
        val metadata = mutableMapOf<String, Any>()
        
        // Add context information
        metadata.putAll(context.toMap().filterValues { it != null }.mapValues { it.value!! })
        
        // Add event-specific data
        metadata.putAll(eventData.filterValues { it != null }.mapValues { it.value!! })
        
        // Add system information
        metadata["publishedAt"] = System.currentTimeMillis()
        metadata["publisherId"] = this::class.simpleName ?: "AuditEventPublisher"
        
        return metadata
    }
}