package com.astarworks.astarmanagement.expense.presentation.request

import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

/**
 * Request DTO for updating an existing tag.
 * All fields are optional to support partial updates.
 */
data class UpdateTagRequest(
    @field:Size(max = 50, message = "Tag name cannot exceed 50 characters")
    val name: String? = null,
    
    @field:Pattern(
        regexp = "^#[0-9A-Fa-f]{6}$",
        message = "Color must be a valid hex code (e.g., #FF5733)"
    )
    val color: String? = null
)