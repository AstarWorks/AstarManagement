/**
 * Offline Configuration
 * 
 * @description Central configuration for offline support features including
 * cache persistence, mutation queuing, and service worker settings.
 * 
 * @author Claude
 * @created 2025-06-26
 */

/**
 * Offline support configuration
 */
export const offlineConfig = {
  /**
   * IndexedDB persistence settings
   */
  persistence: {
    enabled: true,
    dbName: 'aster-offline-db',
    version: 1,
    stores: {
      queryCache: 'query-cache',
      mutationQueue: 'mutation-queue',
      userPreferences: 'user-preferences'
    },
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    compressionThreshold: 1024, // 1KB
    enableCompression: true
  },
  
  /**
   * Mutation queue settings
   */
  mutationQueue: {
    maxRetries: 3,
    retryDelay: 1000,
    maxConcurrent: 3,
    autoSync: true,
    storageKey: 'aster-offline-mutations'
  },
  
  /**
   * Service worker settings
   */
  serviceWorker: {
    enabled: true,
    scope: '/',
    updateCheckInterval: 60 * 60 * 1000, // 1 hour
    enableInDevelopment: false
  },
  
  /**
   * Network detection settings
   */
  networkDetection: {
    // Endpoints to ping for connection check
    pingEndpoints: [
      '/api/health',
      'https://www.google.com/favicon.ico'
    ],
    pingInterval: 30 * 1000, // 30 seconds
    pingTimeout: 5000 // 5 seconds
  },
  
  /**
   * UI/UX settings
   */
  ui: {
    showOfflineIndicator: true,
    autoHideOnlineIndicator: 5000, // 5 seconds
    showSyncProgress: true,
    showQueuedCount: true
  },
  
  /**
   * Data freshness indicators
   */
  freshness: {
    // Time thresholds for data staleness (in milliseconds)
    fresh: 5 * 60 * 1000, // 5 minutes
    stale: 30 * 60 * 1000, // 30 minutes
    expired: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  /**
   * Cache strategies by data type
   */
  cacheStrategies: {
    matters: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      strategy: 'network-first'
    },
    documents: {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      strategy: 'cache-first'
    },
    users: {
      staleTime: 15 * 60 * 1000, // 15 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
      strategy: 'stale-while-revalidate'
    },
    settings: {
      staleTime: 60 * 60 * 1000, // 1 hour
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
      strategy: 'cache-first'
    }
  }
}

/**
 * Get cache strategy for a specific data type
 */
export function getCacheStrategy(dataType: keyof typeof offlineConfig.cacheStrategies) {
  return offlineConfig.cacheStrategies[dataType] || offlineConfig.cacheStrategies.matters
}

/**
 * Check if offline support is enabled
 */
export function isOfflineSupportEnabled(): boolean {
  return offlineConfig.persistence.enabled && 
         offlineConfig.serviceWorker.enabled &&
         typeof window !== 'undefined' &&
         'serviceWorker' in navigator &&
         'indexedDB' in window
}

/**
 * Get data freshness status
 */
export function getDataFreshness(lastUpdated: number): 'fresh' | 'stale' | 'expired' {
  const age = Date.now() - lastUpdated
  
  if (age < offlineConfig.freshness.fresh) {
    return 'fresh'
  } else if (age < offlineConfig.freshness.stale) {
    return 'stale'
  } else {
    return 'expired'
  }
}

/**
 * Environment-specific overrides
 */
export function getOfflineConfig() {
  const config = { ...offlineConfig }
  
  // Development overrides
  if (process.env.NODE_ENV === 'development') {
    config.serviceWorker.enableInDevelopment = 
      process.env.ENABLE_SW_DEV === 'true'
    
    // Shorter cache times in development
    config.freshness.fresh = 1 * 60 * 1000 // 1 minute
    config.freshness.stale = 5 * 60 * 1000 // 5 minutes
    config.freshness.expired = 30 * 60 * 1000 // 30 minutes
  }
  
  // Test environment overrides
  if (process.env.NODE_ENV === 'test') {
    config.persistence.enabled = false
    config.serviceWorker.enabled = false
    config.mutationQueue.autoSync = false
  }
  
  return config
}