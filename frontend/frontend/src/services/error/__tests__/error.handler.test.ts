/**
 * Unit tests for error handler
 */

import { describe, test, expect, vi } from 'vitest'
import { 
  handleApiError, 
  getContextualErrorMessage, 
  createUIError,
  retryWithBackoff,
  ErrorType,
  ErrorAction,
  BoardError
} from '../error.handler'

describe('Error Handler', () => {
  describe('handleApiError', () => {
    test('should handle network errors without response', () => {
      const error = {
        message: 'Network Error',
        response: null
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.NETWORK)
      expect(result.message).toBe('Network error. Please check your connection and try again.')
      expect(result.action).toBe(ErrorAction.RETRY)
      expect(result.canRetry).toBe(true)
    })

    test('should handle 400 validation errors', () => {
      const error = {
        response: {
          status: 400,
          data: {
            type: 'validation-error',
            title: 'Validation Failed',
            detail: 'Case number already exists',
            status: 400
          }
        },
        correlationId: 'test-123'
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.VALIDATION)
      expect(result.message).toBe('Validation Failed')
      expect(result.details).toBe('Case number already exists')
      expect(result.action).toBe(ErrorAction.CHECK_INPUT)
      expect(result.canRetry).toBe(false)
      expect(result.correlationId).toBe('test-123')
    })

    test('should handle 401 authentication errors', () => {
      const error = {
        response: {
          status: 401,
          data: {
            title: 'Authentication Required',
            detail: 'Token expired'
          }
        }
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.AUTHENTICATION)
      expect(result.message).toBe('Authentication Required')
      expect(result.action).toBe(ErrorAction.LOGIN)
      expect(result.canRetry).toBe(false)
    })

    test('should handle 403 authorization errors', () => {
      const error = {
        response: {
          status: 403,
          data: {
            title: 'Access Denied',
            detail: 'Insufficient permissions'
          }
        }
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.AUTHORIZATION)
      expect(result.message).toBe('Access Denied')
      expect(result.action).toBe(ErrorAction.CONTACT_SUPPORT)
      expect(result.canRetry).toBe(false)
    })

    test('should handle 404 not found errors', () => {
      const error = {
        response: {
          status: 404,
          data: {
            title: 'Matter Not Found'
          }
        }
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.NOT_FOUND)
      expect(result.message).toBe('Matter Not Found')
      expect(result.action).toBe(ErrorAction.NONE)
    })

    test('should handle 409 conflict errors', () => {
      const error = {
        response: {
          status: 409,
          data: {
            title: 'Duplicate Case Number'
          }
        }
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.CONFLICT)
      expect(result.message).toBe('Duplicate Case Number')
      expect(result.action).toBe(ErrorAction.CHECK_INPUT)
    })

    test('should handle 500 server errors', () => {
      const error = {
        response: {
          status: 500,
          data: {
            title: 'Internal Server Error'
          }
        }
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.SERVER)
      expect(result.message).toBe('Internal Server Error')
      expect(result.action).toBe(ErrorAction.RETRY)
      expect(result.canRetry).toBe(true)
    })

    test('should handle ApiError instances', () => {
      const error = {
        name: 'ApiError',
        problemDetail: {
          title: 'Custom Error',
          detail: 'Custom detail',
          status: 422
        },
        status: 422,
        correlationId: 'api-123'
      }

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.VALIDATION)
      expect(result.message).toBe('Custom Error')
      expect(result.details).toBe('Custom detail')
      expect(result.correlationId).toBe('api-123')
    })

    test('should handle generic errors', () => {
      const error = new Error('Something went wrong')

      const result = handleApiError(error)

      expect(result.type).toBe(ErrorType.UNKNOWN)
      expect(result.message).toBe('Something went wrong')
      expect(result.action).toBe(ErrorAction.NONE)
      expect(result.canRetry).toBe(false)
    })

    test('should use default messages for unknown status codes', () => {
      const error = {
        response: {
          status: 418, // I'm a teapot
          data: {}
        }
      }

      const result = handleApiError(error)

      expect(result.message).toBe('An unexpected error occurred.')
    })
  })

  describe('getContextualErrorMessage', () => {
    test('should provide login-specific messages', () => {
      const authError: BoardError = {
        type: ErrorType.AUTHENTICATION,
        message: 'Generic auth error',
        timestamp: new Date().toISOString()
      }

      const message = getContextualErrorMessage(authError, 'login')
      expect(message).toBe('Invalid email or password. Please check your credentials and try again.')
    })

    test('should provide matter-specific messages', () => {
      const conflictError: BoardError = {
        type: ErrorType.CONFLICT,
        message: 'Generic conflict',
        timestamp: new Date().toISOString()
      }

      const message = getContextualErrorMessage(conflictError, 'matter')
      expect(message).toBe('A matter with this case number already exists. Please use a different case number.')
    })

    test('should fall back to original message for general context', () => {
      const error: BoardError = {
        type: ErrorType.SERVER,
        message: 'Server is down',
        timestamp: new Date().toISOString()
      }

      const message = getContextualErrorMessage(error, 'general')
      expect(message).toBe('Server is down')
    })
  })

  describe('createUIError', () => {
    test('should create UI error with defaults', () => {
      const error = createUIError('Test error')

      expect(error.type).toBe(ErrorType.UNKNOWN)
      expect(error.message).toBe('Test error')
      expect(error.action).toBe(ErrorAction.NONE)
      expect(error.canRetry).toBe(false)
      expect(error.timestamp).toBeDefined()
    })

    test('should create UI error with custom type and action', () => {
      const error = createUIError(
        'Network failed',
        ErrorType.NETWORK,
        ErrorAction.RETRY
      )

      expect(error.type).toBe(ErrorType.NETWORK)
      expect(error.message).toBe('Network failed')
      expect(error.action).toBe(ErrorAction.RETRY)
      expect(error.canRetry).toBe(true)
    })
  })

  describe('retryWithBackoff', () => {
    test('should retry function on retryable errors', async () => {
      let attempts = 0
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          const error = {
            response: {
              status: 500,
              data: { title: 'Server Error' }
            }
          }
          throw error
        }
        return Promise.resolve('success')
      })

      const result = await retryWithBackoff(mockFn, 3, 10)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    test('should not retry non-retryable errors', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        const error = {
          response: {
            status: 400,
            data: { title: 'Bad Request' }
          }
        }
        throw error
      })

      await expect(retryWithBackoff(mockFn, 3, 10)).rejects.toMatchObject({
        response: { status: 400 }
      })

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    test('should throw after max retries', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        const error = {
          response: {
            status: 500,
            data: { title: 'Server Error' }
          }
        }
        throw error
      })

      await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toMatchObject({
        response: { status: 500 }
      })

      expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })
})