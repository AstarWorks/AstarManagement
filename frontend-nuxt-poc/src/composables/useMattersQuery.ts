/**
 * TanStack Query Composables for Matter Management
 * 
 * @description Core query and mutation hooks for legal matter CRUD operations
 * using TanStack Query. Provides type-safe, optimized data fetching with
 * proper cache management and error handling.
 * 
 * @author Claude
 * @created 2025-06-25
 * @updated 2025-06-25 (T03_S08 - Core Queries Setup)
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/vue-query'
import { unref, computed, type MaybeRef } from 'vue'
import type { 
  Matter, 
  MatterFilters, 
  PaginatedResponse,
  CreateMatterInput,
  UpdateMatterInput,
  MoveMatterInput,
  QueryError
} from '~/types/query'
import { queryKeys } from '~/types/query'
import { QUERY_CONFIGS } from '~/config/tanstack-query'

/**
 * Hook for fetching a paginated list of matters
 * 
 * @param filters - Optional filters to apply to the query
 * @param options - Additional query options
 * @returns TanStack Query result with matters list
 */
export function useMattersQuery(
  filters?: MaybeRef<MatterFilters>,
  options?: Partial<UseQueryOptions<PaginatedResponse<Matter>, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Matter>> => {
      const filterParams = unref(filters)
      const searchParams = new URLSearchParams()
      
      // Build query parameters from filters
      if (filterParams) {
        if (filterParams.status?.length) {
          filterParams.status.forEach(status => searchParams.append('status', status))
        }
        if (filterParams.priority?.length) {
          filterParams.priority.forEach(priority => searchParams.append('priority', priority))
        }
        if (filterParams.assignedLawyer) {
          searchParams.append('assignedLawyer', filterParams.assignedLawyer)
        }
        if (filterParams.clientId) {
          searchParams.append('clientId', filterParams.clientId)
        }
        if (filterParams.search) {
          searchParams.append('search', filterParams.search)
        }
        if (filterParams.dateFrom) {
          searchParams.append('dateFrom', filterParams.dateFrom.toISOString())
        }
        if (filterParams.dateTo) {
          searchParams.append('dateTo', filterParams.dateTo.toISOString())
        }
        if (filterParams.tags?.length) {
          filterParams.tags.forEach(tag => searchParams.append('tags', tag))
        }
        if (filterParams.sort) {
          searchParams.append('sort', filterParams.sort)
          searchParams.append('order', filterParams.order || 'desc')
        }
      }
      
      const queryString = searchParams.toString()
      const url = `/api/matters${queryString ? `?${queryString}` : ''}`
      
      return await $fetch<PaginatedResponse<Matter>>(url)
    },
    ...QUERY_CONFIGS.matters,
    ...options
  })
}

/**
 * Hook for fetching a single matter by ID
 * 
 * @param id - Matter ID to fetch
 * @param options - Additional query options
 * @returns TanStack Query result with single matter
 */
export function useMatterQuery(
  id: MaybeRef<string>,
  options?: Partial<UseQueryOptions<Matter, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: async (): Promise<Matter> => {
      const matterId = unref(id)
      return await $fetch<Matter>(`/api/matters/${matterId}`)
    },
    enabled: computed(() => !!unref(id)),
    ...QUERY_CONFIGS.matters,
    ...options
  })
}

/**
 * Hook for fetching matters assigned to a specific lawyer
 * 
 * @param lawyerId - Lawyer ID to filter by
 * @param options - Additional query options
 * @returns TanStack Query result with assigned matters
 */
export function useAssignedMattersQuery(
  lawyerId: MaybeRef<string>,
  options?: Partial<UseQueryOptions<Matter[], QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.assignedMatters(lawyerId),
    queryFn: async (): Promise<Matter[]> => {
      const assigneeId = unref(lawyerId)
      return await $fetch<Matter[]>(`/api/matters/assigned/${assigneeId}`)
    },
    enabled: computed(() => !!unref(lawyerId)),
    ...QUERY_CONFIGS.matters,
    ...options
  })
}

/**
 * Hook for searching matters with full-text search
 * 
 * @param searchQuery - Search query string
 * @param options - Additional query options
 * @returns TanStack Query result with search results
 */
export function useMatterSearchQuery(
  searchQuery: MaybeRef<string>,
  options?: Partial<UseQueryOptions<Matter[], QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.search(searchQuery),
    queryFn: async (): Promise<Matter[]> => {
      const query = unref(searchQuery)
      return await $fetch<Matter[]>(`/api/matters/search?q=${encodeURIComponent(query)}`)
    },
    enabled: computed(() => {
      const query = unref(searchQuery)
      return !!(query && query.trim().length >= 2)
    }),
    ...QUERY_CONFIGS.search,
    ...options
  })
}

/**
 * Hook for fetching matter statistics and counts
 * 
 * @param options - Additional query options
 * @returns TanStack Query result with statistics
 */
export function useMatterStatisticsQuery(
  options?: Partial<UseQueryOptions<any, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.statistics(),
    queryFn: async () => {
      return await $fetch('/api/matters/statistics')
    },
    ...QUERY_CONFIGS.static,
    ...options
  })
}

/**
 * Hook for fetching status counts for Kanban columns
 * 
 * @param options - Additional query options
 * @returns TanStack Query result with status counts
 */
export function useStatusCountsQuery(
  options?: Partial<UseQueryOptions<Record<string, number>, QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.statusCounts(),
    queryFn: async (): Promise<Record<string, number>> => {
      return await $fetch<Record<string, number>>('/api/matters/status-counts')
    },
    ...QUERY_CONFIGS.realtime,
    refetchInterval: 60000, // Refresh every minute for real-time updates
    ...options
  })
}

/**
 * Hook for creating a new matter
 * 
 * @param options - Mutation options including callbacks
 * @returns TanStack Mutation result for creating matters
 */
export function useCreateMatterMutation(
  options?: UseMutationOptions<Matter, QueryError, CreateMatterInput>
) {
  const { $fetch } = useNuxtApp()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateMatterInput): Promise<Matter> => {
      return await $fetch<Matter>('/api/matters', {
        method: 'POST',
        body: input
      })
    },
    
    // Optimistic update
    onMutate: async (newMatter) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
      
      // Snapshot the previous value
      const previousMatters = queryClient.getQueryData(queryKeys.lists())
      
      // Optimistically update to the new value
      queryClient.setQueryData<PaginatedResponse<Matter>>(
        queryKeys.lists(), 
        (old) => {
          if (!old) return old
          
          const optimisticMatter: Matter = {
            // Generate temporary ID for optimistic update
            id: `temp-${Date.now()}`,
            caseNumber: `TEMP-${Date.now()}`,
            title: newMatter.title,
            description: newMatter.description || '',
            clientName: 'New Client', // Will be updated after API response
            status: newMatter.status || 'draft',
            priority: newMatter.priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedLawyer: newMatter.assignedLawyer,
            dueDate: newMatter.dueDate?.toISOString(),
            tags: newMatter.tags || []
          }
          
          return {
            ...old,
            data: [optimisticMatter, ...old.data],
            total: old.total + 1
          }
        }
      )
      
      return { previousMatters }
    },
    
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newMatter, context) => {
      if (context?.previousMatters) {
        queryClient.setQueryData(queryKeys.lists(), context.previousMatters)
      }
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics() })
    },
    
    ...options
  })
}

/**
 * Hook for updating an existing matter
 * 
 * @param options - Mutation options including callbacks
 * @returns TanStack Mutation result for updating matters
 */
export function useUpdateMatterMutation(
  options?: UseMutationOptions<Matter, QueryError, { id: string; data: UpdateMatterInput }>
) {
  const { $fetch } = useNuxtApp()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMatterInput }): Promise<Matter> => {
      return await $fetch<Matter>(`/api/matters/${id}`, {
        method: 'PATCH',
        body: data
      })
    },
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
      
      // Snapshot the previous values
      const previousMatter = queryClient.getQueryData(queryKeys.detail(id))
      const previousMatters = queryClient.getQueryData(queryKeys.lists())
      
      // Optimistically update the single matter
      queryClient.setQueryData<Matter>(queryKeys.detail(id), (old) => {
        if (!old) return old
        return {
          ...old,
          ...data,
          updatedAt: new Date().toISOString()
        }
      })
      
      // Optimistically update the matters list
      queryClient.setQueryData<PaginatedResponse<Matter>>(
        queryKeys.lists(),
        (old) => {
          if (!old) return old
          
          return {
            ...old,
            data: old.data.map(matter => 
              matter.id === id 
                ? { ...matter, ...data, updatedAt: new Date().toISOString() }
                : matter
            )
          }
        }
      )
      
      return { previousMatter, previousMatters }
    },
    
    // If the mutation fails, use the context to roll back
    onError: (err, { id }, context) => {
      if (context?.previousMatter) {
        queryClient.setQueryData(queryKeys.detail(id), context.previousMatter)
      }
      if (context?.previousMatters) {
        queryClient.setQueryData(queryKeys.lists(), context.previousMatters)
      }
    },
    
    // Always refetch after error or success
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics() })
    },
    
    ...options
  })
}

/**
 * Hook for moving a matter to a different status (drag and drop)
 * 
 * @param options - Mutation options including callbacks
 * @returns TanStack Mutation result for moving matters
 */
export function useMoveMatterMutation(
  options?: UseMutationOptions<Matter, QueryError, MoveMatterInput>
) {
  const { $fetch } = useNuxtApp()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: MoveMatterInput): Promise<Matter> => {
      return await $fetch<Matter>(`/api/matters/${input.matterId}/move`, {
        method: 'PATCH',
        body: {
          status: input.newStatus,
          position: input.newPosition
        }
      })
    },
    
    // Optimistic update for drag and drop
    onMutate: async ({ matterId, newStatus }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.detail(matterId) })
      
      // Snapshot the previous values
      const previousMatters = queryClient.getQueryData(queryKeys.lists())
      const previousMatter = queryClient.getQueryData(queryKeys.detail(matterId))
      
      // Optimistically update the matter status
      queryClient.setQueryData<Matter>(queryKeys.detail(matterId), (old) => {
        if (!old) return old
        return {
          ...old,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      })
      
      // Optimistically update the matters list
      queryClient.setQueryData<PaginatedResponse<Matter>>(
        queryKeys.lists(),
        (old) => {
          if (!old) return old
          
          return {
            ...old,
            data: old.data.map(matter => 
              matter.id === matterId 
                ? { ...matter, status: newStatus, updatedAt: new Date().toISOString() }
                : matter
            )
          }
        }
      )
      
      return { previousMatters, previousMatter }
    },
    
    // If the mutation fails, use the context to roll back
    onError: (err, { matterId }, context) => {
      if (context?.previousMatter) {
        queryClient.setQueryData(queryKeys.detail(matterId), context.previousMatter)
      }
      if (context?.previousMatters) {
        queryClient.setQueryData(queryKeys.lists(), context.previousMatters)
      }
    },
    
    // Always refetch after error or success
    onSettled: (data, error, { matterId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(matterId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.statusCounts() })
    },
    
    ...options
  })
}

/**
 * Hook for deleting a matter
 * 
 * @param options - Mutation options including callbacks
 * @returns TanStack Mutation result for deleting matters
 */
export function useDeleteMatterMutation(
  options?: UseMutationOptions<void, QueryError, string>
) {
  const { $fetch } = useNuxtApp()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await $fetch(`/api/matters/${id}`, {
        method: 'DELETE'
      })
    },
    
    // Optimistic update
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
      
      // Snapshot the previous value
      const previousMatters = queryClient.getQueryData(queryKeys.lists())
      
      // Optimistically remove from the list
      queryClient.setQueryData<PaginatedResponse<Matter>>(
        queryKeys.lists(),
        (old) => {
          if (!old) return old
          
          return {
            ...old,
            data: old.data.filter(matter => matter.id !== id),
            total: old.total - 1
          }
        }
      )
      
      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: queryKeys.detail(id) })
      
      return { previousMatters }
    },
    
    // If the mutation fails, use the context to roll back
    onError: (err, id, context) => {
      if (context?.previousMatters) {
        queryClient.setQueryData(queryKeys.lists(), context.previousMatters)
      }
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics() })
    },
    
    ...options
  })
}

/**
 * Utility function to invalidate all matter-related queries
 * Useful for forcing a complete refresh of all matter data
 */
export function useInvalidateAllMatters() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.all })
  }
}

/**
 * Utility function to prefetch a matter by ID
 * Useful for improving perceived performance when user is likely to view a matter
 */
export function usePrefetchMatter() {
  const queryClient = useQueryClient()
  const { $fetch } = useNuxtApp()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.detail(id),
      queryFn: () => $fetch<Matter>(`/api/matters/${id}`),
      ...QUERY_CONFIGS.matters
    })
  }
}

// Backward compatibility exports (legacy API from T01_S08)
export const useUpdateMatterStatus = useMoveMatterMutation