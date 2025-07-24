/**
 * Query Invalidation Configuration
 * 
 * @description Centralized configuration for query invalidation strategies,
 * timing parameters, and performance tuning options.
 * 
 * @author Claude
 * @created 2025-06-25
 * @task T06_S08
 */

import type { InvalidationRule } from '~/composables/useQueryInvalidation'
import type { KanbanInvalidationConfig } from '~/composables/useKanbanQueryInvalidation'
import type { SyncConfiguration } from '~/composables/useRealTimeQuerySync'

/**
 * Environment-based invalidation configuration
 */
export const INVALIDATION_CONFIG = {
  // Development environment - more aggressive invalidation for debugging
  development: {
    // Base invalidation settings
    debounceMs: {
      statusChange: 100,     // Fast feedback during development
      matterUpdate: 200,     // Quick updates
      bulkOperation: 500,    // Moderate delay for bulk ops
      search: 300           // Quick search invalidation
    },
    
    rateLimits: {
      statusChange: 20,      // High limit for testing
      matterUpdate: 15,      // High limit for rapid changes
      bulkOperation: 5,      // Moderate limit for bulk ops
      search: 10            // Moderate search limit
    },
    
    // Real-time sync settings
    sync: {
      enableWebSocket: true,
      enablePolling: true,
      batchSize: 5,          // Small batches for quick processing
      batchIntervalMs: 200,  // Quick batch processing
      enableConflictResolution: true,
      autoResolveConflicts: false, // Manual resolution in dev
      debugMode: true
    } satisfies SyncConfiguration,
    
    // Kanban-specific settings
    kanban: {
      enableOptimisticReconciliation: true,
      statusChangeDebounceMs: 100,
      reorderDebounceMs: 50,
      enableSmartInvalidation: true,
      enablePerformanceMonitoring: true,
      bulkOperationBatchSize: 10
    } satisfies KanbanInvalidationConfig,
    
    // Performance monitoring
    performance: {
      enableMetrics: true,
      enableDetailedLogging: true,
      performanceThresholds: {
        invalidationTime: 20,     // Lower threshold for dev
        batchProcessingTime: 50,  // Quick batch processing
        cascadeInvalidationTime: 100
      }
    }
  },

  // Production environment - optimized for performance
  production: {
    // Base invalidation settings
    debounceMs: {
      statusChange: 300,     // Balanced for performance
      matterUpdate: 500,     // Moderate debouncing
      bulkOperation: 1000,   // Higher delay for bulk ops
      search: 1000          // Longer search debouncing
    },
    
    rateLimits: {
      statusChange: 10,      // Conservative limit
      matterUpdate: 8,       // Conservative limit
      bulkOperation: 3,      // Low limit for bulk ops
      search: 5             // Conservative search limit
    },
    
    // Real-time sync settings
    sync: {
      enableWebSocket: true,
      enablePolling: true,
      batchSize: 15,         // Larger batches for efficiency
      batchIntervalMs: 500,  // Moderate batch processing
      enableConflictResolution: true,
      autoResolveConflicts: true, // Auto-resolve in production
      debugMode: false
    } satisfies SyncConfiguration,
    
    // Kanban-specific settings
    kanban: {
      enableOptimisticReconciliation: true,
      statusChangeDebounceMs: 300,
      reorderDebounceMs: 150,
      enableSmartInvalidation: true,
      enablePerformanceMonitoring: false, // Disabled for performance
      bulkOperationBatchSize: 25
    } satisfies KanbanInvalidationConfig,
    
    // Performance monitoring
    performance: {
      enableMetrics: false,      // Disabled for performance
      enableDetailedLogging: false,
      performanceThresholds: {
        invalidationTime: 50,
        batchProcessingTime: 100,
        cascadeInvalidationTime: 200
      }
    }
  },

  // Test environment - minimal invalidation for predictable testing
  test: {
    // Base invalidation settings
    debounceMs: {
      statusChange: 0,       // No debouncing for predictable tests
      matterUpdate: 0,       // Immediate invalidation
      bulkOperation: 0,      // No delay
      search: 0             // Immediate search invalidation
    },
    
    rateLimits: {
      statusChange: 1000,    // Very high limits for tests
      matterUpdate: 1000,    // No rate limiting in tests
      bulkOperation: 1000,   // No rate limiting
      search: 1000          // No rate limiting
    },
    
    // Real-time sync settings
    sync: {
      enableWebSocket: false, // Disabled for test predictability
      enablePolling: false,   // Disabled for test predictability
      batchSize: 1,          // Process individually
      batchIntervalMs: 0,    // Immediate processing
      enableConflictResolution: false,
      autoResolveConflicts: false,
      debugMode: false
    } satisfies SyncConfiguration,
    
    // Kanban-specific settings
    kanban: {
      enableOptimisticReconciliation: false, // Disabled for test predictability
      statusChangeDebounceMs: 0,
      reorderDebounceMs: 0,
      enableSmartInvalidation: false,
      enablePerformanceMonitoring: false,
      bulkOperationBatchSize: 1
    } satisfies KanbanInvalidationConfig,
    
    // Performance monitoring
    performance: {
      enableMetrics: false,
      enableDetailedLogging: false,
      performanceThresholds: {
        invalidationTime: 1000,
        batchProcessingTime: 1000,
        cascadeInvalidationTime: 1000
      }
    }
  }
}

/**
 * Get configuration for current environment
 */
export function getInvalidationConfig() {
  const env = process.env.NODE_ENV as keyof typeof INVALIDATION_CONFIG
  return INVALIDATION_CONFIG[env] || INVALIDATION_CONFIG.production
}

/**
 * Default invalidation rules factory
 */
export function createDefaultInvalidationRules(): InvalidationRule[] {
  const config = getInvalidationConfig()
  
  return [
    // Matter updates - high priority
    {
      id: 'matter-update-enhanced',
      eventTypes: ['matter_updated', 'matter_changed'],
      queryKeys: [['matters', 'list'], ['matters', 'status-counts']],
      debounceMs: config.debounceMs.matterUpdate,
      rateLimit: config.rateLimits.matterUpdate,
      cascade: true,
      condition: (event) => !!event.data?.id
    },
    
    // Status changes - optimized for Kanban
    {
      id: 'status-change-enhanced',
      eventTypes: ['matter_status_changed', 'kanban_move', 'matter_moved'],
      queryKeys: [['matters', 'status-counts']],
      debounceMs: config.debounceMs.statusChange,
      rateLimit: config.rateLimits.statusChange,
      cascade: false,
      condition: (event) => {
        const oldStatus = event.data?.oldStatus
        const newStatus = event.data?.newStatus || event.data?.status
        return oldStatus !== newStatus
      }
    },
    
    // Matter creation - immediate invalidation
    {
      id: 'matter-create-enhanced',
      eventTypes: ['matter_created', 'matter_added'],
      queryKeys: [['matters', 'list'], ['matters', 'statistics'], ['matters', 'status-counts']],
      debounceMs: config.debounceMs.matterUpdate,
      rateLimit: config.rateLimits.matterUpdate,
      cascade: false
    },
    
    // Matter deletion - comprehensive invalidation
    {
      id: 'matter-delete-enhanced',
      eventTypes: ['matter_deleted', 'matter_removed'],
      queryKeys: [['matters', 'list'], ['matters', 'statistics'], ['matters', 'status-counts']],
      debounceMs: config.debounceMs.matterUpdate,
      rateLimit: config.rateLimits.matterUpdate,
      cascade: true
    },
    
    // Bulk operations - conservative invalidation
    {
      id: 'bulk-operation-enhanced',
      eventTypes: ['matters_bulk_created', 'matters_bulk_updated', 'matters_bulk_deleted'],
      queryKeys: [['matters']],
      debounceMs: config.debounceMs.bulkOperation,
      rateLimit: config.rateLimits.bulkOperation,
      cascade: true
    },
    
    // Search index updates
    {
      id: 'search-update-enhanced',
      eventTypes: ['search_index_updated', 'matter_indexed'],
      queryKeys: [['matters', 'search']],
      debounceMs: config.debounceMs.search,
      rateLimit: config.rateLimits.search,
      cascade: false
    },
    
    // Assignment changes
    {
      id: 'assignment-change-enhanced',
      eventTypes: ['matter_assigned', 'matter_unassigned'],
      queryKeys: [['matters', 'assigned'], ['matters', 'list']],
      debounceMs: config.debounceMs.matterUpdate,
      rateLimit: config.rateLimits.matterUpdate,
      cascade: true,
      condition: (event) => {
        const oldAssignee = event.data?.oldAssignee
        const newAssignee = event.data?.newAssignee || event.data?.assignedLawyer
        return oldAssignee !== newAssignee
      }
    },
    
    // External updates (from other users)
    {
      id: 'external-update-enhanced',
      eventTypes: ['external_matter_update', 'collaborative_change'],
      queryKeys: [['matters', 'list']],
      debounceMs: config.debounceMs.matterUpdate * 2, // Longer debounce for external updates
      rateLimit: config.rateLimits.matterUpdate,
      cascade: false,
      condition: (event) => {
        // Only invalidate if not from current user
        return event.userId !== getCurrentUserId()
      }
    }
  ]
}

/**
 * Get current user ID (placeholder - should be replaced with actual auth)
 */
function getCurrentUserId(): string {
  // TODO: Implement actual user ID retrieval
  return 'current-user-id'
}

/**
 * Environment-specific query stale times
 */
export const QUERY_STALE_TIMES = {
  development: {
    matters: 1000 * 30,      // 30 seconds - short for development
    statistics: 1000 * 60,   // 1 minute
    statusCounts: 1000 * 15, // 15 seconds - very fresh
    search: 1000 * 60 * 2    // 2 minutes
  },
  production: {
    matters: 1000 * 60 * 5,  // 5 minutes - longer for production
    statistics: 1000 * 60 * 10, // 10 minutes
    statusCounts: 1000 * 60, // 1 minute
    search: 1000 * 60 * 5    // 5 minutes
  },
  test: {
    matters: 0,              // Always stale for predictable tests
    statistics: 0,
    statusCounts: 0,
    search: 0
  }
}

/**
 * Get stale times for current environment
 */
export function getQueryStaleTimes() {
  const env = process.env.NODE_ENV as keyof typeof QUERY_STALE_TIMES
  return QUERY_STALE_TIMES[env] || QUERY_STALE_TIMES.production
}

/**
 * Cache time configuration (how long to keep unused data)
 */
export const QUERY_CACHE_TIMES = {
  development: {
    matters: 1000 * 60 * 5,   // 5 minutes
    statistics: 1000 * 60 * 10, // 10 minutes
    statusCounts: 1000 * 60 * 2, // 2 minutes
    search: 1000 * 60 * 3     // 3 minutes
  },
  production: {
    matters: 1000 * 60 * 30,  // 30 minutes
    statistics: 1000 * 60 * 60, // 1 hour
    statusCounts: 1000 * 60 * 10, // 10 minutes
    search: 1000 * 60 * 15    // 15 minutes
  },
  test: {
    matters: 1000,            // Very short for tests
    statistics: 1000,
    statusCounts: 1000,
    search: 1000
  }
}

/**
 * Get cache times for current environment
 */
export function getQueryCacheTimes() {
  const env = process.env.NODE_ENV as keyof typeof QUERY_CACHE_TIMES
  return QUERY_CACHE_TIMES[env] || QUERY_CACHE_TIMES.production
}

/**
 * Retry configuration for failed invalidations
 */
export const RETRY_CONFIG = {
  development: {
    retries: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)
  },
  production: {
    retries: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000)
  },
  test: {
    retries: 0, // No retries in tests
    retryDelay: () => 0
  }
}

/**
 * Get retry configuration for current environment
 */
export function getRetryConfig() {
  const env = process.env.NODE_ENV as keyof typeof RETRY_CONFIG
  return RETRY_CONFIG[env] || RETRY_CONFIG.production
}