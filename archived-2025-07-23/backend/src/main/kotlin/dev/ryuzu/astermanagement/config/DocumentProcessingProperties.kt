package dev.ryuzu.astermanagement.config

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Configuration properties for document processing batch jobs
 * Provides environment-specific settings for job execution, concurrency, and storage
 */
@ConfigurationProperties(prefix = "aster.document-processing")
data class DocumentProcessingProperties(
    val job: JobProperties = JobProperties(),
    val concurrency: ConcurrencyProperties = ConcurrencyProperties(),
    val storage: StorageProperties = StorageProperties(),
    val queue: QueueProperties = QueueProperties(),
    val retry: RetryProperties = RetryProperties()
) {
    
    data class JobProperties(
        val ttlSeconds: Long = 3600, // 1 hour
        val historyTtlSeconds: Long = 86400, // 24 hours
        val maxRetries: Int = 3,
        val retryDelaySeconds: Long = 60,
        val batchSize: Int = 10,
        val chunkSize: Int = 100,
        val enableSkipOnError: Boolean = true
    )
    
    data class ConcurrencyProperties(
        val corePoolSize: Int = 10,
        val maxPoolSize: Int = 50,
        val queueCapacity: Int = 100,
        val maxConcurrentJobs: Int = 50,
        val keepAliveSeconds: Int = 60,
        val allowCoreThreadTimeout: Boolean = true
    )
    
    data class StorageProperties(
        val tempDir: String = "\${java.io.tmpdir}/aster-processing",
        val cleanupIntervalHours: Long = 24,
        val maxTempFileAgeHours: Long = 48,
        val enableAutoCleanup: Boolean = true
    )
    
    data class QueueProperties(
        val highPriorityMaxSize: Long = 1000,
        val normalPriorityMaxSize: Long = 5000,
        val enablePriorityQueuing: Boolean = true,
        val deadLetterQueueEnabled: Boolean = true,
        val visibilityTimeoutSeconds: Long = 300 // 5 minutes
    )
    
    data class RetryProperties(
        val maxAttempts: Int = 3,
        val initialDelayMs: Long = 1000,
        val maxDelayMs: Long = 30000,
        val multiplier: Double = 2.0,
        val enableExponentialBackoff: Boolean = true
    )
}