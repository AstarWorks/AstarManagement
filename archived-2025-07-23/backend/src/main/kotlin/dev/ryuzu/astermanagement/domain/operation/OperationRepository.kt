package dev.ryuzu.astermanagement.domain.operation

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

/**
 * Repository interface for Operation entity with custom query methods
 */
@Repository
interface OperationRepository : JpaRepository<Operation, UUID> {

    /**
     * Find operations by status with pagination
     */
    fun findByStatusOrderByQueuedAtAsc(status: OperationStatus, pageable: Pageable): Page<Operation>

    /**
     * Find operations by user ID with pagination
     */
    fun findByUserIdOrderByQueuedAtDesc(userId: UUID, pageable: Pageable): Page<Operation>

    /**
     * Find operations by user ID and status
     */
    fun findByUserIdAndStatusOrderByQueuedAtDesc(
        userId: UUID,
        status: OperationStatus,
        pageable: Pageable
    ): Page<Operation>

    /**
     * Find operations by type and status
     */
    fun findByOperationTypeAndStatusOrderByPriorityDescQueuedAtAsc(
        operationType: OperationType,
        status: OperationStatus,
        pageable: Pageable
    ): Page<Operation>

    /**
     * Find queued operations ordered by priority and queue time
     */
    @Query("""
        SELECT o FROM Operation o 
        WHERE o.status = :status 
        ORDER BY 
            CASE o.priority 
                WHEN 'URGENT' THEN 4
                WHEN 'HIGH' THEN 3
                WHEN 'NORMAL' THEN 2
                WHEN 'LOW' THEN 1
            END DESC,
            o.queuedAt ASC
    """)
    fun findQueuedOperationsOrderedByPriority(
        @Param("status") status: OperationStatus,
        pageable: Pageable
    ): Page<Operation>

    /**
     * Find operations ready to run (no dependencies or all dependencies completed)
     */
    @Query("""
        SELECT o FROM Operation o 
        WHERE o.status = 'QUEUED'
        AND (
            array_length(o.dependencies, 1) IS NULL 
            OR NOT EXISTS (
                SELECT 1 FROM Operation dep 
                WHERE CAST(dep.id AS STRING) = ANY(o.dependencies)
                AND dep.status NOT IN ('COMPLETED', 'CANCELLED')
            )
        )
        ORDER BY 
            CASE o.priority 
                WHEN 'URGENT' THEN 4
                WHEN 'HIGH' THEN 3
                WHEN 'NORMAL' THEN 2
                WHEN 'LOW' THEN 1
            END DESC,
            o.queuedAt ASC
    """)
    fun findReadyToRunOperations(pageable: Pageable): Page<Operation>

    /**
     * Find running operations that might be stuck (running for too long)
     */
    @Query("""
        SELECT o FROM Operation o 
        WHERE o.status = 'RUNNING'
        AND o.startedAt < :threshold
    """)
    fun findStuckOperations(@Param("threshold") threshold: LocalDateTime): List<Operation>

    /**
     * Count operations by status
     */
    fun countByStatus(status: OperationStatus): Long

    /**
     * Count operations by user and status
     */
    fun countByUserIdAndStatus(userId: UUID, status: OperationStatus): Long

    /**
     * Count active operations for a user
     */
    @Query("""
        SELECT COUNT(o) FROM Operation o 
        WHERE o.user.id = :userId 
        AND o.status IN ('QUEUED', 'RUNNING', 'PAUSED')
    """)
    fun countActiveOperationsByUser(@Param("userId") userId: UUID): Long

    /**
     * Find operations that can be retried
     */
    @Query("""
        SELECT o FROM Operation o 
        WHERE o.status = 'FAILED'
        AND o.retryCount < o.maxRetries
        ORDER BY o.queuedAt ASC
    """)
    fun findRetryableOperations(pageable: Pageable): Page<Operation>

    /**
     * Find old completed operations for cleanup
     */
    @Query("""
        SELECT o FROM Operation o 
        WHERE o.status IN ('COMPLETED', 'FAILED', 'CANCELLED')
        AND o.completedAt < :threshold
        ORDER BY o.completedAt ASC
    """)
    fun findOldCompletedOperations(
        @Param("threshold") threshold: LocalDateTime,
        pageable: Pageable
    ): Page<Operation>

    /**
     * Bulk update operations status
     */
    @Modifying
    @Query("""
        UPDATE Operation o 
        SET o.status = :newStatus, o.updatedAt = CURRENT_TIMESTAMP
        WHERE o.id IN :operationIds
    """)
    fun bulkUpdateStatus(
        @Param("operationIds") operationIds: List<UUID>,
        @Param("newStatus") newStatus: OperationStatus
    ): Int

    /**
     * Find operations with specific transaction ID
     */
    fun findByTransactionIdOrderByQueuedAtAsc(transactionId: String): List<Operation>

    /**
     * Delete operations older than threshold
     */
    @Modifying
    @Query("""
        DELETE FROM Operation o 
        WHERE o.status IN ('COMPLETED', 'FAILED', 'CANCELLED')
        AND o.completedAt < :threshold
    """)
    fun deleteOldOperations(@Param("threshold") threshold: LocalDateTime): Int

    /**
     * Get operation statistics by time range
     */
    @Query("""
        SELECT new map(
            o.status as status,
            COUNT(o) as count,
            AVG(CASE 
                WHEN o.completedAt IS NOT NULL AND o.startedAt IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (o.completedAt - o.startedAt))
                ELSE NULL 
            END) as avgDurationSeconds
        )
        FROM Operation o 
        WHERE o.queuedAt BETWEEN :startDate AND :endDate
        GROUP BY o.status
    """)
    fun getOperationStatistics(
        @Param("startDate") startDate: LocalDateTime,
        @Param("endDate") endDate: LocalDateTime
    ): List<Map<String, Any>>
}