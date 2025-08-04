package com.astarworks.astarmanagement.expense.presentation.request

import com.astarworks.astarmanagement.expense.domain.model.TagScope
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

/**
 * Request DTO for creating a new tag.
 * Supports both tenant-wide and personal tags.
 */
data class CreateTagRequest(
    @field:NotBlank(message = "Tag name is required")
    @field:Size(max = 50, message = "Tag name cannot exceed 50 characters")
    val name: String,
    
    @field:NotBlank(message = "Color is required")
    @field:Pattern(
        regexp = "^#[0-9A-Fa-f]{6}$",
        message = "Color must be a valid hex code (e.g., #FF5733)"
    )
    val color: String,
    
    val scope: TagScope = TagScope.TENANT
)