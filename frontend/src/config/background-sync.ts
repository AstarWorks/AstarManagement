/**
 * Background Sync Configuration
 * 
 * @description Advanced configuration for background data synchronization including
 * refetch intervals, tab visibility handling, network status detection, and 
 * WebSocket integration for the Aster Management legal case system.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import type { UseQueryOptions } from '@tanstack/vue-query'

/**
 * Sync modes available for different scenarios
 */
export type SyncMode = 'aggressive' | 'balanced' | 'conservative' | 'offline' | 'manual'

/**
 * Network quality levels based on connection info
 */
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline'

/**
 * Tab visibility states
 */
export type TabVisibility = 'active' | 'hidden' | 'background'

/**
 * Sync configuration for different data types and scenarios
 */
export interface SyncConfig {
  /**
   * Base refetch interval in milliseconds
   */
  baseInterval: number
  
  /**
   * Whether to refetch when tab becomes visible
   */
  refetchOnWindowFocus: boolean
  
  /**
   * Whether to continue refetching in background tabs
   */
  refetchInBackground: boolean
  
  /**
   * Maximum age before data is considered stale
   */
  staleTime: number
  
  /**
   * Network quality requirements for syncing
   */
  minNetworkQuality: NetworkQuality
  
  /**
   * Whether to enable WebSocket updates for this data type
   */
  enableWebSocket: boolean
  
  /**
   * Priority for sync operations (higher = more important)
   */
  priority: number
}

/**
 * Background sync configuration for different data types
 */
export const SYNC_CONFIGS: Record<string, Record<SyncMode, SyncConfig>> = {
  // Legal matters - critical data that needs frequent updates
  matters: {
    aggressive: {
      baseInterval: 5000, // 5 seconds
      refetchOnWindowFocus: true,
      refetchInBackground: true,
      staleTime: 30000, // 30 seconds
      minNetworkQuality: 'fair',
      enableWebSocket: true,
      priority: 10
    },
    balanced: {
      baseInterval: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchInBackground: false,
      staleTime: 60000, // 1 minute
      minNetworkQuality: 'fair',
      enableWebSocket: true,
      priority: 8
    },
    conservative: {
      baseInterval: 60000, // 1 minute
      refetchOnWindowFocus: true,
      refetchInBackground: false,
      staleTime: 300000, // 5 minutes
      minNetworkQuality: 'good',
      enableWebSocket: false,
      priority: 6
    },
    offline: {
      baseInterval: 0, // No automatic refetch
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: Infinity,
      minNetworkQuality: 'offline',
      enableWebSocket: false,
      priority: 0
    },
    manual: {
      baseInterval: 0, // No automatic refetch
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: 600000, // 10 minutes
      minNetworkQuality: 'fair',
      enableWebSocket: false,
      priority: 5
    }
  },
  
  // Kanban board state - needs real-time updates for collaboration
  kanban: {
    aggressive: {
      baseInterval: 3000, // 3 seconds
      refetchOnWindowFocus: true,
      refetchInBackground: true,
      staleTime: 10000, // 10 seconds
      minNetworkQuality: 'fair',
      enableWebSocket: true,
      priority: 10
    },
    balanced: {
      baseInterval: 15000, // 15 seconds
      refetchOnWindowFocus: true,
      refetchInBackground: false,
      staleTime: 30000, // 30 seconds
      minNetworkQuality: 'fair',
      enableWebSocket: true,
      priority: 9
    },
    conservative: {
      baseInterval: 60000, // 1 minute
      refetchOnWindowFocus: true,
      refetchInBackground: false,
      staleTime: 120000, // 2 minutes
      minNetworkQuality: 'good',
      enableWebSocket: false,
      priority: 7
    },
    offline: {
      baseInterval: 0,
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: Infinity,
      minNetworkQuality: 'offline',
      enableWebSocket: false,
      priority: 0
    },
    manual: {
      baseInterval: 0,
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: 300000, // 5 minutes
      minNetworkQuality: 'fair',
      enableWebSocket: false,
      priority: 5
    }
  },
  
  // User activity and notifications
  activity: {
    aggressive: {
      baseInterval: 10000, // 10 seconds
      refetchOnWindowFocus: true,
      refetchInBackground: true,
      staleTime: 30000, // 30 seconds
      minNetworkQuality: 'poor',
      enableWebSocket: true,
      priority: 8
    },
    balanced: {
      baseInterval: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchInBackground: false,
      staleTime: 60000, // 1 minute
      minNetworkQuality: 'fair',
      enableWebSocket: true,
      priority: 6
    },
    conservative: {
      baseInterval: 120000, // 2 minutes
      refetchOnWindowFocus: true,
      refetchInBackground: false,
      staleTime: 300000, // 5 minutes
      minNetworkQuality: 'good',
      enableWebSocket: false,
      priority: 4
    },
    offline: {
      baseInterval: 0,
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: Infinity,
      minNetworkQuality: 'offline',
      enableWebSocket: false,
      priority: 0
    },
    manual: {
      baseInterval: 0,
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: 600000, // 10 minutes
      minNetworkQuality: 'fair',
      enableWebSocket: false,
      priority: 3
    }
  },
  
  // Static data (users, settings, etc.)
  static: {
    aggressive: {
      baseInterval: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: 600000, // 10 minutes
      minNetworkQuality: 'good',
      enableWebSocket: false,
      priority: 3
    },
    balanced: {
      baseInterval: 900000, // 15 minutes
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: 1800000, // 30 minutes
      minNetworkQuality: 'good',
      enableWebSocket: false,
      priority: 2
    },
    conservative: {
      baseInterval: 3600000, // 1 hour
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: 7200000, // 2 hours
      minNetworkQuality: 'excellent',
      enableWebSocket: false,
      priority: 1
    },
    offline: {
      baseInterval: 0,
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: Infinity,
      minNetworkQuality: 'offline',
      enableWebSocket: false,
      priority: 0
    },
    manual: {
      baseInterval: 0,
      refetchOnWindowFocus: false,
      refetchInBackground: false,
      staleTime: 86400000, // 24 hours
      minNetworkQuality: 'good',
      enableWebSocket: false,
      priority: 1
    }
  }
}

/**
 * Default sync mode based on user preferences and device capabilities
 */
export function getDefaultSyncMode(): SyncMode {
  // Check if user has set a preference
  if (typeof window !== 'undefined') {
    const userPreference = localStorage.getItem('sync-mode')
    if (userPreference && ['aggressive', 'balanced', 'conservative', 'offline', 'manual'].includes(userPreference)) {
      return userPreference as SyncMode
    }
  }
  
  // Default to balanced mode
  return 'balanced'
}

/**
 * Get sync configuration for a specific data type and mode
 */
export function getSyncConfig(dataType: keyof typeof SYNC_CONFIGS, mode?: SyncMode): SyncConfig {
  const syncMode = mode || getDefaultSyncMode()
  return SYNC_CONFIGS[dataType]?.[syncMode] || SYNC_CONFIGS.matters.balanced
}

/**
 * Network quality detection configuration
 */
export const NETWORK_CONFIG = {
  // Thresholds for network quality detection
  qualityThresholds: {
    excellent: {
      rtt: 50, // Round-trip time in ms
      downlink: 10, // Downlink speed in Mbps
      effectiveType: '4g' as const
    },
    good: {
      rtt: 100,
      downlink: 5,
      effectiveType: '4g' as const
    },
    fair: {
      rtt: 200,
      downlink: 1,
      effectiveType: '3g' as const
    },
    poor: {
      rtt: 400,
      downlink: 0.5,
      effectiveType: '2g' as const
    }
  },
  
  // Ping configuration for network detection
  ping: {
    endpoints: ['/api/health', '/api/ping'],
    timeout: 5000,
    retries: 2
  },
  
  // Network change detection
  detection: {
    // How often to check network quality
    checkInterval: 30000, // 30 seconds
    // Debounce network change events
    debounceDelay: 2000, // 2 seconds
    // Enable adaptive sync based on network
    adaptiveSync: true
  }
}

/**
 * Tab visibility configuration
 */
export const TAB_VISIBILITY_CONFIG = {
  // Delay before considering tab as "background"
  backgroundDelay: 30000, // 30 seconds
  
  // Whether to pause all syncing when tab is hidden
  pauseWhenHidden: false,
  
  // Reduced sync rates for background tabs
  backgroundRateMultiplier: 0.2, // 20% of normal rate
  
  // Whether to sync immediately when tab becomes visible
  syncOnFocus: true,
  
  // Debounce rapid visibility changes
  visibilityDebounce: 1000 // 1 second
}

/**
 * WebSocket configuration for real-time updates
 */
export const WEBSOCKET_CONFIG = {
  // WebSocket endpoint
  endpoint: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
  
  // Reconnection settings
  reconnection: {
    enabled: true,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 1.5,
    maxAttempts: 10
  },
  
  // Heartbeat settings
  heartbeat: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 10000, // 10 seconds
    message: { type: 'ping' }
  },
  
  // Message handling
  messages: {
    // Queue messages when offline
    queueOffline: true,
    maxQueueSize: 100,
    // Batch messages for performance
    batchDelay: 100, // 100ms
    maxBatchSize: 10
  },
  
  // Security
  security: {
    // Use JWT for authentication
    authRequired: true,
    // Validate message schema
    validateSchema: true,
    // Rate limiting
    maxMessagesPerMinute: 100
  }
}

/**
 * Performance optimization settings
 */
export const PERFORMANCE_CONFIG = {
  // Throttle refetch operations
  refetchThrottle: 1000, // 1 second minimum between refetches
  
  // Batch query operations
  batchQueries: true,
  batchDelay: 50, // 50ms
  
  // Memory management
  maxCachedQueries: 100,
  maxCachedMutations: 50,
  
  // CPU usage limits
  maxConcurrentRefetches: 3,
  
  // Adaptive performance
  adaptive: {
    enabled: true,
    // Reduce sync when battery is low
    batteryThreshold: 20, // 20%
    // Reduce sync when memory is low
    memoryThreshold: 90 // 90% usage
  }
}

/**
 * Create TanStack Query options based on sync configuration
 */
export function createSyncQueryOptions(
  dataType: keyof typeof SYNC_CONFIGS,
  syncMode?: SyncMode
): Partial<UseQueryOptions> {
  const config = getSyncConfig(dataType, syncMode)
  
  return {
    staleTime: config.staleTime,
    refetchInterval: config.baseInterval || false,
    refetchIntervalInBackground: config.refetchInBackground,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
    refetchOnReconnect: true,
    enabled: config.baseInterval > 0
  }
}

/**
 * Sync mode descriptions for UI
 */
export const SYNC_MODE_DESCRIPTIONS = {
  aggressive: {
    label: 'Real-time',
    description: 'Continuous updates for maximum freshness',
    icon: 'zap',
    color: 'text-red-500'
  },
  balanced: {
    label: 'Balanced',
    description: 'Regular updates with good performance',
    icon: 'activity',
    color: 'text-blue-500'
  },
  conservative: {
    label: 'Battery Saver',
    description: 'Less frequent updates to save resources',
    icon: 'battery',
    color: 'text-green-500'
  },
  offline: {
    label: 'Offline',
    description: 'No automatic updates, manual sync only',
    icon: 'wifi-off',
    color: 'text-gray-500'
  },
  manual: {
    label: 'Manual',
    description: 'Updates only when you request them',
    icon: 'hand',
    color: 'text-purple-500'
  }
} as const