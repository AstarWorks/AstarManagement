package com.astarworks.astarmanagement.core.tenant.api.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

/**
 * Request DTO for creating a new tenant.
 */
data class CreateTenantRequest(
    @field:NotBlank(message = "Slug is required")
    @field:Size(min = 3, max = 100, message = "Slug must be between 3 and 100 characters")
    @field:Pattern(
        regexp = "^[a-z0-9-]+$",
        message = "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    val slug: String,
    
    @field:NotBlank(message = "Name is required")
    @field:Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
    val name: String,
    
    @field:Size(max = 255, message = "Auth0 Organization ID must not exceed 255 characters")
    val auth0OrgId: String? = null
)