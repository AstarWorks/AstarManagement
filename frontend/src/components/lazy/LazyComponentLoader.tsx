/**
 * Lazy Component Loader with enhanced loading states and error boundaries
 * Provides code splitting with graceful loading and error handling
 */

import React, { Suspense, ComponentType } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// Loading skeleton components for different use cases
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

export const BoardSkeleton = () => (
  <div className="flex gap-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex-shrink-0 w-80">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-24 w-full" />
          ))}
        </div>
      </div>
    ))}
  </div>
)

export const FormSkeleton = () => (
  <div className="space-y-4 p-6 max-w-md">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
)

export const PDFViewerSkeleton = () => (
  <div className="flex flex-col h-96 border rounded-lg bg-muted/10">
    <div className="flex items-center justify-between p-4 border-b">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
    <div className="flex-1 p-4">
      <Skeleton className="h-full w-full" />
    </div>
  </div>
)

export const AnalyticsSkeleton = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
)

// Error boundary component for lazy loaded components
interface LazyErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error) => void
}

interface LazyErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class LazyErrorBoundary extends React.Component<LazyErrorBoundaryProps, LazyErrorBoundaryState> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/5">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load component</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {this.state.error?.message || 'An unexpected error occurred while loading this component.'}
          </p>
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for lazy loading with enhanced features
interface LazyWrapperOptions {
  fallback?: React.ComponentType
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
  delay?: number
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyWrapperOptions = {}
) {
  const {
    fallback: Fallback = LoadingSpinner,
    errorFallback,
    delay = 200,
    onLoad,
    onError
  } = options

  const LazyWrapper = React.forwardRef<any, P>((props, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true)
        if (onLoad) onLoad()
      }, delay)

      return () => clearTimeout(timer)
    }, [])

    if (!isVisible) {
      return <Fallback />
    }

    return (
      <LazyErrorBoundary fallback={errorFallback} onError={onError}>
        <Suspense fallback={<Fallback />}>
          <Component {...props} ref={ref} />
        </Suspense>
      </LazyErrorBoundary>
    )
  })

  LazyWrapper.displayName = `LazyWrapper(${Component.displayName || Component.name})`
  
  return LazyWrapper
}

// Preload function for lazy components
export function preloadComponent<T>(
  componentImporter: () => Promise<{ default: ComponentType<T> }>
): Promise<{ default: ComponentType<T> }> {
  return componentImporter()
}

// Utility hook for managing lazy component state
export function useLazyComponentState() {
  const [loadedComponents, setLoadedComponents] = React.useState<Set<string>>(new Set())
  const [failedComponents, setFailedComponents] = React.useState<Set<string>>(new Set())

  const markAsLoaded = React.useCallback((componentName: string) => {
    setLoadedComponents(prev => new Set(prev).add(componentName))
    setFailedComponents(prev => {
      const newSet = new Set(prev)
      newSet.delete(componentName)
      return newSet
    })
  }, [])

  const markAsFailed = React.useCallback((componentName: string) => {
    setFailedComponents(prev => new Set(prev).add(componentName))
  }, [])

  const isLoaded = React.useCallback((componentName: string) => {
    return loadedComponents.has(componentName)
  }, [loadedComponents])

  const hasFailed = React.useCallback((componentName: string) => {
    return failedComponents.has(componentName)
  }, [failedComponents])

  return {
    markAsLoaded,
    markAsFailed,
    isLoaded,
    hasFailed,
    loadedComponents: Array.from(loadedComponents),
    failedComponents: Array.from(failedComponents)
  }
}

export default withLazyLoading