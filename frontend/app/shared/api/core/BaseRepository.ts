/**
 * BaseRepository
 * Abstract base class for repository pattern implementation
 * Provides caching, data fetching, and cache invalidation
 */

import type { ICacheOptions } from '../types'
import type { BaseApiClient } from './BaseApiClient'
import { ApiError } from './ApiError'

export abstract class BaseRepository {
  protected client: BaseApiClient

  constructor(client: BaseApiClient) {
    this.client = client
  }

  /**
   * Generate cache key for data operations
   */
  protected cacheKey(
    action: string,
    params?: Record<string, unknown>
  ): string {
    const base = `${this.constructor.name}:${action}`
    if (!params) return base
    
    // Sort params for consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    
    return `${base}:${sortedParams}`
  }

  /**
   * Invalidate cache entries
   */
  protected async invalidateCache(pattern?: string) {
    if (pattern) {
      await clearNuxtData(pattern)
    } else {
      // Clear all cache entries for this repository
      await clearNuxtData(this.constructor.name)
    }
  }

  /**
   * Fetch data with caching support
   * Uses Nuxt's useAsyncData for SSR compatibility
   */
  protected async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: ICacheOptions & { 
      validate?: (data: T) => boolean 
    }
  ): Promise<T> {
    const { data, refresh, error } = await useAsyncData(
      key,
      async () => {
        const result = await fetcher()
        
        // Validate response if validator provided
        if (options?.validate && !options.validate(result)) {
          throw new ApiError({
            message: 'Invalid response data',
            statusCode: 422,
            code: 'INVALID_RESPONSE',
            details: { data: result }
          })
        }
        
        return result
      },
      {
        server: false, // Client-side only for now
        lazy: options?.lazy ?? true,
        transform: options?.transform
      }
    )
    
    // Handle errors
    if (error.value) {
      throw ApiError.fromUnknown(error.value)
    }
    
    // Force refresh if requested
    if (options?.forceRefresh) {
      await refresh()
    }
    
    // Wait for data if not lazy
    if (!options?.lazy && !data.value) {
      // If data is not available, trigger fetch
      await refresh()
    }
    
    return data.value as T
  }

  /**
   * Direct fetch without caching
   */
  protected async directFetch<T>(
    fetcher: () => Promise<T>
  ): Promise<T> {
    try {
      return await fetcher()
    } catch (error) {
      throw ApiError.fromUnknown(error)
    }
  }

  /**
   * Helper to build query string from params
   */
  protected buildQueryString(params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return ''
    }
    
    const queryParts = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(v => `${key}[]=${encodeURIComponent(String(v))}`).join('&')
        }
        return `${key}=${encodeURIComponent(String(value))}`
      })
    
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  }

  /**
   * Helper to validate ID parameter
   */
  protected validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ApiError({
        message: 'Invalid ID parameter',
        statusCode: 400,
        code: 'INVALID_ID'
      })
    }
  }

  /**
   * Helper to validate required fields in data
   */
  protected validateRequiredFields(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(
      field => data[field] === undefined || data[field] === null
    )
    
    if (missingFields.length > 0) {
      throw new ApiError({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        statusCode: 400,
        code: 'MISSING_REQUIRED_FIELDS',
        details: { missingFields }
      })
    }
  }
}