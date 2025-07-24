import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useIntersectionObserver, useThrottleFn, useDebounceFn, useRafFn } from '@vueuse/core'

export interface PerformanceOptions {
  enableVirtualScroll?: boolean
  enableLazyLoading?: boolean
  enableGpuAcceleration?: boolean
  throttleMs?: number
  debounceMs?: number
}

const DEFAULT_OPTIONS: PerformanceOptions = {
  enableVirtualScroll: true,
  enableLazyLoading: true,
  enableGpuAcceleration: true,
  throttleMs: 16, // 60fps
  debounceMs: 300
}

export function useMobilePerformance(options: PerformanceOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Performance metrics
  const fps = ref(60)
  const memoryUsage = ref(0)
  const renderTime = ref(0)
  
  // Frame tracking
  let frameCount = 0
  let lastTime = performance.now()
  
  const measureFps = () => {
    const currentTime = performance.now()
    frameCount++
    
    if (currentTime >= lastTime + 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
      frameCount = 0
      lastTime = currentTime
    }
  }
  
  // Use RAF for smooth animations
  const { pause: pauseFpsTracking, resume: resumeFpsTracking } = useRafFn(measureFps)
  
  // Memory tracking (if available)
  const trackMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = Math.round(memory.usedJSHeapSize / 1048576) // MB
    }
  }
  
  // Enable GPU acceleration
  const enableGpuAcceleration = (element: HTMLElement) => {
    if (!opts.enableGpuAcceleration) return
    
    element.style.transform = 'translateZ(0)'
    element.style.willChange = 'transform'
    element.style.backfaceVisibility = 'hidden'
    element.style.perspective = '1000px'
  }
  
  // Virtual scrolling helper
  const useVirtualScroll = (
    containerRef: Ref<HTMLElement | null>,
    items: Ref<any[]>,
    itemHeight: number,
    bufferSize = 3
  ) => {
    const scrollTop = ref(0)
    const containerHeight = ref(0)
    
    const visibleRange = computed(() => {
      const start = Math.floor(scrollTop.value / itemHeight)
      const end = Math.ceil((scrollTop.value + containerHeight.value) / itemHeight)
      
      return {
        start: Math.max(0, start - bufferSize),
        end: Math.min(items.value.length, end + bufferSize)
      }
    })
    
    const visibleItems = computed(() => 
      items.value.slice(visibleRange.value.start, visibleRange.value.end)
    )
    
    const totalHeight = computed(() => items.value.length * itemHeight)
    
    const offsetY = computed(() => visibleRange.value.start * itemHeight)
    
    const handleScroll = useThrottleFn((e: Event) => {
      const target = e.target as HTMLElement
      scrollTop.value = target.scrollTop
    }, opts.throttleMs)
    
    onMounted(() => {
      if (!containerRef.value) return
      
      containerHeight.value = containerRef.value.clientHeight
      containerRef.value.addEventListener('scroll', handleScroll)
      
      // Update container height on resize
      const resizeObserver = new ResizeObserver((entries) => {
        containerHeight.value = entries[0].contentRect.height
      })
      resizeObserver.observe(containerRef.value)
      
      onUnmounted(() => {
        resizeObserver.disconnect()
        containerRef.value?.removeEventListener('scroll', handleScroll)
      })
    })
    
    return {
      visibleItems,
      totalHeight,
      offsetY,
      visibleRange
    }
  }
  
  // Lazy loading helper
  const useLazyLoad = (threshold = 0.1) => {
    const loadedItems = ref(new Set<string>())
    
    const observe = (element: HTMLElement, itemId: string, onVisible: () => void) => {
      if (loadedItems.value.has(itemId)) {
        onVisible()
        return
      }
      
      const { stop } = useIntersectionObserver(
        element,
        ([{ isIntersecting }]) => {
          if (isIntersecting && !loadedItems.value.has(itemId)) {
            loadedItems.value.add(itemId)
            onVisible()
            stop()
          }
        },
        { threshold }
      )
    }
    
    return {
      observe,
      loadedItems: readonly(loadedItems),
      isLoaded: (itemId: string) => loadedItems.value.has(itemId)
    }
  }
  
  // Touch-optimized scroll
  const optimizeScrolling = (element: HTMLElement) => {
    // Enable momentum scrolling
    ;(element.style as any).webkitOverflowScrolling = 'touch'
    element.style.overscrollBehavior = 'contain'
    
    // Prevent scroll chaining
    element.style.scrollSnapType = 'y proximity'
    
    // Optimize scrollbar
    element.style.scrollbarWidth = 'thin'
  }
  
  // Batch DOM updates
  const batchUpdates = <T>(updates: Array<() => T>): Promise<T[]> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const results = updates.map(update => update())
        resolve(results)
      })
    })
  }
  
  // Throttled/debounced utilities
  const throttle = <T extends (...args: any[]) => any>(
    fn: T,
    ms: number = opts.throttleMs || 150
  ) => useThrottleFn(fn, ms)
  
  const debounce = <T extends (...args: any[]) => any>(
    fn: T,
    ms: number = opts.debounceMs || 300
  ) => useDebounceFn(fn, ms)
  
  // Performance monitoring
  const startPerformanceMeasure = (name: string) => {
    performance.mark(`${name}-start`)
  }
  
  const endPerformanceMeasure = (name: string) => {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const entries = performance.getEntriesByName(name)
    if (entries.length > 0) {
      renderTime.value = entries[entries.length - 1].duration
    }
  }
  
  // Cleanup
  onUnmounted(() => {
    pauseFpsTracking()
  })
  
  return {
    // Metrics
    fps: readonly(fps),
    memoryUsage: readonly(memoryUsage),
    renderTime: readonly(renderTime),
    
    // Performance utilities
    enableGpuAcceleration,
    useVirtualScroll,
    useLazyLoad,
    optimizeScrolling,
    batchUpdates,
    throttle,
    debounce,
    
    // Performance monitoring
    startPerformanceMeasure,
    endPerformanceMeasure,
    trackMemory,
    
    // FPS tracking
    pauseFpsTracking,
    resumeFpsTracking
  }
}

// Specific optimizations for Kanban board
export function useKanbanPerformance() {
  const { 
    enableGpuAcceleration,
    useVirtualScroll,
    useLazyLoad,
    batchUpdates
  } = useMobilePerformance()
  
  // Optimize card rendering
  const optimizeCard = (cardElement: HTMLElement) => {
    // GPU acceleration for smooth animations
    enableGpuAcceleration(cardElement)
    
    // Optimize images
    const images = cardElement.querySelectorAll('img')
    images.forEach(img => {
      img.loading = 'lazy'
      img.decoding = 'async'
    })
  }
  
  // Optimize column scrolling
  const optimizeColumn = (columnElement: HTMLElement) => {
    // Enable momentum scrolling
    ;(columnElement.style as any).webkitOverflowScrolling = 'touch'
    
    // Contain layout
    columnElement.style.contain = 'layout style paint'
    
    // Optimize scrollbar
    columnElement.style.scrollbarGutter = 'stable'
  }
  
  // Batch card movements
  const batchCardMovements = async (movements: Array<{
    cardId: string
    fromColumn: string
    toColumn: string
    position: number
  }>) => {
    return batchUpdates(movements.map(move => () => {
      // Perform DOM update
      const card = document.getElementById(`card-${move.cardId}`)
      const targetColumn = document.getElementById(`column-${move.toColumn}`)
      
      if (card && targetColumn) {
        const container = targetColumn.querySelector('.matters-container')
        if (container) {
          container.insertBefore(card, container.children[move.position])
        }
      }
      
      return move
    }))
  }
  
  return {
    optimizeCard,
    optimizeColumn,
    batchCardMovements,
    useVirtualScroll,
    useLazyLoad
  }
}