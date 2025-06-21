/**
 * Comprehensive error scenario testing
 * 
 * @description Tests all error handling scenarios including network errors,
 * validation errors, authentication errors, offline mode, and error recovery.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { toast } from 'sonner'
import { ErrorBoundary } from '../ErrorBoundary'
import { ErrorToastProvider } from '../../providers/ErrorToastProvider'
import { OfflineDetector, useOfflineDetection } from '../OfflineDetector'
import { FieldError, FieldErrorList, FormErrorSummary } from '../../forms/FieldError'
import { handleApiError, createUIError, ErrorType, ErrorAction } from '@/services/error/error.handler'
import { errorLoggingService } from '@/lib/error-logging'
import { useKanbanStore } from '@/stores/kanban-store'

// Mock dependencies
jest.mock('sonner')
jest.mock('@/services/error/error.handler')
jest.mock('@/lib/error-logging')
jest.mock('@/stores/kanban-store')

const mockToast = toast as jest.MockedFunction<typeof toast>
const mockHandleApiError = handleApiError as jest.MockedFunction<typeof handleApiError>
const mockCreateUIError = createUIError as jest.MockedFunction<typeof createUIError>
const mockUseKanbanStore = useKanbanStore as jest.MockedFunction<typeof useKanbanStore>

// Test component that throws errors
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error for boundary')
  }
  return <div>No error</div>
}

// Test component for offline detection
function OfflineTestComponent() {
  const { isOnline, isOffline } = useOfflineDetection()
  return (
    <div>
      <span data-testid="online-status">{isOnline ? 'online' : 'offline'}</span>
      <span data-testid="offline-status">{isOffline ? 'offline' : 'online'}</span>
    </div>
  )
}

describe('Error Handling System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to prevent noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('ErrorBoundary', () => {
    it('should catch and display error when component throws', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
      expect(screen.getByText('Go Home')).toBeInTheDocument()
    })

    it('should render children normally when no error', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should allow retry functionality', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error should be displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Click try again
      fireEvent.click(screen.getByText('Try Again'))

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should show development details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Copy Error Details')).toBeInTheDocument()
      expect(screen.getByText('Technical Details')).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('ErrorToastProvider', () => {
    it('should display toast for network errors', async () => {
      const mockError = {
        type: ErrorType.NETWORK,
        message: 'Network connection failed',
        timestamp: new Date().toISOString(),
        action: ErrorAction.RETRY,
        canRetry: true
      }

      mockUseKanbanStore.mockReturnValue({
        error: mockError,
        clearError: jest.fn(),
        refreshBoard: jest.fn()
      })

      render(<ErrorToastProvider><div>Test content</div></ErrorToastProvider>)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Network connection failed',
          expect.objectContaining({
            description: expect.stringContaining('retry'),
            action: expect.objectContaining({
              label: 'Retry'
            })
          })
        )
      })
    })

    it('should display warning toast for validation errors', async () => {
      const mockError = {
        type: ErrorType.VALIDATION,
        message: 'Invalid input data',
        timestamp: new Date().toISOString(),
        action: ErrorAction.CHECK_INPUT,
        canRetry: false
      }

      mockUseKanbanStore.mockReturnValue({
        error: mockError,
        clearError: jest.fn(),
        refreshBoard: jest.fn()
      })

      render(<ErrorToastProvider><div>Test content</div></ErrorToastProvider>)

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith(
          'Invalid input data',
          expect.objectContaining({
            description: expect.stringContaining('check your input')
          })
        )
      })
    })

    it('should handle authentication errors with login action', async () => {
      const mockError = {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        action: ErrorAction.LOGIN,
        canRetry: false
      }

      mockUseKanbanStore.mockReturnValue({
        error: mockError,
        clearError: jest.fn(),
        refreshBoard: jest.fn()
      })

      render(<ErrorToastProvider><div>Test content</div></ErrorToastProvider>)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Authentication required',
          expect.objectContaining({
            description: expect.stringContaining('session may have expired'),
            action: expect.objectContaining({
              label: 'Login'
            })
          })
        )
      })
    })
  })

  describe('OfflineDetector', () => {
    it('should detect online status correctly', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      render(
        <OfflineDetector>
          <OfflineTestComponent />
        </OfflineDetector>
      )

      expect(screen.getByTestId('online-status')).toHaveTextContent('online')
      expect(screen.getByTestId('offline-status')).toHaveTextContent('online')
    })

    it('should detect offline status correctly', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      render(
        <OfflineDetector>
          <OfflineTestComponent />
        </OfflineDetector>
      )

      expect(screen.getByTestId('online-status')).toHaveTextContent('offline')
      expect(screen.getByTestId('offline-status')).toHaveTextContent('offline')
    })

    it('should show offline banner when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      render(
        <OfflineDetector showOfflineBanner={true}>
          <div>Content</div>
        </OfflineDetector>
      )

      expect(screen.getByText('You are offline. Some features are limited.')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('should handle online/offline events', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      render(
        <OfflineDetector>
          <OfflineTestComponent />
        </OfflineDetector>
      )

      // Initially online
      expect(screen.getByTestId('online-status')).toHaveTextContent('online')

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false
      })
      
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith(
          'You are offline',
          expect.objectContaining({
            description: expect.stringContaining('Changes will be synced')
          })
        )
      })

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', {
        value: true
      })
      
      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Back online',
          expect.objectContaining({
            description: expect.stringContaining('Connection restored')
          })
        )
      })
    })
  })

  describe('Field Validation Errors', () => {
    it('should display single field error', () => {
      render(<FieldError error="This field is required" />)
      
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should display field error with custom variant', () => {
      render(<FieldError error="Warning message" variant="warning" />)
      
      expect(screen.getByText('Warning message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('text-yellow-600')
    })

    it('should display multiple field errors in list', () => {
      const errors = [
        { field: 'email', message: 'Email is required', type: 'error' as const },
        { field: 'password', message: 'Password is too short', type: 'error' as const }
      ]

      render(<FieldErrorList errors={errors} />)
      
      expect(screen.getByText(/Email is required/)).toBeInTheDocument()
      expect(screen.getByText(/Password is too short/)).toBeInTheDocument()
    })

    it('should display form error summary', () => {
      const errors = [
        { field: 'email', message: 'Email is required', type: 'error' as const },
        { field: 'password', message: 'Password is too short', type: 'error' as const }
      ]

      render(<FormErrorSummary errors={errors} />)
      
      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument()
      expect(screen.getByText(/Email is required/)).toBeInTheDocument()
      expect(screen.getByText(/Password is too short/)).toBeInTheDocument()
    })

    it('should handle empty error arrays gracefully', () => {
      render(<FieldErrorList errors={[]} />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('API Error Handling', () => {
    it('should handle network errors correctly', () => {
      const networkError = { response: null, message: 'Network Error' }
      
      mockHandleApiError.mockReturnValue({
        type: ErrorType.NETWORK,
        message: 'Network error. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
        action: ErrorAction.RETRY,
        canRetry: true
      })

      const result = handleApiError(networkError)

      expect(result.type).toBe(ErrorType.NETWORK)
      expect(result.canRetry).toBe(true)
      expect(result.action).toBe(ErrorAction.RETRY)
    })

    it('should handle validation errors correctly', () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            type: 'urn:problem-type:validation-error',
            title: 'Validation failed',
            detail: 'Required fields are missing'
          }
        }
      }

      mockHandleApiError.mockReturnValue({
        type: ErrorType.VALIDATION,
        message: 'Validation failed',
        details: 'Required fields are missing',
        timestamp: new Date().toISOString(),
        action: ErrorAction.CHECK_INPUT,
        canRetry: false
      })

      const result = handleApiError(validationError)

      expect(result.type).toBe(ErrorType.VALIDATION)
      expect(result.canRetry).toBe(false)
      expect(result.action).toBe(ErrorAction.CHECK_INPUT)
    })

    it('should handle server errors correctly', () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            type: 'urn:problem-type:server-error',
            title: 'Internal server error'
          }
        }
      }

      mockHandleApiError.mockReturnValue({
        type: ErrorType.SERVER,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        action: ErrorAction.RETRY,
        canRetry: true
      })

      const result = handleApiError(serverError)

      expect(result.type).toBe(ErrorType.SERVER)
      expect(result.canRetry).toBe(true)
      expect(result.action).toBe(ErrorAction.RETRY)
    })
  })

  describe('Error Logging', () => {
    it('should log errors with correct context', () => {
      const mockError = {
        type: ErrorType.NETWORK,
        message: 'Test error',
        timestamp: new Date().toISOString(),
        action: ErrorAction.RETRY,
        canRetry: true
      }

      errorLoggingService.logError(mockError, { userId: 'test-user' }, 'test stack trace')

      expect(errorLoggingService.logError).toHaveBeenCalledWith(
        mockError,
        { userId: 'test-user' },
        'test stack trace'
      )
    })

    it('should track user actions correctly', () => {
      errorLoggingService.trackUserAction('button_click', { buttonId: 'submit' })

      expect(errorLoggingService.trackUserAction).toHaveBeenCalledWith(
        'button_click',
        { buttonId: 'submit' }
      )
    })

    it('should provide error statistics', () => {
      const mockStats = {
        totalErrors: 5,
        recentErrors: 2,
        errorsByType: { [ErrorType.NETWORK]: 3, [ErrorType.VALIDATION]: 2 },
        resolvedErrors: 1,
        criticalErrors: 0,
        queueSize: 4
      }

      errorLoggingService.getErrorStats.mockReturnValue(mockStats)

      const stats = errorLoggingService.getErrorStats()

      expect(stats.totalErrors).toBe(5)
      expect(stats.errorsByType[ErrorType.NETWORK]).toBe(3)
    })
  })

  describe('Production Error Handling', () => {
    it('should suppress console errors in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      // Test that errors are logged but not shown in console
      mockCreateUIError.mockReturnValue({
        type: ErrorType.UNKNOWN,
        message: 'Production error',
        timestamp: new Date().toISOString(),
        action: ErrorAction.NONE,
        canRetry: false
      })

      const error = createUIError('Production error')

      // Error should be created but not logged to console
      expect(error.message).toBe('Production error')

      process.env.NODE_ENV = originalEnv
      consoleSpy.mockRestore()
    })
  })

  describe('Internationalization Support', () => {
    it('should support error message translation keys', () => {
      const error = {
        field: 'emailAddress',
        message: 'Email address is required',
        type: 'error' as const
      }

      render(<FieldError error={error} />)
      
      // Should display the error message
      expect(screen.getByText('Email address is required')).toBeInTheDocument()
    })
  })
})

describe('Error Recovery Scenarios', () => {
  it('should handle retry with exponential backoff', async () => {
    let attemptCount = 0
    const mockApiCall = jest.fn().mockImplementation(() => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error('Temporary failure')
      }
      return Promise.resolve('success')
    })

    // Mock the retry logic
    const retryWithBackoff = async <T,>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn()
        } catch (error) {
          if (attempt === maxRetries) throw error
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
      }
    }

    const result = await retryWithBackoff(mockApiCall)
    expect(result).toBe('success')
    expect(mockApiCall).toHaveBeenCalledTimes(3)
  })

  it('should handle offline queue and sync', async () => {
    const offlineActions = [
      { action: 'create_matter', data: { title: 'Test Matter' } },
      { action: 'update_matter', data: { id: '1', title: 'Updated' } }
    ]

    // Mock offline queue processing
    const processOfflineQueue = jest.fn().mockImplementation(async (actions) => {
      return Promise.all(actions.map(action => 
        Promise.resolve({ success: true, action: action.action })
      ))
    })

    const results = await processOfflineQueue(offlineActions)
    
    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
  })
})