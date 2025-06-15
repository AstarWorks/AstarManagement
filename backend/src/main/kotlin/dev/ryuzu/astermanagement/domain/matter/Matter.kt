package dev.ryuzu.astermanagement.domain.matter

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import dev.ryuzu.astermanagement.domain.user.User
import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.*

/**
 * Matter entity representing legal cases managed by the firm
 * Central entity supporting the Kanban board workflow and case management
 */
@Entity
@Table(
    name = "matters",
    indexes = [
        Index(name = "idx_matters_case_number", columnList = "case_number"),
        Index(name = "idx_matters_client_name", columnList = "client_name"),
        Index(name = "idx_matters_status", columnList = "status"),
        Index(name = "idx_matters_priority", columnList = "priority"),
        Index(name = "idx_matters_assigned_lawyer", columnList = "assigned_lawyer_id"),
        Index(name = "idx_matters_assigned_clerk", columnList = "assigned_clerk_id"),
        Index(name = "idx_matters_filing_date", columnList = "filing_date"),
        Index(name = "idx_matters_created_at", columnList = "created_at"),
        Index(name = "idx_matters_lawyer_status", columnList = "assigned_lawyer_id, status"),
        Index(name = "idx_matters_status_priority", columnList = "status, priority"),
        Index(name = "idx_matters_client_status", columnList = "client_name, status")
    ]
)
class Matter : BaseEntity() {

    @Column(name = "case_number", nullable = false, unique = true, length = 255)
    @field:NotBlank(message = "Case number is required")
    @field:Size(max = 255, message = "Case number must not exceed 255 characters")
    var caseNumber: String = ""

    @Column(name = "title", nullable = false, length = 500)
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 500, message = "Title must not exceed 500 characters")
    var title: String = ""

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null

    // Client information
    @Column(name = "client_name", nullable = false, length = 255)
    @field:NotBlank(message = "Client name is required")
    @field:Size(max = 255, message = "Client name must not exceed 255 characters")
    var clientName: String = ""

    @Column(name = "client_contact", columnDefinition = "TEXT")
    var clientContact: String? = null

    @Column(name = "opposing_party", length = 255)
    var opposingParty: String? = null

    @Column(name = "court_name", length = 255)
    var courtName: String? = null

    // Important dates
    @Column(name = "filing_date")
    var filingDate: LocalDate? = null

    @Column(name = "estimated_completion_date")
    var estimatedCompletionDate: LocalDate? = null

    @Column(name = "actual_completion_date")
    var actualCompletionDate: LocalDate? = null

    // Status and priority
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: MatterStatus = MatterStatus.INTAKE

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    var priority: MatterPriority = MatterPriority.MEDIUM

    // Assignments
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_lawyer_id", nullable = false)
    @field:NotNull(message = "Assigned lawyer is required")
    var assignedLawyer: User? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_clerk_id")
    var assignedClerk: User? = null

    // Additional metadata
    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

    @Column(name = "tags", columnDefinition = "TEXT[]")
    var tags: Array<String> = emptyArray()

    /**
     * Check if the matter is active (not closed)
     */
    val isActive: Boolean
        get() = status != MatterStatus.CLOSED

    /**
     * Check if the matter is overdue
     */
    val isOverdue: Boolean
        get() = estimatedCompletionDate?.isBefore(LocalDate.now()) == true && !isCompleted

    /**
     * Check if the matter is completed
     */
    val isCompleted: Boolean
        get() = actualCompletionDate != null || status == MatterStatus.CLOSED

    /**
     * Get the matter's age in days since creation
     */
    val ageInDays: Long?
        get() = createdAt?.let { 
            java.time.Duration.between(it, java.time.LocalDateTime.now()).toDays()
        }

    /**
     * Add a tag to the matter
     */
    fun addTag(tag: String) {
        val trimmedTag = tag.trim()
        if (!hasTag(trimmedTag)) {
            tags = tags.plus(trimmedTag)
        }
    }

    /**
     * Remove a tag from the matter
     */
    fun removeTag(tag: String) {
        tags = tags.filter { it != tag.trim() }.toTypedArray()
    }

    /**
     * Check if the matter has a specific tag
     */
    fun hasTag(tag: String): Boolean {
        return tags.contains(tag)
    }

    /**
     * Update the status and handle business logic
     */
    fun updateStatus(newStatus: MatterStatus) {
        val oldStatus = this.status
        this.status = newStatus
        
        // Auto-set completion date when closed
        if (newStatus == MatterStatus.CLOSED && actualCompletionDate == null) {
            actualCompletionDate = LocalDate.now()
        }
        
        // Clear completion date if reopened
        if (oldStatus == MatterStatus.CLOSED && newStatus != MatterStatus.CLOSED) {
            actualCompletionDate = null
        }
    }

    override fun toString(): String {
        return "Matter(id=$id, caseNumber='$caseNumber', title='$title', clientName='$clientName', status=$status, priority=$priority)"
    }
}

/**
 * Matter status enum representing the workflow stages
 * Corresponds to the database CHECK constraint
 */
enum class MatterStatus {
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

    /**
     * Get display name for the status
     */
    val displayName: String
        get() = name.replace('_', ' ').lowercase()
            .split(' ')
            .joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }

    /**
     * Check if this status can transition to another status
     */
    fun canTransitionTo(newStatus: MatterStatus): Boolean {
        return when (this) {
            INTAKE -> newStatus in setOf(INITIAL_REVIEW, CLOSED)
            INITIAL_REVIEW -> newStatus in setOf(INVESTIGATION, RESEARCH, CLOSED)
            INVESTIGATION -> newStatus in setOf(RESEARCH, DRAFT_PLEADINGS, CLOSED)
            RESEARCH -> newStatus in setOf(DRAFT_PLEADINGS, FILED, CLOSED)
            DRAFT_PLEADINGS -> newStatus in setOf(FILED, RESEARCH, CLOSED)
            FILED -> newStatus in setOf(DISCOVERY, SETTLEMENT, CLOSED)
            DISCOVERY -> newStatus in setOf(MEDIATION, TRIAL_PREP, SETTLEMENT, CLOSED)
            MEDIATION -> newStatus in setOf(SETTLEMENT, TRIAL_PREP, CLOSED)
            TRIAL_PREP -> newStatus in setOf(TRIAL, SETTLEMENT, CLOSED)
            TRIAL -> newStatus in setOf(SETTLEMENT, CLOSED)
            SETTLEMENT -> newStatus in setOf(CLOSED)
            CLOSED -> true // Can reopen to any status
        }
    }
}

/**
 * Matter priority levels
 * Corresponds to the database CHECK constraint  
 */
enum class MatterPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT;

    /**
     * Get display name for the priority
     */
    val displayName: String
        get() = name.lowercase().replaceFirstChar { it.uppercase() }

    /**
     * Get priority weight for sorting (higher number = higher priority)
     */
    val weight: Int
        get() = when (this) {
            LOW -> 1
            MEDIUM -> 2
            HIGH -> 3
            URGENT -> 4
        }
}