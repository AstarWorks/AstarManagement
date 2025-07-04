package dev.ryuzu.astermanagement.modules.audit.api

import dev.ryuzu.astermanagement.config.AuditContext
import dev.ryuzu.astermanagement.modules.audit.domain.AuditLogRequest
import java.net.InetAddress

/**
 * Extension functions for AuditEvent to support conversion to AuditLogRequest
 */
fun AuditEvent.toAuditLogRequest(context: AuditContext? = null): AuditLogRequest {
    val enrichedMetadata = metadata.toMutableMap()
    
    // Add context information if available
    context?.let { ctx ->
        enrichedMetadata.putAll(ctx.toMap().filterValues { it != null } as Map<String, Any>)
    }
    
    // Add event-specific details based on event type
    when (this) {
        is AuditEvent.MatterStatusChanged -> {
            enrichedMetadata["oldStatus"] = oldStatus
            enrichedMetadata["newStatus"] = newStatus
            reason?.let { enrichedMetadata["reason"] = it }
        }
        is AuditEvent.DocumentAccessed -> {
            enrichedMetadata["accessType"] = accessType.name
            enrichedMetadata["documentName"] = documentName
            enrichedMetadata["matterId"] = matterId
        }
        is AuditEvent.AuthenticationFailed -> {
            enrichedMetadata["attemptedUsername"] = attemptedUsername
            enrichedMetadata["failureReason"] = failureReason
            ipAddress?.let { enrichedMetadata["sourceIpAddress"] = it }
        }
        is AuditEvent.AuthorizationDenied -> {
            enrichedMetadata["resourceAccessed"] = resourceAccessed
            enrichedMetadata["requiredPermission"] = requiredPermission
            enrichedMetadata["userPermissions"] = userPermissions
        }
        is AuditEvent.SecurityEvent -> {
            enrichedMetadata["securityEventType"] = eventSubType.name
            enrichedMetadata["success"] = success
            details?.let { enrichedMetadata["details"] = it }
        }
        is AuditEvent.BulkOperation -> {
            enrichedMetadata["operationType"] = operationType
            enrichedMetadata["affectedEntityIds"] = affectedEntityIds
            enrichedMetadata["recordCount"] = recordCount
            criteria?.let { enrichedMetadata["criteria"] = it }
        }
        else -> {
            // Add common fields for other event types
            if (this is AuditEvent.MatterUpdated) {
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