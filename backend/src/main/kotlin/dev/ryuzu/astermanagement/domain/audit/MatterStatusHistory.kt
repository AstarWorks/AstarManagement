package dev.ryuzu.astermanagement.domain.audit

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.*

/**
 * Matter status history tracking entity as specified in R03
 * Tracks all status transitions for legal matters with full audit context
 */
@Entity
@Table(
    name = "matter_status_history",
    indexes = [
        Index(name = "idx_matter_status_history_matter_id", columnList = "matter_id"),
        Index(name = "idx_matter_status_history_changed_at", columnList = "changed_at"),
        Index(name = "idx_matter_status_history_changed_by", columnList = "changed_by"),
        Index(name = "idx_matter_status_history_new_status", columnList = "new_status")
    ]
)
class MatterStatusHistory(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "matter_id", nullable = false)
    val matterId: UUID,
    
    @Column(name = "old_status")
    @Enumerated(EnumType.STRING)
    val oldStatus: MatterStatus?,
    
    @Column(name = "new_status", nullable = false)
    @Enumerated(EnumType.STRING)
    val newStatus: MatterStatus,
    
    @Column(name = "changed_at", nullable = false)
    val changedAt: Instant = Instant.now(),
    
    @Column(name = "changed_by", nullable = false)
    val changedBy: UUID,
    
    @Column(name = "changed_by_name", nullable = false)
    val changedByName: String, // Denormalized for history as per R03
    
    @Column(name = "reason")
    val reason: String?, // Optional reason for change
    
    @Column(name = "notes", columnDefinition = "TEXT")
    val notes: String?, // Additional notes
    
    @Column(name = "metadata", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    val metadata: Map<String, Any> = emptyMap() // For additional context as per R03
) {
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || this::class != other::class) return false
        
        other as MatterStatusHistory
        
        return id == other.id
    }
    
    override fun hashCode(): Int {
        return id.hashCode()
    }
    
    override fun toString(): String {
        return "MatterStatusHistory(id=$id, matterId=$matterId, oldStatus=$oldStatus, newStatus=$newStatus, changedAt=$changedAt, changedBy=$changedBy)"
    }
}

/**
 * Repository interface for MatterStatusHistory
 */
interface MatterStatusHistoryRepository : org.springframework.data.jpa.repository.JpaRepository<MatterStatusHistory, UUID> {
    
    /**
     * Find all status history for a specific matter, ordered by change time
     */
    fun findByMatterIdOrderByChangedAtDesc(matterId: UUID): List<MatterStatusHistory>
    
    /**
     * Find status history for a specific matter within a time range
     */
    fun findByMatterIdAndChangedAtBetween(
        matterId: UUID,
        startTime: Instant,
        endTime: Instant
    ): List<MatterStatusHistory>
    
    /**
     * Find all status changes made by a specific user
     */
    fun findByChangedByOrderByChangedAtDesc(changedBy: UUID): List<MatterStatusHistory>
    
    /**
     * Find the most recent status change for a matter
     */
    fun findFirstByMatterIdOrderByChangedAtDesc(matterId: UUID): MatterStatusHistory?
    
    /**
     * Find all transitions to a specific status
     */
    fun findByNewStatusOrderByChangedAtDesc(newStatus: MatterStatus): List<MatterStatusHistory>
    
    /**
     * Find all transitions from a specific status
     */
    fun findByOldStatusOrderByChangedAtDesc(oldStatus: MatterStatus): List<MatterStatusHistory>
}

/**
 * Request DTO for creating status history entries
 */
data class MatterStatusHistoryRequest(
    val matterId: UUID,
    val oldStatus: MatterStatus?,
    val newStatus: MatterStatus,
    val changedBy: UUID,
    val changedByName: String,
    val reason: String? = null,
    val notes: String? = null,
    val metadata: Map<String, Any> = emptyMap()
) {
    fun toEntity(): MatterStatusHistory {
        return MatterStatusHistory(
            matterId = matterId,
            oldStatus = oldStatus,
            newStatus = newStatus,
            changedBy = changedBy,
            changedByName = changedByName,
            reason = reason,
            notes = notes,
            metadata = metadata
        )
    }
}

/**
 * DTO for status history responses
 */
data class MatterStatusHistoryDto(
    val id: UUID,
    val matterId: UUID,
    val oldStatus: MatterStatus?,
    val newStatus: MatterStatus,
    val changedAt: Instant,
    val changedBy: UUID,
    val changedByName: String,
    val reason: String?,
    val notes: String?,
    val metadata: Map<String, Any>
)

/**
 * Extension function to convert entity to DTO
 */
fun MatterStatusHistory.toDto(): MatterStatusHistoryDto {
    return MatterStatusHistoryDto(
        id = id,
        matterId = matterId,
        oldStatus = oldStatus,
        newStatus = newStatus,
        changedAt = changedAt,
        changedBy = changedBy,
        changedByName = changedByName,
        reason = reason,
        notes = notes,
        metadata = metadata
    )
}