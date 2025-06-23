import { ref, computed, onMounted, onUnmounted, readonly, type Ref, type ComputedRef } from 'vue'
import { useSwipe, usePointerSwipe, type SwipeDirection } from '@vueuse/core'
import { useGesture, type Handler } from '@vueuse/gesture'
import type { GestureState, Vector2 } from '@vueuse/gesture'

export interface TouchGestureOptions {
  threshold?: number
  swipeThreshold?: number
  longPressTime?: number
  preventDefaultTouch?: boolean
  enableHapticFeedback?: boolean
}

export interface TouchGestureResult {
  isPressed: Ref<boolean>
  isPinching: Ref<boolean>
  isLongPress: Ref<boolean>
  swipeDirection: Ref<SwipeDirection | null>
  pinchScale: Ref<number>
  dragPosition: Ref<Vector2>
  dragOffset: Ref<Vector2>
  velocity: ComputedRef<number>
  reset: () => void
}

const DEFAULT_OPTIONS: TouchGestureOptions = {
  threshold: 10,
  swipeThreshold: 50,
  longPressTime: 500,
  preventDefaultTouch: true,
  enableHapticFeedback: true
}

export function useTouchGestures(
  target: Ref<HTMLElement | null>,
  options: TouchGestureOptions = {}
): TouchGestureResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // State refs
  const isPressed = ref(false)
  const isPinching = ref(false)
  const isLongPress = ref(false)
  const swipeDirection = ref<SwipeDirection | null>(null)
  const pinchScale = ref(1)
  const dragPosition = ref<Vector2>([0, 0])
  const dragOffset = ref<Vector2>([0, 0])
  const initialPinchDistance = ref(0)
  const lastVelocity = ref<Vector2>([0, 0])
  
  // Long press timer
  let longPressTimer: NodeJS.Timeout | null = null
  
  // Computed velocity
  const velocity = computed(() => {
    const [vx, vy] = lastVelocity.value
    return Math.sqrt(vx * vx + vy * vy)
  })
  
  // Swipe detection using VueUse
  const { direction, lengthX, lengthY } = useSwipe(target, {
    threshold: opts.swipeThreshold,
    onSwipe() {
      swipeDirection.value = direction.value
      triggerHapticFeedback()
    },
    onSwipeEnd() {
      setTimeout(() => {
        swipeDirection.value = null
      }, 100)
    }
  })
  
  // Gesture handlers
  const dragHandler: Handler<'drag'> = (state) => {
    if (state.first) {
      isPressed.value = true
      startLongPressTimer()
    }
    
    if (state.last) {
      isPressed.value = false
      cancelLongPressTimer()
      isLongPress.value = false
    }
    
    dragPosition.value = state.xy
    dragOffset.value = state.offset
    lastVelocity.value = state.velocity
    
    if (opts.preventDefaultTouch && state.event) {
      state.event.preventDefault()
    }
  }
  
  const pinchHandler: Handler<'pinch'> = (state) => {
    if (state.first) {
      isPinching.value = true
      initialPinchDistance.value = state.da[0]
    }
    
    if (state.last) {
      isPinching.value = false
      pinchScale.value = 1
    }
    
    if (isPinching.value && initialPinchDistance.value > 0) {
      pinchScale.value = state.da[0] / initialPinchDistance.value
    }
    
    if (opts.preventDefaultTouch && state.event) {
      state.event.preventDefault()
    }
  }
  
  // Long press detection
  const startLongPressTimer = () => {
    cancelLongPressTimer()
    longPressTimer = setTimeout(() => {
      if (isPressed.value && !isPinching.value) {
        isLongPress.value = true
        triggerHapticFeedback('medium')
      }
    }, opts.longPressTime)
  }
  
  const cancelLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }
  
  // Haptic feedback
  const triggerHapticFeedback = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!opts.enableHapticFeedback) return
    
    if ('vibrate' in navigator) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30
      navigator.vibrate(duration)
    }
  }
  
  // Apply gesture handlers
  useGesture(
    {
      onDrag: dragHandler,
      onPinch: pinchHandler
    },
    {
      target,
      eventOptions: { passive: !opts.preventDefaultTouch }
    }
  )
  
  // Reset function
  const reset = () => {
    isPressed.value = false
    isPinching.value = false
    isLongPress.value = false
    swipeDirection.value = null
    pinchScale.value = 1
    dragPosition.value = [0, 0]
    dragOffset.value = [0, 0]
    lastVelocity.value = [0, 0]
    cancelLongPressTimer()
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    cancelLongPressTimer()
  })
  
  return {
    isPressed: readonly(isPressed),
    isPinching: readonly(isPinching),
    isLongPress: readonly(isLongPress),
    swipeDirection: readonly(swipeDirection),
    pinchScale: readonly(pinchScale),
    dragPosition: readonly(dragPosition),
    dragOffset: readonly(dragOffset),
    velocity,
    reset
  }
}

// Additional composable for mobile-specific interactions
export function useMobileInteractions() {
  const isTouchDevice = ref('ontouchstart' in window)
  const orientation = ref<'portrait' | 'landscape'>('portrait')
  const isIOS = ref(/iPad|iPhone|iPod/.test(navigator.userAgent))
  const isAndroid = ref(/Android/.test(navigator.userAgent))
  
  // Update orientation
  const updateOrientation = () => {
    orientation.value = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }
  
  // Safe area detection for iOS
  const safeAreaInsets = computed(() => {
    if (!isIOS.value) return { top: 0, bottom: 0, left: 0, right: 0 }
    
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0')
    }
  })
  
  // Touch-friendly click handler with prevention of double-tap zoom
  const useTouchClick = (handler: () => void, delay = 300) => {
    let lastTap = 0
    
    return () => {
      const now = Date.now()
      if (now - lastTap < delay) {
        return // Prevent double tap
      }
      lastTap = now
      handler()
    }
  }
  
  onMounted(() => {
    updateOrientation()
    window.addEventListener('orientationchange', updateOrientation)
    window.addEventListener('resize', updateOrientation)
  })
  
  onUnmounted(() => {
    window.removeEventListener('orientationchange', updateOrientation)
    window.removeEventListener('resize', updateOrientation)
  })
  
  return {
    isTouchDevice: readonly(isTouchDevice),
    orientation: readonly(orientation),
    isIOS: readonly(isIOS),
    isAndroid: readonly(isAndroid),
    safeAreaInsets,
    useTouchClick
  }
}