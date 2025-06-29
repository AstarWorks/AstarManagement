"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface PerformanceMetrics {
  skeletonRenderTime: number
  contentLoadTime: number
  layoutShiftScore: number
  animationFrameRate: number
  loadingStateTransitionTime: number
}

interface PerformanceTesterProps {
  children: React.ReactNode
  onMetrics?: (metrics: PerformanceMetrics) => void
  enableLogging?: boolean
  className?: string
}

/**
 * Performance testing utility for loading states
 * Measures skeleton render time, content load time, and layout stability
 */
export function PerformanceTester({
  children,
  onMetrics,
  enableLogging = false,
  className
}: PerformanceTesterProps) {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [showSkeleton, setShowSkeleton] = React.useState(true)
  
  const startTimeRef = React.useRef<number>(0)
  const skeletonRenderTimeRef = React.useRef<number>(0)
  const layoutShiftObserverRef = React.useRef<ResizeObserver | null>(null)
  const animationFrameRef = React.useRef<number>(0)
  const frameCountRef = React.useRef<number>(0)
  const lastFrameTimeRef = React.useRef<number>(0)

  // Measure skeleton render time
  React.useEffect(() => {
    startTimeRef.current = performance.now()
    
    // Measure skeleton render time
    const skeletonTimer = setTimeout(() => {
      skeletonRenderTimeRef.current = performance.now() - startTimeRef.current
      setMetrics(prev => ({
        ...prev,
        skeletonRenderTime: skeletonRenderTimeRef.current
      }))
      
      if (enableLogging) {
        console.log(`🏗️ Skeleton render time: ${skeletonRenderTimeRef.current.toFixed(2)}ms`)
      }
    }, 0)

    return () => clearTimeout(skeletonTimer)
  }, [enableLogging])

  // Measure animation frame rate
  React.useEffect(() => {
    const measureFrameRate = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp
      }
      
      const deltaTime = timestamp - lastFrameTimeRef.current
      if (deltaTime >= 1000) { // Measure over 1 second
        const fps = frameCountRef.current
        frameCountRef.current = 0
        lastFrameTimeRef.current = timestamp
        
        setMetrics(prev => ({
          ...prev,
          animationFrameRate: fps
        }))
        
        if (enableLogging && fps < 50) {
          console.warn(`⚠️ Low animation frame rate: ${fps}fps (target: 60fps)`)
        }
      } else {
        frameCountRef.current++
      }
      
      if (showSkeleton) {
        animationFrameRef.current = requestAnimationFrame(measureFrameRate)
      }
    }
    
    if (showSkeleton) {
      animationFrameRef.current = requestAnimationFrame(measureFrameRate)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [showSkeleton, enableLogging])

  // Simulate content loading and measure transition time
  React.useEffect(() => {
    const loadTimer = setTimeout(() => {
      const transitionStartTime = performance.now()
      setShowSkeleton(false)
      
      // Measure content load time
      const contentTimer = setTimeout(() => {
        const contentLoadTime = performance.now() - startTimeRef.current
        const transitionTime = performance.now() - transitionStartTime
        
        setMetrics(prev => {
          const finalMetrics = {
            ...prev,
            contentLoadTime,
            loadingStateTransitionTime: transitionTime
          }
          
          onMetrics?.(finalMetrics as PerformanceMetrics)
          
          if (enableLogging) {
            console.log(`📊 Content load time: ${contentLoadTime.toFixed(2)}ms`)
            console.log(`🔄 Loading state transition: ${transitionTime.toFixed(2)}ms`)
            console.log('📈 Performance Metrics:', finalMetrics)
            
            // Performance targets check
            if (contentLoadTime > 1000) {
              console.warn(`⚠️ Slow content load: ${contentLoadTime.toFixed(2)}ms (target: <1000ms)`)
            }
            if (transitionTime > 200) {
              console.warn(`⚠️ Slow loading transition: ${transitionTime.toFixed(2)}ms (target: <200ms)`)
            }
          }
          
          return finalMetrics
        })
        
        setIsLoading(false)
      }, 50) // Simulate content render time
      
      return () => clearTimeout(contentTimer)
    }, 2000) // Simulate loading time
    
    return () => clearTimeout(loadTimer)
  }, [onMetrics, enableLogging])

  return (
    <div className={cn("relative", className)}>
      {showSkeleton ? (
        <div data-testid="skeleton-loading">
          <div className="animate-pulse">
            {/* Skeleton content placeholder */}
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div data-testid="loaded-content">
          {children}
        </div>
      )}
      
      {enableLogging && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 text-xs font-mono max-w-sm">
          <h4 className="font-semibold mb-2">Performance Metrics</h4>
          <div className="space-y-1">
            {metrics.skeletonRenderTime && (
              <div>Skeleton: {metrics.skeletonRenderTime.toFixed(2)}ms</div>
            )}
            {metrics.contentLoadTime && (
              <div>Content: {metrics.contentLoadTime.toFixed(2)}ms</div>
            )}
            {metrics.loadingStateTransitionTime && (
              <div>Transition: {metrics.loadingStateTransitionTime.toFixed(2)}ms</div>
            )}
            {metrics.animationFrameRate && (
              <div>FPS: {metrics.animationFrameRate}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook to measure loading performance in components
 */
export function useLoadingPerformance(name: string, enabled = false) {
  const startTimeRef = React.useRef<number>(0)
  
  const startMeasurement = React.useCallback(() => {
    if (enabled) {
      startTimeRef.current = performance.now()
    }
  }, [enabled])
  
  const endMeasurement = React.useCallback((stage: string) => {
    if (enabled && startTimeRef.current > 0) {
      const duration = performance.now() - startTimeRef.current
      console.log(`⏱️ ${name} ${stage}: ${duration.toFixed(2)}ms`)
      
      // Performance checks
      if (stage === 'skeleton' && duration > 50) {
        console.warn(`⚠️ Slow skeleton render for ${name}: ${duration.toFixed(2)}ms (target: <50ms)`)
      }
      if (stage === 'content' && duration > 200) {
        console.warn(`⚠️ Slow content load for ${name}: ${duration.toFixed(2)}ms (target: <200ms)`)
      }
    }
  }, [enabled, name])
  
  return { startMeasurement, endMeasurement }
}

/**
 * Layout shift detection utility
 */
export function useLayoutShiftDetection(enabled = false) {
  const [shiftScore, setShiftScore] = React.useState(0)
  const observerRef = React.useRef<ResizeObserver | null>(null)
  
  const attachObserver = React.useCallback((element: HTMLElement | null) => {
    if (!enabled || !element) return
    
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const layoutShift = Math.abs(width * height) / 10000 // Simplified CLS calculation
        
        setShiftScore(prev => {
          const newScore = prev + layoutShift
          if (newScore > 0.1 && enabled) {
            console.warn(`⚠️ High layout shift detected: ${newScore.toFixed(3)} (target: <0.1)`)
          }
          return newScore
        })
      }
    })
    
    observerRef.current.observe(element)
  }, [enabled])
  
  React.useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])
  
  return { shiftScore, attachObserver }
}