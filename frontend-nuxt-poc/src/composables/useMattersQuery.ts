/**
 * Sample TanStack Query Composable for Testing
 * 
 * @description Example implementation of TanStack Query with SSR support
 * for testing the integration. This will be expanded in future tasks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Matter } from '~/types/matter'
import { queryKeys } from '~/types/query'

/**
 * Example query for fetching matters list
 */
export const useMattersQuery = () => {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.lists(),
    queryFn: async () => {
      // Using Nuxt's $fetch for SSR compatibility
      const response = await $fetch<Matter[]>('/api/matters', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Example query for fetching a single matter
 */
export const useMatterQuery = (id: MaybeRef<string>) => {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: async () => {
      const response = await $fetch<Matter>(`/api/matters/${unref(id)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      return response
    },
    enabled: computed(() => !!unref(id)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Example mutation for updating matter status
 */
export const useUpdateMatterStatus = () => {
  const { $fetch } = useNuxtApp()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await $fetch<Matter>(`/api/matters/${id}`, {
        method: 'PATCH',
        body: { status },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response
    },
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(queryKeys.detail(data.id), data)
      
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to update matter status:', error)
    }
  })
}