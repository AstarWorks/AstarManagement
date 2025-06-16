package dev.ryuzu.astermanagement.dto.audit

import dev.ryuzu.astermanagement.domain.audit.AuditConfiguration
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime
import java.util.*

/**
 * DTO for audit configuration
 */
@Schema(description = "Audit system configuration settings")
data class AuditConfigurationDto(
    @Schema(description = "Configuration ID")
    val id: UUID?,
    
    @Schema(description = "Retention policy in days", example = "2555")
    val retentionPolicyDays: Int,
    
    @Schema(description = "Whether automatic cleanup is enabled")
    val cleanupEnabled: Boolean,
    
    @Schema(description = "Batch size for audit processing", example = "1000")
    val batchSize: Int,
    
    @Schema(description = "Whether asynchronous processing is enabled")
    val asyncEnabled: Boolean,
    
    @Schema(description = "Whether audit records are immutable")
    val immutableRecords: Boolean,
    
    @Schema(description = "Default legal hold period in days", example = "3650")
    val legalHoldDefaultDays: Int,
    
    @Schema(description = "Whether table partitioning is enabled")
    val partitionEnabled: Boolean,
    
    @Schema(description = "Partition interval (MONTHLY, YEARLY)")
    val partitionInterval: String,
    
    @Schema(description = "Whether to alert on audit failures")
    val alertOnFailures: Boolean,
    
    @Schema(description = "Maximum failed audits per hour before alerting", example = "100")
    val maxFailedAuditsPerHour: Int,
    
    @Schema(description = "When this configuration was created")
    val createdAt: LocalDateTime?,
    
    @Schema(description = "When this configuration was last updated")
    val updatedAt: LocalDateTime?,
    
    @Schema(description = "User who last updated this configuration")
    val updatedBy: UUID?
)

/**
 * Extension function to convert AuditConfiguration entity to DTO
 */
fun AuditConfiguration.toDto(): AuditConfigurationDto {
    return AuditConfigurationDto(
        id = id,
        retentionPolicyDays = retentionPolicyDays,
        cleanupEnabled = cleanupEnabled,
        batchSize = batchSize,
        asyncEnabled = asyncEnabled,
        immutableRecords = immutableRecords,
        legalHoldDefaultDays = legalHoldDefaultDays,
        partitionEnabled = partitionEnabled,
        partitionInterval = partitionInterval,
        alertOnFailures = alertOnFailures,
        maxFailedAuditsPerHour = maxFailedAuditsPerHour,
        createdAt = createdAt,
        updatedAt = updatedAt,
        updatedBy = updatedBy
    )
}

/**
 * Extension function to convert DTO to AuditConfiguration entity
 */
fun AuditConfigurationDto.toEntity(): AuditConfiguration {
    return AuditConfiguration(
        retentionPolicyDays = retentionPolicyDays,
        cleanupEnabled = cleanupEnabled,
        batchSize = batchSize,
        asyncEnabled = asyncEnabled,
        immutableRecords = immutableRecords,
        legalHoldDefaultDays = legalHoldDefaultDays,
        partitionEnabled = partitionEnabled,
        partitionInterval = partitionInterval,
        alertOnFailures = alertOnFailures,
        maxFailedAuditsPerHour = maxFailedAuditsPerHour,
        updatedBy = updatedBy
    ).apply {
        // Set ID if provided (for updates)
        this@apply.id = this@toEntity.id
    }
}

/**
 * Request DTO for updating audit configuration
 */
@Schema(description = "Request for updating audit configuration")
data class UpdateAuditConfigurationRequest(
    @Schema(description = "Retention policy in days (minimum 365)", example = "2555")
    val retentionPolicyDays: Int?,
    
    @Schema(description = "Whether automatic cleanup is enabled")
    val cleanupEnabled: Boolean?,
    
    @Schema(description = "Batch size for audit processing (1-10000)", example = "1000")
    val batchSize: Int?,
    
    @Schema(description = "Whether asynchronous processing is enabled")
    val asyncEnabled: Boolean?,
    
    @Schema(description = "Default legal hold period in days (minimum 1095)", example = "3650")
    val legalHoldDefaultDays: Int?,
    
    @Schema(description = "Whether table partitioning is enabled")
    val partitionEnabled: Boolean?,
    
    @Schema(description = "Partition interval (MONTHLY, YEARLY)")
    val partitionInterval: String?,
    
    @Schema(description = "Whether to alert on audit failures")
    val alertOnFailures: Boolean?,
    
    @Schema(description = "Maximum failed audits per hour before alerting (1-1000)", example = "100")
    val maxFailedAuditsPerHour: Int?
) {
    
    /**
     * Validates the configuration request
     */
    fun validate(): List<String> {
        val errors = mutableListOf<String>()
        
        retentionPolicyDays?.let { days ->
            if (days < 365) {
                errors.add("Retention policy must be at least 365 days")
            }
            if (days > 36500) { // 100 years
                errors.add("Retention policy cannot exceed 36500 days (100 years)")
            }
        }
        
        batchSize?.let { size ->
            if (size < 1 || size > 10000) {
                errors.add("Batch size must be between 1 and 10000")
            }
        }
        
        legalHoldDefaultDays?.let { days ->
            if (days < 1095) { // 3 years minimum
                errors.add("Legal hold default period must be at least 1095 days (3 years)")
            }
        }
        
        partitionInterval?.let { interval ->
            if (interval !in listOf("MONTHLY", "YEARLY")) {
                errors.add("Partition interval must be MONTHLY or YEARLY")
            }
        }
        
        maxFailedAuditsPerHour?.let { max ->
            if (max < 1 || max > 1000) {
                errors.add("Max failed audits per hour must be between 1 and 1000")
            }
        }
        
        return errors
    }
    
    /**
     * Applies the changes to an existing configuration
     */
    fun applyTo(existing: AuditConfiguration): AuditConfiguration {
        return existing.apply {
            retentionPolicyDays?.let { this.retentionPolicyDays = it }
            cleanupEnabled?.let { this.cleanupEnabled = it }
            batchSize?.let { this.batchSize = it }
            asyncEnabled?.let { this.asyncEnabled = it }
            legalHoldDefaultDays?.let { this.legalHoldDefaultDays = it }
            partitionEnabled?.let { this.partitionEnabled = it }
            partitionInterval?.let { this.partitionInterval = it }
            alertOnFailures?.let { this.alertOnFailures = it }
            maxFailedAuditsPerHour?.let { this.maxFailedAuditsPerHour = it }
        }
    }
}