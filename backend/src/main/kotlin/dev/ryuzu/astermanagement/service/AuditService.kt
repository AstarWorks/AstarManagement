package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.time.Instant
import java.time.LocalDateTime
import java.util.*
import jakarta.servlet.http.HttpServletRequest

/**
 * Audit action types as specified in R03 requirements
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
     * Records matter status changes with enum types and returns audit ID
     * Enhanced version for status transition service with full R03 compliance
     */
    fun recordMatterStatusChange(
        matterId: UUID,
        oldStatus: MatterStatus,
        newStatus: MatterStatus,
        userId: UUID,
        reason: String? = null
    ): UUID {
        val auditId = UUID.randomUUID()
        val timestamp = Instant.now()
        val username = getCurrentUsername() ?: "system"
        
        // Get HTTP request context for additional audit fields
        val requestAttributes = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes
        val request = requestAttributes?.request
        
        val ipAddress = getClientIpAddress(request)
        val userAgent = request?.getHeader("User-Agent") ?: "Unknown"
        val sessionId = request?.session?.id ?: "No-Session"
        
        val description = if (reason != null) {
            "Status changed from $oldStatus to $newStatus. Reason: $reason"
        } else {
            "Status changed from $oldStatus to $newStatus"
        }
        
        // Enhanced logging with audit ID and full R03 compliance context
        logger.info(
            "AUDIT: [{}] Matter {} - STATUS_CHANGE by user {} (ID: {}) at {} from IP {} ({}): {}",
            auditId, matterId, username, userId, timestamp, ipAddress, userAgent, description
        )
        
        logger.info("AUDIT: [{}] Matter {} - Change: '{}' -> '{}' | Session: {} | IP: {}", 
            auditId, matterId, oldStatus, newStatus, sessionId, ipAddress)
        
        // Store comprehensive audit record with R03 compliance
        recordR03CompliantAuditLog(
            auditId = auditId,
            matterId = matterId,
            action = AuditAction.STATUS_CHANGE,
            fieldName = "status",
            oldValue = oldStatus.name,
            newValue = newStatus.name,
            performedAt = timestamp,
            performedBy = userId,
            performedByName = username,
            ipAddress = ipAddress,
            userAgent = userAgent,
            sessionId = sessionId,
            reason = reason
        )
        
        return auditId
    }
    
    /**
     * Records R03 compliant audit log entry with all required fields
     */
    private fun recordR03CompliantAuditLog(
        auditId: UUID,
        matterId: UUID,
        action: AuditAction,
        fieldName: String?,
        oldValue: String?,
        newValue: String?,
        performedAt: Instant,
        performedBy: UUID,
        performedByName: String,
        ipAddress: String,
        userAgent: String,
        sessionId: String,
        reason: String? = null
    ) {
        // Enhanced structured logging for R03 compliance
        logger.info(
            "R03_AUDIT: {{ \"auditId\": \"{}\", \"matterId\": \"{}\", \"action\": \"{}\", " +
            "\"fieldName\": \"{}\", \"oldValue\": \"{}\", \"newValue\": \"{}\", " +
            "\"performedAt\": \"{}\", \"performedBy\": \"{}\", \"performedByName\": \"{}\", " +
            "\"ipAddress\": \"{}\", \"userAgent\": \"{}\", \"sessionId\": \"{}\", \"reason\": \"{}\" }}",
            auditId, matterId, action, fieldName, oldValue, newValue,
            performedAt, performedBy, performedByName, ipAddress, userAgent, sessionId, reason ?: ""
        )
        
        // TODO: Store in R03 compliant audit table
        // In production, this should create a MatterAuditLog entity with all fields:
        // - id (auditId), matterId, action, fieldName, oldValue, newValue
        // - performedAt, performedBy, performedByName
        // - ipAddress, userAgent, sessionId
        // This data should be stored in an immutable, append-only audit table
    }
    
    /**
     * Extracts client IP address from request with proxy support
     */
    private fun getClientIpAddress(request: HttpServletRequest?): String {
        if (request == null) return "Unknown"
        
        // Check for IP behind proxy
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            return xForwardedFor.split(",")[0].trim()
        }
        
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp
        }
        
        return request.remoteAddr ?: "Unknown"
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