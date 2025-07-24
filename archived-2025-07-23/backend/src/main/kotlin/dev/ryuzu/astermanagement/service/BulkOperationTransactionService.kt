package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.operation.Operation
import dev.ryuzu.astermanagement.dto.operation.BulkUpdateMatterRequest
import dev.ryuzu.astermanagement.dto.operation.BulkDeleteMatterRequest
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import java.util.*

/**
 * Service for handling bulk operations with proper transaction management.
 * Ensures ACID properties for bulk operations and handles rollback scenarios.
 */
@Service
class BulkOperationTransactionService(
    private val matterService: MatterService,
    private val operationService: OperationService,
    private val transactionTemplate: TransactionTemplate
) {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Execute bulk update with transaction management
     */
    @Transactional(
        isolation = Isolation.READ_COMMITTED,
        propagation = Propagation.REQUIRES_NEW,
        rollbackFor = [Exception::class]
    )
    fun executeBulkUpdate(
        operationId: UUID,
        request: BulkUpdateMatterRequest
    ): BulkMatterOperationResult {
        logger.info("Starting transactional bulk update for operation $operationId")
        
        try {
            // Update progress
            operationService.updateProgress(operationId, 0, request.matterIds.size, "Starting transaction...")
            
            // Convert request to service parameters
            val updates = mutableMapOf<String, Any?>()
            request.status?.let { updates["status"] = it }
            request.priority?.let { updates["priority"] = it }
            request.assignedLawyerId?.let { updates["assignedLawyerId"] = it }
            request.assignedClerkId?.let { updates["assignedClerkId"] = it }
            request.notes?.let { updates["notes"] = it }
            if (request.addTags.isNotEmpty()) updates["addTags"] = request.addTags
            if (request.removeTags.isNotEmpty()) updates["removeTags"] = request.removeTags
            
            operationService.updateProgress(operationId, 1, request.matterIds.size, "Validating matters...")
            
            // Pre-validate all matters
            if (request.validateTransitions) {
                val validationErrors = matterService.validateBulkMatterUpdates(request.matterIds, updates)
                if (validationErrors.isNotEmpty()) {
                    val errorMessage = "Validation failed: ${validationErrors.size} errors found"
                    logger.warn("$errorMessage for operation $operationId")
                    
                    return BulkMatterOperationResult(
                        totalRequested = request.matterIds.size,
                        totalProcessed = 0,
                        totalSuccessful = 0,
                        totalFailed = validationErrors.size,
                        totalSkipped = request.matterIds.size - validationErrors.size,
                        errors = validationErrors.map { validationError ->
                            MatterOperationError(
                                matterId = validationError.matterId,
                                errorCode = "VALIDATION_ERROR",
                                errorMessage = validationError.errorMessage,
                                field = validationError.field,
                                currentValue = validationError.currentValue,
                                attemptedValue = validationError.attemptedValue
                            )
                        },
                        warnings = listOf(errorMessage)
                    )
                }
            }
            
            operationService.updateProgress(operationId, 2, request.matterIds.size, "Executing bulk update...")
            
            // Execute the bulk update in a transaction
            val result = if (request.stopOnFirstError) {
                executeBulkUpdateWithEarlyExit(operationId, request.matterIds, updates)
            } else {
                executeBulkUpdateContinueOnError(operationId, request.matterIds, updates)
            }
            
            operationService.updateProgress(
                operationId, 
                request.matterIds.size, 
                request.matterIds.size, 
                "Bulk update completed: ${result.totalSuccessful}/${result.totalRequested} successful"
            )
            
            logger.info("Completed bulk update for operation $operationId: ${result.totalSuccessful}/${result.totalRequested} successful")
            
            return result
            
        } catch (e: Exception) {
            logger.error("Transaction failed for bulk update operation $operationId", e)
            throw e
        }
    }
    
    /**
     * Execute bulk delete with transaction management
     */
    @Transactional(
        isolation = Isolation.READ_COMMITTED,
        propagation = Propagation.REQUIRES_NEW,
        rollbackFor = [Exception::class]
    )
    fun executeBulkDelete(
        operationId: UUID,
        request: BulkDeleteMatterRequest
    ): BulkMatterOperationResult {
        logger.info("Starting transactional bulk delete for operation $operationId")
        
        try {
            operationService.updateProgress(operationId, 0, request.matterIds.size, "Starting delete transaction...")
            
            // Execute bulk delete
            val result = matterService.bulkDeleteMatters(
                matterIds = request.matterIds,
                reason = request.reason,
                forceDelete = request.forceDelete
            )
            
            operationService.updateProgress(
                operationId,
                request.matterIds.size,
                request.matterIds.size,
                "Bulk delete completed: ${result.totalSuccessful}/${result.totalRequested} deleted"
            )
            
            logger.info("Completed bulk delete for operation $operationId: ${result.totalSuccessful}/${result.totalRequested} deleted")
            
            return result
            
        } catch (e: Exception) {
            logger.error("Transaction failed for bulk delete operation $operationId", e)
            throw e
        }
    }
    
    /**
     * Execute bulk update with early exit on first error
     */
    private fun executeBulkUpdateWithEarlyExit(
        operationId: UUID,
        matterIds: List<UUID>,
        updates: Map<String, Any?>
    ): BulkMatterOperationResult {
        return transactionTemplate.execute { _ ->
            try {
                matterService.bulkUpdateMatters(
                    matterIds = matterIds,
                    updates = updates,
                    validateTransitions = true,
                    stopOnFirstError = true
                )
            } catch (e: Exception) {
                logger.error("Bulk update failed with early exit for operation $operationId", e)
                throw e
            }
        } ?: throw IllegalStateException("Transaction returned null result")
    }
    
    /**
     * Execute bulk update continuing on errors
     */
    private fun executeBulkUpdateContinueOnError(
        operationId: UUID,
        matterIds: List<UUID>,
        updates: Map<String, Any?>
    ): BulkMatterOperationResult {
        return transactionTemplate.execute { _ ->
            try {
                matterService.bulkUpdateMatters(
                    matterIds = matterIds,
                    updates = updates,
                    validateTransitions = true,
                    stopOnFirstError = false
                )
            } catch (e: Exception) {
                logger.error("Bulk update failed for operation $operationId", e)
                throw e
            }
        } ?: throw IllegalStateException("Transaction returned null result")
    }
    
    /**
     * Execute operation with progress tracking and error recovery
     */
    fun executeOperationWithRecovery(
        operationId: UUID,
        operation: () -> Unit
    ) {
        try {
            operation()
        } catch (e: Exception) {
            logger.error("Operation $operationId failed, attempting recovery", e)
            
            // Attempt to recover or provide meaningful error
            val recoveryMessage = when (e) {
                is org.springframework.dao.DataIntegrityViolationException -> {
                    "Data integrity violation - some matters may have concurrent modifications"
                }
                is org.springframework.transaction.TransactionSystemException -> {
                    "Transaction system error - operation was rolled back"
                }
                is jakarta.persistence.OptimisticLockException -> {
                    "Optimistic lock exception - matters were modified by another user"
                }
                else -> {
                    "Unexpected error: ${e.message}"
                }
            }
            
            operationService.failOperation(operationId, recoveryMessage)
        }
    }
    
    /**
     * Validate transaction state before bulk operations
     */
    fun validateTransactionState(): Boolean {
        return try {
            transactionTemplate.execute { status ->
                // Check if transaction is active and not marked for rollback
                !status.isRollbackOnly
            } ?: false
        } catch (e: Exception) {
            logger.warn("Failed to validate transaction state", e)
            false
        }
    }
}