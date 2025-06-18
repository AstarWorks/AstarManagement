/**
 * Custom swipe gesture detection hook
 * 
 * @description Detects swipe gestures on touch devices with configurable sensitivity
 * and direction handling. Optimized for Kanban board column navigation.
 * 
 * @example
 * ```tsx
 * const swipeHandlers = useSwipe({
 *   onSwipedLeft: () => navigateToNextColumn(),
 *   onSwipedRight: () => navigateToPreviousColumn(),
 *   delta: 50 // Minimum swipe distance
 * })
 * 
 * return <div {...swipeHandlers}>Swipeable content</div>
 * ```
 */

import * as React from 'react'

interface SwipeConfig {
  onSwipedLeft?: () => void
  onSwipedRight?: () => void
  onSwipedUp?: () => void
  onSwipedDown?: () => void
  onSwiping?: (deltaX: number, deltaY: number) => void
  delta?: number // Minimum distance for swipe detection
  preventDefaultTouchmoveEvent?: boolean
  trackMouse?: boolean // Track mouse events for desktop testing
}

interface TouchData {
  startX: number
  startY: number
  startTime: number
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseUp?: (e: React.MouseEvent) => void
}

export function useSwipe(config: SwipeConfig): SwipeHandlers {
  const {
    onSwipedLeft,
    onSwipedRight,
    onSwipedUp,
    onSwipedDown,
    onSwiping,
    delta = 50,
    preventDefaultTouchmoveEvent = true,
    trackMouse = false
  } = config

  const touchDataRef = React.useRef<TouchData | null>(null)
  const mouseDataRef = React.useRef<TouchData | null>(null)
  const isSwiping = React.useRef<boolean>(false)

  // Touch handlers
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    }
    isSwiping.current = false
  }, [])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!touchDataRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchDataRef.current.startX
    const deltaY = touch.clientY - touchDataRef.current.startY

    // Call onSwiping callback if provided
    onSwiping?.(deltaX, deltaY)

    // Check if we've moved enough to consider it a swipe
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      isSwiping.current = true
    }

    // Prevent default if configured and we're swiping horizontally more than vertically
    if (preventDefaultTouchmoveEvent && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
    }
  }, [onSwiping, preventDefaultTouchmoveEvent])

  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    if (!touchDataRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchDataRef.current.startX
    const deltaY = touch.clientY - touchDataRef.current.startY
    const deltaTime = Date.now() - touchDataRef.current.startTime

    // Reset touch data
    touchDataRef.current = null
    isSwiping.current = false

    // Check if swipe meets minimum distance and time requirements
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const isValidSwipe = (absX > delta || absY > delta) && deltaTime < 1000

    if (!isValidSwipe) return

    // Determine swipe direction (prioritize the larger movement)
    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipedRight?.()
      } else {
        onSwipedLeft?.()
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipedDown?.()
      } else {
        onSwipedUp?.()
      }
    }
  }, [delta, onSwipedLeft, onSwipedRight, onSwipedUp, onSwipedDown])

  // Mouse handlers for desktop testing
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!trackMouse) return

    mouseDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now()
    }
    isSwiping.current = false
  }, [trackMouse])

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!trackMouse || !mouseDataRef.current) return

    const deltaX = e.clientX - mouseDataRef.current.startX
    const deltaY = e.clientY - mouseDataRef.current.startY

    onSwiping?.(deltaX, deltaY)

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      isSwiping.current = true
    }
  }, [trackMouse, onSwiping])

  const handleMouseUp = React.useCallback((e: React.MouseEvent) => {
    if (!trackMouse || !mouseDataRef.current) return

    const deltaX = e.clientX - mouseDataRef.current.startX
    const deltaY = e.clientY - mouseDataRef.current.startY
    const deltaTime = Date.now() - mouseDataRef.current.startTime

    mouseDataRef.current = null
    isSwiping.current = false

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const isValidSwipe = (absX > delta || absY > delta) && deltaTime < 1000

    if (!isValidSwipe) return

    if (absX > absY) {
      if (deltaX > 0) {
        onSwipedRight?.()
      } else {
        onSwipedLeft?.()
      }
    } else {
      if (deltaY > 0) {
        onSwipedDown?.()
      } else {
        onSwipedUp?.()
      }
    }
  }, [trackMouse, delta, onSwipedLeft, onSwipedRight, onSwipedUp, onSwipedDown])

  // Return handlers
  const handlers: SwipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }

  if (trackMouse) {
    handlers.onMouseDown = handleMouseDown
    handlers.onMouseMove = handleMouseMove
    handlers.onMouseUp = handleMouseUp
  }

  return handlers
}

// Utility hook for common swipe patterns
export function useHorizontalSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options?: Partial<SwipeConfig>
) {
  return useSwipe({
    onSwipedLeft: onSwipeLeft,
    onSwipedRight: onSwipeRight,
    delta: 50,
    ...options
  })
}