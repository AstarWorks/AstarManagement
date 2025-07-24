package dev.ryuzu.astermanagement.dto.audit

import dev.ryuzu.astermanagement.domain.audit.AuditAction
import java.time.Instant
import java.util.*

/**
 * DTO for matter audit log responses
 */
data class MatterAuditLogDto(
    val id: UUID,
    val matterId: UUID,
    val action: AuditAction,
    val fieldName: String?,
    val oldValue: String?,
    val newValue: String?,
    val performedAt: Instant,
    val performedBy: UUID,
    val performedByName: String,
    val ipAddress: String,
    val userAgent: String,
    val sessionId: String,
    val changeReason: String?
)

/**
 * Extension function to convert MatterAuditLog entity to DTO
 */
fun dev.ryuzu.astermanagement.domain.audit.MatterAuditLog.toDto(): MatterAuditLogDto {
    return MatterAuditLogDto(
        id = id,
        matterId = matterId,
        action = action,
        fieldName = fieldName,
        oldValue = oldValue,
        newValue = newValue,
        performedAt = performedAt.toInstant(),
        performedBy = performedBy,
        performedByName = performedByName,
        ipAddress = ipAddress,
        userAgent = userAgent,
        sessionId = sessionId,
        changeReason = changeReason
    )
}