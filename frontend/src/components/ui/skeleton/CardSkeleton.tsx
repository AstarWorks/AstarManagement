"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CardSkeletonProps {
  cardSize?: 'compact' | 'normal' | 'detailed'
  showPriority?: boolean
  showDueDates?: boolean
  showAvatars?: boolean
  className?: string
}

/**
 * Skeleton component that matches MatterCard layout exactly
 * Supports all view preferences to prevent layout shifts
 */
export function CardSkeleton({
  cardSize = 'normal',
  showPriority = true,
  showDueDates = true,
  showAvatars = true,
  className
}: CardSkeletonProps) {
  // Match MatterCard height classes exactly
  const cardHeight = {
    compact: 'h-20',
    normal: 'h-28',
    detailed: 'h-36'
  }[cardSize]

  return (
    <Card
      className={cn(
        "cursor-default transition-none", // No hover effects for skeleton
        "border-l-4 border-l-muted", // Match border-l-4 structure
        cardHeight,
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Title skeleton */}
              <Skeleton className="h-4 w-32 rounded" />
              
              {/* Priority badge skeleton */}
              {showPriority && (
                <Skeleton className="h-5 w-16 rounded-full" />
              )}
            </div>
            
            {/* Case number and status skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
          
          {/* Drag handle or relevance score area */}
          <div className="flex flex-col gap-1">
            <Skeleton className="w-1 h-1 rounded-full" />
            <Skeleton className="w-1 h-1 rounded-full" />
            <Skeleton className="w-1 h-1 rounded-full" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Client name skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>

          {/* Due date skeleton */}
          {showDueDates && (
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          )}

          {/* Status duration skeleton for detailed view */}
          {cardSize === 'detailed' && (
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          )}

          {/* Last updated skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded" />
            <Skeleton className="h-3 w-18 rounded" />
          </div>

          {/* Avatars skeleton */}
          {showAvatars && (
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Multiple card skeletons for loading states
 */
export function CardSkeletonGroup({
  count = 3,
  ...props
}: CardSkeletonProps & { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} {...props} />
      ))}
    </div>
  )
}