/**
 * useApiClient Composable
 * Factory function for creating and managing API client instances
 * Handles singleton pattern, HMR support, and environment switching
 */

import type {BaseApiClient} from '../core/BaseApiClient'
import type {IApiConfig} from '../types'
import {RealApiClient} from '../clients/RealApiClient'
import {MockApiClient} from '../clients/MockApiClient'

// Singleton instance storage
let clientInstance: BaseApiClient | null = null

/**
 * Get API configuration from runtime config and environment
 */
export const getApiConfig = (): IApiConfig => {
    const config = useRuntimeConfig()

    return {
        mode: (config.public.apiMode as 'mock' | 'real') || 'real',
        baseUrl: config.public.apiBaseUrl || 'http://localhost:8080/api/v1',
        timeout: Number(config.public.apiTimeout) || 30000,
        retryCount: Number(config.public.apiRetryCount) || 3,
        cacheEnabled: config.public.apiCacheEnabled !== 'false',
        mockDelay: Number(config.public.mockDelay) || 200,
        mockDelayVariance: Number(config.public.mockDelayVariance) || 100,
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

/**
 * Create or return existing API client instance
 * @param forceNew - Force creation of new instance (useful for testing)
 */
export const useApiClient = (forceNew = false): BaseApiClient => {
    // Return existing instance if available and not forcing new
    if (clientInstance && !forceNew) {
        return clientInstance
    }

    const apiConfig = getApiConfig()

    // Create appropriate client based on mode
    console.log(`[useApiClient] Creating ${apiConfig.mode} API client`)
    clientInstance = apiConfig.mode === 'mock'
        ? new MockApiClient(apiConfig)
        : new RealApiClient(apiConfig)

    // Set up Nuxt lifecycle hooks for cleanup
    if (import.meta.client) {
        const nuxtApp = useNuxtApp()

        // Clear instance on app unmount
        // @ts-expect-error - app:unmounted hook exists
        nuxtApp.hook('app:unmounted', () => {
            console.log('[useApiClient] Clearing client instance on unmount')
            clientInstance = null
        })

        // Clear instance on page reload/navigation
        nuxtApp.hook('app:beforeMount', () => {
            if (forceNew) {
                console.log('[useApiClient] Forcing new client instance')
                clientInstance = null
            }
        })
    }

    // HMR support for development
    if (import.meta.hot) {
        import.meta.hot.dispose(() => {
            console.log('[useApiClient] HMR: Disposing client instance')
            clientInstance = null
        })
    }

    return clientInstance
}

/**
 * Helper to clear the client instance (useful for testing or config changes)
 */
export const clearApiClient = (): void => {
    clientInstance = null
}

/**
 * Helper to check current API mode
 */
export const useApiMode = (): 'mock' | 'real' => {
    const config = getApiConfig()
    return config.mode
}

/**
 * Helper to check if using mock mode
 */
export const useIsMockMode = (): boolean => {
    return useApiMode() === 'mock'
}