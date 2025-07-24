/**
 * Background Sync Composable
 * 
 * @description Manages background data synchronization with intelligent strategies
 * for tab visibility, network status, and WebSocket integration. Provides adaptive
 * sync rates based on user activity and system resources.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useWebSocketConnection } from './useWebSocketConnection'
import { 
  SYNC_CONFIGS, 
  NETWORK_CONFIG, 
  TAB_VISIBILITY_CONFIG,
  WEBSOCKET_CONFIG,
  PERFORMANCE_CONFIG,
  getDefaultSyncMode,
  getSyncConfig,
  type SyncMode,
  type NetworkQuality,
  type TabVisibility
} from '~/config/background-sync'

/**
 * Network information type based on Network Information API
 */
interface NetworkInformation {
  downlink?: number
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
  rtt?: number
  saveData?: boolean
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown'
}

/**
 * Extended Navigator interface with Network Information API
 */
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
}

/**
 * Background sync state and controls
 */
export function useBackgroundSync() {
  // Get query client with error handling
  let queryClient: any = null
  
  try {
    queryClient = useQueryClient()
  } catch (error) {
    console.warn('Query client not available yet, background sync will be initialized later')
    // Return a mock object that will be replaced when the plugin is properly initialized
    return {
      syncMode: ref('balanced'),
      syncStatus: ref('idle'),
      isOnline: ref(navigator.onLine),
      networkQuality: ref('good'),
      tabVisibility: ref('active'),
      lastSyncTime: ref(Date.now()),
      wsConnected: ref(false),
      setSyncMode: () => {},
      syncAllData: () => Promise.resolve(),
      syncDataType: () => Promise.resolve(),
      getSyncStats: () => ({}),
      batteryLevel: ref(null),
      memoryUsage: ref(null)
    }
  }
  
  if (!queryClient) {
    console.warn('Query client is null, background sync will be initialized later')
    return {
      syncMode: ref('balanced'),
      syncStatus: ref('idle'),
      isOnline: ref(navigator.onLine),
      networkQuality: ref('good'),
      tabVisibility: ref('active'),
      lastSyncTime: ref(Date.now()),
      wsConnected: ref(false),
      setSyncMode: () => {},
      syncAllData: () => Promise.resolve(),
      syncDataType: () => Promise.resolve(),
      getSyncStats: () => ({}),
      batteryLevel: ref(null),
      memoryUsage: ref(null)
    }
  }
  
  // State
  const syncMode = ref<SyncMode>(getDefaultSyncMode())
  const tabVisibility = ref<TabVisibility>('active')
  const networkQuality = ref<NetworkQuality>('good')
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const lastSyncTime = ref<number>(Date.now())
  const syncErrors = ref<Error[]>([])
  const wsConnected = ref(false)
  
  // Performance metrics
  const batteryLevel = ref<number | null>(null)
  const memoryUsage = ref<number | null>(null)
  
  // Intervals and timeouts
  let visibilityTimeout: NodeJS.Timeout | null = null
  let networkCheckInterval: NodeJS.Timeout | null = null
  let syncIntervals = new Map<string, NodeJS.Timeout>()
  
  // WebSocket connection (lazy initialization)
  let wsConnection: ReturnType<typeof useWebSocketConnection> | null = null
  
  /**
   * Computed sync status
   */
  const syncStatus = computed(() => {
    if (!isOnline.value) return 'offline'
    if (isSyncing.value) return 'syncing'
    if (syncErrors.value.length > 0) return 'error'
    if (wsConnected.value) return 'realtime'
    return 'idle'
  })
  
  /**
   * Check if sync is allowed based on current conditions
   */
  const canSync = computed(() => {
    // Don't sync if offline
    if (!isOnline.value) return false
    
    // Don't sync in manual mode unless explicitly requested
    if (syncMode.value === 'manual') return false
    
    // Check battery level if adaptive performance is enabled
    if (PERFORMANCE_CONFIG.adaptive.enabled && batteryLevel.value !== null) {
      if (batteryLevel.value < PERFORMANCE_CONFIG.adaptive.batteryThreshold) {
        return syncMode.value === 'aggressive' // Only aggressive mode syncs on low battery
      }
    }
    
    // Check memory usage if adaptive performance is enabled
    if (PERFORMANCE_CONFIG.adaptive.enabled && memoryUsage.value !== null) {
      if (memoryUsage.value > PERFORMANCE_CONFIG.adaptive.memoryThreshold) {
        return false // Stop syncing on high memory usage
      }
    }
    
    return true
  })
  
  /**
   * Detect network quality based on Network Information API
   */
  const detectNetworkQuality = (): NetworkQuality => {
    const nav = navigator as NavigatorWithConnection
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection
    
    if (!connection) {
      // Fallback to online/offline detection
      return isOnline.value ? 'good' : 'offline'
    }
    
    // Check against quality thresholds
    const { rtt, downlink, effectiveType } = connection
    
    if (effectiveType === 'slow-2g' || !isOnline.value) return 'offline'
    
    for (const [quality, threshold] of Object.entries(NETWORK_CONFIG.qualityThresholds)) {
      if (
        (!rtt || rtt <= threshold.rtt) &&
        (!downlink || downlink >= threshold.downlink)
      ) {
        return quality as NetworkQuality
      }
    }
    
    return 'poor'
  }
  
  /**
   * Check network status with ping endpoints
   */
  const checkNetworkStatus = async () => {
    if (!navigator.onLine) {
      networkQuality.value = 'offline'
      isOnline.value = false
      return
    }
    
    // Try to ping endpoints
    const { endpoints, timeout, retries } = NETWORK_CONFIG.ping
    
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const startTime = performance.now()
        const response = await fetch(endpoints[0], {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        })
        
        clearTimeout(timeoutId)
        const rtt = performance.now() - startTime
        
        if (response.ok) {
          isOnline.value = true
          // Estimate quality based on RTT
          if (rtt < 100) networkQuality.value = 'excellent'
          else if (rtt < 200) networkQuality.value = 'good'
          else if (rtt < 500) networkQuality.value = 'fair'
          else networkQuality.value = 'poor'
          return
        }
      } catch (error) {
        // Continue to next retry
      }
    }
    
    // If all pings failed, we're likely offline
    isOnline.value = false
    networkQuality.value = 'offline'
  }
  
  /**
   * Handle tab visibility changes
   */
  const handleVisibilityChange = () => {
    if (visibilityTimeout) {
      clearTimeout(visibilityTimeout)
      visibilityTimeout = null
    }
    
    if (document.hidden) {
      // Tab is hidden, wait before marking as background
      visibilityTimeout = setTimeout(() => {
        tabVisibility.value = 'background'
        adjustSyncRates()
      }, TAB_VISIBILITY_CONFIG.backgroundDelay)
      
      tabVisibility.value = 'hidden'
    } else {
      // Tab is visible
      tabVisibility.value = 'active'
      
      // Sync immediately if configured
      if (TAB_VISIBILITY_CONFIG.syncOnFocus && canSync.value) {
        syncAllData()
      }
      
      adjustSyncRates()
    }
  }
  
  /**
   * Check battery status if available
   */
  const checkBatteryStatus = async () => {
    if (!('getBattery' in navigator)) return
    
    try {
      const battery = await (navigator as any).getBattery()
      batteryLevel.value = battery.level * 100
      
      battery.addEventListener('levelchange', () => {
        batteryLevel.value = battery.level * 100
        adjustSyncRates()
      })
    } catch (error) {
      console.debug('Battery API not available')
    }
  }
  
  /**
   * Check memory usage if available
   */
  const checkMemoryUsage = () => {
    if (!('memory' in performance)) return
    
    const memory = (performance as any).memory
    if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
      memoryUsage.value = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }
  
  /**
   * Adjust sync rates based on current conditions
   */
  const adjustSyncRates = () => {
    // Clear existing intervals
    syncIntervals.forEach(interval => clearInterval(interval))
    syncIntervals.clear()
    
    if (!canSync.value) return
    
    // Get sync configurations for each data type
    const dataTypes = Object.keys(SYNC_CONFIGS) as Array<keyof typeof SYNC_CONFIGS>
    
    dataTypes.forEach(dataType => {
      const config = getSyncConfig(dataType, syncMode.value)
      
      // Check if network quality meets requirements
      const qualityLevels = ['offline', 'poor', 'fair', 'good', 'excellent']
      const currentQualityIndex = qualityLevels.indexOf(networkQuality.value)
      const requiredQualityIndex = qualityLevels.indexOf(config.minNetworkQuality)
      
      if (currentQualityIndex < requiredQualityIndex) return
      
      // Calculate actual interval based on tab visibility
      let interval = config.baseInterval
      if (tabVisibility.value === 'background' && config.refetchInBackground) {
        interval = interval / TAB_VISIBILITY_CONFIG.backgroundRateMultiplier
      } else if (tabVisibility.value !== 'active' && !config.refetchInBackground) {
        return // Don't sync in background if not configured
      }
      
      if (interval > 0) {
        const intervalId = setInterval(() => {
          syncDataType(dataType)
        }, interval)
        
        syncIntervals.set(dataType, intervalId)
      }
    })
  }
  
  /**
   * Sync data for a specific type
   */
  const syncDataType = async (dataType: string) => {
    if (!canSync.value) return
    
    try {
      isSyncing.value = true
      
      // Invalidate queries for this data type
      await queryClient.invalidateQueries({
        predicate: (query: any) => {
          const queryKey = query.queryKey as string[]
          return queryKey[0] === dataType
        }
      })
      
      lastSyncTime.value = Date.now()
    } catch (error) {
      console.error(`Sync error for ${dataType}:`, error)
      syncErrors.value.push(error as Error)
    } finally {
      isSyncing.value = false
    }
  }
  
  /**
   * Manually sync all data
   */
  const syncAllData = async () => {
    if (!isOnline.value) {
      console.warn('Cannot sync: offline')
      return
    }
    
    try {
      isSyncing.value = true
      syncErrors.value = []
      
      // Invalidate all queries
      await queryClient.invalidateQueries()
      
      lastSyncTime.value = Date.now()
    } catch (error) {
      console.error('Sync error:', error)
      syncErrors.value.push(error as Error)
    } finally {
      isSyncing.value = false
    }
  }
  
  /**
   * Initialize WebSocket connection
   */
  const initializeWebSocket = () => {
    if (!WEBSOCKET_CONFIG.endpoint || wsConnection) return
    
    wsConnection = useWebSocketConnection({
      url: WEBSOCKET_CONFIG.endpoint,
      reconnect: WEBSOCKET_CONFIG.reconnection.enabled,
      reconnectInterval: WEBSOCKET_CONFIG.reconnection.initialDelay,
      heartbeatInterval: WEBSOCKET_CONFIG.heartbeat.interval,
      protocols: ['v1.aster.realtime']
    })
    
    // Handle connection events
    wsConnection.on('connected', () => {
      wsConnected.value = true
      console.log('WebSocket connected for real-time updates')
    })
    
    wsConnection.on('disconnected', () => {
      wsConnected.value = false
      console.log('WebSocket disconnected')
    })
    
    // Handle real-time updates
    wsConnection.on('update', (data: any) => {
      handleRealtimeUpdate(data)
    })
  }
  
  /**
   * Handle real-time updates from WebSocket
   */
  const handleRealtimeUpdate = (data: any) => {
    if (!data.type || !data.payload) return
    
    switch (data.type) {
      case 'matter:updated':
      case 'matter:created':
      case 'matter:deleted':
        // Invalidate matter queries
        queryClient.invalidateQueries({ queryKey: ['matters'] })
        break
        
      case 'kanban:moved':
        // Update specific matter in cache
        queryClient.setQueryData(
          ['matters', data.payload.matterId],
          data.payload.matter
        )
        break
        
      case 'activity:new':
        // Invalidate activity queries
        queryClient.invalidateQueries({ queryKey: ['activity'] })
        break
        
      default:
        console.debug('Unknown realtime update type:', data.type)
    }
  }
  
  /**
   * Change sync mode
   */
  const setSyncMode = (mode: SyncMode) => {
    syncMode.value = mode
    
    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('sync-mode', mode)
    }
    
    // Adjust sync rates immediately
    adjustSyncRates()
    
    // Initialize or close WebSocket based on mode
    if (mode === 'aggressive' || mode === 'balanced') {
      initializeWebSocket()
    } else if (wsConnection) {
      wsConnection.disconnect()
      wsConnection = null
      wsConnected.value = false
    }
  }
  
  /**
   * Get sync statistics
   */
  const getSyncStats = () => ({
    mode: syncMode.value,
    status: syncStatus.value,
    lastSync: lastSyncTime.value,
    networkQuality: networkQuality.value,
    tabVisibility: tabVisibility.value,
    wsConnected: wsConnected.value,
    errors: syncErrors.value.length,
    batteryLevel: batteryLevel.value,
    memoryUsage: memoryUsage.value
  })
  
  // Lifecycle
  onMounted(() => {
    // Initial setup
    checkNetworkStatus()
    checkBatteryStatus()
    checkMemoryUsage()
    
    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', () => {
      isOnline.value = true
      checkNetworkStatus()
      adjustSyncRates()
    })
    window.addEventListener('offline', () => {
      isOnline.value = false
      networkQuality.value = 'offline'
      adjustSyncRates()
    })
    
    // Network Information API
    const nav = navigator as NavigatorWithConnection
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection
    if (connection && 'addEventListener' in connection) {
      (connection as any).addEventListener('change', () => {
        networkQuality.value = detectNetworkQuality()
        adjustSyncRates()
      })
    }
    
    // Start network monitoring
    networkCheckInterval = setInterval(() => {
      checkNetworkStatus()
      checkMemoryUsage()
    }, NETWORK_CONFIG.detection.checkInterval)
    
    // Initial sync rate adjustment
    adjustSyncRates()
    
    // Initialize WebSocket for aggressive/balanced modes
    if (syncMode.value === 'aggressive' || syncMode.value === 'balanced') {
      initializeWebSocket()
    }
  })
  
  onUnmounted(() => {
    // Clean up
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    
    if (visibilityTimeout) {
      clearTimeout(visibilityTimeout)
    }
    
    if (networkCheckInterval) {
      clearInterval(networkCheckInterval)
    }
    
    syncIntervals.forEach(interval => clearInterval(interval))
    syncIntervals.clear()
    
    if (wsConnection) {
      wsConnection.disconnect()
    }
  })
  
  return {
    // State
    syncMode: computed(() => syncMode.value),
    syncStatus,
    isOnline: computed(() => isOnline.value),
    networkQuality: computed(() => networkQuality.value),
    tabVisibility: computed(() => tabVisibility.value),
    lastSyncTime: computed(() => lastSyncTime.value),
    wsConnected: computed(() => wsConnected.value),
    
    // Methods
    setSyncMode,
    syncAllData,
    syncDataType,
    getSyncStats,
    
    // Performance metrics
    batteryLevel: computed(() => batteryLevel.value),
    memoryUsage: computed(() => memoryUsage.value)
  }
}