/**
 * Responsive Kanban Board Wrapper
 * 
 * @description Automatically switches between desktop and mobile Kanban board
 * implementations based on screen size and device capabilities. Provides seamless
 * responsive experience across all devices.
 */

"use client"

import * as React from 'react'
import { useBreakpoints } from '@/hooks/use-media-query'
import { KanbanBoard } from './KanbanBoard'
import { KanbanBoardMobile } from './KanbanBoardMobile'
import type { KanbanBoardProps } from './types'

interface ResponsiveKanbanBoardProps extends KanbanBoardProps {
  // Optional overrides for responsive behavior
  forceMobile?: boolean
  forceDesktop?: boolean
  mobileBreakpoint?: string
}

/**
 * Responsive Kanban Board Component
 * 
 * @description Renders the appropriate Kanban board implementation based on
 * device capabilities and screen size. Automatically switches between desktop
 * drag-and-drop interface and mobile touch-optimized interface.
 * 
 * @param props - KanbanBoardProps with responsive overrides
 * @returns JSX.Element - Desktop or mobile Kanban board
 * 
 * @example
 * ```tsx
 * <KanbanBoardResponsive
 *   board={board}
 *   actions={actions}
 *   filters={filters}
 *   sorting={sorting}
 *   viewPreferences={viewPreferences}
 *   dragContext={dragContext}
 *   currentUser={currentUser}
 * />
 * ```
 */
export function KanbanBoardResponsive({
  forceMobile = false,
  forceDesktop = false,
  mobileBreakpoint = '(max-width: 767px)',
  ...props
}: ResponsiveKanbanBoardProps) {
  const { isMobile } = useBreakpoints()
  
  // Determine which version to render
  const shouldRenderMobile = React.useMemo(() => {
    if (forceDesktop) return false
    if (forceMobile) return true
    return isMobile
  }, [forceMobile, forceDesktop, isMobile])

  // Additional mobile optimizations
  const mobileProps = React.useMemo(() => {
    if (!shouldRenderMobile) return {}
    
    return {
      enableSwipeNavigation: true,
      showColumnCount: true,
      compactCards: true
    }
  }, [shouldRenderMobile])

  // Enhanced viewport management for mobile
  React.useEffect(() => {
    if (shouldRenderMobile) {
      // Add mobile viewport meta tag if not present
      let viewport = document.querySelector('meta[name="viewport"]')
      if (!viewport) {
        viewport = document.createElement('meta')
        viewport.setAttribute('name', 'viewport')
        document.head.appendChild(viewport)
      }
      
      // Set mobile-optimized viewport
      viewport.setAttribute(
        'content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      )
      
      // Prevent zoom on double tap
      document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
          event.preventDefault()
        }
      }, { passive: false })
      
      let lastTouchEnd = 0
      document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime()
        if (now - lastTouchEnd <= 300) {
          event.preventDefault()
        }
        lastTouchEnd = now
      }, false)
      
      return () => {
        // Cleanup is handled by the browser
      }
    }
  }, [shouldRenderMobile])

  // Performance monitoring for mobile
  React.useEffect(() => {
    if (shouldRenderMobile && typeof window !== 'undefined') {
      // Monitor performance on mobile devices
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`Mobile Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`)
          }
        }
      })
      
      try {
        observer.observe({ entryTypes: ['measure'] })
        return () => observer.disconnect()
      } catch (e) {
        // PerformanceObserver not supported
        console.warn('PerformanceObserver not supported')
      }
    }
  }, [shouldRenderMobile])

  if (shouldRenderMobile) {
    return (
      <KanbanBoardMobile
        {...props}
        {...mobileProps}
      />
    )
  }

  return (
    <KanbanBoard
      {...props}
    />
  )
}

// Export type for external use
export type { ResponsiveKanbanBoardProps }