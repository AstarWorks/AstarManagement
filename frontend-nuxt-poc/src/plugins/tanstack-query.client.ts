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
import { 
  queryClientConfig, 
  getEnvironmentConfig, 
  MEMORY_LIMITS,
  queryKeys,
  type QueryKeys
} from '~/config/tanstack-query'
import { useErrorHandler } from '~/composables/useErrorHandler'

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
  const { transformApiError, setError } = useErrorHandler()
  
  // Global query error handler
  client.getQueryCache().subscribe((event) => {
    if (event.type === 'observerAdded' && event.query.state.error) {
      const query = event.query
      const error = query.state.error
      
      // Transform API error to standard format
      const appError = transformApiError(error)
      
      // Only handle critical errors globally to avoid notification spam
      if (appError.severity === 'critical') {
        setError(appError)
      }
    }
  })
  
  // Global mutation error handler with toast integration
  client.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.mutation?.state.error) {
      const mutation = event.mutation
      const error = mutation.state.error
      
      // Transform and display mutation errors
      const appError = transformApiError(error)
      const { $toast } = useNuxtApp()
      
      // Show appropriate toast based on error severity
      switch (appError.severity) {
        case 'critical':
          $toast.error('System Error', appError.message)
          break
        case 'error':
          $toast.error('Operation Failed', appError.message)
          break
        case 'warning':
          $toast.warning('Warning', appError.message)
          break
        default:
          $toast.info('Notice', appError.message)
      }
    }
  })
}

/**
 * Success handler integration with toast notifications
 */
const setupSuccessIntegration = (client: QueryClient) => {
  const { $toast } = useNuxtApp()
  
  // Global mutation success handler
  client.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.mutation?.state.status === 'success') {
      const mutation = event.mutation
      const variables = mutation.state.variables as any
      
      // Determine success message based on mutation type
      let successMessage = 'Operation completed successfully'
      
      if (variables) {
        if (variables.action === 'create') {
          successMessage = 'Item created successfully'
        } else if (variables.action === 'update') {
          successMessage = 'Item updated successfully'
        } else if (variables.action === 'delete') {
          successMessage = 'Item deleted successfully'
        }
      }
      
      // Show success toast with short duration for mutations
      $toast.success(successMessage, {
        duration: 3000,
        action: variables?.undoable ? {
          label: 'Undo',
          onClick: () => {
            // Undo functionality can be implemented per mutation
            console.log('Undo action triggered')
          }
        } : undefined
      })
    }
  })
}

/**
 * Development tools setup
 */
const setupDevTools = (client: QueryClient) => {
  if (!process.dev) return

  // Enhanced logging for development
  client.getQueryCache().subscribe((event) => {
    if (event.type === 'observerAdded') {
      console.debug('Query added:', {
        queryKey: event.query.queryKey,
        queryHash: event.query.queryHash,
        status: event.query.state.status
      })
    }
  })

  // Mutation logging
  client.getMutationCache().subscribe((event) => {
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
export default defineNuxtPlugin((nuxtApp) => {
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

/**
 * Type declarations for auto-imports and TypeScript support
 */
declare module '#app' {
  interface NuxtApp {
    $queryClient: QueryClient
    $queryKeys: QueryKeys
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $queryClient: QueryClient
    $queryKeys: QueryKeys
  }
}

// Global window interface for development debugging
declare global {
  interface Window {
    __QUERY_CLIENT__?: QueryClient
  }
}

/**
 * Export the global query client getter for use in composables
 */
export const getQueryClient = (): QueryClient => {
  if (!queryClient) {
    throw new Error('Query client not initialized. Make sure the plugin is loaded.')
  }
  return queryClient
}