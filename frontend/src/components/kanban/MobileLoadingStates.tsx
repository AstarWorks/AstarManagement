/**
 * Mobile-optimized loading states for Kanban board
 * 
 * @description Provides skeleton loading states and spinners optimized for
 * mobile touch interfaces with appropriate sizing and animations.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, RefreshCw } from 'lucide-react'

interface MobileLoadingProps {
  className?: string
}

/**
 * Mobile Card Skeleton
 */
export function MobileCardSkeleton({ className }: MobileLoadingProps) {
  return (
    <div className={cn(
      "bg-card rounded-lg border p-3 space-y-3 animate-pulse",
      className
    )}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-3 bg-muted rounded w-12" />
      </div>
      
      {/* Title skeleton */}
      <div className="h-4 bg-muted rounded w-3/4" />
      
      {/* Client skeleton */}
      <div className="h-3 bg-muted rounded w-1/2" />
      
      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-6 w-6 bg-muted rounded-full" />
      </div>
    </div>
  )
}

/**
 * Mobile Column Loading
 */
export function MobileColumnLoading({ className }: MobileLoadingProps) {
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {/* Column header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-5 bg-muted rounded w-32 mb-2" />
          <div className="h-3 bg-muted rounded w-20" />
        </div>
        <div className="h-8 w-8 bg-muted rounded" />
      </div>
      
      {/* Card skeletons */}
      <MobileCardSkeleton />
      <MobileCardSkeleton />
      <MobileCardSkeleton />
      
      {/* Loading more indicator */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading more...</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile Board Loading (Full screen)
 */
export function MobileBoardLoading({ className }: MobileLoadingProps) {
  return (
    <div className={cn("flex flex-col h-full w-full bg-background", className)}>
      {/* Header skeleton */}
      <div className="border-b bg-background p-4 space-y-3">
        <div className="h-6 bg-muted rounded w-48" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
      
      {/* Navigation skeleton */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8 bg-muted rounded" />
          <div>
            <div className="h-4 bg-muted rounded w-24 mb-1" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="border-b bg-background p-2">
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="h-11 w-16 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1">
        <MobileColumnLoading />
      </div>
    </div>
  )
}

/**
 * Refresh Loading Indicator
 */
export function RefreshLoading({ 
  isVisible = false, 
  className 
}: MobileLoadingProps & { isVisible?: boolean }) {
  if (!isVisible) return null
  
  return (
    <div className={cn(
      "fixed top-20 left-1/2 transform -translate-x-1/2 z-50",
      "bg-background border rounded-full shadow-lg px-3 py-2",
      "flex items-center gap-2",
      className
    )}>
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">Refreshing...</span>
    </div>
  )
}

/**
 * Pull to Refresh Indicator
 */
export function PullToRefreshIndicator({ 
  isVisible = false,
  progress = 0,
  className 
}: MobileLoadingProps & { 
  isVisible?: boolean
  progress?: number 
}) {
  if (!isVisible) return null
  
  return (
    <div className={cn(
      "absolute top-0 left-1/2 transform -translate-x-1/2 z-40",
      "transition-all duration-200 ease-out",
      className
    )}
    style={{ transform: `translateX(-50%) translateY(${progress * 60 - 60}px)` }}
    >
      <div className="bg-background border rounded-full shadow-lg p-2">
        <RefreshCw 
          className="h-5 w-5 text-muted-foreground"
          style={{ 
            transform: `rotate(${progress * 180}deg)`,
            transition: progress === 0 ? 'transform 0.2s ease-out' : 'none'
          }}
        />
      </div>
    </div>
  )
}

/**
 * Touch Loading Feedback
 */
export function TouchLoadingFeedback({ 
  isVisible = false,
  position = { x: 0, y: 0 },
  className 
}: MobileLoadingProps & { 
  isVisible?: boolean
  position?: { x: number; y: number }
}) {
  if (!isVisible) return null
  
  return (
    <div 
      className={cn(
        "fixed pointer-events-none z-50",
        "w-16 h-16 bg-primary/20 rounded-full",
        "flex items-center justify-center",
        "animate-ping",
        className
      )}
      style={{
        left: position.x - 32,
        top: position.y - 32,
      }}
    >
      <div className="w-8 h-8 bg-primary/40 rounded-full" />
    </div>
  )
}

/**
 * Connection Status Loading
 */
export function ConnectionStatusLoading({ 
  status = 'connecting',
  className 
}: MobileLoadingProps & { 
  status?: 'connecting' | 'syncing' | 'offline' | 'error'
}) {
  const statusConfig = {
    connecting: {
      icon: Loader2,
      text: 'Connecting...',
      color: 'text-blue-500'
    },
    syncing: {
      icon: RefreshCw,
      text: 'Syncing...',
      color: 'text-green-500'
    },
    offline: {
      icon: () => <div className="w-2 h-2 bg-gray-500 rounded-full" />,
      text: 'Offline',
      color: 'text-gray-500'
    },
    error: {
      icon: () => <div className="w-2 h-2 bg-red-500 rounded-full" />,
      text: 'Connection Error',
      color: 'text-red-500'
    }
  }
  
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50",
      "text-xs font-medium",
      config.color,
      className
    )}>
      <Icon className={cn(
        "h-3 w-3", 
        (status === 'connecting' || status === 'syncing') && "animate-spin"
      )} />
      <span>{config.text}</span>
    </div>
  )
}