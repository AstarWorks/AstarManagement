package dev.ryuzu.astermanagement.domain.audit

import jakarta.persistence.*
import java.net.InetAddress
import java.time.OffsetDateTime
import java.util.*

/**
 * Matter-specific audit log entity for detailed field-level change tracking
 * Maps to the existing matter_audit_log table created by database triggers
 */
@Entity
@Table(
    name = "matter_audit_log",
    indexes = [
        Index(name = "idx_matter_audit_log_matter_id", columnList = "matter_id"),
        Index(name = "idx_matter_audit_log_changed_at", columnList = "changed_at"),
        Index(name = "idx_matter_audit_log_changed_by", columnList = "changed_by"),
        Index(name = "idx_matter_audit_log_operation", columnList = "operation"),
        Index(name = "idx_matter_audit_log_field_name", columnList = "field_name"),
        Index(name = "idx_matter_audit_log_matter_date", columnList = "matter_id,changed_at"),
        Index(name = "idx_matter_audit_log_user_date", columnList = "changed_by,changed_at"),
        Index(name = "idx_matter_audit_log_field_date", columnList = "field_name,changed_at")
    ]
)
class MatterAuditLog(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "matter_id", nullable = false)
    val matterId: UUID,
    
    @Column(name = "action", nullable = false)
    @Enumerated(EnumType.STRING)
    val action: AuditAction,
    
    @Column(name = "field_name")
    val fieldName: String?,
    
    @Column(name = "old_value", columnDefinition = "TEXT")
    val oldValue: String?,
    
    @Column(name = "new_value", columnDefinition = "TEXT")
    val newValue: String?,
    
    @Column(name = "performed_at", nullable = false)
    val performedAt: OffsetDateTime = OffsetDateTime.now(),
    
    @Column(name = "performed_by", nullable = false)
    val performedBy: UUID,
    
    @Column(name = "performed_by_name", nullable = false)
    val performedByName: String, // R03 requirement - denormalized username
    
    @Column(name = "ip_address_temp", nullable = false)
    val ipAddress: String, // R03 requirement - string representation
    
    @Column(name = "user_agent", nullable = false, columnDefinition = "TEXT")
    val userAgent: String, // R03 requirement
    
    @Column(name = "session_id", nullable = false, length = 255)
    val sessionId: String, // R03 requirement
    
    @Column(name = "change_reason")
    val changeReason: String? = null,
    
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now()
) {
    
    /**
     * Prevents updates to matter audit records for immutability
     */
    @PreUpdate
    fun preventUpdate() {
        throw IllegalStateException("Matter audit logs are immutable and cannot be updated")
    }
    
    /**
     * Prevents deletion of matter audit records 
     */
    @PreRemove
    fun preventDeletion() {
        throw IllegalStateException("Matter audit logs cannot be deleted")
    }
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || this::class != other::class) return false
        
        other as MatterAuditLog
        
        return id != null && id == other.id
    }
    
    override fun hashCode(): Int {
        return id?.hashCode() ?: 0
    }
    
    override fun toString(): String {
        return "MatterAuditLog(id=$id, matterId=$matterId, action=$action, fieldName='$fieldName', performedBy=$performedBy, performedAt=$performedAt)"
    }
}

/**
 * Audit actions as specified in R03 requirements
 */
enum class AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    STATUS_CHANGE,
    ASSIGN,
    UNASSIGN,
    VIEW,
    EXPORT,
    PRINT
}

/**
 * Data class for creating matter audit log entries - R03 compliant
 */
data class MatterAuditLogRequest(
    val matterId: UUID,
    val action: AuditAction,
    val fieldName: String?,
    val oldValue: String? = null,
    val newValue: String? = null,
    val performedBy: UUID,
    val performedByName: String,
    val ipAddress: String,
    val userAgent: String,
    val sessionId: String,
    val changeReason: String? = null
) {
    /**
     * Converts the request to a MatterAuditLog entity
     */
    fun toMatterAuditLog(): MatterAuditLog {
        return MatterAuditLog(
            matterId = matterId,
            action = action,
            fieldName = fieldName,
            oldValue = oldValue,
            newValue = newValue,
            performedBy = performedBy,
            performedByName = performedByName,
            ipAddress = ipAddress,
            userAgent = userAgent,
            sessionId = sessionId,
            changeReason = changeReason
        )
    }
}