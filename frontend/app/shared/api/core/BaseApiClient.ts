/**
 * BaseApiClient
 * Abstract base class providing common functionality for API clients
 * Includes retry logic, error handling, and request management
 */

import type { IApiConfig, IRequestOptions } from '../types'
import { ApiError } from './ApiError'

export abstract class BaseApiClient {
  protected baseURL: string
  protected timeout: number
  protected retryCount: number
  protected headers: Record<string, string>

  constructor(config: IApiConfig) {
    this.baseURL = config.baseUrl
    this.timeout = config.timeout
    this.retryCount = config.retryCount
    this.headers = config.headers || {}
  }

  /**
   * Handle request with retry logic and error transformation
   */
  protected async handleRequest<T>(
    fn: () => Promise<T>,
    options?: IRequestOptions
  ): Promise<T> {
    try {
      return await this.withRetry(fn, options?.retryCount || this.retryCount)
    } catch (error) {
      throw this.transformError(error)
    }
  }

  /**
   * Retry logic for failed requests
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        await this.delay(1000) // Wait 1 second before retry
        return this.withRetry(fn, retries - 1)
      }
      throw error
    }
  }

  /**
   * Transform unknown errors to ApiError
   */
  private transformError(error: unknown): ApiError {
    return ApiError.fromUnknown(error)
  }

  /**
   * Check if an error is retryable
   */
  private isRetryable(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.isRetryable()
    }
    
    // Check for network-related errors
    if (error instanceof Error) {
      const networkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']
      return networkErrors.some(code => error.message.includes(code))
    }
    
    return false
  }

  /**
   * Delay helper for retry logic
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Build full URL with base URL
   */
  protected buildUrl(endpoint: string): string {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    // Ensure base URL doesn't end with slash
    const cleanBase = this.baseURL.endsWith('/') 
      ? this.baseURL.slice(0, -1) 
      : this.baseURL
    return `${cleanBase}/${cleanEndpoint}`
  }

  /**
   * Merge headers with defaults
   */
  protected mergeHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.headers,
      ...customHeaders
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  abstract request<T>(options: IRequestOptions): Promise<T>
}