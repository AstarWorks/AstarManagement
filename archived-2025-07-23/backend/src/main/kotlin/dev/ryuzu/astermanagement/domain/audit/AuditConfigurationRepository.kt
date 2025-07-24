package dev.ryuzu.astermanagement.domain.audit

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Repository for audit configuration operations
 * Manages system-wide audit behavior settings
 */
@Repository
interface AuditConfigurationRepository : JpaRepository<AuditConfiguration, UUID> {
    
    /**
     * Get the current active audit configuration
     * Returns the most recently created configuration
     */
    @Query("SELECT ac FROM AuditConfiguration ac ORDER BY ac.createdAt DESC")
    fun findCurrentConfiguration(): AuditConfiguration?
    
    /**
     * Check if async audit logging is enabled
     */
    @Query("SELECT ac.asyncEnabled FROM AuditConfiguration ac ORDER BY ac.createdAt DESC")
    fun isAsyncEnabled(): Boolean?
    
    /**
     * Check if cleanup is enabled
     */
    @Query("SELECT ac.cleanupEnabled FROM AuditConfiguration ac ORDER BY ac.createdAt DESC")
    fun isCleanupEnabled(): Boolean?
    
    /**
     * Get current retention policy in days
     */
    @Query("SELECT ac.retentionPolicyDays FROM AuditConfiguration ac ORDER BY ac.createdAt DESC")
    fun getCurrentRetentionDays(): Int?
    
    /**
     * Get current batch size for audit processing
     */
    @Query("SELECT ac.batchSize FROM AuditConfiguration ac ORDER BY ac.createdAt DESC")
    fun getCurrentBatchSize(): Int?
}