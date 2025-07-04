package dev.ryuzu.astermanagement.modules.audit.infrastructure

import dev.ryuzu.astermanagement.config.AuditContext
import dev.ryuzu.astermanagement.config.AuditContextProvider
import dev.ryuzu.astermanagement.modules.audit.api.*
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import java.util.*

/**
 * Infrastructure implementation of AuditEventPublisher
 * Handles the concrete publishing of audit events
 */
@Service
class AuditEventPublisherImpl(
    private val applicationEventPublisher: ApplicationEventPublisher,
    private val auditContextProvider: AuditContextProvider,
) : BaseService(), AuditEventPublisher {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    override fun publishMatterCreated(
        matterId: UUID,
        matterTitle: String,
        clientName: String,
        assignedLawyer: String?,
        userId: String?
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
    
    override fun publishMatterStatusChanged(
        matterId: UUID,
        oldStatus: String,
        newStatus: String,
        reason: String?,
        userId: String?
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
    
    override fun publishMatterUpdated(
        matterId: UUID,
        fieldsChanged: List<String>,
        oldValues: Map<String, Any?>,
        newValues: Map<String, Any?>,
        reason: String?,
        userId: String?
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
    
    override fun publishMatterDeleted(
        matterId: UUID,
        matterTitle: String,
        reason: String?,
        userId: String?
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
    
    override fun publishDocumentUploaded(
        documentId: UUID,
        matterId: UUID,
        documentName: String,
        documentType: String,
        fileSize: Long,
        userId: String?
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
    
    override fun publishDocumentAccessed(
        documentId: UUID,
        matterId: UUID,
        documentName: String,
        accessType: DocumentAccessType,
        userId: String?
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
    
    override fun publishUserLogin(
        userId: UUID,
        username: String,
        loginMethod: String,
        success: Boolean,
        failureReason: String?
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
    
    override fun publishAuthenticationFailed(
        attemptedUsername: String,
        failureReason: String,
        ipAddress: String?
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
    
    override fun publishAuthorizationDenied(
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
    
    override fun publishSecurityEvent(
        eventSubType: SecurityEventType,
        resourceAccessed: String?,
        success: Boolean,
        details: String?,
        userId: String?
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
    
    override fun publishBulkOperation(
        operationType: String,
        entityType: String,
        affectedEntityIds: List<String>,
        criteria: String?,
        userId: String?
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
    
    override fun publishDataExport(
        exportType: String,
        entityType: String,
        entityId: String,
        exportFormat: String,
        recordCount: Int,
        userId: String?
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
    
    override fun publishCustomEvent(
        eventType: AuditEventType,
        entityType: String,
        entityId: String,
        details: Map<String, Any>,
        correlationId: String?,
        userId: String?
    ) {
        val effectiveUserId = userId ?: getCurrentUserId()?.toString() ?: "system"
        val context = auditContextProvider.getCurrentContext()
        
        // Use SecurityEvent as a generic container for custom events
        val event = AuditEvent.SecurityEvent(
            eventSubType = SecurityEventType.SUSPICIOUS_ACTIVITY, // Default value
            resourceAccessed = entityId,
            success = true,
            details = "Custom audit event: ${eventType.name}",
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
            
        } catch (e: Exception) {
            logger.error("Failed to publish audit event: ${event.eventType}", e)
            handleFailedEventPublication(event, e)
        }
    }
    
    /**
     * Handles failed event publication
     */
    private fun handleFailedEventPublication(event: AuditEvent, exception: Exception) {
        logger.error("Failed to publish audit event: ${event.eventType} for ${event.entityType}:${event.entityId}", exception)
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