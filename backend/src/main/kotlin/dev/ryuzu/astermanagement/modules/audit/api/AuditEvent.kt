package dev.ryuzu.astermanagement.modules.audit.api

import java.time.OffsetDateTime
import java.util.*

/**
 * Public API sealed class for all audit events in the system
 * This is part of the public API for the Audit module
 */
sealed class AuditEvent(
    open val eventType: AuditEventType,
    open val entityType: String,
    open val entityId: String,
    open val userId: String,
    open val timestamp: OffsetDateTime = OffsetDateTime.now(),
    open val metadata: Map<String, Any> = emptyMap()
) {
    
    /**
     * Matter-related audit events
     */
    data class MatterCreated(
        val matterId: String,
        val matterTitle: String,
        val clientName: String,
        val assignedLawyer: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.MATTER_CREATED, "Matter", matterId, userId, metadata = metadata)
    
    data class MatterUpdated(
        val matterId: String,
        val fieldsChanged: List<String>,
        val oldValues: Map<String, Any?>,
        val newValues: Map<String, Any?>,
        override val userId: String,
        val reason: String? = null,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.MATTER_UPDATED, "Matter", matterId, userId, metadata = metadata)
    
    data class MatterStatusChanged(
        val matterId: String,
        val oldStatus: String,
        val newStatus: String,
        val reason: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.MATTER_STATUS_CHANGED, "Matter", matterId, userId, metadata = metadata)
    
    data class MatterDeleted(
        val matterId: String,
        val matterTitle: String,
        val reason: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.MATTER_DELETED, "Matter", matterId, userId, metadata = metadata)
    
    /**
     * Document-related audit events
     */
    data class DocumentUploaded(
        val documentId: String,
        val matterId: String,
        val documentName: String,
        val documentType: String,
        val fileSize: Long,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.DOCUMENT_UPLOADED, "Document", documentId, userId, metadata = metadata)
    
    data class DocumentAccessed(
        val documentId: String,
        val matterId: String,
        val accessType: DocumentAccessType,
        val documentName: String,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.DOCUMENT_ACCESSED, "Document", documentId, userId, metadata = metadata)
    
    /**
     * Authentication and security events
     */
    data class UserLogin(
        override val userId: String,
        val username: String,
        val loginMethod: String,
        val success: Boolean,
        val failureReason: String? = null,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.USER_LOGIN, "Authentication", userId, userId, metadata = metadata)
    
    data class AuthenticationFailed(
        val attemptedUsername: String,
        val failureReason: String,
        val ipAddress: String?,
        override val userId: String = "anonymous",
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.AUTHENTICATION_FAILED, "Authentication", attemptedUsername, userId, metadata = metadata)
    
    data class AuthorizationDenied(
        override val userId: String,
        val username: String,
        val resourceAccessed: String,
        val requiredPermission: String,
        val userPermissions: List<String>,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.AUTHORIZATION_DENIED, "Authorization", resourceAccessed, userId, metadata = metadata)
    
    /**
     * Security events
     */
    data class SecurityEvent(
        val eventSubType: SecurityEventType,
        val resourceAccessed: String?,
        val success: Boolean,
        val details: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.SECURITY_EVENT, "Security", userId, userId, metadata = metadata)
    
    /**
     * System and operational events
     */
    data class BulkOperation(
        val operationType: String,
        override val entityType: String,
        val affectedEntityIds: List<String>,
        val criteria: String?,
        val recordCount: Int,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.BULK_OPERATION, entityType, "bulk-${UUID.randomUUID()}", userId, metadata = metadata)
    
    data class DataExport(
        val exportType: String,
        override val entityType: String,
        override val entityId: String,
        val exportFormat: String,
        val recordCount: Int,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.DATA_EXPORT, entityType, entityId, userId, metadata = metadata)
}