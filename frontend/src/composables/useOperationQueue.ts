import { ref, reactive, computed, watch } from 'vue'
import type { OperationProgress } from '~/components/matter/OperationProgressTracker.vue'

export interface QueuedOperation {
  id: string
  type: 'export' | 'bulk_update' | 'bulk_delete' | 'import'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  payload: any
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  queuedAt: Date
  startedAt?: Date
  completedAt?: Date
  progress?: OperationProgress
  retryCount: number
  maxRetries: number
  estimatedDuration?: number
  dependencies?: string[] // IDs of operations that must complete first
  userId: string
  userEmail: string
}

export interface QueueStats {
  total: number
  queued: number
  running: number
  completed: number
  failed: number
  cancelled: number
  avgWaitTime: number
  avgProcessingTime: number
}

export interface QueueConfiguration {
  maxConcurrentOperations: number
  maxQueueSize: number
  defaultPriority: QueuedOperation['priority']
  retryDelayMs: number
  maxRetryDelayMs: number
  enableNotifications: boolean
  autoRetryFailures: boolean
  queuePersistence: boolean
}

const DEFAULT_CONFIG: QueueConfiguration = {
  maxConcurrentOperations: 3,
  maxQueueSize: 50,
  defaultPriority: 'normal',
  retryDelayMs: 5000,
  maxRetryDelayMs: 300000, // 5 minutes
  enableNotifications: true,
  autoRetryFailures: true,
  queuePersistence: true
}

export function useOperationQueue() {
  // State
  const operations = ref<Map<string, QueuedOperation>>(new Map())
  const config = reactive<QueueConfiguration>({ ...DEFAULT_CONFIG })
  const isProcessing = ref(false)
  const isConnected = ref(false)
  const websocket = ref<WebSocket | null>(null)
  const notifications = ref<Notification[]>([])

  // Computed properties
  const queuedOperations = computed(() => 
    Array.from(operations.value.values())
      .filter(op => op.status === 'queued')
      .sort((a, b) => {
        // Sort by priority first, then by queued time
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.queuedAt.getTime() - b.queuedAt.getTime()
      })
  )

  const runningOperations = computed(() =>
    Array.from(operations.value.values())
      .filter(op => op.status === 'running')
  )

  const completedOperations = computed(() =>
    Array.from(operations.value.values())
      .filter(op => op.status === 'completed')
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
  )

  const failedOperations = computed(() =>
    Array.from(operations.value.values())
      .filter(op => op.status === 'failed')
  )

  const canRunMore = computed(() => 
    runningOperations.value.length < config.maxConcurrentOperations
  )

  const queueStats = computed((): QueueStats => {
    const ops = Array.from(operations.value.values())
    
    const completed = ops.filter(op => op.status === 'completed')
    const totalWaitTime = completed.reduce((sum, op) => {
      if (op.startedAt && op.queuedAt) {
        return sum + (op.startedAt.getTime() - op.queuedAt.getTime())
      }
      return sum
    }, 0)
    
    const totalProcessingTime = completed.reduce((sum, op) => {
      if (op.completedAt && op.startedAt) {
        return sum + (op.completedAt.getTime() - op.startedAt.getTime())
      }
      return sum
    }, 0)

    return {
      total: ops.length,
      queued: ops.filter(op => op.status === 'queued').length,
      running: ops.filter(op => op.status === 'running').length,
      completed: completed.length,
      failed: ops.filter(op => op.status === 'failed').length,
      cancelled: ops.filter(op => op.status === 'cancelled').length,
      avgWaitTime: completed.length > 0 ? totalWaitTime / completed.length : 0,
      avgProcessingTime: completed.length > 0 ? totalProcessingTime / completed.length : 0
    }
  })

  // Queue management
  const addOperation = async (
    type: QueuedOperation['type'],
    payload: any,
    options: {
      priority?: QueuedOperation['priority']
      maxRetries?: number
      estimatedDuration?: number
      dependencies?: string[]
    } = {}
  ): Promise<string> => {
    const {
      priority = config.defaultPriority,
      maxRetries = 3,
      estimatedDuration,
      dependencies = []
    } = options

    // Check queue size limit
    if (operations.value.size >= config.maxQueueSize) {
      throw new Error(`Queue is full (max ${config.maxQueueSize} operations)`)
    }

    // Generate unique operation ID
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get current user info (would normally come from auth store)
    const user = await getCurrentUser()

    const operation: QueuedOperation = {
      id: operationId,
      type,
      priority,
      payload,
      status: 'queued',
      queuedAt: new Date(),
      retryCount: 0,
      maxRetries,
      estimatedDuration,
      dependencies,
      userId: user.id,
      userEmail: user.email
    }

    operations.value.set(operationId, operation)
    
    // Persist to localStorage if enabled
    if (config.queuePersistence) {
      saveQueueToStorage()
    }

    // Start processing if possible
    processQueue()

    // Send notification
    if (config.enableNotifications) {
      showNotification('Operation Queued', 
        `${getOperationTypeLabel(type)} operation has been added to the queue.`)
    }

    return operationId
  }

  const cancelOperation = async (operationId: string): Promise<boolean> => {
    const operation = operations.value.get(operationId)
    if (!operation) return false

    if (operation.status === 'running') {
      // Cancel via API
      try {
        await $fetch(`/api/operations/${operationId}/cancel`, { method: 'POST' })
        operation.status = 'cancelled'
        return true
      } catch (error) {
        console.error('Failed to cancel operation:', error)
        return false
      }
    } else if (operation.status === 'queued') {
      // Remove from queue
      operation.status = 'cancelled'
      return true
    }

    return false
  }

  const retryOperation = async (operationId: string): Promise<boolean> => {
    const operation = operations.value.get(operationId)
    if (!operation || operation.status !== 'failed') return false

    if (operation.retryCount >= operation.maxRetries) {
      console.warn(`Operation ${operationId} has exceeded max retries (${operation.maxRetries})`)
      return false
    }

    // Reset status and increment retry count
    operation.status = 'queued'
    operation.retryCount++
    operation.startedAt = undefined
    operation.completedAt = undefined
    operation.progress = undefined

    // Process queue
    processQueue()

    return true
  }

  const removeOperation = (operationId: string): boolean => {
    const operation = operations.value.get(operationId)
    if (!operation) return false

    if (operation.status === 'running') {
      console.warn('Cannot remove running operation. Cancel it first.')
      return false
    }

    operations.value.delete(operationId)
    
    if (config.queuePersistence) {
      saveQueueToStorage()
    }

    return true
  }

  const clearCompleted = () => {
    Array.from(operations.value.values())
      .filter(op => op.status === 'completed' || op.status === 'cancelled')
      .forEach(op => operations.value.delete(op.id))
    
    if (config.queuePersistence) {
      saveQueueToStorage()
    }
  }

  const pauseQueue = () => {
    isProcessing.value = false
  }

  const resumeQueue = () => {
    isProcessing.value = true
    processQueue()
  }

  // Queue processing
  const processQueue = async () => {
    if (!isProcessing.value || !canRunMore.value) return

    const nextOperation = queuedOperations.value.find(op => 
      canStartOperation(op)
    )

    if (!nextOperation) return

    try {
      await startOperation(nextOperation)
    } catch (error) {
      console.error('Failed to start operation:', error)
      nextOperation.status = 'failed'
    }

    // Process next operation
    setTimeout(() => processQueue(), 100)
  }

  const canStartOperation = (operation: QueuedOperation): boolean => {
    // Check dependencies
    if (operation.dependencies && operation.dependencies.length > 0) {
      const dependencyStates = operation.dependencies.map(depId => {
        const dep = operations.value.get(depId)
        return dep?.status || 'unknown'
      })

      // All dependencies must be completed
      if (!dependencyStates.every(status => status === 'completed')) {
        return false
      }
    }

    return true
  }

  const startOperation = async (operation: QueuedOperation) => {
    operation.status = 'running'
    operation.startedAt = new Date()

    try {
      // Send operation to backend
      const response = await $fetch('/api/operations', {
        method: 'POST',
        body: {
          id: operation.id,
          type: operation.type,
          payload: operation.payload,
          priority: operation.priority,
          userId: operation.userId
        }
      })

      // Update operation with backend response
      if (response && typeof response === 'object' && 'progress' in response) {
        operation.progress = (response as any).progress
      }

      // Setup WebSocket monitoring
      setupOperationMonitoring(operation.id)

    } catch (error) {
      operation.status = 'failed'
      console.error(`Failed to start operation ${operation.id}:`, error)
      
      // Auto-retry if enabled
      if (config.autoRetryFailures && operation.retryCount < operation.maxRetries) {
        const delay = Math.min(
          config.retryDelayMs * Math.pow(2, operation.retryCount),
          config.maxRetryDelayMs
        )
        
        setTimeout(() => {
          retryOperation(operation.id)
        }, delay)
      }
    }
  }

  const setupOperationMonitoring = (operationId: string) => {
    // This would setup WebSocket monitoring for the specific operation
    // The OperationProgressTracker component handles the actual WebSocket connection
    // Here we just need to update the operation status when it completes
  }

  // Utility functions
  const getCurrentUser = async () => {
    // This would normally get user from auth store
    return {
      id: 'user123',
      email: 'user@example.com'
    }
  }

  const getOperationTypeLabel = (type: string): string => {
    switch (type) {
      case 'export': return 'Export'
      case 'bulk_update': return 'Bulk Update'
      case 'bulk_delete': return 'Bulk Delete'
      case 'import': return 'Import'
      default: return type
    }
  }

  const showNotification = (title: string, message: string) => {
    if (!config.enableNotifications || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico'
          })
        }
      })
    }
  }

  // Persistence
  const saveQueueToStorage = () => {
    try {
      const queueData = {
        operations: Array.from(operations.value.entries()),
        config,
        timestamp: Date.now()
      }
      localStorage.setItem('operation-queue', JSON.stringify(queueData))
    } catch (error) {
      console.warn('Failed to save queue to localStorage:', error)
    }
  }

  const loadQueueFromStorage = () => {
    try {
      const stored = localStorage.getItem('operation-queue')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Only restore if less than 24 hours old
        if (Date.now() - data.timestamp < 86400000) {
          operations.value = new Map(data.operations.map(([id, op]: [string, any]) => [
            id,
            {
              ...op,
              queuedAt: new Date(op.queuedAt),
              startedAt: op.startedAt ? new Date(op.startedAt) : undefined,
              completedAt: op.completedAt ? new Date(op.completedAt) : undefined
            }
          ]))
          
          if (data.config) {
            Object.assign(config, data.config)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load queue from localStorage:', error)
    }
  }

  const clearStoredQueue = () => {
    localStorage.removeItem('operation-queue')
    operations.value.clear()
  }

  // Initialize
  if (config.queuePersistence) {
    loadQueueFromStorage()
  }

  // Auto-save on changes
  watch(operations, () => {
    if (config.queuePersistence) {
      saveQueueToStorage()
    }
  }, { deep: true })

  // Start processing
  isProcessing.value = true
  processQueue()

  return {
    // State
    operations: readonly(operations),
    config,
    isProcessing: readonly(isProcessing),
    isConnected: readonly(isConnected),

    // Computed
    queuedOperations,
    runningOperations,
    completedOperations,
    failedOperations,
    queueStats,
    canRunMore,

    // Methods
    addOperation,
    cancelOperation,
    retryOperation,
    removeOperation,
    clearCompleted,
    pauseQueue,
    resumeQueue,

    // Persistence
    saveQueueToStorage,
    loadQueueFromStorage,
    clearStoredQueue
  }
}