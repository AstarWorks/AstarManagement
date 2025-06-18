/**
 * Shared API types and interfaces
 * 
 * Centralized type definitions for API communication
 * ensuring consistency across all services
 */

// Re-export types from individual services for convenience
export type {
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  UserInfoResponse,
  AuthenticationResponse,
  SessionInfo
} from '../auth/auth.service'

export type {
  MatterDto,
  CreateMatterRequest,
  UpdateMatterRequest,
  UpdateMatterStatusRequest,
  PagedResponse,
  MatterFilters,
  PaginationParams
} from './matter.service'

export {
  MatterStatus,
  MatterPriority
} from './matter.service'

export type {
  ProblemDetail,
  ApiError
} from './client'

export type {
  BoardError,
  ErrorType,
  ErrorAction
} from '../error/error.handler'

// Common API response wrapper
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
  correlationId?: string
}

// Common pagination metadata
export interface PaginationMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  numberOfElements: number
}

// Sorting configuration
export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Generic filter interface
export interface BaseFilter {
  search?: string
  dateFrom?: string
  dateTo?: string
}

// Audit information
export interface AuditInfo {
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

// Health check response
export interface HealthCheck {
  status: 'UP' | 'DOWN'
  service: string
  timestamp: string
  details?: Record<string, any>
}