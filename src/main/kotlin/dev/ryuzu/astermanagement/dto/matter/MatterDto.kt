package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.MatterStatus
import java.time.OffsetDateTime

/**
 * Data transfer object for Matter entity.
 * Used for API responses to avoid exposing internal entity structure.
 * 
 * @property id Unique identifier
 * @property caseNumber Unique case number in format YYYY-TT-NNNN
 * @property title Matter title
 * @property description Detailed description
 * @property status Current matter status
 * @property clientName Name of the client
 * @property clientContact Client contact information
 * @property opponentName Name of the opposing party
 * @property opponentContact Opposing party contact information
 * @property assignedLawyerId ID of the assigned lawyer
 * @property assignedLawyerName Name of the assigned lawyer
 * @property courtName Name of the court
 * @property courtCaseNumber Court's case number
 * @property filingDeadline Deadline for filing
 * @property nextHearingDate Date of next hearing
 * @property createdAt Creation timestamp
 * @property updatedAt Last update timestamp
 * @property createdByUserId ID of user who created the matter
 * @property updatedByUserId ID of user who last updated the matter
 */
data class MatterDto(
    val id: Long,
    val caseNumber: String,
    val title: String,
    val description: String?,
    val status: MatterStatus,
    val clientName: String,
    val clientContact: String?,
    val opponentName: String?,
    val opponentContact: String?,
    val assignedLawyerId: Long?,
    val assignedLawyerName: String?,
    val courtName: String?,
    val courtCaseNumber: String?,
    val filingDeadline: OffsetDateTime?,
    val nextHearingDate: OffsetDateTime?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
    val createdByUserId: Long,
    val updatedByUserId: Long
)