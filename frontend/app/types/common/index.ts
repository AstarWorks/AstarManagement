/**
 * Common Types - Centralized exports
 * 
 * This file provides centralized access to all common types
 * shared across the Astar Management application.
 */

// UI component types
export type {
  IValidationError,
  IFormState,
  ILoadingState,
  IProgressLoadingState,
  ITableColumn,
  ITableSort,
  IFilterOption,
  IPaginationState,
  IDateRange,
  IModalState,
  IToastNotification,
  ISearchState,
  IFileUploadState,
  ISelectState,
  IDataTableState,
  IThemeConfig,
  IBreakpoints,
  IAsyncResult
} from './ui'

// Validation types
export type {
  ValidationRule,
  IFieldValidationRules,
  ValidationSchema,
  IFieldValidationResult,
  IFormValidationResult,
  IExpenseValidationRules,
  ITagValidationRules,
  AsyncValidationRule,
  IAsyncValidationResult,
  ICrossFieldValidationRule,
  IConditionalValidationRule,
  DynamicValidationSchema,
  ValidationEvent,
  IValidationContext,
  IServerValidationError,
  IReactiveValidationState
} from './validation'

export {
  ValidationErrorCode
} from './validation'

export type {
  IValidationConfig
} from './validation'

// API types
export type {
  HttpMethod,
  IApiRequestConfig,
  IApiResponse,
  IApiError,
  IValidationErrorResponse,
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
} from './api'

export {
  HttpStatusCode
} from './api'