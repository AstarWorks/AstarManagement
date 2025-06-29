/**
 * Tests for TanStack Query v5 Configuration
 */
import { describe, it, expect, vi } from 'vitest'
import { 
  queryClientConfig,
  CACHE_TIMES,
  calculateRetryDelay,
  shouldRetry,
  handleQueryError,
  handleQuerySuccess,
  handleMutationError,
  handleMutationSuccess
} from '../tanstack-query'

describe('TanStack Query Configuration', () => {
  describe('queryClientConfig', () => {
    it('should have default options for queries and mutations', () => {
      expect(queryClientConfig.defaultOptions).toBeDefined()
      expect(queryClientConfig.defaultOptions?.queries).toBeDefined()
      expect(queryClientConfig.defaultOptions?.mutations).toBeDefined()
    })

    it('should not have deprecated onError/onSuccess in cache config', () => {
      // These properties were removed in v5
      expect(queryClientConfig).not.toHaveProperty('queryCache.onError')
      expect(queryClientConfig).not.toHaveProperty('queryCache.onSuccess')
      expect(queryClientConfig).not.toHaveProperty('mutationCache.onError')
      expect(queryClientConfig).not.toHaveProperty('mutationCache.onSuccess')
    })
  })

  describe('retry logic', () => {
    it('should calculate retry delay with exponential backoff', () => {
      const delay1 = calculateRetryDelay(0)
      const delay2 = calculateRetryDelay(1)
      const delay3 = calculateRetryDelay(2)
      
      expect(delay1).toBeGreaterThanOrEqual(1000)
      expect(delay1).toBeLessThanOrEqual(1100) // With jitter
      expect(delay2).toBeGreaterThanOrEqual(2000)
      expect(delay3).toBeGreaterThanOrEqual(4000)
    })

    it('should determine retry eligibility correctly', () => {
      // Should retry on server errors
      expect(shouldRetry(0, { response: { status: 500 } })).toBe(true)
      expect(shouldRetry(0, { response: { status: 503 } })).toBe(true)
      
      // Should retry on network errors
      expect(shouldRetry(0, { code: 'NETWORK_ERROR' })).toBe(true)
      
      // Should not retry on client errors (except specific ones)
      expect(shouldRetry(0, { response: { status: 400 } })).toBe(false)
      expect(shouldRetry(0, { response: { status: 404 } })).toBe(false)
      
      // Should retry on rate limiting
      expect(shouldRetry(0, { response: { status: 429 } })).toBe(true)
      
      // Should not retry after max attempts
      expect(shouldRetry(3, { response: { status: 500 } })).toBe(false)
    })
  })

  describe('error handlers', () => {
    it('should handle query errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      handleQueryError({ response: { status: 500 }, message: 'Server error' })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Query failed:',
        expect.objectContaining({ error: expect.any(Object) })
      )
      expect(consoleSpy).toHaveBeenCalledWith('Critical system error:', expect.any(Object))
      
      consoleSpy.mockRestore()
    })

    it('should handle mutation errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      handleMutationError(
        { message: 'Mutation failed' },
        { id: '123' },
        { optimisticData: {} }
      )
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Mutation failed:',
        expect.objectContaining({
          error: 'Mutation failed',
          variables: { id: '123' },
          context: { optimisticData: {} }
        })
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('cache times', () => {
    it('should have appropriate cache times for different data types', () => {
      expect(CACHE_TIMES.STATIC).toBe(30 * 60 * 1000) // 30 minutes
      expect(CACHE_TIMES.MATTERS).toBe(5 * 60 * 1000) // 5 minutes
      expect(CACHE_TIMES.REALTIME).toBe(1 * 60 * 1000) // 1 minute
      expect(CACHE_TIMES.USER_SETTINGS).toBe(15 * 60 * 1000) // 15 minutes
      expect(CACHE_TIMES.SEARCH).toBe(2 * 60 * 1000) // 2 minutes
    })
  })
})