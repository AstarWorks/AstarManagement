/**
 * Global Type Declarations
 * 
 * @description Global type extensions for window object and other globals
 * used throughout the application.
 */

import type { QueryClient } from '@tanstack/vue-query'
import type { QueryKeys } from './query'

declare global {
  interface Window {
    $nuxt?: {
      $serviceWorker?: {
        isUpdateAvailable: {
          value: boolean
        }
      }
      $toast?: {
        info: (title: string, message: string, options?: any) => void
        success: (title: string, message: string) => void
        warning: (title: string, message: string) => void
        error: (title: string, message: string) => void
      }
    }
    __QUERY_CLIENT__?: QueryClient
  }
}

/**
 * Vue component augmentations
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $queryClient: QueryClient
    $queryKeys: QueryKeys
  }
}

/**
 * Nuxt app augmentations
 */
declare module '#app' {
  interface NuxtApp {
    $queryClient: QueryClient
    $queryKeys: QueryKeys
  }
}

export {}