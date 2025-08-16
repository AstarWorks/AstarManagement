import { ref, computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Form error types
 */
export enum FormErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

/**
 * Form error interface
 */
export interface IFormError {
  readonly type: FormErrorType
  readonly message: string
  readonly field?: string
  readonly code?: string
  readonly details?: Record<string, unknown>
  readonly timestamp: Date
}

/**
 * Error handling options
 */
export interface IErrorHandlingOptions {
  readonly showToast?: boolean
  readonly logToConsole?: boolean
  readonly trackAnalytics?: boolean
  readonly autoRetry?: boolean
  readonly maxRetries?: number
}

/**
 * Error recovery action
 */
export interface IErrorRecoveryAction {
  readonly label: string
  readonly action: () => Promise<void> | void
  readonly variant?: 'default' | 'secondary' | 'destructive'
}

/**
 * Error handling composable return type
 */
export interface IExpenseFormErrorHandlingReturn {
  readonly currentError: Ref<IFormError | null>
  readonly errorHistory: Ref<readonly IFormError[]>
  readonly hasError: Ref<boolean>
  readonly isRecovering: Ref<boolean>
  readonly errorCount: Ref<number>
  handleError: (error: unknown, context?: string, field?: string) => IFormError
  handleNetworkError: (error: unknown, operation: string) => IFormError
  handleValidationError: (error: unknown, field?: string) => IFormError
  handleStorageError: (error: unknown, operation: 'save' | 'load' | 'clear') => IFormError
  clearError: () => void
  clearAllErrors: () => void
  retryLastOperation: () => Promise<void>
  getRecoveryActions: () => IErrorRecoveryAction[]
}

/**
 * Extract error message from various error types
 */
const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object') {
    // Handle API error responses
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    
    // Handle validation errors
    if ('issues' in error && Array.isArray(error.issues)) {
      return error.issues.map((issue: { message: string }) => issue.message).join(', ')
    }
    
    // Handle network errors
    if ('status' in error || 'statusCode' in error) {
      const status = (error as Record<string, unknown>).status || (error as Record<string, unknown>).statusCode
      return `Network error (${status})`
    }
  }
  
  return 'An unexpected error occurred'
}

/**
 * Determine error type from error object
 */
const determineErrorType = (error: unknown, context?: string): FormErrorType => {
  if (context) {
    if (context.includes('validation')) return FormErrorType.VALIDATION
    if (context.includes('network') || context.includes('api')) return FormErrorType.NETWORK
    if (context.includes('storage') || context.includes('localStorage')) return FormErrorType.STORAGE
    if (context.includes('permission') || context.includes('auth')) return FormErrorType.PERMISSION
  }
  
  if (error instanceof Error) {
    if (error.name.includes('Validation')) return FormErrorType.VALIDATION
    if (error.name.includes('Network') || error.name.includes('Fetch')) return FormErrorType.NETWORK
    if (error.name.includes('Storage') || error.name.includes('Quota')) return FormErrorType.STORAGE
    if (error.name.includes('Permission') || error.name.includes('Auth')) return FormErrorType.PERMISSION
  }
  
  if (error && typeof error === 'object') {
    if ('status' in error || 'statusCode' in error) return FormErrorType.NETWORK
    if ('issues' in error) return FormErrorType.VALIDATION
  }
  
  return FormErrorType.UNKNOWN
}

/**
 * Composable for handling expense form errors with comprehensive recovery mechanisms
 * Provides centralized error handling, user feedback, and recovery actions
 */
export function useExpenseFormErrorHandling(
  options: IErrorHandlingOptions = {}
): IExpenseFormErrorHandlingReturn {
  const { t } = useI18n()
  const {
    showToast: _showToast = true,
    logToConsole = true,
    trackAnalytics = false,
    autoRetry = false,
    maxRetries = 3
  } = options

  // State
  const currentError = ref<IFormError | null>(null)
  const errorHistory = ref<IFormError[]>([])
  const isRecovering = ref(false)
  const retryCount = ref(0)
  const lastOperation = ref<(() => Promise<void>) | null>(null)

  // Computed
  const hasError = computed(() => currentError.value !== null)
  const errorCount = computed(() => errorHistory.value.length)

  // Create form error
  const createError = (
    type: FormErrorType,
    message: string,
    field?: string,
    code?: string,
    details?: Record<string, unknown>
  ): IFormError => ({
    type,
    message,
    field,
    code,
    details,
    timestamp: new Date()
  })

  // Log error if enabled
  const logError = (error: IFormError): void => {
    if (logToConsole) {
      console.error('[ExpenseForm Error]', {
        type: error.type,
        message: error.message,
        field: error.field,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp
      })
    }
  }

  // Track error analytics if enabled
  const trackError = (error: IFormError): void => {
    if (trackAnalytics) {
      // Implementation would depend on analytics service
      console.info('[Analytics] Form error tracked:', error.type)
    }
  }

  // Generic error handler
  const handleError = (error: unknown, context?: string, field?: string): IFormError => {
    const errorType = determineErrorType(error, context)
    const message = extractErrorMessage(error)
    
    let localizedMessage: string
    
    // Provide localized error messages
    switch (errorType) {
      case FormErrorType.VALIDATION:
        localizedMessage = field 
          ? t('expense.form.errors.fieldValidation', { field, message })
          : t('expense.form.errors.validation', { message })
        break
      case FormErrorType.NETWORK:
        localizedMessage = t('expense.form.errors.network', { message })
        break
      case FormErrorType.STORAGE:
        localizedMessage = t('expense.form.errors.storage', { message })
        break
      case FormErrorType.PERMISSION:
        localizedMessage = t('expense.form.errors.permission', { message })
        break
      default:
        localizedMessage = t('expense.form.errors.unknown', { message })
    }

    const formError = createError(errorType, localizedMessage, field, undefined, { 
      originalError: error,
      context 
    })

    // Set current error and add to history
    currentError.value = formError
    errorHistory.value.push(formError)

    // Log and track error
    logError(formError)
    trackError(formError)

    // Auto-retry if enabled and applicable
    if (autoRetry && retryCount.value < maxRetries && lastOperation.value) {
      setTimeout(() => {
        retryLastOperation()
      }, 1000 * Math.pow(2, retryCount.value)) // Exponential backoff
    }

    return formError
  }

  // Network error handler
  const handleNetworkError = (error: unknown, operation: string): IFormError => {
    return handleError(error, `network_${operation}`)
  }

  // Validation error handler
  const handleValidationError = (error: unknown, field?: string): IFormError => {
    return handleError(error, 'validation', field)
  }

  // Storage error handler
  const handleStorageError = (error: unknown, operation: 'save' | 'load' | 'clear'): IFormError => {
    return handleError(error, `storage_${operation}`)
  }

  // Clear current error
  const clearError = (): void => {
    currentError.value = null
    retryCount.value = 0
  }

  // Clear all errors
  const clearAllErrors = (): void => {
    currentError.value = null
    errorHistory.value = []
    retryCount.value = 0
    lastOperation.value = null
  }

  // Retry last operation
  const retryLastOperation = async (): Promise<void> => {
    if (!lastOperation.value || retryCount.value >= maxRetries) {
      return
    }

    isRecovering.value = true
    retryCount.value++

    try {
      await lastOperation.value()
      clearError() // Clear error on successful retry
    } catch (error) {
      handleError(error, 'retry_operation')
    } finally {
      isRecovering.value = false
    }
  }

  // Get recovery actions based on current error
  const getRecoveryActions = (): IErrorRecoveryAction[] => {
    const actions: IErrorRecoveryAction[] = []

    if (!currentError.value) return actions

    // Always provide a dismiss action
    actions.push({
      label: t('common.dismiss'),
      action: clearError,
      variant: 'secondary'
    })

    // Add specific recovery actions based on error type
    switch (currentError.value.type) {
      case FormErrorType.NETWORK:
        if (lastOperation.value && retryCount.value < maxRetries) {
          actions.unshift({
            label: t('common.retry'),
            action: retryLastOperation,
            variant: 'default'
          })
        }
        break

      case FormErrorType.STORAGE:
        actions.unshift({
          label: t('expense.form.actions.clearStorage'),
          action: () => {
            localStorage.removeItem('expense-form-draft')
            clearError()
          },
          variant: 'destructive'
        })
        break

      case FormErrorType.VALIDATION:
        // Validation errors usually require user input, so just provide dismiss
        break

      case FormErrorType.PERMISSION:
        actions.unshift({
          label: t('expense.form.actions.refreshPage'),
          action: () => window.location.reload(),
          variant: 'default'
        })
        break

      default:
        // For unknown error types, only provide dismiss action
        break
    }

    return actions
  }

  // Set last operation for retry functionality
  const _setLastOperation = (operation: () => Promise<void>): void => {
    lastOperation.value = operation
    retryCount.value = 0
  }

  return {
    currentError,
    errorHistory,
    hasError,
    isRecovering,
    errorCount,
    handleError,
    handleNetworkError,
    handleValidationError,
    handleStorageError,
    clearError,
    clearAllErrors,
    retryLastOperation,
    getRecoveryActions
  }
}