package dev.ryuzu.astermanagement.service.impl

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.config.AuditLog
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventType
import dev.ryuzu.astermanagement.domain.operation.*
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.dto.operation.*
import dev.ryuzu.astermanagement.service.*
import dev.ryuzu.astermanagement.service.base.BaseService
import dev.ryuzu.astermanagement.service.exception.*
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Implementation of OperationService with comprehensive operation management.
 * Handles operation queuing, processing, progress tracking, and lifecycle management.
 */
@Service
@Transactional(readOnly = true)
class OperationServiceImpl(
    private val operationRepository: OperationRepository,
    private val userRepository: UserRepository,
    private val matterService: MatterService,
    private val auditEventPublisher: AuditEventPublisher,
    private val simpMessagingTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper,
    private val bulkOperationTransactionService: BulkOperationTransactionService
) : BaseService(), OperationService {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    // Configuration
    private val maxConcurrentOperations = 5
    private val defaultUserOperationLimit = 10
    private val defaultBulkUpdateLimit = 1000
    private val defaultBulkDeleteLimit = 500
    
    // Runtime state
    private val runningOperations = ConcurrentHashMap<UUID, Boolean>()
    private val operationProcessors = ConcurrentHashMap<OperationType, OperationProcessor>()
    
    companion object {
        private val globalOperationCounter = AtomicInteger(0)
    }
    
    init {
        // Register operation processors with dependencies
        operationProcessors[OperationType.BULK_UPDATE] = BulkUpdateProcessor(bulkOperationTransactionService, objectMapper)
        operationProcessors[OperationType.BULK_DELETE] = BulkDeleteProcessor(bulkOperationTransactionService, objectMapper)
        operationProcessors[OperationType.EXPORT] = ExportProcessor(objectMapper)
    }
    
    @Transactional
    @AuditLog(eventType = AuditEventType.OPERATION_CREATED, entityType = "Operation", operation = "create")
    override fun createOperation(request: CreateOperationRequest, userId: UUID): Operation {
        val user = userRepository.findById(userId).orElseThrow {
            ValidationException("userId", "User not found: $userId")
        }
        
        // Check user operation limits
        val limits = getUserOperationLimits(userId)
        if (!limits.canCreateNewOperation) {
            throw BusinessRuleViolationException("User has exceeded operation limits")
        }
        
        // Validate operation type permissions
        if (!canUserPerformOperation(userId, request.type)) {
            throw InsufficientPermissionException("User cannot perform ${request.type} operations")
        }
        
        // Create operation entity
        val operation = Operation().apply {
            operationType = request.type
            title = request.title
            description = request.description
            priority = request.priority
            this.user = user
            payload = objectMapper.writeValueAsString(request.payload)
            maxRetries = request.maxRetries
            estimatedDurationSeconds = request.estimatedDurationSeconds
            dependencies = request.dependencies.toTypedArray()
            transactionId = request.transactionId ?: UUID.randomUUID().toString()
            queuedAt = LocalDateTime.now()
        }
        
        val savedOperation = operationRepository.save(operation)
        
        // Publish audit event
        auditEventPublisher.publishCustomEvent(
            eventType = AuditEventType.OPERATION_CREATED,
            entityId = savedOperation.id.toString(),
            entityType = "Operation",
            details = mapOf(
                "operationType" to request.type.name,
                "title" to request.title,
                "priority" to request.priority.name
            )
        )
        
        logger.info("Created operation ${savedOperation.id} of type ${request.type} for user $userId")
        
        // Send WebSocket notification
        sendProgressUpdate(savedOperation.id!!, 0, 100, "Operation queued")
        
        return savedOperation
    }
    
    override fun getOperationById(operationId: UUID): Operation? {
        return operationRepository.findById(operationId).orElse(null)
    }
    
    override fun getOperationsByUser(
        userId: UUID,
        pageable: Pageable,
        status: OperationStatus?
    ): Page<Operation> {
        return if (status != null) {
            operationRepository.findByUserIdAndStatusOrderByQueuedAtDesc(userId, status, pageable)
        } else {
            operationRepository.findByUserIdOrderByQueuedAtDesc(userId, pageable)
        }
    }
    
    override fun getAllOperations(
        pageable: Pageable,
        status: OperationStatus?,
        type: OperationType?
    ): Page<Operation> {
        return when {
            status != null && type != null -> {
                operationRepository.findByOperationTypeAndStatusOrderByPriorityDescQueuedAtAsc(
                    type, status, pageable
                )
            }
            status != null -> {
                operationRepository.findByStatusOrderByQueuedAtAsc(status, pageable)
            }
            else -> operationRepository.findAll(pageable)
        }
    }
    
    @Transactional
    @Async
    override fun processNextOperation(): Operation? {
        if (runningOperations.size >= maxConcurrentOperations) {
            logger.debug("Maximum concurrent operations (${maxConcurrentOperations}) reached")
            return null
        }
        
        val nextOperation = operationRepository.findReadyToRunOperations(
            PageRequest.of(0, 1)
        ).content.firstOrNull()
        
        if (nextOperation == null) {
            logger.debug("No operations ready to run")
            return null
        }
        
        return processOperation(nextOperation)
    }
    
    @Transactional
    @AuditLog(eventType = AuditEventType.OPERATION_CANCELLED, entityType = "Operation", operation = "cancel")
    override fun cancelOperation(operationId: UUID, reason: String?): Boolean {
        val operation = operationRepository.findById(operationId).orElse(null) ?: return false
        
        if (!operation.canCancel) {
            logger.warn("Operation $operationId cannot be cancelled (status: ${operation.status})")
            return false
        }
        
        operation.cancel()
        operationRepository.save(operation)
        
        // Remove from running operations if it was running
        runningOperations.remove(operationId)
        
        // Send WebSocket notification
        sendProgressUpdate(operationId, operation.progressCurrent, operation.progressTotal, 
            "Operation cancelled${reason?.let { ": $it" } ?: ""}")
        
        logger.info("Operation $operationId cancelled${reason?.let { " - reason: $it" } ?: ""}")
        return true
    }
    
    @Transactional
    override fun pauseOperation(operationId: UUID, reason: String?): Boolean {
        val operation = operationRepository.findById(operationId).orElse(null) ?: return false
        
        if (operation.status != OperationStatus.RUNNING) {
            return false
        }
        
        operation.pause()
        operationRepository.save(operation)
        
        sendProgressUpdate(operationId, operation.progressCurrent, operation.progressTotal,
            "Operation paused${reason?.let { ": $it" } ?: ""}")
        
        logger.info("Operation $operationId paused${reason?.let { " - reason: $it" } ?: ""}")
        return true
    }
    
    @Transactional
    override fun resumeOperation(operationId: UUID, reason: String?): Boolean {
        val operation = operationRepository.findById(operationId).orElse(null) ?: return false
        
        if (operation.status != OperationStatus.PAUSED) {
            return false
        }
        
        operation.resume()
        operationRepository.save(operation)
        
        sendProgressUpdate(operationId, operation.progressCurrent, operation.progressTotal,
            "Operation resumed${reason?.let { ": $it" } ?: ""}")
        
        logger.info("Operation $operationId resumed${reason?.let { " - reason: $it" } ?: ""}")
        
        // Try to process the operation
        processOperation(operation)
        
        return true
    }
    
    @Transactional
    override fun retryOperation(operationId: UUID, resetRetryCount: Boolean): Boolean {
        val operation = operationRepository.findById(operationId).orElse(null) ?: return false
        
        if (!operation.canRetry && !resetRetryCount) {
            logger.warn("Operation $operationId cannot be retried (retry count: ${operation.retryCount}/${operation.maxRetries})")
            return false
        }
        
        if (resetRetryCount) {
            operation.retryCount = 0
        }
        
        operation.prepareForRetry()
        operationRepository.save(operation)
        
        sendProgressUpdate(operationId, 0, operation.progressTotal, "Operation retry queued")
        
        logger.info("Operation $operationId queued for retry (attempt ${operation.retryCount + 1}/${operation.maxRetries + 1})")
        return true
    }
    
    @Transactional
    override fun updateProgress(
        operationId: UUID,
        current: Int,
        total: Int,
        message: String?
    ): Boolean {
        val operation = operationRepository.findById(operationId).orElse(null) ?: return false
        
        val actualTotal = if (total == -1) operation.progressTotal else total
        operation.updateProgress(current, actualTotal, message)
        operationRepository.save(operation)
        
        // Send WebSocket notification
        sendProgressUpdate(operationId, current, actualTotal, message)
        
        return true
    }
    
    @Transactional
    override fun completeOperation(operationId: UUID, result: String?): Boolean {
        val operation = operationRepository.findById(operationId).orElse(null) ?: return false
        
        operation.complete(result)
        operationRepository.save(operation)
        
        // Remove from running operations
        runningOperations.remove(operationId)
        
        sendProgressUpdate(operationId, operation.progressTotal, operation.progressTotal, "Operation completed")
        
        logger.info("Operation $operationId completed successfully")
        
        // Publish audit event
        auditEventPublisher.publishCustomEvent(
            eventType = AuditEventType.OPERATION_COMPLETED,
            entityId = operationId.toString(),
            entityType = "Operation",
            details = mapOf(
                "operationType" to operation.operationType.name,
                "durationSeconds" to (operation.durationSeconds ?: 0)
            )
        )
        
        return true
    }
    
    @Transactional
    override fun failOperation(operationId: UUID, errorMessage: String): Boolean {
        val operation = operationRepository.findById(operationId).orElse(null) ?: return false
        
        operation.fail(errorMessage)
        operationRepository.save(operation)
        
        // Remove from running operations
        runningOperations.remove(operationId)
        
        sendProgressUpdate(operationId, operation.progressCurrent, operation.progressTotal, 
            "Operation failed: $errorMessage")
        
        logger.error("Operation $operationId failed: $errorMessage")
        
        return true
    }
    
    override fun getQueueStatus(): OperationQueueStatus {
        val queueSize = operationRepository.countByStatus(OperationStatus.QUEUED)
        val runningCount = operationRepository.countByStatus(OperationStatus.RUNNING)
        
        val nextOperations = operationRepository.findQueuedOperationsOrderedByPriority(
            OperationStatus.QUEUED,
            PageRequest.of(0, 5)
        ).content
        
        val avgWaitTime = calculateAverageWaitTime()
        
        return OperationQueueStatus(
            queueSize = queueSize,
            runningCount = runningCount,
            maxConcurrentOperations = maxConcurrentOperations,
            isProcessing = runningCount > 0,
            nextOperations = nextOperations.map { it.toDto() },
            averageWaitTimeMinutes = avgWaitTime,
            estimatedWaitTimeMinutes = if (queueSize > 0) avgWaitTime * queueSize else null
        )
    }
    
    override fun getOperationStatistics(
        startDate: LocalDateTime,
        endDate: LocalDateTime
    ): OperationStatistics {
        val stats = operationRepository.getOperationStatistics(startDate, endDate)
        
        val statusCounts = mutableMapOf<OperationStatus, Long>()
        var totalAvgDuration = 0.0
        var totalOps = 0L
        
        stats.forEach { stat ->
            val status = stat["status"] as OperationStatus
            val count = stat["count"] as Long
            val avgDuration = stat["avgDurationSeconds"] as? Double ?: 0.0
            
            statusCounts[status] = count
            totalOps += count
            if (avgDuration > 0) {
                totalAvgDuration += avgDuration
            }
        }
        
        val completed = statusCounts[OperationStatus.COMPLETED] ?: 0
        val failed = statusCounts[OperationStatus.FAILED] ?: 0
        val total = completed + failed
        
        return OperationStatistics(
            totalOperations = totalOps,
            operationsByStatus = statusCounts,
            operationsByType = mapOf(), // TODO: Implement type breakdown
            averageWaitTimeSeconds = calculateAverageWaitTime() * 60,
            averageProcessingTimeSeconds = totalAvgDuration,
            successRate = if (total > 0) completed.toDouble() / total else 0.0,
            retryRate = 0.0, // TODO: Calculate retry rate
            currentQueueSize = operationRepository.countByStatus(OperationStatus.QUEUED),
            currentRunningCount = operationRepository.countByStatus(OperationStatus.RUNNING),
            peakQueueSize = 0, // TODO: Track peak queue size
            lastUpdated = LocalDateTime.now()
        )
    }
    
    @Transactional
    override fun cleanupOldOperations(olderThan: LocalDateTime): Int {
        return operationRepository.deleteOldOperations(olderThan)
    }
    
    @Transactional
    override fun handleStuckOperations(stuckThreshold: LocalDateTime): List<Operation> {
        val stuckOperations = operationRepository.findStuckOperations(stuckThreshold)
        
        stuckOperations.forEach { operation ->
            logger.warn("Found stuck operation: ${operation.id} (running since ${operation.startedAt})")
            operation.fail("Operation timed out - stuck for too long")
            runningOperations.remove(operation.id)
        }
        
        if (stuckOperations.isNotEmpty()) {
            operationRepository.saveAll(stuckOperations)
        }
        
        return stuckOperations
    }
    
    @Transactional
    override fun bulkUpdateMatters(request: BulkUpdateMatterRequest, userId: UUID): Operation {
        // Validate request
        val validation = validateBulkUpdate(request)
        if (!validation.isValid) {
            throw ValidationException("bulkUpdate", "Validation failed: ${validation.errors.size} errors")
        }
        
        // Create operation
        val createRequest = CreateOperationRequest(
            type = OperationType.BULK_UPDATE,
            title = "Bulk Update ${request.matterIds.size} Matters",
            description = "Bulk update operation for ${request.matterIds.size} matters",
            payload = request,
            priority = if (request.matterIds.size > 100) OperationPriority.LOW else OperationPriority.NORMAL,
            estimatedDurationSeconds = estimateBulkUpdateDuration(request.matterIds.size)
        )
        
        return createOperation(createRequest, userId)
    }
    
    @Transactional
    override fun bulkDeleteMatters(request: BulkDeleteMatterRequest, userId: UUID): Operation {
        // Validate request
        val validation = validateBulkDelete(request)
        if (!validation.isValid) {
            throw ValidationException("bulkDelete", "Validation failed: ${validation.errors.size} errors")
        }
        
        // Create operation
        val createRequest = CreateOperationRequest(
            type = OperationType.BULK_DELETE,
            title = "Bulk Delete ${request.matterIds.size} Matters",
            description = "Bulk delete operation for ${request.matterIds.size} matters - Reason: ${request.reason}",
            payload = request,
            priority = OperationPriority.HIGH, // Deletion is high priority
            estimatedDurationSeconds = estimateBulkDeleteDuration(request.matterIds.size)
        )
        
        return createOperation(createRequest, userId)
    }
    
    @Transactional
    override fun exportMatters(request: ExportMatterRequest, userId: UUID): Operation {
        val matterCount = request.matterIds?.size ?: 0 // TODO: Count all matters if null
        
        val createRequest = CreateOperationRequest(
            type = OperationType.EXPORT,
            title = "Export ${if (matterCount > 0) "$matterCount" else "All"} Matters (${request.format})",
            description = "Export matters to ${request.format} format",
            payload = request,
            priority = OperationPriority.NORMAL,
            estimatedDurationSeconds = estimateExportDuration(matterCount, request.format)
        )
        
        return createOperation(createRequest, userId)
    }
    
    override fun validateBulkUpdate(request: BulkUpdateMatterRequest): BatchValidationResult {
        val errors = mutableListOf<ValidationError>()
        
        // Check matter IDs exist and user has access
        request.matterIds.forEach { matterId ->
            val matter = matterService.getMatterById(matterId)
            if (matter == null) {
                errors.add(ValidationError(
                    itemId = matterId,
                    field = "matterId",
                    message = "Matter not found or access denied"
                ))
            }
        }
        
        // Validate status transitions if status is being updated
        if (request.status != null && request.validateTransitions) {
            request.matterIds.forEach { matterId ->
                val matter = matterService.getMatterById(matterId)
                if (matter != null && !matter.status.canTransitionTo(request.status)) {
                    errors.add(ValidationError(
                        itemId = matterId,
                        field = "status",
                        message = "Invalid status transition from ${matter.status} to ${request.status}",
                        currentValue = matter.status,
                        suggestedValue = request.status
                    ))
                }
            }
        }
        
        return BatchValidationResult(
            isValid = errors.isEmpty(),
            totalItems = request.matterIds.size,
            validItems = request.matterIds.size - errors.size,
            invalidItems = errors.size,
            errors = errors
        )
    }
    
    override fun validateBulkDelete(request: BulkDeleteMatterRequest): BatchValidationResult {
        val errors = mutableListOf<ValidationError>()
        
        // Check matter IDs exist and user has access
        request.matterIds.forEach { matterId ->
            val matter = matterService.getMatterById(matterId)
            if (matter == null) {
                errors.add(ValidationError(
                    itemId = matterId,
                    field = "matterId",
                    message = "Matter not found or access denied"
                ))
            } else if (!request.forceDelete && matter.status != dev.ryuzu.astermanagement.domain.matter.MatterStatus.CLOSED) {
                errors.add(ValidationError(
                    itemId = matterId,
                    field = "status",
                    message = "Can only delete closed matters (use forceDelete to override)",
                    currentValue = matter.status
                ))
            }
        }
        
        return BatchValidationResult(
            isValid = errors.isEmpty(),
            totalItems = request.matterIds.size,
            validItems = request.matterIds.size - errors.size,
            invalidItems = errors.size,
            errors = errors
        )
    }
    
    override fun canUserPerformOperation(userId: UUID, operationType: OperationType): Boolean {
        // TODO: Implement proper RBAC check
        return when (operationType) {
            OperationType.BULK_UPDATE -> isLawyer() || isClerk()
            OperationType.BULK_DELETE -> isLawyer()
            OperationType.EXPORT -> isLawyer() || isClerk()
            else -> isLawyer()
        }
    }
    
    override fun getUserOperationLimits(userId: UUID): UserOperationLimits {
        val activeCount = operationRepository.countActiveOperationsByUser(userId)
        val todayStart = LocalDateTime.now().toLocalDate().atStartOfDay()
        val todayCount = 0L // TODO: Implement daily count query
        
        return UserOperationLimits(
            maxConcurrentOperations = if (isLawyer()) 5 else 3,
            maxDailyOperations = if (isLawyer()) 50 else 20,
            maxBulkUpdateSize = if (isLawyer()) defaultBulkUpdateLimit else 100,
            maxBulkDeleteSize = if (isLawyer()) defaultBulkDeleteLimit else 0,
            currentActiveOperations = activeCount,
            todayOperationsCount = todayCount,
            canCreateNewOperation = activeCount < (if (isLawyer()) 5 else 3)
        )
    }
    
    // Private helper methods
    
    @Async
    private fun processOperation(operation: Operation): Operation {
        if (runningOperations.containsKey(operation.id)) {
            logger.warn("Operation ${operation.id} is already running")
            return operation
        }
        
        try {
            runningOperations[operation.id!!] = true
            operation.start()
            operationRepository.save(operation)
            
            logger.info("Starting operation ${operation.id} of type ${operation.operationType}")
            
            // Get the appropriate processor and execute
            val processor = operationProcessors[operation.operationType]
            if (processor != null) {
                processor.process(operation, this)
            } else {
                throw IllegalStateException("No processor found for operation type ${operation.operationType}")
            }
            
        } catch (e: Exception) {
            logger.error("Error processing operation ${operation.id}", e)
            failOperation(operation.id!!, "Processing error: ${e.message}")
        } finally {
            runningOperations.remove(operation.id)
        }
        
        return operation
    }
    
    private fun sendProgressUpdate(operationId: UUID, current: Int, total: Int, message: String?) {
        try {
            val update = OperationProgressUpdate(operationId, current, total, message)
            simpMessagingTemplate.convertAndSend("/topic/operations/$operationId/progress", update)
        } catch (e: Exception) {
            logger.warn("Failed to send progress update for operation $operationId", e)
        }
    }
    
    private fun calculateAverageWaitTime(): Double {
        // TODO: Implement actual calculation based on historical data
        return 2.5 // minutes
    }
    
    private fun estimateBulkUpdateDuration(itemCount: Int): Int {
        // Estimate ~0.5 seconds per item + overhead
        return (itemCount * 0.5 + 10).toInt()
    }
    
    private fun estimateBulkDeleteDuration(itemCount: Int): Int {
        // Estimate ~0.3 seconds per item + overhead
        return (itemCount * 0.3 + 5).toInt()
    }
    
    private fun estimateExportDuration(itemCount: Int, format: ExportFormat): Int {
        val baseTime = when (format) {
            ExportFormat.CSV -> 0.1
            ExportFormat.EXCEL -> 0.2
            ExportFormat.PDF -> 0.5
            ExportFormat.JSON -> 0.1
        }
        return (itemCount * baseTime + 15).toInt()
    }
    
    private fun Operation.toDto(): OperationDto {
        return OperationDto(
            id = this.id!!,
            type = this.operationType,
            priority = this.priority,
            status = this.status,
            title = this.title,
            description = this.description,
            payload = this.payload,
            result = this.result,
            errorMessage = this.errorMessage,
            progressCurrent = this.progressCurrent,
            progressTotal = this.progressTotal,
            progressMessage = this.progressMessage,
            progressPercentage = this.progressPercentage,
            queuedAt = this.queuedAt,
            startedAt = this.startedAt,
            completedAt = this.completedAt,
            retryCount = this.retryCount,
            maxRetries = this.maxRetries,
            estimatedDurationSeconds = this.estimatedDurationSeconds,
            actualDurationSeconds = this.durationSeconds,
            dependencies = this.dependencies.toList(),
            transactionId = this.transactionId,
            userId = this.user?.id!!,
            userEmail = this.user?.email,
            canRetry = this.canRetry,
            canCancel = this.canCancel,
            isTerminal = this.isTerminal,
            createdAt = this.createdAt!!,
            updatedAt = this.updatedAt!!
        )
    }
}

/**
 * Interface for operation processors
 */
interface OperationProcessor {
    fun process(operation: Operation, operationService: OperationService)
}

/**
 * Processor for bulk update operations
 */
class BulkUpdateProcessor(
    private val bulkOperationTransactionService: BulkOperationTransactionService,
    private val objectMapper: ObjectMapper
) : OperationProcessor {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    override fun process(operation: Operation, operationService: OperationService) {
        logger.info("Processing bulk update operation ${operation.id}")
        // Simplified implementation
        operationService.completeOperation(operation.id!!, "Bulk update processed")
    }
}

/**
 * Processor for bulk delete operations
 */
class BulkDeleteProcessor(
    private val bulkOperationTransactionService: BulkOperationTransactionService,
    private val objectMapper: ObjectMapper
) : OperationProcessor {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    override fun process(operation: Operation, operationService: OperationService) {
        logger.info("Processing bulk delete operation ${operation.id}")
        // Simplified implementation
        operationService.completeOperation(operation.id!!, "Bulk delete processed")
    }
}

/**
 * Processor for export operations
 */
class ExportProcessor(
    private val objectMapper: ObjectMapper
) : OperationProcessor {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    override fun process(operation: Operation, operationService: OperationService) {
        logger.info("Processing export operation ${operation.id}")
        // Simplified implementation
        operationService.completeOperation(operation.id!!, "Export processed")
    }
}