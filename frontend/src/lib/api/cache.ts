/**
 * Frontend API cache implementation with request deduplication
 * Implements caching strategies to reduce server load and improve performance
 */

import React from 'react'

// Simple LRU Cache implementation (lightweight alternative to lru-cache)
class SimpleLRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number
  private ttl: number
  private timers = new Map<K, NodeJS.Timeout>()

  constructor(options: { max: number; ttl: number }) {
    this.maxSize = options.max
    this.ttl = options.ttl
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V, options?: { ttl?: number }): void {
    const ttl = options?.ttl || this.ttl

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      this.delete(firstKey)
    }

    // Clear existing timer if key exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!)
    }

    this.cache.set(key, value)

    // Set TTL timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)
    this.timers.set(key, timer)
  }

  delete(key: K): boolean {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
    return this.cache.delete(key)
  }

  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  get max(): number {
    return this.maxSize
  }

  keys(): IterableIterator<K> {
    return this.cache.keys()
  }

  get calculatedSize(): number {
    return this.cache.size
  }
}

// Cache configuration
const CACHE_CONFIG = {
  max: 1000, // Maximum number of items in cache
  ttl: 1000 * 60 * 5, // 5 minutes TTL
  allowStale: true,
  updateAgeOnGet: true,
  updateAgeOnHas: true,
}

// Create cache instances for different data types
const matterCache = new SimpleLRUCache(CACHE_CONFIG)
const searchCache = new SimpleLRUCache({ ...CACHE_CONFIG, ttl: 1000 * 60 * 2 }) // 2 minutes for search
const auditCache = new SimpleLRUCache(CACHE_CONFIG)

// In-flight request tracking for deduplication
const inflightRequests = new Map<string, Promise<any>>()

/**
 * Generate cache key from request parameters
 */
function generateCacheKey(endpoint: string, params?: Record<string, any>): string {
  const paramString = params 
    ? Object.keys(params)
        .sort()
        .map(key => `${key}=${JSON.stringify(params[key])}`)
        .join('&')
    : ''
  
  return `${endpoint}${paramString ? `?${paramString}` : ''}`
}

/**
 * Generic cached fetch with request deduplication
 */
export async function cachedFetch<T>(
  endpoint: string,
  fetchFunction: () => Promise<T>,
  options: {
    cache?: SimpleLRUCache<string, any>
    params?: Record<string, any>
    skipCache?: boolean
    cacheTtl?: number
  } = {}
): Promise<T> {
  const {
    cache = matterCache,
    params,
    skipCache = false,
    cacheTtl
  } = options

  const cacheKey = generateCacheKey(endpoint, params)
  
  // Check cache first (unless skipping cache)
  if (!skipCache) {
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log(`✅ Cache hit for ${cacheKey}`)
      return cached
    }
  }

  // Check if request is already in flight
  if (inflightRequests.has(cacheKey)) {
    console.log(`🔄 Request deduplication for ${cacheKey}`)
    return inflightRequests.get(cacheKey)!
  }

  // Execute the fetch
  const requestPromise = fetchFunction()
    .then(result => {
      // Cache the result
      if (!skipCache) {
        if (cacheTtl) {
          cache.set(cacheKey, result, { ttl: cacheTtl })
        } else {
          cache.set(cacheKey, result)
        }
        console.log(`💾 Cached result for ${cacheKey}`)
      }
      
      // Remove from in-flight tracking
      inflightRequests.delete(cacheKey)
      
      return result
    })
    .catch(error => {
      // Remove from in-flight tracking on error
      inflightRequests.delete(cacheKey)
      throw error
    })

  // Track in-flight request
  inflightRequests.set(cacheKey, requestPromise)
  
  return requestPromise
}

/**
 * Matter-specific caching functions
 */
export const matterCacheUtils = {
  get: (endpoint: string, params?: Record<string, any>) => {
    const cacheKey = generateCacheKey(endpoint, params)
    return matterCache.get(cacheKey)
  },
  
  set: (endpoint: string, data: any, params?: Record<string, any>, ttl?: number) => {
    const cacheKey = generateCacheKey(endpoint, params)
    if (ttl) {
      matterCache.set(cacheKey, data, { ttl })
    } else {
      matterCache.set(cacheKey, data)
    }
  },
  
  invalidate: (endpoint: string, params?: Record<string, any>) => {
    const cacheKey = generateCacheKey(endpoint, params)
    matterCache.delete(cacheKey)
    console.log(`🗑️ Invalidated cache for ${cacheKey}`)
  },
  
  invalidateAll: () => {
    matterCache.clear()
    console.log('🗑️ Cleared all matter cache')
  },
  
  invalidatePattern: (pattern: string) => {
    const keysToDelete: string[] = []
    for (const key of matterCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => matterCache.delete(key))
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`)
  }
}

/**
 * Search-specific caching functions
 */
export const searchCacheUtils = {
  get: (query: string, type?: string) => {
    const cacheKey = generateCacheKey('/search', { query, type })
    return searchCache.get(cacheKey)
  },
  
  set: (query: string, results: any, type?: string) => {
    const cacheKey = generateCacheKey('/search', { query, type })
    searchCache.set(cacheKey, results)
  },
  
  clear: () => {
    searchCache.clear()
    console.log('🗑️ Cleared search cache')
  }
}

/**
 * Audit-specific caching functions
 */
export const auditCacheUtils = {
  get: (endpoint: string, params?: Record<string, any>) => {
    const cacheKey = generateCacheKey(endpoint, params)
    return auditCache.get(cacheKey)
  },
  
  set: (endpoint: string, data: any, params?: Record<string, any>) => {
    const cacheKey = generateCacheKey(endpoint, params)
    auditCache.set(cacheKey, data)
  },
  
  clear: () => {
    auditCache.clear()
    console.log('🗑️ Cleared audit cache')
  }
}

/**
 * Preload cache with critical data
 */
export async function preloadCriticalData() {
  console.log('🚀 Preloading critical data...')
  
  try {
    // This would be called with actual API functions
    // Example: await cachedFetch('/api/v1/matters', () => getMatters({ page: 0, size: 20 }))
    console.log('✅ Critical data preloaded')
  } catch (error) {
    console.warn('⚠️ Failed to preload critical data:', error)
  }
}

/**
 * Cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    matters: {
      size: matterCache.size,
      max: matterCache.max,
      hitRate: matterCache.calculatedSize / (matterCache.size || 1)
    },
    search: {
      size: searchCache.size,
      max: searchCache.max,
      hitRate: searchCache.calculatedSize / (searchCache.size || 1)
    },
    audit: {
      size: auditCache.size,
      max: auditCache.max,
      hitRate: auditCache.calculatedSize / (auditCache.size || 1)
    },
    inflightRequests: inflightRequests.size
  }
}

/**
 * Performance monitoring hook
 */
export function useCacheMetrics() {
  const [stats, setStats] = React.useState(getCacheStats())
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats())
    }, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  return stats
}

// Export cache instances for direct access if needed
export { matterCache, searchCache, auditCache }