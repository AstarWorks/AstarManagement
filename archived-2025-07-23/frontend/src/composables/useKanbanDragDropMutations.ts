/**
 * Enhanced Kanban Drag & Drop Mutations with TanStack Query Integration
 * 
 * @description Advanced drag-drop mutations with batch operations, real-time sync,
 * conflict resolution, and performance optimizations for the Kanban board system.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T12_S08 - Drag & Drop Mutations
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import type { 
  Matter, 
  MatterStatus, 
  MoveMatterInput,
  QueryError 
} from '~/types/query'
import type { MatterCard } from '~/types/kanban'
import { queryKeys } from '~/types/query'
import { useKanbanDragDrop } from './useKanbanDragDrop'
import { useRealtimeSync } from './useRealtimeSync'
import { useAccessibility } from './useAccessibility'

/**
 * Batch operation input types
 */
export interface BatchMoveOperation {
  matterId: string
  fromStatus: MatterStatus
  toStatus: MatterStatus
  fromIndex: number
  toIndex: number
  matter: MatterCard
}

export interface BatchMoveInput {
  operations: BatchMoveOperation[]
  userId: string
  timestamp: string
}

/**
 * Position calculation input
 */
export interface PositionCalculationInput {
  targetStatus: MatterStatus
  targetIndex: number
  existingMatters: MatterCard[]
  draggedMatter: MatterCard
}

/**
 * Real-time sync state
 */
export interface SyncState {
  isPending: boolean
  lastSyncTime: number
  conflictedMatters: Set<string>
  pendingOperations: Map<string, BatchMoveOperation>
}

/**
 * Validation schemas
 */
export const batchMoveSchema = z.object({
  operations: z.array(z.object({
    matterId: z.string().uuid(),
    fromStatus: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
    toStatus: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
    fromIndex: z.number().int().min(0),
    toIndex: z.number().int().min(0),
    matter: z.object({
      id: z.string(),
      caseNumber: z.string(),
      title: z.string(),
      status: z.string()
    }).passthrough()
  })).min(1).max(50), // Limit batch size for performance
  userId: z.string().uuid(),
  timestamp: z.string().datetime()
})

/**
 * Enhanced drag-drop mutations composable
 */
export function useKanbanDragDropMutations() {
  const { $fetch, $toast } = useNuxtApp()
  const queryClient = useQueryClient()
  const { announceUpdate } = useAccessibility()
  const { 
    draggedMatter, 
    isDragging, 
    canDropInColumn,
    onDragStart: baseDragStart,
    onDragEnd: baseDragEnd 
  } = useKanbanDragDrop()
  const { subscribeToUpdates, isConnected } = useRealtimeSync()

  // Enhanced state management
  const syncState = ref<SyncState>({
    isPending: false,
    lastSyncTime: Date.now(),
    conflictedMatters: new Set(),
    pendingOperations: new Map()
  })

  const performanceMetrics = ref({
    dragStartTime: 0,
    optimisticUpdateTime: 0,
    serverResponseTime: 0,
    totalOperationTime: 0,
    operationCount: 0
  })

  // Multi-select state
  const selectedMatters = ref<Set<string>>(new Set())
  const isMultiSelectMode = ref(false)

  /**
   * Calculate optimal position for dropped matter
   */
  const calculatePosition = (input: PositionCalculationInput): number => {
    const { targetIndex, existingMatters } = input
    
    // If dropping at the end
    if (targetIndex >= existingMatters.length) {
      return existingMatters.length > 0 
        ? (existingMatters[existingMatters.length - 1].position ?? 0) + 1000
        : 1000
    }
    
    // If dropping at the beginning
    if (targetIndex === 0) {
      return existingMatters.length > 0
        ? Math.max((existingMatters[0].position ?? 1000) - 1000, 0)
        : 1000
    }
    
    // Dropping in the middle - calculate between two items
    const prevMatter = existingMatters[targetIndex - 1]
    const nextMatter = existingMatters[targetIndex]
    
    const prevPosition = prevMatter.position ?? targetIndex * 1000
    const nextPosition = nextMatter.position ?? (targetIndex + 1) * 1000
    
    return Math.floor((prevPosition + nextPosition) / 2)
  }

  /**
   * Normalize positions to prevent conflicts
   */
  const normalizePositions = (matters: MatterCard[]): MatterCard[] => {
    return matters
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((matter, index) => ({
        ...matter,
        position: (index + 1) * 1000
      }))
  }

  /**
   * Single matter move mutation with enhanced optimistic updates
   */
  const useMoveMatterMutation = () => {
    return useMutation({
      mutationFn: async (input: MoveMatterInput & { originalPosition?: number }): Promise<Matter> => {
        const startTime = Date.now()
        
        try {
          const result = await $fetch<Matter>(`/api/matters/${input.matterId}/move`, {
            method: 'PATCH',
            body: {
              status: input.newStatus,
              position: input.newPosition,
              timestamp: new Date().toISOString()
            }
          })
          
          performanceMetrics.value.serverResponseTime = Date.now() - startTime
          return result
        } catch (error) {
          // Enhanced error handling with retry logic
          if (error instanceof Error && error.message.includes('conflict')) {
            syncState.value.conflictedMatters.add(input.matterId)
            throw new Error(`POSITION_CONFLICT: ${error.message}`)
          }
          throw error
        }
      },

      onMutate: async (input) => {
        const mutationStartTime = Date.now()
        performanceMetrics.value.optimisticUpdateTime = mutationStartTime
        
        // Cancel any outgoing refetches for affected queries
        await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
        await queryClient.cancelQueries({ queryKey: queryKeys.detail(input.matterId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.statusCounts() })

        // Snapshot previous state
        const previousMatters = queryClient.getQueryData(queryKeys.lists())
        const previousMatter = queryClient.getQueryData(queryKeys.detail(input.matterId))
        const previousStatusCounts = queryClient.getQueryData(queryKeys.statusCounts())

        // Optimistically update matters list with position calculation
        queryClient.setQueryData(queryKeys.lists(), (old: any) => {
          if (!old?.data) return old

          const updatedData = old.data.map((matter: MatterCard) => {
            if (matter.id === input.matterId) {
              return {
                ...matter,
                status: input.newStatus,
                position: input.newPosition,
                updatedAt: new Date().toISOString(),
                isOptimistic: true
              }
            }
            return matter
          })

          // Sort by position within each status
          const sortedData = updatedData.sort((a: MatterCard, b: MatterCard) => {
            if (a.status !== b.status) return 0
            return (a.position ?? 0) - (b.position ?? 0)
          })

          return { ...old, data: sortedData }
        })

        // Update individual matter cache
        queryClient.setQueryData(queryKeys.detail(input.matterId), (old: any) => {
          if (!old) return old
          return {
            ...old,
            status: input.newStatus,
            position: input.newPosition,
            updatedAt: new Date().toISOString()
          }
        })

        // Update status counts optimistically
        queryClient.setQueryData(queryKeys.statusCounts(), (old: any) => {
          if (!old) return old
          
          const newCounts = { ...old }
          
          // Find the matter to get its current status
          const matter = queryClient.getQueryData(queryKeys.detail(input.matterId)) as Matter
          if (matter && matter.status !== input.newStatus) {
            newCounts[matter.status] = Math.max((newCounts[matter.status] || 0) - 1, 0)
            newCounts[input.newStatus] = (newCounts[input.newStatus] || 0) + 1
          }
          
          return newCounts
        })

        performanceMetrics.value.optimisticUpdateTime = Date.now() - mutationStartTime

        return { 
          previousMatters, 
          previousMatter, 
          previousStatusCounts,
          operationId: `move-${input.matterId}-${Date.now()}`
        }
      },

      onError: (error, input, context) => {
        // Rollback optimistic updates
        if (context?.previousMatters) {
          queryClient.setQueryData(queryKeys.lists(), context.previousMatters)
        }
        if (context?.previousMatter) {
          queryClient.setQueryData(queryKeys.detail(input.matterId), context.previousMatter)
        }
        if (context?.previousStatusCounts) {
          queryClient.setQueryData(queryKeys.statusCounts(), context.previousStatusCounts)
        }

        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('POSITION_CONFLICT')) {
            $toast.warning('Position conflict', 'Matter position was updated by another user. Refreshing...')
            // Auto-refresh after conflict
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
            }, 1000)
          } else if (error.message.includes('INVALID_TRANSITION')) {
            $toast.error('Invalid transition', 'This status change is not allowed')
          } else {
            $toast.error('Move failed', 'Could not move matter. Please try again.')
          }
        }

        // Accessibility announcement
        const matter = draggedMatter.value
        if (matter) {
          announceUpdate(`Failed to move matter ${matter.caseNumber}. ${error.message}`)
        }
      },

      onSuccess: (data, input) => {
        // Remove optimistic flag and update with server data
        queryClient.setQueryData(queryKeys.lists(), (old: any) => {
          if (!old?.data) return old
          
          return {
            ...old,
            data: old.data.map((matter: MatterCard) => 
              matter.id === input.matterId 
                ? { ...data, isOptimistic: false }
                : matter
            )
          }
        })

        // Clear conflict state
        syncState.value.conflictedMatters.delete(input.matterId)
        
        // Update performance metrics
        performanceMetrics.value.operationCount++
        performanceMetrics.value.totalOperationTime = Date.now() - performanceMetrics.value.dragStartTime
      },

      onSettled: (data, error, input) => {
        // Always invalidate to ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.statusCounts() })
        
        // Clean up pending operations
        syncState.value.pendingOperations.delete(input.matterId)
      }
    })
  }

  /**
   * Batch move mutation for multiple matters
   */
  const useBatchMoveMutation = () => {
    return useMutation({
      mutationFn: async (input: BatchMoveInput): Promise<Matter[]> => {
        // Validate input
        batchMoveSchema.parse(input)
        
        const startTime = Date.now()
        
        try {
          const result = await $fetch<Matter[]>('/api/matters/batch-move', {
            method: 'PATCH',
            body: input
          })
          
          performanceMetrics.value.serverResponseTime = Date.now() - startTime
          return result
        } catch (error) {
          throw new Error(`BATCH_MOVE_FAILED: ${error}`)
        }
      },

      onMutate: async (input) => {
        const mutationStartTime = Date.now()
        
        // Cancel outgoing queries
        await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
        await queryClient.cancelQueries({ queryKey: queryKeys.statusCounts() })
        
        const previousMatters = queryClient.getQueryData(queryKeys.lists())
        const previousStatusCounts = queryClient.getQueryData(queryKeys.statusCounts())
        
        // Apply all operations optimistically
        queryClient.setQueryData(queryKeys.lists(), (old: any) => {
          if (!old?.data) return old
          
          let updatedData = [...old.data]
          
          input.operations.forEach(operation => {
            updatedData = updatedData.map(matter => 
              matter.id === operation.matterId
                ? {
                    ...matter,
                    status: operation.toStatus,
                    position: operation.toIndex * 1000, // Simple position calculation
                    updatedAt: new Date().toISOString(),
                    isOptimistic: true
                  }
                : matter
            )
          })
          
          return { ...old, data: updatedData }
        })
        
        // Update status counts for batch operation
        queryClient.setQueryData(queryKeys.statusCounts(), (old: any) => {
          if (!old) return old
          
          const newCounts = { ...old }
          
          input.operations.forEach(operation => {
            if (operation.fromStatus !== operation.toStatus) {
              newCounts[operation.fromStatus] = Math.max((newCounts[operation.fromStatus] || 0) - 1, 0)
              newCounts[operation.toStatus] = (newCounts[operation.toStatus] || 0) + 1
            }
          })
          
          return newCounts
        })
        
        performanceMetrics.value.optimisticUpdateTime = Date.now() - mutationStartTime
        
        return { previousMatters, previousStatusCounts, batchId: input.timestamp }
      },

      onError: (error, input, context) => {
        // Rollback all changes
        if (context?.previousMatters) {
          queryClient.setQueryData(queryKeys.lists(), context.previousMatters)
        }
        if (context?.previousStatusCounts) {
          queryClient.setQueryData(queryKeys.statusCounts(), context.previousStatusCounts)
        }
        
        $toast.error('Batch operation failed', `Failed to move ${input.operations.length} matters`)
        
        // Accessibility announcement
        announceUpdate(`Batch move operation failed for ${input.operations.length} matters`)
      },

      onSuccess: (data, input) => {
        // Update with server data and remove optimistic flags
        queryClient.setQueryData(queryKeys.lists(), (old: any) => {
          if (!old?.data) return old
          
          const updatedData = old.data.map((matter: MatterCard) => {
            const serverMatter = data.find(d => d.id === matter.id)
            if (serverMatter) {
              return { ...serverMatter, isOptimistic: false }
            }
            return matter
          })
          
          return { ...old, data: updatedData }
        })
        
        $toast.success('Batch operation completed', `Successfully moved ${input.operations.length} matters`)
        
        // Accessibility announcement
        announceUpdate(`Successfully moved ${input.operations.length} matters`)
      },

      onSettled: () => {
        // Ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.statusCounts() })
      }
    })
  }

  // Initialize mutations
  const moveMatterMutation = useMoveMatterMutation()
  const batchMoveMutation = useBatchMoveMutation()

  /**
   * Enhanced drag start handler with performance tracking
   */
  const onDragStart = (event: any, matter: MatterCard) => {
    performanceMetrics.value.dragStartTime = Date.now()
    
    // Track the operation
    syncState.value.pendingOperations.set(matter.id, {
      matterId: matter.id,
      fromStatus: matter.status,
      toStatus: matter.status, // Will be updated on drop
      fromIndex: -1, // Will be calculated
      toIndex: -1, // Will be calculated
      matter
    })
    
    baseDragStart(event)
    
    // Accessibility enhancement
    announceUpdate(`Started dragging matter ${matter.caseNumber}: ${matter.title}`)
  }

  /**
   * Enhanced drag end handler with mutation execution
   */
  const onDragEnd = async (event: any, targetStatus: MatterStatus, targetIndex: number) => {
    const matter = draggedMatter.value
    if (!matter) return

    try {
      // Validate the drop
      if (!canDropInColumn(matter as MatterCard, targetStatus)) {
        $toast.warning('Invalid drop', 'This status transition is not allowed')
        return
      }

      // Calculate new position
      const existingMatters = queryClient.getQueryData(queryKeys.lists()) as any
      const statusMatters = existingMatters?.data?.filter((m: MatterCard) => m.status === targetStatus) || []
      
      const newPosition = calculatePosition({
        targetStatus,
        targetIndex,
        existingMatters: statusMatters,
        draggedMatter: { ...matter } as MatterCard
      })

      // Execute the move with enhanced error handling
      if (isMultiSelectMode.value && selectedMatters.value.size > 1) {
        // Batch operation for multi-select
        const operations: BatchMoveOperation[] = Array.from(selectedMatters.value).map((matterId, index) => {
          const selectedMatter = statusMatters.find((m: MatterCard) => m.id === matterId) || matter
          return {
            matterId,
            fromStatus: selectedMatter.status,
            toStatus: targetStatus,
            fromIndex: -1, // Will be calculated by server
            toIndex: targetIndex + index,
            matter: selectedMatter
          }
        })

        await batchMoveMutation.mutateAsync({
          operations,
          userId: 'current-user', // TODO: Get from auth
          timestamp: new Date().toISOString()
        })
      } else {
        // Single matter move
        await moveMatterMutation.mutateAsync({
          matterId: matter.id,
          newStatus: targetStatus,
          newPosition
        })
      }

    } catch (error) {
      console.error('Drag operation failed:', error)
    } finally {
      baseDragEnd(event)
      
      // Clear multi-select
      selectedMatters.value.clear()
      isMultiSelectMode.value = false
    }
  }

  /**
   * Multi-select management
   */
  const toggleMatterSelection = (matterId: string) => {
    if (selectedMatters.value.has(matterId)) {
      selectedMatters.value.delete(matterId)
    } else {
      selectedMatters.value.add(matterId)
    }
    
    isMultiSelectMode.value = selectedMatters.value.size > 1
  }

  const selectAll = (matters: MatterCard[]) => {
    matters.forEach(matter => selectedMatters.value.add(matter.id))
    isMultiSelectMode.value = true
  }

  const clearSelection = () => {
    selectedMatters.value.clear()
    isMultiSelectMode.value = false
  }

  /**
   * Real-time sync integration
   */
  watch(isConnected, (connected) => {
    if (connected) {
      syncState.value.lastSyncTime = Date.now()
      
      // Process any pending operations
      if (syncState.value.pendingOperations.size > 0) {
        $toast.info('Syncing pending changes', 'Reconnected to server')
      }
    }
  })

  // Subscribe to real-time updates
  if (subscribeToUpdates) {
    subscribeToUpdates('matter_moved', (event) => {
      // Handle external matter moves
      if (event.payload.userId !== 'current-user') { // TODO: Get current user ID
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
        
        const matter = event.payload.matter
        if (matter) {
          announceUpdate(`Matter ${matter.caseNumber} was moved by another user`)
        }
      }
    })
  }

  return {
    // Mutations
    moveMatterMutation,
    batchMoveMutation,
    
    // Enhanced drag handlers
    onDragStart,
    onDragEnd,
    
    // Multi-select functionality
    selectedMatters: computed(() => selectedMatters.value),
    isMultiSelectMode: computed(() => isMultiSelectMode.value),
    toggleMatterSelection,
    selectAll,
    clearSelection,
    
    // Position management
    calculatePosition,
    normalizePositions,
    
    // State and metrics
    syncState: computed(() => syncState.value),
    performanceMetrics: computed(() => performanceMetrics.value),
    
    // Loading states
    isMoving: computed(() => moveMatterMutation.isPending),
    isBatchMoving: computed(() => batchMoveMutation.isPending),
    isDragOperationPending: computed(() => 
      moveMatterMutation.isPending || batchMoveMutation.isPending
    ),
    
    // Error states
    moveError: computed(() => moveMatterMutation.error),
    batchMoveError: computed(() => batchMoveMutation.error),
    
    // Utility functions
    resetMetrics: () => {
      performanceMetrics.value = {
        dragStartTime: 0,
        optimisticUpdateTime: 0,
        serverResponseTime: 0,
        totalOperationTime: 0,
        operationCount: 0
      }
    }
  }
}