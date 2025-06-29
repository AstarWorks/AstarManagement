/**
 * Advanced Matters Query Composable
 * 
 * @description Provides advanced TanStack Query hooks for matters including
 * infinite scrolling, search functionality, and filter state management
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/vue-query'
import { computed, unref, ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { MaybeRef } from 'vue'

// Enhanced types for advanced queries
export interface MatterSearchParams {
  q?: string
  status?: string
  priority?: string
  assignee?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
    totalPages: number
  }
  filters?: Record<string, any>
  meta?: Record<string, any>
}

export interface SearchResponse {
  items: any[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
    totalPages: number
  }
  query: {
    searchTerm: string
    status?: string
    priority?: string
  }
  meta: {
    searchTime: number
    maxScore: number
  }
}

export interface SuggestionResponse {
  suggestions: Array<{
    text: string
    type: string
    category: string
    highlight: string
  }>
  groupedSuggestions: Record<string, any>
  query: string
  meta: {
    totalFound: number
    searchTime: number
  }
}

export interface StatusCountsResponse {
  counts: Record<string, number>
  trends: Record<string, any>
  metadata: Record<string, any>
  summary: {
    totalActive: number
    totalMatters: number
    completionRate: number
    lastUpdated: string
  }
  filters: Record<string, any>
}

/**
 * Advanced query key factory to avoid conflicts with T03_S08
 */
export const advancedQueryKeys = {
  // Advanced search and filtering
  search: (params: MatterSearchParams) => ['matters', 'search', params] as const,
  suggestions: (query: string) => ['matters', 'suggestions', query] as const,
  
  // Infinite query for pagination  
  infinite: (params: MatterSearchParams) => ['matters', 'infinite', params] as const,
  
  // Statistics and analytics
  statistics: (filters?: Record<string, any>) => ['matters', 'statistics', filters] as const,
  statusCounts: (filters?: Record<string, any>) => ['matters', 'status-counts', filters] as const,
  
  // Individual matter detail (enhanced from T03_S08)
  detail: (id: string) => ['matters', 'detail', id] as const,
} as const

/**
 * Infinite query hook for matters with advanced pagination
 */
export function useInfiniteMattersQuery(
  params: MaybeRef<MatterSearchParams> = {},
  options: { enabled?: MaybeRef<boolean> } = {}
) {
  return useInfiniteQuery({
    queryKey: computed(() => advancedQueryKeys.infinite(unref(params))),
    queryFn: async ({ pageParam = 1 }) => {
      const resolvedParams = unref(params)
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: '10'
      })
      
      // Safely add parameters with type checking
      Object.entries(resolvedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
      
      const response = await $fetch<PaginatedResponse<any>>(`/api/matters?${searchParams}`)
      return response
    },
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: 1,
    enabled: computed(() => unref(options.enabled) ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: keepPreviousData
  })
}

/**
 * Search query hook with debouncing and relevance scoring
 */
export function useMatterSearchQuery(
  searchTerm: MaybeRef<string>,
  filters: MaybeRef<Omit<MatterSearchParams, 'q'>> = {},
  options: { enabled?: MaybeRef<boolean>; debounceMs?: number } = {}
) {
  const { debounceMs = 300 } = options
  
  // Debounce search term
  const debouncedSearchTerm = ref('')
  
  watchDebounced(
    () => unref(searchTerm),
    (newTerm: string) => {
      debouncedSearchTerm.value = newTerm
    },
    { debounce: debounceMs }
  )
  
  return useQuery({
    queryKey: computed(() => 
      advancedQueryKeys.search({ 
        q: debouncedSearchTerm.value, 
        ...unref(filters) 
      })
    ),
    queryFn: async () => {
      if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
        return null
      }
      
      const resolvedFilters = unref(filters)
      const params = new URLSearchParams({
        q: debouncedSearchTerm.value
      })
      
      // Safely add filter parameters
      Object.entries(resolvedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          } else {
            params.append(key, String(value))
          }
        }
      })
      
      return await $fetch<SearchResponse>(`/api/matters/search?${params}`)
    },
    enabled: computed(() => 
      (unref(options.enabled) ?? true) && 
      debouncedSearchTerm.value.length >= 2
    ),
    staleTime: 30 * 1000, // 30 seconds for search results
    placeholderData: keepPreviousData
  })
}

/**
 * Search suggestions hook for autocomplete
 */
export function useMatterSuggestionsQuery(
  searchTerm: MaybeRef<string>,
  options: { enabled?: MaybeRef<boolean>; debounceMs?: number } = {}
) {
  const { debounceMs = 150 } = options
  
  // Debounce for faster suggestions
  const debouncedTerm = ref('')
  
  watchDebounced(
    () => unref(searchTerm),
    (newTerm: string) => {
      debouncedTerm.value = newTerm
    },
    { debounce: debounceMs }
  )
  
  return useQuery({
    queryKey: computed(() => advancedQueryKeys.suggestions(debouncedTerm.value)),
    queryFn: async () => {
      if (!debouncedTerm.value || debouncedTerm.value.length < 1) {
        return { suggestions: [], groupedSuggestions: {}, query: '', meta: { totalFound: 0, searchTime: 0 } }
      }
      
      const params = new URLSearchParams({
        q: debouncedTerm.value,
        limit: '8'
      })
      
      return await $fetch<SuggestionResponse>(`/api/matters/suggestions?${params}`)
    },
    enabled: computed(() => 
      (unref(options.enabled) ?? true) && 
      debouncedTerm.value.length >= 1
    ),
    staleTime: 60 * 1000, // 1 minute for suggestions
    gcTime: 5 * 60 * 1000 // 5 minutes cache
  })
}

/**
 * Matter statistics query for analytics dashboard
 */
export function useMatterStatisticsQuery(
  filters: MaybeRef<Record<string, any>> = {},
  options: { enabled?: MaybeRef<boolean>; refetchInterval?: number } = {}
) {
  return useQuery({
    queryKey: computed(() => advancedQueryKeys.statistics(unref(filters))),
    queryFn: async () => {
      const resolvedFilters = unref(filters)
      const params = new URLSearchParams()
      
      // Safely construct query parameters
      Object.entries(resolvedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
      
      return await $fetch(`/api/matters/statistics?${params}`)
    },
    enabled: computed(() => unref(options.enabled) ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: options.refetchInterval || 30 * 1000 // 30 seconds
  })
}

/**
 * Status counts query for Kanban column indicators
 */
export function useMatterStatusCountsQuery(
  filters: MaybeRef<Record<string, any>> = {},
  options: { enabled?: MaybeRef<boolean>; refetchInterval?: number } = {}
) {
  return useQuery({
    queryKey: computed(() => advancedQueryKeys.statusCounts(unref(filters))),
    queryFn: async () => {
      const resolvedFilters = unref(filters)
      const params = new URLSearchParams()
      
      // Safely construct query parameters
      Object.entries(resolvedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
      
      return await $fetch<StatusCountsResponse>(`/api/matters/status-counts?${params}`)
    },
    enabled: computed(() => unref(options.enabled) ?? true),
    staleTime: 30 * 1000, // 30 seconds for real-time counts
    refetchInterval: options.refetchInterval || 15 * 1000 // 15 seconds auto-refresh
  })
}

/**
 * Enhanced matter detail query with additional data
 */
export function useMatterDetailQuery(
  matterId: MaybeRef<string>,
  options: { enabled?: MaybeRef<boolean> } = {}
) {
  return useQuery({
    queryKey: computed(() => advancedQueryKeys.detail(unref(matterId))),
    queryFn: async () => {
      const id = unref(matterId)
      if (!id || typeof id !== 'string') {
        throw new Error('Valid Matter ID is required')
      }
      
      return await $fetch(`/api/matters/${encodeURIComponent(id)}`)
    },
    enabled: computed(() => 
      (unref(options.enabled) ?? true) && 
      !!unref(matterId)
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes for matter details
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors
      if (error?.response?.status === 404) return false
      return failureCount < 2
    }
  })
}

/**
 * Combined advanced matters query hook
 * Provides all advanced query functionality in one composable
 */
export function useAdvancedMattersQuery() {
  return {
    // Query hooks
    useInfiniteMattersQuery,
    useMatterSearchQuery,
    useMatterSuggestionsQuery,
    useMatterStatisticsQuery,
    useMatterStatusCountsQuery,
    useMatterDetailQuery,
    
    // Query keys for manual cache manipulation
    queryKeys: advancedQueryKeys
  }
}