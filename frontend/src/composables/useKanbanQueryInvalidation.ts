/**
 * Kanban Query Invalidation Strategies
 * 
 * @description Specialized invalidation strategies for Kanban board operations,
 * integrating with TanStack Query mutations and real-time updates for optimal
 * performance during drag-drop operations and status changes.
 * 
 * @author Claude
 * @created 2025-06-25
 * @task T06_S08
 */

import { ref, computed, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useQueryInvalidation, type InvalidationRule } from './useQueryInvalidation'
import { useRealTimeQuerySync } from './useRealTimeQuerySync'
import { queryKeys } from '~/types/query'
import type { Matter, MatterStatus } from '~/types/kanban'
import type { RealTimeEvent } from '~/stores/kanban/real-time'

export interface KanbanInvalidationConfig {
  /** Enable optimistic update reconciliation */
  enableOptimisticReconciliation: boolean
  /** Debounce time for status changes in ms */
  statusChangeDebounceMs: number
  /** Debounce time for reordering operations in ms */
  reorderDebounceMs: number
  /** Enable smart invalidation based on visible columns */
  enableSmartInvalidation: boolean
  /** Enable performance monitoring for drag operations */
  enablePerformanceMonitoring: boolean
  /** Batch size for bulk operations */
  bulkOperationBatchSize: number
}

export interface KanbanPerformanceMetrics {
  /** Total drag operations processed */
  totalDragOperations: number
  /** Average invalidation time during drag */
  averageDragInvalidationTime: number
  /** Status change operations */
  statusChangeOperations: number
  /** Reorder operations */
  reorderOperations: number
  /** Optimistic updates reconciled */
  optimisticUpdatesReconciled: number
  /** Performance issues detected */
  performanceIssues: number
  /** Last operation timestamp */
  lastOperationTime: Date | null
}

/**
 * Kanban-specific query invalidation composable
 */
export function useKanbanQueryInvalidation(config: Partial<KanbanInvalidationConfig> = {}) {
  const queryClient = useQueryClient()
  const baseInvalidation = useQueryInvalidation()
  const realTimeSync = useRealTimeQuerySync()
  
  // Configuration with defaults
  const kanbanConfig = ref<KanbanInvalidationConfig>({
    enableOptimisticReconciliation: true,
    statusChangeDebounceMs: 300,
    reorderDebounceMs: 150,
    enableSmartInvalidation: true,
    enablePerformanceMonitoring: true,
    bulkOperationBatchSize: 20,
    ...config
  })
  
  // State
  const activeColumns = ref<Set<MatterStatus>>(new Set())
  const dragOperations = ref<Map<string, { startTime: Date; startStatus: MatterStatus }>>(new Map())
  const pendingInvalidations = ref<Map<string, NodeJS.Timeout>>(new Map())
  
  // Performance metrics
  const performanceMetrics = ref<KanbanPerformanceMetrics>({
    totalDragOperations: 0,
    averageDragInvalidationTime: 0,
    statusChangeOperations: 0,
    reorderOperations: 0,
    optimisticUpdatesReconciled: 0,
    performanceIssues: 0,
    lastOperationTime: null
  })

  /**
   * Setup Kanban-specific invalidation rules
   */
  const setupKanbanRules = () => {
    // High-frequency status changes with smart debouncing
    const statusChangeRule: InvalidationRule = {
      id: 'kanban-status-change',
      eventTypes: ['matter_status_changed', 'kanban_move'],
      queryKeys: [queryKeys.statusCounts()] as const,
      debounceMs: kanbanConfig.value.statusChangeDebounceMs,
      rateLimit: 10, // Allow up to 10 status changes per second
      cascade: false,
      condition: (event: RealTimeEvent) => {
        // Only invalidate if we're tracking this column
        const newStatus = event.data?.newStatus || event.data?.status
        return !kanbanConfig.value.enableSmartInvalidation || 
               !newStatus || 
               activeColumns.value.has(newStatus)
      }
    }

    // Reordering within columns (minimal invalidation)
    const reorderRule: InvalidationRule = {
      id: 'kanban-reorder',
      eventTypes: ['matter_reordered', 'kanban_reorder'],
      queryKeys: [] as const, // No immediate invalidation for pure reordering
      debounceMs: kanbanConfig.value.reorderDebounceMs,
      rateLimit: 20, // High rate limit for smooth dragging
      cascade: false,
      condition: (event: RealTimeEvent) => {
        // Only invalidate if status actually changed
        const oldStatus = event.data?.oldStatus
        const newStatus = event.data?.newStatus
        return oldStatus !== newStatus
      }
    }

    // Bulk operations (create, delete multiple)
    const bulkOperationRule: InvalidationRule = {
      id: 'kanban-bulk-operation',
      eventTypes: ['matters_bulk_created', 'matters_bulk_deleted', 'matters_bulk_updated'],
      queryKeys: [queryKeys.lists(), queryKeys.matters.statistics(), queryKeys.statusCounts()] as const,
      debounceMs: 1000, // Longer debounce for bulk operations
      cascade: true
    }

    // Real-time updates from other users
    const externalUpdateRule: InvalidationRule = {
      id: 'kanban-external-update',
      eventTypes: ['matter_updated_external', 'matter_created_external'],
      queryKeys: [queryKeys.lists()] as const,
      debounceMs: 500,
      cascade: false,
      condition: (event: RealTimeEvent) => {
        // Only invalidate if the update affects visible columns
        const status = event.data?.status
        return !kanbanConfig.value.enableSmartInvalidation || 
               !status || 
               activeColumns.value.has(status)
      }
    }

    // Add all Kanban rules
    const kanbanRules = [statusChangeRule, reorderRule, bulkOperationRule, externalUpdateRule]
    kanbanRules.forEach(rule => {
      baseInvalidation.addRule(rule)
    })
  }

  /**
   * Track active Kanban columns for smart invalidation
   */
  const setActiveColumns = (columns: MatterStatus[]) => {
    activeColumns.value = new Set(columns)
    
    if (kanbanConfig.value.enableSmartInvalidation) {
      console.debug('Updated active Kanban columns:', columns)
    }
  }

  /**
   * Start tracking a drag operation
   */
  const startDragOperation = (matterId: string, startStatus: MatterStatus) => {
    dragOperations.value.set(matterId, {
      startTime: new Date(),
      startStatus
    })
    
    if (kanbanConfig.value.enablePerformanceMonitoring) {
      performanceMetrics.value.totalDragOperations++
      performanceMetrics.value.lastOperationTime = new Date()
    }
  }

  /**
   * Complete a drag operation with invalidation
   */
  const completeDragOperation = async (matterId: string, newStatus: MatterStatus, newPosition?: number) => {
    const operation = dragOperations.value.get(matterId)
    if (!operation) {
      return
    }
    
    const startTime = performance.now()
    
    try {
      // Determine invalidation strategy based on operation type
      if (operation.startStatus !== newStatus) {
        // Status change - more comprehensive invalidation
        await handleStatusChangeInvalidation(matterId, operation.startStatus, newStatus)
        performanceMetrics.value.statusChangeOperations++
      } else if (newPosition !== undefined) {
        // Reordering within same column - minimal invalidation
        await handleReorderInvalidation(matterId, newStatus, newPosition)
        performanceMetrics.value.reorderOperations++
      }
      
      // Update performance metrics
      if (kanbanConfig.value.enablePerformanceMonitoring) {
        const endTime = performance.now()
        const invalidationTime = endTime - startTime
        
        performanceMetrics.value.averageDragInvalidationTime = 
          (performanceMetrics.value.averageDragInvalidationTime * 
           (performanceMetrics.value.totalDragOperations - 1) + invalidationTime) /
          performanceMetrics.value.totalDragOperations
        
        // Detect performance issues (>50ms for drag invalidation)
        if (invalidationTime > 50) {
          performanceMetrics.value.performanceIssues++
          console.warn(`Slow invalidation detected: ${invalidationTime}ms for matter ${matterId}`)
        }
      }
      
    } finally {
      dragOperations.value.delete(matterId)
    }
  }

  /**
   * Handle status change invalidation
   */
  const handleStatusChangeInvalidation = async (matterId: string, oldStatus: MatterStatus, newStatus: MatterStatus) => {
    // Cancel any pending invalidation for this matter
    const pendingTimer = pendingInvalidations.value.get(matterId)
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingInvalidations.value.delete(matterId)
    }
    
    // Immediate optimistic update for smooth UX
    queryClient.setQueryData(queryKeys.detail(matterId), (old: Matter | undefined) => {
      if (!old) return old
      return {
        ...old,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    })
    
    // Debounced invalidation for server sync
    const timer = setTimeout(async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.statusCounts() })
      
      // Only invalidate lists if we're tracking these columns
      if (!kanbanConfig.value.enableSmartInvalidation || 
          activeColumns.value.has(oldStatus) || 
          activeColumns.value.has(newStatus)) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      }
      
      pendingInvalidations.value.delete(matterId)
    }, kanbanConfig.value.statusChangeDebounceMs)
    
    pendingInvalidations.value.set(matterId, timer)
  }

  /**
   * Handle reorder invalidation (minimal impact)
   */
  const handleReorderInvalidation = async (matterId: string, status: MatterStatus, position: number) => {
    // For pure reordering, we only need to update the specific query cache
    // No server invalidation needed since order is often client-side only
    
    queryClient.setQueryData(queryKeys.lists(), (old: unknown) => {
      if (!old || !(old as { data?: unknown[] }).data) return old
      
      // Find and update the matter position
      const matters = [...(old as { data: unknown[] }).data]
      const matterIndex = matters.findIndex((m: any) => m.id === matterId)
      
      if (matterIndex !== -1 && (matters[matterIndex] as any).status === status) {
        // Simple position update - more sophisticated reordering would be needed
        // for a complete implementation
        matters[matterIndex] = {
          ...(matters[matterIndex] as any),
          position,
          updatedAt: new Date().toISOString()
        }
      }
      
      return { ...(old as any), data: matters }
    })
  }

  /**
   * Handle bulk operations with batched invalidation
   */
  const handleBulkOperation = async (operations: Array<{ type: 'create' | 'update' | 'delete'; matterId: string; data?: unknown }>) => {
    const batchSize = kanbanConfig.value.bulkOperationBatchSize
    
    // Process operations in batches
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      
      // Process batch optimistically
      for (const operation of batch) {
        switch (operation.type) {
          case 'create':
            // Add to cache optimistically
            queryClient.setQueryData(queryKeys.lists(), (old: unknown) => {
              const typedOld = old as { data?: unknown[]; total?: number }
              if (!typedOld?.data) return old
              return {
                ...typedOld,
                data: [operation.data, ...typedOld.data],
                total: (typedOld.total || 0) + 1
              }
            })
            break
            
          case 'update':
            // Update in cache
            queryClient.setQueryData(queryKeys.detail(operation.matterId), (old: unknown) => {
              if (!old) return old
              return { ...(old as any), ...(operation.data as any) }
            })
            break
            
          case 'delete':
            // Remove from cache
            queryClient.setQueryData(queryKeys.lists(), (old: unknown) => {
              const typedOld = old as { data?: any[]; total?: number }
              if (!typedOld?.data) return old
              return {
                ...typedOld,
                data: typedOld.data.filter((m: any) => m.id !== operation.matterId),
                total: (typedOld.total || 0) - 1
              }
            })
            break
        }
      }
      
      // Small delay between batches to prevent UI blocking
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    
    // Final invalidation after all operations
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.matters.statistics() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.statusCounts() })
    ])
  }

  /**
   * Reconcile optimistic updates with server data
   */
  const reconcileOptimisticUpdate = async (matterId: string, serverMatter: Matter) => {
    if (!kanbanConfig.value.enableOptimisticReconciliation) {
      return
    }
    
    const cachedMatter = queryClient.getQueryData<Matter>(queryKeys.detail(matterId))
    
    if (!cachedMatter) {
      return
    }
    
    // Check for conflicts between optimistic and server data
    const conflicts = detectOptimisticConflicts(cachedMatter, serverMatter)
    
    if (conflicts.length > 0) {
      console.warn(`Optimistic update conflicts detected for matter ${matterId}:`, conflicts)
      
      // Server wins - update cache with server data
      queryClient.setQueryData(queryKeys.detail(matterId), serverMatter)
      
      // Update lists cache as well
      queryClient.setQueryData(queryKeys.lists(), (old: unknown) => {
        const typedOld = old as { data?: any[] }
        if (!typedOld?.data) return old
        return {
          ...typedOld,
          data: typedOld.data.map((m: any) => m.id === matterId ? serverMatter : m)
        }
      })
      
      performanceMetrics.value.optimisticUpdatesReconciled++
    }
  }

  /**
   * Detect conflicts between optimistic and server data
   */
  const detectOptimisticConflicts = (optimistic: Matter, server: Matter): string[] => {
    const conflicts: string[] = []
    
    // Check key fields for conflicts
    if (optimistic.status !== server.status) {
      conflicts.push('status')
    }
    
    if (optimistic.title !== server.title) {
      conflicts.push('title')
    }
    
    if (optimistic.priority !== server.priority) {
      conflicts.push('priority')
    }
    
    if (optimistic.assignedLawyer !== server.assignedLawyer) {
      conflicts.push('assignedLawyer')
    }
    
    return conflicts
  }

  /**
   * Clear all pending invalidations
   */
  const clearPendingInvalidations = () => {
    for (const timer of pendingInvalidations.value.values()) {
      clearTimeout(timer)
    }
    pendingInvalidations.value.clear()
  }

  /**
   * Get invalidation status for debugging
   */
  const getInvalidationStatus = () => {
    return {
      activeColumns: Array.from(activeColumns.value),
      dragOperations: Object.fromEntries(dragOperations.value),
      pendingInvalidations: pendingInvalidations.value.size,
      performanceMetrics: performanceMetrics.value
    }
  }

  // Computed values
  const isDragActive = computed(() => dragOperations.value.size > 0)
  const hasPendingInvalidations = computed(() => pendingInvalidations.value.size > 0)
  const invalidationHealth = computed(() => {
    const avgTime = performanceMetrics.value.averageDragInvalidationTime
    const issues = performanceMetrics.value.performanceIssues
    const total = performanceMetrics.value.totalDragOperations
    
    if (total === 0) return 'healthy'
    
    const issueRate = issues / total
    
    if (avgTime > 100 || issueRate > 0.2) {
      return 'critical'
    }
    
    if (avgTime > 50 || issueRate > 0.1) {
      return 'warning'
    }
    
    return 'healthy'
  })

  // Initialize Kanban rules
  setupKanbanRules()

  return {
    // Configuration
    kanbanConfig: readonly(kanbanConfig),
    
    // State
    activeColumns: readonly(activeColumns),
    isDragActive,
    hasPendingInvalidations,
    invalidationHealth,
    performanceMetrics: readonly(performanceMetrics),
    
    // Methods
    setActiveColumns,
    startDragOperation,
    completeDragOperation,
    handleBulkOperation,
    reconcileOptimisticUpdate,
    clearPendingInvalidations,
    getInvalidationStatus,
    
    // Access to base functionality
    baseInvalidation,
    realTimeSync
  }
}

/**
 * Simple hook for Kanban components
 */
export function useKanbanSync() {
  const kanbanInvalidation = useKanbanQueryInvalidation()
  
  return {
    setActiveColumns: kanbanInvalidation.setActiveColumns,
    startDrag: kanbanInvalidation.startDragOperation,
    completeDrag: kanbanInvalidation.completeDragOperation,
    isDragActive: kanbanInvalidation.isDragActive,
    invalidationHealth: kanbanInvalidation.invalidationHealth
  }
}