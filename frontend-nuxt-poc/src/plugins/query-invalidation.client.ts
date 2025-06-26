/**
 * Nuxt plugin to set up query invalidation system
 * This plugin integrates the invalidation configuration with TanStack Query
 */

import { createInvalidationExecutor } from '~/config/query-invalidation'
import type { InvalidationExecutor } from '~/config/query-invalidation'

declare module '#app' {
  interface NuxtApp {
    $queryInvalidator: InvalidationExecutor
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $queryInvalidator: InvalidationExecutor
  }
}

export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient()
  const invalidator = createInvalidationExecutor(queryClient)
  
  // Set up global error handler for failed invalidations
  const originalExecute = invalidator.execute.bind(invalidator)
  invalidator.execute = async (...args) => {
    try {
      await originalExecute(...args)
    } catch (error) {
      console.error('[Query Invalidation Error]', error)
      // Could send to error tracking service
    }
  }
  
  // Listen for global mutation events (if using a global event bus)
  if (process.client) {
    const handleMutationSuccess = (event: CustomEvent) => {
      const { type, data } = event.detail
      invalidator.execute(type, data).catch(console.error)
    }
    
    window.addEventListener('mutation:success', handleMutationSuccess as EventListener)
    
    // Clean up on app unmount
    const nuxtApp = useNuxtApp()
    nuxtApp.hook('app:unmounted', () => {
      window.removeEventListener('mutation:success', handleMutationSuccess as EventListener)
    })
  }
  
  return {
    provide: {
      queryInvalidator: invalidator,
    },
  }
})