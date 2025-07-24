/**
 * Matter Management Composables
 * 
 * @description Composables for managing legal matters including CRUD operations,
 * search, filtering, and state management.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T12_S12 - Matter Management UI
 */

import { computed, unref, type MaybeRef } from 'vue'
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery 
} from '@tanstack/vue-query'
import type {
  Matter,
  MatterFilters,
  MatterListParams,
  MatterListResponse,
  CreateMatterInput,
  UpdateMatterInput
} from '~/types/matter'

// Query Keys
export const matterQueryKeys = {
  all: ['matters'] as const,
  lists: () => [...matterQueryKeys.all, 'list'] as const,
  list: (params: MatterListParams) => [...matterQueryKeys.lists(), params] as const,
  details: () => [...matterQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...matterQueryKeys.details(), id] as const,
  search: (query: string) => [...matterQueryKeys.all, 'search', query] as const,
  statistics: () => [...matterQueryKeys.all, 'statistics'] as const
}

// Basic Matters Query
export function useMattersQuery(params: MaybeRef<MatterListParams>) {
  return useQuery({
    queryKey: computed(() => matterQueryKeys.list(unref(params))),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      const currentParams = unref(params)
      
      // Add pagination
      if (currentParams.page) searchParams.set('page', currentParams.page.toString())
      if (currentParams.limit) searchParams.set('limit', currentParams.limit.toString())
      
      // Add sorting
      if (currentParams.sortBy) searchParams.set('sortBy', currentParams.sortBy)
      if (currentParams.sortOrder) searchParams.set('sortOrder', currentParams.sortOrder)
      
      // Add filters
      if (currentParams.status?.length) {
        searchParams.set('status', currentParams.status.join(','))
      }
      if (currentParams.priority?.length) {
        searchParams.set('priority', currentParams.priority.join(','))
      }
      if (currentParams.assigneeId) {
        searchParams.set('assigneeId', currentParams.assigneeId)
      }
      if (currentParams.clientId) {
        searchParams.set('clientId', currentParams.clientId)
      }
      if (currentParams.searchQuery) {
        searchParams.set('search', currentParams.searchQuery)
      }
      if (currentParams.dateRange) {
        searchParams.set('startDate', currentParams.dateRange.start.toISOString())
        searchParams.set('endDate', currentParams.dateRange.end.toISOString())
      }
      
      const response = await $fetch<MatterListResponse>('/api/matters', {
        params: Object.fromEntries(searchParams)
      })
      
      return response
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  })
}

// Single Matter Query
export function useMatterQuery(id: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => matterQueryKeys.detail(unref(id))),
    queryFn: async () => {
      const response = await $fetch<{ data: Matter }>(`/api/matters/${unref(id)}`)
      return response.data
    },
    enabled: computed(() => !!unref(id)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

// Matter Search Query
export function useMatterSearchQuery(query: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => matterQueryKeys.search(unref(query))),
    queryFn: async () => {
      const searchQuery = unref(query)
      if (!searchQuery.trim()) return []
      
      const response = await $fetch<{ data: Matter[] }>('/api/matters/search', {
        params: { q: searchQuery }
      })
      return response.data
    },
    enabled: computed(() => !!unref(query)?.trim()),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000
  })
}

// Matter Statistics Query
export function useMatterStatisticsQuery() {
  return useQuery({
    queryKey: matterQueryKeys.statistics(),
    queryFn: async () => {
      const response = await $fetch<{ data: any }>('/api/matters/statistics')
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  })
}

// Matter Mutations
export function useMatterMutations() {
  const queryClient = useQueryClient()
  
  const createMatter = useMutation({
    mutationFn: async (matter: CreateMatterInput) => {
      const response = await $fetch<{ data: Matter }>('/api/matters', {
        method: 'POST',
        body: matter
      })
      return response.data
    },
    onSuccess: (newMatter) => {
      // Update matters list cache
      queryClient.setQueryData(
        matterQueryKeys.lists(),
        (old: MatterListResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: [newMatter, ...old.data],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1
            }
          }
        }
      )
      
      // Set individual matter cache
      queryClient.setQueryData(matterQueryKeys.detail(newMatter.id), newMatter)
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: matterQueryKeys.lists() })
    }
  })
  
  const updateMatter = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMatterInput }) => {
      const response = await $fetch<{ data: Matter }>(`/api/matters/${id}`, {
        method: 'PATCH',
        body: data
      })
      return response.data
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: matterQueryKeys.detail(id) })
      
      // Snapshot previous value
      const previousMatter = queryClient.getQueryData(matterQueryKeys.detail(id))
      
      // Optimistically update
      queryClient.setQueryData(matterQueryKeys.detail(id), (old: Matter | undefined) => {
        if (!old) return old
        return { ...old, ...data, updatedAt: new Date() }
      })
      
      return { previousMatter }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousMatter) {
        queryClient.setQueryData(matterQueryKeys.detail(id), context.previousMatter)
      }
    },
    onSuccess: (updatedMatter) => {
      // Update individual matter cache
      queryClient.setQueryData(matterQueryKeys.detail(updatedMatter.id), updatedMatter)
      
      // Update lists cache
      queryClient.setQueriesData(
        { queryKey: matterQueryKeys.lists() },
        (old: MatterListResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map(matter => 
              matter.id === updatedMatter.id ? updatedMatter : matter
            )
          }
        }
      )
    }
  })
  
  const deleteMatter = useMutation({
    mutationFn: async (id: string) => {
      await $fetch(`/api/matters/${id}`, {
        method: 'DELETE'
      })
      return id
    },
    onSuccess: (deletedId) => {
      // Remove from individual cache
      queryClient.removeQueries({ queryKey: matterQueryKeys.detail(deletedId) })
      
      // Update lists cache
      queryClient.setQueriesData(
        { queryKey: matterQueryKeys.lists() },
        (old: MatterListResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.filter(matter => matter.id !== deletedId),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1)
            }
          }
        }
      )
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: matterQueryKeys.lists() })
    }
  })
  
  return {
    createMatter,
    updateMatter,
    deleteMatter
  }
}

// Convenience Composable
export function useMatters(params: MaybeRef<MatterListParams>) {
  const query = useMattersQuery(params)
  const mutations = useMatterMutations()
  
  return {
    // Query data
    matters: computed(() => query.data.value?.data || []),
    pagination: computed(() => query.data.value?.pagination),
    summary: computed(() => query.data.value?.summary),
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    
    // Mutations
    createMatter: mutations.createMatter.mutateAsync,
    updateMatter: mutations.updateMatter.mutateAsync,
    deleteMatter: mutations.deleteMatter.mutateAsync,
    
    // Mutation states
    isCreating: mutations.createMatter.isPending,
    isUpdating: mutations.updateMatter.isPending,
    isDeleting: mutations.deleteMatter.isPending
  }
}

// Matter Search Composable
export function useMatterSearch(query: MaybeRef<string>) {
  const searchQuery = useMatterSearchQuery(query)
  
  return {
    results: computed(() => searchQuery.data.value || []),
    isSearching: searchQuery.isPending,
    searchError: searchQuery.error,
    refetchSearch: searchQuery.refetch
  }
}

// Single Matter Composable
export function useMatter(id: MaybeRef<string>) {
  const query = useMatterQuery(id)
  const mutations = useMatterMutations()
  
  return {
    matter: query.data,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    
    updateMatter: mutations.updateMatter.mutateAsync,
    deleteMatter: mutations.deleteMatter.mutateAsync,
    
    isUpdating: mutations.updateMatter.isPending,
    isDeleting: mutations.deleteMatter.isPending
  }
}