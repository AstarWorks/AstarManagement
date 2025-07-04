package dev.ryuzu.astermanagement.modules.audit.api

import java.util.*

/**
 * Public API interface for publishing audit events throughout the application
 * This is the main public interface for the Audit module
 */
interface AuditEventPublisher {
    
    /**
     * Matter-related audit event publishing
     */
    fun publishMatterCreated(
        matterId: UUID,
        matterTitle: String,
        clientName: String,
        assignedLawyer: String?,
        userId: String? = null
    )
    
    fun publishMatterStatusChanged(
        matterId: UUID,
        oldStatus: String,
        newStatus: String,
        reason: String?,
        userId: String? = null
    )
    
    fun publishMatterUpdated(
        matterId: UUID,
        fieldsChanged: List<String>,
        oldValues: Map<String, Any?>,
        newValues: Map<String, Any?>,
        reason: String? = null,
        userId: String? = null
    )
    
    fun publishMatterDeleted(
        matterId: UUID,
        matterTitle: String,
        reason: String?,
        userId: String? = null
    )
    
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
    )
    
    fun publishDocumentAccessed(
        documentId: UUID,
        matterId: UUID,
        documentName: String,
        accessType: DocumentAccessType,
        userId: String? = null
    )
    
    /**
     * Authentication and security event publishing
     */
    fun publishUserLogin(
        userId: UUID,
        username: String,
        loginMethod: String,
        success: Boolean,
        failureReason: String? = null
    )
    
    fun publishAuthenticationFailed(
        attemptedUsername: String,
        failureReason: String,
        ipAddress: String? = null
    )
    
    fun publishAuthorizationDenied(
        userId: UUID,
        username: String,
        resourceAccessed: String,
        requiredPermission: String,
        userPermissions: List<String>
    )
    
    /**
     * Security event publishing
     */
    fun publishSecurityEvent(
        eventSubType: SecurityEventType,
        resourceAccessed: String?,
        success: Boolean,
        details: String?,
        userId: String? = null
    )
    
    /**
     * Bulk operation event publishing
     */
    fun publishBulkOperation(
        operationType: String,
        entityType: String,
        affectedEntityIds: List<String>,
        criteria: String?,
        userId: String? = null
    )
    
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
    )
    
    /**
     * Generic audit event publishing
     */
    fun publishCustomEvent(
        eventType: AuditEventType,
        entityType: String,
        entityId: String,
        details: Map<String, Any> = emptyMap(),
        correlationId: String? = null,
        userId: String? = null
    )
}