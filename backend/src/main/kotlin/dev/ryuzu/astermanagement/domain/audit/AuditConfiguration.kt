package dev.ryuzu.astermanagement.domain.audit

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import jakarta.persistence.*
import java.util.*

/**
 * System configuration for audit logging behavior
 * Maps to the audit_configuration table
 */
@Entity
@Table(name = "audit_configuration")
class AuditConfiguration(
    @Column(name = "retention_policy_days", nullable = false)
    var retentionPolicyDays: Int = 2555, // ~7 years default
    
    @Column(name = "cleanup_enabled", nullable = false)
    var cleanupEnabled: Boolean = true,
    
    @Column(name = "batch_size", nullable = false)
    var batchSize: Int = 1000,
    
    @Column(name = "async_enabled", nullable = false)
    var asyncEnabled: Boolean = true,
    
    @Column(name = "immutable_records", nullable = false)
    var immutableRecords: Boolean = true,
    
    @Column(name = "legal_hold_default_days", nullable = false)
    var legalHoldDefaultDays: Int = 3650, // 10 years
    
    @Column(name = "partition_enabled", nullable = false)
    var partitionEnabled: Boolean = false,
    
    @Column(name = "partition_interval", length = 20)
    var partitionInterval: String = "MONTHLY", // MONTHLY, YEARLY
    
    @Column(name = "alert_on_failures", nullable = false)
    var alertOnFailures: Boolean = true,
    
    @Column(name = "max_failed_audits_per_hour", nullable = false)
    var maxFailedAuditsPerHour: Int = 100,
    
    @Column(name = "updated_by")
    var updatedBy: UUID? = null
) : BaseEntity() {
    
    companion object {
        /**
         * Gets the current active audit configuration
         */
        fun getDefault(): AuditConfiguration {
            return AuditConfiguration()
        }
    }
    
    override fun toString(): String {
        return "AuditConfiguration(id=$id, retentionPolicyDays=$retentionPolicyDays, cleanupEnabled=$cleanupEnabled, asyncEnabled=$asyncEnabled)"
    }
}