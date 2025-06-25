/**
 * TanStack Query Type Definitions
 * 
 * @description Type-safe query key factory and options for TanStack Query
 * integration in the legal case management system.
 */

import type { QueryKey } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Matter, MatterStatus, MatterPriority } from './matter'

/**
 * Query Key Factory
 * 
 * Centralized query key generation for consistent cache management
 * and invalidation patterns.
 */
export const queryKeys = {
  all: ['matters'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters?: MaybeRef<MatterFilters>) => [...queryKeys.lists(), { filters }] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: MaybeRef<string>) => [...queryKeys.details(), id] as const,
  
  // Sub-resources
  documents: (matterId: MaybeRef<string>) => [...queryKeys.detail(matterId), 'documents'] as const,
  timeline: (matterId: MaybeRef<string>) => [...queryKeys.detail(matterId), 'timeline'] as const,
  activities: (matterId: MaybeRef<string>) => [...queryKeys.detail(matterId), 'activities'] as const,
  
  // Statistics and aggregates
  statistics: () => [...queryKeys.all, 'statistics'] as const,
  statusCounts: () => [...queryKeys.statistics(), 'status-counts'] as const,
  priorityCounts: () => [...queryKeys.statistics(), 'priority-counts'] as const,
  
  // Search
  search: (query: MaybeRef<string>) => [...queryKeys.all, 'search', { query }] as const,
  
  // User-specific
  userMatters: (userId: MaybeRef<string>) => [...queryKeys.all, 'user', userId] as const,
  assignedMatters: (lawyerId: MaybeRef<string>) => [...queryKeys.all, 'assigned', lawyerId] as const,
} as const

/**
 * Filter options for matter queries
 */
export interface MatterFilters {
  status?: MatterStatus[]
  priority?: MatterPriority[]
  assignedLawyer?: string
  clientId?: string
  search?: string
  dateFrom?: Date
  dateTo?: Date
  tags?: string[]
  sort?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority'
  order?: 'asc' | 'desc'
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