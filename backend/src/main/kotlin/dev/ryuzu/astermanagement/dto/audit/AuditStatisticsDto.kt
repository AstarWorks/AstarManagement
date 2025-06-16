package dev.ryuzu.astermanagement.dto.audit

import dev.ryuzu.astermanagement.domain.audit.AuditEventType
import dev.ryuzu.astermanagement.service.AuditStatistics
import dev.ryuzu.astermanagement.service.CleanupResult
import dev.ryuzu.astermanagement.service.ComplianceReport
import dev.ryuzu.astermanagement.service.HourlyAuditStat
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.*

/**
 * DTO for audit statistics
 */
@Schema(description = "Audit statistics for monitoring and reporting")
data class AuditStatisticsDto(
    @Schema(description = "Total number of audit events in the time range")
    val totalEvents: Long,
    
    @Schema(description = "Breakdown of events by type")
    val eventTypeBreakdown: Map<AuditEventType, Long>,
    
    @Schema(description = "Number of active users in the time range")
    val activeUsers: Int,
    
    @Schema(description = "Start time of the statistics period")
    val startTime: OffsetDateTime,
    
    @Schema(description = "End time of the statistics period")
    val endTime: OffsetDateTime,
    
    @Schema(description = "Hourly breakdown of audit events")
    val hourlyBreakdown: List<HourlyAuditStatDto>
)

@Schema(description = "Hourly audit statistics")
data class HourlyAuditStatDto(
    @Schema(description = "Hour timestamp")
    val hour: String,
    
    @Schema(description = "Event type")
    val eventType: String,
    
    @Schema(description = "Number of events in this hour")
    val count: Long
)

/**
 * Extension function to convert AuditStatistics to DTO
 */
fun AuditStatistics.toDto(): AuditStatisticsDto {
    return AuditStatisticsDto(
        totalEvents = totalEvents,
        eventTypeBreakdown = eventTypeBreakdown,
        activeUsers = activeUsers,
        startTime = timeRange.first,
        endTime = timeRange.second,
        hourlyBreakdown = hourlyBreakdown.map { it.toDto() }
    )
}

/**
 * Extension function to convert HourlyAuditStat to DTO
 */
fun HourlyAuditStat.toDto(): HourlyAuditStatDto {
    return HourlyAuditStatDto(
        hour = hour,
        eventType = eventType,
        count = count
    )
}

/**
 * DTO for cleanup results
 */
@Schema(description = "Results of audit log cleanup operation")
data class CleanupResultDto(
    @Schema(description = "Number of audit logs eligible for deletion")
    val eligibleCount: Int,
    
    @Schema(description = "Number of audit logs actually deleted")
    val deletedCount: Int,
    
    @Schema(description = "Cutoff date used for cleanup")
    val cutoffDate: OffsetDateTime,
    
    @Schema(description = "Whether this was a dry run (no actual deletion)")
    val dryRun: Boolean,
    
    @Schema(description = "Success status of the cleanup operation")
    val success: Boolean = true,
    
    @Schema(description = "Any messages or warnings from the cleanup operation")
    val message: String? = null
)

/**
 * Extension function to convert CleanupResult to DTO
 */
fun CleanupResult.toDto(): CleanupResultDto {
    return CleanupResultDto(
        eligibleCount = eligibleCount,
        deletedCount = deletedCount,
        cutoffDate = cutoffDate,
        dryRun = dryRun,
        success = true,
        message = if (dryRun) {
            "Dry run completed: $eligibleCount audit logs would be deleted"
        } else {
            "Cleanup completed: $deletedCount audit logs deleted"
        }
    )
}

/**
 * DTO for compliance reports
 */
@Schema(description = "Compliance report for legal and regulatory requirements")
data class ComplianceReportDto(
    @Schema(description = "Unique report ID")
    val reportId: UUID,
    
    @Schema(description = "Start date of the report period")
    val startDate: LocalDate,
    
    @Schema(description = "End date of the report period")
    val endDate: LocalDate,
    
    @Schema(description = "When the report was generated")
    val generatedAt: OffsetDateTime,
    
    @Schema(description = "User who generated the report")
    val generatedBy: String,
    
    @Schema(description = "Entity types included in the report")
    val entityTypes: List<String>,
    
    @Schema(description = "Total number of audit events in the report period")
    val totalEvents: Long,
    
    @Schema(description = "Summary of the compliance report")
    val summary: String,
    
    @Schema(description = "Breakdown of events by type")
    val eventBreakdown: Map<String, Long> = emptyMap(),
    
    @Schema(description = "Breakdown of events by entity type")
    val entityBreakdown: Map<String, Long> = emptyMap(),
    
    @Schema(description = "Security events summary")
    val securityEventsSummary: Map<String, Any> = emptyMap(),
    
    @Schema(description = "Compliance status indicators")
    val complianceStatus: ComplianceStatusDto = ComplianceStatusDto()
)

@Schema(description = "Compliance status indicators")
data class ComplianceStatusDto(
    @Schema(description = "Whether all required audit events are present")
    val allEventsPresent: Boolean = true,
    
    @Schema(description = "Whether retention policies are being followed")
    val retentionCompliant: Boolean = true,
    
    @Schema(description = "Whether legal holds are properly maintained")
    val legalHoldsCompliant: Boolean = true,
    
    @Schema(description = "Any compliance issues found")
    val issues: List<String> = emptyList(),
    
    @Schema(description = "Overall compliance score (0-100)")
    val complianceScore: Int = 100
)

/**
 * Extension function to convert ComplianceReport to DTO
 */
fun ComplianceReport.toDto(): ComplianceReportDto {
    return ComplianceReportDto(
        reportId = reportId,
        startDate = startDate,
        endDate = endDate,
        generatedAt = generatedAt,
        generatedBy = generatedBy,
        entityTypes = entityTypes,
        totalEvents = totalEvents,
        summary = summary,
        // In a real implementation, these would be calculated from actual data
        eventBreakdown = emptyMap(),
        entityBreakdown = emptyMap(),
        securityEventsSummary = emptyMap(),
        complianceStatus = ComplianceStatusDto()
    )
}