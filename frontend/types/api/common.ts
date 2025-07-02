/**
 * Common API Types and Utilities
 * 
 * Shared types used across the API layer
 */

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  data: T
  success: boolean
  timestamp: string
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number // Current page (0-indexed)
  first: boolean
  last: boolean
  empty: boolean
  numberOfElements: number
  pageable: Pageable
  sort: Sort
}

/**
 * Pageable request parameters
 */
export interface Pageable {
  sort: Sort
  offset: number
  pageNumber: number
  pageSize: number
  paged: boolean
  unpaged: boolean
}

/**
 * Sort configuration
 */
export interface Sort {
  empty: boolean
  sorted: boolean
  unsorted: boolean
  orders: SortOrder[]
}

/**
 * Individual sort order
 */
export interface SortOrder {
  direction: 'ASC' | 'DESC'
  property: string
  ignoreCase: boolean
  nullHandling: 'NATIVE' | 'NULLS_FIRST' | 'NULLS_LAST'
  ascending: boolean
  descending: boolean
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: ErrorDetail[]
    timestamp?: string
    path?: string
  }
}

/**
 * Error detail for validation errors
 */
export interface ErrorDetail {
  field: string
  message: string
  value?: unknown
  code?: string
}

/**
 * Audit metadata included in entities
 */
export interface AuditableEntity {
  createdDate: string // ISO 8601 date string
  createdBy?: UserSummary
  lastModifiedDate?: string
  lastModifiedBy?: UserSummary
  version?: number
}

/**
 * Soft-deletable entity
 */
export interface SoftDeletableEntity {
  deleted: boolean
  deletedDate?: string
  deletedBy?: UserSummary
}

/**
 * User summary for references
 */
export interface UserSummary {
  id: string
  name: string
  email: string
  avatar?: string
}

/**
 * Generic ID reference
 */
export interface EntityReference {
  id: string
  displayName: string
  type: string
}

/**
 * Date range for filtering
 */
export interface DateRange {
  from?: string // ISO 8601 date string
  to?: string   // ISO 8601 date string
}

/**
 * Common query parameters
 */
export interface CommonQueryParams {
  page?: number
  size?: number
  sort?: string | string[]
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string
  filename: string
  originalName: string
  contentType: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedAt: string
  uploadedBy: UserSummary
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T = unknown> {
  successful: T[]
  failed: BatchOperationError[]
  totalProcessed: number
  successCount: number
  failureCount: number
}

/**
 * Batch operation error
 */
export interface BatchOperationError {
  id: string
  error: string
  details?: Record<string, unknown>
}

/**
 * API Health check response
 */
export interface HealthCheckResponse {
  status: 'UP' | 'DOWN' | 'DEGRADED'
  version: string
  timestamp: string
  services: {
    database: ServiceHealth
    redis?: ServiceHealth
    storage?: ServiceHealth
    [key: string]: ServiceHealth | undefined
  }
}

/**
 * Individual service health
 */
export interface ServiceHealth {
  status: 'UP' | 'DOWN'
  responseTime?: number
  details?: Record<string, unknown>
}

/**
 * Notification preference
 */
export interface NotificationPreference {
  type: NotificationType
  enabled: boolean
  channels: NotificationChannel[]
}

/**
 * Notification types
 */
export type NotificationType = 
  | 'MATTER_ASSIGNED'
  | 'MATTER_STATUS_CHANGED'
  | 'DOCUMENT_UPLOADED'
  | 'MEMO_RECEIVED'
  | 'DEADLINE_APPROACHING'
  | 'COMMENT_ADDED'

/**
 * Notification channels
 */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH'

/**
 * Generic search request
 */
export interface SearchRequest {
  query: string
  filters?: Record<string, unknown>
  facets?: string[]
  page?: number
  size?: number
  sort?: string[]
}

/**
 * Generic search response
 */
export interface SearchResponse<T> {
  results: SearchResult<T>[]
  totalResults: number
  facets?: SearchFacet[]
  took: number // milliseconds
}

/**
 * Individual search result
 */
export interface SearchResult<T> {
  item: T
  score: number
  highlights?: Record<string, string[]>
}

/**
 * Search facet for filtering
 */
export interface SearchFacet {
  name: string
  values: FacetValue[]
}

/**
 * Facet value with count
 */
export interface FacetValue {
  value: string
  count: number
  selected?: boolean
}

/**
 * WebSocket message envelope
 */
export interface WebSocketMessage<T = unknown> {
  id: string
  type: string
  timestamp: string
  payload: T
  metadata?: Record<string, unknown>
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as any).error === 'object'
  )
}

/**
 * Type guard to check if entity is soft-deleted
 */
export function isSoftDeleted(entity: unknown): entity is SoftDeletableEntity {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'deleted' in entity &&
    (entity as any).deleted === true
  )
}

/**
 * Utility type to make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Utility type to make specified properties optional
 */
export type PartialOnly<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Extract pagination params from request
 */
export function extractPaginationParams(params: CommonQueryParams): Pageable {
  return {
    pageNumber: params.page || 0,
    pageSize: params.size || 20,
    sort: {
      empty: !params.sort,
      sorted: !!params.sort,
      unsorted: !params.sort,
      orders: params.sort ? parseSort(params.sort) : []
    },
    offset: (params.page || 0) * (params.size || 20),
    paged: true,
    unpaged: false
  }
}

/**
 * Parse sort parameter into sort orders
 */
function parseSort(sort: string | string[]): SortOrder[] {
  const sorts = Array.isArray(sort) ? sort : [sort]
  return sorts.map(s => {
    const [property, direction = 'ASC'] = s.split(',')
    return {
      property,
      direction: direction.toUpperCase() as 'ASC' | 'DESC',
      ignoreCase: false,
      nullHandling: 'NATIVE',
      ascending: direction.toUpperCase() === 'ASC',
      descending: direction.toUpperCase() === 'DESC'
    }
  })
}