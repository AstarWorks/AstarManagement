package com.astarworks.astarmanagement.core.auth.infrastructure.config

import com.github.benmanes.caffeine.cache.Caffeine
import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.caffeine.CaffeineCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import java.util.concurrent.TimeUnit

/**
 * Cache configuration for permission and authorization system.
 * 
 * Uses Caffeine as the caching provider for high-performance, in-memory caching.
 * Defines multiple cache regions with different TTL and size configurations
 * optimized for different types of authorization data.
 * 
 * Cache regions:
 * - userPermissions: User permission sets (short TTL, high access)
 * - userRoles: User role assignments (short TTL, high access)
 * - rolePermissions: Role-to-permission mappings (medium TTL, moderate access)
 * - resourceOwnership: Resource ownership data (short TTL, moderate access)
 * - teamMembership: Team membership data (medium TTL, low access)
 * 
 * Features:
 * - Automatic expiration based on TTL
 * - Size-based eviction to prevent memory issues
 * - Statistics recording for monitoring
 * - Weak value references for GC optimization
 */
@Configuration
@EnableCaching
class PermissionCacheConfig {
    
    private val logger = LoggerFactory.getLogger(PermissionCacheConfig::class.java)
    
    /**
     * Primary cache manager for the authorization system.
     * Configures multiple cache regions with specific settings.
     */
    @Bean
    @Primary
    fun permissionCacheManager(): CacheManager {
        logger.info("Initializing permission cache manager with Caffeine")
        
        val cacheManager = CaffeineCacheManager()
        
        // Configure cache regions with specific settings
        configureCacheRegions(cacheManager)
        
        // Set default cache configuration for any undefined caches
        cacheManager.setCaffeine(defaultCacheBuilder())
        
        logger.info("Permission cache manager initialized with regions: ${getCacheNames()}")
        
        return cacheManager
    }
    
    /**
     * Configures specific cache regions with optimized settings.
     */
    private fun configureCacheRegions(cacheManager: CaffeineCacheManager) {
        // User permissions cache - high frequency access, short TTL
        cacheManager.registerCustomCache(
            "userPermissions",
            Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .expireAfterAccess(2, TimeUnit.MINUTES)
                .recordStats()
                .build()
        )
        
        // User roles cache - high frequency access, short TTL
        cacheManager.registerCustomCache(
            "userRoles",
            Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .expireAfterAccess(2, TimeUnit.MINUTES)
                .recordStats()
                .build()
        )
        
        // Role permissions cache - moderate access, medium TTL
        cacheManager.registerCustomCache(
            "rolePermissions",
            Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .expireAfterAccess(5, TimeUnit.MINUTES)
                .recordStats()
                .build()
        )
        
        // Resource ownership cache - moderate access, short TTL
        cacheManager.registerCustomCache(
            "resourceOwnership",
            Caffeine.newBuilder()
                .maximumSize(2000)
                .expireAfterWrite(3, TimeUnit.MINUTES)
                .expireAfterAccess(1, TimeUnit.MINUTES)
                .weakValues() // Allow GC of values under memory pressure
                .recordStats()
                .build()
        )
        
        // Team membership cache - low access, medium TTL
        cacheManager.registerCustomCache(
            "teamMembership",
            Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .expireAfterAccess(5, TimeUnit.MINUTES)
                .recordStats()
                .build()
        )
        
        // Dynamic role cache - moderate access, medium TTL
        cacheManager.registerCustomCache(
            "dynamicRoles",
            Caffeine.newBuilder()
                .maximumSize(300)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .expireAfterAccess(5, TimeUnit.MINUTES)
                .recordStats()
                .build()
        )
    }
    
    /**
     * Default cache configuration for undefined cache names.
     */
    private fun defaultCacheBuilder(): Caffeine<Any, Any> {
        return Caffeine.newBuilder()
            .maximumSize(100)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .recordStats()
    }
    
    /**
     * Returns the list of configured cache region names.
     */
    private fun getCacheNames(): List<String> {
        return listOf(
            "userPermissions",
            "userRoles",
            "rolePermissions",
            "resourceOwnership",
            "teamMembership",
            "dynamicRoles"
        )
    }
    
    /**
     * Bean for accessing Caffeine cache statistics.
     * Used by monitoring and metrics services.
     */
    @Bean
    fun cacheStatisticsProvider(cacheManager: CacheManager): CacheStatisticsProvider {
        logger.debug("Creating cache statistics provider")
        return CacheStatisticsProvider(cacheManager)
    }
}

/**
 * Provider for accessing cache statistics.
 * Wraps the CacheManager to provide easy access to Caffeine statistics.
 */
class CacheStatisticsProvider(
    private val cacheManager: CacheManager
) {
    private val logger = LoggerFactory.getLogger(CacheStatisticsProvider::class.java)
    
    /**
     * Gets statistics for a specific cache.
     */
    fun getStatistics(cacheName: String): CacheStatistics? {
        val cache = cacheManager.getCache(cacheName)
        if (cache == null) {
            logger.warn("Cache not found: $cacheName")
            return null
        }
        
        val nativeCache = cache.nativeCache
        if (nativeCache is com.github.benmanes.caffeine.cache.Cache<*, *>) {
            val stats = nativeCache.stats()
            return CacheStatistics(
                cacheName = cacheName,
                hitCount = stats.hitCount(),
                missCount = stats.missCount(),
                loadSuccessCount = stats.loadSuccessCount(),
                loadFailureCount = stats.loadFailureCount(),
                totalLoadTime = stats.totalLoadTime(),
                evictionCount = stats.evictionCount(),
                evictionWeight = stats.evictionWeight()
            )
        }
        
        logger.warn("Cache $cacheName is not a Caffeine cache")
        return null
    }
    
    /**
     * Gets statistics for all caches.
     */
    fun getAllStatistics(): Map<String, CacheStatistics> {
        return cacheManager.cacheNames
            .mapNotNull { cacheName ->
                getStatistics(cacheName)?.let { cacheName to it }
            }
            .toMap()
    }
}

/**
 * Data class representing cache statistics.
 */
data class CacheStatistics(
    val cacheName: String,
    val hitCount: Long,
    val missCount: Long,
    val loadSuccessCount: Long,
    val loadFailureCount: Long,
    val totalLoadTime: Long,
    val evictionCount: Long,
    val evictionWeight: Long
) {
    val hitRate: Double
        get() = if (hitCount + missCount > 0) {
            hitCount.toDouble() / (hitCount + missCount)
        } else {
            0.0
        }
    
    val missRate: Double
        get() = 1.0 - hitRate
    
    val requestCount: Long
        get() = hitCount + missCount
    
    val averageLoadPenalty: Double
        get() = if (loadSuccessCount > 0) {
            totalLoadTime.toDouble() / loadSuccessCount
        } else {
            0.0
        }
}