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

/**
 * Search types for matter search
 */
enum class SearchType {
    FULL_TEXT,
    CASE_NUMBER,
    CLIENT_NAME,
    TITLE
}

/**
 * Matter search result DTO
 */
data class MatterSearchResultDto(
    val id: UUID,
    val caseNumber: String,
    val title: String,
    val clientName: String,
    val status: MatterStatusDTO,
    val priority: MatterPriorityDTO,
    val assignedLawyerName: String?,
    val createdAt: LocalDateTime,
    val relevanceScore: Double,
    val highlights: Map<String, List<String>> = emptyMap()
)

/**
 * Search suggestion DTO
 */
data class SearchSuggestionDto(
    val text: String,
    val type: String, // "case_number", "client_name", "title", etc.
    val count: Int
)

/**
 * Matter DTO for controller responses
 */
data class MatterDto(
    val id: UUID,
    val caseNumber: String,
    val title: String,
    val description: String?,
    val status: MatterStatusDTO,
    val priority: MatterPriorityDTO,
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

/**
 * Update matter status request DTO
 */
data class UpdateMatterStatusRequest(
    val status: String,
    val comment: String?
)

/**
 * Validate transition request DTO
 */
data class ValidateTransitionRequest(
    val newStatus: MatterStatusDTO
)

/**
 * Validate transition response DTO
 */
data class ValidateTransitionResponse(
    val isValid: Boolean,
    val requiresReason: Boolean,
    val isCritical: Boolean,
    val errorMessage: String?,
    val currentStatus: MatterStatusDTO,
    val targetStatus: MatterStatusDTO
)