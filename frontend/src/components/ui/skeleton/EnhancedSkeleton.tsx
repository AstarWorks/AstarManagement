"use client"

import { cn } from "@/lib/utils"

/**
 * Enhanced skeleton with shimmer animation support
 * Extends the base skeleton with GPU-accelerated animations
 */
function EnhancedSkeleton({ 
  className, 
  shimmer = true,
  variant = 'default',
  ...props 
}: React.ComponentProps<"div"> & { 
  shimmer?: boolean
  variant?: 'default' | 'rounded' | 'circle' | 'line'
}) {
  const variantClasses = {
    default: 'rounded-md',
    rounded: 'rounded-lg', 
    circle: 'rounded-full aspect-square',
    line: 'rounded-sm h-4'
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent relative overflow-hidden",
        variantClasses[variant],
        shimmer && "animate-pulse",
        className
      )}
      style={{
        background: shimmer 
          ? `linear-gradient(90deg, 
              hsl(var(--accent)) 25%, 
              hsl(var(--accent) / 0.5) 50%, 
              hsl(var(--accent)) 75%
            )`
          : undefined,
        backgroundSize: shimmer ? '200% 100%' : undefined,
        animation: shimmer 
          ? 'shimmer 2s ease-in-out infinite, pulse 2s ease-in-out infinite' 
          : 'pulse 2s ease-in-out infinite'
      }}
      {...props}
    />
  )
}

/**
 * Text skeleton with proper line height
 */
function TextSkeleton({
  lines = 1,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  lines?: number
}) {
  if (lines === 1) {
    return <EnhancedSkeleton variant="line" className={className} {...props} />
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <EnhancedSkeleton 
          key={i} 
          variant="line" 
          className={i === lines - 1 ? "w-3/4" : "w-full"}
          {...props}
        />
      ))}
    </div>
  )
}

/**
 * Avatar skeleton
 */
function AvatarSkeleton({
  size = 'default',
  className,
  ...props
}: React.ComponentProps<"div"> & {
  size?: 'sm' | 'default' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    default: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <EnhancedSkeleton
      variant="circle"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
}

/**
 * Button skeleton
 */
function ButtonSkeleton({
  size = 'default',
  className,
  ...props
}: React.ComponentProps<"div"> & {
  size?: 'sm' | 'default' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-8 w-16',
    default: 'h-9 w-20',
    lg: 'h-10 w-24'
  }

  return (
    <EnhancedSkeleton
      variant="rounded"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
}

export { 
  EnhancedSkeleton as Skeleton,
  TextSkeleton,
  AvatarSkeleton,
  ButtonSkeleton
}