package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.*

/**
 * Request DTO for updating an existing matter.
 * All fields are optional except those marked as required.
 */
data class UpdateMatterRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 500, message = "Title must not exceed 500 characters")
    val title: String,
    
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    val description: String?,
    
    @field:NotBlank(message = "Client name is required")
    @field:Size(max = 255, message = "Client name must not exceed 255 characters")
    val clientName: String,
    
    @field:Size(max = 1000, message = "Client contact must not exceed 1000 characters")
    val clientContact: String?,
    
    @field:Size(max = 255, message = "Opposing party name must not exceed 255 characters")
    val opposingParty: String?,
    
    @field:Size(max = 255, message = "Court name must not exceed 255 characters")
    val courtName: String?,
    
    val filingDate: LocalDate?,
    
    val estimatedCompletionDate: LocalDate?,
    
    val priority: MatterPriority?,
    
    val assignedLawyerId: UUID?,
    
    val assignedClerkId: UUID?,
    
    @field:Size(max = 2000, message = "Notes must not exceed 2000 characters")
    val notes: String?,
    
    val tags: List<String>?
)