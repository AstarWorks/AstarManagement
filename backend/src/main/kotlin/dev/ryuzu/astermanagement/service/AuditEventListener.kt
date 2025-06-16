package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.config.AuditContext
import dev.ryuzu.astermanagement.config.AuditContextProvider
import dev.ryuzu.astermanagement.domain.audit.*
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.net.InetAddress

/**
 * Event listener for processing audit events and persisting them to the database
 * Handles all audit events asynchronously to avoid blocking main business operations
 */
@Component
class AuditEventListener(
    private val auditLogService: AuditLogService,
    private val auditContextProvider: AuditContextProvider
) {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Handles all audit events in a unified way
     * Processes events asynchronously and persists them to the audit_logs table
     */
    @EventListener
    @Async("auditTaskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun handleAuditEvent(event: AuditEvent) {
        try {
            val context = auditContextProvider.getCurrentContext()
            processAuditEvent(event, context)
        } catch (e: Exception) {
            logger.error("Failed to process audit event: ${event.eventType} for ${event.entityType}:${event.entityId}", e)
            handleAuditEventFailure(event, e)
        }
    }
    
    /**
     * Processes individual audit event and persists to database
     */
    private fun processAuditEvent(event: AuditEvent, context: AuditContext) {
        logger.debug("Processing audit event: ${event.eventType} for ${event.entityType}:${event.entityId}")
        
        // Create audit log request from event
        val auditLogRequest = event.toAuditLogRequest(context)
        
        // Enhance with additional context
        val enhancedRequest = enhanceAuditLogRequest(auditLogRequest, context, event)
        
        // Save to database
        val savedAuditLog = auditLogService.saveAuditLog(enhancedRequest)
        
        logger.debug("Saved audit log with ID: ${savedAuditLog.id} for event: ${event.eventType}")
        
        // Perform any post-processing
        postProcessAuditEvent(event, savedAuditLog, context)
    }
    
    /**
     * Enhances audit log request with additional context and event-specific data
     */
    private fun enhanceAuditLogRequest(
        request: AuditLogRequest,
        context: AuditContext,
        event: AuditEvent
    ): AuditLogRequest {
        val enhancedDetails = request.eventDetails.toMutableMap()
        val oldValues = mutableMapOf<String, Any?>()
        val newValues = mutableMapOf<String, Any?>()
        
        // Add event-specific data to old/new values based on event type
        when (event) {
            is AuditEvent.MatterStatusChanged -> {
                oldValues["status"] = event.oldStatus
                newValues["status"] = event.newStatus
                enhancedDetails["changeReason"] = event.reason
            }
            is AuditEvent.MatterUpdated -> {
                oldValues.putAll(event.oldValues)
                newValues.putAll(event.newValues)
                enhancedDetails["fieldsChanged"] = event.fieldsChanged
                enhancedDetails["changeReason"] = event.reason
            }
            is AuditEvent.DocumentAccessed -> {
                enhancedDetails["accessType"] = event.accessType.name
                enhancedDetails["documentName"] = event.documentName
                enhancedDetails["matterId"] = event.matterId
            }
            is AuditEvent.DocumentUploaded -> {
                newValues["documentName"] = event.documentName
                newValues["documentType"] = event.documentType
                newValues["fileSize"] = event.fileSize
                enhancedDetails["matterId"] = event.matterId
            }
            is AuditEvent.AuthenticationFailed -> {
                enhancedDetails["attemptedUsername"] = event.attemptedUsername
                enhancedDetails["failureReason"] = event.failureReason
                enhancedDetails["sourceIpAddress"] = event.ipAddress
            }
            is AuditEvent.AuthorizationDenied -> {
                enhancedDetails["resourceAccessed"] = event.resourceAccessed
                enhancedDetails["requiredPermission"] = event.requiredPermission
                enhancedDetails["userPermissions"] = event.userPermissions
                enhancedDetails["username"] = event.username
            }
            is AuditEvent.SecurityEvent -> {
                enhancedDetails["securityEventType"] = event.eventSubType.name
                enhancedDetails["success"] = event.success
                enhancedDetails["resourceAccessed"] = event.resourceAccessed
                enhancedDetails["details"] = event.details
            }
            is AuditEvent.BulkOperation -> {
                enhancedDetails["operationType"] = event.operationType
                enhancedDetails["affectedEntityIds"] = event.affectedEntityIds
                enhancedDetails["criteria"] = event.criteria
                enhancedDetails["recordCount"] = event.recordCount
            }
            is AuditEvent.DataExport -> {
                enhancedDetails["exportType"] = event.exportType
                enhancedDetails["exportFormat"] = event.exportFormat
                enhancedDetails["recordCount"] = event.recordCount
            }
            else -> {
                // Handle other event types generically
                logger.debug("Processing generic audit event: ${event.eventType}")
            }
        }
        
        // Add timing information
        enhancedDetails["processedAt"] = System.currentTimeMillis()
        enhancedDetails["processingLatency"] = System.currentTimeMillis() - event.timestamp.toInstant().toEpochMilli()
        
        return request.copy(
            userName = getUserNameFromEvent(event),
            ipAddress = parseIpAddress(context.ipAddress),
            userAgent = context.userAgent,
            sessionId = context.sessionId,
            requestId = context.requestId,
            eventDetails = enhancedDetails,
            oldValues = if (oldValues.isNotEmpty()) oldValues else null,
            newValues = if (newValues.isNotEmpty()) newValues else null
        )
    }
    
    /**
     * Extracts username from audit event where available
     */
    private fun getUserNameFromEvent(event: AuditEvent): String? {
        return when (event) {
            is AuditEvent.UserLogin -> event.username
            is AuditEvent.UserLogout -> event.username
            is AuditEvent.AuthorizationDenied -> event.username
            is AuditEvent.AuthenticationFailed -> event.attemptedUsername
            else -> null
        }
    }
    
    /**
     * Safely parses IP address string to InetAddress
     */
    private fun parseIpAddress(ipAddressString: String?): InetAddress? {
        return try {
            if (ipAddressString.isNullOrBlank()) null
            else InetAddress.getByName(ipAddressString)
        } catch (e: Exception) {
            logger.debug("Could not parse IP address: $ipAddressString", e)
            null
        }
    }
    
    /**
     * Performs post-processing after audit event is saved
     */
    private fun postProcessAuditEvent(event: AuditEvent, auditLog: AuditLog, context: AuditContext) {
        try {
            // Check for security alerts
            checkSecurityAlerts(event, auditLog, context)
            
            // Update audit statistics
            updateAuditStatistics(event, auditLog)
            
            // Trigger any business rules based on audit events
            triggerBusinessRules(event, auditLog)
            
        } catch (e: Exception) {
            logger.warn("Error in post-processing audit event: ${event.eventType}", e)
        }
    }
    
    /**
     * Checks for security alerts based on audit events
     */
    private fun checkSecurityAlerts(event: AuditEvent, auditLog: AuditLog, context: AuditContext) {
        when (event) {
            is AuditEvent.AuthenticationFailed -> {
                // Check for brute force attacks
                checkBruteForceAttempts(event.attemptedUsername, context.ipAddress)
            }
            is AuditEvent.AuthorizationDenied -> {
                // Check for privilege escalation attempts
                checkPrivilegeEscalation(event.userId, event.resourceAccessed)
            }
            is AuditEvent.SecurityEvent -> {
                if (!event.success) {
                    // Log security failures for monitoring
                    logSecurityFailure(event, context)
                }
            }
            is AuditEvent.BulkOperation -> {
                // Monitor for suspicious bulk operations
                checkSuspiciousBulkOperations(event, context)
            }
            else -> {
                // No specific security checks for other events
            }
        }
    }
    
    /**
     * Updates audit statistics for monitoring dashboards
     */
    private fun updateAuditStatistics(event: AuditEvent, auditLog: AuditLog) {
        // This could update real-time metrics, counters, etc.
        logger.trace("Updated audit statistics for event: ${event.eventType}")
    }
    
    /**
     * Triggers business rules based on audit events
     */
    private fun triggerBusinessRules(event: AuditEvent, auditLog: AuditLog) {
        when (event) {
            is AuditEvent.MatterStatusChanged -> {
                // Could trigger notifications, SLA checks, etc.
                logger.debug("Matter status changed: ${event.matterId} from ${event.oldStatus} to ${event.newStatus}")
            }
            is AuditEvent.DocumentUploaded -> {
                // Could trigger document processing, indexing, etc.
                logger.debug("Document uploaded: ${event.documentId} for matter ${event.matterId}")
            }
            else -> {
                // No specific business rules for other events
            }
        }
    }
    
    /**
     * Handles audit event processing failures
     */
    private fun handleAuditEventFailure(event: AuditEvent, exception: Exception) {
        logger.error("Failed to process audit event: ${event.eventType}", exception)
        
        try {
            // Store failed event for manual review or retry
            storeFailedAuditEvent(event, exception)
            
            // Could also send alert to monitoring system
            // alertingService.sendAuditFailureAlert(event, exception)
            
        } catch (e: Exception) {
            logger.error("Failed to store failed audit event", e)
        }
    }
    
    /**
     * Stores failed audit events for later processing
     */
    private fun storeFailedAuditEvent(event: AuditEvent, exception: Exception) {
        // In production, this could store to a dead letter table or external queue
        logger.error("Storing failed audit event for later processing: ${event.eventType} - ${exception.message}")
    }
    
    /**
     * Security monitoring methods
     */
    private fun checkBruteForceAttempts(username: String, ipAddress: String?) {
        // Implementation would check recent failed attempts from same IP/username
        logger.debug("Checking brute force attempts for username: $username from IP: $ipAddress")
    }
    
    private fun checkPrivilegeEscalation(userId: String, resource: String) {
        // Implementation would analyze access patterns for privilege escalation
        logger.debug("Checking privilege escalation for user: $userId accessing: $resource")
    }
    
    private fun logSecurityFailure(event: AuditEvent.SecurityEvent, context: AuditContext) {
        logger.warn("Security event failure: ${event.eventSubType} - ${event.details} from IP: ${context.ipAddress}")
    }
    
    private fun checkSuspiciousBulkOperations(event: AuditEvent.BulkOperation, context: AuditContext) {
        if (event.recordCount > 100) {
            logger.warn("Large bulk operation detected: ${event.operationType} affecting ${event.recordCount} records by user ${event.userId}")
        }
    }
}