package dev.ryuzu.astermanagement.dto.audit

import dev.ryuzu.astermanagement.domain.audit.AuditEventType
import dev.ryuzu.astermanagement.domain.audit.AuditLog
import io.swagger.v3.oas.annotations.media.Schema
import java.net.InetAddress
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.*

/**
 * DTO for audit log responses
 * Provides a safe external representation of audit log data
 */
@Schema(description = "Audit log entry with comprehensive event information")
data class AuditLogDto(
    @Schema(description = "Unique audit log ID")
    val id: UUID?,
    
    @Schema(description = "Type of audit event")
    val eventType: AuditEventType,
    
    @Schema(description = "Type of entity being audited")
    val entityType: String,
    
    @Schema(description = "ID of the entity being audited")
    val entityId: String,
    
    @Schema(description = "ID of user who performed the action")
    val userId: String,
    
    @Schema(description = "Username of user who performed the action")
    val userName: String?,
    
    @Schema(description = "Timestamp when the event occurred")
    val eventTimestamp: OffsetDateTime,
    
    @Schema(description = "IP address of the client")
    val ipAddress: String?,
    
    @Schema(description = "User agent string from the request")
    val userAgent: String?,
    
    @Schema(description = "Session ID")
    val sessionId: String?,
    
    @Schema(description = "Request correlation ID")
    val requestId: String?,
    
    @Schema(description = "Event-specific details as JSON")
    val eventDetails: Map<String, Any>,
    
    @Schema(description = "Old values before change (for update events)")
    val oldValues: Map<String, Any>?,
    
    @Schema(description = "New values after change (for create/update events)")
    val newValues: Map<String, Any>?,
    
    @Schema(description = "Correlation ID for related operations")
    val correlationId: String?,
    
    @Schema(description = "Database transaction ID")
    val transactionId: String?,
    
    @Schema(description = "Date until which this record should be retained")
    val retentionUntil: LocalDate?,
    
    @Schema(description = "Whether this record is on legal hold")
    val legalHold: Boolean,
    
    @Schema(description = "When this audit record was created")
    val createdAt: OffsetDateTime
)

/**
 * Extension function to convert AuditLog entity to DTO
 */
fun AuditLog.toDto(): AuditLogDto {
    return AuditLogDto(
        id = id,
        eventType = eventType,
        entityType = entityType,
        entityId = entityId,
        userId = userId,
        userName = userName,
        eventTimestamp = eventTimestamp,
        ipAddress = ipAddress?.hostAddress,
        userAgent = userAgent,
        sessionId = sessionId,
        requestId = requestId,
        eventDetails = eventDetails,
        oldValues = oldValues,
        newValues = newValues,
        correlationId = correlationId,
        transactionId = transactionId,
        retentionUntil = retentionUntil,
        legalHold = legalHold,
        createdAt = createdAt
    )
}

/**
 * Request DTOs for audit API operations
 */
@Schema(description = "Request for searching audit logs")
data class AuditSearchRequest(
    @Schema(description = "JSON path query for searching event details")
    val jsonQuery: String,
    
    @Schema(description = "Start time for search (optional, defaults to 30 days ago)")
    val since: OffsetDateTime? = null
)

@Schema(description = "Request for placing audit logs on legal hold")
data class LegalHoldRequest(
    @Schema(description = "List of audit log IDs to place on legal hold")
    val auditLogIds: List<UUID>,
    
    @Schema(description = "Reason for legal hold")
    val reason: String
)

@Schema(description = "Response for legal hold operations")
data class LegalHoldResponse(
    @Schema(description = "Whether the operation was successful")
    val success: Boolean,
    
    @Schema(description = "Number of audit logs updated")
    val updatedCount: Int,
    
    @Schema(description = "Result message")
    val message: String
)

@Schema(description = "Request for generating compliance reports")
data class ComplianceReportRequest(
    @Schema(description = "Start date for the report")
    val startDate: LocalDate,
    
    @Schema(description = "End date for the report")
    val endDate: LocalDate,
    
    @Schema(description = "Entity types to include (optional)")
    val entityTypes: List<String>? = null
)

@Schema(description = "Request for manual audit cleanup")
data class CleanupRequest(
    @Schema(description = "Cutoff date for cleanup (audit logs older than this will be deleted)")
    val cutoffDate: OffsetDateTime,
    
    @Schema(description = "Whether to perform a dry run (no actual deletion)")
    val dryRun: Boolean = false
)