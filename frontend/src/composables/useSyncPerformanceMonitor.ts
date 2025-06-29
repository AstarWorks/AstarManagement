/**
 * Sync Performance Monitor Composable
 * 
 * @description Comprehensive performance monitoring system for background sync
 * operations, tracking metrics, network quality, resource usage, and providing
 * insights into sync efficiency for the Aster Management legal case system.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task Performance Monitoring
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useRealtimeSync } from './useRealtimeSync'
import { useWebSocketConnection } from './useWebSocketConnection'
import { NETWORK_CONFIG, PERFORMANCE_CONFIG } from '~/config/background-sync'
import type { SyncMode, NetworkQuality } from '~/config/background-sync'

/**
 * Sync operation metrics
 */
export interface SyncMetrics {
  operationId: string
  type: 'query' | 'mutation' | 'websocket' | 'cache'
  operation: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: string
  dataSize?: number
  networkRequests?: number
  cacheHit?: boolean
}

/**
 * Network quality metrics
 */
export interface NetworkMetrics {
  quality: NetworkQuality
  isOnline: boolean
  effectiveType?: string
  downlink?: number // Mbps
  rtt?: number // Round-trip time in ms
  saveData?: boolean
  lastChecked: number
}

/**
 * Resource usage metrics
 */
export interface ResourceMetrics {
  memory: {
    used: number // MB
    limit: number // MB
    percentage: number
  }
  battery?: {
    level: number // 0-100
    charging: boolean
    dischargingTime?: number // minutes
  }
  cpu?: {
    cores: number
    usage: number // percentage
  }
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  size: number // MB
  queryCount: number
  mutationCount: number
  evictions: number
}

/**
 * WebSocket performance metrics
 */
export interface WebSocketMetrics {
  connected: boolean
  latency: number | null
  messagesReceived: number
  messagesSent: number
  reconnectAttempts: number
  connectionUptime: number // seconds
  dataTransferred: number // bytes
}

/**
 * Aggregated performance data
 */
export interface PerformanceData {
  timestamp: number
  syncMode: SyncMode
  metrics: {
    sync: {
      total: number
      successful: number
      failed: number
      averageDuration: number
      p95Duration: number
      p99Duration: number
    }
    network: NetworkMetrics
    cache: CacheMetrics
    websocket: WebSocketMetrics
    resources: ResourceMetrics
  }
}

/**
 * Performance monitoring composable
 */
export function useSyncPerformanceMonitor() {
  const queryClient = useQueryClient()
  const { connectionState, latency, messageCount, getConnectionInfo } = useRealtimeSync()
  
  // Metrics storage
  const syncMetrics = ref<SyncMetrics[]>([])
  const networkMetrics = ref<NetworkMetrics>({
    quality: 'good',
    isOnline: true,
    lastChecked: Date.now()
  })
  const resourceMetrics = ref<ResourceMetrics>({
    memory: { used: 0, limit: 0, percentage: 0 }
  })
  const cacheMetrics = ref<CacheMetrics>({
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    queryCount: 0,
    mutationCount: 0,
    evictions: 0
  })
  const websocketMetrics = ref<WebSocketMetrics>({
    connected: false,
    latency: null,
    messagesReceived: 0,
    messagesSent: 0,
    reconnectAttempts: 0,
    connectionUptime: 0,
    dataTransferred: 0
  })
  
  // Performance history
  const performanceHistory = ref<PerformanceData[]>([])
  const maxHistorySize = 100
  
  // Monitoring intervals
  let networkCheckInterval: NodeJS.Timeout | null = null
  let resourceCheckInterval: NodeJS.Timeout | null = null
  let historyUpdateInterval: NodeJS.Timeout | null = null
  let performanceObserver: PerformanceObserver | null = null
  
  /**
   * Track sync operation
   */
  const trackSyncOperation = (operation: Omit<SyncMetrics, 'operationId' | 'startTime'>) => {
    const metric: SyncMetrics = {
      ...operation,
      operationId: crypto.randomUUID(),
      startTime: Date.now()
    }
    
    syncMetrics.value.push(metric)
    
    // Keep only recent metrics (last 1000)
    if (syncMetrics.value.length > 1000) {
      syncMetrics.value = syncMetrics.value.slice(-1000)
    }
    
    return metric.operationId
  }
  
  /**
   * Complete sync operation tracking
   */
  const completeSyncOperation = (operationId: string, success: boolean, error?: string) => {
    const metric = syncMetrics.value.find(m => m.operationId === operationId)
    if (metric) {
      metric.endTime = Date.now()
      metric.duration = metric.endTime - metric.startTime
      metric.success = success
      metric.error = error
    }
  }
  
  /**
   * Check network quality
   */
  const checkNetworkQuality = async () => {
    try {
      // Use Navigation API if available
      const nav = navigator as any
      if (nav.connection) {
        const connection = nav.connection
        networkMetrics.value = {
          quality: determineNetworkQuality(connection),
          isOnline: navigator.onLine,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          lastChecked: Date.now()
        }
      } else {
        // Fallback: ping endpoint to measure latency
        const startTime = performance.now()
        const response = await fetch(NETWORK_CONFIG.ping.endpoints[0], {
          method: 'HEAD',
          cache: 'no-cache'
        })
        const endTime = performance.now()
        
        if (response.ok) {
          const rtt = Math.round(endTime - startTime)
          networkMetrics.value = {
            quality: rtt < 100 ? 'excellent' : rtt < 200 ? 'good' : rtt < 400 ? 'fair' : 'poor',
            isOnline: true,
            rtt,
            lastChecked: Date.now()
          }
        }
      }
    } catch (error) {
      networkMetrics.value = {
        quality: 'offline',
        isOnline: false,
        lastChecked: Date.now()
      }
    }
  }
  
  /**
   * Determine network quality based on connection info
   */
  const determineNetworkQuality = (connection: any): NetworkQuality => {
    const { qualityThresholds } = NETWORK_CONFIG
    
    if (!navigator.onLine) return 'offline'
    
    const rtt = connection.rtt || 0
    const downlink = connection.downlink || 0
    
    if (rtt <= qualityThresholds.excellent.rtt && downlink >= qualityThresholds.excellent.downlink) {
      return 'excellent'
    } else if (rtt <= qualityThresholds.good.rtt && downlink >= qualityThresholds.good.downlink) {
      return 'good'
    } else if (rtt <= qualityThresholds.fair.rtt && downlink >= qualityThresholds.fair.downlink) {
      return 'fair'
    } else {
      return 'poor'
    }
  }
  
  /**
   * Check resource usage
   */
  const checkResourceUsage = async () => {
    try {
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory
        resourceMetrics.value.memory = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576),
          percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
        }
      }
      
      // Battery status
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery()
        resourceMetrics.value.battery = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          dischargingTime: battery.dischargingTime !== Infinity 
            ? Math.round(battery.dischargingTime / 60) 
            : undefined
        }
      }
      
      // CPU usage (limited API access)
      if (navigator.hardwareConcurrency) {
        resourceMetrics.value.cpu = {
          cores: navigator.hardwareConcurrency,
          usage: estimateCPUUsage()
        }
      }
    } catch (error) {
      console.debug('Resource monitoring error:', error)
    }
  }
  
  /**
   * Estimate CPU usage based on main thread blocking
   */
  const estimateCPUUsage = (): number => {
    // This is a rough estimate based on recent sync operations
    const recentOps = syncMetrics.value
      .filter(m => m.endTime && Date.now() - m.endTime < 5000)
    
    if (recentOps.length === 0) return 0
    
    const totalDuration = recentOps.reduce((sum, m) => sum + (m.duration || 0), 0)
    const timeWindow = 5000 // 5 seconds
    
    return Math.min(Math.round((totalDuration / timeWindow) * 100), 100)
  }
  
  /**
   * Update cache metrics
   */
  const updateCacheMetrics = () => {
    const queryCache = queryClient.getQueryCache()
    const mutationCache = queryClient.getMutationCache()
    
    // Count cache hits/misses from recent operations
    const recentCacheOps = syncMetrics.value.filter(m => m.type === 'cache')
    const hits = recentCacheOps.filter(m => m.cacheHit === true).length
    const misses = recentCacheOps.filter(m => m.cacheHit === false).length
    const total = hits + misses
    
    cacheMetrics.value = {
      hits,
      misses,
      hitRate: total > 0 ? Math.round((hits / total) * 100) : 0,
      size: estimateCacheSize(),
      queryCount: queryCache.getAll().length,
      mutationCount: mutationCache.getAll().length,
      evictions: 0 // Would need to track this separately
    }
  }
  
  /**
   * Estimate cache size in MB
   */
  const estimateCacheSize = (): number => {
    const queryCache = queryClient.getQueryCache()
    let totalSize = 0
    
    queryCache.getAll().forEach(query => {
      if (query.state.data) {
        // Rough estimate of object size
        totalSize += JSON.stringify(query.state.data).length
      }
    })
    
    return Math.round(totalSize / 1048576 * 10) / 10 // Convert to MB with 1 decimal
  }
  
  /**
   * Update WebSocket metrics
   */
  const updateWebSocketMetrics = () => {
    const connInfo = getConnectionInfo()
    
    websocketMetrics.value = {
      connected: connInfo.status === 'connected',
      latency: connInfo.latency,
      messagesReceived: messageCount.value,
      messagesSent: syncMetrics.value.filter(m => m.type === 'websocket').length,
      reconnectAttempts: connInfo.reconnectAttempts || 0,
      connectionUptime: connInfo.lastConnectedAt 
        ? Math.round((Date.now() - connInfo.lastConnectedAt) / 1000) 
        : 0,
      dataTransferred: estimateDataTransferred()
    }
  }
  
  /**
   * Estimate data transferred over WebSocket
   */
  const estimateDataTransferred = (): number => {
    return syncMetrics.value
      .filter(m => m.type === 'websocket')
      .reduce((sum, m) => sum + (m.dataSize || 0), 0)
  }
  
  /**
   * Calculate sync operation statistics
   */
  const calculateSyncStats = () => {
    const operations = syncMetrics.value.filter(m => m.duration !== undefined)
    
    if (operations.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0
      }
    }
    
    const durations = operations
      .map(m => m.duration!)
      .sort((a, b) => a - b)
    
    return {
      total: operations.length,
      successful: operations.filter(m => m.success).length,
      failed: operations.filter(m => !m.success).length,
      averageDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0
    }
  }
  
  /**
   * Update performance history
   */
  const updatePerformanceHistory = () => {
    updateCacheMetrics()
    updateWebSocketMetrics()
    
    const performanceData: PerformanceData = {
      timestamp: Date.now(),
      syncMode: getCurrentSyncMode(),
      metrics: {
        sync: calculateSyncStats(),
        network: { ...networkMetrics.value },
        cache: { ...cacheMetrics.value },
        websocket: { ...websocketMetrics.value },
        resources: { ...resourceMetrics.value }
      }
    }
    
    performanceHistory.value.push(performanceData)
    
    // Keep only recent history
    if (performanceHistory.value.length > maxHistorySize) {
      performanceHistory.value = performanceHistory.value.slice(-maxHistorySize)
    }
  }
  
  /**
   * Get current sync mode
   */
  const getCurrentSyncMode = (): SyncMode => {
    // This would be retrieved from user settings or determined by conditions
    const mode = localStorage.getItem('sync-mode')
    return (mode as SyncMode) || 'balanced'
  }
  
  /**
   * Set up performance observer for network requests
   */
  const setupPerformanceObserver = () => {
    if (!('PerformanceObserver' in window)) return
    
    performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('/api/')) {
          const fetchEntry = entry as PerformanceResourceTiming
          trackSyncOperation({
            type: 'query',
            operation: entry.name,
            duration: Math.round(fetchEntry.duration),
            success: true,
            dataSize: fetchEntry.transferSize || 0,
            networkRequests: 1
          })
        }
      }
    })
    
    performanceObserver.observe({ entryTypes: ['resource'] })
  }
  
  /**
   * Export performance data
   */
  const exportMetrics = () => {
    const data = {
      exportDate: new Date().toISOString(),
      syncMode: getCurrentSyncMode(),
      operations: syncMetrics.value,
      history: performanceHistory.value,
      summary: {
        totalOperations: syncMetrics.value.length,
        successRate: Math.round((syncMetrics.value.filter(m => m.success).length / syncMetrics.value.length) * 100),
        averageLatency: websocketMetrics.value.latency,
        cacheHitRate: cacheMetrics.value.hitRate,
        networkQuality: networkMetrics.value.quality
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sync-metrics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  /**
   * Clear metrics data
   */
  const clearMetrics = () => {
    syncMetrics.value = []
    performanceHistory.value = []
  }
  
  // Computed properties
  const currentPerformance = computed(() => {
    return performanceHistory.value[performanceHistory.value.length - 1] || null
  })
  
  const isPerformanceOptimal = computed(() => {
    if (!currentPerformance.value) return true
    
    const { sync, network, resources } = currentPerformance.value.metrics
    
    return (
      sync.averageDuration < 1000 && // Sync ops under 1 second
      network.quality !== 'poor' && network.quality !== 'offline' &&
      resources.memory.percentage < 80 &&
      (!resources.battery || resources.battery.level > 20 || resources.battery.charging)
    )
  })
  
  const performanceScore = computed(() => {
    if (!currentPerformance.value) return 100
    
    const { sync, network, cache, resources } = currentPerformance.value.metrics
    
    let score = 100
    
    // Deduct points for poor metrics
    if (sync.averageDuration > 2000) score -= 20
    else if (sync.averageDuration > 1000) score -= 10
    
    if (network.quality === 'poor') score -= 20
    else if (network.quality === 'fair') score -= 10
    
    if (cache.hitRate < 50) score -= 15
    else if (cache.hitRate < 70) score -= 5
    
    if (resources.memory.percentage > 90) score -= 15
    else if (resources.memory.percentage > 80) score -= 5
    
    if (resources.battery && !resources.battery.charging && resources.battery.level < 20) {
      score -= 20
    }
    
    return Math.max(0, score)
  })
  
  // Lifecycle
  onMounted(() => {
    // Initial checks
    checkNetworkQuality()
    checkResourceUsage()
    updatePerformanceHistory()
    
    // Set up monitoring intervals
    networkCheckInterval = setInterval(checkNetworkQuality, NETWORK_CONFIG.detection.checkInterval)
    resourceCheckInterval = setInterval(checkResourceUsage, 10000) // Every 10 seconds
    historyUpdateInterval = setInterval(updatePerformanceHistory, 30000) // Every 30 seconds
    
    // Set up performance observer
    setupPerformanceObserver()
  })
  
  onUnmounted(() => {
    if (networkCheckInterval) clearInterval(networkCheckInterval)
    if (resourceCheckInterval) clearInterval(resourceCheckInterval)
    if (historyUpdateInterval) clearInterval(historyUpdateInterval)
    if (performanceObserver) performanceObserver.disconnect()
  })
  
  return {
    // Metrics
    syncMetrics: computed(() => syncMetrics.value),
    networkMetrics: computed(() => networkMetrics.value),
    resourceMetrics: computed(() => resourceMetrics.value),
    cacheMetrics: computed(() => cacheMetrics.value),
    websocketMetrics: computed(() => websocketMetrics.value),
    
    // Performance data
    performanceHistory: computed(() => performanceHistory.value),
    currentPerformance,
    isPerformanceOptimal,
    performanceScore,
    
    // Methods
    trackSyncOperation,
    completeSyncOperation,
    exportMetrics,
    clearMetrics,
    
    // Manual checks
    checkNetworkQuality,
    checkResourceUsage,
    updatePerformanceHistory
  }
}