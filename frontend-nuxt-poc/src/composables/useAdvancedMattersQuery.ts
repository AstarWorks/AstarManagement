/**
 * Advanced TanStack Query Composables for Matter Management
 * 
 * @description Advanced query features including infinite scrolling, search, 
 * filter state management, and SSR prefetch utilities for legal matter operations.
 * 
 * @author Claude
 * @created 2025-06-26
 * @updated 2025-06-26 (T11_S08 - Advanced Queries Search)
 */

import { 
  useInfiniteQuery, 
  useQuery, 
  useQueryClient,
  useSuspenseQuery,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
  type InfiniteData
} from '@tanstack/vue-query'
import { unref, computed, ref, type MaybeRef } from 'vue'
import type { 
  Matter, 
  MatterFilters, 
  PaginatedResponse,
  QueryError,
  SearchSuggestion,
  MatterStatistics,
  FilterState
} from '~/types/query'
import { queryKeys } from '~/types/query'

// ============================================================================
// INFINITE QUERY HOOKS
// ============================================================================

/**
 * Enhanced infinite query for matters with bidirectional loading
 * Supports infinite scrolling with load more above/below functionality
 */
export function useInfiniteMattersQuery(
  filters?: MaybeRef<MatterFilters>,
  options?: Partial<UseInfiniteQueryOptions<PaginatedResponse<Matter>, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useInfiniteQuery({
    queryKey: queryKeys.infinite(filters),
    queryFn: async ({ pageParam = { page: 0, direction: 'next' } }): Promise<PaginatedResponse<Matter>> => {
      const filterParams = unref(filters)
      const searchParams = new URLSearchParams()
      
      // Add pagination parameters
      searchParams.append('page', pageParam.page.toString())
      searchParams.append('direction', pageParam.direction)
      
      // Add filter parameters
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(key, v.toString()))
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }
      
      return await $fetch<PaginatedResponse<Matter>>(`/api/matters?${searchParams.toString()}`)
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasNext) return undefined
      return {
        page: lastPage.page + 1,
        direction: 'next' as const
      }
    },
    getPreviousPageParam: (firstPage, pages) => {
      if (!firstPage.hasPrev) return undefined
      return {
        page: firstPage.page - 1,
        direction: 'previous' as const
      }
    },
    initialPageParam: { page: 0, direction: 'next' as const },
    maxPages: 50, // Prevent memory issues with very large datasets
    ...options
  })
}

/**
 * Infinite query specifically for search results with relevance scoring
 */
export function useInfiniteSearchQuery(
  searchQuery: MaybeRef<string>,
  filters?: MaybeRef<MatterFilters>,
  options?: Partial<UseInfiniteQueryOptions<PaginatedResponse<Matter>, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useInfiniteQuery({
    queryKey: queryKeys.search(searchQuery, filters),
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedResponse<Matter>> => {
      const query = unref(searchQuery)
      const filterParams = unref(filters)
      
      if (!query || query.trim().length < 2) {
        return {
          data: [],
          total: 0,
          page: 0,
          limit: 20,
          hasNext: false,
          hasPrev: false
        }
      }
      
      const searchParams = new URLSearchParams({
        q: query.trim(),
        page: pageParam.toString(),
        limit: '20'
      })
      
      // Add filter parameters
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(key, v.toString()))
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }
      
      return await $fetch<PaginatedResponse<Matter>>(`/api/matters/search?${searchParams.toString()}`)
    },
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    enabled: computed(() => {
      const query = unref(searchQuery)
      return query && query.trim().length >= 2
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// ============================================================================
// SEARCH QUERY HOOKS
// ============================================================================

/**
 * Real-time search with debouncing and suggestion support
 */
export function useMatterSearchQuery(
  searchQuery: MaybeRef<string>,
  options?: Partial<UseQueryOptions<PaginatedResponse<Matter>, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.search(searchQuery),
    queryFn: async (): Promise<PaginatedResponse<Matter>> => {
      const query = unref(searchQuery)
      
      if (!query || query.trim().length < 2) {
        return {
          data: [],
          total: 0,
          page: 0,
          limit: 20,
          hasNext: false,
          hasPrev: false
        }
      }
      
      return await $fetch<PaginatedResponse<Matter>>(`/api/matters/search`, {
        query: { q: query.trim(), limit: 10 }
      })
    },
    enabled: computed(() => {
      const query = unref(searchQuery)
      return query && query.trim().length >= 2
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    placeholderData: {
      data: [],
      total: 0,
      page: 0,
      limit: 10,
      hasNext: false,
      hasPrev: false
    },
    ...options
  })
}

/**
 * Search suggestions query with autocomplete support
 */
export function useSearchSuggestionsQuery(
  searchQuery: MaybeRef<string>,
  options?: Partial<UseQueryOptions<SearchSuggestion[], QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.suggestions(searchQuery),
    queryFn: async (): Promise<SearchSuggestion[]> => {
      const query = unref(searchQuery)
      
      if (!query || query.trim().length < 1) {
        return []
      }
      
      return await $fetch<SearchSuggestion[]>(`/api/matters/suggestions`, {
        query: { q: query.trim(), limit: 8 }
      })
    },
    enabled: computed(() => {
      const query = unref(searchQuery)
      return query && query.trim().length >= 1
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes for suggestions
    placeholderData: [],
    ...options
  })
}

// ============================================================================
// FILTER STATE MANAGEMENT
// ============================================================================

/**
 * Reactive filter state with URL synchronization
 */
export function useFilterState(initialFilters?: MatterFilters) {
  const route = useRoute()
  const router = useRouter()
  
  // Initialize filters from URL query parameters
  const filters = ref<MatterFilters>({
    search: route.query.search as string || '',
    status: route.query.status as string || '',
    priority: route.query.priority as string || '',
    assigneeId: route.query.assigneeId as string || '',
    clientId: route.query.clientId as string || '',
    dateFrom: route.query.dateFrom as string || '',
    dateTo: route.query.dateTo as string || '',
    tags: Array.isArray(route.query.tags) 
      ? route.query.tags as string[]
      : route.query.tags 
        ? [route.query.tags as string]
        : [],
    ...initialFilters
  })
  
  // Computed properties for filter state
  const hasActiveFilters = computed(() => {
    return Object.values(filters.value).some(value => {
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null && value !== ''
    })
  })
  
  const filterCount = computed(() => {
    let count = 0
    Object.values(filters.value).forEach(value => {
      if (Array.isArray(value)) {
        count += value.length
      } else if (value !== undefined && value !== null && value !== '') {
        count += 1
      }
    })
    return count
  })
  
  // Update URL when filters change
  const updateUrlFromFilters = (newFilters: MatterFilters) => {
    const query: Record<string, string | string[]> = {}
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          query[key] = value
        } else if (!Array.isArray(value)) {
          query[key] = value.toString()
        }
      }
    })
    
    router.replace({ query })
  }
  
  // Filter manipulation methods
  const updateFilter = (key: keyof MatterFilters, value: any) => {
    filters.value = { ...filters.value, [key]: value }
    updateUrlFromFilters(filters.value)
  }
  
  const resetFilters = () => {
    filters.value = {
      search: '',
      status: '',
      priority: '',
      assigneeId: '',
      clientId: '',
      dateFrom: '',
      dateTo: '',
      tags: []
    }
    updateUrlFromFilters(filters.value)
  }
  
  const addTag = (tag: string) => {
    if (!filters.value.tags?.includes(tag)) {
      filters.value.tags = [...(filters.value.tags || []), tag]
      updateUrlFromFilters(filters.value)
    }
  }
  
  const removeTag = (tag: string) => {
    filters.value.tags = filters.value.tags?.filter(t => t !== tag) || []
    updateUrlFromFilters(filters.value)
  }
  
  return {
    filters: readonly(filters),
    hasActiveFilters,
    filterCount,
    updateFilter,
    resetFilters,
    addTag,
    removeTag
  }
}

/**
 * Persisted filter preferences
 */
export function useFilterPreferences(userId: string) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.filterPreferences(userId),
    queryFn: async (): Promise<FilterState> => {
      return await $fetch<FilterState>(`/api/users/${userId}/filter-preferences`)
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: computed(() => !!userId)
  })
}

// ============================================================================
// STATISTICS AND AGGREGATION QUERIES
// ============================================================================

/**
 * Matter statistics with filtering support
 */
export function useMatterStatisticsQuery(
  filters?: MaybeRef<MatterFilters>,
  options?: Partial<UseQueryOptions<MatterStatistics, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.statistics(filters),
    queryFn: async (): Promise<MatterStatistics> => {
      const filterParams = unref(filters)
      const searchParams = new URLSearchParams()
      
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(key, v.toString()))
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }
      
      const queryString = searchParams.toString()
      return await $fetch<MatterStatistics>(
        `/api/matters/statistics${queryString ? `?${queryString}` : ''}`
      )
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

/**
 * Status counts for dashboard widgets
 */
export function useStatusCountsQuery(
  filters?: MaybeRef<MatterFilters>,
  options?: Partial<UseQueryOptions<Record<string, number>, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.statusCounts(filters),
    queryFn: async (): Promise<Record<string, number>> => {
      const filterParams = unref(filters)
      const searchParams = new URLSearchParams()
      
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(key, v.toString()))
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }
      
      const queryString = searchParams.toString()
      return await $fetch<Record<string, number>>(
        `/api/matters/status-counts${queryString ? `?${queryString}` : ''}`
      )
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  })
}

// ============================================================================
// SSR PREFETCH UTILITIES
// ============================================================================

/**
 * SSR prefetch utilities for matter queries
 */
export const matterPrefetchUtils = {
  /**
   * Prefetch matters list for SSR
   */
  async prefetchMatters(
    queryClient: any,
    filters?: MatterFilters,
    options?: { staleTime?: number }
  ) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.list(filters),
      queryFn: async () => {
        const { $fetch } = useNuxtApp()
        const searchParams = new URLSearchParams()
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v.toString()))
              } else {
                searchParams.append(key, value.toString())
              }
            }
          })
        }
        
        return await $fetch<PaginatedResponse<Matter>>(`/api/matters?${searchParams.toString()}`)
      },
      staleTime: options?.staleTime || 5 * 60 * 1000
    })
  },
  
  /**
   * Prefetch matter statistics for dashboard
   */
  async prefetchStatistics(
    queryClient: any,
    filters?: MatterFilters,
    options?: { staleTime?: number }
  ) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.statistics(filters),
      queryFn: async () => {
        const { $fetch } = useNuxtApp()
        const searchParams = new URLSearchParams()
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v.toString()))
              } else {
                searchParams.append(key, value.toString())
              }
            }
          })
        }
        
        const queryString = searchParams.toString()
        return await $fetch<MatterStatistics>(
          `/api/matters/statistics${queryString ? `?${queryString}` : ''}`
        )
      },
      staleTime: options?.staleTime || 5 * 60 * 1000
    })
  },
  
  /**
   * Prefetch infinite query first page
   */
  async prefetchInfiniteMatters(
    queryClient: any,
    filters?: MatterFilters,
    options?: { staleTime?: number }
  ) {
    await queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.infinite(filters),
      queryFn: async ({ pageParam = { page: 0, direction: 'next' } }) => {
        const { $fetch } = useNuxtApp()
        const searchParams = new URLSearchParams()
        
        searchParams.append('page', pageParam.page.toString())
        searchParams.append('direction', pageParam.direction)
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v.toString()))
              } else {
                searchParams.append(key, value.toString())
              }
            }
          })
        }
        
        return await $fetch<PaginatedResponse<Matter>>(`/api/matters?${searchParams.toString()}`)
      },
      initialPageParam: { page: 0, direction: 'next' as const },
      staleTime: options?.staleTime || 5 * 60 * 1000
    })
  }
}

// ============================================================================
// ADVANCED CACHING STRATEGIES
// ============================================================================

/**
 * Cache management utilities for matter queries
 */
export const matterCacheUtils = {
  /**
   * Invalidate all matter-related queries
   */
  invalidateAll(queryClient: any) {
    queryClient.invalidateQueries({ queryKey: ['matters'] })
  },
  
  /**
   * Invalidate specific filter combination
   */
  invalidateFiltered(queryClient: any, filters: MatterFilters) {
    queryClient.invalidateQueries({ queryKey: queryKeys.list(filters) })
  },
  
  /**
   * Invalidate search queries
   */
  invalidateSearch(queryClient: any, searchQuery?: string) {
    if (searchQuery) {
      queryClient.invalidateQueries({ queryKey: queryKeys.search(searchQuery) })
    } else {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey.includes('search') 
      })
    }
  },
  
  /**
   * Prefetch related queries when viewing a matter
   */
  async prefetchRelated(queryClient: any, matter: Matter) {
    // Prefetch matters with same status
    await this.prefetchMatters(queryClient, { status: matter.status })
    
    // Prefetch matters by same assignee
    if (matter.assigneeId) {
      await this.prefetchMatters(queryClient, { assigneeId: matter.assigneeId })
    }
    
    // Prefetch statistics
    await matterPrefetchUtils.prefetchStatistics(queryClient)
  }
}