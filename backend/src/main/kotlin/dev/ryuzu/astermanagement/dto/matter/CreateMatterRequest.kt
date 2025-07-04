package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.*

/**
 * Request DTO for creating a new matter.
 * Includes validation annotations to ensure data integrity.
 */
@Schema(description = "Request to create a new legal matter")
data class CreateMatterRequest(
    @field:NotBlank(message = "Case number is required")
    @field:Pattern(
        regexp = "^\\d{4}-[A-Z]{2}-\\d{4}$",
        message = "Case number must follow format YYYY-TT-NNNN (e.g., 2025-CV-0001)"
    )
    @Schema(description = "Unique case number in format YYYY-TT-NNNN", example = "2025-CV-0001", required = true)
    val caseNumber: String,
    
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 500, message = "Title must not exceed 500 characters")
    @Schema(description = "Matter title", example = "Personal Injury Case - John Doe vs. ABC Corp", required = true)
    val title: String,
    
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    @Schema(description = "Detailed description of the matter", example = "Car accident case with multiple defendants")
    val description: String? = null,
    
    @field:NotBlank(message = "Client name is required")
    @field:Size(max = 255, message = "Client name must not exceed 255 characters")
    @Schema(description = "Client's full name", example = "John Doe", required = true)
    val clientName: String,
    
    @field:Size(max = 1000, message = "Client contact must not exceed 1000 characters")
    @Schema(description = "Client contact information", example = "Email: john.doe@email.com, Phone: +1-555-123-4567")
    val clientContact: String? = null,
    
    @field:Size(max = 255, message = "Opposing party name must not exceed 255 characters")
    @Schema(description = "Name of the opposing party", example = "ABC Corporation")
    val opposingParty: String? = null,
    
    @field:Size(max = 255, message = "Court name must not exceed 255 characters")
    @Schema(description = "Name of the court", example = "Superior Court of California")
    val courtName: String? = null,
    
    @Schema(description = "Date when the matter was filed", example = "2025-01-15")
    val filingDate: LocalDate? = null,
    
    @Schema(description = "Estimated completion date", example = "2025-06-30")
    val estimatedCompletionDate: LocalDate? = null,
    
    @Schema(description = "Initial matter status", allowableValues = ["INTAKE", "ACTIVE", "INVESTIGATION", "PENDING", "CLOSED"])
    val status: MatterStatus = MatterStatus.INTAKE,
    
    @Schema(description = "Matter priority level", allowableValues = ["LOW", "MEDIUM", "HIGH", "URGENT"])
    val priority: MatterPriority = MatterPriority.MEDIUM,
    
    @Schema(description = "ID of the lawyer assigned to this matter", example = "550e8400-e29b-41d4-a716-446655440000", required = true)
    val assignedLawyerId: UUID,
    
    @Schema(description = "ID of the clerk assigned to this matter", example = "550e8400-e29b-41d4-a716-446655440001")
    val assignedClerkId: UUID? = null,
    
    @field:Size(max = 2000, message = "Notes must not exceed 2000 characters")
    @Schema(description = "Additional notes about the matter")
    val notes: String? = null,
    
    @Schema(description = "Tags for categorizing the matter", example = "[\"personal-injury\", \"automobile\", \"litigation\"]")
    val tags: List<String> = emptyList()
)