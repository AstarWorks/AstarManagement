/**
 * Multi-Tab Synchronization Composable
 * 
 * @description Manages coordination between multiple browser tabs to prevent
 * duplicate API requests and ensure consistent data synchronization. Uses
 * BroadcastChannel API with localStorage fallback for broader compatibility.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T08_S08 - Background Sync Configuration
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { nanoid } from 'nanoid'

/**
 * Message types for cross-tab communication
 */
export type TabMessageType = 
  | 'leader-election'
  | 'leader-claim'
  | 'leader-release'
  | 'sync-start'
  | 'sync-complete'
  | 'query-invalidate'
  | 'mutation-start'
  | 'mutation-complete'
  | 'tab-activate'
  | 'tab-deactivate'

/**
 * Cross-tab message structure
 */
export interface TabMessage {
  id: string
  type: TabMessageType
  tabId: string
  timestamp: number
  payload?: any
}

/**
 * Tab state information
 */
export interface TabState {
  id: string
  isLeader: boolean
  lastActivity: number
  syncInProgress: boolean
}

/**
 * Multi-tab sync configuration
 */
export interface MultiTabSyncConfig {
  /**
   * Channel name for BroadcastChannel
   */
  channelName?: string
  
  /**
   * Leader election timeout in milliseconds
   */
  leaderTimeout?: number
  
  /**
   * Tab inactivity timeout in milliseconds
   */
  inactivityTimeout?: number
  
  /**
   * Enable debug logging
   */
  debug?: boolean
}

const DEFAULT_CONFIG: Required<MultiTabSyncConfig> = {
  channelName: 'aster-sync-channel',
  leaderTimeout: 2000,
  inactivityTimeout: 10000,
  debug: process.env.NODE_ENV === 'development'
}

/**
 * Multi-tab synchronization with leader election and request deduplication
 */
export function useMultiTabSync(userConfig: MultiTabSyncConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig }
  const queryClient = useQueryClient()
  
  // State
  const tabId = ref(nanoid(8))
  const isLeader = ref(false)
  const activeTabs = ref(new Map<string, TabState>())
  const syncOperations = ref(new Set<string>())
  const messageQueue = ref<TabMessage[]>([])
  
  // Communication channel
  let channel: BroadcastChannel | null = null
  let storageListener: ((e: StorageEvent) => void) | null = null
  let heartbeatInterval: NodeJS.Timeout | null = null
  let electionTimeout: NodeJS.Timeout | null = null
  
  /**
   * Check if BroadcastChannel is supported
   */
  const isBroadcastChannelSupported = typeof BroadcastChannel !== 'undefined'
  
  /**
   * Send message to other tabs
   */
  const sendMessage = (type: TabMessageType, payload?: any) => {
    const message: TabMessage = {
      id: nanoid(),
      type,
      tabId: tabId.value,
      timestamp: Date.now(),
      payload
    }
    
    if (config.debug) {
      console.log(`[Tab ${tabId.value}] Sending:`, type, payload)
    }
    
    if (isBroadcastChannelSupported && channel) {
      channel.postMessage(message)
    } else {
      // Fallback to localStorage for older browsers
      localStorage.setItem(
        `${config.channelName}-message`,
        JSON.stringify(message)
      )
      // Trigger storage event manually for same-tab testing
      window.dispatchEvent(new StorageEvent('storage', {
        key: `${config.channelName}-message`,
        newValue: JSON.stringify(message)
      }))
    }
  }
  
  /**
   * Handle incoming messages from other tabs
   */
  const handleMessage = (message: TabMessage) => {
    // Ignore own messages
    if (message.tabId === tabId.value) return
    
    if (config.debug) {
      console.log(`[Tab ${tabId.value}] Received:`, message.type, message.payload)
    }
    
    // Update tab activity
    const tabState: TabState = {
      id: message.tabId,
      isLeader: false,
      lastActivity: message.timestamp,
      syncInProgress: false
    }
    
    switch (message.type) {
      case 'leader-election':
        // Participate in leader election
        if (isLeader.value) {
          sendMessage('leader-claim')
        }
        break
        
      case 'leader-claim':
        // Another tab claimed leadership
        tabState.isLeader = true
        activeTabs.value.set(message.tabId, tabState)
        isLeader.value = false
        break
        
      case 'leader-release':
        // Leader is stepping down, start election
        activeTabs.value.delete(message.tabId)
        if (!isLeader.value) {
          startLeaderElection()
        }
        break
        
      case 'sync-start':
        // Track sync operation to avoid duplicates
        if (message.payload?.operationId) {
          syncOperations.value.add(message.payload.operationId)
          tabState.syncInProgress = true
        }
        activeTabs.value.set(message.tabId, tabState)
        break
        
      case 'sync-complete':
        // Clear sync operation
        if (message.payload?.operationId) {
          syncOperations.value.delete(message.payload.operationId)
          tabState.syncInProgress = false
        }
        activeTabs.value.set(message.tabId, tabState)
        break
        
      case 'query-invalidate':
        // Invalidate queries based on leader's instruction
        if (!isLeader.value && message.payload?.queryKey) {
          queryClient.invalidateQueries({
            queryKey: message.payload.queryKey
          })
        }
        break
        
      case 'mutation-start':
      case 'mutation-complete':
        // Track mutations to prevent conflicts
        activeTabs.value.set(message.tabId, tabState)
        break
        
      case 'tab-activate':
        activeTabs.value.set(message.tabId, tabState)
        break
        
      case 'tab-deactivate':
        activeTabs.value.delete(message.tabId)
        break
        
      default:
        activeTabs.value.set(message.tabId, tabState)
    }
    
    // Clean up inactive tabs
    cleanupInactiveTabs()
  }
  
  /**
   * Start leader election process
   */
  const startLeaderElection = () => {
    if (electionTimeout) {
      clearTimeout(electionTimeout)
    }
    
    if (config.debug) {
      console.log(`[Tab ${tabId.value}] Starting leader election`)
    }
    
    // Send election message
    sendMessage('leader-election')
    
    // Wait for responses
    electionTimeout = setTimeout(() => {
      // If no other leader claimed, become leader
      const hasLeader = Array.from(activeTabs.value.values()).some(tab => tab.isLeader)
      if (!hasLeader) {
        isLeader.value = true
        sendMessage('leader-claim')
        
        if (config.debug) {
          console.log(`[Tab ${tabId.value}] Became leader`)
        }
      }
    }, config.leaderTimeout)
  }
  
  /**
   * Clean up inactive tabs
   */
  const cleanupInactiveTabs = () => {
    const now = Date.now()
    const inactiveTabIds: string[] = []
    
    activeTabs.value.forEach((tab, tabId) => {
      if (now - tab.lastActivity > config.inactivityTimeout) {
        inactiveTabIds.push(tabId)
      }
    })
    
    inactiveTabIds.forEach(tabId => {
      activeTabs.value.delete(tabId)
    })
    
    // If leader is inactive, start new election
    const leaderTab = Array.from(activeTabs.value.values()).find(tab => tab.isLeader)
    if (!leaderTab && !isLeader.value) {
      startLeaderElection()
    }
  }
  
  /**
   * Send heartbeat to indicate tab is active
   */
  const sendHeartbeat = () => {
    sendMessage('tab-activate')
  }
  
  /**
   * Check if a sync operation is already in progress
   */
  const isSyncInProgress = (operationId: string): boolean => {
    return syncOperations.value.has(operationId)
  }
  
  /**
   * Register a sync operation to prevent duplicates
   */
  const registerSyncOperation = (operationId: string) => {
    if (!isSyncInProgress(operationId)) {
      syncOperations.value.add(operationId)
      sendMessage('sync-start', { operationId })
      
      // Auto-complete after timeout to prevent stuck operations
      setTimeout(() => {
        completeSyncOperation(operationId)
      }, 30000) // 30 seconds timeout
    }
  }
  
  /**
   * Complete a sync operation
   */
  const completeSyncOperation = (operationId: string) => {
    if (syncOperations.value.has(operationId)) {
      syncOperations.value.delete(operationId)
      sendMessage('sync-complete', { operationId })
    }
  }
  
  /**
   * Broadcast query invalidation to other tabs
   */
  const broadcastQueryInvalidation = (queryKey: unknown[]) => {
    if (isLeader.value) {
      sendMessage('query-invalidate', { queryKey })
    }
  }
  
  /**
   * Get sync statistics
   */
  const getSyncStats = () => ({
    tabId: tabId.value,
    isLeader: isLeader.value,
    activeTabs: activeTabs.value.size,
    syncOperations: syncOperations.value.size,
    messageQueueSize: messageQueue.value.length
  })
  
  // Lifecycle
  onMounted(() => {
    if (isBroadcastChannelSupported) {
      // Use BroadcastChannel for modern browsers
      channel = new BroadcastChannel(config.channelName)
      channel.onmessage = (event) => {
        handleMessage(event.data)
      }
    } else {
      // Fallback to localStorage for older browsers
      storageListener = (event: StorageEvent) => {
        if (event.key === `${config.channelName}-message` && event.newValue) {
          try {
            const message = JSON.parse(event.newValue)
            handleMessage(message)
          } catch (error) {
            console.error('Failed to parse storage message:', error)
          }
        }
      }
      window.addEventListener('storage', storageListener)
    }
    
    // Start heartbeat
    heartbeatInterval = setInterval(() => {
      sendHeartbeat()
      cleanupInactiveTabs()
    }, 5000) // Every 5 seconds
    
    // Initial leader election
    setTimeout(() => {
      startLeaderElection()
    }, 100)
    
    // Notify other tabs this tab is active
    sendMessage('tab-activate')
  })
  
  onUnmounted(() => {
    // Notify other tabs this tab is deactivating
    sendMessage('tab-deactivate')
    
    // Release leadership if leader
    if (isLeader.value) {
      sendMessage('leader-release')
    }
    
    // Clean up
    if (channel) {
      channel.close()
    }
    
    if (storageListener) {
      window.removeEventListener('storage', storageListener)
    }
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
    
    if (electionTimeout) {
      clearTimeout(electionTimeout)
    }
  })
  
  return {
    // State
    tabId: computed(() => tabId.value),
    isLeader: computed(() => isLeader.value),
    activeTabs: computed(() => activeTabs.value.size),
    
    // Methods
    isSyncInProgress,
    registerSyncOperation,
    completeSyncOperation,
    broadcastQueryInvalidation,
    getSyncStats,
    
    // Utilities
    sendMessage
  }
}