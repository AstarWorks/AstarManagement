package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.dto.operation.OperationProgressUpdate
import dev.ryuzu.astermanagement.service.OperationService
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SubscribeMapping
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Controller
import java.util.*
import java.util.concurrent.ConcurrentHashMap

/**
 * WebSocket controller for real-time operation progress updates.
 * Handles WebSocket subscriptions and progress broadcasting.
 */
@Controller
class OperationWebSocketController(
    private val operationService: OperationService,
    private val simpMessagingTemplate: SimpMessagingTemplate
) {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    // Track active subscribers for operations
    private val operationSubscribers = ConcurrentHashMap<UUID, MutableSet<String>>()
    
    /**
     * Handle subscription to operation progress updates
     */
    @SubscribeMapping("/operations/{operationId}/progress")
    fun subscribeToOperationProgress(
        @DestinationVariable operationId: UUID,
        headerAccessor: SimpMessageHeaderAccessor
    ): OperationProgressUpdate? {
        val sessionId = headerAccessor.sessionId ?: return null
        val authentication = headerAccessor.user as? Authentication
        
        if (authentication == null) {
            logger.warn("Unauthenticated user trying to subscribe to operation $operationId")
            return null
        }
        
        // Check if user can access this operation
        val operation = operationService.getOperationById(operationId)
        if (operation == null) {
            logger.warn("User ${authentication.name} trying to subscribe to non-existent operation $operationId")
            return null
        }
        
        // TODO: Add proper security check
        // if (!canUserAccessOperation(authentication, operation)) {
        //     logger.warn("User ${authentication.name} not authorized to access operation $operationId")
        //     return null
        // }
        
        // Add subscriber
        operationSubscribers.computeIfAbsent(operationId) { mutableSetOf() }.add(sessionId)
        
        logger.info("User ${authentication.name} subscribed to operation $operationId progress (session: $sessionId)")
        
        // Return current progress
        return OperationProgressUpdate(
            operationId = operationId,
            current = operation.progressCurrent,
            total = operation.progressTotal,
            message = operation.progressMessage
        )
    }
    
    /**
     * Handle subscription to operation queue status
     */
    @SubscribeMapping("/operations/queue/status")
    fun subscribeToQueueStatus(
        headerAccessor: SimpMessageHeaderAccessor
    ): Any? {
        val authentication = headerAccessor.user as? Authentication
        
        if (authentication == null) {
            logger.warn("Unauthenticated user trying to subscribe to queue status")
            return null
        }
        
        logger.info("User ${authentication.name} subscribed to queue status")
        
        // Return current queue status
        return operationService.getQueueStatus()
    }
    
    /**
     * Handle subscription to user's operation updates
     */
    @SubscribeMapping("/operations/user/updates")
    fun subscribeToUserOperations(
        headerAccessor: SimpMessageHeaderAccessor
    ): Any? {
        val authentication = headerAccessor.user as? Authentication
        
        if (authentication == null) {
            logger.warn("Unauthenticated user trying to subscribe to user operations")
            return null
        }
        
        logger.info("User ${authentication.name} subscribed to user operation updates")
        
        // Return acknowledgment
        return mapOf(
            "message" to "Subscribed to user operation updates",
            "timestamp" to System.currentTimeMillis()
        )
    }
    
    /**
     * Handle manual progress update requests (for testing)
     */
    @MessageMapping("/operations/{operationId}/update-progress")
    @SendTo("/topic/operations/{operationId}/progress")
    fun updateOperationProgress(
        @DestinationVariable operationId: UUID,
        progressUpdate: OperationProgressUpdate,
        headerAccessor: SimpMessageHeaderAccessor
    ): OperationProgressUpdate? {
        val authentication = headerAccessor.user as? Authentication
        
        if (authentication == null) {
            logger.warn("Unauthenticated progress update for operation $operationId")
            return null
        }
        
        // Update progress in service
        val success = operationService.updateProgress(
            operationId,
            progressUpdate.current,
            progressUpdate.total,
            progressUpdate.message
        )
        
        if (success) {
            logger.debug("Progress updated for operation $operationId: ${progressUpdate.current}/${progressUpdate.total}")
            return progressUpdate
        }
        
        return null
    }
    
    /**
     * Broadcast operation progress update to all subscribers
     */
    fun broadcastOperationProgress(
        operationId: UUID,
        current: Int,
        total: Int,
        message: String? = null
    ) {
        val subscribers = operationSubscribers[operationId]
        if (subscribers?.isEmpty() != false) {
            // No subscribers for this operation
            return
        }
        
        val update = OperationProgressUpdate(
            operationId = operationId,
            current = current,
            total = total,
            message = message
        )
        
        try {
            simpMessagingTemplate.convertAndSend("/topic/operations/$operationId/progress", update)
            logger.debug("Broadcasted progress update for operation $operationId to ${subscribers.size} subscribers")
        } catch (e: Exception) {
            logger.error("Failed to broadcast progress update for operation $operationId", e)
        }
    }
    
    /**
     * Broadcast operation status change to user
     */
    fun broadcastOperationStatusChange(
        userId: UUID,
        operationId: UUID,
        newStatus: String,
        message: String? = null
    ) {
        val statusUpdate = mapOf(
            "operationId" to operationId,
            "status" to newStatus,
            "message" to message,
            "timestamp" to System.currentTimeMillis()
        )
        
        try {
            simpMessagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/operations/status",
                statusUpdate
            )
            logger.debug("Broadcasted status change for operation $operationId to user $userId")
        } catch (e: Exception) {
            logger.error("Failed to broadcast status change for operation $operationId to user $userId", e)
        }
    }
    
    /**
     * Broadcast queue status update to all queue subscribers
     */
    fun broadcastQueueStatus() {
        try {
            val queueStatus = operationService.getQueueStatus()
            simpMessagingTemplate.convertAndSend("/topic/operations/queue/status", queueStatus)
            logger.debug("Broadcasted queue status update")
        } catch (e: Exception) {
            logger.error("Failed to broadcast queue status update", e)
        }
    }
    
    /**
     * Remove subscriber when session disconnects
     */
    fun removeSubscriber(sessionId: String) {
        operationSubscribers.values.forEach { subscribers ->
            subscribers.remove(sessionId)
        }
        
        // Clean up empty operation subscriber sets
        operationSubscribers.entries.removeIf { (_, subscribers) ->
            subscribers.isEmpty()
        }
        
        logger.debug("Removed session $sessionId from all operation subscriptions")
    }
    
    /**
     * Get active subscriber count for an operation
     */
    fun getSubscriberCount(operationId: UUID): Int {
        return operationSubscribers[operationId]?.size ?: 0
    }
    
    /**
     * Get all active operations with subscribers
     */
    fun getActiveOperations(): Set<UUID> {
        return operationSubscribers.keys.toSet()
    }
}