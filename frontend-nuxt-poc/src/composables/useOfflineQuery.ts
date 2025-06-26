/**
 * Offline Query Composable
 * 
 * @description Integrates TanStack Query with offline support, providing
 * persistent caching, network detection, and data freshness indicators
 * for legal case management scenarios.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, watch, onMounted } from 'vue'
import { 
  useQuery, 
  useQueryClient,
  type UseQueryOptions,
  type QueryKey 
} from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { useOnline, useIntervalFn } from '@vueuse/core'
import { createIndexedDBPersister, isIndexedDBAvailable } from '~/utils/offline/indexeddb-persister'
import { getOfflineConfig, getDataFreshness } from '~/config/offline'
import type { Ref } from 'vue'

/**
 * Offline query options
 */
export interface UseOfflineQueryOptions<TData = unknown, TError = unknown> 
  extends UseQueryOptions<TData, TError, TData> {
  /** Enable offline persistence for this query */
  enablePersistence?: boolean
  /** Custom persistence key (defaults to query key) */
  persistenceKey?: string
  /** Show data freshness indicator */
  showFreshness?: boolean
  /** Network check interval (ms) */
  networkCheckInterval?: number
  /** Fallback data when offline and no cache */
  offlineFallback?: TData
}

/**
 * Offline query return type
 */
export interface UseOfflineQueryReturn<TData = unknown, TError = unknown> {
  // Standard query returns
  data: Ref<TData | undefined>
  error: Ref<TError | null>
  isLoading: Ref<boolean>
  isError: Ref<boolean>
  isSuccess: Ref<boolean>
  isPending: Ref<boolean>
  isStale: Ref<boolean>
  isFetching: Ref<boolean>
  
  // Offline-specific returns
  isOffline: Ref<boolean>
  dataFreshness: Ref<'fresh' | 'stale' | 'expired' | null>
  lastSyncTime: Ref<number | null>
  isFromCache: Ref<boolean>
  syncNow: () => Promise<void>
  clearCache: () => Promise<void>
}

/**
 * Global persistence setup (singleton)
 */
let persistenceInitialized = false
let persister: ReturnType<typeof createIndexedDBPersister> | null = null

/**
 * Initialize global persistence
 */
async function initializePersistence() {
  if (persistenceInitialized || !isIndexedDBAvailable()) {
    return
  }
  
  const config = getOfflineConfig()
  if (!config.persistence.enabled) {
    return
  }
  
  try {
    const queryClient = useQueryClient()
    persister = createIndexedDBPersister({
      dbName: config.persistence.dbName,
      storeName: config.persistence.stores.queryCache,
      version: config.persistence.version,
      maxCacheSize: config.persistence.maxCacheSize,
      enableCompression: config.persistence.enableCompression,
      compressionThreshold: config.persistence.compressionThreshold
    })
    
    await persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      buster: config.persistence.version.toString()
    })
    
    persistenceInitialized = true
    console.log('[OfflineQuery] Persistence initialized')
  } catch (error) {
    console.error('[OfflineQuery] Failed to initialize persistence:', error)
  }
}

/**
 * Offline-aware query composable
 */
export function useOfflineQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseOfflineQueryOptions<TData, TError>
): UseOfflineQueryReturn<TData, TError> {
  const config = getOfflineConfig()
  const queryClient = useQueryClient()
  const isOnline = useOnline()
  
  // Initialize persistence on first use
  onMounted(() => {
    if (options?.enablePersistence !== false) {
      initializePersistence()
    }
  })
  
  // Local state
  const lastSyncTime = ref<number | null>(null)
  const isFromCache = ref(false)
  const networkCheckCount = ref(0)
  
  // Enhanced query options with offline support
  const enhancedOptions: UseQueryOptions<TData, TError, TData> = {
    ...options,
    
    // Network mode based on offline config
    networkMode: isOnline.value ? 'online' : 'offlineFirst',
    
    // Retry configuration for offline scenarios
    retry: (failureCount, error) => {
      // Don't retry if explicitly offline
      if (!isOnline.value) {
        return false
      }
      
      // Use custom retry logic if provided
      if (typeof options?.retry === 'function') {
        return options.retry(failureCount, error)
      }
      
      // Default retry logic
      return failureCount < 3
    },
    
    // Stale time configuration
    staleTime: options?.staleTime ?? config.freshness.fresh,
    
    // Cache time configuration
    gcTime: options?.gcTime ?? config.freshness.expired,
    
    // Meta information for cache tracking
    meta: {
      ...options?.meta,
      persistenceEnabled: options?.enablePersistence !== false,
      offlineQuery: true
    }
  }
  
  // Execute the query
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const data = await queryFn()
        lastSyncTime.value = Date.now()
        isFromCache.value = false
        return data
      } catch (error) {
        // If offline, try to get from cache
        if (!isOnline.value) {
          const cached = queryClient.getQueryData<TData>(queryKey)
          if (cached) {
            isFromCache.value = true
            return cached
          }
          
          // Use fallback if provided
          if (options?.offlineFallback !== undefined) {
            isFromCache.value = true
            return options.offlineFallback
          }
        }
        
        throw error
      }
    },
    ...enhancedOptions
  })
  
  // Data freshness computation
  const dataFreshness = computed(() => {
    if (!query.data.value || !lastSyncTime.value) {
      return null
    }
    
    return getDataFreshness(lastSyncTime.value)
  })
  
  // Network monitoring
  if (options?.networkCheckInterval) {
    useIntervalFn(() => {
      networkCheckCount.value++
      
      // Refetch if online and data is stale
      if (isOnline.value && query.isStale.value) {
        query.refetch()
      }
    }, options.networkCheckInterval)
  }
  
  // Watch for online status changes
  watch(isOnline, (online) => {
    if (online && query.isStale.value) {
      // Automatically refetch when coming back online
      query.refetch()
    }
  })
  
  // Manual sync function
  const syncNow = async () => {
    if (!isOnline.value) {
      throw new Error('Cannot sync while offline')
    }
    
    await query.refetch()
  }
  
  // Clear cache function
  const clearCache = async () => {
    await queryClient.removeQueries({ queryKey })
    
    if (persister) {
      await persister.removeClient()
    }
  }
  
  return {
    // Standard query returns
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isPending: query.isPending,
    isStale: query.isStale,
    isFetching: query.isFetching,
    
    // Offline-specific returns
    isOffline: computed(() => !isOnline.value),
    dataFreshness,
    lastSyncTime: computed(() => lastSyncTime.value),
    isFromCache: computed(() => isFromCache.value),
    syncNow,
    clearCache
  }
}

/**
 * Prefetch queries for offline use
 */
export async function prefetchForOffline(
  queries: Array<{
    queryKey: QueryKey
    queryFn: () => Promise<any>
    staleTime?: number
  }>
): Promise<void> {
  const queryClient = useQueryClient()
  
  // Initialize persistence if not already done
  await initializePersistence()
  
  // Prefetch all queries in parallel
  await Promise.all(
    queries.map(({ queryKey, queryFn, staleTime }) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: staleTime ?? getOfflineConfig().freshness.fresh
      })
    )
  )
  
  console.log(`[OfflineQuery] Prefetched ${queries.length} queries for offline use`)
}

/**
 * Get offline cache statistics
 */
export async function getOfflineCacheStats() {
  if (!persister) {
    return null
  }
  
  const { getCacheStats } = await import('~/utils/offline/indexeddb-persister')
  return getCacheStats()
}

/**
 * Clear all offline cache
 */
export async function clearAllOfflineCache() {
  const queryClient = useQueryClient()
  
  // Clear query cache
  queryClient.clear()
  
  // Clear persisted data
  if (persister) {
    await persister.removeClient()
  }
  
  console.log('[OfflineQuery] All offline cache cleared')
}