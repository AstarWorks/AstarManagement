/**
 * Global Error Handler Plugin
 * 
 * @description Provides centralized error handling and reporting functionality.
 * This is the Vue/Nuxt equivalent of the React ErrorBoundary and ErrorToastProvider.
 */

import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  // Handle Vue errors
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
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
      
      if (nuxtApp.$toast) {
        nuxtApp.$toast.error(
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
        
        if (process.client && nuxtApp.$toast) {
          const message = error instanceof Error ? error.message : 'An unexpected error occurred'
          nuxtApp.$toast.error(
            context || 'Error',
            message
          )
        }
        
        // Re-throw in development for debugging
        if (process.env.NODE_ENV === 'development') {
          throw error
        }
      },
      
      // Async error wrapper
      wrapAsync: <T extends (...args: any[]) => Promise<any>>(
        fn: T,
        context?: string
      ): T => {
        return (async (...args) => {
          try {
            return await fn(...args)
          } catch (error) {
            nuxtApp.$handleError(error, context)
            throw error
          }
        }) as T
      }
    }
  }
})

// Type declarations
declare module '#app' {
  interface NuxtApp {
    $handleError: (error: unknown, context?: string) => void
    $wrapAsync: <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      context?: string
    ) => T
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $handleError: (error: unknown, context?: string) => void
    $wrapAsync: <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      context?: string
    ) => T
  }
}