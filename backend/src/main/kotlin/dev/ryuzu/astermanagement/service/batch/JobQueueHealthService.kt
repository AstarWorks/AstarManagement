package dev.ryuzu.astermanagement.service.batch

import dev.ryuzu.astermanagement.config.DocumentProcessingProperties
import dev.ryuzu.astermanagement.domain.batch.JobQueueStats
import org.slf4j.LoggerFactory
import org.springframework.boot.actuator.health.Health
import org.springframework.boot.actuator.health.HealthIndicator
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Instant

/**
 * Health check and monitoring service for job queue infrastructure
 * Provides health indicators and automatic queue monitoring
 */
@Service
class JobQueueHealthService(
    private val redisJobQueueService: RedisJobQueueService,
    private val documentProcessingProperties: DocumentProcessingProperties
) : HealthIndicator {
    
    companion object {
        private val logger = LoggerFactory.getLogger(JobQueueHealthService::class.java)
    }
    
    @Volatile
    private var lastHealthCheck: Health = Health.unknown().build()
    
    @Volatile
    private var lastStats: JobQueueStats? = null
    
    /**
     * Health check implementation for Spring Boot Actuator
     */
    override fun health(): Health {
        return try {
            val stats = redisJobQueueService.getQueueStats()
            lastStats = stats
            
            val healthBuilder = Health.up()
                .withDetail("totalQueued", stats.totalQueued)
                .withDetail("highPriorityQueued", stats.highPriorityQueued)
                .withDetail("normalPriorityQueued", stats.normalPriorityQueued)
                .withDetail("activeJobs", stats.activeJobs)
                .withDetail("completedJobs", stats.completedJobs)
                .withDetail("failedJobs", stats.failedJobs)
                .withDetail("averageProcessingTimeMs", stats.averageProcessingTimeMs)
                .withDetail("timestamp", stats.timestamp)
            
            // Check for warning conditions
            val warnings = mutableListOf<String>()
            
            // Check queue capacity
            val totalQueued = stats.totalQueued
            val maxCapacity = documentProcessingProperties.queue.highPriorityMaxSize + 
                             documentProcessingProperties.queue.normalPriorityMaxSize
            val utilizationPercent = (totalQueued.toDouble() / maxCapacity) * 100
            
            if (utilizationPercent > 80) {
                warnings.add("Queue utilization is high: ${utilizationPercent.toInt()}%")
            }
            
            // Check active jobs vs pool size
            if (stats.activeJobs > documentProcessingProperties.concurrency.maxPoolSize) {
                warnings.add("Active jobs exceed max pool size")
            }
            
            // Check failure rate
            val totalJobs = stats.completedJobs + stats.failedJobs
            if (totalJobs > 0) {
                val failureRate = (stats.failedJobs.toDouble() / totalJobs) * 100
                if (failureRate > 10) {
                    warnings.add("High failure rate: ${failureRate.toInt()}%")
                }
            }
            
            // Add warnings to health details
            if (warnings.isNotEmpty()) {
                healthBuilder.withDetail("warnings", warnings)
                if (warnings.any { it.contains("exceed") || utilizationPercent > 90 }) {
                    healthBuilder.status("WARN")
                }
            }
            
            val health = healthBuilder.build()
            lastHealthCheck = health
            health
            
        } catch (exception: Exception) {
            logger.error("Health check failed", exception)
            val health = Health.down()
                .withDetail("error", exception.message ?: "Unknown error")
                .withDetail("timestamp", Instant.now())
                .build()
            lastHealthCheck = health
            health
        }
    }
    
    /**
     * Get detailed queue statistics
     */
    fun getDetailedStats(): Map<String, Any> {
        val stats = lastStats ?: redisJobQueueService.getQueueStats()
        
        return mapOf(
            "queue" to mapOf(
                "totalQueued" to stats.totalQueued,
                "highPriorityQueued" to stats.highPriorityQueued,
                "normalPriorityQueued" to stats.normalPriorityQueued,
                "activeJobs" to stats.activeJobs
            ),
            "performance" to mapOf(
                "completedJobs" to stats.completedJobs,
                "failedJobs" to stats.failedJobs,
                "averageProcessingTimeMs" to stats.averageProcessingTimeMs,
                "successRate" to calculateSuccessRate(stats)
            ),
            "capacity" to mapOf(
                "maxPoolSize" to documentProcessingProperties.concurrency.maxPoolSize,
                "corePoolSize" to documentProcessingProperties.concurrency.corePoolSize,
                "queueCapacity" to documentProcessingProperties.concurrency.queueCapacity,
                "maxHighPriorityQueue" to documentProcessingProperties.queue.highPriorityMaxSize,
                "maxNormalPriorityQueue" to documentProcessingProperties.queue.normalPriorityMaxSize
            ),
            "timestamp" to stats.timestamp
        )
    }
    
    /**
     * Check if the job queue is healthy
     */
    fun isHealthy(): Boolean {
        return lastHealthCheck.status.code == "UP"
    }
    
    /**
     * Get current queue utilization percentage
     */
    fun getQueueUtilization(): Double {
        val stats = lastStats ?: redisJobQueueService.getQueueStats()
        val maxCapacity = documentProcessingProperties.queue.highPriorityMaxSize + 
                         documentProcessingProperties.queue.normalPriorityMaxSize
        return (stats.totalQueued.toDouble() / maxCapacity) * 100
    }
    
    /**
     * Get current success rate percentage
     */
    fun getSuccessRate(): Double {
        val stats = lastStats ?: redisJobQueueService.getQueueStats()
        return calculateSuccessRate(stats)
    }
    
    /**
     * Scheduled health monitoring
     */
    @Scheduled(fixedDelay = 30000) // Every 30 seconds
    fun performScheduledHealthCheck() {
        try {
            health() // This updates lastHealthCheck and lastStats
            
            val stats = lastStats
            if (stats != null) {
                val utilizationPercent = getQueueUtilization()
                
                // Log warnings for high utilization
                if (utilizationPercent > 90) {
                    logger.warn("Job queue utilization is critical: {}% (total: {}, max: {})", 
                        utilizationPercent.toInt(), 
                        stats.totalQueued,
                        documentProcessingProperties.queue.highPriorityMaxSize + documentProcessingProperties.queue.normalPriorityMaxSize)
                } else if (utilizationPercent > 80) {
                    logger.warn("Job queue utilization is high: {}%", utilizationPercent.toInt())
                }
                
                // Log performance metrics periodically
                if (stats.completedJobs > 0 && stats.completedJobs % 100 == 0L) {
                    logger.info("Job processing metrics: completed={}, failed={}, success rate={}%, avg processing time={}ms",
                        stats.completedJobs,
                        stats.failedJobs,
                        getSuccessRate().toInt(),
                        stats.averageProcessingTimeMs.toInt())
                }
            }
            
        } catch (exception: Exception) {
            logger.error("Scheduled health check failed", exception)
        }
    }
    
    /**
     * Scheduled cleanup of expired jobs
     */
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    fun performScheduledCleanup() {
        try {
            val cleanedCount = redisJobQueueService.cleanupExpiredJobs()
            if (cleanedCount > 0) {
                logger.info("Cleaned up {} expired jobs", cleanedCount)
            }
        } catch (exception: Exception) {
            logger.error("Scheduled cleanup failed", exception)
        }
    }
    
    private fun calculateSuccessRate(stats: JobQueueStats): Double {
        val totalJobs = stats.completedJobs + stats.failedJobs
        return if (totalJobs > 0) {
            (stats.completedJobs.toDouble() / totalJobs) * 100
        } else {
            100.0
        }
    }
}