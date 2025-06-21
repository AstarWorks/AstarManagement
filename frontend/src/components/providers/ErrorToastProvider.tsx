/**
 * Error toast provider that monitors store errors and displays notifications
 *
 * @description Provides automatic error toast notifications by monitoring
 * Zustand store error states and displaying appropriate user-friendly messages
 * with recovery actions. Integrates with the existing Sonner toast system.
 */

'use client'

import {useEffect, useRef} from 'react'
import {toast} from 'sonner'
import {useToastNotifications} from '@/hooks/use-toast-notifications'
import {AlertTriangle, RefreshCw, LogIn, HelpCircle, RotateCcw} from 'lucide-react'
import {useMatterDataStore} from '@/stores/kanban/matter-data-store'
import {getContextualErrorMessage, ErrorAction, ErrorType, BoardError} from '@/services/error/error.handler'

interface ErrorToastProviderProps {
    children: React.ReactNode
}

/**
 * Provider that monitors error states and shows toast notifications
 */
export function ErrorToastProvider({children}: ErrorToastProviderProps) {
    // Use the actual hooks from the modular stores
    const error = useMatterDataStore((state) => state.error)
    const clearError = useMatterDataStore((state) => state.clearError)
    const refreshBoard = useMatterDataStore((state) => state.fetchMatters)
    const lastErrorId = useRef<string | null>(null)

    useEffect(() => {
        
        if (!error) {
            lastErrorId.current = null
            return
        }

        // Prevent duplicate toasts for the same error
        const errorId = `${error.type}-${error.message}-${error.timestamp}`
        if (lastErrorId.current === errorId) {
            return
        }
        lastErrorId.current = errorId

        // Get contextual error message
        const contextualMessage = getContextualErrorMessage(error as BoardError, 'general')

        // Determine toast type and icon based on error type
        const getErrorIcon = (type: ErrorType) => {
            switch (type) {
                case ErrorType.NETWORK:
                    return RefreshCw
                case ErrorType.AUTHENTICATION:
                    return LogIn
                case ErrorType.AUTHORIZATION:
                    return HelpCircle
                case ErrorType.VALIDATION:
                    return AlertTriangle
                default:
                    return AlertTriangle
            }
        }

        // Create action buttons based on error action
        const createActionButton = (action: ErrorAction) => {
            switch (action) {
                case ErrorAction.RETRY:
                    return {
                        label: 'Retry',
                        onClick: () => {
                            clearError()
                            refreshBoard()
                        }
                    }
                case ErrorAction.LOGIN:
                    return {
                        label: 'Login',
                        onClick: () => {
                            clearError()
                            window.location.href = '/login'
                        }
                    }
                case ErrorAction.REFRESH_PAGE:
                    return {
                        label: 'Refresh',
                        onClick: () => {
                            window.location.reload()
                        }
                    }
                case ErrorAction.CHECK_INPUT:
                    return {
                        label: 'Dismiss',
                        onClick: () => {
                            clearError()
                        }
                    }
                case ErrorAction.CONTACT_SUPPORT:
                    return {
                        label: 'Contact Support',
                        onClick: () => {
                            clearError()
                            // TODO: Implement support contact logic
                        }
                    }
                default:
                    return {
                        label: 'Dismiss',
                        onClick: () => {
                            clearError()
                        }
                    }
            }
        }

        const Icon = getErrorIcon(error.type)
        const actionButton = error.action ? createActionButton(error.action) : null

        // Show appropriate toast based on error severity
        const isRecoverable = error.canRetry || error.action === ErrorAction.RETRY
        const isAuthenticationIssue = error.type === ErrorType.AUTHENTICATION
        const isValidationIssue = error.type === ErrorType.VALIDATION

        if (isValidationIssue) {
            // Validation errors are less severe - show as warning
            toast.warning(contextualMessage, {
                icon: <Icon className="size-4"/>,
                description: error.details || 'Please check your input and try again.',
                duration: 6000,
                action: actionButton ? {
                    label: actionButton.label,
                    onClick: actionButton.onClick
                } : undefined,
                id: errorId
            })
        } else if (isAuthenticationIssue) {
            // Authentication errors need immediate attention
            toast.error(contextualMessage, {
                icon: <Icon className="size-4"/>,
                description: 'Your session may have expired. Please log in again.',
                duration: 10000, // Longer duration for critical errors
                action: actionButton ? {
                    label: actionButton.label,
                    onClick: actionButton.onClick
                } : undefined,
                id: errorId
            })
        } else if (isRecoverable) {
            // Recoverable errors show with retry option
            toast.error(contextualMessage, {
                icon: <Icon className="size-4"/>,
                description: error.details || 'This error can be resolved by retrying.',
                duration: 8000,
                action: actionButton ? {
                    label: actionButton.label,
                    onClick: actionButton.onClick
                } : undefined,
                id: errorId
            })
        } else {
            // Non-recoverable errors
            toast.error(contextualMessage, {
                icon: <Icon className="size-4"/>,
                description: error.details || 'Please contact support if this issue persists.',
                duration: 12000, // Longest duration for serious errors
                action: actionButton ? {
                    label: actionButton.label,
                    onClick: actionButton.onClick
                } : undefined,
                id: errorId
            })
        }

        // Auto-clear certain types of errors after showing toast
        if (error.type === ErrorType.VALIDATION) {
            // Clear validation errors automatically after a delay
            setTimeout(() => {
                clearError()
            }, 6000)
        }

    }, [error, clearError, refreshBoard])

    // Success notifications for user actions
    useEffect(() => {
        let previousMatterCount = useMatterDataStore.getState().matters.length

        // Subscribe to store changes
        const unsubscribe = useMatterDataStore.subscribe((state) => {
            const currentMatterCount = state.matters.length

            // Detect successful operations based on matter changes
            if (currentMatterCount > previousMatterCount) {
                // New matter added
                toast.success('Matter created successfully', {
                    icon: <RotateCcw className="size-4"/>,
                    duration: 3000
                })
            }

            previousMatterCount = currentMatterCount
        })

        return () => {
            unsubscribe()
        }
    }, [])

    return <>{children}</>
}

/**
 * Hook to manually trigger success notifications
 */
export function useSuccessToast() {
    return {
        success: (message: string, description?: string) => {
            toast.success(message, {
                description,
                duration: 3000
            })
        },
        info: (message: string, description?: string) => {
            toast.info(message, {
                description,
                duration: 4000
            })
        },
        warning: (message: string, description?: string) => {
            toast.warning(message, {
                description,
                duration: 5000
            })
        }
    }
}

/**
 * Hook to manually trigger error notifications
 */
export function useErrorToast() {
    return {
        error: (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
            toast.error(message, {
                description,
                duration: 8000,
                action
            })
        }
    }
}