package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.MatterStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.OffsetDateTime

/**
 * Request DTO for creating a new matter.
 * Includes validation annotations to ensure data integrity.
 */
data class CreateMatterRequest(
    @field:NotBlank(message = "Case number is required")
    @field:Pattern(
        regexp = "^\\d{4}-[A-Z]{2}-\\d{4}$",
        message = "Case number must follow format YYYY-TT-NNNN (e.g., 2025-CV-0001)"
    )
    val caseNumber: String,
    
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 200, message = "Title must not exceed 200 characters")
    val title: String,
    
    @field:Size(max = 1000, message = "Description must not exceed 1000 characters")
    val description: String? = null,
    
    @field:NotBlank(message = "Client name is required")
    @field:Size(max = 100, message = "Client name must not exceed 100 characters")
    val clientName: String,
    
    @field:Size(max = 200, message = "Client contact must not exceed 200 characters")
    val clientContact: String? = null,
    
    @field:Size(max = 100, message = "Opponent name must not exceed 100 characters")
    val opponentName: String? = null,
    
    @field:Size(max = 200, message = "Opponent contact must not exceed 200 characters")
    val opponentContact: String? = null,
    
    val assignedLawyerId: Long? = null,
    
    @field:Size(max = 100, message = "Court name must not exceed 100 characters")
    val courtName: String? = null,
    
    @field:Size(max = 50, message = "Court case number must not exceed 50 characters")
    val courtCaseNumber: String? = null,
    
    val filingDeadline: OffsetDateTime? = null,
    
    val nextHearingDate: OffsetDateTime? = null,
    
    val status: MatterStatus = MatterStatus.ACTIVE
)