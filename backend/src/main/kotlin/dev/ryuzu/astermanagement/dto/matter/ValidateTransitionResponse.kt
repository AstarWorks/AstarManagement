package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import io.swagger.v3.oas.annotations.media.Schema

/**
 * Response DTO for status transition validation.
 */
@Schema(description = "Response containing validation results for a status transition")
data class ValidateTransitionResponse(
    @Schema(description = "Whether the transition is valid", example = "true")
    val isValid: Boolean,
    
    @Schema(description = "Whether this transition requires a reason", example = "true")
    val requiresReason: Boolean,
    
    @Schema(description = "Whether this is a critical transition requiring extra confirmation", example = "false")
    val isCritical: Boolean,
    
    @Schema(description = "Error message if transition is invalid", example = "Insufficient permissions: CLERK cannot perform this status change")
    val errorMessage: String? = null,
    
    @Schema(description = "Current status of the matter", example = "ACTIVE")
    val currentStatus: MatterStatus,
    
    @Schema(description = "Target status for the transition", example = "CLOSED")
    val targetStatus: MatterStatus
)