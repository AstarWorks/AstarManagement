/**
 * ApiError Class
 * Custom error class for API-related errors with enhanced error information
 */

import type { IApiErrorDetails } from '../types'

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown
  public readonly timestamp: string
  public readonly path?: string

  constructor(errorDetails: IApiErrorDetails) {
    super(errorDetails.message)
    this.name = 'ApiError'
    this.statusCode = errorDetails.statusCode
    this.code = errorDetails.code
    this.details = errorDetails.details
    this.timestamp = errorDetails.timestamp || new Date().toISOString()
    this.path = errorDetails.path

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return [408, 429, 500, 502, 503, 504].includes(this.statusCode)
  }

  /**
   * Check if error is authentication related
   */
  isAuthError(): boolean {
    return [401, 403].includes(this.statusCode)
  }

  /**
   * Convert to plain object for logging/serialization
   */
  toJSON(): IApiErrorDetails {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      path: this.path
    }
  }

  /**
   * Create ApiError from unknown error
   */
  static fromUnknown(error: unknown, defaultMessage = 'An unknown error occurred'): ApiError {
    if (error instanceof ApiError) {
      return error
    }

    if (error instanceof Error) {
      return new ApiError({
        message: error.message || defaultMessage,
        statusCode: 500,
        code: 'UNKNOWN_ERROR',
        details: {
          name: error.name,
          stack: error.stack
        }
      })
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>
      return new ApiError({
        message: (errorObj.message as string) || (errorObj.data as Record<string, unknown>)?.message as string || defaultMessage,
        statusCode: (errorObj.statusCode as number) || (errorObj.status as number) || 500,
        code: (errorObj.code as string) || 'UNKNOWN_ERROR',
        details: errorObj.details || errorObj.data || error
      })
    }

    return new ApiError({
      message: defaultMessage,
      statusCode: 500,
      code: 'UNKNOWN_ERROR',
      details: error
    })
  }
}