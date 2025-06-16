package dev.ryuzu.astermanagement.domain.audit

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

/**
 * Repository for matter-specific audit log operations
 * Provides detailed field-level change tracking for legal compliance
 */
@Repository
interface MatterAuditLogRepository : JpaRepository<MatterAuditLog, UUID> {
    
    /**
     * Find all audit logs for a specific matter, ordered by performed time
     */
    fun findByMatterIdOrderByPerformedAtDesc(matterId: UUID, pageable: Pageable): Page<MatterAuditLog>
    
    /**
     * Find audit logs for a specific matter and action type
     */
    fun findByMatterIdAndActionOrderByPerformedAtDesc(
        matterId: UUID, 
        action: AuditAction,
        pageable: Pageable
    ): Page<MatterAuditLog>
    
    /**
     * Find audit logs for a specific field on a matter
     */
    fun findByMatterIdAndFieldNameOrderByPerformedAtDesc(
        matterId: UUID,
        fieldName: String,
        pageable: Pageable
    ): Page<MatterAuditLog>
    
    /**
     * Find audit logs by user within a time range
     */
    fun findByPerformedByAndPerformedAtBetween(
        performedBy: UUID,
        startTime: java.time.Instant,
        endTime: java.time.Instant,
        pageable: Pageable
    ): Page<MatterAuditLog>
    
    /**
     * Find all changes made by a specific user to a matter
     */
    fun findByMatterIdAndPerformedByOrderByPerformedAtDesc(
        matterId: UUID,
        performedBy: UUID,
        pageable: Pageable
    ): Page<MatterAuditLog>
    
    /**
     * Get complete field history for a specific matter field
     */
    @Query("""
        SELECT mal FROM MatterAuditLog mal 
        WHERE mal.matterId = :matterId 
        AND mal.fieldName = :fieldName
        AND mal.action IN ('CREATE', 'UPDATE')
        ORDER BY mal.performedAt ASC
    """)
    fun getFieldHistory(
        @Param("matterId") matterId: UUID,
        @Param("fieldName") fieldName: String
    ): List<MatterAuditLog>
    
    /**
     * Find status change history for a matter
     */
    @Query("""
        SELECT mal FROM MatterAuditLog mal 
        WHERE mal.matterId = :matterId 
        AND mal.fieldName = 'status'
        ORDER BY mal.performedAt ASC
    """)
    fun getStatusHistory(@Param("matterId") matterId: UUID): List<MatterAuditLog>
    
    /**
     * Find recent changes to a matter (within last N days)
     */
    @Query("""
        SELECT mal FROM MatterAuditLog mal 
        WHERE mal.matterId = :matterId 
        AND mal.performedAt >= :since
        ORDER BY mal.performedAt DESC
    """)
    fun getRecentChanges(
        @Param("matterId") matterId: UUID,
        @Param("since") since: java.time.Instant
    ): List<MatterAuditLog>
    
    /**
     * Count changes by field for a matter
     */
    @Query("""
        SELECT mal.fieldName, COUNT(mal) FROM MatterAuditLog mal 
        WHERE mal.matterId = :matterId 
        GROUP BY mal.fieldName
        ORDER BY COUNT(mal) DESC
    """)
    fun countChangesByField(@Param("matterId") matterId: UUID): List<Array<Any>>
    
    /**
     * Find matters modified by a user within a time period
     */
    @Query("""
        SELECT DISTINCT mal.matterId FROM MatterAuditLog mal 
        WHERE mal.performedBy = :userId 
        AND mal.performedAt BETWEEN :startTime AND :endTime
    """)
    fun findMattersModifiedByUser(
        @Param("userId") userId: UUID,
        @Param("startTime") startTime: java.time.Instant,
        @Param("endTime") endTime: java.time.Instant
    ): List<UUID>
    
    /**
     * Get user activity summary for matters
     */
    @Query("""
        SELECT mal.performedBy, COUNT(DISTINCT mal.matterId) as matterCount, 
               COUNT(mal) as changeCount, MAX(mal.performedAt) as lastActivity
        FROM MatterAuditLog mal 
        WHERE mal.performedAt >= :since
        GROUP BY mal.performedBy
        ORDER BY changeCount DESC
    """)
    fun getUserActivitySummary(@Param("since") since: java.time.Instant): List<Array<Any>>
    
    /**
     * Find changes with specific reasons (for compliance reporting)
     */
    fun findByChangeReasonContainingIgnoreCaseOrderByPerformedAtDesc(
        reason: String,
        pageable: Pageable
    ): Page<MatterAuditLog>
    
    /**
     * Find audit logs by IP address for security analysis
     */
    @Query("""
        SELECT mal FROM MatterAuditLog mal 
        WHERE mal.ipAddress = :ipAddress
        AND mal.performedAt >= :since
        ORDER BY mal.performedAt DESC
    """)
    fun findByIpAddressAndPerformedAtAfter(
        @Param("ipAddress") ipAddress: String,
        @Param("since") since: java.time.Instant
    ): List<MatterAuditLog>
    
    /**
     * Get audit trail for compliance export (all changes for a matter)
     */
    @Query("""
        SELECT mal FROM MatterAuditLog mal 
        WHERE mal.matterId = :matterId 
        ORDER BY mal.performedAt ASC, mal.fieldName ASC
    """)
    fun getComplianceTrail(@Param("matterId") matterId: UUID): List<MatterAuditLog>
    
    /**
     * Find bulk operations (multiple changes in short time by same user)
     */
    @Query(value = """
        SELECT mal.* FROM matter_audit_log mal
        WHERE mal.performed_by = :userId
        AND mal.performed_at BETWEEN :startTime AND :endTime
        AND mal.matter_id IN (
            SELECT sub.matter_id 
            FROM matter_audit_log sub 
            WHERE sub.performed_by = :userId
            AND sub.performed_at BETWEEN :startTime AND :endTime
            GROUP BY sub.matter_id 
            HAVING COUNT(*) > :threshold
        )
        ORDER BY mal.performed_at DESC
    """, nativeQuery = true)
    fun findBulkOperations(
        @Param("userId") userId: UUID,
        @Param("startTime") startTime: java.time.Instant,
        @Param("endTime") endTime: java.time.Instant,
        @Param("threshold") threshold: Int
    ): List<MatterAuditLog>
    
    /**
     * Find suspicious patterns (e.g., multiple rapid changes from different IPs)
     */
    @Query(value = """
        SELECT DISTINCT m1.* FROM matter_audit_log m1
        INNER JOIN matter_audit_log m2 ON m1.matter_id = m2.matter_id
        WHERE m1.performed_at BETWEEN :startTime AND :endTime
        AND m2.performed_at BETWEEN :startTime AND :endTime
        AND m1.id != m2.id
        AND m1.ip_address != m2.ip_address
        AND ABS(EXTRACT(EPOCH FROM (m1.performed_at - m2.performed_at))) < :timeWindowSeconds
        ORDER BY m1.performed_at DESC
    """, nativeQuery = true)
    fun findSuspiciousActivity(
        @Param("startTime") startTime: java.time.Instant,
        @Param("endTime") endTime: java.time.Instant,
        @Param("timeWindowSeconds") timeWindowSeconds: Int
    ): List<MatterAuditLog>
}