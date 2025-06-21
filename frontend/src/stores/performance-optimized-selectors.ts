/**
 * Performance-optimized selectors for Zustand stores
 * Implements memoization and selective subscriptions to minimize re-renders
 */

import React from 'react'
import { shallow } from 'zustand/shallow'
import { useKanbanStore } from './kanban-store'
import type { MatterCard, KanbanColumn } from '@/components/kanban/types'
import type { SearchType } from '@/services/api/search.service'
// Note: debounce function is implemented locally below

/**
 * Optimized selectors that prevent unnecessary re-renders
 */

// Memoized matter transformations
const createMemoizedMattersByColumn = () => {
  let lastMatters: MatterCard[] = []
  let lastColumns: KanbanColumn[] = []
  let cachedResult: Record<string, MatterCard[]> = {}

  return (matters: MatterCard[], columns: KanbanColumn[]) => {
    // Check if inputs have changed
    if (matters === lastMatters && columns === lastColumns) {
      return cachedResult
    }

    // Recompute only if necessary
    const groups: Record<string, MatterCard[]> = {}
    
    // Initialize all columns
    columns.forEach(column => {
      groups[column.id] = []
    })

    // Group matters by their column
    matters.forEach(matter => {
      const column = columns.find(col => 
        col.status.includes(matter.status)
      )
      if (column) {
        groups[column.id].push(matter)
      }
    })

    // Cache the result
    lastMatters = matters
    lastColumns = columns
    cachedResult = groups

    return groups
  }
}

const memoizedMattersByColumn = createMemoizedMattersByColumn()

/**
 * High-performance selector hooks with minimal re-renders
 */

// Only re-render when the specific matter changes
export const useMatterById = (matterId: string) => {
  return useKanbanStore((state) => state.matters.find(m => m.id === matterId))
}

// Only re-render when matter count changes, not when individual matters change
export const useMatterCount = () => {
  return useKanbanStore(
    (state) => state.matters.length
  )
}

// Only re-render when filter values change, not when matters change
export const useFiltersOnly = () => {
  return useKanbanStore((state) => state.filters)
}

// Only re-render when sorting changes
export const useSortingOnly = () => {
  return useKanbanStore((state) => state.sorting)
}

// Optimized matters by column with memoization
export const useOptimizedMattersByColumn = () => {
  return useKanbanStore(
    (state) => {
      const filteredMatters = state.getFilteredMatters()
      const columns = state.board?.columns || []
      
      return memoizedMattersByColumn(filteredMatters, columns)
    }
  )
}

// Only re-render when loading state changes
export const useLoadingOnly = () => {
  return useKanbanStore((state) => state.isLoading)
}

// Only re-render when error state changes
export const useErrorOnly = () => {
  return useKanbanStore((state) => state.error)
}

// Only re-render when search mode changes
export const useSearchModeOnly = () => {
  return useKanbanStore((state) => state.searchMode)
}

// Minimal board header data
export const useBoardHeader = () => {
  return useKanbanStore((state) => ({
    title: state.board?.title || '',
    lastUpdated: state.board?.lastUpdated || '',
    totalMatters: state.matters.length,
    isLoading: state.isLoading
  }))
}

// Minimal column data for headers
export const useColumnHeaders = () => {
  return useKanbanStore((state) => {
    const columns = state.board?.columns || []
    const mattersByColumn = state.getMattersByColumn()
    
    return columns.map(column => ({
      id: column.id,
      title: column.title,
      count: mattersByColumn[column.id]?.length || 0
    }))
  })
}

// Performance monitoring selector
export const useStorePerformanceMetrics = () => {
  return useKanbanStore((state) => ({
    matterCount: state.matters.length,
    searchResultsCount: state.searchResults.length,
    cacheSize: state.searchHistory.length,
    lastRefresh: state.lastRefresh
  }))
}

/**
 * Batch action hooks to reduce store updates
 */

// Batch multiple filter updates
export const useBatchFilterUpdates = () => {
  const setFilters = useKanbanStore((state) => state.setFilters)
  
  return (filterUpdates: Record<string, unknown>) => {
    // Apply all filter updates in a single action
    setFilters(filterUpdates)
  }
}

// Batch multiple view preference updates
export const useBatchViewPreferenceUpdates = () => {
  const setViewPreferences = useKanbanStore((state) => state.setViewPreferences)
  
  return (preferenceUpdates: Record<string, unknown>) => {
    // Apply all preference updates in a single action
    setViewPreferences(preferenceUpdates)
  }
}

/**
 * Performance-optimized actions that minimize state updates
 */

// Debounced search action
export const useDebouncedSearch = () => {
  const performSearch = useKanbanStore((state) => state.performSearch)
  
  const debouncedFn = React.useMemo(
    () => debounce((query: string, searchType?: SearchType) => {
      performSearch(query, searchType)
    }, 300),
    [performSearch]
  )
  
  return React.useCallback(debouncedFn, [debouncedFn])
}

// Throttled filter updates
export const useThrottledFilterUpdate = () => {
  const setFilters = useKanbanStore((state) => state.setFilters)
  
  const throttledFn = React.useMemo(
    () => throttle((filters: Record<string, unknown>) => {
      setFilters(filters)
    }, 100),
    [setFilters]
  )
  
  return React.useCallback(throttledFn, [throttledFn])
}

/**
 * Utility functions
 */

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Store performance monitoring
 */
export const useStoreSubscriptionCount = () => {
  const [subscriptionCount, setSubscriptionCount] = React.useState(0)
  
  React.useEffect(() => {
    // This would need to be implemented in the store to track subscriptions
    // For now, this is a placeholder for monitoring
    console.log('Store subscription monitoring active')
  }, [])
  
  return subscriptionCount
}

/**
 * Memory leak prevention hooks
 */

// Cleanup hook for components that subscribe to store
export const useStoreCleanup = (cleanupFn?: () => void) => {
  React.useEffect(() => {
    return () => {
      if (cleanupFn) cleanupFn()
    }
  }, [cleanupFn])
}

// Hook to prevent memory leaks in long-running components
export const useMemoryLeakPrevention = () => {
  const [componentMounted, setComponentMounted] = React.useState(true)
  
  React.useEffect(() => {
    return () => {
      setComponentMounted(false)
    }
  }, [])
  
  return {
    isComponentMounted: componentMounted,
    safeSetState: React.useCallback((setter: () => void) => {
      if (componentMounted) {
        setter()
      }
    }, [componentMounted])
  }
}

