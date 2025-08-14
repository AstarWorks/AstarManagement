/**
 * Types - Main Export Index
 * 
 * This is the main entry point for all TypeScript types in the
 * Astar Management application. Import types from this file
 * throughout the application.
 * 
 * @example
 * ```typescript
 * import type { Expense, ExpenseFormData, LoadingState } from '~/types'
 * ```
 */

// Re-export all expense types
export * from './expense'

// Re-export all common types (but avoid conflicts)
export * from './common/ui'
export type {
  ValidationRule,
  IFieldValidationRules,
  ValidationSchema,
  IFieldValidationResult,
  IExpenseValidationRules,
  ITagValidationRules,
  ValidationErrorCode,
  IValidationConfig,
  AsyncValidationRule,
  IAsyncValidationResult,
  ICrossFieldValidationRule,
  IConditionalValidationRule,
  DynamicValidationSchema
} from './common/validation'
export type {
  HttpMethod,
  IApiRequestConfig,
  IApiResponse,
  IApiError,
  IPaginationParams,
  ISortParams,
  IListRequestParams,
  IApiClientConfig,
  RequestInterceptor,
  ResponseInterceptor,
  IApiEndpoint,
  IBatchRequest,
  IBatchResponseItem,
  IFileUploadConfig,
  IWebSocketMessage,
  IWebSocketConfig,
  ICacheConfig,
  RouteParams,
  QueryParams,
  IApiHookResult
} from './common/api'

export {
  HttpStatusCode
} from './common/api'

// Re-export existing types (maintain compatibility)
export type {
  NavigationItem,
  NavigationItemConfig,
  BreadcrumbItem,
  RecentlyVisitedItem,
  NavigationState
} from './navigation'

export type {
  LoginCredentials,
  User,
  AuthState,
  SessionInfo,
  LoginResponse,
  AuthStatus
} from './auth'

export type {
  ICase,
  CaseStatus,
  CasePriority,
  ICaseActivity
} from './case'

export type {
  ICommonMessages,
  INavigationMessages,
  IAuthMessages,
  IDashboardMessages,
  LocaleMessages
} from './i18n'

// Type utilities for better DX
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Generic utility types
export type ID = string
export type Timestamp = string
export type DateString = string
export type EmailAddress = string
export type URL = string
export type HexColor = string

// Frontend-specific utility types
export type ComponentProps<T = Record<string, unknown>> = T & {
  class?: string
  style?: string | Record<string, string>
}

export type EventHandler<T = Event> = (event: T) => void | Promise<void>

export type Ref<T> = import('vue').Ref<T>
export type ComputedRef<T> = import('vue').ComputedRef<T>
export type MaybeRef<T> = T | Ref<T>

// API utilities
export type ApiEndpointUrl = string
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Form utilities
export type FormField<T> = {
  value: T
  error?: string
  touched: boolean
  valid: boolean
}

export type FormData<T extends Record<string, unknown>> = {
  [K in keyof T]: FormField<T[K]>
}

// State management utilities
export type StoreState<T> = {
  data: T
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export type StoreActions<T> = {
  fetch: () => Promise<void>
  create: (data: Partial<T>) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<void>
  reset: () => void
}

// Route utilities for Nuxt
export type RouteLocationRaw = import('vue-router').RouteLocationRaw
export type RouteLocationNormalized = import('vue-router').RouteLocationNormalized