package com.astarworks.astarmanagement.expense.domain.repository

import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
import java.util.UUID

/**
 * Repository interface for managing Tag entities following DDD patterns.
 * 
 * All methods include tenant isolation to ensure data segregation.
 * This is a domain interface that should be implemented by infrastructure layer.
 */
interface TagRepository {
    
    /**
     * Saves a tag entity.
     * 
     * @param tag The tag to save
     * @return The saved tag
     */
    fun save(tag: Tag): Tag
    
    /**
     * Finds a tag by its ID.
     * 
     * @param id The tag ID
     * @return The tag if found, null otherwise
     */
    fun findById(id: UUID): Tag?
    
    /**
     * Finds a tag by ID with tenant isolation.
     * 
     * @param id The tag ID
     * @param tenantId The tenant ID for isolation
     * @return The tag if found and belongs to tenant, null otherwise
     */
    fun findByIdAndTenantId(id: UUID, tenantId: UUID): Tag?
    
    /**
     * Finds all tags for a tenant.
     * 
     * @param tenantId The tenant ID
     * @return List of tags for the tenant
     */
    fun findByTenantId(tenantId: UUID): List<Tag>
    
    /**
     * Finds tags by tenant and scope.
     * 
     * @param tenantId The tenant ID
     * @param scope The tag scope (TENANT or PERSONAL)
     * @return List of tags matching the criteria
     */
    fun findByTenantIdAndScope(
        tenantId: UUID,
        scope: TagScope
    ): List<Tag>
    
    /**
     * Finds a tag by its normalized name for duplicate checking.
     * 
     * @param tenantId The tenant ID
     * @param nameNormalized The normalized tag name
     * @return The tag if found, null otherwise
     */
    fun findByNameNormalized(
        tenantId: UUID,
        nameNormalized: String
    ): Tag?
    
    /**
     * Finds the most frequently used tags for a tenant.
     * 
     * @param tenantId The tenant ID
     * @param limit Maximum number of tags to return
     * @return List of most used tags ordered by usage count
     */
    fun findMostUsed(
        tenantId: UUID,
        limit: Int
    ): List<Tag>
    
    /**
     * Deletes a tag (soft delete).
     * 
     * @param tag The tag to delete
     */
    fun delete(tag: Tag)
}