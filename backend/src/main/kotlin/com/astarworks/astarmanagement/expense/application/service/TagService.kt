package com.astarworks.astarmanagement.expense.application.service

import com.astarworks.astarmanagement.expense.domain.model.TagScope
import com.astarworks.astarmanagement.expense.presentation.request.CreateTagRequest
import com.astarworks.astarmanagement.expense.presentation.request.UpdateTagRequest
import com.astarworks.astarmanagement.expense.presentation.response.TagResponse
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service interface for tag management operations.
 * 
 * This service handles tag-related business logic including:
 * - Tag creation and validation
 * - Scope-based access control (TENANT vs PERSONAL)
 * - Usage tracking and statistics
 * - Name normalization and uniqueness
 */
interface TagService {
    
    /**
     * Creates a new tag with proper validation and scope handling.
     * 
     * Validates tag data, enforces naming rules, checks for duplicates
     * within the appropriate scope, and sets up proper ownership.
     * 
     * @param request The tag creation request
     * @return The created tag response
     */
    @Transactional
    fun create(request: CreateTagRequest): TagResponse
    
    /**
     * Lists tags accessible to the current user based on scope and filters.
     * 
     * Returns tags that the user can access based on:
     * - TENANT scope: All tenant tags
     * - PERSONAL scope: Only user's personal tags
     * 
     * @param scope Optional scope filter (TENANT or PERSONAL)
     * @param search Optional search term for tag names
     * @return List of accessible tag responses
     */
    @Transactional(readOnly = true)
    fun listAccessibleTags(scope: TagScope?, search: String?): List<TagResponse>
    
    /**
     * Gets tag suggestions based on usage frequency.
     * 
     * Returns the most frequently used tags that are accessible
     * to the current user for quick selection in UI.
     * 
     * @param limit Maximum number of suggestions to return
     * @return List of suggested tags ordered by usage frequency
     */
    @Transactional(readOnly = true)
    fun getSuggestions(limit: Int): List<TagResponse>
    
    /**
     * Updates an existing tag's properties.
     * 
     * Validates permissions (user can only update tags they own or tenant tags),
     * checks for name conflicts, and maintains usage statistics.
     * 
     * @param id The tag ID to update
     * @param request The update request
     * @return The updated tag response
     */
    @Transactional
    fun update(id: UUID, request: UpdateTagRequest): TagResponse
    
    /**
     * Soft deletes a tag with business rule validation.
     * 
     * Validates permissions, checks if tag is in use,
     * and handles cascade rules appropriately.
     * 
     * @param id The tag ID to delete
     */
    @Transactional
    fun delete(id: UUID)
    
    /**
     * Finds a tag by its normalized name within the tenant scope.
     * 
     * This is used for duplicate detection and tag resolution
     * during expense creation/update operations.
     * 
     * @param normalizedName The normalized tag name
     * @return The tag response if found, null otherwise
     */
    @Transactional(readOnly = true)
    fun findByNormalizedName(normalizedName: String): TagResponse?
    
    /**
     * Validates if a tag can be deleted.
     * 
     * Checks business rules such as:
     * - Tag usage in existing expenses
     * - User permissions
     * - Cascade deletion policies
     * 
     * @param id The tag ID to validate
     * @return True if deletion is allowed, false otherwise
     */
    @Transactional(readOnly = true)
    fun canDelete(id: UUID): Boolean
    
    /**
     * Creates or finds existing tags by names.
     * 
     * This method is used during expense operations to handle
     * tag associations efficiently. It will:
     * - Find existing tags by normalized names
     * - Create new tags for names that don't exist
     * - Handle scope and ownership appropriately
     * 
     * @param tagNames List of tag names to process
     * @param scope The scope for new tags (TENANT or PERSONAL)
     * @return List of tag responses (existing and newly created)
     */
    @Transactional
    fun findOrCreateTags(tagNames: List<String>, scope: TagScope): List<TagResponse>
}