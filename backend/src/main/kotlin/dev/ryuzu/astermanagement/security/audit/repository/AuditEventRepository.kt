package dev.ryuzu.astermanagement.security.audit.repository

import dev.ryuzu.astermanagement.security.audit.RiskLevel
import dev.ryuzu.astermanagement.security.audit.SecurityEventType
import dev.ryuzu.astermanagement.security.audit.entity.AuditEvent
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

/**
 * Repository for audit events with read-only operations
 * Deletes are not allowed for legal compliance
 */
@Repository
interface AuditEventRepository : JpaRepository<AuditEvent, UUID> {
    
    /**
     * Find events by user ID within time range
     */
    fun findByUserIdAndTimestampBetweenOrderByTimestampDesc(
        userId: String,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
    
    /**
     * Find events by IP address within time range
     */
    fun findByIpAddressAndTimestampBetweenOrderByTimestampDesc(
        ipAddress: String,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
    
    /**
     * Find events by event type
     */
    fun findByEventTypeAndTimestampBetweenOrderByTimestampDesc(
        eventType: SecurityEventType,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
    
    /**
     * Find high-risk events
     */
    fun findByRiskLevelInAndTimestampBetweenOrderByTimestampDesc(
        riskLevels: List<RiskLevel>,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
    
    /**
     * Count failed authentication attempts for a user within time window
     */
    @Query("""
        SELECT COUNT(e) FROM AuditEvent e 
        WHERE e.username = :username 
        AND e.eventType = 'AUTHENTICATION_FAILURE' 
        AND e.timestamp >= :since
    """)
    fun countFailedAuthenticationAttempts(
        @Param("username") username: String,
        @Param("since") since: Instant
    ): Long
    
    /**
     * Count failed authentication attempts from IP address within time window
     */
    @Query("""
        SELECT COUNT(e) FROM AuditEvent e 
        WHERE e.ipAddress = :ipAddress 
        AND e.eventType = 'AUTHENTICATION_FAILURE' 
        AND e.timestamp >= :since
    """)
    fun countFailedAuthenticationAttemptsFromIP(
        @Param("ipAddress") ipAddress: String,
        @Param("since") since: Instant
    ): Long
    
    /**
     * Find events by correlation ID for tracking related events
     */
    fun findByCorrelationIdOrderByTimestampAsc(correlationId: String): List<AuditEvent>
    
    /**
     * Find recent suspicious activity for a user
     */
    @Query("""
        SELECT e FROM AuditEvent e 
        WHERE e.userId = :userId 
        AND e.eventType = 'SUSPICIOUS_ACTIVITY' 
        AND e.timestamp >= :since
        ORDER BY e.timestamp DESC
    """)
    fun findRecentSuspiciousActivity(
        @Param("userId") userId: String,
        @Param("since") since: Instant
    ): List<AuditEvent>
    
    /**
     * Find events for security dashboard
     */
    @Query("""
        SELECT e FROM AuditEvent e 
        WHERE e.timestamp >= :since
        AND (e.riskLevel IN ('HIGH', 'CRITICAL') 
             OR e.eventType IN ('AUTHENTICATION_FAILURE', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKOUT'))
        ORDER BY e.timestamp DESC
    """)
    fun findSecurityDashboardEvents(
        @Param("since") since: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
    
    /**
     * Get audit statistics for reporting
     */
    @Query("""
        SELECT e.eventType as eventType, COUNT(e) as count 
        FROM AuditEvent e 
        WHERE e.timestamp >= :since 
        GROUP BY e.eventType
    """)
    fun getEventTypeStatistics(@Param("since") since: Instant): List<EventTypeStatistic>
    
    /**
     * Get risk level statistics
     */
    @Query("""
        SELECT e.riskLevel as riskLevel, COUNT(e) as count 
        FROM AuditEvent e 
        WHERE e.timestamp >= :since 
        GROUP BY e.riskLevel
    """)
    fun getRiskLevelStatistics(@Param("since") since: Instant): List<RiskLevelStatistic>
    
    /**
     * Find events ready for archival (past retention period)
     */
    @Query("""
        SELECT e FROM AuditEvent e 
        WHERE e.retentionUntil <= :currentTime
        ORDER BY e.timestamp ASC
    """)
    fun findEventsReadyForArchival(
        @Param("currentTime") currentTime: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
    
    /**
     * Search events by message content (for incident investigation)
     */
    @Query("""
        SELECT e FROM AuditEvent e 
        WHERE e.timestamp >= :since 
        AND (LOWER(e.message) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(e.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        ORDER BY e.timestamp DESC
    """)
    fun searchEvents(
        @Param("searchTerm") searchTerm: String,
        @Param("since") since: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
    
    /**
     * Find concurrent sessions for a user
     */
    @Query("""
        SELECT e FROM AuditEvent e 
        WHERE e.userId = :userId 
        AND e.eventType = 'SESSION_CREATED' 
        AND e.timestamp >= :since
        ORDER BY e.timestamp DESC
    """)
    fun findConcurrentSessions(
        @Param("userId") userId: String,
        @Param("since") since: Instant
    ): List<AuditEvent>
    
    /**
     * Get user activity timeline
     */
    @Query("""
        SELECT e FROM AuditEvent e 
        WHERE e.userId = :userId 
        AND e.timestamp BETWEEN :startTime AND :endTime
        ORDER BY e.timestamp DESC
    """)
    fun getUserActivityTimeline(
        @Param("userId") userId: String,
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant,
        pageable: Pageable
    ): Page<AuditEvent>
}

/**
 * Data class for event type statistics
 */
interface EventTypeStatistic {
    val eventType: SecurityEventType
    val count: Long
}

/**
 * Data class for risk level statistics
 */
interface RiskLevelStatistic {
    val riskLevel: RiskLevel
    val count: Long
}