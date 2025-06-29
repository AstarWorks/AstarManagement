import { ref, computed, watch, readonly, type Ref } from 'vue'
import { useTouchGestures } from '~/composables/useTouchGestures'
import type { UseSwipeDirection } from '@vueuse/core'

type SwipeDirection = UseSwipeDirection

interface PdfGestureOptions {
  enableHapticFeedback?: boolean
  preventDefaultTouch?: boolean
  pinchThreshold?: number
  swipeThreshold?: number
}

interface PdfGestureEmits {
  (e: 'scale-changed', scale: number): void
  (e: 'next-page'): void
  (e: 'prev-page'): void
  (e: 'pan-changed', offset: { x: number; y: number }): void
}

const DEFAULT_OPTIONS: PdfGestureOptions = {
  enableHapticFeedback: true,
  preventDefaultTouch: true,
  pinchThreshold: 0.1,
  swipeThreshold: 50
}

export function usePdfGestures(
  container: Ref<HTMLElement | null>,
  emit: PdfGestureEmits,
  options: PdfGestureOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  const { 
    pinchScale, 
    dragOffset, 
    swipeDirection,
    isPressed,
    isPinching,
    reset: resetTouchGestures
  } = useTouchGestures(container, {
    enableHapticFeedback: opts.enableHapticFeedback,
    preventDefaultTouch: opts.preventDefaultTouch,
    swipeThreshold: opts.swipeThreshold
  })
  
  const baseScale = ref(1)
  const currentScale = ref(1)
  const panOffset = ref({ x: 0, y: 0 })
  const isGesturing = computed(() => isPressed.value || isPinching.value)
  
  // Pinch to zoom with momentum and constraints
  watch(pinchScale, (scale) => {
    if (scale !== 1 && isPinching.value) {
      const newScale = Math.max(0.5, Math.min(3, baseScale.value * scale))
      currentScale.value = newScale
    }
  })
  
  // Handle gesture end - commit scale changes
  watch(isPinching, (pinching) => {
    if (!pinching && pinchScale.value !== 1) {
      baseScale.value = currentScale.value
      emit('scale-changed', currentScale.value)
      
      // Trigger haptic feedback for scale completion
      if (opts.enableHapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(15)
      }
    }
  })
  
  // Swipe for page navigation with haptic feedback
  watch(swipeDirection, (direction: SwipeDirection | null) => {
    if (!direction) return
    
    switch (direction) {
      case 'left':
        navigator.vibrate?.(10) // Subtle haptic
        emit('next-page')
        break
      case 'right':
        navigator.vibrate?.(10)
        emit('prev-page')
        break
    }
  })
  
  // Pan for document positioning (only when not pinching)
  watch(dragOffset, (offset) => {
    if (!isPinching.value && isPressed.value) {
      const newOffset = {
        x: offset[0],
        y: offset[1]
      }
      panOffset.value = newOffset
      emit('pan-changed', newOffset)
    }
  })
  
  // Reset all gesture state
  const reset = () => {
    baseScale.value = 1
    currentScale.value = 1
    panOffset.value = { x: 0, y: 0 }
    resetTouchGestures()
  }
  
  // Set scale programmatically
  const setScale = (scale: number) => {
    const constrainedScale = Math.max(0.5, Math.min(3, scale))
    baseScale.value = constrainedScale
    currentScale.value = constrainedScale
    emit('scale-changed', constrainedScale)
  }
  
  // Zoom in/out methods
  const zoomIn = () => {
    const newScale = Math.min(3, currentScale.value * 1.25)
    setScale(newScale)
  }
  
  const zoomOut = () => {
    const newScale = Math.max(0.5, currentScale.value * 0.8)
    setScale(newScale)
  }
  
  return {
    currentScale: readonly(currentScale),
    panOffset: readonly(panOffset),
    isGesturing: readonly(isGesturing),
    isPinching: readonly(isPinching),
    reset,
    setScale,
    zoomIn,
    zoomOut
  }
}