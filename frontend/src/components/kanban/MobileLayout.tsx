/**
 * Mobile Layout Component with Viewport and Touch Optimizations
 * 
 * @description Provides mobile-optimized layout wrapper with viewport management,
 * touch target optimization, and performance enhancements for mobile devices.
 */

"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: React.ReactNode
  className?: string
  enablePullToRefresh?: boolean
  onRefresh?: () => Promise<void>
  disableZoom?: boolean
  optimizeTouch?: boolean
}

/**
 * Mobile Layout Component
 * 
 * @description Wraps content with mobile-specific optimizations including
 * viewport configuration, touch handling, and performance improvements.
 */
export function MobileLayout({
  children,
  className,
  enablePullToRefresh = false,
  onRefresh,
  disableZoom = true,
  optimizeTouch = true
}: MobileLayoutProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isPulling, setIsPulling] = React.useState(false)
  
  // Touch state for pull-to-refresh
  const touchStartY = React.useRef<number>(0)
  const lastTouchY = React.useRef<number>(0)

  // Viewport and touch optimizations
  React.useEffect(() => {
    // Set mobile viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.name = 'viewport'
      document.head.appendChild(viewportMeta)
    }

    const viewportContent = [
      'width=device-width',
      'initial-scale=1.0',
      disableZoom ? 'maximum-scale=1.0' : 'maximum-scale=5.0',
      disableZoom ? 'user-scalable=no' : 'user-scalable=yes',
      'viewport-fit=cover',
      'shrink-to-fit=no'
    ].join(', ')

    viewportMeta.content = viewportContent

    // iOS-specific optimizations
    if (typeof window !== 'undefined') {
      // Prevent zoom on input focus (iOS)
      if (disableZoom) {
        const style = document.createElement('style')
        style.textContent = `
          input, select, textarea {
            font-size: 16px !important;
          }
        `
        document.head.appendChild(style)
        
        return () => {
          document.head.removeChild(style)
        }
      }
    }
  }, [disableZoom])

  // Touch optimization
  React.useEffect(() => {
    if (!optimizeTouch) return

    // Prevent double-tap zoom
    let lastTouchEnd = 0
    const preventDoubleClick = (event: TouchEvent) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }

    // Prevent pinch zoom if disabled
    const preventPinchZoom = (event: TouchEvent) => {
      if (disableZoom && event.touches.length > 1) {
        event.preventDefault()
      }
    }

    // Add touch event listeners
    document.addEventListener('touchend', preventDoubleClick, { passive: false })
    document.addEventListener('touchstart', preventPinchZoom, { passive: false })
    document.addEventListener('touchmove', preventPinchZoom, { passive: false })

    return () => {
      document.removeEventListener('touchend', preventDoubleClick)
      document.removeEventListener('touchstart', preventPinchZoom)
      document.removeEventListener('touchmove', preventPinchZoom)
    }
  }, [optimizeTouch, disableZoom])

  // Pull-to-refresh handlers
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || !containerRef.current) return
    
    const scrollTop = containerRef.current.scrollTop
    if (scrollTop > 0) return
    
    touchStartY.current = e.touches[0].clientY
    lastTouchY.current = e.touches[0].clientY
  }, [enablePullToRefresh])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || !containerRef.current) return
    
    const scrollTop = containerRef.current.scrollTop
    if (scrollTop > 0) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current
    
    if (diff > 0) {
      setIsPulling(true)
      setPullDistance(Math.min(diff * 0.5, 80)) // Damping effect
      
      // Prevent default scrolling when pulling
      e.preventDefault()
    }
    
    lastTouchY.current = currentY
  }, [enablePullToRefresh])

  const handleTouchEnd = React.useCallback(async () => {
    if (!enablePullToRefresh || !isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance > 60 && onRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }, [enablePullToRefresh, isPulling, pullDistance, onRefresh, isRefreshing])

  // CSS for touch optimization
  const touchStyles = React.useMemo(() => {
    if (!optimizeTouch) return {}
    
    return {
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      touchAction: disableZoom ? 'pan-y' : 'manipulation'
    } as React.CSSProperties
  }, [optimizeTouch, disableZoom])

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-auto",
        // Touch-friendly scrolling
        "overscroll-behavior-y-contain",
        // Smooth scrolling on iOS
        "-webkit-overflow-scrolling-touch",
        className
      )}
      style={touchStyles}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {enablePullToRefresh && (isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-transform duration-200"
          style={{ 
            transform: `translateX(-50%) translateY(${isPulling ? pullDistance - 40 : isRefreshing ? 20 : -40}px)` 
          }}
        >
          <div className="bg-background border rounded-full shadow-lg p-3 flex items-center justify-center">
            <div 
              className={cn(
                "w-6 h-6 border-2 border-primary border-t-transparent rounded-full",
                (isRefreshing || pullDistance > 60) && "animate-spin"
              )}
              style={{
                transform: !isRefreshing && isPulling ? `rotate(${(pullDistance / 60) * 180}deg)` : undefined
              }}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div 
        className="min-h-full"
        style={{
          paddingTop: enablePullToRefresh && isPulling ? `${pullDistance}px` : undefined,
          transition: enablePullToRefresh && !isPulling ? 'padding-top 0.2s ease-out' : undefined
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Touch Target Wrapper
 * 
 * @description Ensures minimum touch target size (44x44px) for mobile accessibility
 */
export function TouchTarget({ 
  children, 
  className,
  minSize = 44,
  ...props 
}: React.ComponentProps<'div'> & { minSize?: number }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        className
      )}
      style={{
        minWidth: `${minSize}px`,
        minHeight: `${minSize}px`,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Safe Area Container
 * 
 * @description Handles safe area insets for devices with notches or home indicators
 */
export function SafeAreaContainer({ 
  children, 
  className,
  includeTop = true,
  includeBottom = true 
}: {
  children: React.ReactNode
  className?: string
  includeTop?: boolean
  includeBottom?: boolean
}) {
  return (
    <div 
      className={cn(
        "w-full h-full",
        includeTop && "pt-safe-top",
        includeBottom && "pb-safe-bottom",
        className
      )}
      style={{
        paddingTop: includeTop ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: includeBottom ? 'env(safe-area-inset-bottom)' : undefined,
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {children}
    </div>
  )
}