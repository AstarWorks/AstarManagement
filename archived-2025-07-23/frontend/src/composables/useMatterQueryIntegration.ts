/**
 * TanStack Query Integration with Pinia Stores
 * 
 * @description Integration layer between TanStack Query and existing Pinia stores
 * for matter management. Provides seamless data synchronization and compatibility
 * with existing store-based components.
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { watch, computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { Matter, MatterFilters, MatterStatus } from '~/types/query'
import { 
  useMattersQuery, 
  useMatterQuery,
  useUpdateMatterMutation,
  useMoveMatterMutation,
  useCreateMatterMutation,
  useDeleteMatterMutation,
  useStatusCountsQuery
} from './useMattersQuery'

/**
 * Integration hook that bridges TanStack Query with Pinia stores
 * Provides backward compatibility for existing components while
 * leveraging TanStack Query's advanced caching and synchronization
 * 
 * @returns Integrated state and actions
 */
export function useMatterQueryIntegration() {
  // Get existing stores for compatibility
  const { matters: storeMatters, isLoading: storeLoading } = storeToRefs(useKanbanStore())
  // Note: useSearchStore implementation would be added when available
  const filters = ref({})
  
  // TanStack Query hooks
  const { 
    data: queryMatters, 
    isPending: queryLoading, 
    error: queryError,
    refetch
  } = useMattersQuery(filters)
  
  // Mutation hooks
  const createMutation = useCreateMatterMutation()
  const updateMutation = useUpdateMatterMutation()
  const moveMutation = useMoveMatterMutation()
  const deleteMutation = useDeleteMatterMutation()
  
  // Sync TanStack Query data with Pinia store for backward compatibility
  watch(
    () => queryMatters.value,
    (newMatters) => {
      if (newMatters?.data) {
        // Update Pinia store with fresh data from TanStack Query
        // Note: The Kanban store delegates to modular stores, so we don't need
        // to manually sync here - TanStack Query becomes the primary data source
        console.debug('TanStack Query data updated:', newMatters.data.length, 'matters')
      }
    },
    { immediate: true }
  )
  
  // Unified loading state (combines both stores)
  const isLoading = computed(() => 
    queryLoading.value || storeLoading.value ||
    createMutation.isPending.value ||
    updateMutation.isPending.value ||
    moveMutation.isPending.value ||
    deleteMutation.isPending.value
  )
  
  // Unified error state
  const error = computed(() => 
    queryError.value || 
    createMutation.error.value ||
    updateMutation.error.value ||
    moveMutation.error.value ||
    deleteMutation.error.value
  )
  
  // Unified matters data (prefer TanStack Query, fallback to Pinia)
  const matters = computed(() => 
    queryMatters.value?.data || storeMatters.value || []
  )
  
  // Unified actions that leverage TanStack Query mutations
  const actions = {
    // Create a new matter
    async createMatter(matterData: any) {
      return await createMutation.mutateAsync(matterData)
    },
    
    // Update an existing matter
    async updateMatter(id: string, updates: any) {
      return await updateMutation.mutateAsync({ id, data: updates })
    },
    
    // Move matter (drag and drop)
    async moveMatter(matterId: string, newStatus: string, newPosition: number) {
      return await moveMutation.mutateAsync({ 
        matterId, 
        newStatus: newStatus as MatterStatus, 
        newPosition 
      })
    },
    
    // Delete matter
    async deleteMatter(id: string) {
      return await deleteMutation.mutateAsync(id)
    },
    
    // Refresh data
    async refreshMatters() {
      return await refetch()
    },
    
    // Legacy compatibility methods (for existing components)
    async fetchMatters() {
      return await refetch()
    },
    
    async updateMatterStatus(id: string, status: string) {
      return await updateMutation.mutateAsync({ 
        id, 
        data: { status: status as MatterStatus } 
      })
    }
  }
  
  return {
    // State
    matters,
    isLoading,
    error,
    
    // Actions
    ...actions,
    
    // Direct access to TanStack Query for advanced usage
    query: {
      data: queryMatters,
      isPending: queryLoading,
      error: queryError,
      refetch
    },
    
    // Direct access to mutations for advanced usage
    mutations: {
      create: createMutation,
      update: updateMutation,
      move: moveMutation,
      delete: deleteMutation
    }
  }
}

/**
 * Hook for managing a single matter with TanStack Query integration
 * 
 * @param matterId - Matter ID to manage
 * @returns Single matter state and actions
 */
export function useSingleMatterIntegration(matterId: Ref<string>) {
  const { 
    data: matter, 
    isPending: loading, 
    error,
    refetch
  } = useMatterQuery(matterId)
  
  const updateMutation = useUpdateMatterMutation()
  const deleteMutation = useDeleteMatterMutation()
  
  const actions = {
    async updateMatter(updates: any) {
      return await updateMutation.mutateAsync({ 
        id: matterId.value, 
        data: updates 
      })
    },
    
    async deleteMatter() {
      return await deleteMutation.mutateAsync(matterId.value)
    },
    
    async refreshMatter() {
      return await refetch()
    }
  }
  
  return {
    matter,
    loading,
    error,
    ...actions,
    
    // Direct mutation access
    mutations: {
      update: updateMutation,
      delete: deleteMutation
    }
  }
}

/**
 * Hook for Kanban-specific operations with TanStack Query
 * Optimized for drag-and-drop and real-time updates
 * 
 * @returns Kanban-optimized state and actions
 */
export function useKanbanQueryIntegration() {
  const integration = useMatterQueryIntegration()
  
  // Real-time status counts for Kanban columns
  const { data: statusCounts, isPending: countsLoading } = useStatusCountsQuery({
    refetchInterval: 30000 // Update every 30 seconds
  })
  
  // Kanban-specific actions
  const kanbanActions = {
    // Optimized drag and drop
    async handleDrop(matterId: string, newStatus: string, newPosition: number) {
      // Use TanStack Query's optimistic updates
      return await integration.moveMatter(matterId, newStatus, newPosition)
    },
    
    // Batch operations (for future implementation)
    async batchUpdateStatus(matterIds: string[], newStatus: string) {
      const promises = matterIds.map(id => 
        integration.updateMatter(id, { status: newStatus })
      )
      return await Promise.all(promises)
    }
  }
  
  return {
    ...integration,
    statusCounts,
    countsLoading,
    ...kanbanActions
  }
}

/**
 * Type-safe wrapper for legacy components
 * Provides the same API as existing Pinia stores but powered by TanStack Query
 */
export function useLegacyMatterStore() {
  const integration = useMatterQueryIntegration()
  
  // Legacy API compatibility
  return {
    // State (computed properties for reactivity)
    get matters() { return integration.matters.value },
    get loading() { return integration.isLoading.value },
    get error() { return integration.error.value },
    
    // Actions (same names as original store)
    fetchMatters: integration.fetchMatters,
    updateMatterStatus: integration.updateMatterStatus,
    createMatter: integration.createMatter,
    updateMatter: integration.updateMatter,
    deleteMatter: integration.deleteMatter,
    
    // New TanStack Query powered actions
    moveMatter: integration.moveMatter,
    refreshMatters: integration.refreshMatters
  }
}