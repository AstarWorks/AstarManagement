package dev.ryuzu.astermanagement.dto.matter

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.OffsetDateTime

/**
 * Request DTO for updating an existing matter.
 * All fields are optional except those marked as required.
 */
data class UpdateMatterRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 200, message = "Title must not exceed 200 characters")
    val title: String,
    
    @field:Size(max = 1000, message = "Description must not exceed 1000 characters")
    val description: String?,
    
    @field:NotBlank(message = "Client name is required")
    @field:Size(max = 100, message = "Client name must not exceed 100 characters")
    val clientName: String,
    
    @field:Size(max = 200, message = "Client contact must not exceed 200 characters")
    val clientContact: String?,
    
    @field:Size(max = 100, message = "Opponent name must not exceed 100 characters")
    val opponentName: String?,
    
    @field:Size(max = 200, message = "Opponent contact must not exceed 200 characters")
    val opponentContact: String?,
    
    val assignedLawyerId: Long?,
    
    @field:Size(max = 100, message = "Court name must not exceed 100 characters")
    val courtName: String?,
    
    @field:Size(max = 50, message = "Court case number must not exceed 50 characters")
    val courtCaseNumber: String?,
    
    val filingDeadline: OffsetDateTime?,
    
    val nextHearingDate: OffsetDateTime?
)