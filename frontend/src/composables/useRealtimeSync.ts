/**
 * Realtime Sync Composable
 * 
 * @description Enhanced WebSocket integration with TanStack Query for real-time
 * data synchronization. Provides automatic reconnection, message queuing, and
 * intelligent cache updates based on WebSocket events.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useWebSocketConnection } from './useWebSocketConnection'
import { WEBSOCKET_CONFIG } from '~/config/background-sync'
import { queryKeys } from '~/types/query'
import type { Matter } from '~/types/matter'

/**
 * WebSocket message types
 */
export interface WSMessage {
  id: string
  type: string
  payload: any
  timestamp: number
  userId?: string
  version?: number
}

/**
 * Connection state
 */
export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  reconnectAttempts: number
  lastError?: Error
  lastConnectedAt?: number
  lastDisconnectedAt?: number
}

/**
 * Message queue for offline support
 */
interface QueuedMessage {
  message: WSMessage
  timestamp: number
  attempts: number
}

/**
 * Realtime sync with intelligent reconnection and caching
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  
  // Connection state
  const connectionState = ref<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0
  })
  
  // Message handling
  const messageQueue = ref<QueuedMessage[]>([])
  const lastReceivedMessage = ref<WSMessage | null>(null)
  const messageCount = ref(0)
  
  // Performance metrics
  const latency = ref<number | null>(null)
  const messagesPerMinute = ref(0)
  
  // WebSocket connection
  let ws: ReturnType<typeof useWebSocketConnection> | null = null
  let reconnectTimer: NodeJS.Timeout | null = null
  let pingInterval: NodeJS.Timeout | null = null
  let messageRateInterval: NodeJS.Timeout | null = null
  
  // Message timestamps for rate calculation
  const messageTimestamps: number[] = []
  
  /**
   * Calculate reconnection delay with exponential backoff
   */
  const getReconnectDelay = (attempts: number): number => {
    const { initialDelay, maxDelay, backoffMultiplier } = WEBSOCKET_CONFIG.reconnection
    const delay = Math.min(
      initialDelay * Math.pow(backoffMultiplier, attempts),
      maxDelay
    )
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000
  }
  
  /**
   * Initialize WebSocket connection
   */
  const connect = () => {
    if (ws || connectionState.value.status === 'connecting') return
    
    connectionState.value.status = 'connecting'
    
    try {
      ws = useWebSocketConnection({
        url: WEBSOCKET_CONFIG.endpoint,
        reconnect: false, // We handle reconnection manually
        protocols: ['v1.aster.realtime']
      })
      
      // Connection established
      ws.on('connected', () => {
        connectionState.value = {
          status: 'connected',
          reconnectAttempts: 0,
          lastConnectedAt: Date.now()
        }
        
        // Start heartbeat
        startHeartbeat()
        
        // Process queued messages
        processMessageQueue()
        
        // Request initial sync
        send({
          type: 'sync:request',
          payload: {
            lastSync: getLastSyncTimestamp()
          }
        })
      })
      
      // Connection lost
      ws.on('disconnected', () => {
        connectionState.value = {
          ...connectionState.value,
          status: 'disconnected',
          lastDisconnectedAt: Date.now()
        }
        
        stopHeartbeat()
        scheduleReconnect()
      })
      
      // Connection error
      ws.on('error', (error: Error) => {
        connectionState.value = {
          ...connectionState.value,
          status: 'error',
          lastError: error
        }
        
        console.error('WebSocket error:', error)
      })
      
      // Handle messages
      ws.on('message', handleMessage)
      
    } catch (error) {
      connectionState.value = {
        ...connectionState.value,
        status: 'error',
        lastError: error as Error
      }
      
      scheduleReconnect()
    }
  }
  
  /**
   * Disconnect WebSocket
   */
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    
    stopHeartbeat()
    
    if (ws) {
      ws.disconnect()
      ws = null
    }
    
    connectionState.value = {
      status: 'disconnected',
      reconnectAttempts: 0,
      lastDisconnectedAt: Date.now()
    }
  }
  
  /**
   * Schedule reconnection attempt
   */
  const scheduleReconnect = () => {
    if (reconnectTimer) return
    
    const attempts = connectionState.value.reconnectAttempts
    if (attempts >= WEBSOCKET_CONFIG.reconnection.maxAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    const delay = getReconnectDelay(attempts)
    
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connectionState.value.reconnectAttempts++
      connect()
    }, delay)
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  const startHeartbeat = () => {
    if (!WEBSOCKET_CONFIG.heartbeat.enabled || pingInterval) return
    
    pingInterval = setInterval(() => {
      const pingTime = Date.now()
      
      send({
        type: 'ping',
        payload: { timestamp: pingTime }
      })
      
      // Set timeout for pong response
      setTimeout(() => {
        if (latency.value === null || Date.now() - pingTime > WEBSOCKET_CONFIG.heartbeat.timeout) {
          console.warn('Heartbeat timeout, reconnecting...')
          disconnect()
          connect()
        }
      }, WEBSOCKET_CONFIG.heartbeat.timeout)
    }, WEBSOCKET_CONFIG.heartbeat.interval)
  }
  
  /**
   * Stop heartbeat
   */
  const stopHeartbeat = () => {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }
  
  /**
   * Send message through WebSocket
   */
  const send = (message: Partial<WSMessage>) => {
    const fullMessage: WSMessage = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...message
    } as WSMessage
    
    if (ws && connectionState.value.status === 'connected') {
      ws.send(fullMessage)
    } else if (WEBSOCKET_CONFIG.messages.queueOffline) {
      // Queue message for later
      queueMessage(fullMessage)
    }
    
    return fullMessage.id
  }
  
  /**
   * Queue message for offline sending
   */
  const queueMessage = (message: WSMessage) => {
    if (messageQueue.value.length >= WEBSOCKET_CONFIG.messages.maxQueueSize) {
      // Remove oldest message
      messageQueue.value.shift()
    }
    
    messageQueue.value.push({
      message,
      timestamp: Date.now(),
      attempts: 0
    })
  }
  
  /**
   * Process queued messages
   */
  const processMessageQueue = async () => {
    if (messageQueue.value.length === 0) return
    
    const messages = [...messageQueue.value]
    messageQueue.value = []
    
    for (const queued of messages) {
      if (queued.attempts < 3) {
        queued.attempts++
        send(queued.message)
        
        // Add delay between messages
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }
  
  /**
   * Handle incoming WebSocket message
   */
  const handleMessage = (data: WSMessage) => {
    // Update metrics
    lastReceivedMessage.value = data
    messageCount.value++
    messageTimestamps.push(Date.now())
    
    // Handle different message types
    switch (data.type) {
      case 'pong':
        handlePong(data)
        break
        
      case 'matter:created':
      case 'matter:updated':
      case 'matter:deleted':
        handleMatterUpdate(data)
        break
        
      case 'kanban:moved':
        handleKanbanMove(data)
        break
        
      case 'activity:new':
        handleActivity(data)
        break
        
      case 'sync:response':
        handleSyncResponse(data)
        break
        
      case 'error':
        handleError(data)
        break
        
      default:
        console.debug('Unknown message type:', data.type)
    }
  }
  
  /**
   * Handle pong response for latency calculation
   */
  const handlePong = (data: WSMessage) => {
    if (data.payload?.timestamp) {
      latency.value = Date.now() - data.payload.timestamp
    }
  }
  
  /**
   * Handle matter updates
   */
  const handleMatterUpdate = (data: WSMessage) => {
    const { type, payload } = data
    
    switch (type) {
      case 'matter:created':
      case 'matter:updated':
        // Update specific matter in cache
        queryClient.setQueryData(
          queryKeys.matters.detail(payload.id),
          payload
        )
        
        // Invalidate list queries to refetch
        queryClient.invalidateQueries({
          queryKey: queryKeys.matters.all
        })
        break
        
      case 'matter:deleted':
        // Remove from cache
        queryClient.removeQueries({
          queryKey: queryKeys.matters.detail(payload.id)
        })
        
        // Invalidate list queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.matters.all
        })
        break
    }
  }
  
  /**
   * Handle Kanban board moves
   */
  const handleKanbanMove = (data: WSMessage) => {
    const { matterId, fromStatus, toStatus, position } = data.payload
    
    // Update matter in cache
    const matter = queryClient.getQueryData<Matter>(
      queryKeys.matters.detail(matterId)
    )
    
    if (matter) {
      queryClient.setQueryData(
        queryKeys.matters.detail(matterId),
        {
          ...matter,
          status: toStatus,
          updatedAt: new Date().toISOString()
        }
      )
    }
    
    // Invalidate kanban queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.kanban.board()
    })
  }
  
  /**
   * Handle activity updates
   */
  const handleActivity = (data: WSMessage) => {
    // Invalidate activity queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.activity.all
    })
  }
  
  /**
   * Handle sync response with batch updates
   */
  const handleSyncResponse = (data: WSMessage) => {
    const { updates } = data.payload
    
    if (Array.isArray(updates)) {
      updates.forEach(update => {
        handleMessage(update)
      })
    }
  }
  
  /**
   * Handle error messages
   */
  const handleError = (data: WSMessage) => {
    console.error('Server error:', data.payload)
    
    // Could show toast notification here
  }
  
  /**
   * Get last sync timestamp from cache
   */
  const getLastSyncTimestamp = (): number => {
    // Get the most recent data update time from cache
    const queries = queryClient.getQueryCache().getAll()
    let lastUpdate = 0
    
    queries.forEach(query => {
      if (query.state.dataUpdatedAt && query.state.dataUpdatedAt > lastUpdate) {
        lastUpdate = query.state.dataUpdatedAt
      }
    })
    
    return lastUpdate
  }
  
  /**
   * Calculate messages per minute
   */
  const calculateMessageRate = () => {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    
    // Remove old timestamps
    while (messageTimestamps.length > 0 && messageTimestamps[0] < oneMinuteAgo) {
      messageTimestamps.shift()
    }
    
    messagesPerMinute.value = messageTimestamps.length
  }
  
  // Lifecycle
  onMounted(() => {
    // Start message rate calculation
    messageRateInterval = setInterval(calculateMessageRate, 5000)
    
    // Auto-connect if enabled
    if (WEBSOCKET_CONFIG.reconnection.enabled) {
      connect()
    }
  })
  
  onUnmounted(() => {
    if (messageRateInterval) {
      clearInterval(messageRateInterval)
    }
    
    disconnect()
  })
  
  /**
   * Subscribe to specific event types
   */
  const subscribeToUpdates = (eventType: string, callback: (event: WSMessage) => void) => {
    if (!ws) {
      console.warn('WebSocket not connected, cannot subscribe to updates')
      return () => {} // Return empty unsubscribe function
    }
    
    // Create event handler
    const handler = (data: WSMessage) => {
      if (data.type === eventType) {
        callback(data)
      }
    }
    
    // Add listener
    ws.on('message', handler)
    
    // Return unsubscribe function
    return () => {
      if (ws) {
        ws.off('message', handler)
      }
    }
  }

  return {
    // Connection state
    connectionState: computed(() => connectionState.value),
    isConnected: computed(() => connectionState.value.status === 'connected'),
    
    // Metrics
    latency: computed(() => latency.value),
    messageCount: computed(() => messageCount.value),
    messagesPerMinute: computed(() => messagesPerMinute.value),
    queuedMessages: computed(() => messageQueue.value.length),
    
    // Last message
    lastMessage: computed(() => lastReceivedMessage.value),
    
    // Methods
    connect,
    disconnect,
    send,
    subscribeToUpdates,
    
    // Utility
    getConnectionInfo: () => ({
      ...connectionState.value,
      latency: latency.value,
      messageRate: messagesPerMinute.value,
      queueSize: messageQueue.value.length
    })
  }
}