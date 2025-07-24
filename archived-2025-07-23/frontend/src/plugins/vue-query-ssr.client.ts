/**
 * TanStack Query SSR Hydration Configuration - Client Side
 * 
 * @description Client-side hydration setup for advanced queries
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

import { hydrate } from '@tanstack/vue-query'
import type { DehydratedState } from '@tanstack/vue-query'
import { useState } from '#imports'

export default defineNuxtPlugin(async (nuxtApp: ReturnType<typeof useNuxtApp>) => {
  // Get the query client from the existing plugin
  const { vueApp } = nuxtApp
  const queryClient = vueApp.config.globalProperties.$queryClient

  if (!queryClient) {
    console.warn('QueryClient not found for SSR hydration')
    return
  }

  // Get dehydrated state from server
  const vueQueryState = useState<DehydratedState | null>('vue-query-state')

  // Client-side: Hydrate state when app is created
  if (process.client && vueQueryState.value) {
    nuxtApp.hooks.hook('app:created', () => {
      try {
        hydrate(queryClient, vueQueryState.value!)
        
        // Log hydrated queries for debugging
        if (process.env.NODE_ENV === 'development') {
          const queryCount = vueQueryState.value?.queries?.length || 0
          console.log(`[Hydration] Hydrated ${queryCount} queries from SSR`)
        }
        
        // Clear the state after hydration to free memory
        vueQueryState.value = null
      } catch (error) {
        console.error('[Hydration] Failed to hydrate query state:', error)
        // Don't throw - continue with fresh state
      }
    })
  }
})