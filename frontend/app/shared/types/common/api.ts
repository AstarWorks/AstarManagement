/**
 * Standard HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Standard HTTP status codes
 */
export enum HttpStatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * API request configuration
 */
export interface IApiRequestConfig {
  /** Request URL */
  url: string
  /** HTTP method */
  method: HttpMethod
  /** Request headers */
  headers?: Record<string, string>
  /** Request body */
  body?: Record<string, unknown> | FormData | string | null
  /** Query parameters */
  params?: Record<string, string | number | boolean>
  /** Request timeout in milliseconds */
  timeout?: number
  /** Whether to include credentials */
  withCredentials?: boolean
  /** Custom fetch options */
  fetchOptions?: RequestInit
}

/**
 * API response wrapper
 */
export interface IApiResponse<T = unknown> {
  /** Response data */
  data: T
  /** HTTP status code */
  status: number
  /** Status text */
  statusText: string
  /** Response headers */
  headers: Record<string, string>
  /** Request configuration that generated this response */
  config: IApiRequestConfig
}

/**
 * Standard error response format
 */
export interface IApiError {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Additional error details */
  details?: Record<string, unknown>
  /** HTTP status code */
  status?: number
  /** Timestamp when error occurred */
  timestamp?: string
  /** Request ID for tracing */
  requestId?: string
  /** Stack trace (development only) */
  stack?: string
}

/**
 * Validation error response
 */
export interface IValidationErrorResponse {
  /** Error code */
  code: string
  /** Main error message */
  message: string
  /** Field-specific errors */
  fieldErrors: {
    field: string
    message: string
    code: string
    value?: unknown
  }[]
  /** Timestamp */
  timestamp: string
}

/**
 * Pagination parameters for API requests
 */
export interface IPaginationParams {
  /** Page offset (0-based) */
  offset?: number
  /** Number of items per page */
  limit?: number
  /** Page number (1-based, alternative to offset) */
  page?: number
  /** Page size (alternative to limit) */
  size?: number
}

/**
 * Sorting parameters for API requests
 */
export interface ISortParams {
  /** Field to sort by */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'ASC' | 'DESC'
  /** Multiple sort fields (comma-separated) */
  sort?: string
}

/**
 * Generic list request parameters
 */
export interface IListRequestParams extends IPaginationParams, ISortParams {
  /** Search query */
  search?: string
  /** Additional filters */
  filters?: Record<string, unknown>
}

/**
 * API client configuration
 */
export interface IApiClientConfig {
  /** Base URL for all requests */
  baseURL: string
  /** Default timeout in milliseconds */
  timeout: number
  /** Default headers */
  headers: Record<string, string>
  /** Request interceptors */
  requestInterceptors: RequestInterceptor[]
  /** Response interceptors */
  responseInterceptors: ResponseInterceptor[]
  /** Error handler */
  errorHandler?: (error: IApiError) => void
  /** Retry configuration */
  retry?: {
    maxRetries: number
    retryDelay: number
    retryCondition: (error: IApiError) => boolean
  }
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (config: IApiRequestConfig) => Promise<IApiRequestConfig> | IApiRequestConfig

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = (response: IApiResponse) => Promise<IApiResponse> | IApiResponse

/**
 * API endpoint definition
 */
export interface IApiEndpoint {
  /** Endpoint path (can include parameters like :id) */
  path: string
  /** HTTP method */
  method: HttpMethod
  /** Request body schema validation */
  requestSchema?: Record<string, unknown>
  /** Response schema validation */
  responseSchema?: Record<string, unknown>
  /** Whether authentication is required */
  requiresAuth?: boolean
  /** Rate limiting configuration */
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
}

/**
 * Batch request configuration
 */
export interface IBatchRequest {
  /** Unique identifier for this request in the batch */
  id: string
  /** Request configuration */
  request: IApiRequestConfig
}

/**
 * Batch response item
 */
export interface IBatchResponseItem<T = unknown> {
  /** Request ID from the batch */
  id: string
  /** Response data if successful */
  data?: T
  /** Error if request failed */
  error?: IApiError
  /** HTTP status code */
  status: number
}

/**
 * File upload configuration
 */
export interface IFileUploadConfig {
  /** Upload endpoint URL */
  url: string
  /** Form field name for the file */
  fieldName: string
  /** Additional form data */
  formData?: Record<string, string>
  /** Upload progress callback */
  onProgress?: (progress: number) => void
  /** Allowed file types (MIME types) */
  allowedTypes?: string[]
  /** Maximum file size in bytes */
  maxSize?: number
  /** Whether to upload multiple files at once */
  multiple?: boolean
}

/**
 * WebSocket message types
 */
export interface IWebSocketMessage<T = unknown> {
  /** Message type */
  type: string
  /** Message payload */
  payload: T
  /** Message ID for tracking */
  id?: string
  /** Timestamp */
  timestamp?: string
}

/**
 * WebSocket configuration
 */
export interface IWebSocketConfig {
  /** WebSocket URL */
  url: string
  /** Connection protocols */
  protocols?: string[]
  /** Auto-reconnect configuration */
  autoReconnect?: {
    enabled: boolean
    maxRetries: number
    retryDelay: number
  }
  /** Heartbeat configuration */
  heartbeat?: {
    enabled: boolean
    interval: number
    message: string
  }
}

/**
 * Cache configuration for API responses
 */
export interface ICacheConfig {
  /** Cache key generator */
  keyGenerator?: (config: IApiRequestConfig) => string
  /** Cache TTL in milliseconds */
  ttl?: number
  /** Maximum cache size */
  maxSize?: number
  /** Cache storage type */
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
  /** Whether to use stale-while-revalidate strategy */
  staleWhileRevalidate?: boolean
}

/**
 * API route parameter types
 */
export type RouteParams = Record<string, string | number>

/**
 * Query parameter types
 */
export type QueryParams = Record<string, string | number | boolean | string[] | number[] | undefined>

/**
 * API hook return type for async operations
 */
export interface IApiHookResult<T> {
  /** Response data */
  data: T | null
  /** Loading state */
  loading: boolean
  /** Error state */
  error: IApiError | null
  /** Function to trigger refetch */
  refetch: () => Promise<void>
  /** Function to mutate data optimistically */
  mutate: (data: T) => void
}