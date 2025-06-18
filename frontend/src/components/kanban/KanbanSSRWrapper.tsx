/**
 * SSR-compatible wrapper for Kanban components
 * Demonstrates proper usage of getServerSnapshot with useSyncExternalStore
 */

'use client'

import { useSyncExternalStore } from 'react'
import { useKanbanStore, getServerSnapshot } from '@/stores/kanban-store'
import type { KanbanStoreState } from '@/stores/kanban-store'

/**
 * Hook to safely use Kanban store with SSR support
 * Uses useSyncExternalStore to prevent hydration mismatches
 */
export function useKanbanSSR<T>(
  selector: (state: KanbanStoreState) => T
): T {
  return useSyncExternalStore(
    useKanbanStore.subscribe,
    () => selector(useKanbanStore.getState()),
    () => selector(getServerSnapshot())
  )
}

/**
 * Example component using SSR-safe store access
 */
export function KanbanSSRExample() {
  // Use SSR-safe hooks
  const matters = useKanbanSSR((state) => state.matters)
  const isLoading = useKanbanSSR((state) => state.isLoading)
  const searchMode = useKanbanSSR((state) => state.searchMode)
  
  // Actions are safe to use directly (they're no-ops on server)
  const { refreshBoard, performSearch } = useKanbanStore((state) => ({
    refreshBoard: state.refreshBoard,
    performSearch: state.performSearch
  }))
  
  return (
    <div>
      <h2>Kanban Board (SSR Safe)</h2>
      {isLoading && <p>Loading...</p>}
      {searchMode && <p>Search mode active</p>}
      <p>Total matters: {matters.length}</p>
      <button onClick={() => refreshBoard()}>Refresh</button>
    </div>
  )
}

/**
 * Hook for SSR-safe filtered matters
 */
export function useFilteredMattersSSR() {
  return useKanbanSSR((state) => state.getFilteredMatters())
}

/**
 * Hook for SSR-safe board metrics
 */
export function useBoardMetricsSSR() {
  return useKanbanSSR((state) => state.getBoardMetrics())
}

/**
 * Hook for SSR-safe matters by column
 */
export function useMattersByColumnSSR() {
  return useKanbanSSR((state) => state.getMattersByColumn())
}