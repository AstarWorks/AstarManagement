/**
 * Hook for displaying toast notifications
 * 
 * Integrates with error handler to display user-friendly notifications
 * for API errors and other application events
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { 
  BoardError, 
  ErrorType, 
  ErrorAction,
  getContextualErrorMessage 
} from '@/services/error/error.handler'

interface ToastOptions {
  duration?: number
  important?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Hook for displaying toast notifications
 */
export function useToastNotifications() {
  /**
   * Show error toast based on BoardError
   */
  const showError = useCallback((
    error: BoardError, 
    context: 'login' | 'matter' | 'general' = 'general',
    options?: ToastOptions
  ) => {
    const message = getContextualErrorMessage(error, context)
    
    // Determine toast action based on error action
    let action: ToastOptions['action'] | undefined
    
    switch (error.action) {
      case ErrorAction.RETRY:
        if (options?.action) {
          action = options.action
        }
        break
      case ErrorAction.LOGIN:
        action = {
          label: 'Go to Login',
          onClick: () => {
            window.location.href = '/login'
          }
        }
        break
      case ErrorAction.CONTACT_SUPPORT:
        action = {
          label: 'Contact Support',
          onClick: () => {
            window.open('/support', '_blank')
          }
        }
        break
    }

    // Show toast with appropriate styling
    toast.error(message, {
      description: error.details,
      duration: options?.duration || 5000,
      important: options?.important || error.type === ErrorType.AUTHENTICATION,
      action,
      dismissible: true,
      id: error.correlationId // Prevent duplicate toasts
    })
  }, [])

  /**
   * Show success toast
   */
  const showSuccess = useCallback((
    message: string,
    description?: string,
    options?: ToastOptions
  ) => {
    toast.success(message, {
      description,
      duration: options?.duration || 3000,
      important: options?.important,
      action: options?.action
    })
  }, [])

  /**
   * Show info toast
   */
  const showInfo = useCallback((
    message: string,
    description?: string,
    options?: ToastOptions
  ) => {
    toast.info(message, {
      description,
      duration: options?.duration || 4000,
      important: options?.important,
      action: options?.action
    })
  }, [])

  /**
   * Show warning toast
   */
  const showWarning = useCallback((
    message: string,
    description?: string,
    options?: ToastOptions
  ) => {
    toast.warning(message, {
      description,
      duration: options?.duration || 4000,
      important: options?.important,
      action: options?.action
    })
  }, [])

  /**
   * Show loading toast (returns toast ID for later update)
   */
  const showLoading = useCallback((
    message: string,
    description?: string
  ): string | number => {
    return toast.loading(message, {
      description,
      duration: Infinity // Will be dismissed manually
    })
  }, [])

  /**
   * Update existing toast
   */
  const updateToast = useCallback((
    toastId: string | number,
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    description?: string,
    options?: ToastOptions
  ) => {
    toast[type](message, {
      id: toastId,
      description,
      duration: options?.duration || 3000,
      important: options?.important,
      action: options?.action
    })
  }, [])

  /**
   * Dismiss toast
   */
  const dismissToast = useCallback((toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }, [])

  /**
   * Show promise-based toast
   */
  const showPromise = useCallback(<T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: options?.duration || 3000,
      important: options?.important
    })
  }, [])

  return {
    showError,
    showSuccess,
    showInfo,
    showWarning,
    showLoading,
    updateToast,
    dismissToast,
    showPromise
  }
}

/**
 * Helper to show error toasts for async operations
 */
export function showAsyncError(
  operation: string,
  error: BoardError,
  onRetry?: () => void
) {
  const retryAction = onRetry && error.canRetry ? {
    label: 'Retry',
    onClick: onRetry
  } : undefined

  toast.error(`Failed to ${operation}`, {
    description: error.message,
    action: retryAction,
    duration: 5000,
    important: true
  })
}