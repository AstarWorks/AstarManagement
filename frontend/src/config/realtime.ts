/**
 * Real-time configuration for the Kanban board
 * Defines polling and WebSocket settings
 */
export const realtimeConfig = {
  // Operating mode: 'polling' for stability, 'websocket' for real-time
  mode: 'polling' as 'polling' | 'websocket',
  
  // Polling configuration
  polling: {
    interval: 5000, // 5 seconds
    maxRetries: 3,
    backoffMultiplier: 2,
    maxBackoffDelay: 30000 // 30 seconds
  },
  
  // WebSocket configuration (for future use)
  websocket: {
    url: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    reconnect: true,
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    protocols: ['v1.kanban.aster']
  },
  
  // Performance optimizations
  performance: {
    debounceUpdates: 100, // Debounce rapid updates by 100ms
    batchUpdates: true, // Batch multiple updates in same tick
    maxUpdateHistory: 100, // Keep last 100 updates in memory
    virtualScrollThreshold: 50 // Use virtual scrolling for > 50 items
  },
  
  // Security settings
  security: {
    validateSchema: true, // Validate incoming updates against schema
    rateLimitPerMinute: 60, // Max 60 updates per minute
    sanitizeContent: true, // Sanitize user-generated content
    requireAuthentication: true // Require auth for all real-time connections
  }
}