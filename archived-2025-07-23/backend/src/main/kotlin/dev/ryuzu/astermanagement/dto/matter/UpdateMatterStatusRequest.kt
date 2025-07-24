package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

/**
 * Request DTO for updating matter status.
 * Used for status transition operations that may require additional validation.
 */
@Schema(description = "Request to update matter status")
data class UpdateMatterStatusRequest(
    @field:NotNull(message = "Status is required")
    @Schema(description = "New status for the matter", allowableValues = ["INTAKE", "ACTIVE", "INVESTIGATION", "PENDING", "CLOSED"], required = true)
    val status: MatterStatus,
    
    @field:Size(max = 1000, message = "Comment must not exceed 1000 characters")
    @Schema(description = "Optional comment about the status change", example = "Moving to active status after client meeting")
    val comment: String? = null,
    
    @field:Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters")
    @Schema(description = "Reason for the status change (required for certain transitions)", example = "Client has approved all terms and signed agreement")
    val reason: String? = null
)