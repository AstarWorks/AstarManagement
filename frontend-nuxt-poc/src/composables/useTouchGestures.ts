import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Composable for handling touch gestures and mobile-specific drag-and-drop behavior
 * Provides mobile detection, touch configuration, and gesture optimization
 */
export function useTouchGestures() {
  // Reactive state
  const isMobile = ref(false)
  const isTablet = ref(false)
  const touchStartTime = ref(0)
  const touchDevice = ref<'desktop' | 'tablet' | 'mobile'>('desktop')

  /**
   * Detect device type based on user agent and screen size
   */
  const detectDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const screenWidth = window.innerWidth
    
    // Mobile detection
    const mobileRegex = /android|iphone|ipod|blackberry|iemobile|opera mini/i
    const tabletRegex = /ipad|android.*tablet|kindle|silk/i
    
    isMobile.value = mobileRegex.test(userAgent) || screenWidth < 768
    isTablet.value = tabletRegex.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024)
    
    // Set device type
    if (isMobile.value) {
      touchDevice.value = 'mobile'
    } else if (isTablet.value) {
      touchDevice.value = 'tablet'
    } else {
      touchDevice.value = 'desktop'
    }
  }

  /**
   * Computed drag delay based on device type
   * Mobile devices need longer delay to distinguish between scroll and drag
   */
  const dragDelay = computed(() => {
    switch (touchDevice.value) {
      case 'mobile':
        return 200 // Longer delay for mobile to prevent accidental drags
      case 'tablet':
        return 100 // Medium delay for tablets
      default:
        return 0 // No delay for desktop
    }
  })

  /**
   * Computed touch start threshold
   * Distance in pixels before drag is initiated
   */
  const touchStartThreshold = computed(() => {
    switch (touchDevice.value) {
      case 'mobile':
        return 15 // Higher threshold for mobile
      case 'tablet':
        return 10 // Medium threshold for tablets
      default:
        return 5 // Lower threshold for desktop
    }
  })

  /**
   * Computed fallback tolerance for touch devices
   * Distance in pixels before fallback mode is activated
   */
  const fallbackTolerance = computed(() => {
    return touchDevice.value !== 'desktop' ? 5 : 0
  })

  /**
   * Check if touch events should be enabled
   */
  const shouldUseTouchEvents = computed(() => {
    return isMobile.value || isTablet.value
  })

  /**
   * Get Sortable.js configuration optimized for current device
   */
  const getSortableConfig = () => {
    const baseConfig = {
      animation: 150,
      ghostClass: 'drag-ghost',
      chosenClass: 'drag-chosen',
      dragClass: 'drag-active',
      forceFallback: shouldUseTouchEvents.value,
      fallbackClass: 'drag-fallback',
      removeCloneOnHide: true,
      preventOnFilter: false,
      scrollSensitivity: 30,
      scrollSpeed: 10
    }

    // Touch-specific configuration
    if (shouldUseTouchEvents.value) {
      return {
        ...baseConfig,
        delay: dragDelay.value,
        delayOnTouchStart: true,
        touchStartThreshold: touchStartThreshold.value,
        fallbackTolerance: fallbackTolerance.value,
        // Prevent scrolling during drag on mobile
        dragoverBubble: false,
        // Touch-specific scroll settings
        scrollSensitivity: 50,
        scrollSpeed: 20
      }
    }

    return baseConfig
  }

  /**
   * Handle touch start for custom gesture detection
   * @param event - Touch start event
   */
  const onTouchStart = (event: TouchEvent) => {
    touchStartTime.value = Date.now()
    
    // Store initial touch position for gesture detection
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      // Could store touch position for custom gesture detection
    }
  }

  /**
   * Handle touch move for scroll vs drag conflict resolution
   * @param event - Touch move event
   */
  const onTouchMove = (event: TouchEvent) => {
    // This is handled by Sortable.js, but we can add custom logic here
    // For example, preventing default behavior during drag operations
  }

  /**
   * Handle touch end for gesture completion
   * @param event - Touch end event
   */
  const onTouchEnd = (event: TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime.value
    touchStartTime.value = 0
    
    // Could implement custom gesture recognition here
    // For example, distinguishing between tap, long press, and swipe
  }

  /**
   * Optimize scroll behavior for touch devices
   */
  const optimizeScrolling = () => {
    if (shouldUseTouchEvents.value) {
      // Enable momentum scrolling on iOS
      document.body.style.webkitOverflowScrolling = 'touch'
      
      // Prevent overscroll bounce on mobile
      document.body.style.overscrollBehavior = 'none'
    }
  }

  /**
   * Add touch-specific CSS classes for styling
   */
  const addTouchClasses = () => {
    document.documentElement.classList.add(`device-${touchDevice.value}`)
    
    if (shouldUseTouchEvents.value) {
      document.documentElement.classList.add('touch-device')
    } else {
      document.documentElement.classList.add('no-touch')
    }
  }

  /**
   * Remove touch-specific CSS classes
   */
  const removeTouchClasses = () => {
    document.documentElement.classList.remove(
      'device-mobile',
      'device-tablet', 
      'device-desktop',
      'touch-device',
      'no-touch'
    )
  }

  /**
   * Handle window resize to re-detect device type
   */
  const onResize = () => {
    detectDeviceType()
    addTouchClasses()
    optimizeScrolling()
  }

  // Lifecycle hooks
  onMounted(() => {
    detectDeviceType()
    addTouchClasses()
    optimizeScrolling()
    
    // Listen for resize events
    window.addEventListener('resize', onResize)
    
    // Add touch event listeners if needed
    if (shouldUseTouchEvents.value) {
      document.addEventListener('touchstart', onTouchStart, { passive: true })
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd, { passive: true })
    }
  })

  onUnmounted(() => {
    // Clean up event listeners
    window.removeEventListener('resize', onResize)
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
    
    // Remove CSS classes
    removeTouchClasses()
  })

  return {
    // Device detection
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    touchDevice: readonly(touchDevice),
    shouldUseTouchEvents: readonly(shouldUseTouchEvents),
    
    // Configuration
    dragDelay: readonly(dragDelay),
    touchStartThreshold: readonly(touchStartThreshold),
    fallbackTolerance: readonly(fallbackTolerance),
    
    // Methods
    getSortableConfig,
    detectDeviceType,
    
    // Event handlers
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}