/**
 * Toast notification hooks for consistent messaging across the application
 */

import { toast, ExternalToast } from 'sonner'
import { AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'

// Remove 'important' property since it's not part of ExternalToast type
type ToastOptions = Omit<ExternalToast, 'important'>

/**
 * Hook for displaying toast notifications with consistent styling
 */
export function useToastNotifications() {
  /**
   * Show a success toast
   */
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      icon: <CheckCircle className="h-5 w-5" />,
      duration: 4000,
      ...options,
    })
  }

  /**
   * Show an error toast
   */
  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      icon: <AlertCircle className="h-5 w-5" />,
      duration: 6000,
      ...options,
    })
  }

  /**
   * Show an info toast
   */
  const showInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, {
      icon: <Info className="h-5 w-5" />,
      duration: 4000,
      ...options,
    })
  }

  /**
   * Show a warning toast
   */
  const showWarning = (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      icon: <AlertTriangle className="h-5 w-5" />,
      duration: 5000,
      ...options,
    })
  }

  /**
   * Show a loading toast
   */
  const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
      ...options,
    })
  }

  /**
   * Show a promise toast
   */
  const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    })
  }

  /**
   * Dismiss a toast by ID
   */
  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId)
  }

  /**
   * Dismiss all toasts
   */
  const dismissAll = () => {
    toast.dismiss()
  }

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    showPromise,
    dismiss,
    dismissAll,
  }
}

// Export individual functions for convenience
export const toastSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    icon: <CheckCircle className="h-5 w-5" />,
    duration: 4000,
    ...options,
  })
}

export const toastError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    icon: <AlertCircle className="h-5 w-5" />,
    duration: 6000,
    ...options,
  })
}

export const toastInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    icon: <Info className="h-5 w-5" />,
    duration: 4000,
    ...options,
  })
}

export const toastWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    icon: <AlertTriangle className="h-5 w-5" />,
    duration: 5000,
    ...options,
  })
}

export const toastLoading = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    ...options,
  })
}

export const toastPromise = <T,>(
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
    ...options,
  })
}