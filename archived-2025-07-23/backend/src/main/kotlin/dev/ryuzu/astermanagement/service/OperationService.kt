package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.operation.Operation
import dev.ryuzu.astermanagement.domain.operation.OperationType
import dev.ryuzu.astermanagement.domain.operation.OperationStatus
import dev.ryuzu.astermanagement.domain.operation.OperationPriority
import dev.ryuzu.astermanagement.dto.operation.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDateTime
import java.util.*

/**
 * Service interface for managing bulk operations and background tasks.
 * Provides operation queuing, progress tracking, and lifecycle management.
 */
interface OperationService {
    
    /**
     * Create a new operation
     */
    fun createOperation(request: CreateOperationRequest, userId: UUID): Operation
    
    /**
     * Get operation by ID
     */
    fun getOperationById(operationId: UUID): Operation?
    
    /**
     * Get operations for a user with pagination
     */
    fun getOperationsByUser(
        userId: UUID,
        pageable: Pageable,
        status: OperationStatus? = null
    ): Page<Operation>
    
    /**
     * Get all operations with pagination (admin only)
     */
    fun getAllOperations(
        pageable: Pageable,
        status: OperationStatus? = null,
        type: OperationType? = null
    ): Page<Operation>
    
    /**
     * Start processing the next queued operation
     */
    fun processNextOperation(): Operation?
    
    /**
     * Cancel an operation
     */
    fun cancelOperation(operationId: UUID, reason: String? = null): Boolean
    
    /**
     * Pause an operation
     */
    fun pauseOperation(operationId: UUID, reason: String? = null): Boolean
    
    /**
     * Resume a paused operation
     */
    fun resumeOperation(operationId: UUID, reason: String? = null): Boolean
    
    /**
     * Retry a failed operation
     */
    fun retryOperation(operationId: UUID, resetRetryCount: Boolean = false): Boolean
    
    /**
     * Update operation progress
     */
    fun updateProgress(
        operationId: UUID,
        current: Int,
        total: Int = -1,
        message: String? = null
    ): Boolean
    
    /**
     * Complete an operation successfully
     */
    fun completeOperation(operationId: UUID, result: String? = null): Boolean
    
    /**
     * Fail an operation with error message
     */
    fun failOperation(operationId: UUID, errorMessage: String): Boolean
    
    /**
     * Get operation queue status
     */
    fun getQueueStatus(): OperationQueueStatus
    
    /**
     * Get operation statistics
     */
    fun getOperationStatistics(
        startDate: LocalDateTime,
        endDate: LocalDateTime
    ): OperationStatistics
    
    /**
     * Clean up old completed operations
     */
    fun cleanupOldOperations(olderThan: LocalDateTime): Int
    
    /**
     * Find and handle stuck operations
     */
    fun handleStuckOperations(stuckThreshold: LocalDateTime): List<Operation>
    
    /**
     * Bulk update matters
     */
    fun bulkUpdateMatters(request: BulkUpdateMatterRequest, userId: UUID): Operation
    
    /**
     * Bulk delete matters
     */
    fun bulkDeleteMatters(request: BulkDeleteMatterRequest, userId: UUID): Operation
    
    /**
     * Export matters
     */
    fun exportMatters(request: ExportMatterRequest, userId: UUID): Operation
    
    /**
     * Validate bulk update request
     */
    fun validateBulkUpdate(request: BulkUpdateMatterRequest): BatchValidationResult
    
    /**
     * Validate bulk delete request
     */
    fun validateBulkDelete(request: BulkDeleteMatterRequest): BatchValidationResult
    
    /**
     * Check if user can perform operation
     */
    fun canUserPerformOperation(userId: UUID, operationType: OperationType): Boolean
    
    /**
     * Get user's operation limits
     */
    fun getUserOperationLimits(userId: UUID): UserOperationLimits
}

/**
 * User operation limits
 */
data class UserOperationLimits(
    val maxConcurrentOperations: Int,
    val maxDailyOperations: Int,
    val maxBulkUpdateSize: Int,
    val maxBulkDeleteSize: Int,
    val currentActiveOperations: Long,
    val todayOperationsCount: Long,
    val canCreateNewOperation: Boolean
)