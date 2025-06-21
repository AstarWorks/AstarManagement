/**
 * Kanban SSR Utils - Server-side rendering utilities and caching
 * 
 * Provides SSR-compatible utilities, caching mechanisms, and hydration helpers
 * for all kanban store modules. Separated for better modularity and testing.
 */

import { 
    getBoardServerSnapshot,
    type useKanbanBoardStore 
} from './kanban-board-store'
import { 
    getMatterDataServerSnapshot,
    type useMatterDataStore 
} from './matter-data-store'
import { 
    getSearchServerSnapshot,
    type useSearchStore 
} from './search-store'
import { 
    getUIPreferencesServerSnapshot,
    type useUIPreferencesStore 
} from './ui-preferences-store'
import { 
    getRealTimeServerSnapshot,
    type useRealTimeStore 
} from './real-time-store'

// Server-side cache interface
interface ServerCache {
    data: any
    timestamp: number
    ttl: number
}

// Cache storage (server-side only)
const serverCache = new Map<string, ServerCache>()

// Cache configuration
const CACHE_CONFIG = {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    BOARD_STATE_TTL: 10 * 60 * 1000, // 10 minutes
    MATTER_DATA_TTL: 2 * 60 * 1000, // 2 minutes
    SEARCH_RESULTS_TTL: 1 * 60 * 1000, // 1 minute
    UI_PREFERENCES_TTL: 60 * 60 * 1000, // 1 hour
    REAL_TIME_TTL: 30 * 1000, // 30 seconds
} as const

// Cache key generators
export const getCacheKey = {
    boardState: (boardId?: string) => `board:${boardId || 'main'}`,
    matterData: (filters?: string) => `matters:${filters || 'all'}`,
    searchResults: (query: string, type?: string) => `search:${query}:${type || 'fuzzy'}`,
    uiPreferences: (userId?: string) => `ui:${userId || 'default'}`,
    realTimeStatus: () => 'realtime:status'
}

// Cache utilities
export const cacheUtils = {
    /**
     * Get cached data if valid, otherwise return null
     */
    get: <T>(key: string): T | null => {
        const cached = serverCache.get(key)
        if (!cached) return null

        const now = Date.now()
        if (now > cached.timestamp + cached.ttl) {
            serverCache.delete(key)
            return null
        }

        return cached.data as T
    },

    /**
     * Set data in cache with TTL
     */
    set: <T>(key: string, data: T, ttl?: number): void => {
        serverCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || CACHE_CONFIG.DEFAULT_TTL
        })
    },

    /**
     * Invalidate cache entry
     */
    invalidate: (key: string): void => {
        serverCache.delete(key)
    },

    /**
     * Clear all cache entries
     */
    clear: (): void => {
        serverCache.clear()
    },

    /**
     * Clean expired cache entries
     */
    cleanup: (): void => {
        const now = Date.now()
        for (const [key, cached] of serverCache.entries()) {
            if (now > cached.timestamp + cached.ttl) {
                serverCache.delete(key)
            }
        }
    },

    /**
     * Get cache statistics
     */
    getStats: () => ({
        size: serverCache.size,
        keys: Array.from(serverCache.keys()),
        totalMemory: JSON.stringify(Array.from(serverCache.values())).length
    })
}

// SSR snapshot generators with caching
export const ssrSnapshots = {
    /**
     * Get cached board state snapshot
     */
    getBoardSnapshot: (boardId?: string) => {
        const cacheKey = getCacheKey.boardState(boardId)
        const cached = cacheUtils.get(cacheKey)
        
        if (cached) return cached

        const snapshot = getBoardServerSnapshot()
        cacheUtils.set(cacheKey, snapshot, CACHE_CONFIG.BOARD_STATE_TTL)
        return snapshot
    },

    /**
     * Get cached matter data snapshot
     */
    getMatterDataSnapshot: (filters?: string) => {
        const cacheKey = getCacheKey.matterData(filters)
        const cached = cacheUtils.get(cacheKey)
        
        if (cached) return cached

        const snapshot = getMatterDataServerSnapshot()
        cacheUtils.set(cacheKey, snapshot, CACHE_CONFIG.MATTER_DATA_TTL)
        return snapshot
    },

    /**
     * Get cached search snapshot
     */
    getSearchSnapshot: (query?: string, type?: string) => {
        const cacheKey = getCacheKey.searchResults(query || '', type)
        const cached = cacheUtils.get(cacheKey)
        
        if (cached) return cached

        const snapshot = getSearchServerSnapshot()
        cacheUtils.set(cacheKey, snapshot, CACHE_CONFIG.SEARCH_RESULTS_TTL)
        return snapshot
    },

    /**
     * Get cached UI preferences snapshot  
     */
    getUIPreferencesSnapshot: (userId?: string) => {
        const cacheKey = getCacheKey.uiPreferences(userId)
        const cached = cacheUtils.get(cacheKey)
        
        if (cached) return cached

        const snapshot = getUIPreferencesServerSnapshot()
        cacheUtils.set(cacheKey, snapshot, CACHE_CONFIG.UI_PREFERENCES_TTL)
        return snapshot
    },

    /**
     * Get cached real-time status snapshot
     */
    getRealTimeSnapshot: () => {
        const cacheKey = getCacheKey.realTimeStatus()
        const cached = cacheUtils.get(cacheKey)
        
        if (cached) return cached

        const snapshot = getRealTimeServerSnapshot()
        cacheUtils.set(cacheKey, snapshot, CACHE_CONFIG.REAL_TIME_TTL)
        return snapshot
    }
}

// Hydration utilities
export const hydrationUtils = {
    /**
     * Prepare initial state for hydration
     */
    prepareInitialState: (options: {
        boardId?: string
        userId?: string
        filters?: string
        searchQuery?: string
    } = {}) => {
        return {
            board: ssrSnapshots.getBoardSnapshot(options.boardId),
            matterData: ssrSnapshots.getMatterDataSnapshot(options.filters),
            search: ssrSnapshots.getSearchSnapshot(options.searchQuery),
            uiPreferences: ssrSnapshots.getUIPreferencesSnapshot(options.userId),
            realTime: ssrSnapshots.getRealTimeSnapshot()
        }
    },

    /**
     * Validate hydration compatibility
     */
    validateHydration: (clientState: any, serverState: any): boolean => {
        try {
            // Check if critical fields match to prevent hydration mismatches
            const criticalFields = ['matters', 'searchQuery', 'viewPreferences']
            
            for (const field of criticalFields) {
                if (clientState[field] !== serverState[field]) {
                    console.warn(`Hydration mismatch detected in field: ${field}`)
                    return false
                }
            }
            return true
        } catch (error) {
            console.error('Hydration validation error:', error)
            return false
        }
    },

    /**
     * Handle hydration errors gracefully
     */
    handleHydrationError: (error: Error, fallbackState?: any) => {
        console.error('Hydration error:', error)
        
        // Clear potentially corrupted cache
        cacheUtils.clear()
        
        // Return safe fallback state
        return fallbackState || hydrationUtils.prepareInitialState()
    }
}

// Server-side preload utilities
export const preloadUtils = {
    /**
     * Preload matter data for faster initial render
     */
    preloadMatterData: async (filters?: any) => {
        try {
            // In real implementation, this would fetch from API
            const mockData = {
                matters: [],
                isLoading: false,
                error: null,
                lastRefresh: new Date()
            }
            
            const cacheKey = getCacheKey.matterData(JSON.stringify(filters))
            cacheUtils.set(cacheKey, mockData, CACHE_CONFIG.MATTER_DATA_TTL)
            
            return mockData
        } catch (error) {
            console.error('Failed to preload matter data:', error)
            return null
        }
    },

    /**
     * Preload user preferences
     */
    preloadUserPreferences: async (userId: string) => {
        try {
            // In real implementation, this would fetch user-specific preferences
            const mockPreferences = getUIPreferencesServerSnapshot()
            
            const cacheKey = getCacheKey.uiPreferences(userId)
            cacheUtils.set(cacheKey, mockPreferences, CACHE_CONFIG.UI_PREFERENCES_TTL)
            
            return mockPreferences
        } catch (error) {
            console.error('Failed to preload user preferences:', error)
            return null
        }
    },

    /**
     * Preload all critical data for page
     */
    preloadPage: async (options: {
        boardId?: string
        userId?: string
        filters?: any
    } = {}) => {
        const results = await Promise.allSettled([
            preloadUtils.preloadMatterData(options.filters),
            preloadUtils.preloadUserPreferences(options.userId || 'default')
        ])
        
        return {
            matterData: results[0].status === 'fulfilled' ? results[0].value : null,
            userPreferences: results[1].status === 'fulfilled' ? results[1].value : null,
            errors: results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason)
        }
    }
}

// Performance monitoring
export const performanceUtils = {
    /**
     * Measure cache hit rate
     */
    getCacheHitRate: () => {
        // Simple implementation - in production, use more sophisticated metrics
        const stats = cacheUtils.getStats()
        return {
            totalKeys: stats.size,
            memoryUsage: stats.totalMemory,
            keys: stats.keys
        }
    },

    /**
     * Monitor SSR performance
     */
    measureSSRPerformance: <T>(fn: () => T, operation: string): T => {
        const start = performance.now()
        const result = fn()
        const end = performance.now()
        
        console.log(`SSR ${operation} took ${end - start}ms`)
        return result
    }
}

// Cleanup utilities for long-running processes
export const cleanupUtils = {
    /**
     * Schedule periodic cache cleanup
     */
    scheduleCleanup: (intervalMs: number = 5 * 60 * 1000) => {
        if (typeof setInterval !== 'undefined') {
            return setInterval(() => {
                cacheUtils.cleanup()
            }, intervalMs)
        }
        return null
    },

    /**
     * Clean up all resources
     */
    cleanup: () => {
        cacheUtils.clear()
    }
}

// Export all utilities as a single object for easier imports
export const kanbanSSRUtils = {
    cache: cacheUtils,
    snapshots: ssrSnapshots,
    hydration: hydrationUtils,
    preload: preloadUtils,
    performance: performanceUtils,
    cleanup: cleanupUtils,
    cacheKeys: getCacheKey,
    config: CACHE_CONFIG
}

// Default export for convenience
export default kanbanSSRUtils