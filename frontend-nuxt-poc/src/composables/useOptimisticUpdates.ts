import { ref, computed, readonly } from 'vue'
import type { Ref } from 'vue'

export interface OptimisticUpdate<T> {
  id: string
  operation: 'create' | 'update' | 'delete' | 'move'
  optimisticData: T
  serverData?: T
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

/**
 * Composable for managing optimistic updates
 * Provides immediate UI updates while syncing with server
 * 
 * @returns Object containing pending updates and management methods
 */
export function useOptimisticUpdates<T>() {
  const pendingUpdates = ref<Map<string, OptimisticUpdate<T>>>(new Map())
  
  /**
   * Adds an optimistic update to the queue
   * Update will be displayed immediately in the UI
   * 
   * @param update - The optimistic update to add
   */
  const addOptimisticUpdate = (update: OptimisticUpdate<T>) => {
    pendingUpdates.value.set(update.id, update)
  }
  
  /**
   * Confirms an optimistic update with server data
   * Removes the update from pending queue
   * 
   * @param id - The update ID to confirm
   * @param serverData - The confirmed data from server
   */
  const confirmUpdate = (id: string, serverData: T) => {
    const update = pendingUpdates.value.get(id)
    if (update) {
      update.serverData = serverData
      update.status = 'confirmed'
      pendingUpdates.value.delete(id)
    }
  }
  
  /**
   * Reverts a failed optimistic update
   * Returns the original data for restoration
   * 
   * @param id - The update ID to revert
   * @returns The original optimistic data if found
   */
  const revertUpdate = (id: string) => {
    const update = pendingUpdates.value.get(id)
    if (update) {
      update.status = 'failed'
      // Revert logic based on operation type
      return update.optimisticData
    }
  }
  
  /**
   * Checks if there are any pending updates
   */
  const hasPendingUpdates = computed(() => pendingUpdates.value.size > 0)
  
  /**
   * Gets all pending updates as an array
   */
  const pendingUpdatesList = computed(() => 
    Array.from(pendingUpdates.value.values())
  )
  
  /**
   * Clears all pending updates
   * Use with caution - typically after a full sync
   */
  const clearPendingUpdates = () => {
    pendingUpdates.value.clear()
  }
  
  /**
   * Gets a specific pending update by ID
   */
  const getPendingUpdate = (id: string) => {
    return pendingUpdates.value.get(id)
  }
  
  return {
    pendingUpdates: readonly(pendingUpdates),
    pendingUpdatesList,
    addOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    hasPendingUpdates,
    clearPendingUpdates,
    getPendingUpdate
  }
}