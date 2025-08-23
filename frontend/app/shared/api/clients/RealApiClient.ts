/**
 * RealApiClient
 * Implementation of BaseApiClient for production API communication
 * Uses Nuxt's $fetch for HTTP requests
 */

import type { IRequestOptions } from '../types'
import { BaseApiClient } from '../core/BaseApiClient'
import { ApiError } from '../core/ApiError'

export class RealApiClient extends BaseApiClient {
  /**
   * Execute HTTP request to real API
   */
  async request<T>(options: IRequestOptions): Promise<T> {
    return this.handleRequest(async () => {
      try {
        const response = await $fetch<T>(options.endpoint, {
          baseURL: this.baseURL,
          method: options.method || 'GET',
          headers: this.mergeHeaders(options.headers),
          params: options.params,
          body: options.body as BodyInit | Record<string, unknown> | null | undefined,
          timeout: options.timeout || this.timeout,
          
          // Transform errors to our format
          onResponseError({ response }) {
            throw new ApiError({
              message: response._data?.message || response.statusText || 'Request failed',
              statusCode: response.status,
              code: response._data?.code || 'API_ERROR',
              details: response._data,
              path: options.endpoint
            })
          },
          
          // Handle request errors
          onRequestError({ error }) {
            throw new ApiError({
              message: error.message || 'Network request failed',
              statusCode: 0,
              code: 'NETWORK_ERROR',
              details: error,
              path: options.endpoint
            })
          }
        })
        
        return response
      } catch (error) {
        // Re-throw ApiErrors as-is
        if (error instanceof ApiError) {
          throw error
        }
        
        // Transform other errors
        throw ApiError.fromUnknown(error)
      }
    }, options)
  }

  /**
   * Helper method for GET requests
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'GET',
      params
    })
  }

  /**
   * Helper method for POST requests
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'POST',
      body
    })
  }

  /**
   * Helper method for PUT requests
   */
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'PUT',
      body
    })
  }

  /**
   * Helper method for DELETE requests
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'DELETE'
    })
  }

  /**
   * Helper method for PATCH requests
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'PATCH',
      body
    })
  }
}