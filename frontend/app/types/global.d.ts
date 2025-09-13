/**
 * Global type definitions for Nuxt 3 application
 * 
 * This file extends the global Window interface to include Nuxt-specific properties
 * following Nuxt 3 and TypeScript best practices.
 */

declare global {
  interface Window {
    /**
     * Nuxt application instance
     * Available in client-side context
     */
    $nuxt?: {
      /**
       * Nuxt runtime configuration
       */
      $config: {
        /**
         * Public runtime configuration
         * Accessible on both client and server
         */
        public: {
          /**
           * API mode configuration
           * 'mock' | 'api'
           */
          apiMode: string
          /**
           * Base URL for API endpoints
           */
          baseUrl?: string
          /**
           * Additional runtime configuration
           * Allows string, number, boolean, or undefined values
           */
          [key: string]: string | number | boolean | undefined
        }
      }
    }
  }
}

// Make this file a module
export {}