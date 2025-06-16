package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.MatterStatus
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

/**
 * Request DTO for updating matter status.
 * Used for status transition operations that may require additional validation.
 */
data class UpdateMatterStatusRequest(
    @field:NotNull(message = "Status is required")
    val status: MatterStatus,
    
    @field:Size(max = 500, message = "Comment must not exceed 500 characters")
    val comment: String? = null
)