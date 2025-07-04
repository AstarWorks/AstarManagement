package dev.ryuzu.astermanagement.modules.audit.domain

import dev.ryuzu.astermanagement.modules.audit.api.AuditEventType
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.net.InetAddress
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.*

/**
 * Comprehensive audit log entity for tracking all business operations
 * Maps to the audit_logs table with full JSONB support for flexible event storage
 */
@Entity
@Table(
    name = "audit_logs",
    indexes = [
        Index(name = "idx_audit_logs_entity_type_id", columnList = "entity_type,entity_id"),
        Index(name = "idx_audit_logs_user_timestamp", columnList = "user_id,event_timestamp"),
        Index(name = "idx_audit_logs_event_type", columnList = "event_type"),
        Index(name = "idx_audit_logs_timestamp", columnList = "event_timestamp"),
        Index(name = "idx_audit_logs_correlation", columnList = "correlation_id"),
        Index(name = "idx_audit_logs_entity_timestamp", columnList = "entity_type,entity_id,event_timestamp")
    ]
)
class AuditLog(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    
    @Column(name = "event_type", nullable = false)
    @Enumerated(EnumType.STRING)
    val eventType: AuditEventType,
    
    @Column(name = "entity_type", nullable = false, length = 50)
    val entityType: String,
    
    @Column(name = "entity_id", nullable = false, length = 255)
    val entityId: String,
    
    @Column(name = "user_id", nullable = false, length = 255)
    val userId: String,
    
    @Column(name = "user_name", length = 255)
    val userName: String? = null,
    
    @Column(name = "event_timestamp", nullable = false)
    val eventTimestamp: OffsetDateTime = OffsetDateTime.now(),
    
    @Column(name = "ip_address", columnDefinition = "inet")
    val ipAddress: InetAddress? = null,
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    val userAgent: String? = null,
    
    @Column(name = "session_id", length = 255)
    val sessionId: String? = null,
    
    @Column(name = "request_id", length = 255)
    val requestId: String? = null,
    
    @Column(name = "event_details", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    val eventDetails: Map<String, Any> = emptyMap(),
    
    @Column(name = "old_values", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    val oldValues: Map<String, Any>? = null,
    
    @Column(name = "new_values", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    val newValues: Map<String, Any>? = null,
    
    @Column(name = "correlation_id", length = 255)
    val correlationId: String? = null,
    
    @Column(name = "transaction_id", length = 255)
    val transactionId: String? = null,
    
    @Column(name = "retention_until")
    val retentionUntil: LocalDate? = null,
    
    @Column(name = "legal_hold")
    val legalHold: Boolean = false,
    
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now()
) {
    
    /**
     * Prevents deletion of audit records except through authorized cleanup
     */
    @PreRemove  
    fun preventDeletion() {
        throw IllegalStateException("Audit logs cannot be deleted except through authorized retention policy")
    }
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || this::class != other::class) return false
        
        other as AuditLog
        
        return id != null && id == other.id
    }
    
    override fun hashCode(): Int {
        return id?.hashCode() ?: 0
    }
    
    override fun toString(): String {
        return "AuditLog(id=$id, eventType=$eventType, entityType='$entityType', entityId='$entityId', userId='$userId', timestamp=$eventTimestamp)"
    }
}

/**
 * Immutable data class for creating audit log entries
 * Provides type-safe construction of audit logs
 */
data class AuditLogRequest(
    val eventType: AuditEventType,
    val entityType: String,
    val entityId: String,
    val userId: String,
    val userName: String? = null,
    val ipAddress: InetAddress? = null,
    val userAgent: String? = null,
    val sessionId: String? = null,
    val requestId: String? = null,
    val eventDetails: Map<String, Any> = emptyMap(),
    val oldValues: Map<String, Any>? = null,
    val newValues: Map<String, Any>? = null,
    val correlationId: String? = null,
    val transactionId: String? = null,
    val retentionUntil: LocalDate? = null,
    val legalHold: Boolean = false
) {
    /**
     * Converts the request to an AuditLog entity
     */
    fun toAuditLog(): AuditLog {
        return AuditLog(
            eventType = eventType,
            entityType = entityType,
            entityId = entityId,
            userId = userId,
            userName = userName,
            ipAddress = ipAddress,
            userAgent = userAgent,
            sessionId = sessionId,
            requestId = requestId,
            eventDetails = eventDetails,
            oldValues = oldValues,
            newValues = newValues,
            correlationId = correlationId,
            transactionId = transactionId,
            retentionUntil = retentionUntil,
            legalHold = legalHold
        )
    }
}