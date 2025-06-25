/**
 * Kanban Drag-Drop Mutations with TanStack Query Integration
 * 
 * @description Enhanced mutations specifically designed for Kanban drag-and-drop
 * operations with optimistic updates, real-time feedback, and performance tracking
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { ref, computed, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import type { 
  Matter, 
  MatterStatus, 
  MoveMatterInput,
  QueryError 
} from '~/types/query'
import type { MatterCard } from '~/types/kanban'
import { useEnhancedMoveMatter, useMutationAnalytics } from './useMatterMutations'

/**
 * Enhanced move matter schema for Kanban operations
 */
export const kanbanMoveMatterSchema = z.object({
  matterId: z.string().uuid('Invalid matter ID'),
  newStatus: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
  newPosition: z.number().int().min(0, 'Position must be non-negative'),
  oldPosition: z.number().int().min(0, 'Old position must be non-negative').optional(),
  fromColumn: z.string().optional(),
  toColumn: z.string().optional(),
  timestamp: z.date().optional()
})

export type KanbanMoveMatterInput = z.infer<typeof kanbanMoveMatterSchema>

/**
 * Drag operation tracking interface
 */
interface DragOperation {
  matterId: string
  startTime: Date
  startStatus: MatterStatus
  startPosition: number
  currentStatus?: MatterStatus
  currentPosition?: number
  isComplete: boolean
}

/**
 * Enhanced Kanban mutations with optimistic updates and performance tracking
 */
export function useKanbanMutations() {
  const { $toast } = useNuxtApp()
  const queryClient = useQueryClient()
  const { trackMutation } = useMutationAnalytics()
  
  // Track ongoing drag operations
  const dragOperations = ref<Map<string, DragOperation>>(new Map())
  const pendingMutations = ref<Set<string>>(new Set())
  
  // Status change mutation with optimistic updates
  const statusChangeMutation = useMutation({
    mutationFn: async (input: KanbanMoveMatterInput): Promise<Matter> => {
      // Validate input
      kanbanMoveMatterSchema.parse(input)
      
      // API call to update matter status
      return await $fetch<Matter>(`/api/matters/${input.matterId}/status`, {
        method: 'PATCH',
        body: {
          status: input.newStatus,
          position: input.newPosition,
          timestamp: input.timestamp || new Date()
        }
      })
    },
    
    onMutate: async (input: KanbanMoveMatterInput) => {
      const startTime = Date.now()
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matters'] })
      await queryClient.cancelQueries({ queryKey: ['matter', input.matterId] })
      
      // Snapshot the previous value
      const previousMatters = queryClient.getQueryData<Matter[]>(['matters'])
      const previousMatter = queryClient.getQueryData<Matter>(['matter', input.matterId])
      
      // Optimistically update the cache
      if (previousMatters) {
        const updatedMatters = previousMatters.map(matter => 
          matter.id === input.matterId 
            ? { 
                ...matter, 
                status: input.newStatus,
                position: input.newPosition,
                updatedAt: new Date().toISOString()
              }
            : matter
        )
        queryClient.setQueryData(['matters'], updatedMatters)
      }
      
      // Update single matter cache
      if (previousMatter) {
        queryClient.setQueryData(['matter', input.matterId], {
          ...previousMatter,
          status: input.newStatus,
          position: input.newPosition,
          updatedAt: new Date().toISOString()
        })
      }
      
      // Track mutation start
      pendingMutations.value.add(input.matterId)
      
      // Track drag operation completion
      const dragOp = dragOperations.value.get(input.matterId)
      if (dragOp) {
        dragOp.currentStatus = input.newStatus
        dragOp.currentPosition = input.newPosition
        dragOp.isComplete = true
      }
      
      return { 
        previousMatters, 
        previousMatter, 
        startTime,
        matterId: input.matterId,
        fromStatus: dragOp?.startStatus,
        toStatus: input.newStatus
      }
    },
    
    onError: (error, input, context) => {
      // Rollback optimistic update
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters)
      }
      
      if (context?.previousMatter) {
        queryClient.setQueryData(['matter', input.matterId], context.previousMatter)
      }
      
      // Track failed mutation
      const duration = context?.startTime ? Date.now() - context.startTime : 0
      trackMutation('move', false, duration)
      
      // Show error feedback
      const fromStatus = context?.fromStatus || 'unknown'
      const toStatus = context?.toStatus || input.newStatus
      
      $toast.error(
        'Status update failed', 
        `Could not move matter from ${fromStatus.toLowerCase()} to ${toStatus.toLowerCase()}`
      )
      
      console.error('Kanban status change error:', error)
    },
    
    onSuccess: (updatedMatter, input, context) => {
      // Track successful mutation
      const duration = context?.startTime ? Date.now() - context.startTime : 0
      trackMutation('move', true, duration)
      
      // Update cache with server response
      queryClient.setQueryData(['matter', input.matterId], updatedMatter)
      
      // Update matters list with fresh data
      queryClient.setQueryData(['matters'], (old: Matter[] = []) => 
        old.map(matter => 
          matter.id === input.matterId ? updatedMatter : matter
        )
      )
      
      // Show success feedback for significant status changes
      const dragOp = dragOperations.value.get(input.matterId)
      if (dragOp && dragOp.startStatus !== input.newStatus) {
        $toast.success(
          'Status updated', 
          `Matter moved to ${input.newStatus.toLowerCase()}`
        )
      }
    },
    
    onSettled: (data, error, input) => {
      // Clean up pending mutation tracking
      pendingMutations.value.delete(input.matterId)
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['matters'] })
      queryClient.invalidateQueries({ queryKey: ['matter', input.matterId] })
      
      // Clean up drag operation
      dragOperations.value.delete(input.matterId)
    }
  })
  
  // Reorder mutation for within-column position changes
  const reorderMutation = useMutation({
    mutationFn: async (input: {
      matterId: string
      newPosition: number
      oldPosition: number
      status: MatterStatus
    }): Promise<Matter> => {
      return await $fetch<Matter>(`/api/matters/${input.matterId}/reorder`, {
        method: 'PATCH',
        body: {
          position: input.newPosition,
          status: input.status
        }
      })
    },
    
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['matters'] })
      
      const previousMatters = queryClient.getQueryData<Matter[]>(['matters'])
      
      // Optimistically reorder matters
      if (previousMatters) {
        const matters = [...previousMatters]
        const matterIndex = matters.findIndex(m => m.id === input.matterId)
        
        if (matterIndex !== -1) {
          const [matter] = matters.splice(matterIndex, 1)
          matter.position = input.newPosition
          matters.splice(input.newPosition, 0, matter)
          
          queryClient.setQueryData(['matters'], matters)
        }
      }
      
      return { previousMatters }
    },
    
    onError: (error, input, context) => {
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters)
      }
      
      $toast.error('Reorder failed', 'Could not update matter position')
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  // Batch mutation for multiple matter operations
  const batchMutation = useMutation({
    mutationFn: async (operations: KanbanMoveMatterInput[]): Promise<Matter[]> => {
      return await $fetch<Matter[]>('/api/matters/batch-update', {
        method: 'PATCH',
        body: { operations }
      })
    },
    
    onMutate: async (operations) => {
      await queryClient.cancelQueries({ queryKey: ['matters'] })
      const previousMatters = queryClient.getQueryData<Matter[]>(['matters'])
      
      // Optimistically apply all operations
      if (previousMatters) {
        let updatedMatters = [...previousMatters]
        
        operations.forEach(op => {
          const index = updatedMatters.findIndex(m => m.id === op.matterId)
          if (index !== -1) {
            updatedMatters[index] = {
              ...updatedMatters[index],
              status: op.newStatus,
              position: op.newPosition,
              updatedAt: new Date().toISOString()
            }
          }
        })
        
        queryClient.setQueryData(['matters'], updatedMatters)
      }
      
      return { previousMatters }
    },
    
    onError: (error, operations, context) => {
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters)
      }
      
      $toast.error('Batch update failed', `Could not update ${operations.length} matters`)
    },
    
    onSuccess: (updatedMatters) => {
      // Update cache with all server responses
      updatedMatters.forEach(matter => {
        queryClient.setQueryData(['matter', matter.id], matter)
      })
      
      $toast.success('Batch update complete', `Updated ${updatedMatters.length} matters`)
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  // Helper functions for drag operations
  const startDragOperation = (matter: MatterCard): void => {
    const operation: DragOperation = {
      matterId: matter.id,
      startTime: new Date(),
      startStatus: matter.status as MatterStatus,
      startPosition: matter.position || 0,
      isComplete: false
    }
    
    dragOperations.value.set(matter.id, operation)
  }
  
  const cancelDragOperation = (matterId: string): void => {
    dragOperations.value.delete(matterId)
    pendingMutations.value.delete(matterId)
  }
  
  const updateMatterStatus = async (input: KanbanMoveMatterInput): Promise<void> => {
    try {
      await statusChangeMutation.mutateAsync(input)
    } catch (error) {
      // Error already handled in onError callback
      throw error
    }
  }
  
  const reorderMatter = async (input: {
    matterId: string
    newPosition: number
    oldPosition: number
    status: MatterStatus
  }): Promise<void> => {
    try {
      await reorderMutation.mutateAsync(input)
    } catch (error) {
      throw error
    }
  }
  
  const batchUpdateMatters = async (operations: KanbanMoveMatterInput[]): Promise<void> => {
    try {
      await batchMutation.mutateAsync(operations)
    } catch (error) {
      throw error
    }
  }
  
  // Computed properties for UI state
  const isDragOperationActive = computed(() => dragOperations.value.size > 0)
  const pendingMutationCount = computed(() => pendingMutations.value.size)
  
  const isMatterPending = (matterId: string): boolean => {
    return pendingMutations.value.has(matterId)
  }
  
  const getDragOperation = (matterId: string): DragOperation | undefined => {
    return dragOperations.value.get(matterId)
  }
  
  const isAnyMutationPending = computed(() => 
    statusChangeMutation.isPending.value || 
    reorderMutation.isPending.value || 
    batchMutation.isPending.value
  )
  
  return {
    // Mutation functions
    updateMatterStatus,
    reorderMatter,
    batchUpdateMatters,
    
    // Drag operation management
    startDragOperation,
    cancelDragOperation,
    getDragOperation,
    
    // State queries
    isMatterPending,
    isDragOperationActive,
    pendingMutationCount,
    isAnyMutationPending,
    
    // Individual mutation states
    isStatusChangePending: computed(() => statusChangeMutation.isPending.value),
    isReorderPending: computed(() => reorderMutation.isPending.value),
    isBatchPending: computed(() => batchMutation.isPending.value),
    
    // Error states
    statusChangeError: computed(() => statusChangeMutation.error.value),
    reorderError: computed(() => reorderMutation.error.value),
    batchError: computed(() => batchMutation.error.value)
  }
}

/**
 * Enhanced drag-drop integration composable
 * Combines useKanbanDragDrop with TanStack Query mutations
 */
export function useKanbanDragDropMutations() {
  const kanbanMutations = useKanbanMutations()
  const { $toast } = useNuxtApp()
  
  // Enhanced drag change handler with TanStack mutations
  const onDragChangeWithMutation = async (
    event: any, 
    targetStatus: MatterStatus
  ): Promise<{ success: boolean; matter?: MatterCard; error?: string } | null> => {
    if (event.added) {
      const matter = event.added.element as MatterCard
      const newPosition = event.added.newIndex
      
      // Validate the move using existing validation
      // This would integrate with useKanbanDragDrop validation
      
      try {
        const startTime = Date.now()
        
        // Start tracking the drag operation
        kanbanMutations.startDragOperation(matter)
        
        // Execute the mutation with optimistic update
        await kanbanMutations.updateMatterStatus({
          matterId: matter.id,
          newStatus: targetStatus,
          newPosition,
          oldPosition: matter.position || 0,
          fromColumn: matter.status,
          toColumn: targetStatus,
          timestamp: new Date()
        })
        
        const duration = Date.now() - startTime
        console.debug(`Drag operation completed in ${duration}ms`)
        
        return {
          success: true,
          matter
        }
      } catch (error) {
        kanbanMutations.cancelDragOperation(matter.id)
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          matter,
          error: errorMessage
        }
      }
    }
    
    if (event.moved) {
      const matter = event.moved.element as MatterCard
      
      try {
        await kanbanMutations.reorderMatter({
          matterId: matter.id,
          newPosition: event.moved.newIndex,
          oldPosition: event.moved.oldIndex,
          status: matter.status as MatterStatus
        })
        
        return {
          success: true,
          matter
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          matter,
          error: errorMessage
        }
      }
    }
    
    return null
  }
  
  return {
    ...kanbanMutations,
    onDragChangeWithMutation
  }
}