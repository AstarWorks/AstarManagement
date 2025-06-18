/**
 * Scroll Area component for smooth scrolling with custom scrollbars
 * 
 * @description Provides custom-styled scrollable areas with thin scrollbars
 * optimized for mobile and desktop interfaces.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ScrollAreaProps extends React.ComponentProps<'div'> {
  orientation?: 'vertical' | 'horizontal' | 'both'
  className?: string
  children: React.ReactNode
}

interface ScrollBarProps {
  orientation: 'horizontal' | 'vertical'
  className?: string
}

/**
 * ScrollArea Component
 */
function ScrollArea({ 
  orientation = 'vertical', 
  className, 
  children, 
  ...props 
}: ScrollAreaProps) {
  const scrollClasses = {
    vertical: 'overflow-y-auto overflow-x-hidden',
    horizontal: 'overflow-x-auto overflow-y-hidden',
    both: 'overflow-auto'
  }

  return (
    <div
      className={cn(
        "relative",
        scrollClasses[orientation],
        // Custom scrollbar styles
        "[&::-webkit-scrollbar]:w-2",
        "[&::-webkit-scrollbar]:h-2",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30",
        // Firefox scrollbar
        "scrollbar-thin",
        "scrollbar-track-transparent",
        "scrollbar-thumb-muted-foreground/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ScrollBar Component (for when you need standalone scrollbar)
 */
function ScrollBar({ orientation, className }: ScrollBarProps) {
  return (
    <div
      className={cn(
        "absolute bg-muted-foreground/20 rounded-full transition-colors hover:bg-muted-foreground/30",
        orientation === 'horizontal' 
          ? "bottom-0 left-0 right-0 h-2" 
          : "top-0 right-0 bottom-0 w-2",
        className
      )}
    />
  )
}

export { ScrollArea, ScrollBar }