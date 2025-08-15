package com.astarworks.astarmanagement.modules.financial.expense.presentation.controller

import com.astarworks.astarmanagement.modules.financial.expense.application.service.TagService
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.TagScope
import com.astarworks.astarmanagement.modules.financial.expense.presentation.request.CreateTagRequest
import com.astarworks.astarmanagement.modules.financial.expense.presentation.request.UpdateTagRequest
import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.TagResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for tag management operations.
 * Provides endpoints for creating, updating, and managing expense tags.
 */
@RestController
@RequestMapping("/api/v1/tags")
@Tag(name = "Tag Management", description = "Tag operations for expense categorization")
@Validated
class TagController(
    private val tagService: TagService
) {
    
    /**
     * Creates a new tag for expense categorization.
     * 
     * @param request The tag creation request with validated data
     * @return The created tag response
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new tag")
    fun createTag(
        @Valid @RequestBody request: CreateTagRequest
    ): TagResponse {
        return tagService.create(request)
    }
    
    /**
     * Lists all available tags with optional filtering.
     * 
     * @param scope Optional scope filter (TENANT or PERSONAL)
     * @param search Optional search term for tag names
     * @return List of tag responses
     */
    @GetMapping
    @Operation(summary = "List tags")
    fun listTags(
        @RequestParam scope: TagScope?,
        @RequestParam search: String?
    ): List<TagResponse> {
        return tagService.listAccessibleTags(scope, search)
    }
    
    /**
     * Gets tag suggestions based on usage frequency.
     * Returns the most frequently used tags for quick selection.
     * 
     * @param limit Maximum number of suggestions to return
     * @return List of suggested tags
     */
    @GetMapping("/suggestions")
    @Operation(summary = "Get tag suggestions")
    fun getTagSuggestions(
        @RequestParam(defaultValue = "10") limit: Int
    ): List<TagResponse> {
        return tagService.getSuggestions(limit)
    }
    
    /**
     * Updates an existing tag's properties.
     * 
     * @param id The tag ID to update
     * @param request The update request with validated data
     * @return The updated tag response
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update tag")
    fun updateTag(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTagRequest
    ): TagResponse {
        return tagService.update(id, request)
    }
    
    /**
     * Deletes a tag.
     * Note: Tags that are in use may not be deletable depending on business rules.
     * 
     * @param id The tag ID to delete
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete tag")
    fun deleteTag(@PathVariable id: UUID) {
        tagService.delete(id)
    }
}