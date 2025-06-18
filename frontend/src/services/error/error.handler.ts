/**
 * Error handler for API responses
 * 
 * Handles:
 * - RFC 7807 Problem+JSON error parsing
 * - Error type mapping to user-friendly messages
 * - Specific HTTP status code handling
 * - Error logging and correlation tracking
 */

import { AxiosError } from 'axios'
import { ApiError, ProblemDetail } from '../api/client'

// Frontend error types
export interface BoardError {
  type: ErrorType
  message: string
  details?: string
  timestamp: string
  action?: ErrorAction
  correlationId?: string
  canRetry?: boolean
}

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorAction {
  RETRY = 'RETRY',
  LOGIN = 'LOGIN',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  CHECK_INPUT = 'CHECK_INPUT',
  REFRESH_PAGE = 'REFRESH_PAGE',
  NONE = 'NONE'
}

// Error message mappings
const ERROR_MESSAGES: Record<number, string> = {
  400: 'The request data is invalid. Please check your input and try again.',
  401: 'Authentication required. Please log in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data. Please check for duplicates.',
  422: 'The data could not be processed. Please check your input.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The request timed out. Please try again.'
}

// Problem type to error type mapping
const PROBLEM_TYPE_MAPPING: Record<string, ErrorType> = {
  'about:blank': ErrorType.UNKNOWN,
  'urn:problem-type:authentication-required': ErrorType.AUTHENTICATION,
  'urn:problem-type:insufficient-permissions': ErrorType.AUTHORIZATION,
  'urn:problem-type:validation-error': ErrorType.VALIDATION,
  'urn:problem-type:resource-not-found': ErrorType.NOT_FOUND,
  'urn:problem-type:conflict': ErrorType.CONFLICT,
  'urn:problem-type:server-error': ErrorType.SERVER
}

/**
 * Map HTTP status code to error type
 */
function mapErrorType(status?: number, problemType?: string): ErrorType {
  // First try to map by problem type if available
  if (problemType && PROBLEM_TYPE_MAPPING[problemType]) {
    return PROBLEM_TYPE_MAPPING[problemType]
  }
  
  // Fall back to status code mapping
  switch (status) {
    case 400:
    case 422:
      return ErrorType.VALIDATION
    case 401:
      return ErrorType.AUTHENTICATION
    case 403:
      return ErrorType.AUTHORIZATION
    case 404:
      return ErrorType.NOT_FOUND
    case 409:
      return ErrorType.CONFLICT
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER
    default:
      return ErrorType.UNKNOWN
  }
}

/**
 * Get suggested action based on error type and status
 */
function getErrorAction(status?: number, errorType?: ErrorType): ErrorAction {
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      return ErrorAction.LOGIN
    case ErrorType.AUTHORIZATION:
      return ErrorAction.CONTACT_SUPPORT
    case ErrorType.VALIDATION:
      return ErrorAction.CHECK_INPUT
    case ErrorType.NETWORK:
    case ErrorType.SERVER:
      return ErrorAction.RETRY
    case ErrorType.CONFLICT:
      return ErrorAction.CHECK_INPUT
    default:
      // Status-based fallback
      switch (status) {
        case 401:
          return ErrorAction.LOGIN
        case 403:
          return ErrorAction.CONTACT_SUPPORT
        case 400:
        case 422:
          return ErrorAction.CHECK_INPUT
        case 500:
        case 502:
        case 503:
        case 504:
          return ErrorAction.RETRY
        default:
          return ErrorAction.NONE
      }
  }
}

/**
 * Check if error is retryable
 */
function isRetryable(status?: number): boolean {
  // Network errors and server errors are generally retryable
  return !status || status >= 500 || status === 429
}

/**
 * Parse RFC 7807 Problem+JSON error response
 */
export function handleApiError(error: any): BoardError {
  const timestamp = new Date().toISOString()
  
  // Handle network errors (no response)
  if (!error.response) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network error. Please check your connection and try again.',
      timestamp,
      action: ErrorAction.RETRY,
      canRetry: true
    }
  }
  
  // Handle AxiosError with response
  if (error.response) {
    const status = error.response.status
    const problemDetail = error.response.data as ProblemDetail
    
    const errorType = mapErrorType(status, problemDetail?.type)
    const action = getErrorAction(status, errorType)
    const canRetry = isRetryable(status)
    
    return {
      type: errorType,
      message: problemDetail?.title || ERROR_MESSAGES[status] || 'An unexpected error occurred.',
      details: problemDetail?.detail,
      timestamp,
      action,
      correlationId: error.correlationId,
      canRetry
    }
  }
  
  // Handle ApiError instances
  if (error.name === 'ApiError' && error.problemDetail) {
    const { status, problemDetail, correlationId } = error as ApiError
    const errorType = mapErrorType(status, problemDetail?.type)
    const action = getErrorAction(status, errorType)
    const canRetry = isRetryable(status)
    
    return {
      type: errorType,
      message: problemDetail?.title || ERROR_MESSAGES[status || 0] || 'An unexpected error occurred.',
      details: problemDetail?.detail,
      timestamp,
      action,
      correlationId,
      canRetry
    }
  }
  
  // Handle generic errors
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'An unexpected error occurred.',
    timestamp,
    action: ErrorAction.NONE,
    canRetry: false
  }
}

/**
 * Get user-friendly error message for specific contexts
 */
export function getContextualErrorMessage(error: BoardError, context: 'login' | 'matter' | 'general' = 'general'): string {
  switch (context) {
    case 'login':
      switch (error.type) {
        case ErrorType.AUTHENTICATION:
          return 'Invalid email or password. Please check your credentials and try again.'
        case ErrorType.NETWORK:
          return 'Unable to connect to the server. Please check your internet connection.'
        case ErrorType.SERVER:
          return 'Login service is temporarily unavailable. Please try again in a few minutes.'
        default:
          return error.message
      }
    
    case 'matter':
      switch (error.type) {
        case ErrorType.VALIDATION:
          return 'Please check the matter information and ensure all required fields are filled correctly.'
        case ErrorType.CONFLICT:
          return 'A matter with this case number already exists. Please use a different case number.'
        case ErrorType.AUTHORIZATION:
          return 'You do not have permission to perform this action on this matter.'
        case ErrorType.NOT_FOUND:
          return 'The matter was not found. It may have been deleted or you may not have access to it.'
        default:
          return error.message
      }
    
    default:
      return error.message
  }
}

/**
 * Log error for debugging and monitoring
 */
export function logError(error: BoardError, context?: string): void {
  const logData = {
    ...error,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  }
  
  console.error('Application Error:', logData)
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service (e.g., Sentry, LogRocket)
    // sendToMonitoringService(logData)
  }
}

/**
 * Create standardized error for UI components
 */
export function createUIError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  action: ErrorAction = ErrorAction.NONE
): BoardError {
  return {
    type,
    message,
    timestamp: new Date().toISOString(),
    action,
    canRetry: type === ErrorType.NETWORK || type === ErrorType.SERVER
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Check if error is retryable
      const boardError = handleApiError(error)
      if (!boardError.canRetry) {
        throw error
      }
      
      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}