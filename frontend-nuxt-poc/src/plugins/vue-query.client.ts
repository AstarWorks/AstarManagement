/**
 * TanStack Query Client Plugin for Nuxt 3
 * 
 * @description Initializes Vue Query with SSR support, hydration, and proper
 * configuration for the legal case management domain. Handles both server-side
 * rendering and client-side hydration seamlessly.
 */

import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query'
import { 
  VueQueryPlugin, 
  QueryClient, 
  hydrate, 
  dehydrate 
} from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  // Create a state for SSR hydration
  const vueQueryState = useState<DehydratedState | null>('vue-query')
  
  // Create QueryClient with legal domain-optimized defaults
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Legal case data changes infrequently, so we can cache longer
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        
        // Disable automatic refetching for better control
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        
        // Retry configuration for legal operations
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network mode for offline support
        networkMode: 'online',
      },
      mutations: {
        // Legal operations should provide immediate feedback
        retry: 1,
        retryDelay: 1000,
        
        // Network mode for mutations
        networkMode: 'online',
      }
    }
  })
  
  const options: VueQueryPluginOptions = { queryClient }
  
  // Register Vue Query plugin
  nuxtApp.vueApp.use(VueQueryPlugin, options)
  
  // Handle SSR hydration
  if (process.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }
  
  if (process.client) {
    nuxtApp.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value)
    })
  }
  
  // Provide query client for direct access if needed
  return {
    provide: {
      queryClient
    }
  }
})