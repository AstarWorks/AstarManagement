package dev.ryuzu.astermanagement.domain.matter

import dev.ryuzu.astermanagement.domain.user.User
import jakarta.persistence.*
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDateTime
import java.util.*

/**
 * Matter status history entity for tracking all status changes
 * Provides immutable audit trail for legal compliance
 */
@Entity
@Table(
    name = "matter_status_history",
    indexes = [
        Index(name = "idx_matter_status_history_matter_id", columnList = "matter_id"),
        Index(name = "idx_matter_status_history_changed_at", columnList = "changed_at"),
        Index(name = "idx_matter_status_history_changed_by", columnList = "changed_by"),
        Index(name = "idx_matter_status_history_new_status", columnList = "new_status"),
        Index(name = "idx_matter_status_history_matter_date", columnList = "matter_id, changed_at"),
        Index(name = "idx_matter_status_history_user_date", columnList = "changed_by, changed_at")
    ]
)
class MatterStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    var id: UUID? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matter_id", nullable = false)
    @field:NotNull(message = "Matter is required")
    var matter: Matter? = null

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 50)
    var oldStatus: MatterStatus? = null

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 50)
    @field:NotNull(message = "New status is required")
    var newStatus: MatterStatus? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    @field:NotNull(message = "Changed by user is required")
    var changedBy: User? = null

    @Column(name = "changed_at", nullable = false)
    @field:NotNull(message = "Changed at timestamp is required")
    var changedAt: LocalDateTime = LocalDateTime.now()

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

    @Column(name = "reason", length = 100)
    @field:Size(max = 100, message = "Reason must not exceed 100 characters")
    var reason: String? = null

    @Column(name = "estimated_completion_date")
    var estimatedCompletionDate: java.time.LocalDate? = null

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()

    /**
     * Check if this is an initial status (no old status)
     */
    val isInitialStatus: Boolean
        get() = oldStatus == null

    /**
     * Check if this represents a status upgrade (forward progress)
     */
    val isStatusUpgrade: Boolean
        get() = oldStatus != null && newStatus != null && 
                newStatus!!.ordinal > oldStatus!!.ordinal

    /**
     * Check if this represents a status downgrade (backward movement)
     */
    val isStatusDowngrade: Boolean
        get() = oldStatus != null && newStatus != null && 
                newStatus!!.ordinal < oldStatus!!.ordinal

    /**
     * Get a display-friendly description of the status change
     */
    val statusChangeDescription: String
        get() = when {
            isInitialStatus -> "Matter created with status: ${newStatus?.displayName}"
            oldStatus == newStatus -> "Status unchanged: ${newStatus?.displayName}"
            else -> "Status changed from ${oldStatus?.displayName} to ${newStatus?.displayName}"
        }

    /**
     * Get the time elapsed since this status change
     */
    val timeElapsed: java.time.Duration
        get() = java.time.Duration.between(changedAt, LocalDateTime.now())

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || this::class != other::class) return false
        
        other as MatterStatusHistory
        
        return id != null && id == other.id
    }

    override fun hashCode(): Int {
        return id?.hashCode() ?: 0
    }

    override fun toString(): String {
        return "MatterStatusHistory(id=$id, matter=${matter?.caseNumber}, statusChange='$statusChangeDescription', changedAt=$changedAt, changedBy=${changedBy?.username})"
    }
}