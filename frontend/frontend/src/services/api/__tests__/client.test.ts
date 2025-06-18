/**
 * Unit tests for API client configuration and interceptors
 */

import { describe, test, expect, beforeEach, vi, Mock } from 'vitest'
import axios from 'axios'
import { apiClient, handleApiResponse, createApiError, ApiError } from '../client'
import * as tokenService from '../../auth/token.service'
import * as authService from '../../auth/auth.service'

// Mock modules
vi.mock('../../auth/token.service')
vi.mock('../../auth/auth.service')
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-correlation-id')
}))

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Configuration', () => {
    test('should have correct base configuration', () => {
      expect(apiClient.defaults.baseURL).toBe('http://localhost:8080')
      expect(apiClient.defaults.timeout).toBe(30000)
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
      expect(apiClient.defaults.headers['Accept']).toBe('application/json')
    })
  })

  describe('Utility Functions', () => {
    test('handleApiResponse should extract data from response', () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      }

      const result = handleApiResponse(mockResponse)
      expect(result).toEqual({ id: 1, name: 'Test' })
    })

    test('createApiError should create ApiError from axios error', () => {
      const axiosError = {
        response: {
          status: 404,
          data: {
            type: 'not-found',
            title: 'Resource not found',
            status: 404,
            detail: 'The requested resource does not exist'
          }
        },
        message: 'Request failed with status code 404',
        isAxiosError: true
      }

      // Mock axios.isAxiosError
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)

      const apiError = createApiError(axiosError)
      
      expect(apiError).toBeInstanceOf(Error)
      expect(apiError.name).toBe('ApiError')
      expect(apiError.status).toBe(404)
      expect(apiError.problemDetail).toEqual(axiosError.response.data)
    })

    test('createApiError should handle non-axios errors', () => {
      const genericError = new Error('Network error')
      
      // Mock axios.isAxiosError
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false)
      
      const apiError = createApiError(genericError)
      
      expect(apiError).toBeInstanceOf(Error)
      expect(apiError.name).toBe('ApiError')
      expect(apiError.message).toBe('Network error')
      expect(apiError.status).toBeUndefined()
      expect(apiError.problemDetail).toBeUndefined()
    })

    test('createApiError should return existing ApiError unchanged', () => {
      const existingApiError: ApiError = new Error('Existing error') as ApiError
      existingApiError.name = 'ApiError'
      existingApiError.status = 500
      
      const result = createApiError(existingApiError)
      
      expect(result).toBe(existingApiError)
    })
  })
})