package dev.ryuzu.astermanagement.storage.health

import dev.ryuzu.astermanagement.config.StorageProperties
import dev.ryuzu.astermanagement.storage.service.StorageService
import org.slf4j.LoggerFactory
import org.springframework.boot.actuator.health.Health
import org.springframework.boot.actuator.health.HealthIndicator
import java.time.ZoneOffset
import jakarta.annotation.PostConstruct
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import java.io.ByteArrayInputStream
import java.time.Duration
import java.time.Instant
import java.util.UUID

/**
 * Health indicator for storage service.
 * Performs periodic health checks to ensure storage connectivity and functionality.
 * 
 * Health checks include:
 * - Connection verification
 * - Read/write capability test
 * - Response time measurement
 * - Storage provider metadata
 * 
 * The health check creates a temporary test object in a dedicated health-check bucket
 * to verify full storage functionality.
 */
@Component
@ConditionalOnProperty(prefix = "aster.storage", name = ["enable-health-check"], havingValue = "true", matchIfMissing = true)
class StorageHealthIndicator(
    private val storageService: StorageService,
    private val storageProperties: StorageProperties
) : HealthIndicator {
    
    private val logger = LoggerFactory.getLogger(StorageHealthIndicator::class.java)
    
    companion object {
        private const val HEALTH_CHECK_BUCKET = "health-check"
        private const val HEALTH_CHECK_OBJECT_PREFIX = "health-check-"
        private const val HEALTH_CHECK_CONTENT = "storage-health-check"
        private const val MAX_RESPONSE_TIME_MS = 5000L
        private const val WARNING_RESPONSE_TIME_MS = 2000L
    }
    
    override fun health(): Health {
        val startTime = Instant.now()
        val healthCheckObjectName = "$HEALTH_CHECK_OBJECT_PREFIX${UUID.randomUUID()}.txt"
        
        return try {
            // Ensure health check bucket exists
            val bucketName = storageProperties.getBucketName(HEALTH_CHECK_BUCKET)
            storageService.createBucketIfNotExists(bucketName)
            
            // Test write operation
            val writeStart = Instant.now()
            val testData = ByteArrayInputStream(HEALTH_CHECK_CONTENT.toByteArray())
            val uploadedObject = storageService.upload(
                bucketName = bucketName,
                objectName = healthCheckObjectName,
                data = testData,
                contentType = "text/plain",
                metadata = mapOf(
                    "health-check" to "true",
                    "timestamp" to Instant.now().toString()
                )
            )
            val writeTime = Duration.between(writeStart, Instant.now()).toMillis()
            
            // Test read operation
            val readStart = Instant.now()
            val downloadedData = storageService.download(bucketName, healthCheckObjectName)
            val content = downloadedData.use { it.readBytes().decodeToString() }
            val readTime = Duration.between(readStart, Instant.now()).toMillis()
            
            // Verify content
            if (content != HEALTH_CHECK_CONTENT) {
                throw IllegalStateException("Health check content mismatch")
            }
            
            // Test delete operation
            val deleteStart = Instant.now()
            val deleted = storageService.delete(bucketName, healthCheckObjectName)
            val deleteTime = Duration.between(deleteStart, Instant.now()).toMillis()
            
            if (!deleted) {
                logger.warn("Failed to delete health check object: $healthCheckObjectName")
            }
            
            // Calculate total response time
            val totalResponseTime = Duration.between(startTime, Instant.now()).toMillis()
            
            // Get storage info
            val storageInfo = try {
                storageService.getStorageInfo()
            } catch (e: Exception) {
                logger.warn("Failed to retrieve storage info", e)
                emptyMap()
            }
            
            // Build health status based on response times
            val healthBuilder = when {
                totalResponseTime > MAX_RESPONSE_TIME_MS -> {
                    Health.down()
                        .withDetail("reason", "Response time exceeded maximum threshold")
                }
                totalResponseTime > WARNING_RESPONSE_TIME_MS -> {
                    Health.status("WARNING")
                        .withDetail("reason", "Response time is slower than expected")
                }
                else -> {
                    Health.up()
                }
            }
            
            healthBuilder
                .withDetail("provider", storageProperties.provider.name)
                .withDetail("endpoint", storageProperties.endpoint)
                .withDetail("responseTime", "${totalResponseTime}ms")
                .withDetail("writeTime", "${writeTime}ms")
                .withDetail("readTime", "${readTime}ms")
                .withDetail("deleteTime", "${deleteTime}ms")
                .withDetail("bucketPrefix", storageProperties.bucketPrefix)
                .withDetail("testObject", healthCheckObjectName)
                .withDetail("timestamp", Instant.now().toString())
                .apply {
                    // Add storage-specific info if available
                    storageInfo.forEach { (key, value) ->
                        withDetail("storage.$key", value.toString())
                    }
                }
                .build()
                
        } catch (e: Exception) {
            logger.error("Storage health check failed", e)
            
            Health.down()
                .withException(e)
                .withDetail("provider", storageProperties.provider.name)
                .withDetail("endpoint", storageProperties.endpoint)
                .withDetail("error", e.message ?: "Unknown error")
                .withDetail("errorType", e.javaClass.simpleName)
                .withDetail("timestamp", Instant.now().toString())
                .build()
        }
    }
    
    /**
     * Cleanup old health check objects periodically.
     * This method can be called by a scheduled task to prevent accumulation
     * of health check objects if deletion fails.
     */
    fun cleanupOldHealthCheckObjects() {
        try {
            val bucketName = storageProperties.getBucketName(HEALTH_CHECK_BUCKET)
            if (!storageService.bucketExists(bucketName)) {
                return
            }
            
            val oldObjects = storageService.list(
                bucketName = bucketName,
                prefix = HEALTH_CHECK_OBJECT_PREFIX,
                pageable = org.springframework.data.domain.PageRequest.of(0, 1000)
            )
            
            val cutoffTime = Instant.now().minus(Duration.ofHours(1))
            val objectsToDelete = oldObjects.content
                .filter { obj ->
                    obj.lastModified.toInstant(ZoneOffset.UTC).isBefore(cutoffTime)
                }
                .map { it.objectName }
            
            if (objectsToDelete.isNotEmpty()) {
                val deleteResults = storageService.deleteMultiple(bucketName, objectsToDelete)
                val failedDeletes = deleteResults.filterValues { !it }.keys
                
                if (failedDeletes.isNotEmpty()) {
                    logger.warn("Failed to delete ${failedDeletes.size} old health check objects")
                } else {
                    logger.info("Successfully cleaned up ${objectsToDelete.size} old health check objects")
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to cleanup old health check objects", e)
        }
    }
}