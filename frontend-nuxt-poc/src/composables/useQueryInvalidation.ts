/**
 * TanStack Query Invalidation Strategies
 * 
 * @description Intelligent query invalidation system that integrates with WebSocket 
 * and polling infrastructure to ensure data consistency across components and users.
 * Provides smart invalidation patterns, cascade rules, and performance optimization.
 * 
 * @author Claude
 * @created 2025-06-25
 * @task T06_S08
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/types/query'
import type { Matter, MatterStatus } from '~/types/kanban'
import type { RealTimeEvent } from '~/stores/kanban/real-time'

export interface InvalidationRule {
  /** Rule identifier */
  id: string
  /** Event types this rule applies to */
  eventTypes: string[]
  /** Query keys to invalidate */
  queryKeys: string[][]
  /** Whether to invalidate exact matches only */
  exact?: boolean
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Maximum number of invalidations per second */
  rateLimit?: number
  /** Cascade to related queries */
  cascade?: boolean
  /** Custom invalidation condition */
  condition?: (event: RealTimeEvent) => boolean
}

export interface InvalidationMetrics {
  totalInvalidations: number
  invalidationsByType: Record<string, number>
  averageInvalidationTime: number
  cascadeInvalidations: number
  debouncedInvalidations: number
  rateLimitedInvalidations: number
  lastInvalidationTime: Date | null
}

export interface InvalidationContext {
  /** Source of the invalidation */
  source: 'websocket' | 'polling' | 'manual' | 'mutation'
  /** User ID who initiated the change */
  userId?: string
  /** Whether this is a self-initiated change */
  isSelfInitiated?: boolean
  /** Event that triggered the invalidation */
  event?: RealTimeEvent
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Core query invalidation composable
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient()
  
  // State
  const invalidationRules = ref<InvalidationRule[]>([])
  const invalidationQueue = ref<Array<{ rule: InvalidationRule; event: RealTimeEvent; timestamp: Date }>>([])
  const isProcessingQueue = ref(false)
  const debounceTimers = ref<Map<string, NodeJS.Timeout>>(new Map())
  const rateLimitCounters = ref<Map<string, { count: number; resetTime: number }>>(new Map())
  
  // Metrics
  const metrics = ref<InvalidationMetrics>({
    totalInvalidations: 0,
    invalidationsByType: {},
    averageInvalidationTime: 0,
    cascadeInvalidations: 0,
    debouncedInvalidations: 0,
    rateLimitedInvalidations: 0,
    lastInvalidationTime: null
  })

  /**
   * Register default invalidation rules for matter operations
   */
  const setupDefaultRules = () => {
    const defaultRules: InvalidationRule[] = [
      // Matter updates - invalidate specific matter and lists
      {
        id: 'matter-update',
        eventTypes: ['matter_updated'],
        queryKeys: [queryKeys.lists(), queryKeys.statusCounts()],
        debounceMs: 500,
        cascade: true,
        condition: (event) => !!event.data?.id
      },
      
      // Matter creation - invalidate lists and statistics
      {
        id: 'matter-create', 
        eventTypes: ['matter_created'],
        queryKeys: [queryKeys.lists(), queryKeys.statistics(), queryKeys.statusCounts()],
        debounceMs: 300,
        cascade: false
      },
      
      // Matter deletion - invalidate all related queries
      {
        id: 'matter-delete',
        eventTypes: ['matter_deleted'],
        queryKeys: [queryKeys.lists(), queryKeys.statistics(), queryKeys.statusCounts()],
        debounceMs: 300,
        cascade: true
      },
      
      // Status changes - high frequency, need debouncing
      {
        id: 'status-change',
        eventTypes: ['matter_status_changed', 'matter_moved'],
        queryKeys: [queryKeys.statusCounts()],
        debounceMs: 1000,
        rateLimit: 5,
        cascade: false
      },
      
      // Assignment changes - invalidate assigned queries
      {
        id: 'assignment-change',
        eventTypes: ['matter_assigned', 'matter_unassigned'],
        queryKeys: [queryKeys.lists()],
        debounceMs: 500,
        cascade: true,
        condition: (event) => {
          // Only invalidate if assignment actually changed
          return event.data?.assignedLawyer !== event.data?.previousAssignedLawyer
        }
      },
      
      // Search index updates - invalidate search queries
      {
        id: 'search-update',
        eventTypes: ['matter_indexed', 'matter_reindexed'],
        queryKeys: [['matters', 'search']],
        debounceMs: 2000,
        rateLimit: 3
      },
      
      // User presence changes - minimal invalidation
      {
        id: 'user-presence',
        eventTypes: ['user_joined', 'user_left'],
        queryKeys: [],
        debounceMs: 5000,
        rateLimit: 1
      }
    ]
    
    invalidationRules.value = defaultRules
  }

  /**
   * Add a custom invalidation rule
   */
  const addRule = (rule: InvalidationRule) => {
    // Check for duplicate rule IDs
    const existingIndex = invalidationRules.value.findIndex(r => r.id === rule.id)
    if (existingIndex !== -1) {
      invalidationRules.value[existingIndex] = rule
    } else {
      invalidationRules.value.push(rule)
    }
  }

  /**
   * Remove an invalidation rule
   */
  const removeRule = (ruleId: string) => {
    const index = invalidationRules.value.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      invalidationRules.value.splice(index, 1)
    }
  }

  /**
   * Check if rate limiting allows invalidation
   */
  const isRateLimited = (ruleId: string, rateLimit: number): boolean => {
    const now = Date.now()
    const counter = rateLimitCounters.value.get(ruleId)
    
    if (!counter || now > counter.resetTime) {
      // Reset counter every second
      rateLimitCounters.value.set(ruleId, { count: 1, resetTime: now + 1000 })
      return false
    }
    
    if (counter.count >= rateLimit) {
      metrics.value.rateLimitedInvalidations++
      return true
    }
    
    counter.count++
    return false
  }

  /**
   * Execute invalidation with debouncing
   */
  const executeInvalidation = async (rule: InvalidationRule, event: RealTimeEvent, context: InvalidationContext) => {
    const startTime = performance.now()
    
    try {
      // Check rate limiting
      if (rule.rateLimit && isRateLimited(rule.id, rule.rateLimit)) {
        return
      }
      
      // Execute base invalidation
      for (const queryKey of rule.queryKeys) {
        await queryClient.invalidateQueries({
          queryKey,
          exact: rule.exact || false
        })
      }
      
      // Execute cascade invalidation
      if (rule.cascade && event.data?.id) {
        await executeCascadeInvalidation(event.data.id, event.type, context)
        metrics.value.cascadeInvalidations++
      }
      
      // Update metrics
      const endTime = performance.now()
      const invalidationTime = endTime - startTime
      
      metrics.value.totalInvalidations++
      metrics.value.invalidationsByType[event.type] = (metrics.value.invalidationsByType[event.type] || 0) + 1
      metrics.value.averageInvalidationTime = 
        (metrics.value.averageInvalidationTime * (metrics.value.totalInvalidations - 1) + invalidationTime) / 
        metrics.value.totalInvalidations
      metrics.value.lastInvalidationTime = new Date()
      
    } catch (error) {
      console.error(`Failed to execute invalidation for rule ${rule.id}:`, error)
    }
  }

  /**
   * Execute cascade invalidation for related queries
   */
  const executeCascadeInvalidation = async (matterId: string, eventType: string, context: InvalidationContext) => {
    const cascadeQueries: string[][] = []
    
    // Always invalidate specific matter detail
    cascadeQueries.push(queryKeys.detail(matterId))
    
    // Based on event type, determine additional cascades
    switch (eventType) {
      case 'matter_updated':
      case 'matter_status_changed':
        // Invalidate matter lists that might contain this matter
        cascadeQueries.push(queryKeys.lists())
        break
        
      case 'matter_assigned':
      case 'matter_unassigned':
        // Invalidate assigned matters queries
        if (context.event?.data?.assignedLawyer) {
          cascadeQueries.push(queryKeys.assignedMatters(context.event.data.assignedLawyer))
        }
        if (context.event?.data?.previousAssignedLawyer) {
          cascadeQueries.push(queryKeys.assignedMatters(context.event.data.previousAssignedLawyer))
        }
        break
        
      case 'matter_deleted':
        // Remove from all caches
        queryClient.removeQueries({ queryKey: queryKeys.detail(matterId) })
        cascadeQueries.push(queryKeys.lists())
        cascadeQueries.push(queryKeys.statistics())
        break
    }
    
    // Execute cascade invalidations
    for (const queryKey of cascadeQueries) {
      await queryClient.invalidateQueries({ queryKey })
    }
  }

  /**
   * Handle real-time event invalidation
   */
  const handleRealtimeEvent = (event: RealTimeEvent, context: InvalidationContext = { source: 'websocket' }) => {
    // Skip self-initiated events to prevent invalidation loops
    if (context.isSelfInitiated) {
      return
    }
    
    // Find matching rules
    const matchingRules = invalidationRules.value.filter(rule => {
      // Check event type match
      if (!rule.eventTypes.includes(event.type)) {
        return false
      }
      
      // Check custom condition
      if (rule.condition && !rule.condition(event)) {
        return false
      }
      
      return true
    })
    
    // Process each matching rule
    for (const rule of matchingRules) {
      if (rule.debounceMs) {
        // Debounced invalidation
        const timerId = debounceTimers.value.get(rule.id)
        if (timerId) {
          clearTimeout(timerId)
        }
        
        const newTimerId = setTimeout(async () => {
          await executeInvalidation(rule, event, context)
          debounceTimers.value.delete(rule.id)
          metrics.value.debouncedInvalidations++
        }, rule.debounceMs)
        
        debounceTimers.value.set(rule.id, newTimerId)
      } else {
        // Immediate invalidation
        executeInvalidation(rule, event, context)
      }
    }
  }

  /**
   * Handle polling-based invalidation
   */
  const handlePollingUpdate = (matters: Matter[], context: InvalidationContext = { source: 'polling' }) => {
    // Simple strategy: invalidate all matter-related queries
    // In a more sophisticated implementation, we could compare the data
    // and only invalidate queries for changed matters
    
    const pollingEvent: RealTimeEvent = {
      id: `polling-${Date.now()}`,
      type: 'polling_update',
      data: { matters },
      userId: context.userId || 'system',
      timestamp: new Date(),
      acknowledged: true
    }
    
    handleRealtimeEvent(pollingEvent, context)
  }

  /**
   * Manual invalidation utility
   */
  const invalidateQueries = async (queryKeys: string[][], options?: { cascade?: boolean }) => {
    const context: InvalidationContext = { source: 'manual' }
    
    for (const queryKey of queryKeys) {
      await queryClient.invalidateQueries({ queryKey })
    }
    
    if (options?.cascade) {
      // Trigger cascade invalidation for common patterns
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.statistics() })
    }
    
    metrics.value.totalInvalidations += queryKeys.length
    metrics.value.lastInvalidationTime = new Date()
  }

  /**
   * Optimistic update reconciliation
   */
  const reconcileOptimisticUpdate = async (matterId: string, serverData: Matter, optimisticData: Matter) => {
    // Compare optimistic vs server data
    const hasConflict = Object.keys(optimisticData).some(key => {
      const optimisticValue = (optimisticData as any)[key]
      const serverValue = (serverData as any)[key]
      
      // Skip metadata fields
      if (['updatedAt', 'version', '__optimistic'].includes(key)) {
        return false
      }
      
      return optimisticValue !== serverValue
    })
    
    if (hasConflict) {
      // Conflict detected - invalidate to show server data
      await queryClient.invalidateQueries({ queryKey: queryKeys.detail(matterId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      
      // TODO: Emit conflict event for UI handling
      console.warn('Optimistic update conflict detected for matter:', matterId)
    }
  }

  /**
   * Batch invalidation processing
   */
  const processBatchInvalidation = async (events: RealTimeEvent[]) => {
    if (isProcessingQueue.value) {
      return
    }
    
    isProcessingQueue.value = true
    
    try {
      // Group events by type for efficient processing
      const eventGroups = events.reduce((groups, event) => {
        if (!groups[event.type]) {
          groups[event.type] = []
        }
        groups[event.type].push(event)
        return groups
      }, {} as Record<string, RealTimeEvent[]>)
      
      // Process each group
      for (const [eventType, groupEvents] of Object.entries(eventGroups)) {
        // For matter updates, we can batch invalidate
        if (eventType === 'matter_updated' && groupEvents.length > 1) {
          const matterIds = groupEvents.map(e => e.data?.id).filter(Boolean)
          
          // Batch invalidate individual matters
          for (const id of matterIds) {
            queryClient.invalidateQueries({ queryKey: queryKeys.detail(id) })
          }
          
          // Single invalidation for shared queries
          await queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
        } else {
          // Process individually
          for (const event of groupEvents) {
            handleRealtimeEvent(event, { source: 'websocket' })
          }
        }
      }
    } finally {
      isProcessingQueue.value = false
    }
  }

  /**
   * Clear all invalidation state
   */
  const clearInvalidationState = () => {
    // Clear debounce timers
    for (const timerId of debounceTimers.value.values()) {
      clearTimeout(timerId)
    }
    debounceTimers.value.clear()
    
    // Clear rate limit counters
    rateLimitCounters.value.clear()
    
    // Clear queue
    invalidationQueue.value = []
    
    // Reset metrics
    metrics.value = {
      totalInvalidations: 0,
      invalidationsByType: {},
      averageInvalidationTime: 0,
      cascadeInvalidations: 0,
      debouncedInvalidations: 0,
      rateLimitedInvalidations: 0,
      lastInvalidationTime: null
    }
  }

  // Computed values
  const invalidationHealth = computed(() => {
    const total = metrics.value.totalInvalidations
    if (total === 0) return 'healthy'
    
    const rateLimitedPercent = (metrics.value.rateLimitedInvalidations / total) * 100
    const avgTime = metrics.value.averageInvalidationTime
    
    if (rateLimitedPercent > 20 || avgTime > 100) {
      return 'degraded'
    }
    
    if (rateLimitedPercent > 10 || avgTime > 50) {
      return 'warning'
    }
    
    return 'healthy'
  })

  // Lifecycle
  onMounted(() => {
    setupDefaultRules()
  })

  onUnmounted(() => {
    clearInvalidationState()
  })

  return {
    // State
    invalidationRules: readonly(invalidationRules),
    metrics: readonly(metrics),
    invalidationHealth,
    isProcessingQueue: readonly(isProcessingQueue),
    
    // Methods
    addRule,
    removeRule,
    handleRealtimeEvent,
    handlePollingUpdate,
    invalidateQueries,
    reconcileOptimisticUpdate,
    processBatchInvalidation,
    clearInvalidationState,
    
    // Advanced methods
    setupDefaultRules
  }
}

/**
 * WebSocket integration composable
 */
export function useWebSocketInvalidation() {
  const invalidation = useQueryInvalidation()
  const { handleRealtimeEvent } = invalidation
  
  /**
   * Create WebSocket message handler for invalidation
   */
  const createWebSocketHandler = (getCurrentUserId: () => string) => {
    return (message: any) => {
      try {
        const event: RealTimeEvent = {
          id: message.id || `ws-${Date.now()}`,
          type: message.type,
          data: message.data,
          userId: message.userId,
          timestamp: new Date(message.timestamp || Date.now()),
          acknowledged: false
        }
        
        const context: InvalidationContext = {
          source: 'websocket',
          userId: message.userId,
          isSelfInitiated: message.userId === getCurrentUserId(),
          event
        }
        
        handleRealtimeEvent(event, context)
        
      } catch (error) {
        console.error('Failed to handle WebSocket invalidation:', error)
      }
    }
  }
  
  return {
    ...invalidation,
    createWebSocketHandler
  }
}

/**
 * Polling integration composable
 */
export function usePollingInvalidation() {
  const invalidation = useQueryInvalidation()
  const { handlePollingUpdate } = invalidation
  
  /**
   * Create polling callback for invalidation
   */
  const createPollingCallback = () => {
    return (data: any) => {
      const context: InvalidationContext = {
        source: 'polling',
        metadata: { 
          pollingTime: new Date(),
          dataSize: Array.isArray(data) ? data.length : 1
        }
      }
      
      if (Array.isArray(data)) {
        handlePollingUpdate(data, context)
      } else {
        // Single item update
        handlePollingUpdate([data], context)
      }
    }
  }
  
  return {
    ...invalidation,
    createPollingCallback
  }
}