import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useOnline } from '@vueuse/core'

export interface QueuedMessage {
  id: string
  type: string
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
  priority: 'low' | 'medium' | 'high'
  operation: 'create' | 'update' | 'delete' | 'move'
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
}

export interface OfflineQueueConfig {
  /**
   * Maximum number of messages to store
   */
  maxQueueSize?: number
  
  /**
   * Storage key for persisting queue
   */
  storageKey?: string
  
  /**
   * Maximum retry attempts per message
   */
  maxRetries?: number
  
  /**
   * Retry delay in milliseconds (exponential backoff base)
   */
  retryDelay?: number
  
  /**
   * Enable persistence to localStorage
   */
  enablePersistence?: boolean
  
  /**
   * Auto-replay when coming back online
   */
  autoReplay?: boolean
}

export function useOfflineQueue(config: OfflineQueueConfig = {}) {
  const {
    maxQueueSize = 100,
    storageKey = 'kanban-offline-queue',
    maxRetries = 3,
    retryDelay = 1000,
    enablePersistence = true,
    autoReplay = true
  } = config

  // State
  const queue = ref<QueuedMessage[]>([])
  const isProcessing = ref(false)
  const isOnline = useOnline()
  const lastSyncAttempt = ref<Date | null>(null)
  const syncErrors = ref<Array<{ id: string; error: string; timestamp: Date }>>([])

  // Computed properties
  const queueSize = computed(() => queue.value.length)
  const hasPendingMessages = computed(() => queue.value.length > 0)
  const highPriorityCount = computed(() => 
    queue.value.filter(msg => msg.priority === 'high').length
  )
  const failedMessagesCount = computed(() =>
    queue.value.filter(msg => msg.retryCount >= msg.maxRetries).length
  )

  // Priority order for processing
  const priorityOrder = { high: 3, medium: 2, low: 1 }

  // Storage management
  const saveToStorage = () => {
    if (!enablePersistence) return
    
    try {
      const serializedQueue = queue.value.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
      localStorage.setItem(storageKey, JSON.stringify(serializedQueue))
    } catch (error) {
      console.warn('Failed to save offline queue to storage:', error)
    }
  }

  const loadFromStorage = () => {
    if (!enablePersistence) return
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsedQueue = JSON.parse(stored)
        queue.value = parsedQueue.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load offline queue from storage:', error)
      localStorage.removeItem(storageKey) // Clear corrupted data
    }
  }

  const clearStorage = () => {
    if (enablePersistence) {
      localStorage.removeItem(storageKey)
    }
  }

  // Queue management
  const addToQueue = (message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>): string => {
    const id = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const queuedMessage: QueuedMessage = {
      ...message,
      id,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: message.maxRetries ?? maxRetries
    }

    // Add to queue with priority ordering
    const insertIndex = queue.value.findIndex(
      msg => priorityOrder[msg.priority] < priorityOrder[queuedMessage.priority]
    )
    
    if (insertIndex === -1) {
      queue.value.push(queuedMessage)
    } else {
      queue.value.splice(insertIndex, 0, queuedMessage)
    }

    // Trim queue if it exceeds max size (remove oldest low priority items)
    if (queue.value.length > maxQueueSize) {
      const lowPriorityIndex = queue.value.findLastIndex(msg => msg.priority === 'low')
      if (lowPriorityIndex !== -1) {
        queue.value.splice(lowPriorityIndex, 1)
      } else {
        queue.value.shift() // Remove oldest if no low priority items
      }
    }

    saveToStorage()
    return id
  }

  const removeFromQueue = (messageId: string) => {
    const index = queue.value.findIndex(msg => msg.id === messageId)
    if (index !== -1) {
      queue.value.splice(index, 1)
      saveToStorage()
    }
  }

  const updateMessage = (messageId: string, updates: Partial<QueuedMessage>) => {
    const message = queue.value.find(msg => msg.id === messageId)
    if (message) {
      Object.assign(message, updates)
      saveToStorage()
    }
  }

  // Message processing
  const processMessage = async (message: QueuedMessage): Promise<boolean> => {
    try {
      message.retryCount++
      
      const response = await $fetch(message.endpoint, {
        method: message.method,
        body: message.method !== 'GET' ? message.data : undefined,
        query: message.method === 'GET' ? message.data : undefined
      })

      // Message processed successfully
      removeFromQueue(message.id)
      
      // Remove any related sync errors
      syncErrors.value = syncErrors.value.filter(err => err.id !== message.id)
      
      return true
    } catch (error: any) {
      console.warn(`Failed to process queued message ${message.id}:`, error)
      
      // Add to sync errors
      syncErrors.value.push({
        id: message.id,
        error: error.message || 'Unknown error',
        timestamp: new Date()
      })

      // Check if we should retry
      if (message.retryCount >= message.maxRetries) {
        console.error(`Message ${message.id} exceeded max retries and will be kept in queue`)
        return false
      }

      // Update retry count
      updateMessage(message.id, { retryCount: message.retryCount })
      
      return false
    }
  }

  const processQueue = async () => {
    if (isProcessing.value || !isOnline.value || queue.value.length === 0) {
      return
    }

    isProcessing.value = true
    lastSyncAttempt.value = new Date()

    try {
      // Process messages in priority order, but only retry eligible messages
      const eligibleMessages = queue.value.filter(msg => {
        const timeSinceLastRetry = Date.now() - msg.timestamp.getTime()
        const backoffDelay = retryDelay * Math.pow(2, msg.retryCount)
        return msg.retryCount < msg.maxRetries && timeSinceLastRetry >= backoffDelay
      })

      for (const message of eligibleMessages) {
        await processMessage(message)
        
        // Small delay between processing to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } finally {
      isProcessing.value = false
    }
  }

  const retryFailedMessage = async (messageId: string) => {
    const message = queue.value.find(msg => msg.id === messageId)
    if (!message) return false

    // Reset retry count for manual retry
    message.retryCount = 0
    message.timestamp = new Date()
    
    return await processMessage(message)
  }

  const clearQueue = () => {
    queue.value = []
    syncErrors.value = []
    clearStorage()
  }

  const clearFailedMessages = () => {
    queue.value = queue.value.filter(msg => msg.retryCount < msg.maxRetries)
    saveToStorage()
  }

  const getQueueStats = () => {
    const stats = {
      total: queue.value.length,
      byPriority: {
        high: queue.value.filter(msg => msg.priority === 'high').length,
        medium: queue.value.filter(msg => msg.priority === 'medium').length,
        low: queue.value.filter(msg => msg.priority === 'low').length
      },
      byOperation: {
        create: queue.value.filter(msg => msg.operation === 'create').length,
        update: queue.value.filter(msg => msg.operation === 'update').length,
        delete: queue.value.filter(msg => msg.operation === 'delete').length,
        move: queue.value.filter(msg => msg.operation === 'move').length
      },
      failed: failedMessagesCount.value,
      oldest: queue.value.length > 0 ? queue.value[queue.value.length - 1].timestamp : null,
      newest: queue.value.length > 0 ? queue.value[0].timestamp : null
    }
    
    return stats
  }

  // Convenience methods for different operations
  const queueCreate = (endpoint: string, data: any, priority: QueuedMessage['priority'] = 'medium') => {
    return addToQueue({
      type: 'create',
      operation: 'create',
      endpoint,
      method: 'POST',
      data,
      priority,
      maxRetries
    })
  }

  const queueUpdate = (endpoint: string, data: any, priority: QueuedMessage['priority'] = 'medium') => {
    return addToQueue({
      type: 'update',
      operation: 'update',
      endpoint,
      method: 'PATCH',
      data,
      priority,
      maxRetries
    })
  }

  const queueDelete = (endpoint: string, priority: QueuedMessage['priority'] = 'medium') => {
    return addToQueue({
      type: 'delete',
      operation: 'delete',
      endpoint,
      method: 'DELETE',
      data: {},
      priority,
      maxRetries
    })
  }

  const queueMove = (endpoint: string, data: any, priority: QueuedMessage['priority'] = 'high') => {
    return addToQueue({
      type: 'move',
      operation: 'move',
      endpoint,
      method: 'PATCH',
      data,
      priority,
      maxRetries
    })
  }

  // Watch for online status changes
  watch(isOnline, (online) => {
    if (online && autoReplay && queue.value.length > 0) {
      // Small delay to ensure connection is stable
      setTimeout(() => {
        processQueue()
      }, 1000)
    }
  })

  // Auto-process queue periodically when online
  let processingInterval: NodeJS.Timeout | null = null

  const startPeriodicProcessing = () => {
    if (processingInterval) return
    
    processingInterval = setInterval(() => {
      if (isOnline.value && queue.value.length > 0) {
        processQueue()
      }
    }, 30000) // Process every 30 seconds
  }

  const stopPeriodicProcessing = () => {
    if (processingInterval) {
      clearInterval(processingInterval)
      processingInterval = null
    }
  }

  // Lifecycle management
  onMounted(() => {
    loadFromStorage()
    startPeriodicProcessing()
    
    // Process queue if online and has messages
    if (isOnline.value && autoReplay && queue.value.length > 0) {
      setTimeout(processQueue, 2000)
    }
  })

  onUnmounted(() => {
    stopPeriodicProcessing()
    saveToStorage()
  })

  return {
    // State
    queue: computed(() => [...queue.value]), // Readonly copy
    isProcessing: computed(() => isProcessing.value),
    isOnline,
    lastSyncAttempt: computed(() => lastSyncAttempt.value),
    syncErrors: computed(() => [...syncErrors.value]),
    
    // Computed stats
    queueSize,
    hasPendingMessages,
    highPriorityCount,
    failedMessagesCount,
    
    // Queue management
    addToQueue,
    removeFromQueue,
    clearQueue,
    clearFailedMessages,
    
    // Processing
    processQueue,
    retryFailedMessage,
    
    // Convenience methods
    queueCreate,
    queueUpdate,
    queueDelete,
    queueMove,
    
    // Utils
    getQueueStats,
    
    // Manual control
    startPeriodicProcessing,
    stopPeriodicProcessing
  }
}

export default useOfflineQueue