/**
 * Global Error Handler Plugin
 * 
 * @description Provides centralized error handling and reporting functionality.
 * This is the Vue/Nuxt equivalent of the React ErrorBoundary and ErrorToastProvider.
 */

interface NuxtAppWithToast {
  vueApp: {
    config: {
      errorHandler?: (error: unknown, instance: unknown, info: string) => void
    }
  }
  $toast?: {
    error: (title: string, message: string) => void
  }
  $handleError?: (error: unknown, context?: string) => void
}

export default defineNuxtPlugin((nuxtApp: NuxtAppWithToast) => {
  // Handle Vue errors
  nuxtApp.vueApp.config.errorHandler = (error: unknown, instance: unknown, info: string) => {
    console.error('Vue Error:', error)
    console.error('Error Info:', info)
    
    // Get toast plugin if available (client-side only)
    if (process.client && nuxtApp.$toast) {
      nuxtApp.$toast.error(
        'Application Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
    }
  }
  
  // Handle unhandled promise rejections
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection:', event.reason)
      
      if ((nuxtApp as any).$toast) {
        (nuxtApp as any).$toast.error(
          'Unhandled Error',
          event.reason?.message || 'An unexpected error occurred'
        )
      }
      
      // Prevent the default browser behavior
      event.preventDefault()
    })
  }
  
  // Provide error handling utilities
  return {
    provide: {
      handleError: (error: unknown, context?: string) => {
        console.error(context ? `Error in ${context}:` : 'Error:', error)
        
        if (process.client && (nuxtApp as any).$toast) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
          ;(nuxtApp as any).$toast.error(
            context || 'Error',
            errorMessage
          )
        }
        
        // Re-throw in development for debugging
        if (process.env.NODE_ENV === 'development') {
          throw error
        }
      },
      
      // Async error wrapper
      wrapAsync: <T extends (...args: never[]) => Promise<unknown>>(
        fn: T,
        context?: string
      ): T => {
        return (async (...args) => {
          try {
            return await fn(...args)
          } catch (error) {
            nuxtApp.$handleError?.(error, context)
            throw error
          }
        }) as T
      }
    }
  }
})

// Type declarations
// declare module '#app' {
//   interface NuxtApp {
//     $handleError: (error: unknown, context?: string) => void
//     $wrapAsync: <T extends (...args: never[]) => Promise<unknown>>(
//       fn: T,
//       context?: string
//     ) => T
//   }
// }

declare module 'vue' {
  interface ComponentCustomProperties {
    $handleError: (error: unknown, context?: string) => void
    $wrapAsync: <T extends (...args: never[]) => Promise<unknown>>(
      fn: T,
      context?: string
    ) => T
  }
}