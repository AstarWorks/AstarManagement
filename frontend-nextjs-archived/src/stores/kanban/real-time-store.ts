/**
 * Real-Time Store - Polling, sync, and auto-refresh features
 * 
 * Handles real-time updates, polling mechanisms, sync status, and auto-refresh
 * Separated from main kanban store for better modularity and testing
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Real-time state interface
interface RealTimeState {
    // Sync status
    isOnline: boolean
    lastSyncTime: Date | null
    syncInProgress: boolean
    syncError: string | null
    
    // Polling configuration
    pollingEnabled: boolean
    pollingInterval: number // milliseconds
    pollingTimerId: NodeJS.Timeout | null
    
    // Auto-refresh settings
    autoRefreshEnabled: boolean
    autoRefreshInterval: number // milliseconds
    lastRefreshTime: Date | null
    
    // Connection status
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
    reconnectAttempts: number
    maxReconnectAttempts: number
    
    // Offline queue for sync when back online
    offlineQueue: Array<{
        id: string
        action: 'CREATE' | 'UPDATE' | 'DELETE'
        entityType: 'MATTER' | 'STATUS_UPDATE'
        data: any
        timestamp: Date
    }>
    
    // Real-time actions
    startPolling: (interval?: number) => void
    stopPolling: () => void
    setPollingInterval: (interval: number) => void
    
    // Auto-refresh actions
    enableAutoRefresh: (interval?: number) => void
    disableAutoRefresh: () => void
    triggerRefresh: () => Promise<void>
    
    // Sync actions
    performSync: () => Promise<void>
    addToOfflineQueue: (action: RealTimeState['offlineQueue'][0]) => void
    processOfflineQueue: () => Promise<void>
    clearOfflineQueue: () => void
    
    // Connection management
    setConnectionStatus: (status: RealTimeState['connectionStatus']) => void
    handleReconnect: () => Promise<void>
    resetReconnectAttempts: () => void
    
    // Network status
    setOnlineStatus: (online: boolean) => void
    
    // Error handling
    setSyncError: (error: string | null) => void
    clearSyncError: () => void
}

// Create the real-time store
export const useRealTimeStore = create<RealTimeState>()(
    subscribeWithSelector(
        immer((set, get) => ({
            // Initial state
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            lastSyncTime: null,
            syncInProgress: false,
            syncError: null,
            pollingEnabled: false,
            pollingInterval: 30000, // 30 seconds default
            pollingTimerId: null,
            autoRefreshEnabled: true,
            autoRefreshInterval: 300000, // 5 minutes default
            lastRefreshTime: null,
            connectionStatus: 'connected',
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            offlineQueue: [],

            // Polling actions
            startPolling: (interval = 30000) => {
                const state = get()
                
                // Clear existing timer
                if (state.pollingTimerId) {
                    clearInterval(state.pollingTimerId)
                }

                set((draft) => {
                    draft.pollingEnabled = true
                    draft.pollingInterval = interval
                })

                // Start new polling timer
                const timerId = setInterval(async () => {
                    const currentState = get()
                    if (currentState.isOnline && !currentState.syncInProgress) {
                        await currentState.performSync()
                    }
                }, interval)

                set((draft) => {
                    draft.pollingTimerId = timerId
                })
            },

            stopPolling: () => {
                const state = get()
                
                if (state.pollingTimerId) {
                    clearInterval(state.pollingTimerId)
                }

                set((draft) => {
                    draft.pollingEnabled = false
                    draft.pollingTimerId = null
                })
            },

            setPollingInterval: (interval) => {
                set((draft) => {
                    draft.pollingInterval = interval
                })

                // Restart polling with new interval if currently enabled
                const state = get()
                if (state.pollingEnabled) {
                    state.stopPolling()
                    state.startPolling(interval)
                }
            },

            // Auto-refresh actions
            enableAutoRefresh: (interval = 300000) => {
                set((draft) => {
                    draft.autoRefreshEnabled = true
                    draft.autoRefreshInterval = interval
                })

                // Start auto-refresh if not already running
                const state = get()
                if (!state.pollingEnabled) {
                    state.startPolling(interval)
                }
            },

            disableAutoRefresh: () => {
                set((draft) => {
                    draft.autoRefreshEnabled = false
                })
            },

            triggerRefresh: async () => {
                const state = get()
                if (state.isOnline) {
                    await state.performSync()
                }
            },

            // Sync actions
            performSync: async () => {
                set((draft) => {
                    draft.syncInProgress = true
                    draft.syncError = null
                })

                try {
                    // Process offline queue first
                    await get().processOfflineQueue()

                    // Simulate sync operation (in real implementation, this would call the matter data store)
                    // This is a placeholder - the actual implementation would coordinate with matter-data-store
                    await new Promise(resolve => setTimeout(resolve, 1000))

                    set((draft) => {
                        draft.lastSyncTime = new Date()
                        draft.lastRefreshTime = new Date()
                        draft.syncInProgress = false
                        draft.connectionStatus = 'connected'
                        draft.reconnectAttempts = 0
                    })
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Sync failed'
                    
                    set((draft) => {
                        draft.syncError = errorMessage
                        draft.syncInProgress = false
                        draft.connectionStatus = 'disconnected'
                    })

                    // Attempt reconnect if not at max attempts
                    const state = get()
                    if (state.reconnectAttempts < state.maxReconnectAttempts) {
                        setTimeout(() => get().handleReconnect(), 5000)
                    }

                    throw error
                }
            },

            addToOfflineQueue: (action) => {
                set((draft) => {
                    draft.offlineQueue.push({
                        ...action,
                        id: action.id || crypto.randomUUID(),
                        timestamp: new Date()
                    })
                })
            },

            processOfflineQueue: async () => {
                const state = get()
                const queue = [...state.offlineQueue]

                if (queue.length === 0) return

                try {
                    // Process queue items sequentially
                    for (const item of queue) {
                        // In real implementation, this would call appropriate APIs
                        // based on action type and entity type
                        console.log('Processing offline action:', item)
                        
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 100))
                    }

                    // Clear queue after successful processing
                    set((draft) => {
                        draft.offlineQueue = []
                    })
                } catch (error) {
                    console.error('Failed to process offline queue:', error)
                    throw error
                }
            },

            clearOfflineQueue: () => {
                set((draft) => {
                    draft.offlineQueue = []
                })
            },

            // Connection management
            setConnectionStatus: (status) => {
                set((draft) => {
                    draft.connectionStatus = status
                })
            },

            handleReconnect: async () => {
                const state = get()
                
                set((draft) => {
                    draft.connectionStatus = 'reconnecting'
                    draft.reconnectAttempts += 1
                })

                try {
                    // Attempt to sync/reconnect
                    await state.performSync()
                    
                    set((draft) => {
                        draft.connectionStatus = 'connected'
                    })
                } catch (error) {
                    const currentState = get()
                    
                    if (currentState.reconnectAttempts >= currentState.maxReconnectAttempts) {
                        set((draft) => {
                            draft.connectionStatus = 'disconnected'
                        })
                    } else {
                        // Schedule next reconnect attempt
                        setTimeout(() => get().handleReconnect(), 10000)
                    }
                }
            },

            resetReconnectAttempts: () => {
                set((draft) => {
                    draft.reconnectAttempts = 0
                })
            },

            // Network status
            setOnlineStatus: (online) => {
                set((draft) => {
                    draft.isOnline = online
                })

                // Handle online/offline transitions
                if (online) {
                    // Coming back online - start sync
                    setTimeout(() => get().performSync(), 1000)
                } else {
                    // Going offline - stop polling
                    get().stopPolling()
                }
            },

            // Error handling
            setSyncError: (error) => {
                set((draft) => {
                    draft.syncError = error
                })
            },

            clearSyncError: () => {
                set((draft) => {
                    draft.syncError = null
                })
            }
        }))
    )
)

// Set up network status listeners (browser only)
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        useRealTimeStore.getState().setOnlineStatus(true)
    })

    window.addEventListener('offline', () => {
        useRealTimeStore.getState().setOnlineStatus(false)
    })

    // Set initial online status
    useRealTimeStore.getState().setOnlineStatus(navigator.onLine)
}

// Selector hooks for optimized re-renders
export const useSyncStatus = () => useRealTimeStore((state) => ({
    isOnline: state.isOnline,
    lastSyncTime: state.lastSyncTime,
    syncInProgress: state.syncInProgress,
    syncError: state.syncError
}))

export const useConnectionStatus = () => useRealTimeStore((state) => ({
    connectionStatus: state.connectionStatus,
    reconnectAttempts: state.reconnectAttempts,
    maxReconnectAttempts: state.maxReconnectAttempts
}))

export const usePollingStatus = () => useRealTimeStore((state) => ({
    pollingEnabled: state.pollingEnabled,
    pollingInterval: state.pollingInterval
}))

export const useAutoRefreshStatus = () => useRealTimeStore((state) => ({
    autoRefreshEnabled: state.autoRefreshEnabled,
    autoRefreshInterval: state.autoRefreshInterval,
    lastRefreshTime: state.lastRefreshTime
}))

export const useOfflineQueue = () => useRealTimeStore((state) => ({
    queue: state.offlineQueue,
    queueSize: state.offlineQueue.length
}))

export const useRealTimeActions = () => useRealTimeStore((state) => ({
    startPolling: state.startPolling,
    stopPolling: state.stopPolling,
    setPollingInterval: state.setPollingInterval,
    enableAutoRefresh: state.enableAutoRefresh,
    disableAutoRefresh: state.disableAutoRefresh,
    triggerRefresh: state.triggerRefresh,
    performSync: state.performSync,
    addToOfflineQueue: state.addToOfflineQueue,
    processOfflineQueue: state.processOfflineQueue,
    clearOfflineQueue: state.clearOfflineQueue,
    setConnectionStatus: state.setConnectionStatus,
    handleReconnect: state.handleReconnect,
    resetReconnectAttempts: state.resetReconnectAttempts,
    setOnlineStatus: state.setOnlineStatus,
    setSyncError: state.setSyncError,
    clearSyncError: state.clearSyncError
}))

// SSR-compatible server snapshot
const getServerSnapshot = (): RealTimeState => ({
    isOnline: true,
    lastSyncTime: null,
    syncInProgress: false,
    syncError: null,
    pollingEnabled: false,
    pollingInterval: 30000,
    pollingTimerId: null,
    autoRefreshEnabled: true,
    autoRefreshInterval: 300000,
    lastRefreshTime: null,
    connectionStatus: 'connected',
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    offlineQueue: [],
    startPolling: () => {},
    stopPolling: () => {},
    setPollingInterval: () => {},
    enableAutoRefresh: () => {},
    disableAutoRefresh: () => {},
    triggerRefresh: async () => {},
    performSync: async () => {},
    addToOfflineQueue: () => {},
    processOfflineQueue: async () => {},
    clearOfflineQueue: () => {},
    setConnectionStatus: () => {},
    handleReconnect: async () => {},
    resetReconnectAttempts: () => {},
    setOnlineStatus: () => {},
    setSyncError: () => {},
    clearSyncError: () => {}
})

export { getServerSnapshot as getRealTimeServerSnapshot }