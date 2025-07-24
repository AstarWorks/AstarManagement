package dev.ryuzu.astermanagement.modules.audit.domain

import dev.ryuzu.astermanagement.modules.audit.api.AuditEventType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

/**
 * Repository interface for audit logs
 * Provides advanced querying capabilities for audit trail analysis
 */
@Repository
interface AuditLogRepository : JpaRepository<AuditLog, UUID> {
    
    /**
     * Find audit logs by entity type and ID with pagination
     */
    fun findByEntityTypeAndEntityIdOrderByEventTimestampDesc(
        entityType: String,
        entityId: String,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs by user ID with pagination
     */
    fun findByUserIdOrderByEventTimestampDesc(
        userId: String,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs by event type with pagination
     */
    fun findByEventTypeOrderByEventTimestampDesc(
        eventType: AuditEventType,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs within date range
     */
    fun findByEventTimestampBetweenOrderByEventTimestampDesc(
        startDate: OffsetDateTime,
        endDate: OffsetDateTime,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find audit logs by correlation ID
     */
    fun findByCorrelationIdOrderByEventTimestampAsc(correlationId: String): List<AuditLog>
    
    /**
     * Complex query for audit trail analysis
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE (:entityType IS NULL OR al.entityType = :entityType)
        AND (:entityId IS NULL OR al.entityId = :entityId)
        AND (:userId IS NULL OR al.userId = :userId)
        AND (:eventType IS NULL OR al.eventType = :eventType)
        AND (:startDate IS NULL OR al.eventTimestamp >= :startDate)
        AND (:endDate IS NULL OR al.eventTimestamp <= :endDate)
        ORDER BY al.eventTimestamp DESC
    """)
    fun findAuditTrail(
        @Param("entityType") entityType: String?,
        @Param("entityId") entityId: String?,
        @Param("userId") userId: String?,
        @Param("eventType") eventType: AuditEventType?,
        @Param("startDate") startDate: OffsetDateTime?,
        @Param("endDate") endDate: OffsetDateTime?,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Find recent audit logs for security monitoring
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE al.eventType IN :securityEventTypes
        AND al.eventTimestamp >= :since
        ORDER BY al.eventTimestamp DESC
    """)
    fun findRecentSecurityEvents(
        @Param("securityEventTypes") securityEventTypes: List<AuditEventType>,
        @Param("since") since: OffsetDateTime,
        pageable: Pageable
    ): Page<AuditLog>
    
    /**
     * Count audit logs by event type for analytics
     */
    @Query("SELECT al.eventType, COUNT(al) FROM AuditLog al GROUP BY al.eventType")
    fun countByEventType(): List<Array<Any>>
    
    /**
     * Find audit logs with legal hold
     */
    fun findByLegalHoldTrueOrderByEventTimestampDesc(pageable: Pageable): Page<AuditLog>
    
    /**
     * Find audit logs ready for retention cleanup
     */
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE al.retentionUntil < CURRENT_DATE 
        AND al.legalHold = false
        ORDER BY al.eventTimestamp ASC
    """)
    fun findLogsForRetentionCleanup(pageable: Pageable): Page<AuditLog>
    
    /**
     * Advanced search with JSONB query support
     */
    @Query(value = """
        SELECT * FROM audit_logs al 
        WHERE (:eventType IS NULL OR al.event_type = CAST(:eventType AS varchar))
        AND (:entityType IS NULL OR al.entity_type = :entityType)
        AND (:userId IS NULL OR al.user_id = :userId)
        AND (:jsonPath IS NULL OR al.event_details @> CAST(:jsonQuery AS jsonb))
        AND (:startDate IS NULL OR al.event_timestamp >= :startDate)
        AND (:endDate IS NULL OR al.event_timestamp <= :endDate)
        ORDER BY al.event_timestamp DESC
    """, nativeQuery = true)
    fun searchAuditLogs(
        @Param("eventType") eventType: String?,
        @Param("entityType") entityType: String?,
        @Param("userId") userId: String?,
        @Param("jsonPath") jsonPath: String?,
        @Param("jsonQuery") jsonQuery: String?,
        @Param("startDate") startDate: OffsetDateTime?,
        @Param("endDate") endDate: OffsetDateTime?,
        pageable: Pageable
    ): Page<AuditLog>
}