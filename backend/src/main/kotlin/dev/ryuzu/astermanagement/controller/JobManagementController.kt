package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.domain.batch.DocumentProcessingJobRequest
import dev.ryuzu.astermanagement.domain.batch.JobQueueStats
import dev.ryuzu.astermanagement.domain.batch.JobStatusEntry
import dev.ryuzu.astermanagement.service.batch.DocumentProcessingJobExecutionService
import dev.ryuzu.astermanagement.service.batch.JobQueueHealthService
import dev.ryuzu.astermanagement.service.batch.RedisJobQueueService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import jakarta.validation.Valid

/**
 * REST controller for job management and monitoring
 * Provides endpoints for job submission, status tracking, and queue monitoring
 */
@RestController
@RequestMapping("/api/jobs")
@Tag(name = "Job Management", description = "Document processing job management and monitoring")
class JobManagementController(
    private val redisJobQueueService: RedisJobQueueService,
    private val jobExecutionService: DocumentProcessingJobExecutionService,
    private val jobQueueHealthService: JobQueueHealthService
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(JobManagementController::class.java)
    }
    
    /**
     * Submit a new document processing job
     */
    @PostMapping("/submit")
    @PreAuthorize("hasAuthority('DOCUMENT_UPLOAD') or hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(summary = "Submit document processing job", description = "Submit a new document processing job to the queue")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Job submitted successfully"),
        ApiResponse(responseCode = "400", description = "Invalid job request"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "503", description = "Queue capacity exceeded")
    ])
    fun submitJob(
        @Valid @RequestBody jobRequest: DocumentProcessingJobRequest
    ): ResponseEntity<Map<String, Any>> {
        return try {
            logger.info("Submitting job: type={}, documentId={}, userId={}", 
                jobRequest.jobType, jobRequest.documentId, jobRequest.userId)
            
            val jobId = redisJobQueueService.enqueueJob(jobRequest)
            
            ResponseEntity.ok(mapOf(
                "jobId" to jobId,
                "status" to "QUEUED",
                "message" to "Job submitted successfully",
                "estimatedProcessingTime" to "5-30 seconds"
            ))
            
        } catch (exception: IllegalStateException) {
            logger.warn("Job submission failed: {}", exception.message)
            ResponseEntity.status(503).body(mapOf(
                "error" to "Queue capacity exceeded",
                "message" to (exception.message ?: "Unknown error"),
                "retryAfter" to "30 seconds"
            ))
        } catch (exception: Exception) {
            logger.error("Failed to submit job", exception)
            ResponseEntity.badRequest().body(mapOf(
                "error" to "Job submission failed",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Get job status and progress
     */
    @GetMapping("/{jobId}/status")
    @PreAuthorize("hasAuthority('DOCUMENT_READ') or hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(summary = "Get job status", description = "Get current status and progress of a document processing job")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Job status retrieved"),
        ApiResponse(responseCode = "404", description = "Job not found"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    ])
    fun getJobStatus(
        @Parameter(description = "Job ID") @PathVariable jobId: String
    ): ResponseEntity<Map<String, Any>> {
        val status = jobExecutionService.getJobExecutionStatus(jobId)
        
        return if (status != null) {
            ResponseEntity.ok(status)
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Get job execution history
     */
    @GetMapping("/{jobId}/history")
    @PreAuthorize("hasAuthority('DOCUMENT_READ') or hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(summary = "Get job history", description = "Get execution history and audit trail for a job")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Job history retrieved"),
        ApiResponse(responseCode = "404", description = "Job not found"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    ])
    fun getJobHistory(
        @Parameter(description = "Job ID") @PathVariable jobId: String
    ): ResponseEntity<List<JobStatusEntry>> {
        return try {
            val history = redisJobQueueService.getJobHistory(jobId)
            ResponseEntity.ok(history)
        } catch (exception: Exception) {
            logger.error("Failed to get job history for jobId: {}", jobId, exception)
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Cancel a running job
     */
    @PostMapping("/{jobId}/cancel")
    @PreAuthorize("hasAuthority('DOCUMENT_DELETE') or hasRole('LAWYER')")
    @Operation(summary = "Cancel job", description = "Cancel a running or queued document processing job")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Job cancelled successfully"),
        ApiResponse(responseCode = "400", description = "Job cannot be cancelled"),
        ApiResponse(responseCode = "404", description = "Job not found"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    ])
    fun cancelJob(
        @Parameter(description = "Job ID") @PathVariable jobId: String,
        @RequestParam(defaultValue = "Cancelled by user") reason: String
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val success = jobExecutionService.cancelJob(jobId, reason)
            
            if (success) {
                ResponseEntity.ok(mapOf(
                    "jobId" to jobId,
                    "status" to "CANCELLED",
                    "message" to "Job cancelled successfully",
                    "reason" to reason
                ))
            } else {
                ResponseEntity.badRequest().body(mapOf(
                    "error" to "Job cancellation failed",
                    "jobId" to jobId
                ))
            }
            
        } catch (exception: Exception) {
            logger.error("Failed to cancel job: {}", jobId, exception)
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "error" to "Job cancellation failed",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Retry a failed job
     */
    @PostMapping("/{jobId}/retry")
    @PreAuthorize("hasAuthority('DOCUMENT_UPLOAD') or hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(summary = "Retry failed job", description = "Retry a failed document processing job")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Job retry initiated"),
        ApiResponse(responseCode = "400", description = "Job cannot be retried"),
        ApiResponse(responseCode = "404", description = "Job not found"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    ])
    fun retryJob(
        @Parameter(description = "Job ID") @PathVariable jobId: String
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val retryJobId = redisJobQueueService.retryJob(jobId)
            
            ResponseEntity.ok(mapOf(
                "originalJobId" to jobId,
                "retryJobId" to retryJobId,
                "status" to "RETRYING",
                "message" to "Job retry initiated"
            ))
            
        } catch (exception: IllegalStateException) {
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "error" to "Job cannot be retried",
                "message" to (exception.message ?: "Unknown error")
            ))
        } catch (exception: Exception) {
            logger.error("Failed to retry job: {}", jobId, exception)
            ResponseEntity.badRequest().body(mapOf(
                "error" to "Job retry failed",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Get queue statistics and metrics
     */
    @GetMapping("/queue/stats")
    @PreAuthorize("hasAuthority('DOCUMENT_READ') or hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(summary = "Get queue statistics", description = "Get current job queue statistics and performance metrics")
    @ApiResponse(responseCode = "200", description = "Queue statistics retrieved")
    fun getQueueStats(): ResponseEntity<JobQueueStats> {
        return try {
            val stats = redisJobQueueService.getQueueStats()
            ResponseEntity.ok(stats)
        } catch (exception: Exception) {
            logger.error("Failed to get queue stats", exception)
            ResponseEntity.status(500).build()
        }
    }
    
    /**
     * Get detailed queue health information
     */
    @GetMapping("/queue/health")
    @PreAuthorize("hasAuthority('DOCUMENT_READ') or hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(summary = "Get queue health", description = "Get detailed job queue health and capacity information")
    @ApiResponse(responseCode = "200", description = "Queue health information retrieved")
    fun getQueueHealth(): ResponseEntity<Map<String, Any>> {
        return try {
            val healthDetails = jobQueueHealthService.getDetailedStats()
            val isHealthy = jobQueueHealthService.isHealthy()
            
            ResponseEntity.ok(mapOf(
                "healthy" to isHealthy,
                "utilization" to jobQueueHealthService.getQueueUtilization(),
                "successRate" to jobQueueHealthService.getSuccessRate(),
                "details" to healthDetails
            ))
            
        } catch (exception: Exception) {
            logger.error("Failed to get queue health", exception)
            ResponseEntity.status(500).body(mapOf(
                "healthy" to false,
                "error" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Admin endpoint for queue management
     */
    @PostMapping("/admin/cleanup")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SYSTEM_ADMIN')")
    @Operation(summary = "Cleanup expired jobs", description = "Manually trigger cleanup of expired jobs (Admin only)")
    @ApiResponse(responseCode = "200", description = "Cleanup completed")
    fun cleanupExpiredJobs(): ResponseEntity<Map<String, Any>> {
        return try {
            val cleanedCount = redisJobQueueService.cleanupExpiredJobs()
            
            ResponseEntity.ok(mapOf(
                "message" to "Cleanup completed",
                "cleanedJobs" to cleanedCount
            ))
            
        } catch (exception: Exception) {
            logger.error("Failed to cleanup expired jobs", exception)
            ResponseEntity.status(500).body(mapOf(
                "error" to "Cleanup failed",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
}