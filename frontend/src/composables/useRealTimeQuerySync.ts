/**
 * Real-Time Query Synchronization Bridge
 * 
 * @description Bridges the existing real-time infrastructure (WebSocket and polling)
 * with TanStack Query invalidation system. Provides seamless integration between
 * the real-time store and query cache management.
 * 
 * @author Claude
 * @created 2025-06-25
 * @task T06_S08
 */

import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useWebSocketInvalidation, usePollingInvalidation } from './useQueryInvalidation'
import { useRealTimeStore } from '~/stores/kanban/real-time'
import type { RealTimeEvent, ConflictEvent } from '~/stores/kanban/real-time'
import type { Matter } from '~/types/kanban'

export interface SyncConfiguration {
  /** Enable WebSocket-based invalidation */
  enableWebSocket: boolean
  /** Enable polling-based invalidation */
  enablePolling: boolean
  /** Batch size for processing events */
  batchSize: number
  /** Batch processing interval in ms */
  batchIntervalMs: number
  /** Enable conflict detection and resolution */
  enableConflictResolution: boolean
  /** Auto-resolve conflicts using server data */
  autoResolveConflicts: boolean
  /** Debug mode for detailed logging */
  debugMode: boolean
}

export interface SyncMetrics {
  /** Total events processed */
  totalEventsProcessed: number
  /** Events processed by source */
  eventsBySource: Record<'websocket' | 'polling', number>
  /** Conflicts detected */
  conflictsDetected: number
  /** Conflicts resolved automatically */
  conflictsAutoResolved: number
  /** Last sync timestamp */
  lastSyncTime: Date | null
  /** Connection health status */
  connectionHealth: 'healthy' | 'degraded' | 'disconnected'
}

/**
 * Main real-time query synchronization composable
 */
export function useRealTimeQuerySync(config: Partial<SyncConfiguration> = {}) {
  const realTimeStore = useRealTimeStore()
  const webSocketInvalidation = useWebSocketInvalidation()
  const pollingInvalidation = usePollingInvalidation()
  
  // Configuration with defaults
  const syncConfig = ref<SyncConfiguration>({
    enableWebSocket: true,
    enablePolling: true,
    batchSize: 10,
    batchIntervalMs: 500,
    enableConflictResolution: true,
    autoResolveConflicts: false,
    debugMode: process.env.NODE_ENV === 'development',
    ...config
  })
  
  // State
  const isActive = ref(false)
  const eventBatch = ref<RealTimeEvent[]>([])
  const batchTimer = ref<NodeJS.Timeout | null>(null)
  const lastProcessedEventId = ref<string | null>(null)
  
  // Metrics
  const syncMetrics = ref<SyncMetrics>({
    totalEventsProcessed: 0,
    eventsBySource: { websocket: 0, polling: 0 },
    conflictsDetected: 0,
    conflictsAutoResolved: 0,
    lastSyncTime: null,
    connectionHealth: 'healthy'
  })

  /**
   * Process real-time events from the store
   */
  const processRealtimeEvents = () => {
    const events = realTimeStore.recentEvents
    
    if (!events.length) {
      return
    }
    
    // Filter new events
    const newEvents = lastProcessedEventId.value 
      ? events.filter(event => event.id > lastProcessedEventId.value!)
      : events.slice(0, 5) // Process only recent events on first run
    
    if (!newEvents.length) {
      return
    }
    
    // Update last processed event ID
    if (newEvents.length > 0) {
      lastProcessedEventId.value = newEvents[0].id
    }
    
    // Add to batch for processing
    eventBatch.value.push(...newEvents)
    
    if (syncConfig.value.debugMode) {
      console.log(`Added ${newEvents.length} events to processing batch`)
    }
    
    // Process batch if it's full or timer will handle it
    if (eventBatch.value.length >= syncConfig.value.batchSize) {
      processBatch()
    } else if (!batchTimer.value) {
      scheduleBatchProcessing()
    }
  }

  /**
   * Schedule batch processing
   */
  const scheduleBatchProcessing = () => {
    if (batchTimer.value) {
      clearTimeout(batchTimer.value)
    }
    
    batchTimer.value = setTimeout(() => {
      processBatch()
      batchTimer.value = null
    }, syncConfig.value.batchIntervalMs)
  }

  /**
   * Process accumulated events batch
   */
  const processBatch = async () => {
    if (!eventBatch.value.length) {
      return
    }
    
    const eventsToProcess = [...eventBatch.value]
    eventBatch.value = []
    
    if (syncConfig.value.debugMode) {
      console.log(`Processing batch of ${eventsToProcess.length} events`)
    }
    
    try {
      // Process events through invalidation system
      if (syncConfig.value.enableWebSocket) {
        await webSocketInvalidation.processBatchInvalidation(eventsToProcess)
      }
      
      // Update metrics
      syncMetrics.value.totalEventsProcessed += eventsToProcess.length
      syncMetrics.value.eventsBySource.websocket += eventsToProcess.filter(e => 
        e.type.includes('websocket') || e.userId !== 'system'
      ).length
      syncMetrics.value.eventsBySource.polling += eventsToProcess.filter(e => 
        e.type.includes('polling') || e.userId === 'system'
      ).length
      syncMetrics.value.lastSyncTime = new Date()
      
    } catch (error) {
      console.error('Failed to process event batch:', error)
      // Re-add failed events to retry later
      eventBatch.value.unshift(...eventsToProcess)
    }
  }

  /**
   * Handle polling updates
   */
  const handlePollingSync = () => {
    if (!syncConfig.value.enablePolling) {
      return
    }
    
    // Create polling callback that integrates with our system
    const pollingCallback = pollingInvalidation.createPollingCallback()
    
    // Monitor sync status changes to trigger invalidation
    watch(
      () => realTimeStore.syncStatus.lastSyncTime,
      (newSyncTime, oldSyncTime) => {
        if (newSyncTime && newSyncTime !== oldSyncTime) {
          // Trigger polling-based invalidation
          pollingCallback([]) // Empty array triggers general invalidation
          
          if (syncConfig.value.debugMode) {
            console.log('Polling sync detected, triggering query invalidation')
          }
        }
      }
    )
  }

  /**
   * Handle conflict detection and resolution
   */
  const handleConflicts = () => {
    if (!syncConfig.value.enableConflictResolution) {
      return
    }
    
    watch(
      () => realTimeStore.conflictQueue,
      (newConflicts) => {
        const unresolvedConflicts = newConflicts.filter(c => !c.resolved)
        
        if (!unresolvedConflicts.length) {
          return
        }
        
        syncMetrics.value.conflictsDetected += unresolvedConflicts.length
        
        if (syncConfig.value.autoResolveConflicts) {
          // Auto-resolve using server data (server wins strategy)
          unresolvedConflicts.forEach(async (conflict) => {
            if (conflict.serverData) {
              await realTimeStore.resolveConflict(conflict.id, 'server')
              syncMetrics.value.conflictsAutoResolved++
              
              // Reconcile with TanStack Query
              if (conflict.localData && conflict.serverData) {
                await webSocketInvalidation.reconcileOptimisticUpdate(
                  conflict.serverData.id,
                  conflict.serverData as Matter,
                  conflict.localData as Matter
                )
              }
            }
          })
        }
      },
      { deep: true }
    )
  }

  /**
   * Monitor connection health
   */
  const monitorConnectionHealth = () => {
    watch(
      () => [realTimeStore.networkStatus.isOnline, realTimeStore.syncStatus.status],
      ([isOnline, syncStatus]) => {
        if (!isOnline) {
          syncMetrics.value.connectionHealth = 'disconnected'
        } else if (syncStatus === 'error') {
          syncMetrics.value.connectionHealth = 'degraded'
        } else {
          syncMetrics.value.connectionHealth = 'healthy'
        }
      },
      { immediate: true }
    )
  }

  /**
   * Setup WebSocket integration
   */
  const setupWebSocketIntegration = () => {
    if (!syncConfig.value.enableWebSocket) {
      return
    }
    
    // Create WebSocket handler for invalidation
    const getCurrentUserId = () => {
      // TODO: Get from auth store
      return 'current-user-id'
    }
    
    const wsHandler = webSocketInvalidation.createWebSocketHandler(getCurrentUserId)
    
    // Monitor real-time events for WebSocket messages
    watch(
      () => realTimeStore.recentEvents,
      () => {
        processRealtimeEvents()
      },
      { deep: true }
    )
  }

  /**
   * Start real-time query synchronization
   */
  const start = () => {
    if (isActive.value) {
      return
    }
    
    isActive.value = true
    
    if (syncConfig.value.debugMode) {
      console.log('Starting real-time query synchronization')
    }
    
    // Setup integrations
    setupWebSocketIntegration()
    handlePollingSync()
    handleConflicts()
    monitorConnectionHealth()
    
    // Initial event processing
    processRealtimeEvents()
  }

  /**
   * Stop real-time query synchronization
   */
  const stop = () => {
    if (!isActive.value) {
      return
    }
    
    isActive.value = false
    
    // Clear batch timer
    if (batchTimer.value) {
      clearTimeout(batchTimer.value)
      batchTimer.value = null
    }
    
    // Process any remaining events
    if (eventBatch.value.length > 0) {
      processBatch()
    }
    
    if (syncConfig.value.debugMode) {
      console.log('Stopped real-time query synchronization')
    }
  }

  /**
   * Force sync all queries
   */
  const forceSync = async () => {
    if (syncConfig.value.debugMode) {
      console.log('Forcing query synchronization')
    }
    
    // Force sync through real-time store
    await realTimeStore.forceSyncNow()
    
    // Process any pending events
    processRealtimeEvents()
    await processBatch()
    
    // Manual invalidation of critical queries
    await webSocketInvalidation.invalidateQueries([
      ['matters'],
      ['matters', 'statistics'],
      ['matters', 'status-counts']
    ], { cascade: true })
  }

  /**
   * Update synchronization configuration
   */
  const updateConfig = (newConfig: Partial<SyncConfiguration>) => {
    const wasActive = isActive.value
    
    if (wasActive) {
      stop()
    }
    
    syncConfig.value = { ...syncConfig.value, ...newConfig }
    
    if (wasActive) {
      start()
    }
  }

  /**
   * Reset synchronization metrics
   */
  const resetMetrics = () => {
    syncMetrics.value = {
      totalEventsProcessed: 0,
      eventsBySource: { websocket: 0, polling: 0 },
      conflictsDetected: 0,
      conflictsAutoResolved: 0,
      lastSyncTime: null,
      connectionHealth: 'healthy'
    }
  }

  // Computed values
  const syncHealth = computed(() => {
    const health = syncMetrics.value.connectionHealth
    const invalidationHealth = webSocketInvalidation.invalidationHealth.value
    
    if (health === 'disconnected' || invalidationHealth === 'degraded') {
      return 'critical'
    }
    
    if (health === 'degraded' || invalidationHealth === 'warning') {
      return 'warning'
    }
    
    return 'healthy'
  })

  const isConnected = computed(() => realTimeStore.isOnline)
  const isSyncing = computed(() => realTimeStore.isSyncing)
  const hasUnresolvedConflicts = computed(() => realTimeStore.hasConflicts)

  // Lifecycle
  onMounted(() => {
    start()
  })

  onUnmounted(() => {
    stop()
  })

  return {
    // State
    isActive: readonly(isActive),
    syncConfig: readonly(syncConfig),
    syncMetrics: readonly(syncMetrics),
    syncHealth,
    isConnected,
    isSyncing,
    hasUnresolvedConflicts,
    
    // Methods
    start,
    stop,
    forceSync,
    updateConfig,
    resetMetrics,
    
    // Batch processing
    processBatch,
    
    // Access to underlying systems
    webSocketInvalidation,
    pollingInvalidation,
    realTimeStore
  }
}

/**
 * Simple hook for components that just need sync status
 */
export function useSyncStatus() {
  const sync = useRealTimeQuerySync()
  
  return {
    isConnected: sync.isConnected,
    isSyncing: sync.isSyncing,
    syncHealth: sync.syncHealth,
    lastSyncTime: computed(() => sync.syncMetrics.value.lastSyncTime),
    hasConflicts: sync.hasUnresolvedConflicts,
    forceSync: sync.forceSync
  }
}

/**
 * Hook for advanced sync configuration and monitoring
 */
export function useAdvancedSync() {
  const sync = useRealTimeQuerySync()
  
  return {
    ...sync,
    
    // Advanced configuration
    enableDebugMode: () => sync.updateConfig({ debugMode: true }),
    disableAutoResolve: () => sync.updateConfig({ autoResolveConflicts: false }),
    setBatchSize: (size: number) => sync.updateConfig({ batchSize: size }),
    
    // Metrics and monitoring
    getInvalidationMetrics: () => sync.webSocketInvalidation.metrics.value,
    getRealTimeMetrics: () => sync.syncMetrics.value,
    
    // Manual controls
    clearInvalidationState: sync.webSocketInvalidation.clearInvalidationState,
    clearConflicts: sync.realTimeStore.clearConflictQueue
  }
}