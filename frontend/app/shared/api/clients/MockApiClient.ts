/**
 * MockApiClient
 * Implementation of BaseApiClient for development with mock data
 * Simulates API behavior with configurable latency
 */

import type { IApiConfig, IRequestOptions, MockHandler } from '../types'
import { BaseApiClient } from '../core/BaseApiClient'
import { ApiError } from '../core/ApiError'

export class MockApiClient extends BaseApiClient {
  private handlers = new Map<string, MockHandler>()
  private mockDelay: number
  private mockDelayVariance: number

  constructor(config: IApiConfig) {
    super(config)
    this.mockDelay = config.mockDelay || 200
    this.mockDelayVariance = config.mockDelayVariance || 100
    this.registerHandlers()
  }

  /**
   * Auto-discover and register mock handlers
   */
  private registerHandlers() {
    // Use import.meta.glob to dynamically import all handler modules
    const modules = import.meta.glob('../mock/handlers/*.ts', { 
      eager: true 
    })
    
    for (const [path, module] of Object.entries(modules)) {
      // Extract handler name from file path
      const matches = path.match(/\/([^/]+)\.ts$/)
      if (matches && matches[1]) {
        const name = matches[1]
        
        // Register the default export as the handler
        if (typeof module === 'object' && module !== null && 'default' in module) {
          const moduleWithDefault = module as { default: unknown }
          const handler = moduleWithDefault.default
          if (typeof handler === 'function') {
            this.handlers.set(name, handler as MockHandler)
            console.log(`[MockApiClient] Registered handler: ${name}`)
          }
        }
      }
    }
  }

  /**
   * Simulate network latency
   */
  private async simulateLatency(): Promise<void> {
    const variance = Math.random() * this.mockDelayVariance - this.mockDelayVariance / 2
    const delay = Math.max(0, this.mockDelay + variance)
    await this.delay(delay)
  }

  /**
   * Extract handler key from endpoint
   */
  private getHandlerKey(endpoint: string): string {
    // Remove leading slash and get first path segment
    const cleanPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const segments = cleanPath.split('/')
    return segments[0] || 'default'
  }

  /**
   * Execute mock request
   */
  async request<T>(options: IRequestOptions): Promise<T> {
    // Simulate network latency
    await this.simulateLatency()
    
    // Find appropriate handler
    const handlerKey = this.getHandlerKey(options.endpoint)
    const handler = this.handlers.get(handlerKey)
    
    if (!handler) {
      // If no specific handler found, try default handler
      const defaultHandler = this.handlers.get('default')
      if (!defaultHandler) {
        throw new ApiError({
          message: `Mock handler not found for: ${handlerKey}`,
          statusCode: 404,
          code: 'MOCK_NOT_FOUND',
          path: options.endpoint
        })
      }
      
      try {
        const result = await defaultHandler(options)
        return result as T
      } catch (error) {
        throw ApiError.fromUnknown(error)
      }
    }
    
    try {
      // Execute the mock handler
      const result = await handler(options)
      
      // Simulate successful response
      console.log(`[MockApiClient] ${options.method} ${options.endpoint}`, {
        params: options.params,
        body: options.body,
        response: result
      })
      
      return result as T
    } catch (error) {
      // Transform handler errors to ApiError
      throw ApiError.fromUnknown(error)
    }
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

  /**
   * Add or update a mock handler at runtime (useful for testing)
   */
  addHandler(name: string, handler: MockHandler): void {
    this.handlers.set(name, handler)
    console.log(`[MockApiClient] Added/updated handler: ${name}`)
  }

  /**
   * Remove a mock handler
   */
  removeHandler(name: string): boolean {
    const result = this.handlers.delete(name)
    if (result) {
      console.log(`[MockApiClient] Removed handler: ${name}`)
    }
    return result
  }

  /**
   * Get list of registered handlers (for debugging)
   */
  getHandlerNames(): string[] {
    return Array.from(this.handlers.keys())
  }
}