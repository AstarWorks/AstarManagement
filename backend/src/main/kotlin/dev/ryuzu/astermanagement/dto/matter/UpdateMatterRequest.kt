package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.*

/**
 * Request DTO for updating an existing matter.
 * All fields are optional except those marked as required.
 */
@Schema(description = "Request to update an existing legal matter")
data class UpdateMatterRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 500, message = "Title must not exceed 500 characters")
    @Schema(description = "Updated matter title", example = "Personal Injury Case - John Doe vs. ABC Corp", required = true)
    val title: String,
    
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    @Schema(description = "Updated matter description", example = "Car accident case with multiple defendants")
    val description: String?,
    
    @field:NotBlank(message = "Client name is required")
    @field:Size(max = 255, message = "Client name must not exceed 255 characters")
    @Schema(description = "Updated client name", example = "John Doe", required = true)
    val clientName: String,
    
    @field:Size(max = 1000, message = "Client contact must not exceed 1000 characters")
    @Schema(description = "Updated client contact information", example = "Email: john.doe@email.com, Phone: +1-555-123-4567")
    val clientContact: String?,
    
    @field:Size(max = 255, message = "Opposing party name must not exceed 255 characters")
    @Schema(description = "Updated opposing party name", example = "ABC Corporation")
    val opposingParty: String?,
    
    @field:Size(max = 255, message = "Court name must not exceed 255 characters")
    @Schema(description = "Updated court name", example = "Superior Court of California")
    val courtName: String?,
    
    @Schema(description = "Updated filing date", example = "2025-01-15")
    val filingDate: LocalDate?,
    
    @Schema(description = "Updated estimated completion date", example = "2025-06-30")
    val estimatedCompletionDate: LocalDate?,
    
    @Schema(description = "Updated matter priority", allowableValues = ["LOW", "MEDIUM", "HIGH", "URGENT"])
    val priority: MatterPriority?,
    
    @Schema(description = "Updated assigned lawyer ID", example = "550e8400-e29b-41d4-a716-446655440000")
    val assignedLawyerId: UUID?,
    
    @Schema(description = "Updated assigned clerk ID", example = "550e8400-e29b-41d4-a716-446655440001")
    val assignedClerkId: UUID?,
    
    @field:Size(max = 2000, message = "Notes must not exceed 2000 characters")
    @Schema(description = "Updated notes about the matter")
    val notes: String?,
    
    @Schema(description = "Updated tags for categorizing the matter", example = "[\"personal-injury\", \"automobile\", \"litigation\"]")
    val tags: List<String>?
)