package dev.ryuzu.astermanagement.dto.operation

import dev.ryuzu.astermanagement.domain.operation.OperationType
import dev.ryuzu.astermanagement.domain.operation.OperationStatus
import dev.ryuzu.astermanagement.domain.operation.OperationPriority
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import jakarta.validation.constraints.*
import java.time.LocalDateTime
import java.util.*

/**
 * Request DTO for creating a new operation
 */
data class CreateOperationRequest(
    @field:NotNull(message = "Operation type is required")
    val type: OperationType,
    
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 255, message = "Title must not exceed 255 characters")
    val title: String,
    
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    val description: String? = null,
    
    @field:NotNull(message = "Payload is required")
    val payload: Any,
    
    val priority: OperationPriority = OperationPriority.NORMAL,
    
    @field:Min(value = 0, message = "Max retries must be non-negative")
    @field:Max(value = 10, message = "Max retries cannot exceed 10")
    val maxRetries: Int = 3,
    
    @field:Min(value = 1, message = "Estimated duration must be positive")
    val estimatedDurationSeconds: Int? = null,
    
    val dependencies: List<String> = emptyList(),
    
    val transactionId: String? = null
)

/**
 * Response DTO for operation details
 */
data class OperationDto(
    val id: UUID,
    val type: OperationType,
    val priority: OperationPriority,
    val status: OperationStatus,
    val title: String,
    val description: String?,
    val payload: String?, // JSON string
    val result: String?, // JSON string
    val errorMessage: String?,
    val progressCurrent: Int,
    val progressTotal: Int,
    val progressMessage: String?,
    val progressPercentage: Int,
    val queuedAt: LocalDateTime,
    val startedAt: LocalDateTime?,
    val completedAt: LocalDateTime?,
    val retryCount: Int,
    val maxRetries: Int,
    val estimatedDurationSeconds: Int?,
    val actualDurationSeconds: Long?,
    val dependencies: List<String>,
    val transactionId: String?,
    val userId: UUID,
    val userEmail: String?,
    val canRetry: Boolean,
    val canCancel: Boolean,
    val isTerminal: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

/**
 * Bulk update request for matters
 */
data class BulkUpdateMatterRequest(
    @field:NotEmpty(message = "Matter IDs are required")
    @field:Size(max = 1000, message = "Cannot update more than 1000 matters at once")
    val matterIds: List<UUID>,
    
    val status: MatterStatus? = null,
    val priority: MatterPriority? = null,
    val assignedLawyerId: UUID? = null,
    val assignedClerkId: UUID? = null,
    
    @field:Size(max = 2000, message = "Notes must not exceed 2000 characters")
    val notes: String? = null,
    
    val addTags: List<String> = emptyList(),
    val removeTags: List<String> = emptyList(),
    
    @field:Size(max = 500, message = "Reason must not exceed 500 characters")
    val reason: String? = null,
    
    val validateTransitions: Boolean = true,
    val stopOnFirstError: Boolean = false
)

/**
 * Bulk delete request for matters
 */
data class BulkDeleteMatterRequest(
    @field:NotEmpty(message = "Matter IDs are required")
    @field:Size(max = 500, message = "Cannot delete more than 500 matters at once")
    val matterIds: List<UUID>,
    
    @field:NotBlank(message = "Reason is required for bulk deletion")
    @field:Size(max = 500, message = "Reason must not exceed 500 characters")
    val reason: String,
    
    val forceDelete: Boolean = false
)

/**
 * Export request for matters
 */
data class ExportMatterRequest(
    val matterIds: List<UUID>? = null, // If null, export all accessible matters
    
    @field:NotNull(message = "Export format is required")
    val format: ExportFormat,
    
    val includeDocuments: Boolean = false,
    val includeAuditLog: Boolean = false,
    val includeStatusHistory: Boolean = true,
    
    val dateFrom: LocalDateTime? = null,
    val dateTo: LocalDateTime? = null,
    
    val filters: ExportFilters? = null
)

/**
 * Export filters for matter export
 */
data class ExportFilters(
    val statuses: List<MatterStatus>? = null,
    val priorities: List<MatterPriority>? = null,
    val assignedLawyerIds: List<UUID>? = null,
    val assignedClerkIds: List<UUID>? = null,
    val clientNamePattern: String? = null,
    val tags: List<String>? = null
)

/**
 * Export formats supported
 */
enum class ExportFormat {
    CSV,
    EXCEL,
    PDF,
    JSON;
    
    val mimeType: String
        get() = when (this) {
            CSV -> "text/csv"
            EXCEL -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            PDF -> "application/pdf"
            JSON -> "application/json"
        }
    
    val fileExtension: String
        get() = when (this) {
            CSV -> "csv"
            EXCEL -> "xlsx"
            PDF -> "pdf"
            JSON -> "json"
        }
}

/**
 * Progress update for operation
 */
data class OperationProgressUpdate(
    val operationId: UUID,
    val current: Int,
    val total: Int,
    val message: String? = null
)

/**
 * Batch validation result
 */
data class BatchValidationResult(
    val isValid: Boolean,
    val totalItems: Int,
    val validItems: Int,
    val invalidItems: Int,
    val errors: List<ValidationError>
)

/**
 * Validation error for individual items
 */
data class ValidationError(
    val itemId: UUID,
    val field: String,
    val message: String,
    val currentValue: Any? = null,
    val suggestedValue: Any? = null
)

/**
 * Bulk operation result summary
 */
data class BulkOperationResult(
    val operationId: UUID,
    val totalRequested: Int,
    val totalProcessed: Int,
    val totalSuccessful: Int,
    val totalFailed: Int,
    val totalSkipped: Int,
    val errors: List<BulkOperationError>,
    val warnings: List<String> = emptyList(),
    val summary: String
)

/**
 * Error details for bulk operations
 */
data class BulkOperationError(
    val itemId: UUID,
    val errorCode: String,
    val errorMessage: String,
    val field: String? = null,
    val currentValue: Any? = null,
    val stackTrace: String? = null
)

/**
 * Operation statistics
 */
data class OperationStatistics(
    val totalOperations: Long,
    val operationsByStatus: Map<OperationStatus, Long>,
    val operationsByType: Map<OperationType, Long>,
    val averageWaitTimeSeconds: Double,
    val averageProcessingTimeSeconds: Double,
    val successRate: Double,
    val retryRate: Double,
    val currentQueueSize: Long,
    val currentRunningCount: Long,
    val peakQueueSize: Long,
    val lastUpdated: LocalDateTime
)

/**
 * Operation queue status
 */
data class OperationQueueStatus(
    val queueSize: Long,
    val runningCount: Long,
    val maxConcurrentOperations: Int,
    val isProcessing: Boolean,
    val nextOperations: List<OperationDto>,
    val averageWaitTimeMinutes: Double,
    val estimatedWaitTimeMinutes: Double?
)

/**
 * Cancel operation request
 */
data class CancelOperationRequest(
    @field:Size(max = 500, message = "Reason must not exceed 500 characters")
    val reason: String? = null
)

/**
 * Pause/Resume operation request
 */
data class PauseResumeOperationRequest(
    @field:Size(max = 500, message = "Reason must not exceed 500 characters")
    val reason: String? = null
)

/**
 * Retry operation request
 */
data class RetryOperationRequest(
    @field:Size(max = 500, message = "Reason must not exceed 500 characters")
    val reason: String? = null,
    
    val resetRetryCount: Boolean = false
)