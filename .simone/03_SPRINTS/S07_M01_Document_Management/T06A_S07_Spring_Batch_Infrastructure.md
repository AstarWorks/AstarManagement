---
task_id: T06A_S07
sprint_sequence_id: S07
status: open
complexity: Medium
last_updated: 2025-07-01T00:00:00Z
---

# Task: Spring Batch Infrastructure for Document Processing

## Description

Establish the foundational Spring Batch infrastructure for asynchronous document processing with Redis-based job queuing and status tracking. This task focuses on creating a robust, scalable job processing framework that can handle high-volume document uploads while providing real-time status updates and comprehensive job management.

The infrastructure will serve as the backbone for all document processing operations, ensuring reliable job execution, proper queue management, and seamless integration with the existing Redis and security infrastructure.

## Goal / Objectives

- **Scalable Job Framework**: Configure Spring Batch to handle 50+ concurrent document processing jobs
- **Redis Integration**: Implement comprehensive job queuing and status tracking using existing Redis infrastructure
- **Job Orchestration**: Create flexible job step definitions that can be extended for various processing workflows
- **Status Tracking**: Provide real-time job progress monitoring with detailed status information
- **Performance Optimization**: Ensure efficient job execution with proper resource management
- **Integration Ready**: Establish foundation for integration with existing audit logging and RBAC systems
- **Monitoring Foundation**: Create basic monitoring endpoints for job queue health and performance
- **Configuration Management**: Implement environment-specific configuration for job processing parameters

## Acceptance Criteria

- [ ] Spring Batch framework configured with proper job repository and transaction management
- [ ] Redis-based job queue service operational with priority handling
- [ ] Job status tracking system with real-time updates via Redis
- [ ] Basic job step framework ready for processing service integration
- [ ] Job lifecycle management (creation, execution, completion, failure)
- [ ] Configuration properties for job processing parameters
- [ ] Basic health checks for job processing infrastructure
- [ ] Job cleanup mechanisms for completed and failed jobs
- [ ] Integration with existing Redis configuration and Spring Security
- [ ] Comprehensive logging for job execution tracking
- [ ] Job scheduling service with batch processing capabilities
- [ ] Foundation for real-time notifications system
- [ ] Unit and integration tests for all infrastructure components

## Subtasks

### Spring Batch Configuration
- [ ] Set up Spring Batch job repository with PostgreSQL backend
- [ ] Configure job launcher with async execution capabilities
- [ ] Create base job configuration class with transaction management
- [ ] Implement job parameter builder utilities for document processing context
- [ ] Configure batch database schema initialization and migrations
- [ ] Set up job execution listener for lifecycle event handling

### Redis Job Queue Infrastructure
- [ ] Design Redis key structure for job queues and status tracking
- [ ] Implement RedisJobQueueService with priority-based job ordering
- [ ] Create job queue entry data models with serialization support
- [ ] Build job enqueue/dequeue mechanisms with atomic operations
- [ ] Implement job queue monitoring with size and throughput metrics
- [ ] Add job queue cleanup mechanisms for expired entries

### Job Status Management
- [ ] Create JobStatus enum and data models for comprehensive status tracking
- [ ] Implement job status persistence in Redis with TTL management
- [ ] Build job progress tracking with percentage completion support
- [ ] Create job status notification service for real-time updates
- [ ] Implement job status history tracking for audit purposes
- [ ] Add job status query APIs for client applications

### Job Execution Framework
- [ ] Create base document processing job definition with step orchestration
- [ ] Implement job step factory for flexible processing pipeline creation
- [ ] Build job context management for sharing data between steps
- [ ] Create job execution service with proper error handling
- [ ] Implement job cancellation and interruption mechanisms
- [ ] Add job restart capabilities for failed executions

### Configuration and Properties
- [ ] Define application properties for job processing configuration
- [ ] Implement configuration classes for batch processing parameters
- [ ] Create environment-specific job processing profiles
- [ ] Set up job execution pool configuration with thread management
- [ ] Configure job repository connection pooling and performance tuning
- [ ] Add validation for job processing configuration parameters

## Technical Guidance

### Spring Batch Core Configuration

Building on the existing Spring Boot infrastructure:

```kotlin
@Configuration
@EnableBatchProcessing
@EnableConfigurationProperties(DocumentProcessingProperties::class)
class DocumentProcessingBatchConfig(
    private val dataSource: DataSource,
    private val transactionManager: PlatformTransactionManager,
    private val documentProcessingProperties: DocumentProcessingProperties
) {
    
    @Bean
    fun jobRepository(): JobRepository {
        return JobRepositoryBuilder()
            .dataSource(dataSource)
            .transactionManager(transactionManager)
            .build()
    }
    
    @Bean
    fun jobLauncher(jobRepository: JobRepository): JobLauncher {
        return JobLauncherBuilder()
            .jobRepository(jobRepository)
            .taskExecutor(jobExecutionTaskExecutor())
            .build()
    }
    
    @Bean
    @Primary
    fun jobExecutionTaskExecutor(): TaskExecutor {
        return ThreadPoolTaskExecutor().apply {
            corePoolSize = documentProcessingProperties.concurrency.corePoolSize
            maxPoolSize = documentProcessingProperties.concurrency.maxPoolSize
            queueCapacity = documentProcessingProperties.concurrency.queueCapacity
            setThreadNamePrefix("doc-processing-")
            initialize()
        }
    }
    
    @Bean
    fun documentProcessingJob(
        jobRepository: JobRepository,
        documentProcessingStepFactory: DocumentProcessingStepFactory
    ): Job {
        return JobBuilder("documentProcessingJob", jobRepository)
            .start(documentProcessingStepFactory.createInitializationStep())
            .next(documentProcessingStepFactory.createValidationStep())
            .next(documentProcessingStepFactory.createProcessingStep())
            .next(documentProcessingStepFactory.createFinalizationStep())
            .listener(DocumentProcessingJobListener())
            .build()
    }
}
```

### Redis Job Queue Service

Extending existing Redis infrastructure:

```kotlin
@Service
@Transactional
class RedisJobQueueService(
    private val redisTemplate: RedisTemplate<String, Any>,
    private val objectMapper: ObjectMapper,
    private val documentProcessingProperties: DocumentProcessingProperties
) {
    
    companion object {
        private const val JOB_QUEUE_KEY = "aster:jobs:queue"
        private const val JOB_STATUS_KEY = "aster:jobs:status"
        private const val JOB_PROGRESS_KEY = "aster:jobs:progress"
        private const val JOB_HISTORY_KEY = "aster:jobs:history"
        private const val PRIORITY_HIGH_QUEUE = "aster:jobs:queue:high"
        private const val PRIORITY_NORMAL_QUEUE = "aster:jobs:queue:normal"
    }
    
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
            ttl = documentProcessingProperties.job.ttlSeconds
        )
        
        val queueKey = when (jobRequest.priority) {
            JobPriority.HIGH -> PRIORITY_HIGH_QUEUE
            JobPriority.NORMAL -> PRIORITY_NORMAL_QUEUE
        }
        
        redisTemplate.opsForList().leftPush(queueKey, queueEntry)
        updateJobStatus(jobId, JobStatus.QUEUED)
        
        logger.info("Job enqueued: jobId=$jobId, documentId=${jobRequest.documentId}, priority=${jobRequest.priority}")
        return jobId
    }
    
    fun dequeueJob(): JobQueueEntry? {
        // Priority-based dequeue: high priority first
        val highPriorityJob = redisTemplate.opsForList().rightPop(PRIORITY_HIGH_QUEUE)
        if (highPriorityJob != null) {
            return highPriorityJob as JobQueueEntry
        }
        
        return redisTemplate.opsForList().rightPop(PRIORITY_NORMAL_QUEUE) as? JobQueueEntry
    }
    
    fun updateJobStatus(
        jobId: String, 
        status: JobStatus, 
        progress: Int = 0, 
        details: String? = null,
        error: String? = null
    ) {
        val statusEntry = JobStatusEntry(
            jobId = jobId,
            status = status,
            progress = progress,
            details = details,
            error = error,
            updatedAt = Instant.now()
        )
        
        redisTemplate.opsForHash().put(JOB_STATUS_KEY, jobId, statusEntry)
        
        // Store in history for audit trail
        redisTemplate.opsForList().leftPush("$JOB_HISTORY_KEY:$jobId", statusEntry)
        
        // Set TTL for cleanup
        redisTemplate.expire(
            "$JOB_HISTORY_KEY:$jobId", 
            Duration.ofSeconds(documentProcessingProperties.job.historyTtlSeconds)
        )
        
        logger.debug("Job status updated: jobId=$jobId, status=$status, progress=$progress")
    }
    
    fun getJobStatus(jobId: String): JobStatusEntry? {
        return redisTemplate.opsForHash().get(JOB_STATUS_KEY, jobId) as? JobStatusEntry
    }
    
    fun getQueueStats(): JobQueueStats {
        val highPriorityCount = redisTemplate.opsForList().size(PRIORITY_HIGH_QUEUE) ?: 0
        val normalPriorityCount = redisTemplate.opsForList().size(PRIORITY_NORMAL_QUEUE) ?: 0
        val totalJobs = highPriorityCount + normalPriorityCount
        
        return JobQueueStats(
            totalQueued = totalJobs,
            highPriorityQueued = highPriorityCount,
            normalPriorityQueued = normalPriorityCount,
            activeJobs = getActiveJobCount(),
            timestamp = Instant.now()
        )
    }
    
    private fun getActiveJobCount(): Long {
        return redisTemplate.opsForHash()
            .values(JOB_STATUS_KEY)
            .filterIsInstance<JobStatusEntry>()
            .count { it.status == JobStatus.RUNNING }
            .toLong()
    }
}
```

### Job Execution Service

Core job execution management:

```kotlin
@Service
@Transactional
class DocumentProcessingJobExecutionService(
    private val jobLauncher: JobLauncher,
    private val documentProcessingJob: Job,
    private val redisJobQueueService: RedisJobQueueService,
    private val auditEventPublisher: AuditEventPublisher
) {
    
    @Async("jobExecutionTaskExecutor")
    fun executeJobAsync(jobQueueEntry: JobQueueEntry) {
        val jobId = jobQueueEntry.jobId
        
        try {
            redisJobQueueService.updateJobStatus(jobId, JobStatus.RUNNING, 0, "Starting job execution")
            
            val jobParameters = JobParametersBuilder()
                .addString("jobId", jobId)
                .addString("documentId", jobQueueEntry.documentId)
                .addString("userId", jobQueueEntry.userId)
                .addString("jobType", jobQueueEntry.jobType.name)
                .addLong("timestamp", System.currentTimeMillis())
                .addString("parameters", objectMapper.writeValueAsString(jobQueueEntry.parameters))
                .toJobParameters()
            
            val jobExecution = jobLauncher.run(documentProcessingJob, jobParameters)
            
            // Monitor job execution
            monitorJobExecution(jobId, jobExecution)
            
        } catch (exception: Exception) {
            logger.error("Failed to execute job: $jobId", exception)
            redisJobQueueService.updateJobStatus(
                jobId, 
                JobStatus.FAILED, 
                0, 
                "Job execution failed", 
                exception.message
            )
            
            auditEventPublisher.publishAuditEvent(
                eventType = AuditEventType.DOCUMENT_PROCESSING_FAILED,
                userId = jobQueueEntry.userId,
                resourceType = "document",
                resourceId = jobQueueEntry.documentId,
                action = "job_execution_failed",
                details = mapOf(
                    "jobId" to jobId,
                    "error" to exception.message,
                    "timestamp" to Instant.now().toString()
                )
            )
        }
    }
    
    private fun monitorJobExecution(jobId: String, jobExecution: JobExecution) {
        // Implementation for job execution monitoring
        // This will be extended in the monitoring task
    }
}
```

### Configuration Properties

```kotlin
@ConfigurationProperties(prefix = "aster.document-processing")
@ConstructorBinding
data class DocumentProcessingProperties(
    val job: JobProperties = JobProperties(),
    val concurrency: ConcurrencyProperties = ConcurrencyProperties(),
    val storage: StorageProperties = StorageProperties()
) {
    
    data class JobProperties(
        val ttlSeconds: Long = 3600, // 1 hour
        val historyTtlSeconds: Long = 86400, // 24 hours
        val maxRetries: Int = 3,
        val retryDelaySeconds: Long = 60
    )
    
    data class ConcurrencyProperties(
        val corePoolSize: Int = 10,
        val maxPoolSize: Int = 50,
        val queueCapacity: Int = 100,
        val maxConcurrentJobs: Int = 50
    )
    
    data class StorageProperties(
        val tempDir: String = "\${java.io.tmpdir}/aster-processing",
        val cleanupIntervalHours: Long = 24
    )
}
```

## Dependencies Required

Add to build.gradle.kts:

```kotlin
dependencies {
    // Spring Batch (already included)
    implementation("org.springframework.boot:spring-boot-starter-batch")
    
    // Redis operations (using existing Redis configuration)
    // spring-boot-starter-data-redis already included
    
    // JSON processing (using existing ObjectMapper)
    // jackson already included
    
    // Validation
    implementation("org.springframework.boot:spring-boot-starter-validation")
    
    // Testing
    testImplementation("org.springframework.batch:spring-batch-test")
}
```

## Configuration Integration

Extend application.yml:

```yaml
aster:
  document-processing:
    job:
      ttl-seconds: 3600
      history-ttl-seconds: 86400
      max-retries: 3
      retry-delay-seconds: 60
    concurrency:
      core-pool-size: 10
      max-pool-size: 50
      queue-capacity: 100
      max-concurrent-jobs: 50
    storage:
      temp-dir: ${java.io.tmpdir}/aster-processing
      cleanup-interval-hours: 24

spring:
  batch:
    job:
      enabled: false # Prevent auto-execution
    jdbc:
      initialize-schema: always
      schema: classpath:org/springframework/batch/core/schema-postgresql.sql
```

## Success Metrics

- **Queue Performance**: Handle 50+ jobs in queue with < 100ms enqueue/dequeue operations
- **Job Execution**: Successfully launch and track job execution lifecycle
- **Status Tracking**: Real-time status updates with < 1 second latency
- **Resource Management**: Efficient thread pool utilization with < 80% peak usage
- **Integration**: Seamless integration with existing Redis and audit infrastructure
- **Reliability**: < 1% job infrastructure failure rate
- **Monitoring**: Complete visibility into job queue health and performance

## Implementation Notes

This infrastructure task provides the foundation for the entire document processing pipeline. The focus is on creating a robust, scalable framework that can be extended with specific processing services while maintaining high performance and reliability.

The design leverages existing Spring Boot patterns and Redis infrastructure, ensuring consistency with the codebase architecture and seamless integration with security and audit systems.

## Output Log

*(This section is populated as work progresses on the task)*

[2025-07-01 00:00:00] Task created focusing on Spring Batch infrastructure and Redis job queue foundation