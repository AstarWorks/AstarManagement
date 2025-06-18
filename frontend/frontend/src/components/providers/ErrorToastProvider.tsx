/**
 * Provider component that monitors Kanban store errors and displays toast notifications
 * 
 * This component watches for error state changes in the Kanban store
 * and automatically displays appropriate toast notifications to the user
 */

'use client'

import { useEffect, useRef } from 'react'
import { useKanbanStore } from '@/stores/kanban-store'
import { useToastNotifications } from '@/hooks/use-toast-notifications'
import { ErrorAction } from '@/services/error/error.handler'

interface ErrorToastProviderProps {
  children: React.ReactNode
}

/**
 * Error toast provider component
 */
export function ErrorToastProvider({ children }: ErrorToastProviderProps) {
  const error = useKanbanStore((state) => state.error)
  const clearError = useKanbanStore((state) => state.clearError)
  const refreshBoard = useKanbanStore((state) => state.refreshBoard)
  const { showError } = useToastNotifications()
  
  // Track the last error to prevent duplicate toasts
  const lastErrorRef = useRef<string | null>(null)

  useEffect(() => {
    if (!error) {
      lastErrorRef.current = null
      return
    }

    // Create a unique key for this error
    const errorKey = `${error.type}-${error.message}-${error.timestamp}`
    
    // Skip if we already showed this error
    if (errorKey === lastErrorRef.current) {
      return
    }

    lastErrorRef.current = errorKey

    // Determine context based on error details
    let context: 'login' | 'matter' | 'general' = 'general'
    if (error.message.toLowerCase().includes('matter') || 
        error.details?.toLowerCase().includes('matter')) {
      context = 'matter'
    } else if (error.type === 'AUTHENTICATION') {
      context = 'login'
    }

    // Show error with retry option if applicable
    const options = error.canRetry && error.action === ErrorAction.RETRY ? {
      action: {
        label: 'Retry',
        onClick: () => {
          clearError()
          refreshBoard()
        }
      }
    } : undefined

    showError(error, context, options)

    // Clear error after showing toast to prevent re-showing
    // Only clear if it's not an authentication error (those need manual action)
    if (error.type !== 'AUTHENTICATION') {
      setTimeout(() => {
        clearError()
      }, 100)
    }
  }, [error, clearError, refreshBoard, showError])

  return <>{children}</>
}

/**
 * Hook to manually trigger error toasts from components
 */
export function useErrorToast() {
  const setError = useKanbanStore((state) => state.setError)
  const { showError, showSuccess, showInfo, showWarning } = useToastNotifications()

  return {
    showError: (error: Parameters<typeof showError>[0], context?: Parameters<typeof showError>[1]) => {
      // Set error in store for logging/tracking
      setError(error)
      // Show toast notification
      showError(error, context)
    },
    showSuccess,
    showInfo,
    showWarning
  }
}