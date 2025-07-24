package dev.ryuzu.astermanagement.domain.operation

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import dev.ryuzu.astermanagement.domain.user.User
import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDateTime
import java.util.*

/**
 * Operation entity representing bulk operations and background tasks.
 * Supports operation queuing, progress tracking, and transaction management.
 */
@Entity
@Table(
    name = "operations",
    indexes = [
        Index(name = "idx_operations_type", columnList = "operation_type"),
        Index(name = "idx_operations_status", columnList = "status"),
        Index(name = "idx_operations_user", columnList = "user_id"),
        Index(name = "idx_operations_priority", columnList = "priority"),
        Index(name = "idx_operations_queued_at", columnList = "queued_at"),
        Index(name = "idx_operations_status_priority", columnList = "status, priority"),
        Index(name = "idx_operations_user_status", columnList = "user_id, status")
    ]
)
class Operation : BaseEntity() {

    @Column(name = "operation_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @field:NotNull(message = "Operation type is required")
    var operationType: OperationType = OperationType.BULK_UPDATE

    @Column(name = "priority", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @field:NotNull(message = "Priority is required")
    var priority: OperationPriority = OperationPriority.NORMAL

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @field:NotNull(message = "Status is required")
    var status: OperationStatus = OperationStatus.QUEUED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @field:NotNull(message = "User is required")
    var user: User? = null

    @Column(name = "title", nullable = false, length = 255)
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 255, message = "Title must not exceed 255 characters")
    var title: String = ""

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null

    @Column(name = "payload", columnDefinition = "TEXT")
    var payload: String? = null // JSON payload for operation data

    @Column(name = "result", columnDefinition = "TEXT")
    var result: String? = null // JSON result after completion

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null

    @Column(name = "progress_current", nullable = false)
    var progressCurrent: Int = 0

    @Column(name = "progress_total", nullable = false)
    var progressTotal: Int = 0

    @Column(name = "progress_message", length = 500)
    var progressMessage: String? = null

    @Column(name = "queued_at", nullable = false)
    var queuedAt: LocalDateTime = LocalDateTime.now()

    @Column(name = "started_at")
    var startedAt: LocalDateTime? = null

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null

    @Column(name = "retry_count", nullable = false)
    var retryCount: Int = 0

    @Column(name = "max_retries", nullable = false)
    var maxRetries: Int = 3

    @Column(name = "estimated_duration_seconds")
    var estimatedDurationSeconds: Int? = null

    @Column(name = "dependencies", columnDefinition = "TEXT[]")
    var dependencies: Array<String> = emptyArray()

    @Column(name = "transaction_id", length = 100)
    var transactionId: String? = null

    /**
     * Calculate progress percentage (0-100)
     */
    val progressPercentage: Int
        get() = if (progressTotal > 0) {
            (progressCurrent * 100) / progressTotal
        } else 0

    /**
     * Check if operation is in a terminal state
     */
    val isTerminal: Boolean
        get() = status in setOf(
            OperationStatus.COMPLETED,
            OperationStatus.FAILED,
            OperationStatus.CANCELLED
        )

    /**
     * Check if operation can be retried
     */
    val canRetry: Boolean
        get() = status == OperationStatus.FAILED && retryCount < maxRetries

    /**
     * Check if operation can be cancelled
     */
    val canCancel: Boolean
        get() = status in setOf(
            OperationStatus.QUEUED,
            OperationStatus.RUNNING,
            OperationStatus.PAUSED
        )

    /**
     * Get duration in seconds if completed
     */
    val durationSeconds: Long?
        get() = if (startedAt != null && completedAt != null) {
            java.time.Duration.between(startedAt, completedAt).seconds
        } else null

    /**
     * Update progress with current step and message
     */
    fun updateProgress(
        current: Int,
        total: Int = this.progressTotal,
        message: String? = null
    ) {
        this.progressCurrent = current.coerceAtMost(total)
        this.progressTotal = total.coerceAtLeast(current)
        message?.let { this.progressMessage = it }
    }

    /**
     * Start the operation
     */
    fun start() {
        if (status == OperationStatus.QUEUED || status == OperationStatus.PAUSED) {
            status = OperationStatus.RUNNING
            startedAt = LocalDateTime.now()
        }
    }

    /**
     * Complete the operation successfully
     */
    fun complete(result: String? = null) {
        status = OperationStatus.COMPLETED
        completedAt = LocalDateTime.now()
        this.result = result
        updateProgress(progressTotal, progressTotal, "Operation completed successfully")
    }

    /**
     * Fail the operation with error message
     */
    fun fail(errorMessage: String) {
        status = OperationStatus.FAILED
        completedAt = LocalDateTime.now()
        this.errorMessage = errorMessage
        this.progressMessage = "Operation failed: $errorMessage"
    }

    /**
     * Cancel the operation
     */
    fun cancel() {
        if (canCancel) {
            status = OperationStatus.CANCELLED
            completedAt = LocalDateTime.now()
            progressMessage = "Operation cancelled by user"
        }
    }

    /**
     * Pause the operation
     */
    fun pause() {
        if (status == OperationStatus.RUNNING) {
            status = OperationStatus.PAUSED
            progressMessage = "Operation paused"
        }
    }

    /**
     * Resume the operation
     */
    fun resume() {
        if (status == OperationStatus.PAUSED) {
            status = OperationStatus.RUNNING
            progressMessage = "Operation resumed"
        }
    }

    /**
     * Prepare for retry
     */
    fun prepareForRetry() {
        if (canRetry) {
            retryCount++
            status = OperationStatus.QUEUED
            startedAt = null
            completedAt = null
            errorMessage = null
            progressMessage = "Retrying operation (attempt ${retryCount + 1}/${maxRetries + 1})"
            updateProgress(0, progressTotal)
        }
    }

    override fun toString(): String {
        return "Operation(id=$id, type=$operationType, status=$status, title='$title', progress=$progressCurrent/$progressTotal)"
    }
}

/**
 * Operation types supported by the system
 */
enum class OperationType {
    BULK_UPDATE,
    BULK_DELETE,
    EXPORT,
    IMPORT,
    DOCUMENT_PROCESSING,
    REPORT_GENERATION;

    val displayName: String
        get() = name.replace('_', ' ').lowercase()
            .split(' ')
            .joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
}

/**
 * Operation status enum representing the lifecycle
 */
enum class OperationStatus {
    QUEUED,
    RUNNING,
    PAUSED,
    COMPLETED,
    FAILED,
    CANCELLED;

    val displayName: String
        get() = name.lowercase().replaceFirstChar { it.uppercase() }

    val isActive: Boolean
        get() = this in setOf(QUEUED, RUNNING, PAUSED)

    val isTerminal: Boolean
        get() = this in setOf(COMPLETED, FAILED, CANCELLED)
}

/**
 * Operation priority levels
 */
enum class OperationPriority {
    LOW,
    NORMAL,
    HIGH,
    URGENT;

    val displayName: String
        get() = name.lowercase().replaceFirstChar { it.uppercase() }

    val weight: Int
        get() = when (this) {
            LOW -> 1
            NORMAL -> 2
            HIGH -> 3
            URGENT -> 4
        }
}