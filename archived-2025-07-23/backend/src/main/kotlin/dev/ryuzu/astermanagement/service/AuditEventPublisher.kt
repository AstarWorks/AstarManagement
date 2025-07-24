package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher as AuditEventPublisherApi
import dev.ryuzu.astermanagement.modules.audit.api.DocumentAccessType
import dev.ryuzu.astermanagement.modules.audit.api.SecurityEventType
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventType
import org.springframework.stereotype.Service
import java.util.*

/**
 * Legacy service wrapper that delegates to the new audit module
 * Maintains backward compatibility while using the new Spring Modulith structure
 * @deprecated Use AuditEventPublisher from modules.audit.api directly
 */
@Service
@Deprecated("Use dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher instead")  
class AuditEventPublisher(
    private val auditEventPublisherApi: AuditEventPublisherApi
) {
    
    fun publishMatterCreated(
        matterId: UUID,
        matterTitle: String,
        clientName: String,
        assignedLawyer: String?,
        userId: String? = null
    ) = auditEventPublisherApi.publishMatterCreated(matterId, matterTitle, clientName, assignedLawyer, userId)
    
    fun publishMatterStatusChanged(
        matterId: UUID,
        oldStatus: String,
        newStatus: String,
        reason: String?,
        userId: String? = null
    ) = auditEventPublisherApi.publishMatterStatusChanged(matterId, oldStatus, newStatus, reason, userId)
    
    fun publishMatterUpdated(
        matterId: UUID,
        fieldsChanged: List<String>,
        oldValues: Map<String, Any?>,
        newValues: Map<String, Any?>,
        reason: String? = null,
        userId: String? = null
    ) = auditEventPublisherApi.publishMatterUpdated(matterId, fieldsChanged, oldValues, newValues, reason, userId)
    
    fun publishMatterDeleted(
        matterId: UUID,
        matterTitle: String,
        reason: String?,
        userId: String? = null
    ) = auditEventPublisherApi.publishMatterDeleted(matterId, matterTitle, reason, userId)
    
    fun publishDocumentUploaded(
        documentId: UUID,
        matterId: UUID,
        documentName: String,
        documentType: String,
        fileSize: Long,
        userId: String? = null
    ) = auditEventPublisherApi.publishDocumentUploaded(documentId, matterId, documentName, documentType, fileSize, userId)
    
    fun publishDocumentAccessed(
        documentId: UUID,
        matterId: UUID,
        documentName: String,
        accessType: DocumentAccessType,
        userId: String? = null
    ) = auditEventPublisherApi.publishDocumentAccessed(documentId, matterId, documentName, accessType, userId)
    
    fun publishUserLogin(
        userId: UUID,
        username: String,
        loginMethod: String,
        success: Boolean,
        failureReason: String? = null
    ) = auditEventPublisherApi.publishUserLogin(userId, username, loginMethod, success, failureReason)
    
    fun publishAuthenticationFailed(
        attemptedUsername: String,
        failureReason: String,
        ipAddress: String? = null
    ) = auditEventPublisherApi.publishAuthenticationFailed(attemptedUsername, failureReason, ipAddress)
    
    fun publishAuthorizationDenied(
        userId: UUID,
        username: String,
        resourceAccessed: String,
        requiredPermission: String,
        userPermissions: List<String>
    ) = auditEventPublisherApi.publishAuthorizationDenied(userId, username, resourceAccessed, requiredPermission, userPermissions)
    
    fun publishSecurityEvent(
        eventSubType: SecurityEventType,
        resourceAccessed: String?,
        success: Boolean,
        details: String?,
        userId: String? = null
    ) = auditEventPublisherApi.publishSecurityEvent(eventSubType, resourceAccessed, success, details, userId)
    
    fun publishBulkOperation(
        operationType: String,
        entityType: String,
        affectedEntityIds: List<String>,
        criteria: String?,
        userId: String? = null
    ) = auditEventPublisherApi.publishBulkOperation(operationType, entityType, affectedEntityIds, criteria, userId)
    
    fun publishDataExport(
        exportType: String,
        entityType: String,
        entityId: String,
        exportFormat: String,
        recordCount: Int,
        userId: String? = null
    ) = auditEventPublisherApi.publishDataExport(exportType, entityType, entityId, exportFormat, recordCount, userId)
    
    fun publishCustomEvent(
        eventType: AuditEventType,
        entityType: String,
        entityId: String,
        details: Map<String, Any> = emptyMap(),
        correlationId: String? = null,
        userId: String? = null
    ) = auditEventPublisherApi.publishCustomEvent(eventType, entityType, entityId, details, correlationId, userId)
}