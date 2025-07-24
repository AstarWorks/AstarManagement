package dev.ryuzu.astermanagement.websocket

/**
 * Interface for managing WebSocket sessions and subscriptions
 * 
 * This interface breaks the circular dependency between config and controller packages
 * by providing a common contract for session management operations.
 */
interface WebSocketSessionManager {
    
    /**
     * Remove a subscriber session from all subscriptions
     * Called when a WebSocket session disconnects
     * 
     * @param sessionId The session ID to remove
     */
    fun removeSubscriber(sessionId: String)
    
    /**
     * Add a subscriber to an operation
     * 
     * @param operationId The operation ID
     * @param sessionId The session ID to add
     */
    fun addSubscriber(operationId: String, sessionId: String)
    
    /**
     * Get the number of active subscribers for an operation
     * 
     * @param operationId The operation ID
     * @return Number of active subscribers
     */
    fun getSubscriberCount(operationId: String): Int
}