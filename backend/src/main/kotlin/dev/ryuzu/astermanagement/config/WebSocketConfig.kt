package dev.ryuzu.astermanagement.config

import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

/**
 * WebSocket configuration for real-time communication
 * Enables WebSocket messaging with STOMP protocol for upload progress tracking
 */
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig : WebSocketMessageBrokerConfigurer {
    
    /**
     * Configure the message broker for handling WebSocket messages
     */
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        // Enable simple broker for broadcasting messages to subscribed clients
        config.enableSimpleBroker("/topic", "/queue")
        
        // Set application destination prefix for client-to-server messages
        config.setApplicationDestinationPrefixes("/app")
        
        // Set user destination prefix for user-specific messages
        config.setUserDestinationPrefix("/user")
    }
    
    /**
     * Register STOMP endpoints for WebSocket connection
     */
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        // Register WebSocket endpoint with SockJS fallback
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*") // Allow all origins in development
            .withSockJS()
        
        // Register additional endpoint without SockJS for native WebSocket clients
        registry.addEndpoint("/ws-native")
            .setAllowedOriginPatterns("*")
    }
}