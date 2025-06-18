/**
 * Real-time polling hook for Kanban board updates
 * 
 * @description Implements intelligent polling for matter updates with conflict
 * resolution and performance optimization. Pauses during user interactions
 * and provides comprehensive error handling with exponential backoff.
 * 
 * @example
 * ```tsx
 * const { isPolling, lastUpdate, connectionStatus } = usePollingUpdates()
 * ```
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { differenceBy, isEqual } from 'lodash-es'

import { useKanbanStore } from '@/stores/kanban-store'
import type { MatterCard } from '@/components/kanban/types'

interface PollingConfig {
  interval: number // milliseconds
  enabled: boolean
  pauseOnInteraction: boolean
  retryAttempts: number
  backoffMultiplier: number
  maxInterval: number
}

const DEFAULT_CONFIG: PollingConfig = {
  interval: 30000, // 30 seconds
  enabled: true,
  pauseOnInteraction: true,
  retryAttempts: 3,
  backoffMultiplier: 2,
  maxInterval: 300000, // 5 minutes max
}

interface UpdateDiff {
  added: MatterCard[]
  removed: MatterCard[]
  updated: MatterCard[]
}

interface PollingState {
  isPolling: boolean
  lastUpdate: Date | null
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  errorCount: number
  nextRetryIn: number
}

/**
 * Custom hook for managing real-time updates via polling
 */
export function usePollingUpdates(config: Partial<PollingConfig> = {}) {
  const queryClient = useQueryClient()
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Store selectors
  const {
    matters,
    isDragging,
    pollingEnabled,
    lastSyncTime,
    setPollingEnabled,
    setLastSyncTime,
    applyBulkUpdate,
    fetchMatters
  } = useKanbanStore()

  // Polling state
  const errorCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Detect changes between old and new matter arrays
   */
  const detectChanges = useCallback((
    oldMatters: MatterCard[], 
    newMatters: MatterCard[]
  ): UpdateDiff => {
    const added = differenceBy(newMatters, oldMatters, 'id')
    const removed = differenceBy(oldMatters, newMatters, 'id')
    const updated = newMatters.filter(newMatter => {
      const oldMatter = oldMatters.find(m => m.id === newMatter.id)
      return oldMatter && !isEqual(oldMatter, newMatter)
    })
    
    return { added, removed, updated }
  }, [])

  /**
   * Handle successful update response
   */
  const handleUpdateSuccess = useCallback((newMatters: MatterCard[]) => {
    const diff = detectChanges(matters, newMatters)
    const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0

    if (hasChanges) {
      // Apply updates to store
      applyBulkUpdate(newMatters)
      setLastSyncTime(new Date())

      // Reset error count on successful update
      errorCountRef.current = 0

      // Notify user of external changes
      const totalChanges = diff.added.length + diff.removed.length + diff.updated.length
      if (totalChanges > 0) {
        let message = 'Board updated'
        if (diff.added.length > 0) message += ` (+${diff.added.length})`
        if (diff.updated.length > 0) message += ` (~${diff.updated.length})`
        if (diff.removed.length > 0) message += ` (-${diff.removed.length})`
        
        toast.success(message, {
          duration: 3000,
          description: `${totalChanges} matter${totalChanges === 1 ? '' : 's'} changed`
        })
      }
    }
  }, [matters, detectChanges, applyBulkUpdate, setLastSyncTime])

  /**
   * Handle polling error with exponential backoff
   */
  const handlePollingError = useCallback((error: Error) => {
    errorCountRef.current += 1
    const backoffDelay = Math.min(
      mergedConfig.interval * Math.pow(mergedConfig.backoffMultiplier, errorCountRef.current - 1),
      mergedConfig.maxInterval
    )

    console.error('Polling error:', error)
    
    if (errorCountRef.current <= mergedConfig.retryAttempts) {
      toast.error('Connection issue', {
        description: `Retrying in ${Math.round(backoffDelay / 1000)}s...`,
        duration: 3000
      })
      
      // Schedule retry
      retryTimeoutRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['matters', 'polling'] })
      }, backoffDelay)
    } else {
      toast.error('Connection lost', {
        description: 'Please refresh the page or check your connection',
        duration: 10000,
        action: {
          label: 'Retry now',
          onClick: () => {
            errorCountRef.current = 0
            queryClient.invalidateQueries({ queryKey: ['matters', 'polling'] })
          }
        }
      })
    }
  }, [mergedConfig, queryClient])

  /**
   * React Query polling setup
   */
  const query = useQuery({
    queryKey: ['matters', 'polling'],
    queryFn: fetchMatters,
    enabled: pollingEnabled && mergedConfig.enabled && !isDragging,
    refetchInterval: (data, query) => {
      // Don't poll if there are errors or user is interacting
      if (query.state.error || isDragging) return false
      
      // Use exponential backoff if there were recent errors
      if (errorCountRef.current > 0) {
        return Math.min(
          mergedConfig.interval * Math.pow(mergedConfig.backoffMultiplier, errorCountRef.current),
          mergedConfig.maxInterval
        )
      }
      
      return mergedConfig.interval
    },
    refetchIntervalInBackground: false,
    retry: false, // We handle retries manually
    staleTime: mergedConfig.interval / 2, // Consider data stale after half the polling interval
    onSuccess: handleUpdateSuccess,
    onError: handlePollingError
  })

  /**
   * Cleanup retry timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Calculate connection status
   */
  const connectionStatus: PollingState['connectionStatus'] = 
    query.isError ? 'disconnected' :
    query.isFetching ? 'reconnecting' :
    'connected'

  /**
   * Calculate next retry time
   */
  const nextRetryIn = errorCountRef.current > 0 
    ? Math.min(
        mergedConfig.interval * Math.pow(mergedConfig.backoffMultiplier, errorCountRef.current),
        mergedConfig.maxInterval
      ) / 1000
    : 0

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    errorCountRef.current = 0
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    await queryClient.invalidateQueries({ queryKey: ['matters', 'polling'] })
  }, [queryClient])

  /**
   * Toggle polling
   */
  const togglePolling = useCallback(() => {
    setPollingEnabled(!pollingEnabled)
    if (!pollingEnabled) {
      // Reset error count when re-enabling
      errorCountRef.current = 0
    }
  }, [pollingEnabled, setPollingEnabled])

  return {
    // State
    isPolling: query.isFetching,
    isEnabled: pollingEnabled && mergedConfig.enabled,
    lastUpdate: lastSyncTime,
    connectionStatus,
    errorCount: errorCountRef.current,
    nextRetryIn,
    hasError: query.isError,
    
    // Data
    data: query.data,
    error: query.error,
    
    // Actions
    refresh,
    togglePolling,
    enable: () => setPollingEnabled(true),
    disable: () => setPollingEnabled(false)
  }
}