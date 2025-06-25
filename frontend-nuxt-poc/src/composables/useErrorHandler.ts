import { ref, readonly, computed } from 'vue'

/**
 * Standard error interface for consistent error handling across the app
 */
export interface AppError {
  /** Error message for display */
  message: string
  /** Error code for programmatic handling */
  code: string
  /** Optional additional details */
  details?: unknown
  /** Timestamp when error occurred */
  timestamp: Date
  /** Severity level */
  severity: 'info' | 'warning' | 'error' | 'critical'
  /** Whether error is recoverable */
  recoverable: boolean
}

/**
 * Error handler composable for consistent error management
 * 
 * Provides a standardized approach to error handling across all composables
 * with proper TypeScript support, error categorization, and recovery patterns.
 * 
 * @returns Error management interface
 */
export function useErrorHandler() {
  // Error state
  const currentError = ref<AppError | null>(null)
  const errorHistory = ref<AppError[]>([])
  const isErrorActive = computed(() => !!currentError.value)
  
  /**
   * Create a standardized error object
   */
  const createError = (
    message: string,
    code: string = 'UNKNOWN_ERROR',
    options: Partial<Omit<AppError, 'message' | 'code' | 'timestamp'>> = {}
  ): AppError => {
    return {
      message,
      code,
      timestamp: new Date(),
      severity: options.severity ?? 'error',
      recoverable: options.recoverable ?? true,
      details: options.details
    }
  }
  
  /**
   * Set the current error
   */
  const setError = (error: AppError | string, code?: string) => {
    if (typeof error === 'string') {
      currentError.value = createError(error, code)
    } else {
      currentError.value = error
    }
    
    // Add to history
    errorHistory.value.push(currentError.value)
    
    // Keep history manageable
    if (errorHistory.value.length > 50) {
      errorHistory.value = errorHistory.value.slice(-50)
    }
  }
  
  /**
   * Clear the current error
   */
  const clearError = () => {
    currentError.value = null
  }
  
  /**
   * Clear all error history
   */
  const clearHistory = () => {
    errorHistory.value = []
  }
  
  /**
   * Handle async operations with automatic error catching
   */
  const handleAsync = async <T>(
    operation: () => Promise<T>,
    errorMessage?: string,
    errorCode?: string
  ): Promise<T | null> => {
    try {
      clearError()
      return await operation()
    } catch (error) {
      const message = errorMessage ?? 
        (error instanceof Error ? error.message : 'An unexpected error occurred')
      const code = errorCode ?? 
        (error instanceof Error && 'code' in error ? String(error.code) : 'ASYNC_ERROR')
      
      setError(createError(message, code, {
        details: error,
        severity: 'error',
        recoverable: true
      }))
      
      return null
    }
  }
  
  /**
   * Retry an operation with exponential backoff
   */
  const retryAsync = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T | null> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) {
          setError(createError(
            `Operation failed after ${maxRetries + 1} attempts`,
            'RETRY_EXHAUSTED',
            {
              details: error,
              severity: 'error',
              recoverable: false
            }
          ))
          return null
        }
        
        // Wait before retrying (exponential backoff)
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    return null
  }
  
  /**
   * Transform axios/fetch errors to standard format
   */
  const transformApiError = (error: any): AppError => {
    // Axios error
    if (error.response) {
      return createError(
        error.response.data?.message || error.message || 'API request failed',
        error.response.data?.code || `HTTP_${error.response.status}`,
        {
          details: {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          },
          severity: error.response.status >= 500 ? 'critical' : 'error',
          recoverable: error.response.status < 500
        }
      )
    }
    
    // Network error
    if (error.request) {
      return createError(
        'Network error - please check your connection',
        'NETWORK_ERROR',
        {
          details: error,
          severity: 'error',
          recoverable: true
        }
      )
    }
    
    // Generic error
    return createError(
      error.message || 'An unexpected error occurred',
      error.code || 'UNKNOWN_ERROR',
      {
        details: error,
        severity: 'error',
        recoverable: true
      }
    )
  }
  
  /**
   * Check if error is recoverable
   */
  const isRecoverable = computed(() => 
    currentError.value?.recoverable ?? false
  )
  
  /**
   * Get error severity
   */
  const errorSeverity = computed(() => 
    currentError.value?.severity ?? 'info'
  )
  
  /**
   * Get errors by severity
   */
  const getErrorsBySeverity = (severity: AppError['severity']) => {
    return errorHistory.value.filter(error => error.severity === severity)
  }
  
  return {
    // State (readonly)
    currentError: readonly(currentError),
    errorHistory: readonly(errorHistory),
    isErrorActive: readonly(isErrorActive),
    isRecoverable: readonly(isRecoverable),
    errorSeverity: readonly(errorSeverity),
    
    // Actions
    createError,
    setError,
    clearError,
    clearHistory,
    handleAsync,
    retryAsync,
    transformApiError,
    getErrorsBySeverity
  }
}

/**
 * Specialized error handler for form operations
 */
export function useFormErrorHandler() {
  const { createError, setError, clearError, currentError, isErrorActive } = useErrorHandler()
  
  /**
   * Handle validation errors
   */
  const setValidationError = (fieldName: string, message: string) => {
    setError(createError(
      message,
      'VALIDATION_ERROR',
      {
        details: { field: fieldName },
        severity: 'warning',
        recoverable: true
      }
    ))
  }
  
  /**
   * Handle form submission errors
   */
  const setSubmissionError = (message: string, details?: any) => {
    setError(createError(
      message,
      'SUBMISSION_ERROR',
      {
        details,
        severity: 'error',
        recoverable: true
      }
    ))
  }
  
  return {
    currentError: readonly(currentError),
    isErrorActive: readonly(isErrorActive),
    setValidationError,
    setSubmissionError,
    clearError
  }
}

/**
 * Specialized error handler for API operations
 */
export function useApiErrorHandler() {
  const { 
    transformApiError, 
    setError, 
    clearError, 
    handleAsync,
    retryAsync,
    currentError, 
    isErrorActive 
  } = useErrorHandler()
  
  /**
   * Handle API request with automatic error transformation
   */
  const handleApiRequest = async <T>(
    request: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      clearError()
      return await request()
    } catch (error) {
      const apiError = transformApiError(error)
      if (errorMessage) {
        apiError.message = errorMessage
      }
      setError(apiError)
      return null
    }
  }
  
  /**
   * Retry API request with backoff
   */
  const retryApiRequest = <T>(
    request: () => Promise<T>,
    maxRetries: number = 3
  ) => {
    return retryAsync(request, maxRetries)
  }
  
  return {
    currentError: readonly(currentError),
    isErrorActive: readonly(isErrorActive),
    handleApiRequest,
    retryApiRequest,
    clearError
  }
}