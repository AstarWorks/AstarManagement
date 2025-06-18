"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { BoardSkeleton, MobileBoardSkeleton } from "./skeleton/BoardSkeleton"
import { CardSkeletonGroup } from "./skeleton/CardSkeleton"
import { FormSkeleton } from "./skeleton/FormSkeleton"

interface ProgressiveLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  priority?: 'high' | 'medium' | 'low'
  delay?: number
  className?: string
}

/**
 * Progressive loader with staged loading priorities
 */
export function ProgressiveLoader({
  children,
  fallback,
  priority = 'medium',
  delay = 0,
  className
}: ProgressiveLoaderProps) {
  const [showContent, setShowContent] = React.useState(false)
  
  React.useEffect(() => {
    // Priority-based delay for progressive loading
    const priorityDelay = {
      high: 0,
      medium: 100,
      low: 200
    }[priority]
    
    const totalDelay = delay + priorityDelay
    
    const timer = setTimeout(() => {
      setShowContent(true)
    }, totalDelay)
    
    return () => clearTimeout(timer)
  }, [delay, priority])
  
  if (!showContent) {
    return (
      <div className={cn("animate-pulse", className)}>
        {fallback}
      </div>
    )
  }
  
  return <>{children}</>
}

/**
 * Board-specific progressive loader
 */
export function BoardProgressiveLoader({
  children,
  columnCount = 4,
  cardsPerColumn = 3,
  isMobile = false,
  className
}: {
  children: React.ReactNode
  columnCount?: number
  cardsPerColumn?: number
  isMobile?: boolean
  className?: string
}) {
  return (
    <ProgressiveLoader
      priority="high"
      className={className}
      fallback={
        isMobile ? (
          <MobileBoardSkeleton />
        ) : (
          <BoardSkeleton 
            columnCount={columnCount}
            cardsPerColumn={cardsPerColumn}
          />
        )
      }
    >
      {children}
    </ProgressiveLoader>
  )
}

/**
 * Card list progressive loader
 */
export function CardListProgressiveLoader({
  children,
  cardCount = 5,
  cardSize = 'normal',
  className
}: {
  children: React.ReactNode
  cardCount?: number
  cardSize?: 'compact' | 'normal' | 'detailed'
  className?: string
}) {
  return (
    <ProgressiveLoader
      priority="medium"
      className={className}
      fallback={
        <CardSkeletonGroup 
          count={cardCount}
          cardSize={cardSize}
        />
      }
    >
      {children}
    </ProgressiveLoader>
  )
}

/**
 * Form progressive loader
 */
export function FormProgressiveLoader({
  children,
  fields = 4,
  layout = 'single',
  className
}: {
  children: React.ReactNode
  fields?: number
  layout?: 'single' | 'double' | 'grid'
  className?: string
}) {
  return (
    <ProgressiveLoader
      priority="low"
      className={className}
      fallback={
        <FormSkeleton 
          fields={fields}
          layout={layout}
        />
      }
    >
      {children}
    </ProgressiveLoader>
  )
}

/**
 * Suspense wrapper with error boundary
 */
export function SuspenseLoader({
  children,
  fallback,
  errorFallback,
  className
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  className?: string
}) {
  const ErrorBoundary = React.useMemo(() => {
    return class extends React.Component<
      { children: React.ReactNode; fallback?: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
      }

      static getDerivedStateFromError() {
        return { hasError: true }
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('SuspenseLoader Error:', error, errorInfo)
      }

      render() {
        if (this.state.hasError) {
          return this.props.fallback || (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              Something went wrong. Please try again.
            </div>
          )
        }

        return this.props.children
      }
    }
  }, [])

  return (
    <div className={className}>
      <ErrorBoundary fallback={errorFallback}>
        <React.Suspense fallback={fallback}>
          {children}
        </React.Suspense>
      </ErrorBoundary>
    </div>
  )
}

/**
 * Lazy component loader with skeleton
 */
export function LazyComponentLoader({
  component: Component,
  skeletonComponent: SkeletonComponent,
  errorComponent: ErrorComponent,
  props = {},
  className
}: {
  component: React.ComponentType<any>
  skeletonComponent: React.ComponentType<any>
  errorComponent?: React.ComponentType<any>
  props?: any
  className?: string
}) {
  return (
    <SuspenseLoader
      className={className}
      fallback={<SkeletonComponent {...props} />}
      errorFallback={ErrorComponent ? <ErrorComponent {...props} /> : undefined}
    >
      <Component {...props} />
    </SuspenseLoader>
  )
}