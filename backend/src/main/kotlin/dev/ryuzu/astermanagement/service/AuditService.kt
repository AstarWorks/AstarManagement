package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.*

/**
 * Service for audit logging and activity tracking
 * Provides comprehensive audit trail for all business operations
 */
@Service
class AuditService : BaseService() {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Records a generic audit event
     */
    fun recordEvent(
        entityType: String,
        entityId: UUID,
        action: String,
        description: String,
        oldValue: String? = null,
        newValue: String? = null
    ) {
        val userId = getCurrentUserId()
        val username = getCurrentUsername() ?: "system"
        val timestamp = LocalDateTime.now()
        
        // Log to application log
        logger.info(
            "AUDIT: {} {} - {} by user {} (ID: {}) at {}: {}",
            entityType, entityId, action, username, userId, timestamp, description
        )
        
        // TODO: Store in audit table/database
        // For now, we're just logging to application logs
        // In production, this should store to a dedicated audit table
        
        if (oldValue != null && newValue != null) {
            logger.info("AUDIT: {} {} - Change: '{}' -> '{}'", entityType, entityId, oldValue, newValue)
        }
    }
    
    /**
     * Records matter-specific audit events
     */
    fun recordMatterEvent(
        matterId: UUID,
        action: String,
        description: String,
        oldValue: String? = null,
        newValue: String? = null
    ) {
        recordEvent("Matter", matterId, action, description, oldValue, newValue)
    }
    
    /**
     * Records matter status changes with detailed tracking
     */
    fun recordMatterStatusChange(
        matterId: UUID,
        oldStatus: String,
        newStatus: String,
        reason: String? = null
    ) {
        val description = if (reason != null) {
            "Status changed from $oldStatus to $newStatus. Reason: $reason"
        } else {
            "Status changed from $oldStatus to $newStatus"
        }
        
        recordMatterEvent(matterId, "STATUS_CHANGE", description, oldStatus, newStatus)
    }
    
    /**
     * Records user authentication events
     */
    fun recordAuthenticationEvent(username: String, action: String, success: Boolean, details: String? = null) {
        val status = if (success) "SUCCESS" else "FAILURE"
        val description = "Authentication $action - $status${details?.let { ": $it" } ?: ""}"
        
        logger.info("AUDIT: Authentication - {} for user {} at {}: {}", 
            action, username, LocalDateTime.now(), description)
    }
    
    /**
     * Records security violations and access attempts
     */
    fun recordSecurityEvent(
        entityType: String,
        entityId: UUID?,
        action: String,
        violation: String,
        details: String? = null
    ) {
        val userId = getCurrentUserId()
        val username = getCurrentUsername() ?: "anonymous"
        val timestamp = LocalDateTime.now()
        
        logger.warn(
            "SECURITY AUDIT: {} {} - {} by user {} (ID: {}) at {}: {}{}",
            entityType, entityId ?: "N/A", action, username, userId, timestamp, violation,
            details?.let { " - $it" } ?: ""
        )
    }
    
    /**
     * Records data access events for compliance
     */
    fun recordDataAccess(
        entityType: String,
        entityId: UUID,
        accessType: String, // READ, EXPORT, PRINT, etc.
        reason: String? = null
    ) {
        val description = "Data $accessType${reason?.let { " - $it" } ?: ""}"
        recordEvent(entityType, entityId, "DATA_ACCESS", description)
    }
    
    /**
     * Records bulk operations for administrative tracking
     */
    fun recordBulkOperation(
        entityType: String,
        action: String,
        count: Int,
        criteria: String? = null
    ) {
        val description = "Bulk $action on $count $entityType records${criteria?.let { " - Criteria: $it" } ?: ""}"
        
        logger.info(
            "AUDIT: Bulk Operation - {} by user {} (ID: {}) at {}: {}",
            action, getCurrentUsername() ?: "system", getCurrentUserId(), LocalDateTime.now(), description
        )
    }
}