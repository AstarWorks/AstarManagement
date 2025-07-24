/**
 * Common Base Type Definitions
 * 
 * @description Base interfaces and types used across the application
 * for consistent entity structure and auditing.
 * 
 * @author Claude
 * @created 2025-07-03
 */

// Base entity interface with required fields
export interface BaseEntity {
  /** Unique identifier */
  id: string
  
  /** Creation timestamp */
  createdAt: Date
  
  /** Last update timestamp */
  updatedAt: Date
}

// Auditable entity with user tracking
export interface AuditableEntity {
  /** User who created the entity */
  createdBy: string
  
  /** User who last updated the entity */
  updatedBy: string
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// Pagination metadata
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// Error response
export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: Record<string, unknown>
}