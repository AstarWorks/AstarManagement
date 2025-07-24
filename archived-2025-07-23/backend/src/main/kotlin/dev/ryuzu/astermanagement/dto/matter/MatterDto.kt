package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

/**
 * Data transfer object for Matter entity.
 * Used for API responses to avoid exposing internal entity structure.
 * 
 * @property id Unique identifier
 * @property caseNumber Unique case number in format YYYY-TT-NNNN
 * @property title Matter title
 * @property description Detailed description
 * @property status Current matter status
 * @property priority Matter priority level
 * @property clientName Name of the client
 * @property clientContact Client contact information
 * @property opposingParty Name of the opposing party
 * @property courtName Name of the court
 * @property filingDate Date when matter was filed
 * @property estimatedCompletionDate Estimated completion date
 * @property actualCompletionDate Actual completion date
 * @property assignedLawyerId ID of the assigned lawyer
 * @property assignedLawyerName Name of the assigned lawyer
 * @property assignedClerkId ID of the assigned clerk
 * @property assignedClerkName Name of the assigned clerk
 * @property notes Additional notes
 * @property tags Associated tags
 * @property isActive Whether the matter is active
 * @property isOverdue Whether the matter is overdue
 * @property isCompleted Whether the matter is completed
 * @property ageInDays Age of the matter in days
 * @property createdAt Creation timestamp
 * @property updatedAt Last update timestamp
 * @property createdBy User who created the matter
 * @property updatedBy User who last updated the matter
 */
@Schema(description = "Matter information response")
data class MatterDto(
    @Schema(description = "Unique matter identifier", example = "550e8400-e29b-41d4-a716-446655440000")
    val id: UUID,
    
    @Schema(description = "Unique case number", example = "2025-CV-0001")
    val caseNumber: String,
    
    @Schema(description = "Matter title", example = "Personal Injury Case - John Doe vs. ABC Corp")
    val title: String,
    
    @Schema(description = "Detailed matter description", example = "Car accident case with multiple defendants")
    val description: String?,
    
    @Schema(description = "Current matter status", allowableValues = ["INTAKE", "ACTIVE", "INVESTIGATION", "PENDING", "CLOSED"])
    val status: MatterStatus,
    
    @Schema(description = "Matter priority level", allowableValues = ["LOW", "MEDIUM", "HIGH", "URGENT"])
    val priority: MatterPriority,
    
    @Schema(description = "Client's full name", example = "John Doe")
    val clientName: String,
    
    @Schema(description = "Client contact information", example = "Email: john.doe@email.com, Phone: +1-555-123-4567")
    val clientContact: String?,
    
    @Schema(description = "Name of the opposing party", example = "ABC Corporation")
    val opposingParty: String?,
    
    @Schema(description = "Name of the court", example = "Superior Court of California")
    val courtName: String?,
    
    @Schema(description = "Date when the matter was filed", example = "2025-01-15")
    val filingDate: LocalDate?,
    
    @Schema(description = "Estimated completion date", example = "2025-06-30")
    val estimatedCompletionDate: LocalDate?,
    
    @Schema(description = "Actual completion date", example = "2025-06-15")
    val actualCompletionDate: LocalDate?,
    
    @Schema(description = "ID of the assigned lawyer", example = "550e8400-e29b-41d4-a716-446655440000")
    val assignedLawyerId: UUID?,
    
    @Schema(description = "Name of the assigned lawyer", example = "Jane Smith")
    val assignedLawyerName: String?,
    
    @Schema(description = "ID of the assigned clerk", example = "550e8400-e29b-41d4-a716-446655440001")
    val assignedClerkId: UUID?,
    
    @Schema(description = "Name of the assigned clerk", example = "Robert Johnson")
    val assignedClerkName: String?,
    
    @Schema(description = "Additional notes about the matter")
    val notes: String?,
    
    @Schema(description = "Tags for categorizing the matter", example = "[\"personal-injury\", \"automobile\", \"litigation\"]")
    val tags: List<String>,
    
    @Schema(description = "Whether the matter is currently active", example = "true")
    val isActive: Boolean,
    
    @Schema(description = "Whether the matter is overdue", example = "false")
    val isOverdue: Boolean,
    
    @Schema(description = "Whether the matter is completed", example = "false")
    val isCompleted: Boolean,
    
    @Schema(description = "Age of the matter in days", example = "45")
    val ageInDays: Long?,
    
    @Schema(description = "Creation timestamp", example = "2025-01-01T10:00:00")
    val createdAt: LocalDateTime,
    
    @Schema(description = "Last update timestamp", example = "2025-01-02T14:30:00")
    val updatedAt: LocalDateTime,
    
    @Schema(description = "User who created the matter", example = "jane.smith@law.com")
    val createdBy: String,
    
    @Schema(description = "User who last updated the matter", example = "robert.johnson@law.com")
    val updatedBy: String
)