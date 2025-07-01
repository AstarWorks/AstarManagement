package dev.ryuzu.astermanagement.service.batch

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.domain.batch.JobQueueEntry
import dev.ryuzu.astermanagement.domain.batch.JobStatus
import dev.ryuzu.astermanagement.domain.batch.JobType
import dev.ryuzu.astermanagement.security.audit.impl.SecurityAuditLogger
import org.slf4j.LoggerFactory
import org.springframework.batch.core.Job
import org.springframework.batch.core.JobExecution
import org.springframework.batch.core.JobParametersBuilder
import org.springframework.batch.core.launch.JobLauncher
import org.springframework.context.ApplicationContext
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

/**
 * Service for executing document processing jobs
 * Handles job launching, monitoring, and lifecycle management
 */
@Service
@Transactional
class DocumentProcessingJobExecutionService(
    private val jobLauncher: JobLauncher,
    private val redisJobQueueService: RedisJobQueueService,
    private val securityAuditLogger: SecurityAuditLogger,
    private val objectMapper: ObjectMapper,
    private val applicationContext: ApplicationContext
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(DocumentProcessingJobExecutionService::class.java)
    }
    
    /**
     * Execute a job asynchronously
     */
    @Async("jobExecutionTaskExecutor")
    fun executeJobAsync(jobQueueEntry: JobQueueEntry) {
        val jobId = jobQueueEntry.jobId
        val startTime = Instant.now()
        
        try {
            logger.info("Starting job execution: jobId={}, type={}, documentId={}", 
                jobId, jobQueueEntry.jobType, jobQueueEntry.documentId)
            
            redisJobQueueService.updateJobStatus(
                jobId, 
                JobStatus.RUNNING, 
                0, 
                "Starting job execution",
                stepDetails = mapOf<String, Any>("startTime" to startTime.toString())
            )
            
            // Get appropriate job based on job type
            val job = getJobByType(jobQueueEntry.jobType)
            
            // Build job parameters
            val jobParameters = buildJobParameters(jobQueueEntry)
            
            // Launch the job
            val jobExecution = jobLauncher.run(job, jobParameters)
            
            // Monitor job execution
            monitorJobExecution(jobId, jobExecution, startTime)
            
        } catch (exception: Exception) {
            logger.error("Failed to execute job: jobId={}", jobId, exception)
            handleJobExecutionFailure(jobQueueEntry, exception, startTime)
        }
    }
    
    /**
     * Execute a job synchronously (for testing or critical operations)
     */
    fun executeJobSync(jobQueueEntry: JobQueueEntry): JobExecution {
        val jobId = jobQueueEntry.jobId
        val startTime = Instant.now()
        
        try {
            logger.info("Starting synchronous job execution: jobId={}, type={}", 
                jobId, jobQueueEntry.jobType)
            
            redisJobQueueService.updateJobStatus(jobId, JobStatus.RUNNING, 0, "Starting synchronous execution")
            
            val job = getJobByType(jobQueueEntry.jobType)
            val jobParameters = buildJobParameters(jobQueueEntry)
            
            val jobExecution = jobLauncher.run(job, jobParameters)
            
            // Process completion immediately for sync execution
            processJobCompletion(jobId, jobExecution, startTime)
            
            return jobExecution
            
        } catch (exception: Exception) {
            logger.error("Failed to execute synchronous job: jobId={}", jobId, exception)
            handleJobExecutionFailure(jobQueueEntry, exception, startTime)
            throw exception
        }
    }
    
    /**
     * Cancel a running job
     */
    fun cancelJob(jobId: String, reason: String = "Job cancelled by request"): Boolean {
        try {
            // Update status first
            redisJobQueueService.updateJobStatus(jobId, JobStatus.CANCELLED, 0, reason)
            
            // Log cancellation
            securityAuditLogger.logSystemEvent(
                eventType = "JOB_CANCELLED",
                description = "Document processing job cancelled",
                additionalDetails = mapOf(
                    "jobId" to jobId,
                    "reason" to reason,
                    "timestamp" to Instant.now().toString()
                )
            )
            
            logger.info("Job cancellation requested: jobId={}, reason={}", jobId, reason)
            return true
            
        } catch (exception: Exception) {
            logger.error("Failed to cancel job: jobId={}", jobId, exception)
            return false
        }
    }
    
    /**
     * Get job status with execution details
     */
    fun getJobExecutionStatus(jobId: String): Map<String, Any>? {
        val status = redisJobQueueService.getJobStatus(jobId) ?: return null
        
        return mapOf(
            "jobId" to jobId,
            "status" to status.status,
            "progress" to status.progress,
            "details" to (status.details ?: ""),
            "error" to (status.error ?: ""),
            "updatedAt" to (status.updatedAt ?: ""),
            "startedAt" to (status.startedAt ?: ""),
            "completedAt" to (status.completedAt ?: ""),
            "processingTimeMs" to (status.processingTimeMs ?: 0),
            "stepDetails" to (status.stepDetails ?: emptyMap<String, Any>())
        )
    }
    
    // Private helper methods
    
    private fun getJobByType(jobType: JobType): Job {
        val jobBeanName = when (jobType) {
            JobType.DOCUMENT_UPLOAD, JobType.METADATA_EXTRACTION, JobType.FILE_VALIDATION -> "documentProcessingJob"
            JobType.THUMBNAIL_GENERATION -> "thumbnailGenerationJob"
            JobType.VIRUS_SCAN -> "virusScanningJob"
            JobType.OCR_PROCESSING -> "ocrProcessingJob"
            JobType.BATCH_PROCESSING -> "batchProcessingJob"
            JobType.DOCUMENT_CONVERSION -> "documentProcessingJob" // Can be extended later
        }
        
        return applicationContext.getBean(jobBeanName, Job::class.java)
            ?: throw IllegalArgumentException("No job configured for type: $jobType")
    }
    
    private fun buildJobParameters(jobQueueEntry: JobQueueEntry) = JobParametersBuilder()
        .addString("jobId", jobQueueEntry.jobId)
        .addString("documentId", jobQueueEntry.documentId)
        .addString("userId", jobQueueEntry.userId)
        .addString("jobType", jobQueueEntry.jobType.name)
        .addString("priority", jobQueueEntry.priority.name)
        .addLong("timestamp", System.currentTimeMillis())
        .addString("correlationId", jobQueueEntry.correlationId ?: "")
        .addString("parameters", objectMapper.writeValueAsString(jobQueueEntry.parameters))
        .addString("tags", jobQueueEntry.tags.joinToString(","))
        .toJobParameters()
    
    private fun monitorJobExecution(jobId: String, jobExecution: JobExecution, startTime: Instant) {
        try {
            // Check execution status
            val batchStatus = jobExecution.status
            val exitStatus = jobExecution.exitStatus
            
            when {
                batchStatus == org.springframework.batch.core.BatchStatus.STARTED || 
                batchStatus == org.springframework.batch.core.BatchStatus.STARTING -> {
                    logger.debug("Job is running: jobId={}, executionId={}", jobId, jobExecution.id)
                    // Could implement periodic status checks here
                }
                batchStatus == org.springframework.batch.core.BatchStatus.FAILED -> {
                    logger.warn("Job failed: jobId={}, exitCode={}", jobId, exitStatus.exitCode)
                    redisJobQueueService.updateJobStatus(
                        jobId, 
                        JobStatus.FAILED, 
                        100, 
                        "Job execution failed",
                        error = exitStatus.exitDescription
                    )
                }
                batchStatus == org.springframework.batch.core.BatchStatus.COMPLETED -> {
                    logger.info("Job completed: jobId={}, exitCode={}", jobId, exitStatus.exitCode)
                    processJobCompletion(jobId, jobExecution, startTime)
                }
                else -> {
                    logger.debug("Job status: {}", batchStatus)
                }
            }
            
        } catch (exception: Exception) {
            logger.error("Error monitoring job execution: jobId={}", jobId, exception)
        }
    }
    
    private fun processJobCompletion(jobId: String, jobExecution: JobExecution, startTime: Instant) {
        val endTime = Instant.now()
        val processingTime = java.time.Duration.between(startTime, endTime).toMillis()
        
        val isSuccessful = jobExecution.status == org.springframework.batch.core.BatchStatus.COMPLETED
        val status = if (isSuccessful) JobStatus.COMPLETED else JobStatus.FAILED
        
        redisJobQueueService.updateJobStatus(
            jobId = jobId,
            status = status,
            progress = 100,
            details = if (isSuccessful) "Job completed successfully" else "Job failed",
            error = if (!isSuccessful) jobExecution.exitStatus.exitDescription else null,
            stepDetails = mapOf(
                "endTime" to endTime.toString(),
                "processingTimeMs" to processingTime,
                "batchStatus" to jobExecution.status.name,
                "exitCode" to jobExecution.exitStatus.exitCode
            )
        )
        
        // Audit log
        securityAuditLogger.logSystemEvent(
            eventType = if (isSuccessful) "JOB_COMPLETED" else "JOB_FAILED",
            description = "Document processing job ${if (isSuccessful) "completed" else "failed"}",
            additionalDetails = mapOf(
                "jobId" to jobId,
                "processingTimeMs" to processingTime,
                "batchStatus" to jobExecution.status.name,
                "exitCode" to jobExecution.exitStatus.exitCode
            )
        )
        
        logger.info("Job {} execution finished: jobId={}, processingTime={}ms", 
            if (isSuccessful) "successfully" else "unsuccessfully", jobId, processingTime)
    }
    
    private fun handleJobExecutionFailure(
        jobQueueEntry: JobQueueEntry, 
        exception: Exception, 
        startTime: Instant
    ) {
        val jobId = jobQueueEntry.jobId
        val endTime = Instant.now()
        val processingTime = java.time.Duration.between(startTime, endTime).toMillis()
        
        redisJobQueueService.updateJobStatus(
            jobId = jobId,
            status = JobStatus.FAILED,
            progress = 0,
            details = "Job execution failed with exception",
            error = exception.message ?: "Unknown error",
            stepDetails = mapOf(
                "exception" to exception.javaClass.simpleName,
                "processingTimeMs" to processingTime,
                "failurePoint" to "job_execution"
            )
        )
        
        // Check if job should be retried
        if (jobQueueEntry.attemptCount < jobQueueEntry.maxAttempts) {
            logger.info("Job will be retried: jobId={}, attempt={}/{}", 
                jobId, jobQueueEntry.attemptCount + 1, jobQueueEntry.maxAttempts)
            // Could implement retry logic here
        } else {
            logger.error("Job failed after maximum attempts: jobId={}", jobId)
            redisJobQueueService.moveToDeadLetterQueue(jobId, "Maximum retry attempts exceeded")
        }
        
        // Audit log
        securityAuditLogger.logSystemEvent(
            eventType = "JOB_EXECUTION_FAILED",
            description = "Document processing job execution failed",
            additionalDetails = mapOf(
                "jobId" to jobId,
                "documentId" to jobQueueEntry.documentId,
                "userId" to jobQueueEntry.userId,
                "jobType" to jobQueueEntry.jobType.name,
                "error" to (exception.message ?: "Unknown error"),
                "attemptCount" to jobQueueEntry.attemptCount,
                "maxAttempts" to jobQueueEntry.maxAttempts
            )
        )
    }
}