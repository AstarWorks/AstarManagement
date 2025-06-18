"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CardSkeletonGroup } from './CardSkeleton'
import { cn } from '@/lib/utils'

interface BoardSkeletonProps {
  columnCount?: number
  cardsPerColumn?: number
  showHeader?: boolean
  showFilters?: boolean
  className?: string
}

/**
 * Column skeleton that matches KanbanColumn layout
 */
function ColumnSkeleton({ 
  cardsCount = 3,
  className 
}: { 
  cardsCount?: number
  className?: string 
}) {
  return (
    <div className={cn(
      "flex-shrink-0 flex flex-col",
      "w-80 h-full", // Match BOARD_CONFIG.minColumnWidth
      "bg-muted/30 rounded-lg p-4",
      className
    )}>
      {/* Column header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="w-8 h-8 rounded" />
      </div>
      
      {/* Column content skeleton */}
      <div className="flex-1 space-y-3 overflow-hidden">
        <CardSkeletonGroup 
          count={cardsCount}
          cardSize="normal"
          showPriority={true}
          showDueDates={true}
          showAvatars={true}
        />
        
        {/* Loading more indicator */}
        <div className="flex items-center justify-center py-2">
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Board skeleton that matches KanbanBoard layout exactly
 */
export function BoardSkeleton({
  columnCount = 4,
  cardsPerColumn = 3,
  showHeader = true,
  showFilters = true,
  className
}: BoardSkeletonProps) {
  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {/* Board Header skeleton */}
      {showHeader && (
        <div className="flex-shrink-0 p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters skeleton */}
      {showFilters && (
        <div className="flex-shrink-0 p-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-64 rounded" />
            <Skeleton className="h-9 w-32 rounded" />
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-28 rounded" />
          </div>
        </div>
      )}

      {/* Board Content skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div 
            className="flex h-full gap-4 p-4"
            style={{
              minWidth: `${columnCount * (320 + 16)}px` // 320px column width + 16px gap
            }}
          >
            {Array.from({ length: columnCount }, (_, i) => (
              <ColumnSkeleton 
                key={i}
                cardsCount={cardsPerColumn}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile board skeleton for responsive layouts
 */
export function MobileBoardSkeleton({
  showTabs = true,
  cardsCount = 5,
  className
}: {
  showTabs?: boolean
  cardsCount?: number
  className?: string
}) {
  return (
    <div className={cn("flex flex-col h-full w-full bg-background", className)}>
      {/* Mobile header skeleton */}
      <div className="border-b bg-background p-4 space-y-3">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      
      {/* Mobile navigation skeleton */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      
      {/* Mobile tabs skeleton */}
      {showTabs && (
        <div className="border-b bg-background p-2">
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-16 rounded-md" />
            ))}
          </div>
        </div>
      )}
      
      {/* Mobile content skeleton */}
      <div className="flex-1 p-4">
        <CardSkeletonGroup 
          count={cardsCount}
          cardSize="normal"
          showPriority={true}
          showDueDates={true}
          showAvatars={true}
        />
      </div>
    </div>
  )
}