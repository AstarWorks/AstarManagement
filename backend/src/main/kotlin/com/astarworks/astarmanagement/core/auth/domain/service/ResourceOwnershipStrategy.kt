package com.astarworks.astarmanagement.core.auth.domain.service

import java.util.UUID

/**
 * Strategy interface for determining resource ownership and team membership.
 * 
 * Different resource types (documents, tables, etc.) may have different ways
 * of determining ownership and team association. This interface allows for
 * flexible implementation of resource-specific logic.
 * 
 * Implementations should be registered as Spring beans and will be automatically
 * discovered and mapped by resource type.
 * 
 * Example implementations:
 * - DocumentOwnershipStrategy: For document resources
 * - TableOwnershipStrategy: For table resources
 * - DefaultOwnershipStrategy: Fallback for unknown resource types
 */
interface ResourceOwnershipStrategy {
    
    /**
     * Gets the owner ID of a resource.
     * 
     * @param resourceId The UUID of the resource
     * @return The UUID of the owner, or null if no owner can be determined
     */
    fun getOwner(resourceId: UUID): UUID?
    
    /**
     * Gets the team ID associated with a resource.
     * 
     * @param resourceId The UUID of the resource
     * @return The UUID of the team, or null if no team association exists
     */
    fun getTeam(resourceId: UUID): UUID?
    
    /**
     * Gets the resource type this strategy handles.
     * 
     * This value is used to map strategies to resource types.
     * For example: "document", "table", "project", etc.
     * 
     * @return The resource type identifier
     */
    fun getResourceType(): String
    
    /**
     * Checks if a resource exists.
     * 
     * This can be used to validate resource IDs before performing
     * ownership checks.
     * 
     * @param resourceId The UUID of the resource
     * @return true if the resource exists, false otherwise
     */
    fun exists(resourceId: UUID): Boolean = true
}