package dev.ryuzu.astermanagement.modules.matter.domain

import dev.ryuzu.astermanagement.domain.user.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

/**
 * Repository interface for Matter entity operations
 * Provides standard CRUD operations and custom queries for case management
 */
@Repository
interface MatterRepository : JpaRepository<Matter, UUID> {

    /**
     * Find matter by case number
     */
    fun findByCaseNumber(caseNumber: String): Matter?

    /**
     * Find matters by status
     */
    fun findByStatus(status: MatterStatus): List<Matter>

    /**
     * Find matters by status with pagination
     */
    fun findByStatus(status: MatterStatus, pageable: Pageable): Page<Matter>
    
    /**
     * Find matters by status with fetch optimization
     */
    @Query("""
        SELECT DISTINCT m FROM Matter m
        LEFT JOIN FETCH m.assignedLawyer
        LEFT JOIN FETCH m.assignedClerk
        WHERE m.status = :status
    """)
    fun findByStatusWithDetails(@Param("status") status: MatterStatus, pageable: Pageable): Page<Matter>

    /**
     * Find matters by assigned lawyer
     */
    fun findByAssignedLawyer(lawyer: User): List<Matter>

    /**
     * Find matters by assigned lawyer with pagination
     */
    fun findByAssignedLawyer(lawyer: User, pageable: Pageable): Page<Matter>

    /**
     * Find matters by assigned clerk
     */
    fun findByAssignedClerk(clerk: User?): List<Matter>

    /**
     * Find matters by priority
     */
    fun findByPriority(priority: MatterPriority): List<Matter>

    /**
     * Find matters by client name (case-insensitive partial match)
     */
    @Query("""
        SELECT m FROM Matter m 
        WHERE LOWER(m.clientName) LIKE LOWER(CONCAT('%', :clientName, '%'))
        ORDER BY m.createdAt DESC
    """)
    fun findByClientNameContainingIgnoreCase(@Param("clientName") clientName: String): List<Matter>

    /**
     * Find active matters (not closed)
     */
    @Query("SELECT m FROM Matter m WHERE m.status != 'CLOSED' ORDER BY m.priority DESC, m.createdAt ASC")
    fun findActiveMatters(): List<Matter>
    
    /**
     * Find active matters with optimized fetching
     */
    @Query("""
        SELECT DISTINCT m FROM Matter m 
        LEFT JOIN FETCH m.assignedLawyer
        LEFT JOIN FETCH m.assignedClerk
        WHERE m.status != 'CLOSED' 
        ORDER BY m.priority DESC, m.createdAt ASC
    """)
    fun findActiveMattersWithDetails(pageable: Pageable): Page<Matter>

    /**
     * Find overdue matters
     */
    @Query("""
        SELECT m FROM Matter m 
        WHERE m.estimatedCompletionDate < :currentDate 
        AND m.actualCompletionDate IS NULL 
        AND m.status != 'CLOSED'
        ORDER BY m.estimatedCompletionDate ASC
    """)
    fun findOverdueMatters(@Param("currentDate") currentDate: LocalDate = LocalDate.now()): List<Matter>

    /**
     * Find matters assigned to a lawyer by status
     */
    @Query("""
        SELECT m FROM Matter m 
        WHERE m.assignedLawyer = :lawyer 
        AND m.status = :status
        ORDER BY m.priority DESC, m.createdAt ASC
    """)
    fun findByAssignedLawyerAndStatus(@Param("lawyer") lawyer: User, @Param("status") status: MatterStatus): List<Matter>

    /**
     * Search matters by multiple criteria
     */
    @Query("""
        SELECT m FROM Matter m 
        WHERE (:caseNumber IS NULL OR LOWER(m.caseNumber) LIKE LOWER(CONCAT('%', :caseNumber, '%')))
        AND (:clientName IS NULL OR LOWER(m.clientName) LIKE LOWER(CONCAT('%', :clientName, '%')))
        AND (:title IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%')))
        AND (:status IS NULL OR m.status = :status)
        AND (:priority IS NULL OR m.priority = :priority)
        AND (:assignedLawyer IS NULL OR m.assignedLawyer = :assignedLawyer)
        ORDER BY m.priority DESC, m.createdAt DESC
    """)
    fun searchMatters(
        @Param("caseNumber") caseNumber: String?,
        @Param("clientName") clientName: String?,
        @Param("title") title: String?,
        @Param("status") status: MatterStatus?,
        @Param("priority") priority: MatterPriority?,
        @Param("assignedLawyer") assignedLawyer: User?,
        pageable: Pageable
    ): Page<Matter>

    /**
     * Full-text search across matter content
     */
    @Query("""
        SELECT * FROM matters m 
        WHERE m.search_vector @@ plainto_tsquery('simple', :searchTerm)
        ORDER BY ts_rank(m.search_vector, plainto_tsquery('simple', :searchTerm)) DESC
    """, nativeQuery = true)
    fun fullTextSearch(@Param("searchTerm") searchTerm: String): List<Matter>

    /**
     * Check if a matter exists with the given ID and client ID
     * Used for client ownership verification
     */
    fun existsByIdAndClientId(matterId: UUID, clientId: UUID): Boolean

    /**
     * Find a matter by ID and client ID for ownership verification
     */
    fun findByIdAndClientId(matterId: UUID, clientId: UUID): Matter?

    /**
     * Get matters dashboard statistics
     */
    @Query("""
        SELECT 
            m.status,
            COUNT(m),
            AVG(CASE WHEN m.estimated_completion_date IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (m.estimated_completion_date - CURRENT_DATE))/86400 
                ELSE NULL END)
        FROM matters m 
        WHERE m.status != 'CLOSED'
        GROUP BY m.status
    """, nativeQuery = true)
    fun getDashboardStatistics(): List<Array<Any>>

    /**
     * Count matters by status
     */
    fun countByStatus(status: MatterStatus): Long

    /**
     * Count matters by priority
     */
    fun countByPriority(priority: MatterPriority): Long

    /**
     * Count matters assigned to a lawyer
     */
    fun countByAssignedLawyer(lawyer: User): Long

    /**
     * Find matters created within date range
     */
    @Query("""
        SELECT m FROM Matter m 
        WHERE m.createdAt >= :startDate 
        AND m.createdAt <= :endDate
        ORDER BY m.createdAt DESC
    """)
    fun findByCreatedAtBetween(
        @Param("startDate") startDate: java.time.LocalDateTime,
        @Param("endDate") endDate: java.time.LocalDateTime
    ): List<Matter>

    /**
     * Check if case number exists
     */
    fun existsByCaseNumber(caseNumber: String): Boolean

    /**
     * Find matters with specific tags
     */
    @Query("""
        SELECT * FROM matters m 
        WHERE :tag = ANY(m.tags)
        ORDER BY m.created_at DESC
    """, nativeQuery = true)
    fun findByTag(@Param("tag") tag: String): List<Matter>
}

/**
 * Interface for dashboard statistics projection
 */
interface MatterStatistics {
    val status: MatterStatus
    val count: Long
    val avgDaysToCompletion: Double?
}