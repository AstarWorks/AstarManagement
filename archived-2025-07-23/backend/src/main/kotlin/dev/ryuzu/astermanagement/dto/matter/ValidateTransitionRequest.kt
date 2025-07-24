package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotNull

/**
 * Request DTO for validating a status transition.
 */
@Schema(description = "Request to validate a status transition")
data class ValidateTransitionRequest(
    @field:NotNull(message = "New status is required")
    @Schema(description = "The target status to transition to", required = true, example = "ACTIVE")
    val newStatus: MatterStatus
)