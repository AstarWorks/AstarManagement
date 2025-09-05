package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for evaluating resource access permissions based on ownership and team membership.
 * 
 * This service is the core component for implementing "own" and "team" scope permissions.
 * It determines whether a user has access to a specific resource based on:
 * - Resource ownership (for "own" scope)
 * - Team membership (for "team" scope)
 * - Resource type-specific strategies
 * 
 * The service uses pluggable strategies for different resource types, allowing
 * flexible implementation of ownership rules for documents, tables, projects, etc.
 * 
 * Key features:
 * - Resource ownership determination
 * - Team membership evaluation
 * - Scope-based access control
 * - Extensible strategy pattern for resource types
 */
@Service
@Transactional(readOnly = true)
class ResourceAccessEvaluator(
    private val resourceOwnershipStrategies: Map<String, ResourceOwnershipStrategy>,
    private val teamMembershipService: TeamMembershipService,
    private val tenantContextService: TenantContextService
) {
    
    private val logger = LoggerFactory.getLogger(ResourceAccessEvaluator::class.java)
    
    /**
     * Gets the owner of a resource.
     * 
     * @param resourceId The resource ID
     * @param resourceType The type of resource
     * @return The owner's user ID, or null if no owner can be determined
     */
    fun getResourceOwner(resourceId: UUID, resourceType: ResourceType): UUID? {
        logger.debug("Getting owner for $resourceType resource: $resourceId")
        
        val strategy = getStrategyForType(resourceType.name.lowercase())
        val owner = strategy.getOwner(resourceId)
        
        logger.debug("Owner of $resourceType $resourceId: ${owner ?: "unknown"}")
        return owner
    }
    
    /**
     * Gets the team associated with a resource.
     * 
     * @param resourceId The resource ID
     * @param resourceType The type of resource
     * @return The team ID, or null if no team is associated
     */
    fun getResourceTeam(resourceId: UUID, resourceType: ResourceType): UUID? {
        logger.debug("Getting team for $resourceType resource: $resourceId")
        
        val strategy = getStrategyForType(resourceType.name.lowercase())
        val team = strategy.getTeam(resourceId)
        
        logger.debug("Team of $resourceType $resourceId: ${team ?: "none"}")
        return team
    }
    
    /**
     * Checks if a user is the owner of a resource.
     * 
     * @param userId The user's tenant user ID
     * @param resourceId The resource ID
     * @param resourceType The type of resource
     * @return true if the user owns the resource, false otherwise
     */
    fun isResourceOwner(userId: UUID, resourceId: UUID, resourceType: ResourceType): Boolean {
        logger.debug("Checking if user $userId owns $resourceType $resourceId")
        
        val owner = getResourceOwner(resourceId, resourceType)
        val isOwner = owner == userId
        
        logger.debug("User $userId ${if (isOwner) "owns" else "does not own"} $resourceType $resourceId")
        return isOwner
    }
    
    /**
     * Checks if a user is in the same team as the resource.
     * 
     * This method checks both:
     * 1. If the resource has an associated team and the user is a member
     * 2. If the resource owner and the user are in the same team
     * 
     * @param userId The user's tenant user ID
     * @param resourceId The resource ID
     * @param resourceType The type of resource
     * @return true if the user has team access to the resource, false otherwise
     */
    fun isInResourceTeam(userId: UUID, resourceId: UUID, resourceType: ResourceType): Boolean {
        logger.debug("Checking team access for user $userId to $resourceType $resourceId")
        
        // First, check if the resource has a direct team association
        val resourceTeam = getResourceTeam(resourceId, resourceType)
        if (resourceTeam != null) {
            val isTeamMember = teamMembershipService.isTeamMember(userId, resourceTeam)
            if (isTeamMember) {
                logger.debug("User $userId is member of resource team $resourceTeam")
                return true
            }
        }
        
        // Second, check if the user and resource owner are in the same team
        val resourceOwner = getResourceOwner(resourceId, resourceType)
        if (resourceOwner != null) {
            val hasTeamAccess = teamMembershipService.hasTeamAccessToUserResource(userId, resourceOwner)
            if (hasTeamAccess) {
                logger.debug("User $userId has team access through shared team with owner $resourceOwner")
                return true
            }
        }
        
        logger.debug("User $userId does not have team access to $resourceType $resourceId")
        return false
    }
    
    /**
     * Evaluates access to a resource based on the required scope.
     * Type-safe implementation using proper enums instead of strings.
     * 
     * @param userId The user's tenant user ID
     * @param resourceId The resource ID
     * @param resourceType The type of resource
     * @param action The action being performed
     * @param scope The scope required for access
     * @return true if access is granted, false otherwise
     */
    fun evaluateAccess(
        userId: UUID,
        resourceId: UUID,
        resourceType: ResourceType,
        action: Action,
        scope: Scope
    ): Boolean {
        logger.debug("Evaluating $scope scope access for user $userId to $resourceType $resourceId for action $action")
        
        val hasAccess = when (scope) {
            Scope.ALL -> {
                logger.debug("Scope ALL - access granted")
                true
            }
            Scope.TEAM -> {
                val teamAccess = isInResourceTeam(userId, resourceId, resourceType)
                logger.debug("Scope TEAM - access ${if (teamAccess) "granted" else "denied"}")
                teamAccess
            }
            Scope.OWN -> {
                val isOwner = isResourceOwner(userId, resourceId, resourceType)
                logger.debug("Scope OWN - access ${if (isOwner) "granted" else "denied"}")
                isOwner
            }
            Scope.RESOURCE_GROUP -> {
                // TODO: Implement resource group membership check
                logger.debug("Scope RESOURCE_GROUP - not yet implemented")
                false
            }
            Scope.RESOURCE_ID -> {
                // Direct resource ID permissions handled elsewhere
                logger.debug("Scope RESOURCE_ID - delegating to permission system")
                false
            }
        }
        
        return hasAccess
    }
    
    /**
     * Checks if a resource exists.
     * 
     * @param resourceId The resource ID
     * @param resourceType The type of resource
     * @return true if the resource exists, false otherwise
     */
    fun resourceExists(resourceId: UUID, resourceType: ResourceType): Boolean {
        logger.debug("Checking existence of $resourceType $resourceId")
        
        val strategy = getStrategyForType(resourceType.name.lowercase())
        val exists = strategy.exists(resourceId)
        
        logger.debug("Resource $resourceType $resourceId ${if (exists) "exists" else "does not exist"}")
        return exists
    }
    
    /**
     * Gets the appropriate strategy for a resource type.
     * Falls back to the default strategy if no specific strategy is found.
     * 
     * @param resourceType The type of resource
     * @return The ownership strategy for the resource type
     */
    private fun getStrategyForType(resourceType: String): ResourceOwnershipStrategy {
        val strategy = resourceOwnershipStrategies[resourceType]
            ?: resourceOwnershipStrategies["default"]
        
        if (strategy == null) {
            logger.error("No ownership strategy found for type '$resourceType' and no default strategy available")
            throw IllegalStateException("No ownership strategy available for resource type: $resourceType")
        }
        
        logger.trace("Using ${strategy.javaClass.simpleName} for resource type: $resourceType")
        return strategy
    }
    
    /**
     * Gets all available resource types that have registered strategies.
     * 
     * @return Set of resource types
     */
    fun getAvailableResourceTypes(): Set<ResourceType> {
        return resourceOwnershipStrategies.keys
            .mapNotNull { key ->
                try {
                    ResourceType.valueOf(key.uppercase())
                } catch (e: Exception) {
                    null
                }
            }
            .toSet()
    }
}