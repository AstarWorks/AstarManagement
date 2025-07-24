package dev.ryuzu.astermanagement.domain.batch

import com.fasterxml.jackson.annotation.JsonFormat
import java.time.Instant
import java.util.*

/**
 * Represents a job entry in the processing queue
 */
data class JobQueueEntry(
    val jobId: String,
    val documentId: String,
    val userId: String,
    val priority: JobPriority,
    val jobType: JobType,
    val parameters: Map<String, Any> = emptyMap(),
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
    val createdAt: Instant,
    val ttl: Long,
    val attemptCount: Int = 0,
    val maxAttempts: Int = 3,
    val correlationId: String? = null,
    val tags: Set<String> = emptySet()
)

/**
 * Represents the status and progress of a job
 */
data class JobStatusEntry(
    val jobId: String,
    val status: JobStatus,
    val progress: Int = 0, // Percentage 0-100
    val details: String? = null,
    val error: String? = null,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
    val updatedAt: Instant,
    val startedAt: Instant? = null,
    val completedAt: Instant? = null,
    val processingTimeMs: Long? = null,
    val stepDetails: Map<String, Any> = emptyMap()
)

/**
 * Request model for creating a new document processing job
 */
data class DocumentProcessingJobRequest(
    val documentId: String,
    val userId: String,
    val jobType: JobType,
    val priority: JobPriority = JobPriority.NORMAL,
    val parameters: Map<String, Any> = emptyMap(),
    val correlationId: String? = null,
    val tags: Set<String> = emptySet()
)

/**
 * Statistics for job queue monitoring
 */
data class JobQueueStats(
    val totalQueued: Long,
    val highPriorityQueued: Long,
    val normalPriorityQueued: Long,
    val activeJobs: Long,
    val completedJobs: Long,
    val failedJobs: Long,
    val averageProcessingTimeMs: Double,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
    val timestamp: Instant
)