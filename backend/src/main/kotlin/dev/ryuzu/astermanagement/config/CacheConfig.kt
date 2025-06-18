package dev.ryuzu.astermanagement.config

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.cache.RedisCacheManager
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializationContext
import org.springframework.data.redis.serializer.StringRedisSerializer
import java.time.Duration

/**
 * Redis cache configuration for performance optimization.
 * Configures cache managers, serializers, and TTL policies.
 */
@Configuration
@EnableCaching
class CacheConfig {
    
    companion object {
        private val logger = LoggerFactory.getLogger(CacheConfig::class.java)
        
        // Cache names with different TTL policies
        const val MATTERS_CACHE = "matters"
        const val MATTER_DETAILS_CACHE = "matter-details"
        const val STATUS_TRANSITIONS_CACHE = "status-transitions"
        const val ROLE_CAPABILITIES_CACHE = "role-capabilities"
        const val TRANSITION_MATRIX_CACHE = "transition-matrix"
        const val STATUS_RULES_CACHE = "status-rules"
        const val USER_PERMISSIONS_CACHE = "user-permissions"
        const val SEARCH_RESULTS_CACHE = "search-results"
    }

    /**
     * Custom ObjectMapper for Redis serialization with proper type handling
     */
    @Bean("cacheObjectMapper")
    fun cacheObjectMapper(): ObjectMapper {
        return ObjectMapper().apply {
            registerKotlinModule()
            registerModule(JavaTimeModule())
            
            // Enable type information for polymorphic objects
            activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
            )
            
            logger.info("Cache ObjectMapper configured with Kotlin and JavaTime support")
        }
    }

    /**
     * Redis template for manual cache operations
     */
    @Bean
    fun redisTemplate(
        connectionFactory: RedisConnectionFactory,
        cacheObjectMapper: ObjectMapper
    ): RedisTemplate<String, Any> {
        return RedisTemplate<String, Any>().apply {
            this.connectionFactory = connectionFactory
            
            // Use String serializer for keys
            keySerializer = StringRedisSerializer()
            hashKeySerializer = StringRedisSerializer()
            
            // Use JSON serializer for values
            val jsonSerializer = GenericJackson2JsonRedisSerializer(cacheObjectMapper)
            valueSerializer = jsonSerializer
            hashValueSerializer = jsonSerializer
            
            afterPropertiesSet()
            logger.info("RedisTemplate configured with JSON serialization")
        }
    }

    /**
     * Cache manager with custom configurations for different cache types
     */
    @Bean
    fun cacheManager(
        connectionFactory: RedisConnectionFactory,
        cacheObjectMapper: ObjectMapper
    ): CacheManager {
        val jsonSerializer = GenericJackson2JsonRedisSerializer(cacheObjectMapper)
        
        // Default cache configuration
        val defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer))
            .disableCachingNullValues()
        
        // Cache-specific configurations with different TTLs
        val cacheConfigurations = mapOf(
            // Short-term caches (5 minutes) - for frequently changing data
            MATTERS_CACHE to defaultConfig.entryTtl(Duration.ofMinutes(5)),
            SEARCH_RESULTS_CACHE to defaultConfig.entryTtl(Duration.ofMinutes(5)),
            
            // Medium-term caches (10 minutes) - for matter details
            MATTER_DETAILS_CACHE to defaultConfig.entryTtl(Duration.ofMinutes(10)),
            
            // Long-term caches (30 minutes) - for relatively stable configuration data
            STATUS_TRANSITIONS_CACHE to defaultConfig.entryTtl(Duration.ofMinutes(30)),
            ROLE_CAPABILITIES_CACHE to defaultConfig.entryTtl(Duration.ofMinutes(30)),
            STATUS_RULES_CACHE to defaultConfig.entryTtl(Duration.ofMinutes(30)),
            USER_PERMISSIONS_CACHE to defaultConfig.entryTtl(Duration.ofMinutes(30)),
            
            // Very long-term caches (2 hours) - for rarely changing reference data
            TRANSITION_MATRIX_CACHE to defaultConfig.entryTtl(Duration.ofHours(2))
        )
        
        logger.info("Configured {} cache regions with Redis backend", cacheConfigurations.size)
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build()
    }
    
    /**
     * Cache warming configuration - warms up critical caches on startup
     */
    @Bean
    fun cacheWarmer(
        redisTemplate: RedisTemplate<String, Any>
    ): CacheWarmer {
        return CacheWarmer(redisTemplate)
    }
}

/**
 * Utility class for cache warming operations
 */
class CacheWarmer(
    private val redisTemplate: RedisTemplate<String, Any>
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(CacheWarmer::class.java)
    }
    
    /**
     * Pre-populate critical caches on application startup
     */
    fun warmUpCriticalCaches() {
        logger.info("Starting cache warm-up process...")
        
        try {
            // Test Redis connectivity
            redisTemplate.execute { connection ->
                connection.ping()
                logger.info("Redis connectivity test: PONG")
                true
            }
            
            logger.info("Cache warm-up completed successfully")
        } catch (exception: Exception) {
            logger.warn("Cache warm-up failed, continuing without cached data", exception)
        }
    }
    
    /**
     * Clear all application caches
     */
    fun clearAllCaches() {
        logger.info("Clearing all application caches...")
        
        try {
            redisTemplate.execute { connection ->
                connection.flushDb()
                logger.info("All caches cleared successfully")
                true
            }
        } catch (exception: Exception) {
            logger.error("Failed to clear caches", exception)
        }
    }
}