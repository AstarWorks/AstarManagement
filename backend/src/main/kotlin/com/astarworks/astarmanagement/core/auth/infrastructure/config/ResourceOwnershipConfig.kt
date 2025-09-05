package com.astarworks.astarmanagement.core.auth.infrastructure.config

import com.astarworks.astarmanagement.core.auth.domain.service.ResourceOwnershipStrategy
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Configuration for resource ownership strategies.
 * 
 * This configuration automatically discovers all ResourceOwnershipStrategy
 * implementations and creates a map indexed by resource type for efficient lookup.
 * 
 * The map allows the ResourceAccessEvaluator to quickly find the appropriate
 * strategy for a given resource type.
 * 
 * Registered strategies:
 * - "document" -> DocumentOwnershipStrategy
 * - "table" -> TableOwnershipStrategy
 * - "default" -> DefaultOwnershipStrategy
 * - (additional strategies are automatically discovered)
 */
@Configuration
class ResourceOwnershipConfig {
    
    private val logger = LoggerFactory.getLogger(ResourceOwnershipConfig::class.java)
    
    /**
     * Creates a map of resource ownership strategies indexed by resource type.
     * 
     * Spring automatically injects all beans implementing ResourceOwnershipStrategy,
     * and this method organizes them into a map for efficient lookup.
     * 
     * @param strategies List of all ResourceOwnershipStrategy beans
     * @return Map with resource type as key and strategy as value
     */
    @Bean
    fun resourceOwnershipStrategies(
        strategies: List<ResourceOwnershipStrategy>
    ): Map<String, ResourceOwnershipStrategy> {
        logger.info("Configuring resource ownership strategies")
        
        val strategyMap = strategies.associateBy { strategy ->
            val resourceType = strategy.getResourceType()
            logger.debug("Registering ownership strategy for resource type: $resourceType")
            resourceType
        }
        
        logger.info("Registered ${strategyMap.size} resource ownership strategies: ${strategyMap.keys}")
        
        // Ensure we have a default strategy
        if (!strategyMap.containsKey("default")) {
            logger.warn("No default ownership strategy found - access control may be overly restrictive")
        }
        
        return strategyMap
    }
}