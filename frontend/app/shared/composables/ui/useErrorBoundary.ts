import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface IErrorBoundaryState {
  /** Current error instance */
  error: Error | null
  /** Error message */
  message: string | null
  /** Error stack trace */
  stack: string | null
  /** Timestamp when error occurred */
  timestamp: Date | null
}

export interface IErrorBoundaryReturn {
  /** Current error state */
  errorState: Ref<IErrorBoundaryState>
  /** Whether there is an active error */
  hasError: Ref<boolean>
  /** Whether the error should be displayed to user */
  shouldShowError: Ref<boolean>
  /** Set an error */
  setError: (error: Error | string, context?: string) => void
  /** Clear the current error */
  clearError: () => void
  /** Execute function with error boundary */
  withErrorBoundary: <T>(fn: () => T) => T | null
  /** Execute async function with error boundary */
  withAsyncErrorBoundary: <T>(fn: () => Promise<T>) => Promise<T | null>
  /** Get user-friendly error message */
  getUserFriendlyMessage: () => string
}

/**
 * Composable for error boundary functionality
 * Provides centralized error handling and recovery
 */
export function useErrorBoundary(): IErrorBoundaryReturn {
  const errorState = ref<IErrorBoundaryState>({
    error: null,
    message: null,
    stack: null,
    timestamp: null
  })

  const hasError = computed(() => errorState.value.error !== null)
  
  const shouldShowError = computed(() => {
    // Show error in development or for non-recoverable errors
    return process.env.NODE_ENV === 'development' || hasError.value
  })

  const setError = (error: Error | string, context?: string) => {
    const errorInstance = error instanceof Error ? error : new Error(error)
    
    errorState.value = {
      error: errorInstance,
      message: errorInstance.message,
      stack: errorInstance.stack || null,
      timestamp: new Date()
    }

    // Log error for debugging
    console.error('ErrorBoundary caught error:', {
      error: errorInstance,
      context,
      timestamp: errorState.value.timestamp
    })

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      // reportError(errorInstance, context)
    }
  }

  const clearError = () => {
    errorState.value = {
      error: null,
      message: null,
      stack: null,
      timestamp: null
    }
  }

  const withErrorBoundary = <T>(fn: () => T): T | null => {
    try {
      return fn()
    } catch (error) {
      setError(error as Error, 'withErrorBoundary')
      return null
    }
  }

  const withAsyncErrorBoundary = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn()
    } catch (error) {
      setError(error as Error, 'withAsyncErrorBoundary')
      return null
    }
  }

  const getUserFriendlyMessage = (): string => {
    if (!hasError.value) return ''

    const error = errorState.value.error
    if (!error) return ''

    // Map specific errors to user-friendly messages
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    }

    if (error.name === 'ValidationError') {
      return '入力データに問題があります。内容を確認してください。'
    }

    if (error.name === 'RangeError' || error.message.includes('index')) {
      return 'データの表示中に問題が発生しました。ページを再読み込みしてください。'
    }

    if (error.name === 'TypeError') {
      return 'データの処理中に問題が発生しました。'
    }

    // Fallback message
    return '予期しないエラーが発生しました。問題が継続する場合は管理者にお問い合わせください。'
  }

  return {
    errorState,
    hasError,
    shouldShowError,
    setError,
    clearError,
    withErrorBoundary,
    withAsyncErrorBoundary,
    getUserFriendlyMessage
  }
}