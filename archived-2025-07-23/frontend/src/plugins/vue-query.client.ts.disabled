/**
 * TanStack Query Client Plugin for Nuxt 3
 * 
 * @description Initializes Vue Query with SSR support, hydration, and proper
 * configuration for the legal case management domain. Handles both server-side
 * rendering and client-side hydration seamlessly. Integrates with background
 * sync for dynamic refetch intervals.
 * 
 * @author Claude
 * @updated 2025-06-26
 */

import type { DehydratedState, VueQueryPluginOptions, QueryOptions } from '@tanstack/vue-query'
import { 
  VueQueryPlugin, 
  QueryClient, 
  hydrate, 
  dehydrate 
} from '@tanstack/vue-query'
import { useBackgroundSync } from '~/composables/useBackgroundSync'
import { useMultiTabSync } from '~/composables/useMultiTabSync'
import { getSyncConfig, type SyncMode } from '~/config/background-sync'
import { useState, watch } from '#imports'

export default defineNuxtPlugin((nuxtApp: any) => {
  // Create a state for SSR hydration
  const vueQueryState = useState<DehydratedState | null>('vue-query')
  
  // Dynamic query defaults function that adapts based on sync mode
  const getQueryDefaults = (queryKey: unknown[]): Partial<QueryOptions> => {
    // Only run on client side
    if (process.server) {
      return {
        // staleTime removed in v5 - replaced by gcTime
        gcTime: 10 * 60 * 1000,
      }
    }
    
    // Get data type from query key (first element)
    const dataType = queryKey[0] as string
    const validDataTypes = ['matters', 'kanban', 'activity', 'static']
    
    if (!validDataTypes.includes(dataType)) {
      // Return default config for unknown data types
      return {
        // staleTime removed in v5 - replaced by gcTime
        gcTime: 10 * 60 * 1000,
      }
    }
    
    // Get current sync mode from localStorage or default
    const syncMode = (localStorage.getItem('sync-mode') as SyncMode) || 'balanced'
    const config = getSyncConfig(dataType as any, syncMode)
    
    return {
      // staleTime removed in v5 - replaced by gcTime
      gcTime: config.staleTime * 2, // Keep in cache longer than previous stale time
      // refetchInterval and related options removed in v5
      // These are now handled via different mechanisms
    }
  }
  
  // Create QueryClient with legal domain-optimized defaults
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Dynamic defaults based on query key and sync mode
        queryFn: undefined, // Must be provided by each query
        queryKeyHashFn: (queryKey) => JSON.stringify(queryKey),
        
        // Base defaults (will be overridden by getQueryDefaults)
        // staleTime removed in v5 - replaced by gcTime
        gcTime: 10 * 60 * 1000, // 10 minutes
        
        // Network behavior
        refetchOnReconnect: 'always',
        
        // Retry configuration for legal operations
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network mode for offline support
        networkMode: 'online',
      },
      mutations: {
        // Legal operations should provide immediate feedback
        retry: 1,
        retryDelay: 1000,
        
        // Network mode for mutations
        networkMode: 'online',
      }
    }
  })
  
  const options: VueQueryPluginOptions = { queryClient }
  
  // Register Vue Query plugin
  nuxtApp.vueApp.use(VueQueryPlugin, options)
  
  // Override query defaults dynamically based on sync configuration
  if (process.client) {
    const originalGetQueryDefaults = queryClient.getQueryDefaults.bind(queryClient)
    
    queryClient.getQueryDefaults = (queryKey: any) => {
      const baseDefaults = originalGetQueryDefaults(queryKey)
      
      if (queryKey && queryKey.length > 0) {
        const dynamicDefaults = getQueryDefaults(queryKey)
        return {
          ...baseDefaults,
          ...dynamicDefaults
        }
      }
      
      return baseDefaults
    }
    
    // Set up multi-tab synchronization for queries
    const multiTabSync = useMultiTabSync({
      channelName: 'aster-tanstack-query',
      debug: process.env.NODE_ENV === 'development'
    })
    
    // Listen for query invalidations from other tabs
    if (multiTabSync.isLeader.value) {
      // Leader tab handles background sync
      const backgroundSync = useBackgroundSync()
      
      // Listen for sync mode changes
      watch(() => backgroundSync.syncMode.value, (newMode: any) => {
        // Invalidate all queries to apply new sync settings
        queryClient.invalidateQueries()
      })
    }
  }
  
  // Handle SSR hydration
  if (process.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }
  
  if (process.client) {
    nuxtApp.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value)
    })
  }
  
  // Provide query client for direct access if needed
  return {
    provide: {
      queryClient
    }
  }
})