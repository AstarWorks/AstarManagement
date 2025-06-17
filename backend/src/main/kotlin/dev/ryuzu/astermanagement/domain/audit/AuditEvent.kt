package dev.ryuzu.astermanagement.domain.audit

import dev.ryuzu.astermanagement.config.AuditContext
import java.time.OffsetDateTime
import java.util.*

/**
 * Base sealed class for all audit events in the system
 * Provides type-safe event publishing and handling
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
    
    data class DocumentModified(
        val documentId: String,
        val matterId: String,
        val modificationType: String,
        val documentName: String,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.DOCUMENT_MODIFIED, "Document", documentId, userId, metadata = metadata)
    
    data class DocumentDeleted(
        val documentId: String,
        val matterId: String,
        val documentName: String,
        val reason: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.DOCUMENT_DELETED, "Document", documentId, userId, metadata = metadata)
    
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
    
    data class UserLogout(
        override val userId: String,
        val username: String,
        val sessionDuration: Long? = null,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.USER_LOGOUT, "Authentication", userId, userId, metadata = metadata)
    
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
     * Memo-related audit events
     */
    data class MemoCreated(
        val memoId: String,
        val matterId: String?,
        val memoType: String,
        val memoTitle: String,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.MEMO_CREATED, "Memo", memoId, userId, metadata = metadata)
    
    data class MemoUpdated(
        val memoId: String,
        val matterId: String?,
        val fieldsChanged: List<String>,
        val oldValues: Map<String, Any?>,
        val newValues: Map<String, Any?>,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.MEMO_UPDATED, "Memo", memoId, userId, metadata = metadata)
    
    data class MemoDeleted(
        val memoId: String,
        val matterId: String?,
        val memoTitle: String,
        val reason: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.MEMO_DELETED, "Memo", memoId, userId, metadata = metadata)
    
    /**
     * Expense-related audit events
     */
    data class ExpenseCreated(
        val expenseId: String,
        val matterId: String?,
        val amount: Double,
        val expenseType: String,
        val description: String,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.EXPENSE_CREATED, "Expense", expenseId, userId, metadata = metadata)
    
    data class ExpenseUpdated(
        val expenseId: String,
        val matterId: String?,
        val fieldsChanged: List<String>,
        val oldValues: Map<String, Any?>,
        val newValues: Map<String, Any?>,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.EXPENSE_UPDATED, "Expense", expenseId, userId, metadata = metadata)
    
    data class ExpenseDeleted(
        val expenseId: String,
        val matterId: String?,
        val amount: Double,
        val reason: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.EXPENSE_DELETED, "Expense", expenseId, userId, metadata = metadata)
    
    /**
     * System and operational events
     */
    data class SecurityEvent(
        val eventSubType: SecurityEventType,
        val resourceAccessed: String?,
        val success: Boolean,
        val details: String?,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.SECURITY_EVENT, "Security", userId, userId, metadata = metadata)
    
    data class SystemEvent(
        val systemEventType: String,
        val component: String,
        val description: String,
        val severity: String,
        override val userId: String = "system",
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.SYSTEM_EVENT, "System", component, userId, metadata = metadata)
    
    data class DataExport(
        val exportType: String,
        override val entityType: String,
        override val entityId: String,
        val exportFormat: String,
        val recordCount: Int,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.DATA_EXPORT, entityType, entityId, userId, metadata = metadata)
    
    data class BulkOperation(
        val operationType: String,
        override val entityType: String,
        val affectedEntityIds: List<String>,
        val criteria: String?,
        val recordCount: Int,
        override val userId: String,
        override val metadata: Map<String, Any> = emptyMap()
    ) : AuditEvent(AuditEventType.BULK_OPERATION, entityType, "bulk-${UUID.randomUUID()}", userId, metadata = metadata)
    
    /**
     * Creates an audit log request from this event
     */
    fun toAuditLogRequest(context: AuditContext? = null): AuditLogRequest {
        val enrichedMetadata = metadata.toMutableMap()
        
        // Add context information if available
        context?.let { ctx ->
            enrichedMetadata.putAll(ctx.toMap().filterValues { it != null } as Map<String, Any>)
        }
        
        // Add event-specific details based on event type
        when (this) {
            is MatterStatusChanged -> {
                enrichedMetadata["oldStatus"] = oldStatus
                enrichedMetadata["newStatus"] = newStatus
                reason?.let { enrichedMetadata["reason"] = it }
            }
            is DocumentAccessed -> {
                enrichedMetadata["accessType"] = accessType.name
                enrichedMetadata["documentName"] = documentName
                enrichedMetadata["matterId"] = matterId
            }
            is AuthenticationFailed -> {
                enrichedMetadata["attemptedUsername"] = attemptedUsername
                enrichedMetadata["failureReason"] = failureReason
                ipAddress?.let { enrichedMetadata["sourceIpAddress"] = it }
            }
            is AuthorizationDenied -> {
                enrichedMetadata["resourceAccessed"] = resourceAccessed
                enrichedMetadata["requiredPermission"] = requiredPermission
                enrichedMetadata["userPermissions"] = userPermissions
            }
            is SecurityEvent -> {
                enrichedMetadata["securityEventType"] = eventSubType.name
                enrichedMetadata["success"] = success
                details?.let { enrichedMetadata["details"] = it }
            }
            is BulkOperation -> {
                enrichedMetadata["operationType"] = operationType
                enrichedMetadata["affectedEntityIds"] = affectedEntityIds
                enrichedMetadata["recordCount"] = recordCount
                criteria?.let { enrichedMetadata["criteria"] = it }
            }
            else -> {
                // Add common fields for other event types
                if (this is MatterUpdated) {
                    enrichedMetadata["fieldsChanged"] = fieldsChanged
                    enrichedMetadata["oldValues"] = oldValues
                    enrichedMetadata["newValues"] = newValues
                }
            }
        }
        
        return AuditLogRequest(
            eventType = eventType,
            entityType = entityType,
            entityId = entityId,
            userId = userId,
            eventDetails = enrichedMetadata,
            correlationId = metadata["correlationId"] as? String
        )
    }
}