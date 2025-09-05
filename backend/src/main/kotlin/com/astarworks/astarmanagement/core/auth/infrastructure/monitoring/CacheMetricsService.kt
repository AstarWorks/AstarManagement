package com.astarworks.astarmanagement.core.auth.infrastructure.monitoring

import com.astarworks.astarmanagement.core.auth.infrastructure.config.CacheStatisticsProvider
import org.slf4j.LoggerFactory
import org.springframework.boot.actuate.endpoint.annotation.Endpoint
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation
import org.springframework.cache.CacheManager
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

/**
 * Service for monitoring cache performance and metrics.
 * 
 * Provides comprehensive cache statistics and monitoring capabilities
 * for the permission caching system. Integrates with Spring Boot Actuator
 * for health monitoring and metrics exposure.
 * 
 * Features:
 * - Real-time cache statistics
 * - Hit/miss rate calculation
 * - Cache size monitoring
 * - Performance metrics
 * - Actuator endpoint integration
 * - Alerting thresholds
 */
@Service
@Endpoint(id = "permission-cache")
class CacheMetricsService(
    private val cacheManager: CacheManager,
    private val cacheStatisticsProvider: CacheStatisticsProvider
) {
    
    private val logger = LoggerFactory.getLogger(CacheMetricsService::class.java)
    
    /**
     * Gets comprehensive statistics for all permission caches.
     * This is exposed as an Actuator endpoint at /actuator/permission-cache
     * 
     * @return Map of cache names to their statistics
     */
    @ReadOperation
    fun getCacheStatistics(): CacheMetricsReport {
        logger.debug("Generating cache metrics report")
        
        val cacheMetrics = mutableMapOf<String, CacheMetrics>()
        val overallMetrics = OverallCacheMetrics()
        
        cacheManager.cacheNames.forEach { cacheName ->
            val cache = cacheManager.getCache(cacheName)
            if (cache != null) {
                val stats = cacheStatisticsProvider.getStatistics(cacheName)
                if (stats != null) {
                    val metrics = CacheMetrics(
                        name = cacheName,
                        hitCount = stats.hitCount,
                        missCount = stats.missCount,
                        hitRate = stats.hitRate,
                        missRate = stats.missRate,
                        requestCount = stats.requestCount,
                        evictionCount = stats.evictionCount,
                        averageLoadTime = stats.averageLoadPenalty,
                        size = estimateCacheSize(cache)
                    )
                    
                    cacheMetrics[cacheName] = metrics
                    
                    // Update overall metrics
                    overallMetrics.totalHits += stats.hitCount
                    overallMetrics.totalMisses += stats.missCount
                    overallMetrics.totalEvictions += stats.evictionCount
                    overallMetrics.totalRequests += stats.requestCount
                }
            }
        }
        
        // Calculate overall hit rate
        if (overallMetrics.totalRequests > 0) {
            overallMetrics.overallHitRate = 
                overallMetrics.totalHits.toDouble() / overallMetrics.totalRequests
        }
        
        return CacheMetricsReport(
            timestamp = LocalDateTime.now(),
            caches = cacheMetrics,
            overall = overallMetrics,
            health = evaluateCacheHealth(overallMetrics)
        )
    }
    
    /**
     * Gets statistics for a specific cache.
     * 
     * @param cacheName The name of the cache
     * @return Cache metrics or null if cache not found
     */
    fun getCacheStatistics(cacheName: String): CacheMetrics? {
        logger.debug("Getting statistics for cache: $cacheName")
        
        val cache = cacheManager.getCache(cacheName)
        if (cache == null) {
            logger.warn("Cache not found: $cacheName")
            return null
        }
        
        val stats = cacheStatisticsProvider.getStatistics(cacheName)
        if (stats == null) {
            logger.warn("No statistics available for cache: $cacheName")
            return null
        }
        
        return CacheMetrics(
            name = cacheName,
            hitCount = stats.hitCount,
            missCount = stats.missCount,
            hitRate = stats.hitRate,
            missRate = stats.missRate,
            requestCount = stats.requestCount,
            evictionCount = stats.evictionCount,
            averageLoadTime = stats.averageLoadPenalty,
            size = estimateCacheSize(cache)
        )
    }
    
    /**
     * Gets the hit rate for a specific cache.
     * 
     * @param cacheName The name of the cache
     * @return Hit rate (0.0 to 1.0) or null if cache not found
     */
    fun getCacheHitRate(cacheName: String): Double? {
        val stats = cacheStatisticsProvider.getStatistics(cacheName)
        return stats?.hitRate
    }
    
    /**
     * Gets the size of a specific cache.
     * 
     * @param cacheName The name of the cache
     * @return Estimated number of entries in the cache
     */
    fun getCacheSize(cacheName: String): Long? {
        val cache = cacheManager.getCache(cacheName) ?: return null
        return estimateCacheSize(cache)
    }
    
    /**
     * Checks if cache performance meets defined thresholds.
     * 
     * @return Health status with any warnings or alerts
     */
    fun checkCacheHealth(): CacheHealthStatus {
        val overallMetrics = calculateOverallMetrics()
        return evaluateCacheHealth(overallMetrics)
    }
    
    /**
     * Gets cache performance recommendations based on current metrics.
     * 
     * @return List of recommendations for improving cache performance
     */
    fun getPerformanceRecommendations(): List<String> {
        val recommendations = mutableListOf<String>()
        val metrics = getCacheStatistics()
        
        // Check overall hit rate
        if (metrics.overall.overallHitRate < 0.7) {
            recommendations.add(
                "Overall cache hit rate is below 70%. Consider increasing cache sizes or TTL values."
            )
        }
        
        // Check individual cache performance
        metrics.caches.forEach { (name, cacheMetrics) ->
            if (cacheMetrics.hitRate < 0.5) {
                recommendations.add(
                    "Cache '$name' has low hit rate (${(cacheMetrics.hitRate * 100).toInt()}%). " +
                    "Consider reviewing access patterns or increasing cache size."
                )
            }
            
            if (cacheMetrics.evictionCount > cacheMetrics.requestCount * 0.1) {
                recommendations.add(
                    "Cache '$name' has high eviction rate. Consider increasing maximum size."
                )
            }
            
            if (cacheMetrics.averageLoadTime > 100) { // milliseconds
                recommendations.add(
                    "Cache '$name' has high average load time (${cacheMetrics.averageLoadTime}ms). " +
                    "Consider optimizing data fetching logic."
                )
            }
        }
        
        return recommendations
    }
    
    /**
     * Resets statistics for all caches.
     * Note: This clears statistics but not the cache contents.
     */
    fun resetStatistics() {
        logger.info("Resetting cache statistics")
        
        // Caffeine caches don't directly support resetting statistics
        // This would typically require recreating the caches
        logger.warn("Statistics reset not fully supported by Caffeine. Consider cache restart.")
    }
    
    // === Private Helper Methods ===
    
    /**
     * Estimates the size of a cache.
     */
    private fun estimateCacheSize(cache: org.springframework.cache.Cache): Long {
        val nativeCache = cache.nativeCache
        if (nativeCache is com.github.benmanes.caffeine.cache.Cache<*, *>) {
            return nativeCache.estimatedSize()
        }
        return -1L // Unknown
    }
    
    /**
     * Calculates overall metrics across all caches.
     */
    private fun calculateOverallMetrics(): OverallCacheMetrics {
        val overall = OverallCacheMetrics()
        
        cacheManager.cacheNames.forEach { cacheName ->
            val stats = cacheStatisticsProvider.getStatistics(cacheName)
            if (stats != null) {
                overall.totalHits += stats.hitCount
                overall.totalMisses += stats.missCount
                overall.totalEvictions += stats.evictionCount
                overall.totalRequests += stats.requestCount
            }
        }
        
        if (overall.totalRequests > 0) {
            overall.overallHitRate = overall.totalHits.toDouble() / overall.totalRequests
        }
        
        return overall
    }
    
    /**
     * Evaluates cache health based on metrics.
     */
    private fun evaluateCacheHealth(metrics: OverallCacheMetrics): CacheHealthStatus {
        val warnings = mutableListOf<String>()
        val alerts = mutableListOf<String>()
        
        // Check hit rate
        when {
            metrics.overallHitRate < 0.5 -> {
                alerts.add("Critical: Cache hit rate below 50%")
            }
            metrics.overallHitRate < 0.7 -> {
                warnings.add("Warning: Cache hit rate below 70%")
            }
        }
        
        // Check eviction rate
        if (metrics.totalRequests > 0) {
            val evictionRate = metrics.totalEvictions.toDouble() / metrics.totalRequests
            if (evictionRate > 0.2) {
                warnings.add("High eviction rate detected (${(evictionRate * 100).toInt()}%)")
            }
        }
        
        val status = when {
            alerts.isNotEmpty() -> "DEGRADED"
            warnings.isNotEmpty() -> "WARNING"
            else -> "HEALTHY"
        }
        
        return CacheHealthStatus(
            status = status,
            warnings = warnings,
            alerts = alerts,
            timestamp = Instant.now()
        )
    }
}

/**
 * Complete cache metrics report.
 */
data class CacheMetricsReport(
    val timestamp: LocalDateTime,
    val caches: Map<String, CacheMetrics>,
    val overall: OverallCacheMetrics,
    val health: CacheHealthStatus
)

/**
 * Metrics for an individual cache.
 */
data class CacheMetrics(
    val name: String,
    val hitCount: Long,
    val missCount: Long,
    val hitRate: Double,
    val missRate: Double,
    val requestCount: Long,
    val evictionCount: Long,
    val averageLoadTime: Double,
    val size: Long
)

/**
 * Overall metrics across all caches.
 */
data class OverallCacheMetrics(
    var totalHits: Long = 0,
    var totalMisses: Long = 0,
    var totalEvictions: Long = 0,
    var totalRequests: Long = 0,
    var overallHitRate: Double = 0.0
)

/**
 * Cache health status.
 */
data class CacheHealthStatus(
    val status: String,
    val warnings: List<String>,
    val alerts: List<String>,
    val timestamp: Instant
)