package dev.ryuzu.astermanagement.modules.matter.api.dto

import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

/**
 * Public API DTO for Matter entity
 * Used for communication between modules and external controllers
 */
data class MatterDTO(
    val id: UUID,
    val caseNumber: String,
    val title: String,
    val description: String?,
    val clientId: UUID?,
    val clientName: String,
    val clientContact: String?,
    val opposingParty: String?,
    val courtName: String?,
    val filingDate: LocalDate?,
    val estimatedCompletionDate: LocalDate?,
    val actualCompletionDate: LocalDate?,
    val status: MatterStatusDTO,
    val priority: MatterPriorityDTO,
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
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

/**
 * Request DTO for creating a new matter
 */
data class CreateMatterRequest(
    val caseNumber: String,
    val title: String,
    val description: String?,
    val clientId: UUID?,
    val clientName: String,
    val clientContact: String?,
    val opposingParty: String?,
    val courtName: String?,
    val filingDate: LocalDate?,
    val estimatedCompletionDate: LocalDate?,
    val priority: MatterPriorityDTO = MatterPriorityDTO.MEDIUM,
    val assignedLawyerId: UUID,
    val assignedClerkId: UUID?,
    val notes: String?,
    val tags: List<String> = emptyList()
)

/**
 * Request DTO for updating an existing matter
 */
data class UpdateMatterRequest(
    val title: String?,
    val description: String?,
    val clientContact: String?,
    val opposingParty: String?,
    val courtName: String?,
    val filingDate: LocalDate?,
    val estimatedCompletionDate: LocalDate?,
    val actualCompletionDate: LocalDate?,
    val priority: MatterPriorityDTO?,
    val assignedLawyerId: UUID?,
    val assignedClerkId: UUID?,
    val notes: String?,
    val tags: List<String>?
)

/**
 * Matter status enum for API
 */
enum class MatterStatusDTO {
    INTAKE,
    INITIAL_REVIEW,
    INVESTIGATION,
    RESEARCH,
    DRAFT_PLEADINGS,
    FILED,
    DISCOVERY,
    MEDIATION,
    TRIAL_PREP,
    TRIAL,
    SETTLEMENT,
    CLOSED;
    
    val displayName: String
        get() = name.replace('_', ' ').lowercase()
            .split(' ')
            .joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
}

/**
 * Matter priority enum for API
 */
enum class MatterPriorityDTO {
    LOW,
    MEDIUM,
    HIGH,
    URGENT;
    
    val displayName: String
        get() = name.lowercase().replaceFirstChar { it.uppercase() }
    
    val weight: Int
        get() = when (this) {
            LOW -> 1
            MEDIUM -> 2
            HIGH -> 3
            URGENT -> 4
        }
}