package dev.ryuzu.astermanagement.dto.migration

import java.time.LocalDateTime

/**
 * DTO for migration status
 */
data class MigrationStatusDto(
    val id: Long,
    val componentPath: String,
    val reactLoc: Int,
    val vueLoc: Int?,
    val status: MigrationStatus,
    val migratedAt: LocalDateTime?,
    val migratedBy: String?,
    val verifiedAt: LocalDateTime?,
    val verifiedBy: String?,
    val testCoverage: Double?,
    val notes: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

/**
 * Migration status enum
 */
enum class MigrationStatus {
    PENDING,
    IN_PROGRESS,
    MIGRATED,
    VERIFIED
}

/**
 * Request to update migration status
 */
data class UpdateMigrationStatusRequest(
    val componentPath: String,
    val reactLoc: Int?,
    val vueLoc: Int?,
    val status: MigrationStatus?,
    val migratedBy: String?,
    val testCoverage: Double?,
    val notes: String?
)

/**
 * Migration status update request
 */
data class MigrationStatusUpdateDto(
    val status: MigrationStatus? = null,
    val vueLoc: Int? = null,
    val testCoverage: Double? = null,
    val notes: String? = null,
    val verifiedBy: String? = null
)

/**
 * Migration statistics
 */
data class MigrationStatsDto(
    val total: Int,
    val pending: Int,
    val inProgress: Int,
    val migrated: Int,
    val verified: Int,
    val totalReactLoc: Int,
    val totalVueLoc: Int,
    val averageTestCoverage: Double,
    val completionPercentage: Double
)

/**
 * Daily migration metrics
 */
data class MigrationMetricsDto(
    val date: LocalDateTime,
    val totalComponents: Int,
    val pendingComponents: Int,
    val inProgressComponents: Int,
    val migratedComponents: Int,
    val verifiedComponents: Int,
    val totalReactLoc: Int,
    val totalVueLoc: Int,
    val averageTestCoverage: Double?
)

/**
 * Migration issue DTO
 */
data class MigrationIssueDto(
    val id: Long,
    val componentPath: String,
    val issueType: String,
    val severity: IssueSeverity,
    val description: String,
    val suggestedFix: String?,
    val resolved: Boolean,
    val resolvedAt: LocalDateTime?,
    val resolvedBy: String?,
    val createdAt: LocalDateTime
)

/**
 * Issue severity enum
 */
enum class IssueSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

/**
 * Request to report an issue
 */
data class ReportIssueRequest(
    val componentPath: String,
    val issueType: String,
    val severity: IssueSeverity,
    val description: String,
    val suggestedFix: String?
)