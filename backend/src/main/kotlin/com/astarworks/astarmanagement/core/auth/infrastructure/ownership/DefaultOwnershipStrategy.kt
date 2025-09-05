package com.astarworks.astarmanagement.core.auth.infrastructure.ownership

import com.astarworks.astarmanagement.core.auth.domain.service.ResourceOwnershipStrategy
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Default implementation of ResourceOwnershipStrategy.
 * 
 * This strategy is used as a fallback when no specific strategy is registered
 * for a resource type. It provides safe defaults that deny access when
 * ownership cannot be determined.
 * 
 * Behavior:
 * - Always returns null for owner (unknown owner)
 * - Always returns null for team (no team association)
 * - Always returns true for existence (assumes resource exists)
 * 
 * This ensures that resources without specific ownership strategies
 * default to the most restrictive access control.
 */
@Component
class DefaultOwnershipStrategy : ResourceOwnershipStrategy {
    
    private val logger = LoggerFactory.getLogger(DefaultOwnershipStrategy::class.java)
    
    /**
     * Returns null as the owner cannot be determined for unknown resource types.
     * 
     * @param resourceId The resource ID
     * @return Always null (owner unknown)
     */
    override fun getOwner(resourceId: UUID): UUID? {
        logger.debug("Default strategy: No owner information for resource $resourceId")
        return null
    }
    
    /**
     * Returns null as team association cannot be determined for unknown resource types.
     * 
     * @param resourceId The resource ID
     * @return Always null (no team association)
     */
    override fun getTeam(resourceId: UUID): UUID? {
        logger.debug("Default strategy: No team information for resource $resourceId")
        return null
    }
    
    /**
     * Returns "default" as the resource type identifier.
     * 
     * @return The string "default"
     */
    override fun getResourceType(): String = "default"
    
    /**
     * Assumes the resource exists since we cannot verify it.
     * 
     * @param resourceId The resource ID
     * @return Always true
     */
    override fun exists(resourceId: UUID): Boolean {
        logger.debug("Default strategy: Assuming resource $resourceId exists")
        return true
    }
}