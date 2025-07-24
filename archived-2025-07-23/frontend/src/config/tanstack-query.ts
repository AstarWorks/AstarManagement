/**
 * TanStack Query Configuration
 * 
 * @description Centralized configuration for TanStack Query client optimized for
 * Kanban board operations and legal case management. This configuration provides
 * optimal cache settings, retry logic, and mutation defaults for Aster Management.
 * 
 * @author Claude
 * @created 2025-06-25
 */

import type { QueryClientConfig, DefaultOptions } from '@tanstack/vue-query'

/**
 * Cache timing constants for different data types
 * Based on data volatility and user expectations in legal case management
 */
export const CACHE_TIMES = {
  /** Static/reference data (matter statuses, priorities) - 30 minutes */
  STATIC: 30 * 60 * 1000,
  
  /** Matter data (cases, documents) - 5 minutes */
  MATTERS: 5 * 60 * 1000,
  
  /** Real-time data (notifications, activity) - 1 minute */
  REALTIME: 1 * 60 * 1000,
  
  /** User preferences/settings - 15 minutes */
  USER_SETTINGS: 15 * 60 * 1000,
  
  /** Search results - 2 minutes */
  SEARCH: 2 * 60 * 1000
} as const

/**
 * Garbage collection times (how long to keep data in memory when unused)
 * Set to 2x the stale time for optimal memory management
 */
export const GC_TIMES = {
  STATIC: CACHE_TIMES.STATIC * 2,
  MATTERS: CACHE_TIMES.MATTERS * 2,
  REALTIME: CACHE_TIMES.REALTIME * 2,
  USER_SETTINGS: CACHE_TIMES.USER_SETTINGS * 2,
  SEARCH: CACHE_TIMES.SEARCH * 2
} as const

/**
 * Memory limits for query cache
 * Prevents memory bloat on long-running sessions
 */
export const MEMORY_LIMITS = {
  /** Maximum number of queries to keep in cache */
  MAX_QUERIES: 500,
  
  /** Maximum cache size in MB (approximate) */
  MAX_CACHE_SIZE_MB: 50
} as const

/**
 * Retry configuration with exponential backoff
 * Optimized for typical legal case management API patterns
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  
  /** Base delay between retries (ms) */
  BASE_DELAY: 1000,
  
  /** Maximum delay between retries (ms) */
  MAX_DELAY: 10000,
  
  /** Exponential backoff multiplier */
  BACKOFF_MULTIPLIER: 2
} as const

/**
 * Calculate retry delay with exponential backoff and jitter
 */
export const calculateRetryDelay = (attemptIndex: number): number => {
  const delay = Math.min(
    RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attemptIndex),
    RETRY_CONFIG.MAX_DELAY
  )
  
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random()
  return Math.floor(delay + jitter)
}

/**
 * Determine if an error should trigger a retry
 * Based on HTTP status codes and error types common in legal APIs
 */
export const shouldRetry = (failureCount: number, error: any): boolean => {
  // Don't retry if we've exceeded max attempts
  if (failureCount >= RETRY_CONFIG.MAX_RETRIES) {
    return false
  }
  
  // Don't retry client errors (4xx) except for specific cases
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    // Retry on rate limiting (429) or timeout (408)
    return error.response.status === 429 || error.response.status === 408
  }
  
  // Retry on server errors (5xx) and network errors
  if (error?.response?.status >= 500 || error?.code === 'NETWORK_ERROR') {
    return true
  }
  
  // Retry on timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return true
  }
  
  // Don't retry other errors
  return false
}

/**
 * Network mode configuration for offline support
 * Essential for lawyers working in courts with poor connectivity
 */
export const getNetworkMode = (): 'online' | 'offlineFirst' | 'always' => {
  if (typeof window === 'undefined') {
    // Server-side rendering - always online
    return 'online'
  }
  
  // Check if we're in offline-first mode (court visits, poor connectivity)
  const isOfflineMode = localStorage.getItem('offline-mode') === 'true'
  return isOfflineMode ? 'offlineFirst' : 'online'
}

/**
 * Default query options for different data types
 */
export const createQueryDefaults = () => ({
  // Cache timing - moved to individual queries in v5
  staleTime: CACHE_TIMES.MATTERS,
  gcTime: GC_TIMES.MATTERS,
  
  // Retry configuration
  retry: shouldRetry,
  retryDelay: calculateRetryDelay,
  
  // Refetch behavior
  refetchOnWindowFocus: false, // Prevent excessive refetching during task switching
  refetchOnReconnect: 'always' as const, // Always refetch when coming back online
  refetchOnMount: true, // Fresh data when component mounts
  
  // Network behavior
  networkMode: getNetworkMode(),
  
  // Performance settings - removed in v5
  // notifyOnChangeProps is now handled differently
  
  // Disable automatic refetching for background tabs to save resources
  refetchIntervalInBackground: false
})

/**
 * Default mutation options with optimistic updates and error handling
 */
export const createMutationDefaults = () => ({
  // Retry configuration for mutations (more conservative)
  retry: (failureCount: number, error: any) => {
    // Only retry mutations on server errors, not client errors
    if (failureCount >= 1) return false
    return error?.response?.status >= 500 || error?.code === 'NETWORK_ERROR'
  },
  
  retryDelay: (attemptIndex: number) => {
    // Shorter delays for mutations since they're user-initiated
    return Math.min(500 * Math.pow(2, attemptIndex), 2000)
  },
  
  // Network behavior
  networkMode: getNetworkMode()
})

/**
 * Complete TanStack Query client configuration
 * Optimized for Kanban board operations and legal case management
 * 
 * Note: In TanStack Query v5, onError and onSuccess callbacks have been removed
 * from QueryCache and MutationCache. Error handling should be done in individual
 * queries/mutations or via global error boundaries.
 */
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: createQueryDefaults(),
    mutations: createMutationDefaults()
  }
  
  // In v5, QueryCache and MutationCache no longer support onError/onSuccess
  // Error handling should be implemented in:
  // 1. Individual query/mutation options
  // 2. Global error boundaries
  // 3. Custom hooks that wrap useQuery/useMutation
}

/**
 * Environment-specific configuration overrides
 */
export const getEnvironmentConfig = (): Partial<QueryClientConfig> => {
  // In Nuxt, these will be replaced at build time
  const isDev = process.env.NODE_ENV !== 'production'
  const isTest = process.env.NODE_ENV === 'test'
  
  if (isTest) {
    // Test environment: no retries, short cache times
    return {
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0
        },
        mutations: {
          retry: false
        }
      }
    }
  }
  
  if (isDev) {
    // Development: shorter cache times, more logging
    return {
      defaultOptions: {
        queries: {
          staleTime: CACHE_TIMES.MATTERS / 2, // 2.5 minutes in dev
          gcTime: GC_TIMES.MATTERS / 2
        }
      }
    }
  }
  
  // Production: use default configuration
  return {}
}

/**
 * Specialized query options for different legal domain entities
 */
export const QUERY_CONFIGS = {
  /** Matter/case data - frequently updated */
  matters: {
    staleTime: CACHE_TIMES.MATTERS,
    gcTime: GC_TIMES.MATTERS,
    refetchOnWindowFocus: true // Important to keep case data fresh
  },
  
  /** Static reference data - rarely changes */
  static: {
    staleTime: CACHE_TIMES.STATIC,
    gcTime: GC_TIMES.STATIC,
    refetchOnWindowFocus: false,
    refetchOnMount: false // Cache aggressively
  },
  
  /** Real-time notifications and activity */
  realtime: {
    staleTime: CACHE_TIMES.REALTIME,
    gcTime: GC_TIMES.REALTIME,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true
  },
  
  /** Search results - moderate caching */
  search: {
    staleTime: CACHE_TIMES.SEARCH,
    gcTime: GC_TIMES.SEARCH,
    refetchOnWindowFocus: false
  },
  
  /** User settings and preferences */
  userSettings: {
    staleTime: CACHE_TIMES.USER_SETTINGS,
    gcTime: GC_TIMES.USER_SETTINGS,
    refetchOnWindowFocus: false
  }
} as const

// Query keys are exported from types/query.ts to avoid duplication
// This ensures consistent cache management across the application
export { queryKeys } from '../types/query'
export type { QueryKeys } from '../types/query'

/**
 * Error handling helper for TanStack Query v5
 * Since onError callbacks were removed from cache configuration,
 * use this in your query/mutation options or custom hooks
 */
export const handleQueryError = (error: any, context?: { queryKey?: any }) => {
  console.error('Query failed:', { error, context })
  
  // Check for critical errors
  if (error?.response?.status >= 500) {
    console.error('Critical system error:', error)
  }
  
  // In actual usage, you would integrate with your error handling system:
  // const { $toast } = useNuxtApp()
  // $toast.error('Failed to fetch data')
}

/**
 * Success handling helper for TanStack Query v5
 * Use this in your query/mutation options for consistent logging
 */
export const handleQuerySuccess = (data: any, context?: { queryKey?: any }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('Query succeeded:', {
      context,
      dataSize: data ? JSON.stringify(data).length : 0
    })
  }
}

/**
 * Mutation error handler for TanStack Query v5
 */
export const handleMutationError = (error: any, variables?: any, context?: any) => {
  console.error('Mutation failed:', {
    error: error?.message || error,
    variables,
    context
  })
  
  // In actual usage, integrate with toast notifications:
  // const { $toast } = useNuxtApp()
  // $toast.error(error?.message || 'Operation failed')
}

/**
 * Mutation success handler for TanStack Query v5
 */
export const handleMutationSuccess = (data: any, variables?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('Mutation succeeded:', {
      variables,
      data: typeof data === 'object' ? { ...data, id: data?.id } : data
    })
  }
  
  // In actual usage, show success notifications:
  // const { $toast } = useNuxtApp()
  // $toast.success('Operation completed successfully')
}