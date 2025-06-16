package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
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
data class MatterDto(
    val id: UUID,
    val caseNumber: String,
    val title: String,
    val description: String?,
    val status: MatterStatus,
    val priority: MatterPriority,
    val clientName: String,
    val clientContact: String?,
    val opposingParty: String?,
    val courtName: String?,
    val filingDate: LocalDate?,
    val estimatedCompletionDate: LocalDate?,
    val actualCompletionDate: LocalDate?,
    val assignedLawyerId: UUID?,
    val assignedLawyerName: String?,
    val assignedClerkId: UUID?,
    val assignedClerkName: String?,
    val notes: String?,
    val tags: List<String>,
    val isActive: Boolean,
    val isOverdue: Boolean,
    val isCompleted: Boolean,
    val ageInDays: Long?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val createdBy: String,
    val updatedBy: String
)