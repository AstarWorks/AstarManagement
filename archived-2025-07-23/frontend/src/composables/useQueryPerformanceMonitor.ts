/**
 * TanStack Query Performance Monitor
 * 
 * @description Comprehensive performance monitoring system for TanStack Query operations.
 * Tracks query and mutation timing, success rates, cache hits, and memory usage.
 * Provides real-time metrics to achieve sub-200ms response targets.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, reactive } from 'vue'
import type { QueryClient } from '@tanstack/vue-query'

/**
 * Query performance metrics
 */
interface QueryMetrics {
  queryHash: string
  queryKey: any[]
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'success' | 'error'
  error?: any
  size?: number
  cacheHit?: boolean
}

/**
 * Mutation performance metrics
 */
interface MutationMetrics {
  mutationId: string
  mutationKey?: any[]
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'success' | 'error'
  error?: any
  variables?: any
}

/**
 * Memory usage metrics
 */
interface MemoryMetrics {
  timestamp: number
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  percentUsed: number
}

/**
 * Cache metrics
 */
interface CacheMetrics {
  timestamp: number
  queryCacheSize: number
  mutationCacheSize: number
  totalCacheSize: number
}

/**
 * Performance summary statistics
 */
interface PerformanceSummary {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  averageQueryTime: number
  p50QueryTime: number
  p95QueryTime: number
  p99QueryTime: number
  cacheHitRate: number
  totalMutations: number
  successfulMutations: number
  failedMutations: number
  averageMutationTime: number
}

/**
 * Performance thresholds for monitoring
 */
const PERFORMANCE_THRESHOLDS = {
  QUERY_WARNING_MS: 200,
  QUERY_CRITICAL_MS: 500,
  MUTATION_WARNING_MS: 300,
  MUTATION_CRITICAL_MS: 1000,
  MEMORY_WARNING_MB: 50,
  MEMORY_CRITICAL_MB: 100,
  CACHE_SIZE_WARNING: 100,
  CACHE_SIZE_CRITICAL: 500
} as const

export function useQueryPerformanceMonitor() {
  // Metrics storage
  const queryMetrics = ref<Map<string, QueryMetrics>>(new Map())
  const mutationMetrics = ref<Map<string, MutationMetrics>>(new Map())
  const memoryHistory = ref<MemoryMetrics[]>([])
  const cacheHistory = ref<CacheMetrics[]>([])
  
  // Real-time counters
  const activeQueries = ref(0)
  const activeMutations = ref(0)
  const totalCacheHits = ref(0)
  const totalCacheMisses = ref(0)
  
  // Performance alerts
  const performanceAlerts = ref<Array<{
    id: string
    type: 'warning' | 'critical'
    category: 'query' | 'mutation' | 'memory' | 'cache'
    message: string
    timestamp: number
    details?: any
  }>>([])
  
  /**
   * Record query start
   */
  const recordQueryStart = (queryHash: string, queryKey?: any[]) => {
    queryMetrics.value.set(queryHash, {
      queryHash,
      queryKey: queryKey || [],
      startTime: performance.now(),
      status: 'pending'
    })
    activeQueries.value++
  }
  
  /**
   * Record query success
   */
  const recordQuerySuccess = (queryHash: string, data?: any, cacheHit = false) => {
    const metric = queryMetrics.value.get(queryHash)
    if (!metric) return
    
    const endTime = performance.now()
    const duration = endTime - metric.startTime
    
    metric.endTime = endTime
    metric.duration = duration
    metric.status = 'success'
    metric.cacheHit = cacheHit
    
    if (data) {
      try {
        metric.size = JSON.stringify(data).length
      } catch {}
    }
    
    activeQueries.value = Math.max(0, activeQueries.value - 1)
    
    if (cacheHit) {
      totalCacheHits.value++
    } else {
      totalCacheMisses.value++
    }
    
    // Check performance thresholds
    if (duration > PERFORMANCE_THRESHOLDS.QUERY_CRITICAL_MS) {
      addAlert('critical', 'query', `Query took ${duration.toFixed(0)}ms (>${PERFORMANCE_THRESHOLDS.QUERY_CRITICAL_MS}ms)`, {
        queryHash,
        queryKey: metric.queryKey,
        duration
      })
    } else if (duration > PERFORMANCE_THRESHOLDS.QUERY_WARNING_MS) {
      addAlert('warning', 'query', `Query took ${duration.toFixed(0)}ms (>${PERFORMANCE_THRESHOLDS.QUERY_WARNING_MS}ms)`, {
        queryHash,
        queryKey: metric.queryKey,
        duration
      })
    }
  }
  
  /**
   * Record query error
   */
  const recordQueryError = (queryHash: string, error: any) => {
    const metric = queryMetrics.value.get(queryHash)
    if (!metric) return
    
    const endTime = performance.now()
    metric.endTime = endTime
    metric.duration = endTime - metric.startTime
    metric.status = 'error'
    metric.error = error
    
    activeQueries.value = Math.max(0, activeQueries.value - 1)
    
    addAlert('critical', 'query', `Query failed: ${error?.message || 'Unknown error'}`, {
      queryHash,
      queryKey: metric.queryKey,
      error
    })
  }
  
  /**
   * Record mutation start
   */
  const recordMutationStart = (mutationId: string, variables?: any, mutationKey?: any[]) => {
    mutationMetrics.value.set(mutationId, {
      mutationId,
      mutationKey,
      startTime: performance.now(),
      status: 'pending',
      variables
    })
    activeMutations.value++
  }
  
  /**
   * Record mutation success
   */
  const recordMutationSuccess = (mutationId: string) => {
    const metric = mutationMetrics.value.get(mutationId)
    if (!metric) return
    
    const endTime = performance.now()
    const duration = endTime - metric.startTime
    
    metric.endTime = endTime
    metric.duration = duration
    metric.status = 'success'
    
    activeMutations.value = Math.max(0, activeMutations.value - 1)
    
    // Check performance thresholds
    if (duration > PERFORMANCE_THRESHOLDS.MUTATION_CRITICAL_MS) {
      addAlert('critical', 'mutation', `Mutation took ${duration.toFixed(0)}ms (>${PERFORMANCE_THRESHOLDS.MUTATION_CRITICAL_MS}ms)`, {
        mutationId,
        duration
      })
    } else if (duration > PERFORMANCE_THRESHOLDS.MUTATION_WARNING_MS) {
      addAlert('warning', 'mutation', `Mutation took ${duration.toFixed(0)}ms (>${PERFORMANCE_THRESHOLDS.MUTATION_WARNING_MS}ms)`, {
        mutationId,
        duration
      })
    }
  }
  
  /**
   * Record mutation error
   */
  const recordMutationError = (mutationId: string, error: any) => {
    const metric = mutationMetrics.value.get(mutationId)
    if (!metric) return
    
    const endTime = performance.now()
    metric.endTime = endTime
    metric.duration = endTime - metric.startTime
    metric.status = 'error'
    metric.error = error
    
    activeMutations.value = Math.max(0, activeMutations.value - 1)
    
    addAlert('critical', 'mutation', `Mutation failed: ${error?.message || 'Unknown error'}`, {
      mutationId,
      error
    })
  }
  
  /**
   * Update memory usage metrics
   */
  const updateMemoryUsage = (memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }) => {
    const percentUsed = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    const usedMB = memory.usedJSHeapSize / 1024 / 1024
    
    const metric: MemoryMetrics = {
      timestamp: Date.now(),
      ...memory,
      percentUsed
    }
    
    memoryHistory.value.push(metric)
    
    // Keep only last 100 entries
    if (memoryHistory.value.length > 100) {
      memoryHistory.value = memoryHistory.value.slice(-100)
    }
    
    // Check memory thresholds
    if (usedMB > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL_MB) {
      addAlert('critical', 'memory', `High memory usage: ${usedMB.toFixed(0)}MB (>${PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL_MB}MB)`, {
        usedMB,
        percentUsed
      })
    } else if (usedMB > PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB) {
      addAlert('warning', 'memory', `Memory usage: ${usedMB.toFixed(0)}MB (>${PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB}MB)`, {
        usedMB,
        percentUsed
      })
    }
  }
  
  /**
   * Update cache metrics
   */
  const updateCacheMetrics = (cache: {
    queryCacheSize: number
    mutationCacheSize: number
  }) => {
    const totalSize = cache.queryCacheSize + cache.mutationCacheSize
    
    const metric: CacheMetrics = {
      timestamp: Date.now(),
      ...cache,
      totalCacheSize: totalSize
    }
    
    cacheHistory.value.push(metric)
    
    // Keep only last 100 entries
    if (cacheHistory.value.length > 100) {
      cacheHistory.value = cacheHistory.value.slice(-100)
    }
    
    // Check cache size thresholds
    if (totalSize > PERFORMANCE_THRESHOLDS.CACHE_SIZE_CRITICAL) {
      addAlert('critical', 'cache', `Large cache size: ${totalSize} entries (>${PERFORMANCE_THRESHOLDS.CACHE_SIZE_CRITICAL})`, {
        queryCacheSize: cache.queryCacheSize,
        mutationCacheSize: cache.mutationCacheSize
      })
    } else if (totalSize > PERFORMANCE_THRESHOLDS.CACHE_SIZE_WARNING) {
      addAlert('warning', 'cache', `Cache size: ${totalSize} entries (>${PERFORMANCE_THRESHOLDS.CACHE_SIZE_WARNING})`, {
        queryCacheSize: cache.queryCacheSize,
        mutationCacheSize: cache.mutationCacheSize
      })
    }
  }
  
  /**
   * Add performance alert
   */
  const addAlert = (
    type: 'warning' | 'critical',
    category: 'query' | 'mutation' | 'memory' | 'cache',
    message: string,
    details?: any
  ) => {
    const alert = {
      id: `${category}-${Date.now()}-${Math.random()}`,
      type,
      category,
      message,
      timestamp: Date.now(),
      details
    }
    
    performanceAlerts.value.push(alert)
    
    // Keep only last 50 alerts
    if (performanceAlerts.value.length > 50) {
      performanceAlerts.value = performanceAlerts.value.slice(-50)
    }
  }
  
  /**
   * Calculate performance summary
   */
  const performanceSummary = computed<PerformanceSummary>(() => {
    const queries = Array.from(queryMetrics.value.values())
    const mutations = Array.from(mutationMetrics.value.values())
    
    // Query statistics
    const completedQueries = queries.filter(q => q.status !== 'pending')
    const successfulQueries = queries.filter(q => q.status === 'success')
    const failedQueries = queries.filter(q => q.status === 'error')
    
    const queryTimes = successfulQueries
      .map(q => q.duration!)
      .filter(d => d !== undefined)
      .sort((a, b) => a - b)
    
    // Mutation statistics
    const completedMutations = mutations.filter(m => m.status !== 'pending')
    const successfulMutations = mutations.filter(m => m.status === 'success')
    const failedMutations = mutations.filter(m => m.status === 'error')
    
    const mutationTimes = successfulMutations
      .map(m => m.duration!)
      .filter(d => d !== undefined)
      .sort((a, b) => a - b)
    
    // Calculate percentiles
    const getPercentile = (arr: number[], percentile: number) => {
      if (arr.length === 0) return 0
      const index = Math.ceil((percentile / 100) * arr.length) - 1
      return arr[index] || 0
    }
    
    // Cache hit rate
    const totalCacheRequests = totalCacheHits.value + totalCacheMisses.value
    const cacheHitRate = totalCacheRequests > 0 
      ? (totalCacheHits.value / totalCacheRequests) * 100 
      : 0
    
    return {
      totalQueries: queries.length,
      successfulQueries: successfulQueries.length,
      failedQueries: failedQueries.length,
      averageQueryTime: queryTimes.length > 0 
        ? queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length 
        : 0,
      p50QueryTime: getPercentile(queryTimes, 50),
      p95QueryTime: getPercentile(queryTimes, 95),
      p99QueryTime: getPercentile(queryTimes, 99),
      cacheHitRate,
      totalMutations: mutations.length,
      successfulMutations: successfulMutations.length,
      failedMutations: failedMutations.length,
      averageMutationTime: mutationTimes.length > 0 
        ? mutationTimes.reduce((a, b) => a + b, 0) / mutationTimes.length 
        : 0
    }
  })
  
  /**
   * Get recent queries for debugging
   */
  const getRecentQueries = (limit = 10) => {
    return Array.from(queryMetrics.value.values())
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, limit)
  }
  
  /**
   * Get recent mutations for debugging
   */
  const getRecentMutations = (limit = 10) => {
    return Array.from(mutationMetrics.value.values())
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, limit)
  }
  
  /**
   * Clear all metrics
   */
  const clearMetrics = () => {
    queryMetrics.value.clear()
    mutationMetrics.value.clear()
    memoryHistory.value = []
    cacheHistory.value = []
    performanceAlerts.value = []
    totalCacheHits.value = 0
    totalCacheMisses.value = 0
  }
  
  /**
   * Export metrics for analysis
   */
  const exportMetrics = () => {
    return {
      queries: Array.from(queryMetrics.value.values()),
      mutations: Array.from(mutationMetrics.value.values()),
      memory: memoryHistory.value,
      cache: cacheHistory.value,
      alerts: performanceAlerts.value,
      summary: performanceSummary.value,
      timestamp: Date.now()
    }
  }
  
  /**
   * Initialize monitoring (setup intervals, listeners, etc.)
   */
  const initializeMonitoring = () => {
    // Clean up old metrics periodically
    setInterval(() => {
      const oneHourAgo = performance.now() - 3600000
      
      // Remove old query metrics
      for (const [hash, metric] of queryMetrics.value.entries()) {
        if (metric.startTime < oneHourAgo && metric.status !== 'pending') {
          queryMetrics.value.delete(hash)
        }
      }
      
      // Remove old mutation metrics
      for (const [id, metric] of mutationMetrics.value.entries()) {
        if (metric.startTime < oneHourAgo && metric.status !== 'pending') {
          mutationMetrics.value.delete(id)
        }
      }
    }, 60000) // Clean up every minute
  }
  
  /**
   * Get all metrics and methods
   */
  const getMetrics = () => ({
    // Recording methods
    recordQueryStart,
    recordQuerySuccess,
    recordQueryError,
    recordMutationStart,
    recordMutationSuccess,
    recordMutationError,
    updateMemoryUsage,
    updateCacheMetrics,
    
    // Data access
    activeQueries: computed(() => activeQueries.value),
    activeMutations: computed(() => activeMutations.value),
    performanceSummary,
    performanceAlerts: computed(() => performanceAlerts.value),
    memoryHistory: computed(() => memoryHistory.value),
    cacheHistory: computed(() => cacheHistory.value),
    
    // Utilities
    getRecentQueries,
    getRecentMutations,
    clearMetrics,
    exportMetrics
  })
  
  return {
    initializeMonitoring,
    getMetrics
  }
}

/**
 * Global performance monitor instance
 */
let globalMonitor: ReturnType<typeof useQueryPerformanceMonitor> | null = null

/**
 * Get or create the global performance monitor
 */
export function getGlobalQueryPerformanceMonitor() {
  if (!globalMonitor) {
    globalMonitor = useQueryPerformanceMonitor()
  }
  return globalMonitor
}