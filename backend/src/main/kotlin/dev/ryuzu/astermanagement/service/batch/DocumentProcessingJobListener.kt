package dev.ryuzu.astermanagement.service.batch

import dev.ryuzu.astermanagement.domain.batch.JobStatus
import dev.ryuzu.astermanagement.security.audit.impl.SecurityAuditLogger
import org.slf4j.LoggerFactory
import org.springframework.batch.core.JobExecution
import org.springframework.batch.core.JobExecutionListener
import org.springframework.batch.core.JobParameters
import org.springframework.stereotype.Component
import java.time.Instant

/**
 * Job execution listener for document processing jobs
 * Handles job lifecycle events and integrates with Redis job tracking
 */
@Component
class DocumentProcessingJobListener(
    private val redisJobQueueService: RedisJobQueueService,
    private val securityAuditLogger: SecurityAuditLogger
) : JobExecutionListener {
    
    companion object {
        private val logger = LoggerFactory.getLogger(DocumentProcessingJobListener::class.java)
    }
    
    override fun beforeJob(jobExecution: JobExecution) {
        val jobParameters = jobExecution.jobParameters
        val jobId = jobParameters.getString("jobId")
        val documentId = jobParameters.getString("documentId")
        val userId = jobParameters.getString("userId")
        val jobType = jobParameters.getString("jobType")
        
        logger.info("Starting job execution: jobId={}, type={}, documentId={}", jobId, jobType, documentId)
        
        if (jobId != null) {
            redisJobQueueService.updateJobStatus(
                jobId = jobId,
                status = JobStatus.RUNNING,
                progress = 0,
                details = "Job execution started",
                stepDetails = mapOf(
                    "batchJobId" to jobExecution.id,
                    "jobName" to jobExecution.jobInstance.jobName,
                    "startTime" to Instant.now().toString()
                )
            )
        }
        
        // Audit log for job start
        securityAuditLogger.logSystemEvent(
            eventType = "JOB_STARTED",
            description = "Document processing job started",
            additionalDetails = mapOf(
                "jobId" to (jobId ?: "unknown"),
                "batchJobId" to jobExecution.id,
                "jobName" to jobExecution.jobInstance.jobName,
                "documentId" to (documentId ?: "unknown"),
                "userId" to (userId ?: "unknown"),
                "jobType" to (jobType ?: "unknown")
            )
        )
    }
    
    override fun afterJob(jobExecution: JobExecution) {
        val jobParameters = jobExecution.jobParameters
        val jobId = jobParameters.getString("jobId")
        val documentId = jobParameters.getString("documentId")
        val userId = jobParameters.getString("userId")
        val jobType = jobParameters.getString("jobType")
        
        val isSuccessful = jobExecution.status == org.springframework.batch.core.BatchStatus.COMPLETED
        val processingTime = if (jobExecution.startTime != null && jobExecution.endTime != null) {
            java.time.Duration.between(
                jobExecution.startTime.atZone(java.time.ZoneId.systemDefault()).toInstant(),
                jobExecution.endTime.atZone(java.time.ZoneId.systemDefault()).toInstant()
            ).toMillis()
        } else null
        
        logger.info("Job execution finished: jobId={}, status={}, processingTime={}ms", 
            jobId, jobExecution.status, processingTime)
        
        if (jobId != null) {
            val status = if (isSuccessful) JobStatus.COMPLETED else JobStatus.FAILED
            val details = if (isSuccessful) {
                "Job completed successfully"
            } else {
                "Job failed: ${jobExecution.exitStatus.exitDescription}"
            }
            
            redisJobQueueService.updateJobStatus(
                jobId = jobId,
                status = status,
                progress = 100,
                details = details,
                error = if (!isSuccessful) jobExecution.exitStatus.exitDescription else null,
                stepDetails = mapOf(
                    "batchJobId" to jobExecution.id,
                    "endTime" to Instant.now().toString(),
                    "processingTimeMs" to (processingTime ?: 0),
                    "batchStatus" to jobExecution.status.name,
                    "exitCode" to jobExecution.exitStatus.exitCode,
                    "stepExecutions" to jobExecution.stepExecutions.map { step ->
                        mapOf(
                            "stepName" to step.stepName,
                            "status" to step.status.name,
                            "readCount" to step.readCount,
                            "writeCount" to step.writeCount,
                            "skipCount" to step.skipCount
                        )
                    }
                )
            )
        }
        
        // Audit log for job completion
        securityAuditLogger.logSystemEvent(
            eventType = if (isSuccessful) "JOB_COMPLETED" else "JOB_FAILED",
            description = "Document processing job ${if (isSuccessful) "completed" else "failed"}",
            additionalDetails = mapOf(
                "jobId" to (jobId ?: "unknown"),
                "batchJobId" to jobExecution.id,
                "jobName" to jobExecution.jobInstance.jobName,
                "documentId" to (documentId ?: "unknown"),
                "userId" to (userId ?: "unknown"),
                "jobType" to (jobType ?: "unknown"),
                "successful" to isSuccessful,
                "processingTimeMs" to (processingTime ?: 0),
                "batchStatus" to jobExecution.status.name,
                "exitCode" to jobExecution.exitStatus.exitCode,
                "stepCount" to jobExecution.stepExecutions.size
            )
        )
        
        // Log any failures or exceptions
        if (!isSuccessful) {
            jobExecution.allFailureExceptions.forEach { exception ->
                logger.error("Job execution exception: jobId={}", jobId, exception)
            }
        }
    }
}