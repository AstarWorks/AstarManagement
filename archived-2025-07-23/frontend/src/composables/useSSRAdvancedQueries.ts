/**
 * SSR-optimized Advanced Queries Composable
 * 
 * @description Enhanced composable for server-side rendering with advanced query prefetching
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

import { useQueryClient } from '@tanstack/vue-query'
import { unref } from 'vue'
import {
  useInfiniteMattersQuery,
  useMatterSearchQuery,
  useMatterSuggestionsQuery,
  useMatterStatisticsQuery,
  useMatterStatusCountsQuery,
  advancedQueryKeys,
  type MatterSearchParams
} from './useAdvancedMattersQuery'
import type { MaybeRef } from 'vue'

/**
 * SSR-optimized hook for advanced matters queries with prefetching
 */
export async function useSSRAdvancedQueries(
  initialParams: MaybeRef<MatterSearchParams> = {},
  options: {
    enablePrefetch?: boolean
    prefetchStatistics?: boolean
    prefetchStatusCounts?: boolean
  } = {}
) {
  const {
    enablePrefetch = true,
    prefetchStatistics = true,
    prefetchStatusCounts = true
  } = options

  const queryClient = useQueryClient()

  // Server-side prefetching
  if (process.server && enablePrefetch) {
    const resolvedParams = unref(initialParams)

    // Prefetch initial matters page
    await queryClient.prefetchInfiniteQuery({
      queryKey: advancedQueryKeys.infinite(resolvedParams),
      queryFn: async ({ pageParam = 1 }) => {
        const searchParams = new URLSearchParams({
          page: pageParam.toString(),
          limit: '10'
        })
        
        Object.entries(resolvedParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(key, String(v)))
            } else {
              searchParams.append(key, String(value))
            }
          }
        })
        
        return await $fetch(`/api/matters?${searchParams}`)
      },
      initialPageParam: 1
    })

    // Prefetch statistics if enabled
    if (prefetchStatistics) {
      await queryClient.prefetchQuery({
        queryKey: advancedQueryKeys.statistics(),
        queryFn: () => $fetch('/api/matters/statistics'),
        staleTime: 5 * 60 * 1000
      })
    }

    // Prefetch status counts if enabled
    if (prefetchStatusCounts) {
      await queryClient.prefetchQuery({
        queryKey: advancedQueryKeys.statusCounts(),
        queryFn: () => $fetch('/api/matters/status-counts'),
        staleTime: 30 * 1000
      })
    }
  }

  // Return standard query hooks for client use
  return {
    // Infinite scroll queries
    useInfiniteMattersQuery: (params?: MaybeRef<MatterSearchParams>, opts?: any) => 
      useInfiniteMattersQuery(params || initialParams, opts),
    
    // Search queries
    useMatterSearchQuery: (searchTerm: MaybeRef<string>, filters?: MaybeRef<Omit<MatterSearchParams, 'q'>>, opts?: any) =>
      useMatterSearchQuery(searchTerm, filters, opts),
    
    useMatterSuggestionsQuery: (searchTerm: MaybeRef<string>, opts?: any) =>
      useMatterSuggestionsQuery(searchTerm, opts),
    
    // Analytics queries
    useMatterStatisticsQuery: (filters?: MaybeRef<Record<string, any>>, opts?: any) =>
      useMatterStatisticsQuery(filters, opts),
    
    useMatterStatusCountsQuery: (filters?: MaybeRef<Record<string, any>>, opts?: any) =>
      useMatterStatusCountsQuery(filters, opts),
    
    // Query utilities
    queryKeys: advancedQueryKeys,
    queryClient
  }
}

/**
 * Prefetch utilities for pages that need to load data before rendering
 */
export const ssrPrefetchUtils = {
  /**
   * Prefetch matters for a specific route/page
   */
  async prefetchMattersForRoute(
    route: string,
    params: MatterSearchParams = {},
    queryClient: any
  ) {
    try {
      // Determine what to prefetch based on route
      switch (route) {
        case '/matters':
        case '/dashboard':
          // Prefetch main matters list
          await queryClient.prefetchInfiniteQuery({
            queryKey: advancedQueryKeys.infinite(params),
            queryFn: async ({ pageParam = 1 }) => {
              const searchParams = new URLSearchParams({
                page: pageParam.toString(),
                limit: '10'
              })
              
              // Add params to searchParams properly
              Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                  if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, String(v)))
                  } else {
                    searchParams.append(key, String(value))
                  }
                }
              })
              
              return await $fetch(`/api/matters?${searchParams}`)
            },
            initialPageParam: 1
          })
          
          // Prefetch status counts for Kanban
          await queryClient.prefetchQuery({
            queryKey: advancedQueryKeys.statusCounts(),
            queryFn: () => $fetch('/api/matters/status-counts')
          })
          break

        case '/analytics':
        case '/reports':
          // Prefetch statistics for analytics page
          await queryClient.prefetchQuery({
            queryKey: advancedQueryKeys.statistics(params),
            queryFn: () => {
              const searchParams = new URLSearchParams()
              
              // Add params to searchParams properly
              Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                  if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, String(v)))
                  } else {
                    searchParams.append(key, String(value))
                  }
                }
              })
              
              return $fetch(`/api/matters/statistics?${searchParams}`)
            }
          })
          break

        case '/search':
          // Prefetch popular suggestions
          await queryClient.prefetchQuery({
            queryKey: advancedQueryKeys.suggestions(''),
            queryFn: () => $fetch('/api/matters/suggestions?q=&limit=8')
          })
          break
      }
    } catch (error) {
      console.warn(`Failed to prefetch data for route ${route}:`, error)
      // Don't throw - continue with CSR
    }
  },

  /**
   * Invalidate and refetch critical data after mutations
   */
  async refreshCriticalData(queryClient: any, filters: MatterSearchParams = {}) {
    try {
      // Invalidate matters list
      await queryClient.invalidateQueries({
        queryKey: ['matters']
      })
      
      // Refresh status counts (important for Kanban)
      await queryClient.invalidateQueries({
        queryKey: advancedQueryKeys.statusCounts()
      })
      
      // Refresh statistics if on analytics pages
      if (process.client && window.location.pathname.includes('/analytics')) {
        await queryClient.invalidateQueries({
          queryKey: advancedQueryKeys.statistics()
        })
      }
    } catch (error) {
      console.warn('Failed to refresh critical data:', error)
    }
  }
}

/**
 * SSR-aware query configuration
 */
export const ssrQueryConfig = {
  /**
   * Default query options optimized for SSR
   */
  getSSRQueryDefaults: () => ({
    staleTime: process.server ? Infinity : 5 * 60 * 1000, // Never stale on server
    cacheTime: process.server ? 5 * 60 * 1000 : 10 * 60 * 1000, // Shorter cache on server
    refetchOnWindowFocus: process.client, // Only refetch on client
    refetchOnMount: process.client, // Only refetch on client
    refetchOnReconnect: process.client, // Only refetch on client
    retry: process.server ? false : 3 // No retries on server
  }),

  /**
   * Query options for critical data that should be fresh
   */
  getCriticalQueryDefaults: () => ({
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: process.client ? 60 * 1000 : false // Refresh every minute on client
  }),

  /**
   * Query options for background/analytics data
   */
  getBackgroundQueryDefaults: () => ({
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })
}