import { ref, readonly, onMounted, onUnmounted } from 'vue'

export interface WebSocketConfig {
  url: string
  reconnect?: boolean
  reconnectInterval?: number
  heartbeatInterval?: number
  protocols?: string[]
}

/**
 * Composable for managing WebSocket connections
 * Provides automatic reconnection and heartbeat functionality
 * 
 * @param config - WebSocket configuration
 * @returns Object containing connection state and methods
 */
export function useWebSocketConnection(config: WebSocketConfig) {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectCount = ref(0)
  
  const listeners = new Map<string, Set<Function>>()
  
  let heartbeatInterval: NodeJS.Timeout | null = null
  let reconnectTimeout: NodeJS.Timeout | null = null
  
  /**
   * Emits an event to all registered listeners
   */
  const emit = (event: string, data?: any) => {
    listeners.get(event)?.forEach(handler => handler(data))
  }
  
  /**
   * Starts the heartbeat mechanism to keep connection alive
   */
  const startHeartbeat = () => {
    if (config.heartbeatInterval && !heartbeatInterval) {
      heartbeatInterval = setInterval(() => {
        send({ type: 'ping' })
      }, config.heartbeatInterval)
    }
  }
  
  /**
   * Stops the heartbeat mechanism
   */
  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }
  
  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = () => {
    if (!config.reconnect || reconnectTimeout) return
    
    reconnectCount.value++
    const delay = Math.min(
      (config.reconnectInterval || 1000) * Math.pow(2, reconnectCount.value - 1),
      30000
    )
    
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null
      if (!isConnected.value) {
        connect()
      }
    }, delay)
  }
  
  /**
   * Establishes WebSocket connection
   */
  const connect = () => {
    try {
      ws.value = new WebSocket(config.url, config.protocols)
      
      ws.value.onopen = () => {
        isConnected.value = true
        reconnectCount.value = 0
        emit('connected')
        startHeartbeat()
      }
      
      ws.value.onclose = () => {
        isConnected.value = false
        stopHeartbeat()
        emit('disconnected')
        
        if (config.reconnect) {
          scheduleReconnect()
        }
      }
      
      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          emit('message', data)
          
          if (data.type) {
            emit(data.type, data)
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }
      
      ws.value.onerror = (error) => {
        emit('error', error)
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }
  
  /**
   * Closes the WebSocket connection
   */
  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    stopHeartbeat()
    
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }
  
  /**
   * Sends data through the WebSocket connection
   */
  const send = (data: any) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }
  
  /**
   * Registers an event listener
   */
  const on = (event: string, handler: Function) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(handler)
  }
  
  /**
   * Removes an event listener
   */
  const off = (event: string, handler: Function) => {
    listeners.get(event)?.delete(handler)
  }
  
  // Lifecycle hooks
  onMounted(() => {
    connect()
  })
  
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    isConnected: readonly(isConnected),
    reconnectCount: readonly(reconnectCount),
    connect,
    disconnect,
    send,
    on,
    off
  }
}