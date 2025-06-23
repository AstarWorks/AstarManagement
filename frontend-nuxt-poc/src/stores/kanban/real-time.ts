import { defineStore } from 'pinia'
import { ref, computed, readonly, onMounted, onUnmounted, nextTick } from 'vue'
import type { Matter, MatterStatus } from '~/types/kanban'

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'offline'
  lastSyncTime: Date | null
  errorMessage: string | null
  retryCount: number
  nextRetryTime: Date | null
}

export interface ConflictEvent {
  id: string
  type: 'matter_updated' | 'matter_deleted' | 'matter_created'
  localData: Matter | null
  serverData: Matter | null
  timestamp: Date
  resolved: boolean
}

export interface NetworkStatus {
  isOnline: boolean
  effectiveType: string | null
  downlink: number | null
  rtt: number | null
  saveData: boolean
}

export interface RealTimeEvent {
  id: string
  type: 'matter_updated' | 'matter_created' | 'matter_deleted' | 'user_joined' | 'user_left'
  data: any
  userId: string
  timestamp: Date
  acknowledged: boolean
}

export const useRealTimeStore = defineStore('kanban-real-time', () => {
  // State
  const syncStatus = ref<SyncStatus>({
    status: 'idle',
    lastSyncTime: null,
    errorMessage: null,
    retryCount: 0,
    nextRetryTime: null
  })
  
  const networkStatus = ref<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false
  })
  
  const conflictQueue = ref<ConflictEvent[]>([])
  const realtimeEvents = ref<RealTimeEvent[]>([])
  const activeUsers = ref<Array<{ id: string; name: string; avatar?: string; lastSeen: Date }>>([])
  
  // Configuration
  const pollingInterval = ref<NodeJS.Timeout | null>(null)
  const websocketConnection = ref<WebSocket | null>(null)
  const retryTimeout = ref<NodeJS.Timeout | null>(null)
  
  const config = {
    pollingIntervalMs: 30000, // 30 seconds
    maxRetries: 5,
    retryDelayMs: 2000,
    websocketUrl: process.env.NODE_ENV === 'production' 
      ? 'wss://api.aster-management.com/ws'
      : 'ws://localhost:8080/ws',
    enableWebSocket: true,
    enablePolling: true,
    syncOnFocus: true,
    syncOnVisibilityChange: true
  }

  // Network detection
  const updateNetworkStatus = () => {
    if (typeof navigator === 'undefined') return
    
    networkStatus.value.isOnline = navigator.onLine
    
    // Get connection info if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      networkStatus.value.effectiveType = connection.effectiveType || null
      networkStatus.value.downlink = connection.downlink || null
      networkStatus.value.rtt = connection.rtt || null
      networkStatus.value.saveData = connection.saveData || false
    }
  }

  // Sync operations
  const syncWithServer = async (force = false): Promise<boolean> => {
    if (syncStatus.value.status === 'syncing' && !force) {
      return false
    }

    if (!networkStatus.value.isOnline) {
      syncStatus.value.status = 'offline'
      return false
    }

    syncStatus.value.status = 'syncing'
    syncStatus.value.errorMessage = null

    try {
      const matterStore = useMatterStore()
      
      // TODO: Replace with actual API calls
      // const serverMatters = await $fetch<Matter[]>('/api/matters/sync', {
      //   method: 'POST',
      //   body: {
      //     lastSyncTime: syncStatus.value.lastSyncTime,
      //     localMatters: matterStore.matters
      //   }
      // })

      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      // Detect conflicts (simplified for demo)
      const conflicts = detectConflicts(matterStore.matters, syncStatus.value.lastSyncTime)
      
      if (conflicts.length > 0) {
        conflictQueue.value.push(...conflicts)
        await resolveConflicts(conflicts)
      }

      syncStatus.value.status = 'idle'
      syncStatus.value.lastSyncTime = new Date()
      syncStatus.value.retryCount = 0
      syncStatus.value.nextRetryTime = null

      return true
    } catch (error) {
      handleSyncError(error)
      return false
    }
  }

  const detectConflicts = (localMatters: Matter[], lastSyncTime: Date | null): ConflictEvent[] => {
    if (!lastSyncTime) return []
    
    const conflicts: ConflictEvent[] = []
    
    // Simulate conflict detection
    // In a real implementation, this would compare local and server timestamps
    localMatters.forEach(matter => {
      const lastUpdate = new Date(matter.updatedAt)
      if (lastUpdate > lastSyncTime && Math.random() < 0.1) { // 10% chance of conflict for demo
        conflicts.push({
          id: `conflict-${matter.id}-${Date.now()}`,
          type: 'matter_updated',
          localData: matter,
          serverData: { ...matter, title: `${matter.title} (Server Version)` }, // Simulate server conflict
          timestamp: new Date(),
          resolved: false
        })
      }
    })
    
    return conflicts
  }

  const resolveConflicts = async (conflicts: ConflictEvent[]) => {
    for (const conflict of conflicts) {
      // Default resolution strategy: server wins
      if (conflict.serverData) {
        const matterStore = useMatterStore()
        await matterStore.updateMatter(conflict.serverData.id, conflict.serverData)
      }
      
      conflict.resolved = true
    }
  }

  const handleSyncError = (error: any) => {
    syncStatus.value.status = 'error'
    syncStatus.value.errorMessage = error instanceof Error ? error.message : 'Sync failed'
    syncStatus.value.retryCount++

    if (syncStatus.value.retryCount < config.maxRetries) {
      const retryDelay = config.retryDelayMs * Math.pow(2, syncStatus.value.retryCount - 1) // Exponential backoff
      syncStatus.value.nextRetryTime = new Date(Date.now() + retryDelay)
      
      retryTimeout.value = setTimeout(() => {
        syncWithServer(true)
      }, retryDelay)
    }
  }

  // Polling
  const startPolling = (intervalMs = config.pollingIntervalMs) => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
    }

    pollingInterval.value = setInterval(async () => {
      if (networkStatus.value.isOnline && syncStatus.value.status !== 'syncing') {
        await syncWithServer()
      }
    }, intervalMs)
  }

  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  // WebSocket connection
  const connectWebSocket = () => {
    if (!config.enableWebSocket || typeof WebSocket === 'undefined') return

    try {
      websocketConnection.value = new WebSocket(config.websocketUrl)
      
      websocketConnection.value.onopen = () => {
        console.log('WebSocket connected')
        // Send authentication or initial message
        websocketConnection.value?.send(JSON.stringify({
          type: 'auth',
          token: 'user-auth-token' // TODO: Replace with actual auth
        }))
      }

      websocketConnection.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleRealtimeEvent(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      websocketConnection.value.onclose = () => {
        console.log('WebSocket disconnected')
        websocketConnection.value = null
        
        // Reconnect after delay if online
        if (networkStatus.value.isOnline) {
          setTimeout(connectWebSocket, 5000)
        }
      }

      websocketConnection.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  const disconnectWebSocket = () => {
    if (websocketConnection.value) {
      websocketConnection.value.close()
      websocketConnection.value = null
    }
  }

  // Real-time event handling
  const handleRealtimeEvent = (eventData: any) => {
    const event: RealTimeEvent = {
      id: eventData.id || `event-${Date.now()}`,
      type: eventData.type,
      data: eventData.data,
      userId: eventData.userId,
      timestamp: new Date(eventData.timestamp),
      acknowledged: false
    }

    realtimeEvents.value.unshift(event)
    
    // Keep only last 100 events
    if (realtimeEvents.value.length > 100) {
      realtimeEvents.value = realtimeEvents.value.slice(0, 100)
    }

    // Handle different event types
    switch (event.type) {
      case 'matter_updated':
      case 'matter_created':
        const matterStore = useMatterStore()
        // Update local matter if not from current user
        if (event.userId !== getCurrentUserId()) {
          matterStore.updateMatter(event.data.id, event.data)
        }
        break
        
      case 'matter_deleted':
        // Handle matter deletion
        break
        
      case 'user_joined':
        // Add user to active users
        if (!activeUsers.value.find(u => u.id === event.data.id)) {
          activeUsers.value.push({
            ...event.data,
            lastSeen: new Date()
          })
        }
        break
        
      case 'user_left':
        // Remove user from active users
        const index = activeUsers.value.findIndex(u => u.id === event.data.id)
        if (index !== -1) {
          activeUsers.value.splice(index, 1)
        }
        break
    }
    
    event.acknowledged = true
  }

  const getCurrentUserId = (): string => {
    // TODO: Get current user ID from auth store
    return 'current-user-id'
  }

  // Manual sync triggers
  const forceSyncNow = async () => {
    return await syncWithServer(true)
  }

  const clearConflictQueue = () => {
    conflictQueue.value = []
  }

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'server' | 'merge') => {
    const conflict = conflictQueue.value.find(c => c.id === conflictId)
    if (!conflict) return

    const matterStore = useMatterStore()
    
    switch (resolution) {
      case 'local':
        if (conflict.localData) {
          await matterStore.updateMatter(conflict.localData.id, conflict.localData)
        }
        break
        
      case 'server':
        if (conflict.serverData) {
          await matterStore.updateMatter(conflict.serverData.id, conflict.serverData)
        }
        break
        
      case 'merge':
        if (conflict.localData && conflict.serverData) {
          // Simple merge strategy - take most recent fields
          const merged = {
            ...conflict.serverData,
            ...conflict.localData,
            updatedAt: new Date().toISOString()
          }
          await matterStore.updateMatter(merged.id, merged)
        }
        break
    }
    
    conflict.resolved = true
    
    // Remove resolved conflict
    const index = conflictQueue.value.indexOf(conflict)
    if (index !== -1) {
      conflictQueue.value.splice(index, 1)
    }
  }

  // Event listeners
  const setupEventListeners = () => {
    if (typeof window === 'undefined') return

    // Network status
    window.addEventListener('online', () => {
      updateNetworkStatus()
      if (config.enableWebSocket) {
        connectWebSocket()
      }
      if (config.enablePolling) {
        startPolling()
      }
      syncWithServer()
    })

    window.addEventListener('offline', () => {
      updateNetworkStatus()
      disconnectWebSocket()
      stopPolling()
    })

    // Sync on page focus
    if (config.syncOnFocus) {
      window.addEventListener('focus', () => {
        if (networkStatus.value.isOnline) {
          syncWithServer()
        }
      })
    }

    // Sync on visibility change
    if (config.syncOnVisibilityChange) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && networkStatus.value.isOnline) {
          syncWithServer()
        }
      })
    }
  }

  const removeEventListeners = () => {
    if (typeof window === 'undefined') return

    window.removeEventListener('online', updateNetworkStatus)
    window.removeEventListener('offline', updateNetworkStatus)
    window.removeEventListener('focus', () => {})
    document.removeEventListener('visibilitychange', () => {})
  }

  // Lifecycle
  onMounted(() => {
    updateNetworkStatus()
    setupEventListeners()
    
    if (networkStatus.value.isOnline) {
      if (config.enableWebSocket) {
        connectWebSocket()
      }
      if (config.enablePolling) {
        startPolling()
      }
      
      // Initial sync
      nextTick(() => {
        syncWithServer()
      })
    }
  })

  onUnmounted(() => {
    stopPolling()
    disconnectWebSocket()
    removeEventListeners()
    
    if (retryTimeout.value) {
      clearTimeout(retryTimeout.value)
    }
  })

  // Computed getters
  const isOnline = computed(() => networkStatus.value.isOnline)
  const isSyncing = computed(() => syncStatus.value.status === 'syncing')
  const hasConflicts = computed(() => conflictQueue.value.length > 0)
  const unresolvedConflicts = computed(() => conflictQueue.value.filter(c => !c.resolved))
  const connectionQuality = computed(() => {
    if (!networkStatus.value.isOnline) return 'offline'
    if (networkStatus.value.effectiveType === '4g') return 'excellent'
    if (networkStatus.value.effectiveType === '3g') return 'good'
    if (networkStatus.value.effectiveType === '2g') return 'poor'
    return 'unknown'
  })
  
  const lastSyncStatus = computed(() => {
    if (!syncStatus.value.lastSyncTime) return 'Never synced'
    
    const now = Date.now()
    const lastSync = syncStatus.value.lastSyncTime.getTime()
    const diffMinutes = Math.floor((now - lastSync) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  })

  const recentEvents = computed(() => {
    return realtimeEvents.value
      .filter(e => e.acknowledged)
      .slice(0, 20)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  })

  return {
    // State (readonly)
    syncStatus: readonly(syncStatus),
    networkStatus: readonly(networkStatus),
    conflictQueue: readonly(conflictQueue),
    realtimeEvents: readonly(realtimeEvents),
    activeUsers: readonly(activeUsers),
    
    // Internal state for testing
    pollingInterval,
    websocketConnection,
    retryTimeout,

    // Actions
    syncWithServer,
    startPolling,
    stopPolling,
    connectWebSocket,
    disconnectWebSocket,
    forceSyncNow,
    clearConflictQueue,
    resolveConflict,
    updateNetworkStatus,
    detectConflicts,

    // Getters
    isOnline,
    isSyncing,
    hasConflicts,
    unresolvedConflicts,
    connectionQuality,
    lastSyncStatus,
    recentEvents
  }
})