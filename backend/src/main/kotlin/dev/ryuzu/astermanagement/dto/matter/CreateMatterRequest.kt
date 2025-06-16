package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.*

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
    @field:Size(max = 500, message = "Title must not exceed 500 characters")
    val title: String,
    
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    val description: String? = null,
    
    @field:NotBlank(message = "Client name is required")
    @field:Size(max = 255, message = "Client name must not exceed 255 characters")
    val clientName: String,
    
    @field:Size(max = 1000, message = "Client contact must not exceed 1000 characters")
    val clientContact: String? = null,
    
    @field:Size(max = 255, message = "Opposing party name must not exceed 255 characters")
    val opposingParty: String? = null,
    
    @field:Size(max = 255, message = "Court name must not exceed 255 characters")
    val courtName: String? = null,
    
    val filingDate: LocalDate? = null,
    
    val estimatedCompletionDate: LocalDate? = null,
    
    val status: MatterStatus = MatterStatus.INTAKE,
    
    val priority: MatterPriority = MatterPriority.MEDIUM,
    
    val assignedLawyerId: UUID,
    
    val assignedClerkId: UUID? = null,
    
    @field:Size(max = 2000, message = "Notes must not exceed 2000 characters")
    val notes: String? = null,
    
    val tags: List<String> = emptyList()
)