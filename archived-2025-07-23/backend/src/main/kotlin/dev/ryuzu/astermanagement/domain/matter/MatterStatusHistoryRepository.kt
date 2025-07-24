package dev.ryuzu.astermanagement.domain.matter

import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

/**
 * Repository interface for MatterStatusHistory entity operations
 * Provides audit trail queries and reporting capabilities
 */
@Repository
interface MatterStatusHistoryRepository : JpaRepository<MatterStatusHistory, UUID> {

    /**
     * Find all status history for a specific matter
     */
    fun findByMatter(matter: Matter): List<MatterStatusHistory>

    /**
     * Find status history for a matter with pagination
     */
    fun findByMatterOrderByChangedAtDesc(matter: Matter, pageable: Pageable): Page<MatterStatusHistory>

    /**
     * Find status history by changed user
     */
    fun findByChangedBy(user: User): List<MatterStatusHistory>

    /**
     * Find status history by status
     */
    fun findByNewStatus(status: MatterStatus): List<MatterStatusHistory>

    /**
     * Find status changes within date range
     */
    @Query("""
        SELECT h FROM MatterStatusHistory h 
        WHERE h.changedAt >= :startDate 
        AND h.changedAt <= :endDate
        ORDER BY h.changedAt DESC
    """)
    fun findByChangedAtBetween(
        @Param("startDate") startDate: LocalDateTime,
        @Param("endDate") endDate: LocalDateTime
    ): List<MatterStatusHistory>

    /**
     * Find latest status change for each matter
     */
    @Query("""
        SELECT h FROM MatterStatusHistory h
        WHERE h.changedAt = (
            SELECT MAX(h2.changedAt) 
            FROM MatterStatusHistory h2 
            WHERE h2.matter = h.matter
        )
        ORDER BY h.changedAt DESC
    """)
    fun findLatestStatusChangePerMatter(): List<MatterStatusHistory>

    /**
     * Get status transition statistics
     */
    @Query("""
        SELECT 
            h.oldStatus as fromStatus,
            h.newStatus as toStatus,
            COUNT(h) as transitionCount
        FROM MatterStatusHistory h 
        WHERE h.oldStatus IS NOT NULL
        GROUP BY h.oldStatus, h.newStatus
        ORDER BY transitionCount DESC
    """)
    fun getStatusTransitionStatistics(): List<StatusTransitionStatistic>

    /**
     * Find matters that have been in a specific status for longer than specified days
     */
    @Query("""
        SELECT h FROM MatterStatusHistory h
        WHERE h.newStatus = :status
        AND h.changedAt < :beforeDate
        AND h.matter.id NOT IN (
            SELECT h2.matter.id 
            FROM MatterStatusHistory h2 
            WHERE h2.changedAt > h.changedAt 
            AND h2.matter = h.matter
        )
        ORDER BY h.changedAt ASC
    """)
    fun findMattersStuckInStatus(
        @Param("status") status: MatterStatus,
        @Param("beforeDate") beforeDate: LocalDateTime
    ): List<MatterStatusHistory>

    /**
     * Get audit trail for a specific matter
     */
    @Query("""
        SELECT h FROM MatterStatusHistory h 
        WHERE h.matter = :matter
        ORDER BY h.changedAt ASC
    """)
    fun getAuditTrail(@Param("matter") matter: Matter): List<MatterStatusHistory>

    /**
     * Find status changes by a specific user within date range
     */
    @Query("""
        SELECT h FROM MatterStatusHistory h 
        WHERE h.changedBy = :user
        AND h.changedAt >= :startDate 
        AND h.changedAt <= :endDate
        ORDER BY h.changedAt DESC
    """)
    fun findByUserAndDateRange(
        @Param("user") user: User,
        @Param("startDate") startDate: LocalDateTime,
        @Param("endDate") endDate: LocalDateTime
    ): List<MatterStatusHistory>

    /**
     * Count status changes for a matter
     */
    fun countByMatter(matter: Matter): Long

    /**
     * Count status changes by user
     */
    fun countByChangedBy(user: User): Long

    /**
     * Find recent status changes (last N days)
     */
    @Query("""
        SELECT h FROM MatterStatusHistory h 
        WHERE h.changedAt >= :sinceDate
        ORDER BY h.changedAt DESC
    """)
    fun findRecentStatusChanges(@Param("sinceDate") sinceDate: LocalDateTime): List<MatterStatusHistory>

    /**
     * Get average time spent in each status
     */
    @Query("""
        SELECT 
            h1.new_status as status,
            AVG(EXTRACT(EPOCH FROM (h2.changed_at - h1.changed_at))/86400) as avgDaysInStatus
        FROM matter_status_history h1
        LEFT JOIN matter_status_history h2 ON h1.matter_id = h2.matter_id 
            AND h2.changed_at = (
                SELECT MIN(h3.changed_at) 
                FROM matter_status_history h3 
                WHERE h3.matter_id = h1.matter_id 
                AND h3.changed_at > h1.changed_at
            )
        WHERE h1.new_status != 'CLOSED'
        GROUP BY h1.new_status
    """, nativeQuery = true)
    fun getAverageTimeInStatus(): List<Array<Any>>
}

/**
 * Interface for status transition statistics projection
 */
interface StatusTransitionStatistic {
    val fromStatus: MatterStatus?
    val toStatus: MatterStatus
    val transitionCount: Long
}

/**
 * Interface for status time statistics projection
 */
interface StatusTimeStatistic {
    val status: MatterStatus
    val avgDaysInStatus: Double?
}