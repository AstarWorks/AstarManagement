/**
 * Global error boundary for React application
 * 
 * @description Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree
 * that crashed. Essential for production error handling and user experience.
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { logError, createUIError, ErrorType, ErrorAction } from '@/services/error/error.handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * Error boundary component that catches unhandled errors
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: crypto.randomUUID()
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = crypto.randomUUID()
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId
    })

    // Log error for debugging and monitoring
    const boardError = createUIError(
      error.message || 'An unexpected error occurred',
      ErrorType.UNKNOWN,
      ErrorAction.REFRESH_PAGE
    )
    
    logError({
      ...boardError,
      correlationId: errorId,
      details: `${error.stack}\n\nComponent Stack:${errorInfo.componentStack}`
    }, 'ErrorBoundary')

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external monitoring service
      console.error('Error Boundary caught an error:', {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  private handleRefresh = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private copyErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state
    const errorDetails = `Error ID: ${errorId}
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}`

    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard')
    }).catch(() => {
      console.log('Error details:', errorDetails)
    })
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="size-12 text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-600 dark:text-red-400">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-400">
                An unexpected error occurred. We've been notified and are working on a fix.
              </p>
              
              {this.state.errorId && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Error ID: {this.state.errorId.slice(0, 8)}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="size-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleRefresh}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="size-4 mr-2" />
                  Refresh Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="size-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="border-t pt-4">
                  <Button 
                    onClick={this.copyErrorDetails}
                    className="w-full"
                    variant="ghost"
                    size="sm"
                  >
                    <Bug className="size-4 mr-2" />
                    Copy Error Details
                  </Button>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      <div className="font-mono break-all">
                        <div><strong>Error:</strong> {this.state.error?.message}</div>
                        <div><strong>Stack:</strong></div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.error?.stack}
                        </pre>
                        {this.state.errorInfo && (
                          <>
                            <div><strong>Component Stack:</strong></div>
                            <pre className="whitespace-pre-wrap text-xs">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}