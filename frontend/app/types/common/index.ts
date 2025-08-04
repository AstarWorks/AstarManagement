/**
 * Common Types - Centralized exports
 * 
 * This file provides centralized access to all common types
 * shared across the Astar Management application.
 */

// UI component types
export type {
  ValidationError,
  FormState,
  LoadingState,
  ProgressLoadingState,
  TableColumn,
  TableSort,
  FilterOption,
  PaginationState,
  DateRange,
  ModalState,
  ToastNotification,
  SearchState,
  FileUploadState,
  SelectState,
  DataTableState,
  ThemeConfig,
  Breakpoints,
  AsyncResult
} from './ui'

// Validation types
export type {
  ValidationRule,
  FieldValidationRules,
  ValidationSchema,
  FieldValidationResult,
  FormValidationResult,
  ExpenseValidationRules,
  TagValidationRules,
  AsyncValidationRule,
  AsyncValidationResult,
  CrossFieldValidationRule,
  ConditionalValidationRule,
  DynamicValidationSchema,
  ValidationEvent,
  ValidationContext,
  ServerValidationError,
  ReactiveValidationState
} from './validation'

export {
  ValidationErrorCode
} from './validation'

export type {
  ValidationConfig
} from './validation'

// API types
export type {
  HttpMethod,
  ApiRequestConfig,
  ApiResponse,
  ApiError,
  ValidationErrorResponse,
  PaginationParams,
  SortParams,
  ListRequestParams,
  ApiClientConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ApiEndpoint,
  BatchRequest,
  BatchResponseItem,
  FileUploadConfig,
  WebSocketMessage,
  WebSocketConfig,
  CacheConfig,
  RouteParams,
  QueryParams,
  ApiHookResult
} from './api'

export {
  HttpStatusCode
} from './api'