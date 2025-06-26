/**
 * TanStack Query Type Definitions
 * 
 * @description Type-safe query key factory and options for TanStack Query
 * integration in the legal case management system.
 */

import type { QueryKey } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { MatterStatus, MatterPriority } from './matter'

// Re-export Matter from matter.ts to fix import issues
export type { Matter } from './matter'

/**
 * Query Key Factory
 * 
 * Centralized query key generation for consistent cache management
 * and invalidation patterns.
 */
export const queryKeys = {
  // Matters
  matters: {
    all: ['matters'] as const,
    lists: () => [...queryKeys.matters.all, 'list'] as const,
    list: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.matters.lists(), { filters }] as const,
    details: () => [...queryKeys.matters.all, 'detail'] as const,
    detail: (id: MaybeRef<string>) => [...queryKeys.matters.details(), id] as const,
    
    // Infinite queries
    infinite: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.matters.all, 'infinite', { filters }] as const,
    
    // Sub-resources
    documents: (matterId: MaybeRef<string>) => [...queryKeys.matters.detail(matterId), 'documents'] as const,
    timeline: (matterId: MaybeRef<string>) => [...queryKeys.matters.detail(matterId), 'timeline'] as const,
    activities: (matterId: MaybeRef<string>) => [...queryKeys.matters.detail(matterId), 'activities'] as const,
    
    // Statistics and aggregates
    statistics: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.matters.all, 'statistics', { filters }] as const,
    statusCounts: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.matters.all, 'status-counts', { filters }] as const,
    priorityCounts: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.matters.all, 'priority-counts', { filters }] as const,
    
    // Search and suggestions
    search: (query: MaybeRef<string>, filters?: MaybeRef<MatterFilters>) => 
      [...queryKeys.matters.all, 'search', { query, filters }] as const,
    suggestions: (query: MaybeRef<string>) => [...queryKeys.matters.all, 'suggestions', { query }] as const,
    
    // Filter management
    filterPreferences: (userId: MaybeRef<string>) => [...queryKeys.matters.all, 'filter-preferences', userId] as const,
    
    // User-specific
    userMatters: (userId: MaybeRef<string>) => [...queryKeys.matters.all, 'user', userId] as const,
    assignedMatters: (lawyerId: MaybeRef<string>) => [...queryKeys.matters.all, 'assigned', lawyerId] as const,
    
    // Real-time subscriptions
    subscription: (type: string, params?: Record<string, any>) => 
      [...queryKeys.matters.all, 'subscription', type, params] as const,
  },
  
  // Kanban
  kanban: {
    all: ['kanban'] as const,
    board: () => [...queryKeys.kanban.all, 'board'] as const,
    column: (status: string) => [...queryKeys.kanban.all, 'column', status] as const,
  },
  
  // Activity
  activity: {
    all: ['activity'] as const,
    recent: () => [...queryKeys.activity.all, 'recent'] as const,
    user: (userId: string) => [...queryKeys.activity.all, 'user', userId] as const,
  },
  
  // Legacy aliases for backward compatibility
  all: ['matters'] as const,
  lists: () => [...queryKeys.matters.all, 'list'] as const,
  list: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.matters.lists(), { filters }] as const,
  details: () => [...queryKeys.matters.all, 'detail'] as const,
  detail: (id: MaybeRef<string>) => [...queryKeys.matters.details(), id] as const,
  statusCounts: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.matters.all, 'status-counts', { filters }] as const,
} as const

/**
 * Filter options for matter queries
 */
export interface MatterFilters {
  status?: string | string[]
  priority?: string | string[]
  assigneeId?: string
  clientId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  tags?: string[]
  sort?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title'
  order?: 'asc' | 'desc'
  limit?: number
  page?: number
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number
  limit: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Query options for matter lists
 */
export interface MatterListQueryOptions {
  filters?: MaybeRef<MatterFilters>
  pagination?: MaybeRef<PaginationOptions>
  enabled?: MaybeRef<boolean>
}

/**
 * Query options for single matter
 */
export interface MatterDetailQueryOptions {
  id: MaybeRef<string>
  includeDocuments?: boolean
  includeTimeline?: boolean
  includeActivities?: boolean
  enabled?: MaybeRef<boolean>
}

/**
 * Search suggestion structure
 */
export interface SearchSuggestion {
  id: string
  text: string
  type: 'matter' | 'client' | 'tag' | 'status' | 'priority'
  count?: number
  relevance?: number
}

/**
 * Matter statistics for dashboard and analytics
 */
export interface MatterStatistics {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  byAssignee: Record<string, number>
  recentActivity: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  averageResolutionTime: number
  trends: {
    period: string
    created: number
    completed: number
    overdue: number
  }[]
}

/**
 * Filter state management
 */
export interface FilterState {
  id: string
  userId: string
  name: string
  filters: MatterFilters
  isDefault: boolean
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Query error structure
 */
export interface QueryError {
  message: string
  code?: string
  status?: number
  details?: Record<string, any>
}

/**
 * Input types for mutations
 */
export interface CreateMatterInput {
  title: string
  description?: string
  status?: string
  priority?: string
  assigneeId?: string
  clientId?: string
  dueDate?: string
  tags?: string[]
}

export interface UpdateMatterInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  assigneeId?: string
  clientId?: string
  dueDate?: string
  tags?: string[]
}

export interface MoveMatterInput {
  matterId: string
  newStatus: string
  position?: number
}

/**
 * Subscription event types for real-time updates
 */
export interface SubscriptionEvent {
  type: 'matter_created' | 'matter_updated' | 'matter_deleted' | 'matter_moved'
  payload: {
    matterId: string
    matter?: Matter
    changes?: Partial<Matter>
    userId: string
    timestamp: string
  }
}

/**
 * Query persistence options
 */
export interface QueryPersistenceOptions {
  cacheTime?: number
  maxAge?: number
  compression?: boolean
  encryption?: boolean
}

/**
 * Mutation input types
 */
export interface CreateMatterInput {
  title: string
  description?: string
  priority: MatterPriority
  status?: MatterStatus
  assignedLawyer?: string
  clientId?: string
  dueDate?: Date
  tags?: string[]
}

export interface UpdateMatterInput {
  title?: string
  description?: string
  priority?: MatterPriority
  status?: MatterStatus
  assignedLawyer?: string
  clientId?: string
  dueDate?: Date
  tags?: string[]
}

export interface MoveMatterInput {
  matterId: string
  newStatus: MatterStatus
  newPosition: number
}

/**
 * Query error types
 */
export interface QueryError {
  message: string
  code?: string
  status?: number
  details?: Record<string, any>
}

/**
 * Type guard for query errors
 */
export function isQueryError(error: unknown): error is QueryError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}

/**
 * Utility type for extracting data type from query function
 */
export type InferQueryData<TQueryFn> = TQueryFn extends (...args: any[]) => Promise<infer TData>
  ? TData
  : never

/**
 * Utility type for query options with proper typing
 */
export type QueryOptions<TData = unknown, TError = QueryError> = {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  enabled?: MaybeRef<boolean>
  staleTime?: number
  gcTime?: number
  refetchInterval?: number | false
  refetchOnWindowFocus?: boolean | 'always'
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
}

/**
 * Type for the query keys factory
 */
export type QueryKeys = typeof queryKeys