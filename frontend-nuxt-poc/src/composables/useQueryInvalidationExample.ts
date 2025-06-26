/**
 * Example usage of query invalidation configuration
 * This file demonstrates how to use the query invalidation system
 */

import { useMutation } from '@tanstack/vue-query'
import { useQueryInvalidation, QUERY_KEYS } from '~/config/query-invalidation'
import type { Matter, MatterStatus } from '~/types/matter'

/**
 * Example: Matter update mutation with cascading invalidation
 */
export function useMatterUpdateMutation() {
  const { invalidate } = useQueryInvalidation()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Matter> }) => {
      const { data } = await $fetch(`/api/matters/${params.id}`, {
        method: 'PATCH',
        body: params.updates,
      })
      return data
    },
    
    onSuccess: async (data, variables) => {
      // Execute configured invalidations for matter:update
      await invalidate('matter:update', { id: variables.id })
      
      // Show success message
      toast.success('Matter updated successfully')
    },
    
    onError: (error) => {
      toast.error('Failed to update matter')
      console.error('Matter update error:', error)
    },
  })
}

/**
 * Example: Bulk move mutation with optimized invalidation
 */
export function useBulkMoveMutation() {
  const { invalidate } = useQueryInvalidation()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      matterIds: string[]
      targetStatus: MatterStatus
      targetPosition?: number
    }) => {
      const { data } = await $fetch('/api/matters/batch-move', {
        method: 'PATCH',
        body: params,
      })
      return data
    },
    
    onMutate: async (variables) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.kanban.all })
      
      // Snapshot current state for rollback
      const previousKanban = queryClient.getQueryData(QUERY_KEYS.kanban.boards())
      
      // Optimistic update
      queryClient.setQueryData(QUERY_KEYS.kanban.boards(), (old: any) => {
        // Update kanban board optimistically
        return updateKanbanOptimistically(old, variables)
      })
      
      return { previousKanban }
    },
    
    onSuccess: async (data, variables) => {
      // Execute bulk move invalidations
      await invalidate('matter:bulk-move', {
        matterIds: variables.matterIds,
        targetStatus: variables.targetStatus,
      })
    },
    
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousKanban) {
        queryClient.setQueryData(QUERY_KEYS.kanban.boards(), context.previousKanban)
      }
    },
  })
}

/**
 * Example: Conditional invalidation based on status change
 */
export function useMatterStatusChangeMutation() {
  const { invalidate } = useQueryInvalidation()
  
  return useMutation({
    mutationFn: async (params: {
      matterId: string
      newStatus: MatterStatus
      reason?: string
    }) => {
      const { data } = await $fetch(`/api/matters/${params.matterId}/status`, {
        method: 'PATCH',
        body: {
          status: params.newStatus,
          reason: params.reason,
        },
      })
      return data
    },
    
    onSuccess: async (data, variables) => {
      // This will trigger conditional invalidations
      // Stats dashboard will only be invalidated if status is 'completed' or 'cancelled'
      await invalidate('matter:status-change', {
        matterId: variables.matterId,
        newStatus: variables.newStatus,
      })
    },
  })
}

/**
 * Example: Manual invalidation control
 */
export function useManualInvalidation() {
  const { invalidate, invalidateAll, invalidateMatching } = useQueryInvalidation()
  const queryClient = useQueryClient()
  
  // Invalidate specific queries
  const invalidateMatterQueries = async (matterId: string) => {
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.matters.detail(matterId),
    })
  }
  
  // Invalidate all kanban queries
  const invalidateKanbanBoard = async () => {
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.kanban.all,
    })
  }
  
  // Invalidate queries older than 5 minutes
  const invalidateStaleQueries = async () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    await invalidateMatching((query) => {
      return query.state.dataUpdatedAt < fiveMinutesAgo
    })
  }
  
  // Force immediate invalidation (skip background)
  const forceImmediateInvalidation = async (matterId: string) => {
    await invalidate('matter:update', { id: matterId }, {
      forceImmediate: true,
      skipBackground: false,
    })
  }
  
  return {
    invalidateMatterQueries,
    invalidateKanbanBoard,
    invalidateStaleQueries,
    forceImmediateInvalidation,
  }
}

/**
 * Example: Integration with background sync
 */
export function useBackgroundSyncInvalidation() {
  const { invalidate } = useQueryInvalidation()
  const queryClient = useQueryClient()
  
  // Listen for background sync events
  onMounted(() => {
    const handleSyncComplete = async (event: CustomEvent) => {
      const { type, data } = event.detail
      
      // Invalidate based on sync type
      switch (type) {
        case 'matters:sync':
          await invalidate('matter:update', data)
          break
          
        case 'full:sync':
          // Nuclear option for full sync
          await queryClient.invalidateQueries()
          break
          
        case 'partial:sync':
          // Invalidate only affected queries
          for (const mutation of data.mutations) {
            await invalidate(mutation.type, mutation.data, {
              skipBackground: true, // Avoid recursive background syncs
            })
          }
          break
      }
    }
    
    window.addEventListener('sync:complete', handleSyncComplete as EventListener)
    
    onUnmounted(() => {
      window.removeEventListener('sync:complete', handleSyncComplete as EventListener)
    })
  })
}

/**
 * Helper function for optimistic kanban updates
 */
function updateKanbanOptimistically(
  kanbanData: any,
  variables: { matterIds: string[]; targetStatus: MatterStatus }
): any {
  // Implementation of optimistic update logic
  // This is a simplified example
  return {
    ...kanbanData,
    columns: kanbanData.columns.map((column: any) => {
      if (column.status === variables.targetStatus) {
        return {
          ...column,
          matters: [
            ...column.matters,
            ...variables.matterIds.map(id => ({ id, status: variables.targetStatus })),
          ],
        }
      }
      return {
        ...column,
        matters: column.matters.filter((m: any) => !variables.matterIds.includes(m.id)),
      }
    }),
  }
}