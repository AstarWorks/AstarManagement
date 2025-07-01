package dev.ryuzu.astermanagement.service.batch

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.config.DocumentProcessingProperties
import dev.ryuzu.astermanagement.domain.batch.*
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.util.*
import java.util.concurrent.TimeUnit

/**
 * Redis-based job queue service for document processing
 * Provides priority-based queuing, status tracking, and job lifecycle management
 */
@Service
class RedisJobQueueService(
    private val redisTemplate: RedisTemplate<String, Any>,
    private val objectMapper: ObjectMapper,
    private val documentProcessingProperties: DocumentProcessingProperties
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(RedisJobQueueService::class.java)
        
        // Redis key patterns
        private const val JOB_QUEUE_KEY = "aster:jobs:queue"
        private const val JOB_STATUS_KEY = "aster:jobs:status"
        private const val JOB_PROGRESS_KEY = "aster:jobs:progress"
        private const val JOB_HISTORY_KEY = "aster:jobs:history"
        private const val PRIORITY_HIGH_QUEUE = "aster:jobs:queue:high"
        private const val PRIORITY_NORMAL_QUEUE = "aster:jobs:queue:normal"
        private const val ACTIVE_JOBS_KEY = "aster:jobs:active"
        private const val DEAD_LETTER_QUEUE = "aster:jobs:dlq"
        private const val JOB_METRICS_KEY = "aster:jobs:metrics"
    }
    
    /**
     * Enqueue a new job for processing
     */
    fun enqueueJob(jobRequest: DocumentProcessingJobRequest): String {
        val jobId = UUID.randomUUID().toString()
        val queueEntry = JobQueueEntry(
            jobId = jobId,
            documentId = jobRequest.documentId,
            userId = jobRequest.userId,
            priority = jobRequest.priority,
            jobType = jobRequest.jobType,
            parameters = jobRequest.parameters,
            createdAt = Instant.now(),
            ttl = documentProcessingProperties.job.ttlSeconds,
            correlationId = jobRequest.correlationId,
            tags = jobRequest.tags
        )
        
        val queueKey = when (jobRequest.priority) {
            JobPriority.HIGH -> PRIORITY_HIGH_QUEUE
            JobPriority.NORMAL -> PRIORITY_NORMAL_QUEUE
        }
        
        // Check queue size limits
        val currentQueueSize = redisTemplate.opsForList().size(queueKey) ?: 0
        val maxQueueSize = when (jobRequest.priority) {
            JobPriority.HIGH -> documentProcessingProperties.queue.highPriorityMaxSize
            JobPriority.NORMAL -> documentProcessingProperties.queue.normalPriorityMaxSize
        }
        
        if (currentQueueSize >= maxQueueSize) {
            throw IllegalStateException("Queue capacity exceeded for priority ${jobRequest.priority}")
        }
        
        // Add to queue
        redisTemplate.opsForList().leftPush(queueKey, queueEntry)
        
        // Set initial status
        updateJobStatus(jobId, JobStatus.QUEUED, 0, "Job queued for processing")
        
        // Set TTL for the queue entry
        redisTemplate.expire(queueKey, Duration.ofSeconds(documentProcessingProperties.job.ttlSeconds))
        
        logger.info("Job enqueued: jobId={}, documentId={}, priority={}, type={}", 
            jobId, jobRequest.documentId, jobRequest.priority, jobRequest.jobType)
        
        return jobId
    }
    
    /**
     * Dequeue the next job for processing (priority-based)
     */
    fun dequeueJob(): JobQueueEntry? {
        // Priority-based dequeue: high priority first
        val highPriorityJob = redisTemplate.opsForList().rightPop(PRIORITY_HIGH_QUEUE)
        if (highPriorityJob != null) {
            val job = highPriorityJob as JobQueueEntry
            markJobAsActive(job.jobId)
            logger.debug("Dequeued high priority job: {}", job.jobId)
            return job
        }
        
        // Then normal priority
        val normalPriorityJob = redisTemplate.opsForList().rightPop(PRIORITY_NORMAL_QUEUE)
        if (normalPriorityJob != null) {
            val job = normalPriorityJob as JobQueueEntry
            markJobAsActive(job.jobId)
            logger.debug("Dequeued normal priority job: {}", job.jobId)
            return job
        }
        
        return null
    }
    
    /**
     * Dequeue job with timeout (blocking operation)
     */
    fun dequeueJobWithTimeout(timeoutSeconds: Long): JobQueueEntry? {
        val queues = listOf(PRIORITY_HIGH_QUEUE, PRIORITY_NORMAL_QUEUE)
        val result = redisTemplate.opsForList().rightPop(queues, timeoutSeconds, TimeUnit.SECONDS)
        
        return if (result != null) {
            val job = result.value as JobQueueEntry
            markJobAsActive(job.jobId)
            logger.debug("Dequeued job with timeout: {}", job.jobId)
            job
        } else {
            null
        }
    }
    
    /**
     * Update job status and progress
     */
    fun updateJobStatus(
        jobId: String, 
        status: JobStatus, 
        progress: Int = 0, 
        details: String? = null,
        error: String? = null,
        stepDetails: Map<String, Any> = emptyMap()
    ) {
        val currentTime = Instant.now()
        val existingStatus = getJobStatus(jobId)
        
        val statusEntry = JobStatusEntry(
            jobId = jobId,
            status = status,
            progress = progress,
            details = details,
            error = error,
            updatedAt = currentTime,
            startedAt = existingStatus?.startedAt ?: if (status == JobStatus.RUNNING) currentTime else null,
            completedAt = if (status.isTerminal()) currentTime else null,
            processingTimeMs = calculateProcessingTime(existingStatus, status, currentTime),
            stepDetails = stepDetails
        )
        
        // Store current status
        redisTemplate.opsForHash().put(JOB_STATUS_KEY, jobId, statusEntry)
        
        // Store in history for audit trail
        redisTemplate.opsForList().leftPush("$JOB_HISTORY_KEY:$jobId", statusEntry)
        redisTemplate.expire(
            "$JOB_HISTORY_KEY:$jobId", 
            Duration.ofSeconds(documentProcessingProperties.job.historyTtlSeconds)
        )
        
        // Update active jobs tracking
        if (status.isTerminal()) {
            removeJobFromActive(jobId)
            updateJobMetrics(jobId, statusEntry)
        }
        
        logger.debug("Job status updated: jobId={}, status={}, progress={}", jobId, status, progress)
    }
    
    /**
     * Get current job status
     */
    fun getJobStatus(jobId: String): JobStatusEntry? {
        return redisTemplate.opsForHash().get(JOB_STATUS_KEY, jobId) as? JobStatusEntry
    }
    
    /**
     * Get job history
     */
    fun getJobHistory(jobId: String): List<JobStatusEntry> {
        val historyKey = "$JOB_HISTORY_KEY:$jobId"
        return redisTemplate.opsForList().range(historyKey, 0, -1)
            ?.mapNotNull { it as? JobStatusEntry }
            ?.reversed() // Show chronological order
            ?: emptyList()
    }
    
    /**
     * Get queue statistics
     */
    fun getQueueStats(): JobQueueStats {
        val highPriorityCount = redisTemplate.opsForList().size(PRIORITY_HIGH_QUEUE) ?: 0
        val normalPriorityCount = redisTemplate.opsForList().size(PRIORITY_NORMAL_QUEUE) ?: 0
        val totalJobs = highPriorityCount + normalPriorityCount
        val activeJobs = getActiveJobCount()
        val metrics = getJobMetrics()
        
        return JobQueueStats(
            totalQueued = totalJobs,
            highPriorityQueued = highPriorityCount,
            normalPriorityQueued = normalPriorityCount,
            activeJobs = activeJobs,
            completedJobs = metrics["completedJobs"] as? Long ?: 0L,
            failedJobs = metrics["failedJobs"] as? Long ?: 0L,
            averageProcessingTimeMs = metrics["averageProcessingTimeMs"] as? Double ?: 0.0,
            timestamp = Instant.now()
        )
    }
    
    /**
     * Cancel a job
     */
    fun cancelJob(jobId: String, reason: String = "Job cancelled by user") {
        val currentStatus = getJobStatus(jobId)
        if (currentStatus?.status?.isTerminal() == true) {
            throw IllegalStateException("Cannot cancel job in terminal state: ${currentStatus.status}")
        }
        
        updateJobStatus(jobId, JobStatus.CANCELLED, currentStatus?.progress ?: 0, reason)
        removeJobFromActive(jobId)
        
        logger.info("Job cancelled: jobId={}, reason={}", jobId, reason)
    }
    
    /**
     * Retry a failed job
     */
    fun retryJob(jobId: String): String {
        val currentStatus = getJobStatus(jobId)
            ?: throw IllegalArgumentException("Job not found: $jobId")
        
        if (currentStatus.status != JobStatus.FAILED) {
            throw IllegalStateException("Can only retry failed jobs. Current status: ${currentStatus.status}")
        }
        
        updateJobStatus(jobId, JobStatus.RETRYING, 0, "Job queued for retry")
        
        // Re-enqueue the job (this would need original job request data)
        logger.info("Job marked for retry: jobId={}", jobId)
        return jobId
    }
    
    /**
     * Move job to dead letter queue
     */
    fun moveToDeadLetterQueue(jobId: String, reason: String) {
        if (!documentProcessingProperties.queue.deadLetterQueueEnabled) {
            return
        }
        
        val jobStatus = getJobStatus(jobId)
        if (jobStatus != null) {
            val dlqEntry = mapOf(
                "jobId" to jobId,
                "originalStatus" to jobStatus,
                "reason" to reason,
                "timestamp" to Instant.now()
            )
            
            redisTemplate.opsForList().leftPush(DEAD_LETTER_QUEUE, dlqEntry)
            logger.warn("Job moved to dead letter queue: jobId={}, reason={}", jobId, reason)
        }
    }
    
    /**
     * Clean up expired jobs and statuses
     */
    fun cleanupExpiredJobs(): Int {
        var cleanedCount = 0
        
        try {
            // Clean up expired job statuses
            val allJobIds = redisTemplate.opsForHash().keys(JOB_STATUS_KEY)
            val expiredThreshold = Instant.now().minus(Duration.ofSeconds(documentProcessingProperties.job.ttlSeconds))
            
            allJobIds.forEach { jobIdKey ->
                val status = redisTemplate.opsForHash().get(JOB_STATUS_KEY, jobIdKey) as? JobStatusEntry
                if (status != null && status.updatedAt.isBefore(expiredThreshold) && status.status.isTerminal()) {
                    redisTemplate.opsForHash().delete(JOB_STATUS_KEY, jobIdKey)
                    redisTemplate.delete("$JOB_HISTORY_KEY:$jobIdKey")
                    cleanedCount++
                }
            }
            
            if (cleanedCount > 0) {
                logger.info("Cleaned up {} expired jobs", cleanedCount)
            }
            
        } catch (exception: Exception) {
            logger.error("Error during job cleanup", exception)
        }
        
        return cleanedCount
    }
    
    // Private helper methods
    
    private fun markJobAsActive(jobId: String) {
        redisTemplate.opsForSet().add(ACTIVE_JOBS_KEY, jobId)
        redisTemplate.expire(ACTIVE_JOBS_KEY, Duration.ofSeconds(documentProcessingProperties.job.ttlSeconds))
    }
    
    private fun removeJobFromActive(jobId: String) {
        redisTemplate.opsForSet().remove(ACTIVE_JOBS_KEY, jobId)
    }
    
    private fun getActiveJobCount(): Long {
        return redisTemplate.opsForSet().size(ACTIVE_JOBS_KEY) ?: 0
    }
    
    private fun calculateProcessingTime(existingStatus: JobStatusEntry?, status: JobStatus, currentTime: Instant): Long? {
        return if (status.isTerminal() && existingStatus?.startedAt != null) {
            Duration.between(existingStatus.startedAt, currentTime).toMillis()
        } else {
            existingStatus?.processingTimeMs
        }
    }
    
    private fun updateJobMetrics(jobId: String, statusEntry: JobStatusEntry) {
        val metricsKey = JOB_METRICS_KEY
        
        when (statusEntry.status) {
            JobStatus.COMPLETED -> {
                redisTemplate.opsForHash().increment(metricsKey, "completedJobs", 1)
                statusEntry.processingTimeMs?.let { processingTime ->
                    val currentAvg = (redisTemplate.opsForHash().get(metricsKey, "averageProcessingTimeMs") as? Double) ?: 0.0
                    val currentCount = (redisTemplate.opsForHash().get(metricsKey, "completedJobs") as? Long) ?: 1L
                    val newAvg = (currentAvg * (currentCount - 1) + processingTime) / currentCount
                    redisTemplate.opsForHash().put(metricsKey, "averageProcessingTimeMs", newAvg)
                }
            }
            JobStatus.FAILED -> {
                redisTemplate.opsForHash().increment(metricsKey, "failedJobs", 1)
            }
            else -> { /* No metrics update needed */ }
        }
        
        // Set TTL for metrics
        redisTemplate.expire(metricsKey, Duration.ofDays(7))
    }
    
    private fun getJobMetrics(): Map<String, Any> {
        return redisTemplate.opsForHash().entries(JOB_METRICS_KEY)
    }
    
    private fun JobStatus.isTerminal(): Boolean {
        return this in setOf(JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED)
    }
}