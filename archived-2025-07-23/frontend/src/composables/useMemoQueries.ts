// TanStack Query composables for memo data management - T04_S13

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import type { 
  Memo, 
  MemoFilters, 
  BulkOperation, 
  PaginatedMemoResponse,
  MemoExportOptions,
  MemoSearchSuggestion
} from '~/types/memo'

// Main memos query with filtering and pagination
export function useMemosQuery(
  filters?: MaybeRef<MemoFilters>,
  options: { enabled?: MaybeRef<boolean> } = {}
) {
  return useQuery({
    queryKey: ['memos', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      const filterValues = unref(filters)
      
      if (filterValues) {
        // Add filter parameters
        if (filterValues.search) params.append('search', filterValues.search)
        if (filterValues.status?.length) {
          filterValues.status.forEach(status => params.append('status', status))
        }
        if (filterValues.priority?.length) {
          filterValues.priority.forEach(priority => params.append('priority', priority))
        }
        if (filterValues.recipient?.length) {
          filterValues.recipient.forEach(recipient => params.append('recipient', recipient))
        }
        if (filterValues.recipientType?.length) {
          filterValues.recipientType.forEach(type => params.append('recipientType', type))
        }
        if (filterValues.tags?.length) {
          filterValues.tags.forEach(tag => params.append('tag', tag))
        }
        if (filterValues.dateFrom) {
          params.append('dateFrom', filterValues.dateFrom.toISOString())
        }
        if (filterValues.dateTo) {
          params.append('dateTo', filterValues.dateTo.toISOString())
        }
        if (filterValues.caseId) params.append('caseId', filterValues.caseId)
        if (filterValues.createdBy) params.append('createdBy', filterValues.createdBy)
        if (filterValues.hasAttachments !== undefined) {
          params.append('hasAttachments', filterValues.hasAttachments.toString())
        }
        if (filterValues.sort) params.append('sort', filterValues.sort)
        if (filterValues.order) params.append('order', filterValues.order)
      }
      
      const response = await $fetch<PaginatedMemoResponse>(`/api/memos?${params}`)
      return response
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: options.enabled
  })
}

// Infinite query for memo list with pagination
export function useMemosInfiniteQuery(
  filters?: MaybeRef<MemoFilters>,
  options: { enabled?: MaybeRef<boolean> } = {}
) {
  return useInfiniteQuery({
    queryKey: ['memos', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      const filterValues = unref(filters)
      
      params.append('page', pageParam.toString())
      params.append('pageSize', '20')
      
      if (filterValues) {
        // Add same filter logic as above
        if (filterValues.search) params.append('search', filterValues.search)
        if (filterValues.status?.length) {
          filterValues.status.forEach(status => params.append('status', status))
        }
        // ... other filters
      }
      
      const response = await $fetch<PaginatedMemoResponse>(`/api/memos?${params}`)
      return response
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 30000,
    enabled: options.enabled
  })
}

// Single memo query
export function useMemoQuery(memoId: MaybeRef<string>) {
  return useQuery({
    queryKey: ['memo', memoId],
    queryFn: async () => {
      const id = unref(memoId)
      if (!id) throw new Error('Memo ID is required')
      
      const response = await $fetch<Memo>(`/api/memos/${id}`)
      return response
    },
    enabled: computed(() => !!unref(memoId)),
    staleTime: 60000 // 1 minute
  })
}

// Search suggestions query
export function useMemoSearchSuggestionsQuery(
  query: MaybeRef<string>,
  options: { enabled?: MaybeRef<boolean> } = {}
) {
  return useQuery({
    queryKey: ['memo-search-suggestions', query],
    queryFn: async () => {
      const searchQuery = unref(query)
      if (!searchQuery || searchQuery.length < 2) return []
      
      const params = new URLSearchParams({ q: searchQuery })
      const response = await $fetch<MemoSearchSuggestion[]>(`/api/memos/search/suggestions?${params}`)
      return response
    },
    enabled: computed(() => {
      const searchQuery = unref(query)
      const baseEnabled = unref(options.enabled) !== false
      return baseEnabled && !!searchQuery && searchQuery.length >= 2
    }),
    staleTime: 300000, // 5 minutes
    gcTime: 600000 // 10 minutes
  })
}

// Memo counts query for filter badges
export function useMemoCountsQuery() {
  return useQuery({
    queryKey: ['memo-counts'],
    queryFn: async () => {
      const response = await $fetch<Record<string, number>>('/api/memos/counts')
      return response
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000 // 5 minutes
  })
}

// Create memo mutation
export function useCreateMemoMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (memo: Partial<Memo>) => {
      const response = await $fetch<Memo>('/api/memos', {
        method: 'POST',
        body: memo
      })
      return response
    },
    onSuccess: (newMemo) => {
      // Update memo list cache
      queryClient.setQueryData(['memos'], (old: PaginatedMemoResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: [newMemo, ...old.data],
          total: old.total + 1
        }
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['memos'] })
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] })
    }
  })
}

// Update memo mutation
export function useUpdateMemoMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Memo> }) => {
      const response = await $fetch<Memo>(`/api/memos/${id}`, {
        method: 'PATCH',
        body: updates
      })
      return response
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['memo', id] })
      
      // Snapshot previous value
      const previousMemo = queryClient.getQueryData(['memo', id])
      
      // Optimistically update
      queryClient.setQueryData(['memo', id], (old: Memo | undefined) => {
        if (!old) return old
        return { ...old, ...updates }
      })
      
      return { previousMemo }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousMemo) {
        queryClient.setQueryData(['memo', id], context.previousMemo)
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['memo', id] })
      queryClient.invalidateQueries({ queryKey: ['memos'] })
    }
  })
}

// Delete memo mutation
export function useDeleteMemoMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (memoId: string) => {
      await $fetch(`/api/memos/${memoId}`, {
        method: 'DELETE'
      })
      return memoId
    },
    onSuccess: (deletedId) => {
      // Remove from memo list cache
      queryClient.setQueryData(['memos'], (old: PaginatedMemoResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter(memo => memo.id !== deletedId),
          total: old.total - 1
        }
      })
      
      // Remove individual memo cache
      queryClient.removeQueries({ queryKey: ['memo', deletedId] })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['memos'] })
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] })
    }
  })
}

// Bulk operations mutation
export function useBulkMemoMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (operation: BulkOperation) => {
      const response = await $fetch('/api/memos/bulk', {
        method: 'POST',
        body: operation
      })
      return response
    },
    onSuccess: (result, operation) => {
      // Invalidate all memo-related queries after bulk operations
      queryClient.invalidateQueries({ queryKey: ['memos'] })
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] })
      
      // Remove individual memo caches if deleted
      if (operation.type === 'delete') {
        operation.memoIds.forEach(id => {
          queryClient.removeQueries({ queryKey: ['memo', id] })
        })
      }
    }
  })
}

// Export memos mutation
export function useExportMemoMutation() {
  return useMutation({
    mutationFn: async (options: MemoExportOptions) => {
      const response = await $fetch('/api/memos/export', {
        method: 'POST',
        body: options
      })
      return response
    }
  })
}