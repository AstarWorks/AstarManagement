import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useThrottleFn, useRafFn, useElementVisibility } from '@vueuse/core'
import type { Ref } from 'vue'

export interface IVirtualScrollOptions {
  /** Height of each item in pixels */
  itemHeight: number
  /** Height of the container in pixels */
  containerHeight: number
  /** Number of items to render outside visible area for smooth scrolling */
  overscan: number
  /** Enable performance monitoring */
  showPerformanceMetrics: boolean
  /** Enable scroll indicators */
  showScrollIndicators: boolean
}

export interface IVirtualScrollMetrics {
  /** Current FPS */
  fps: Ref<number>
  /** Currently visible item count */
  visibleCount: Ref<number>
  /** Start index of visible range */
  startIndex: Ref<number>
  /** End index of visible range */
  endIndex: Ref<number>
  /** Current scroll position */
  scrollTop: Ref<number>
  /** Whether can scroll up */
  canScrollUp: Ref<boolean>
  /** Whether can scroll down */
  canScrollDown: Ref<boolean>
}

export interface IVirtualScrollHandlers {
  /** Throttled scroll event handler */
  handleScroll: (event: Event) => void
  /** Keyboard navigation handler */
  handleKeydown: (event: KeyboardEvent) => void
  /** Scroll to specific index */
  scrollToIndex: (index: number) => void
  /** Scroll to top */
  scrollToTop: () => void
  /** Scroll to bottom */
  scrollToBottom: () => void
  /** Scroll by delta pixels */
  scrollBy: (delta: number) => void
}

export interface IVirtualScrollReturn<T> {
  /** Container element ref */
  containerRef: Ref<HTMLElement | undefined>
  /** Currently visible items */
  visibleItems: Ref<T[]>
  /** Y offset for positioning */
  offsetY: Ref<number>
  /** Total height of all items */
  totalHeight: Ref<number>
  /** Performance and state metrics */
  metrics: IVirtualScrollMetrics
  /** Event handlers */
  handlers: IVirtualScrollHandlers
  /** Whether component is in development mode */
  isDevelopment: Ref<boolean>
}

/**
 * Composable for virtual scrolling functionality
 * Handles performance-optimized rendering of large item lists
 */
export function useVirtualScrolling<T>(
  items: Ref<T[]>,
  options: IVirtualScrollOptions
): IVirtualScrollReturn<T> {
  // Refs
  const containerRef = ref<HTMLElement>()
  const scrollTop = ref(0)
  const scrollLeft = ref(0)

  // Performance tracking
  const fps = ref(0)
  const frameCount = ref(0)
  const lastTime = ref(Date.now())
  const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

  // Element visibility for performance optimization
  const isVisible = useElementVisibility(containerRef)

  // Computed properties
  const totalHeight = computed(() => items.value.length * options.itemHeight)

  const visibleCount = computed(() => 
    Math.ceil(options.containerHeight / options.itemHeight) + options.overscan * 2
  )

  const startIndex = computed(() => {
    const index = Math.floor(scrollTop.value / options.itemHeight) - options.overscan
    return Math.max(0, index)
  })

  const endIndex = computed(() => {
    const index = startIndex.value + visibleCount.value
    return Math.min(items.value.length - 1, index)
  })

  const visibleItems = computed(() => 
    items.value.slice(startIndex.value, endIndex.value + 1)
  )

  const offsetY = computed(() => startIndex.value * options.itemHeight)

  const canScrollUp = computed(() => scrollTop.value > 0)
  const canScrollDown = computed(() => 
    scrollTop.value + options.containerHeight < totalHeight.value
  )

  // Throttled scroll handler for performance
  const handleScroll = useThrottleFn((event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
    scrollLeft.value = target.scrollLeft
  }, 16) // ~60fps

  // Performance monitoring with RAF
  const { pause: pauseRaf, resume: resumeRaf } = useRafFn(() => {
    frameCount.value++
    const now = Date.now()
    
    if (now - lastTime.value >= 1000) {
      fps.value = frameCount.value
      frameCount.value = 0
      lastTime.value = now
    }
  }, { immediate: false })

  // Auto pause/resume performance monitoring based on visibility
  watch(isVisible, (visible) => {
    if (options.showPerformanceMetrics) {
      if (visible) {
        resumeRaf()
      } else {
        pauseRaf()
      }
    }
  })

  // Scroll methods
  const scrollToIndex = (index: number) => {
    if (containerRef.value) {
      const targetScrollTop = index * options.itemHeight
      containerRef.value.scrollTop = targetScrollTop
    }
  }

  const scrollToTop = () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0
    }
  }

  const scrollToBottom = () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = totalHeight.value
    }
  }

  const scrollBy = (delta: number) => {
    if (containerRef.value) {
      const newScrollTop = Math.max(0, Math.min(
        totalHeight.value - options.containerHeight,
        scrollTop.value + delta
      ))
      containerRef.value.scrollTop = newScrollTop
    }
  }

  // Keyboard navigation
  const handleKeydown = (event: KeyboardEvent) => {
    if (!containerRef.value) return
    
    const currentFocus = document.activeElement
    const isInContainer = containerRef.value.contains(currentFocus)
    
    if (!isInContainer) return
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        scrollBy(-options.itemHeight)
        break
      case 'ArrowDown':
        event.preventDefault()
        scrollBy(options.itemHeight)
        break
      case 'PageUp':
        event.preventDefault()
        scrollBy(-options.containerHeight)
        break
      case 'PageDown':
        event.preventDefault()
        scrollBy(options.containerHeight)
        break
      case 'Home':
        if (event.ctrlKey) {
          event.preventDefault()
          scrollToTop()
        }
        break
      case 'End':
        if (event.ctrlKey) {
          event.preventDefault()
          scrollToBottom()
        }
        break
      default:
        // No action needed for other keys
        break
    }
  }

  // Handle items length changes
  watch(() => items.value.length, async () => {
    // Reset scroll position when items change significantly
    await nextTick()
    if (containerRef.value && scrollTop.value > totalHeight.value) {
      containerRef.value.scrollTop = 0
    }
  })

  // Lifecycle
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    if (options.showPerformanceMetrics && isVisible.value) {
      resumeRaf()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    pauseRaf()
  })

  return {
    containerRef,
    visibleItems,
    offsetY,
    totalHeight,
    metrics: {
      fps,
      visibleCount,
      startIndex,
      endIndex,
      scrollTop,
      canScrollUp,
      canScrollDown
    },
    handlers: {
      handleScroll,
      handleKeydown,
      scrollToIndex,
      scrollToTop,
      scrollToBottom,
      scrollBy
    },
    isDevelopment
  }
}