package dev.ryuzu.astermanagement.config

import dev.ryuzu.astermanagement.controller.OperationWebSocketController
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.stereotype.Component
import org.springframework.web.socket.messaging.SessionConnectedEvent
import org.springframework.web.socket.messaging.SessionDisconnectEvent
import org.springframework.web.socket.messaging.SessionSubscribeEvent
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent

/**
 * WebSocket event listener for handling connection lifecycle and subscription management.
 * Manages operation progress subscriptions and cleanup.
 */
@Component
class WebSocketEventListener(
    private val operationWebSocketController: OperationWebSocketController
) {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    @EventListener
    fun handleWebSocketConnectListener(event: SessionConnectedEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val user = headerAccessor.user
        
        logger.info("WebSocket connection established - Session: $sessionId, User: ${user?.name ?: "Anonymous"}")
    }
    
    @EventListener
    fun handleWebSocketDisconnectListener(event: SessionDisconnectEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val user = headerAccessor.user
        
        if (sessionId != null) {
            // Remove subscriber from all operation subscriptions
            operationWebSocketController.removeSubscriber(sessionId)
        }
        
        logger.info("WebSocket connection closed - Session: $sessionId, User: ${user?.name ?: "Anonymous"}")
    }
    
    @EventListener
    fun handleWebSocketSubscribeListener(event: SessionSubscribeEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val destination = headerAccessor.destination
        val user = headerAccessor.user
        
        logger.debug("WebSocket subscription - Session: $sessionId, Destination: $destination, User: ${user?.name ?: "Anonymous"}")
        
        // Track subscription metrics if needed
        when {
            destination?.startsWith("/operations/") == true && destination.endsWith("/progress") -> {
                logger.info("User ${user?.name} subscribed to operation progress updates")
            }
            destination == "/operations/queue/status" -> {
                logger.info("User ${user?.name} subscribed to queue status updates")
            }
            destination == "/operations/user/updates" -> {
                logger.info("User ${user?.name} subscribed to user operation updates")
            }
        }
    }
    
    @EventListener
    fun handleWebSocketUnsubscribeListener(event: SessionUnsubscribeEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val user = headerAccessor.user
        
        logger.debug("WebSocket unsubscribe - Session: $sessionId, User: ${user?.name ?: "Anonymous"}")
    }
}