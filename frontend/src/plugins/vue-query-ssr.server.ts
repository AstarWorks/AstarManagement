/**
 * TanStack Query SSR Hydration Configuration
 * 
 * @description Server-side hydration setup for advanced queries
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

import { dehydrate } from '@tanstack/vue-query'
import type { DehydratedState } from '@tanstack/vue-query'
import { useState } from '#imports'

export default defineNuxtPlugin(async (nuxtApp: any) => {
  // Get the query client from the existing plugin
  const { vueApp } = nuxtApp
  const queryClient = vueApp.config.globalProperties.$queryClient

  if (!queryClient) {
    console.warn('QueryClient not found for SSR hydration')
    return
  }

  // Create state holder for hydration
  const vueQueryState = useState<DehydratedState | null>('vue-query-state', () => null)

  // Server-side: Dehydrate state after rendering
  if (process.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      try {
        const dehydratedState = dehydrate(queryClient, {
          shouldDehydrateQuery: (query) => {
            // Only dehydrate successful queries
            return query.state.status === 'success'
          },
          shouldDehydrateMutation: () => false // Don't dehydrate mutations
        })
        
        vueQueryState.value = dehydratedState
        
        // Log dehydrated queries for debugging
        if (process.env.NODE_ENV === 'development') {
          const queryCount = dehydratedState.queries?.length || 0
          console.log(`[SSR] Dehydrated ${queryCount} queries for hydration`)
        }
      } catch (error) {
        console.error('[SSR] Failed to dehydrate query state:', error)
        vueQueryState.value = null
      }
    })
  }
})