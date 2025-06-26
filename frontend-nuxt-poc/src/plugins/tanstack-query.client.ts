/**
 * TanStack Query Client Plugin for Nuxt 3
 * 
 * @description Enhanced TanStack Query configuration plugin optimized for Kanban
 * board operations and legal case management. Provides SSR support, error handling
 * integration, and performance-optimized cache settings.
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { 
  QueryClient, 
  VueQueryPlugin, 
  dehydrate, 
  hydrate,
  type DehydratedState,
  type VueQueryPluginOptions 
} from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { 
  queryClientConfig, 
  getEnvironmentConfig, 
  MEMORY_LIMITS,
  queryKeys,
  type QueryKeys
} from '~/config/tanstack-query'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { createIndexedDBPersister, isIndexedDBAvailable } from '~/utils/offline/indexeddb-persister'
import { getOfflineConfig } from '~/config/offline'

/**
 * Global query client instance
 * Configured with optimal settings for legal case management
 */
let queryClient: QueryClient | null = null

/**
 * Create and configure the global query client
 * Merges base configuration with environment-specific overrides
 */
const createQueryClient = (): QueryClient => {
  if (queryClient) {
    return queryClient
  }

  // Merge base config with environment-specific overrides
  const envConfig = getEnvironmentConfig()
  const finalConfig = {
    ...queryClientConfig,
    defaultOptions: {
      ...queryClientConfig.defaultOptions,
      queries: {
        ...queryClientConfig.defaultOptions?.queries,
        ...envConfig.defaultOptions?.queries
      },
      mutations: {
        ...queryClientConfig.defaultOptions?.mutations,
        ...envConfig.defaultOptions?.mutations
      }
    }
  }

  queryClient = new QueryClient(finalConfig)

  // Set up memory management for long-running sessions
  if (typeof window !== 'undefined') {
    setupMemoryManagement(queryClient)
  }

  return queryClient
}

/**
 * Memory management for the query cache
 * Prevents memory bloat during long legal case review sessions
 */
const setupMemoryManagement = (client: QueryClient) => {
  // Periodic cache cleanup every 5 minutes
  const cleanupInterval = setInterval(() => {
    const queryCache = client.getQueryCache()
    const queries = queryCache.getAll()
    
    // Log cache statistics in development
    if (process.dev) {
      const cacheStats = {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        staleQueries: queries.filter(q => q.isStale()).length,
        memoryUsage: `${Math.round(JSON.stringify(queries).length / 1024)}KB`
      }
      console.debug('TanStack Query Cache Stats:', cacheStats)
    }
    
    // Remove excessive queries if we're over the limit
    if (queries.length > MEMORY_LIMITS.MAX_QUERIES) {
      const excessQueries = queries
        .filter(q => q.getObserversCount() === 0) // Only inactive queries
        .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0)) // Oldest first
        .slice(0, queries.length - MEMORY_LIMITS.MAX_QUERIES)
      
      excessQueries.forEach(query => {
        queryCache.remove(query)
      })
      
      if (process.dev && excessQueries.length > 0) {
        console.debug(`Cleaned up ${excessQueries.length} inactive queries`)
      }
    }
    
    // Garbage collect unused data
    client.getQueryCache().clear()
  }, 5 * 60 * 1000) // Every 5 minutes

  // Clean up interval on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupInterval)
    })
  }
}

/**
 * Enhanced error integration with existing error handling system
 */
const setupErrorIntegration = (client: QueryClient) => {
  // Error handling will be integrated when useErrorHandler composable is available
  
  // Global query error handler
  client.getQueryCache().subscribe((event: any) => {
    if (event.type === 'observerAdded' && event.query.state.error) {
      const query = event.query
      const error = query.state.error
      
      // Basic error logging for now
      console.error('Query error:', error)
      
      // TODO: Integrate with useErrorHandler when available
      // const { transformApiError, setError } = useErrorHandler()
      // const appError = transformApiError(error)
      // if (appError.severity === 'critical') {
      //   setError(appError)
      // }
    }
  })
  
  // Global mutation error handler with toast integration
  client.getMutationCache().subscribe((event: any) => {
    if (event.type === 'updated' && event.mutation?.state.error) {
      const mutation = event.mutation
      const error = mutation.state.error
      
      // Basic error logging for now
      console.error('Mutation error:', error)
      
      // TODO: Integrate with toast system when available
      // const { $toast } = useNuxtApp()
      // const { transformApiError } = useErrorHandler()
      // const appError = transformApiError(error)
      // $toast.error('Operation Failed', appError.message)
    }
  })
}

/**
 * Success handler integration with toast notifications
 */
const setupSuccessIntegration = (client: QueryClient) => {
  // Success integration will be added when toast system is available
  
  // Global mutation success handler
  client.getMutationCache().subscribe((event: any) => {
    if (event.type === 'updated' && event.mutation?.state.status === 'success') {
      const mutation = event.mutation
      const variables = mutation.state.variables as any
      
      // Basic success logging for now
      console.debug('Mutation succeeded:', {
        mutationId: mutation.mutationId,
        variables
      })
      
      // TODO: Integrate with toast system when available
      // const { $toast } = useNuxtApp()
      // $toast.success('Operation completed successfully')
    }
  })
}

/**
 * Set up offline persistence
 */
const setupOfflinePersistence = async (client: QueryClient) => {
  const offlineConfig = getOfflineConfig()
  
  if (!offlineConfig.persistence.enabled || !isIndexedDBAvailable()) {
    console.log('[TanStack Query] Offline persistence disabled or unavailable')
    return
  }
  
  try {
    const persister = createIndexedDBPersister({
      dbName: offlineConfig.persistence.dbName,
      storeName: offlineConfig.persistence.stores.queryCache,
      version: offlineConfig.persistence.version,
      maxCacheSize: offlineConfig.persistence.maxCacheSize,
      enableCompression: offlineConfig.persistence.enableCompression,
      compressionThreshold: offlineConfig.persistence.compressionThreshold,
      debug: process.dev
    })
    
    await persistQueryClient({
      queryClient: client,
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      buster: offlineConfig.persistence.version.toString()
    })
    
    console.log('[TanStack Query] Offline persistence initialized')
  } catch (error) {
    console.error('[TanStack Query] Failed to initialize offline persistence:', error)
  }
}

/**
 * Development tools setup
 */
const setupDevTools = (client: QueryClient) => {
  if (!process.dev) return

  // Enhanced logging for development
  client.getQueryCache().subscribe((event: any) => {
    if (event.type === 'observerAdded') {
      console.debug('Query added:', {
        queryKey: event.query.queryKey,
        queryHash: event.query.queryHash,
        status: event.query.state.status
      })
    }
  })

  // Mutation logging
  client.getMutationCache().subscribe((event: any) => {
    if (event.type === 'added') {
      console.debug('Mutation started:', {
        mutationId: event.mutation?.mutationId,
        variables: event.mutation?.state.variables
      })
    }
  })

  // Global query client access for debugging
  if (typeof window !== 'undefined') {
    window.__QUERY_CLIENT__ = client
    console.debug('Query client available at window.__QUERY_CLIENT__')
  }
}

/**
 * Main Nuxt plugin definition
 */
export default defineNuxtPlugin((nuxtApp: any) => {
  // Create the global query client
  const client = createQueryClient()
  
  // State for SSR hydration
  const vueQueryState = useState<DehydratedState | null>('vue-query')
  
  // Plugin options
  const options: VueQueryPluginOptions = {
    queryClient: client,
    
    // Optional: customize how queries are persisted
    enableDevtoolsV6Plugin: process.dev,
    
    // Configure client options
    clientPersister: undefined, // We handle persistence manually for better control
    clientPersisterKey: 'NUXT_QUERY_CLIENT_CACHE'
  }
  
  // Install the Vue Query plugin
  nuxtApp.vueApp.use(VueQueryPlugin, options)
  
  // Set up integrations
  setupErrorIntegration(client)
  setupSuccessIntegration(client)
  setupDevTools(client)
  
  // Set up offline persistence
  if (process.client) {
    setupOfflinePersistence(client)
  }
  
  // SSR: Serialize query cache for client hydration
  if (process.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(client)
    })
  }
  
  // Client: Hydrate query cache from server state
  if (process.client) {
    nuxtApp.hooks.hook('app:created', () => {
      if (vueQueryState.value) {
        hydrate(client, vueQueryState.value)
      }
    })
  }
  
  // Provide utilities globally
  return {
    provide: {
      queryClient: client,
      queryKeys: queryKeys as QueryKeys
    }
  }
})

// Type declarations are in src/types/global.d.ts

/**
 * Export the global query client getter for use in composables
 */
export const getQueryClient = (): QueryClient => {
  if (!queryClient) {
    throw new Error('Query client not initialized. Make sure the plugin is loaded.')
  }
  return queryClient
}