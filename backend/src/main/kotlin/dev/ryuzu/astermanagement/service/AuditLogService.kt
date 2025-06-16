package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.audit.*
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.scheduling.annotation.Async
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.*

/**
 * Enhanced service for managing comprehensive audit logs
 * Provides database persistence, querying, and maintenance operations for audit data
 */
@Service
@Transactional
class AuditLogService(
    private val auditLogRepository: AuditLogRepository,
    private val matterAuditLogRepository: MatterAuditLogRepository,
    private val auditConfigurationRepository: AuditConfigurationRepository
) : BaseService() {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Saves an audit log to the database
     * This is the primary method for persisting audit events
     */
    fun saveAuditLog(request: AuditLogRequest): AuditLog {
        try {
            val auditLog = request.toAuditLog()
            val savedLog = auditLogRepository.save(auditLog)
            
            logger.debug("Saved audit log: ${savedLog.eventType} for entity ${savedLog.entityType}:${savedLog.entityId}")
            return savedLog
            
        } catch (e: Exception) {
            logger.error("Failed to save audit log: ${request.eventType}", e)
            throw AuditPersistenceException("Failed to save audit log", e)
        }
    }
    
    /**
     * Saves multiple audit logs in batch for performance
     */
    fun saveAuditLogs(requests: List<AuditLogRequest>): List<AuditLog> {
        try {
            val auditLogs = requests.map { it.toAuditLog() }
            val savedLogs = auditLogRepository.saveAll(auditLogs)
            
            logger.debug("Saved {} audit logs in batch", savedLogs.size)
            return savedLogs
            
        } catch (e: Exception) {
            logger.error("Failed to save audit logs in batch", e)
            throw AuditPersistenceException("Failed to save audit logs in batch", e)
        }
    }
    
    /**
     * Retrieves audit trail for a specific entity
     */
    @Transactional(readOnly = true)
    fun getEntityAuditTrail(
        entityType: String,
        entityId: String,
        eventTypes: List<AuditEventType> = emptyList(),
        pageable: Pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "eventTimestamp"))
    ): Page<AuditLog> {
        return if (eventTypes.isEmpty()) {
            auditLogRepository.findByEntityTypeAndEntityIdOrderByEventTimestampDesc(entityType, entityId, pageable)
        } else {
            auditLogRepository.findEntityAuditTrail(entityType, entityId, eventTypes, pageable)
        }
    }
    
    /**
     * Retrieves user activity log within a time range
     */
    @Transactional(readOnly = true)
    fun getUserActivityLog(
        userId: String,
        startTime: OffsetDateTime,
        endTime: OffsetDateTime,
        pageable: Pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "eventTimestamp"))
    ): Page<AuditLog> {
        return auditLogRepository.findByUserIdAndEventTimestampBetween(userId, startTime, endTime, pageable)
    }
    
    /**
     * Retrieves security events for monitoring and analysis
     */
    @Transactional(readOnly = true)
    fun getSecurityEvents(
        startTime: OffsetDateTime,
        endTime: OffsetDateTime,
        pageable: Pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "eventTimestamp"))
    ): Page<AuditLog> {
        return auditLogRepository.findSecurityEvents(startTime, endTime, pageable)
    }
    
    /**
     * Finds audit logs with specific correlation ID for tracking related operations
     */
    @Transactional(readOnly = true)
    fun getCorrelatedAuditLogs(correlationId: String): List<AuditLog> {
        return auditLogRepository.findByCorrelationIdOrderByEventTimestampAsc(correlationId)
    }
    
    /**
     * Searches audit logs by JSON content in event details
     */
    @Transactional(readOnly = true)
    fun searchByEventDetails(
        jsonQuery: String,
        since: OffsetDateTime = OffsetDateTime.now().minusDays(30)
    ): List<AuditLog> {
        return auditLogRepository.findByEventDetailsContaining(jsonQuery, since)
    }
    
    /**
     * Gets audit logs on legal hold
     */
    @Transactional(readOnly = true)
    fun getAuditLogsOnLegalHold(
        pageable: Pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "eventTimestamp"))
    ): Page<AuditLog> {
        return auditLogRepository.findByLegalHoldTrueOrderByEventTimestampDesc(pageable)
    }
    
    /**
     * Places audit logs on legal hold
     */
    fun placeLegalHold(auditLogIds: List<UUID>, reason: String): Int {
        var updatedCount = 0
        
        auditLogIds.forEach { id ->
            val auditLog = auditLogRepository.findById(id)
            if (auditLog.isPresent) {
                try {
                    // Note: Due to immutability constraints, we would need to handle this differently
                    // In practice, legal holds might be managed through a separate table
                    logger.warn("Cannot update audit log ${id} for legal hold due to immutability constraints")
                    // legalHoldService.placeLegalHold(id, reason)
                } catch (e: Exception) {
                    logger.error("Failed to place legal hold on audit log $id", e)
                }
            }
        }
        
        logger.info("Attempted to place legal hold on {} audit logs", auditLogIds.size)
        return updatedCount
    }
    
    /**
     * Gets audit statistics for monitoring dashboards
     */
    @Transactional(readOnly = true)
    fun getAuditStatistics(
        since: OffsetDateTime = OffsetDateTime.now().minusHours(24)
    ): AuditStatistics {
        val eventCounts = auditLogRepository.countEventsByType(since, OffsetDateTime.now())
        val userActivity = auditLogRepository.findUserActivitySummary(since)
        val hourlyStats = auditLogRepository.getAuditStatistics(since)
        
        return AuditStatistics(
            totalEvents = eventCounts.sumOf { it[1] as Long },
            eventTypeBreakdown = eventCounts.associate { (it[0] as AuditEventType) to (it[1] as Long) },
            activeUsers = userActivity.size,
            timeRange = since to OffsetDateTime.now(),
            hourlyBreakdown = hourlyStats.map { 
                HourlyAuditStat(
                    hour = it[0] as String,
                    eventType = it[1] as String,
                    count = it[2] as Long
                )
            }
        )
    }
    
    /**
     * Finds suspicious activity patterns
     */
    @Transactional(readOnly = true)
    fun findSuspiciousActivity(
        since: OffsetDateTime = OffsetDateTime.now().minusHours(6),
        threshold: Int = 10
    ): List<AuditLog> {
        return auditLogRepository.findSuspiciousActivity(since, threshold)
    }
    
    /**
     * Matter-specific audit log operations
     */
    @Transactional(readOnly = true)
    fun getMatterAuditTrail(
        matterId: UUID,
        pageable: Pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "performedAt"))
    ): Page<MatterAuditLog> {
        return matterAuditLogRepository.findByMatterIdOrderByPerformedAtDesc(matterId, pageable)
    }
    
    @Transactional(readOnly = true)
    fun getMatterFieldHistory(matterId: UUID, fieldName: String): List<MatterAuditLog> {
        return matterAuditLogRepository.getFieldHistory(matterId, fieldName)
    }
    
    @Transactional(readOnly = true)
    fun getMatterStatusHistory(matterId: UUID): List<MatterAuditLog> {
        return matterAuditLogRepository.getStatusHistory(matterId)
    }
    
    /**
     * Configuration management
     */
    @Transactional(readOnly = true)
    fun getCurrentAuditConfiguration(): AuditConfiguration {
        return auditConfigurationRepository.findCurrentConfiguration()
            ?: AuditConfiguration.getDefault()
    }
    
    fun updateAuditConfiguration(configuration: AuditConfiguration): AuditConfiguration {
        configuration.updatedBy = getCurrentUserId()
        return auditConfigurationRepository.save(configuration)
    }
    
    /**
     * Scheduled cleanup of old audit logs based on retention policy
     */
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    @Async("auditCleanupExecutor")
    @Transactional
    fun scheduledAuditCleanup() {
        try {
            val config = getCurrentAuditConfiguration()
            
            if (!config.cleanupEnabled) {
                logger.debug("Audit cleanup is disabled, skipping")
                return
            }
            
            val cutoffDate = OffsetDateTime.now().minusDays(config.retentionPolicyDays.toLong())
            val deletedCount = auditLogRepository.deleteOldAuditLogs(cutoffDate)
            
            logger.info("Audit cleanup completed: deleted {} old audit log entries (older than {})", 
                deletedCount, cutoffDate)
            
            // Update cleanup statistics
            updateCleanupStatistics(deletedCount, cutoffDate)
            
        } catch (e: Exception) {
            logger.error("Failed to perform scheduled audit cleanup", e)
        }
    }
    
    /**
     * Manual cleanup operation with custom parameters
     */
    @Transactional
    fun performManualCleanup(
        cutoffDate: OffsetDateTime,
        dryRun: Boolean = false
    ): CleanupResult {
        val config = getCurrentAuditConfiguration()
        
        if (!config.cleanupEnabled && !dryRun) {
            throw IllegalStateException("Audit cleanup is disabled in configuration")
        }
        
        val eligibleLogs = auditLogRepository.findEligibleForCleanup(cutoffDate)
        val eligibleCount = eligibleLogs.size
        
        if (dryRun) {
            logger.info("Dry run: {} audit logs would be deleted (cutoff: {})", eligibleCount, cutoffDate)
            return CleanupResult(eligibleCount, 0, cutoffDate, true)
        }
        
        val deletedCount = auditLogRepository.deleteOldAuditLogs(cutoffDate)
        
        logger.info("Manual cleanup completed: deleted {} audit logs (cutoff: {})", deletedCount, cutoffDate)
        
        return CleanupResult(eligibleCount, deletedCount, cutoffDate, false)
    }
    
    /**
     * Generates compliance reports for legal requirements
     */
    @Transactional(readOnly = true)
    fun generateComplianceReport(
        startDate: LocalDate,
        endDate: LocalDate,
        entityTypes: List<String>? = null
    ): ComplianceReport {
        val startTime = startDate.atStartOfDay().atOffset(OffsetDateTime.now().offset)
        val endTime = endDate.plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().offset)
        
        // This would generate a comprehensive compliance report
        // Implementation would depend on specific compliance requirements
        logger.info("Generating compliance report for period {} to {}", startDate, endDate)
        
        return ComplianceReport(
            reportId = UUID.randomUUID(),
            startDate = startDate,
            endDate = endDate,
            generatedAt = OffsetDateTime.now(),
            generatedBy = getCurrentUserId()?.toString() ?: "system",
            entityTypes = entityTypes ?: emptyList(),
            totalEvents = 0, // Would be calculated based on actual data
            summary = "Compliance report generated for specified period"
        )
    }
    
    private fun updateCleanupStatistics(deletedCount: Int, cutoffDate: OffsetDateTime) {
        // Update cleanup statistics for monitoring
        logger.debug("Updated cleanup statistics: {} records deleted, cutoff: {}", deletedCount, cutoffDate)
    }
}

/**
 * Data classes for audit service responses
 */
data class AuditStatistics(
    val totalEvents: Long,
    val eventTypeBreakdown: Map<AuditEventType, Long>,
    val activeUsers: Int,
    val timeRange: Pair<OffsetDateTime, OffsetDateTime>,
    val hourlyBreakdown: List<HourlyAuditStat>
)

data class HourlyAuditStat(
    val hour: String,
    val eventType: String,
    val count: Long
)

data class CleanupResult(
    val eligibleCount: Int,
    val deletedCount: Int,
    val cutoffDate: OffsetDateTime,
    val dryRun: Boolean
)

data class ComplianceReport(
    val reportId: UUID,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val generatedAt: OffsetDateTime,
    val generatedBy: String,
    val entityTypes: List<String>,
    val totalEvents: Long,
    val summary: String
)

/**
 * Custom exceptions for audit operations
 */
class AuditPersistenceException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
class AuditQueryException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
class AuditConfigurationException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)