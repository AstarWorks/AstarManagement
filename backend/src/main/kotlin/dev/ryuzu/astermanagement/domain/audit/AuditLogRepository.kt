package dev.ryuzu.astermanagement.domain.audit

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

/**
 * Repository for comprehensive audit log operations
 * Provides efficient querying for compliance reporting and audit trail access
 */
@Repository
interface AuditLogRepository : JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {
    
    /**
     * Find audit logs for a specific entity with pagination
     */
    fun findByEntityTypeAndEntityIdOrderByEventTimestampDesc(
        entityType: String,
        entityId: String,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs for a specific user within a time range
     */
    fun findByUserIdAndEventTimestampBetween(
        userId: String,
        startTime: OffsetDateTime,
        endTime: OffsetDateTime,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs by event type after a specific timestamp
     */
    fun findByEventTypeAndEventTimestampAfter(
        eventType: AuditEventType,
        timestamp: OffsetDateTime
    ): List<AuditLog>
    
    /**
     * Find audit logs by multiple event types for an entity
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE al.entityType = :entityType 
        AND al.entityId = :entityId 
        AND al.eventType IN :eventTypes
        ORDER BY al.eventTimestamp DESC
    """)
    fun findEntityAuditTrail(
        @Param("entityType") entityType: String,
        @Param("entityId") entityId: String,
        @Param("eventTypes") eventTypes: List<AuditEventType>,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs with correlation ID for tracking related operations
     */
    fun findByCorrelationIdOrderByEventTimestampAsc(correlationId: String): List<AuditLog>
    
    /**
     * Find security events within a time range
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE al.eventType IN ('AUTHENTICATION_FAILED', 'AUTHORIZATION_DENIED', 'SECURITY_EVENT')
        AND al.eventTimestamp BETWEEN :startTime AND :endTime
        ORDER BY al.eventTimestamp DESC
    """)
    fun findSecurityEvents(
        @Param("startTime") startTime: OffsetDateTime,
        @Param("endTime") endTime: OffsetDateTime,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs by IP address for security analysis
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE CAST(al.ipAddress AS string) = :ipAddress
        AND al.eventTimestamp >= :since
        ORDER BY al.eventTimestamp DESC
    """)
    fun findByIpAddressAndEventTimestampAfter(
        @Param("ipAddress") ipAddress: String,
        @Param("since") since: OffsetDateTime
    ): List<AuditLog>
    
    /**
     * Count audit events by type within a time range
     */
    @Query("""
        SELECT al.eventType, COUNT(al) FROM AuditLog al 
        WHERE al.eventTimestamp BETWEEN :startTime AND :endTime
        GROUP BY al.eventType
    """)
    fun countEventsByType(
        @Param("startTime") startTime: OffsetDateTime,
        @Param("endTime") endTime: OffsetDateTime
    ): List<Array<Any>>
    
    /**
     * Find user activity summary
     */
    @Query("""
        SELECT al.userId, al.userName, COUNT(al) as eventCount, MAX(al.eventTimestamp) as lastActivity
        FROM AuditLog al 
        WHERE al.eventTimestamp >= :since
        GROUP BY al.userId, al.userName
        ORDER BY eventCount DESC
    """)
    fun findUserActivitySummary(@Param("since") since: OffsetDateTime): List<Array<Any>>
    
    /**
     * Find audit logs with JSON path queries on event details
     */
    @Query(value = """
        SELECT * FROM audit_logs 
        WHERE event_details @> CAST(:jsonPath AS jsonb)
        AND event_timestamp >= :since
        ORDER BY event_timestamp DESC
    """, nativeQuery = true)
    fun findByEventDetailsContaining(
        @Param("jsonPath") jsonPath: String,
        @Param("since") since: OffsetDateTime
    ): List<AuditLog>
    
    /**
     * Find audit logs on legal hold
     */
    fun findByLegalHoldTrueOrderByEventTimestampDesc(pageable: Pageable): Page<AuditLog>
    
    /**
     * Find audit logs eligible for cleanup (respecting retention policy and legal holds)
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE al.eventTimestamp < :cutoffDate 
        AND (al.legalHold = false OR al.legalHold IS NULL)
        AND (al.retentionUntil IS NULL OR al.retentionUntil < CURRENT_DATE)
    """)
    fun findEligibleForCleanup(@Param("cutoffDate") cutoffDate: OffsetDateTime): List<AuditLog>
    
    /**
     * Delete old audit logs (used by cleanup process only)
     * This method should only be called by the automated cleanup service
     */
    @Modifying
    @Query("""
        DELETE FROM AuditLog al 
        WHERE al.eventTimestamp < :cutoffDate 
        AND (al.legalHold = false OR al.legalHold IS NULL)
        AND (al.retentionUntil IS NULL OR al.retentionUntil < CURRENT_DATE)
    """)
    fun deleteOldAuditLogs(@Param("cutoffDate") cutoffDate: OffsetDateTime): Int
    
    /**
     * Get audit statistics for monitoring dashboards
     */
    @Query(value = """
        SELECT 
            DATE_TRUNC('hour', event_timestamp) as hour,
            event_type,
            COUNT(*) as count
        FROM audit_logs 
        WHERE event_timestamp >= :since
        GROUP BY DATE_TRUNC('hour', event_timestamp), event_type
        ORDER BY hour DESC
    """, nativeQuery = true)
    fun getAuditStatistics(@Param("since") since: OffsetDateTime): List<Array<Any>>
    
    /**
     * Find failed audit attempts for security monitoring
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE al.eventType IN ('AUTHENTICATION_FAILED', 'AUTHORIZATION_DENIED')
        AND al.eventTimestamp >= :since
        AND al.ipAddress IS NOT NULL
        GROUP BY al.ipAddress
        HAVING COUNT(al) > :threshold
    """)
    fun findSuspiciousActivity(
        @Param("since") since: OffsetDateTime,
        @Param("threshold") threshold: Int
    ): List<AuditLog>
}