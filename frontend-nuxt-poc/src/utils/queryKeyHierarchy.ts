/**
 * Query Key Hierarchy Management
 * 
 * @description Provides a structured approach to managing TanStack Query keys
 * for efficient invalidation patterns. Supports hierarchical invalidation,
 * partial matching, and smart cache management strategies.
 * 
 * @author Claude
 * @created 2025-06-25
 * @task T06_S08
 */

import type { QueryKey } from '@tanstack/vue-query'
import type { MatterStatus } from '~/types/kanban'

export interface QueryKeyPattern {
  /** Pattern identifier */
  id: string
  /** Base query key pattern */
  pattern: (string | symbol)[]
  /** Description of what this pattern matches */
  description: string
  /** Whether this is a leaf pattern (no children) */
  isLeaf?: boolean
  /** Child patterns */
  children?: QueryKeyPattern[]
  /** Invalidation priority (higher = invalidated first) */
  priority?: number
}

export interface InvalidationTarget {
  /** Query key to invalidate */
  queryKey: QueryKey
  /** Invalidation type */
  type: 'exact' | 'partial' | 'prefix'
  /** Whether to refetch immediately */
  refetch?: boolean
  /** Custom predicate for matching */
  predicate?: (queryKey: QueryKey) => boolean
}

/**
 * Query key hierarchy for matter management
 */
export class QueryKeyHierarchy {
  private patterns: Map<string, QueryKeyPattern> = new Map()
  private readonly WILDCARD = Symbol('WILDCARD')
  
  constructor() {
    this.setupDefaultPatterns()
  }

  /**
   * Setup default query key patterns for matter management
   */
  private setupDefaultPatterns() {
    const patterns: QueryKeyPattern[] = [
      // Root level patterns
      {
        id: 'matters-root',
        pattern: ['matters'],
        description: 'All matter-related queries',
        priority: 1,
        children: [
          {
            id: 'matters-list',
            pattern: ['matters', 'list'],
            description: 'Matter list queries with filters',
            priority: 3,
            children: [
              {
                id: 'matters-list-filtered',
                pattern: ['matters', 'list', this.WILDCARD],
                description: 'Specific filtered matter lists',
                isLeaf: true,
                priority: 5
              }
            ]
          },
          {
            id: 'matters-detail',
            pattern: ['matters', 'detail'],
            description: 'Individual matter details',
            priority: 4,
            children: [
              {
                id: 'matters-detail-specific',
                pattern: ['matters', 'detail', this.WILDCARD],
                description: 'Specific matter by ID',
                isLeaf: true,
                priority: 6
              }
            ]
          },
          {
            id: 'matters-search',
            pattern: ['matters', 'search'],
            description: 'Matter search queries',
            priority: 2,
            children: [
              {
                id: 'matters-search-specific',
                pattern: ['matters', 'search', this.WILDCARD],
                description: 'Specific search query',
                isLeaf: true,
                priority: 4
              }
            ]
          },
          {
            id: 'matters-statistics',
            pattern: ['matters', 'statistics'],
            description: 'Matter statistics and counts',
            isLeaf: true,
            priority: 2
          },
          {
            id: 'matters-status-counts',
            pattern: ['matters', 'status-counts'],
            description: 'Status distribution counts',
            isLeaf: true,
            priority: 3
          },
          {
            id: 'matters-assigned',
            pattern: ['matters', 'assigned'],
            description: 'Assigned matters queries',
            priority: 3,
            children: [
              {
                id: 'matters-assigned-lawyer',
                pattern: ['matters', 'assigned', this.WILDCARD],
                description: 'Matters assigned to specific lawyer',
                isLeaf: true,
                priority: 5
              }
            ]
          }
        ]
      },
      
      // User-related patterns
      {
        id: 'users-root',
        pattern: ['users'],
        description: 'All user-related queries',
        priority: 1,
        children: [
          {
            id: 'users-profile',
            pattern: ['users', 'profile'],
            description: 'User profile queries',
            priority: 2,
            children: [
              {
                id: 'users-profile-specific',
                pattern: ['users', 'profile', this.WILDCARD],
                description: 'Specific user profile',
                isLeaf: true,
                priority: 4
              }
            ]
          }
        ]
      },
      
      // Real-time patterns
      {
        id: 'realtime-root',
        pattern: ['realtime'],
        description: 'Real-time data queries',
        priority: 1,
        children: [
          {
            id: 'realtime-notifications',
            pattern: ['realtime', 'notifications'],
            description: 'Real-time notifications',
            isLeaf: true,
            priority: 2
          },
          {
            id: 'realtime-presence',
            pattern: ['realtime', 'presence'],
            description: 'User presence information',
            isLeaf: true,
            priority: 1
          }
        ]
      }
    ]
    
    // Register all patterns
    this.registerPatterns(patterns)
  }

  /**
   * Register query key patterns
   */
  private registerPatterns(patterns: QueryKeyPattern[], parent?: QueryKeyPattern) {
    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern)
      
      if (pattern.children) {
        this.registerPatterns(pattern.children, pattern)
      }
    }
  }

  /**
   * Find patterns that match a given query key
   */
  findMatchingPatterns(queryKey: QueryKey): QueryKeyPattern[] {
    const matches: QueryKeyPattern[] = []
    
    for (const pattern of this.patterns.values()) {
      if (this.matchesPattern(queryKey, pattern.pattern)) {
        matches.push(pattern)
      }
    }
    
    // Sort by priority (higher first)
    return matches.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * Check if a query key matches a pattern
   */
  private matchesPattern(queryKey: QueryKey, pattern: (string | symbol)[]): boolean {
    if (queryKey.length < pattern.length) {
      return false
    }
    
    for (let i = 0; i < pattern.length; i++) {
      const patternPart = pattern[i]
      const keyPart = queryKey[i]
      
      if (patternPart === this.WILDCARD) {
        continue // Wildcard matches anything
      }
      
      if (patternPart !== keyPart) {
        return false
      }
    }
    
    return true
  }

  /**
   * Get invalidation targets for a specific change type
   */
  getInvalidationTargets(changeType: string, context: any = {}): InvalidationTarget[] {
    const targets: InvalidationTarget[] = []
    
    switch (changeType) {
      case 'matter_created':
        targets.push(
          { queryKey: ['matters', 'list'], type: 'prefix', refetch: true },
          { queryKey: ['matters', 'statistics'], type: 'exact', refetch: true },
          { queryKey: ['matters', 'status-counts'], type: 'exact', refetch: true }
        )
        break
        
      case 'matter_updated':
        const matterId = context.matterId
        targets.push(
          { queryKey: ['matters', 'detail', matterId], type: 'exact', refetch: true },
          { queryKey: ['matters', 'list'], type: 'prefix', refetch: false },
          { queryKey: ['matters', 'search'], type: 'prefix', refetch: false }
        )
        break
        
      case 'matter_status_changed':
        targets.push(
          { queryKey: ['matters', 'status-counts'], type: 'exact', refetch: true },
          { queryKey: ['matters', 'list'], type: 'prefix', refetch: false }
        )
        
        // Invalidate assigned matters if assignment changed
        if (context.oldAssignee) {
          targets.push({
            queryKey: ['matters', 'assigned', context.oldAssignee],
            type: 'exact',
            refetch: true
          })
        }
        if (context.newAssignee) {
          targets.push({
            queryKey: ['matters', 'assigned', context.newAssignee],
            type: 'exact',
            refetch: true
          })
        }
        break
        
      case 'matter_deleted':
        const deletedMatterId = context.matterId
        targets.push(
          { queryKey: ['matters', 'detail', deletedMatterId], type: 'exact', refetch: false },
          { queryKey: ['matters', 'list'], type: 'prefix', refetch: true },
          { queryKey: ['matters', 'statistics'], type: 'exact', refetch: true },
          { queryKey: ['matters', 'status-counts'], type: 'exact', refetch: true }
        )
        break
        
      case 'matter_assigned':
      case 'matter_unassigned':
        const lawyerId = context.lawyerId
        targets.push(
          { queryKey: ['matters', 'assigned', lawyerId], type: 'exact', refetch: true },
          { queryKey: ['matters', 'list'], type: 'prefix', refetch: false }
        )
        break
        
      case 'bulk_operation':
        // Invalidate everything for bulk operations
        targets.push(
          { queryKey: ['matters'], type: 'prefix', refetch: true }
        )
        break
        
      case 'search_index_updated':
        targets.push(
          { queryKey: ['matters', 'search'], type: 'prefix', refetch: false }
        )
        break
    }
    
    return targets
  }

  /**
   * Get hierarchical invalidation plan
   */
  getHierarchicalInvalidationPlan(queryKey: QueryKey): {
    immediate: InvalidationTarget[]
    cascade: InvalidationTarget[]
    optional: InvalidationTarget[]
  } {
    const immediate: InvalidationTarget[] = []
    const cascade: InvalidationTarget[] = []
    const optional: InvalidationTarget[] = []
    
    const matchingPatterns = this.findMatchingPatterns(queryKey)
    
    for (const pattern of matchingPatterns) {
      const target: InvalidationTarget = {
        queryKey,
        type: 'exact',
        refetch: pattern.isLeaf || false
      }
      
      // Categorize based on priority
      if ((pattern.priority || 0) >= 5) {
        immediate.push(target)
      } else if ((pattern.priority || 0) >= 3) {
        cascade.push(target)
      } else {
        optional.push(target)
      }
    }
    
    return { immediate, cascade, optional }
  }

  /**
   * Create smart invalidation predicate
   */
  createInvalidationPredicate(
    changeType: string,
    context: any = {}
  ): (queryKey: QueryKey) => boolean {
    return (queryKey: QueryKey) => {
      // Base pattern matching
      const baseMatch = this.findMatchingPatterns(queryKey).length > 0
      if (!baseMatch) {
        return false
      }
      
      // Context-specific filtering
      switch (changeType) {
        case 'matter_status_changed':
          // Only invalidate queries related to the affected statuses
          if (queryKey[0] === 'matters' && queryKey[1] === 'list') {
            const filters = queryKey[2] as any
            if (filters?.status) {
              const affectedStatuses = [context.oldStatus, context.newStatus].filter(Boolean)
              return filters.status.some((s: MatterStatus) => affectedStatuses.includes(s))
            }
          }
          return true
          
        case 'matter_assigned':
          // Only invalidate queries related to the affected lawyer
          if (queryKey[0] === 'matters' && queryKey[1] === 'assigned') {
            return queryKey[2] === context.lawyerId
          }
          if (queryKey[0] === 'matters' && queryKey[1] === 'list') {
            const filters = queryKey[2] as any
            return !filters?.assignedLawyer || filters.assignedLawyer === context.lawyerId
          }
          return true
          
        default:
          return true
      }
    }
  }

  /**
   * Register custom pattern
   */
  addCustomPattern(pattern: QueryKeyPattern) {
    this.patterns.set(pattern.id, pattern)
  }

  /**
   * Remove pattern
   */
  removePattern(id: string) {
    this.patterns.delete(id)
  }

  /**
   * Get all registered patterns
   */
  getAllPatterns(): QueryKeyPattern[] {
    return Array.from(this.patterns.values())
  }

  /**
   * Debug utility to show pattern matches for a query key
   */
  debugPatternMatches(queryKey: QueryKey): {
    queryKey: QueryKey
    matches: Array<{ pattern: QueryKeyPattern; score: number }>
    recommendations: string[]
  } {
    const matches = this.findMatchingPatterns(queryKey).map(pattern => ({
      pattern,
      score: pattern.priority || 0
    }))
    
    const recommendations: string[] = []
    
    if (matches.length === 0) {
      recommendations.push('Consider adding a custom pattern for this query key')
    }
    
    if (matches.length > 5) {
      recommendations.push('Query key matches many patterns - consider more specific patterns')
    }
    
    if (matches.some(m => !m.pattern.isLeaf) && matches.some(m => m.pattern.isLeaf)) {
      recommendations.push('Mix of leaf and non-leaf patterns - verify invalidation behavior')
    }
    
    return {
      queryKey,
      matches,
      recommendations
    }
  }
}

// Global instance
export const queryKeyHierarchy = new QueryKeyHierarchy()

/**
 * Utility functions for common invalidation patterns
 */
export const InvalidationPatterns = {
  /**
   * Create cascade invalidation for matter changes
   */
  matterCascade: (matterId: string, includeSearch = false): InvalidationTarget[] => {
    const targets: InvalidationTarget[] = [
      { queryKey: ['matters', 'detail', matterId], type: 'exact', refetch: true },
      { queryKey: ['matters', 'list'], type: 'prefix', refetch: false },
      { queryKey: ['matters', 'status-counts'], type: 'exact', refetch: true }
    ]
    
    if (includeSearch) {
      targets.push({ queryKey: ['matters', 'search'], type: 'prefix', refetch: false })
    }
    
    return targets
  },

  /**
   * Create status-specific invalidation
   */
  statusChange: (oldStatus: MatterStatus, newStatus: MatterStatus): InvalidationTarget[] => {
    return [
      { queryKey: ['matters', 'status-counts'], type: 'exact', refetch: true },
      {
        queryKey: ['matters', 'list'],
        type: 'partial',
        predicate: (qk) => {
          const filters = qk[2] as any
          return !filters?.status || 
                 filters.status.includes(oldStatus) || 
                 filters.status.includes(newStatus)
        }
      }
    ]
  },

  /**
   * Create assignment-specific invalidation
   */
  assignmentChange: (lawyerId: string): InvalidationTarget[] => {
    return [
      { queryKey: ['matters', 'assigned', lawyerId], type: 'exact', refetch: true },
      {
        queryKey: ['matters', 'list'],
        type: 'partial',
        predicate: (qk) => {
          const filters = qk[2] as any
          return !filters?.assignedLawyer || filters.assignedLawyer === lawyerId
        }
      }
    ]
  }
}