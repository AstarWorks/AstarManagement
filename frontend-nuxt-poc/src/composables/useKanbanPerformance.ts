/**
 * Kanban Performance Optimization Utilities
 * 
 * @description Performance-focused utilities for smooth drag operations,
 * 60fps animations, and memory management during Kanban interactions
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  fps: number
  dragLatency: number
  memoryUsage: number
  renderTime: number
  mutationLatency: number
}

/**
 * Frame rate monitor for smooth drag operations
 */
export function useFrameRateMonitor() {
  const fps = ref(60)
  const isMonitoring = ref(false)
  
  let frameCount = 0
  let lastTime = performance.now()
  let animationId: number | null = null
  
  const startMonitoring = () => {
    if (isMonitoring.value) return
    
    isMonitoring.value = true
    frameCount = 0
    lastTime = performance.now()
    
    const tick = (currentTime: number) => {
      frameCount++
      
      if (currentTime - lastTime >= 1000) {
        fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
      }
      
      if (isMonitoring.value) {
        animationId = requestAnimationFrame(tick)
      }
    }
    
    animationId = requestAnimationFrame(tick)
  }
  
  const stopMonitoring = () => {
    isMonitoring.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }
  
  onUnmounted(() => {
    stopMonitoring()
  })
  
  return {
    fps: computed(() => fps.value),
    isMonitoring: computed(() => isMonitoring.value),
    startMonitoring,
    stopMonitoring
  }
}

/**
 * Optimized drag state management with requestAnimationFrame
 */
export function useOptimizedDragState() {
  const dragState = ref({
    isDragging: false,
    draggedElementId: null as string | null,
    dragOffset: { x: 0, y: 0 },
    dragVelocity: { x: 0, y: 0 }
  })
  
  let lastPosition = { x: 0, y: 0 }
  let lastTime = 0
  let rafId: number | null = null
  
  const updateDragPosition = (x: number, y: number) => {
    const currentTime = performance.now()
    
    if (lastTime > 0) {
      const deltaTime = currentTime - lastTime
      const deltaX = x - lastPosition.x
      const deltaY = y - lastPosition.y
      
      if (deltaTime > 0) {
        dragState.value.dragVelocity = {
          x: deltaX / deltaTime,
          y: deltaY / deltaTime
        }
      }
    }
    
    dragState.value.dragOffset = { x, y }
    lastPosition = { x, y }
    lastTime = currentTime
  }
  
  const startDrag = (elementId: string, startX: number, startY: number) => {
    dragState.value.isDragging = true
    dragState.value.draggedElementId = elementId
    lastPosition = { x: startX, y: startY }
    lastTime = performance.now()
  }
  
  const endDrag = () => {
    dragState.value.isDragging = false
    dragState.value.draggedElementId = null
    dragState.value.dragOffset = { x: 0, y: 0 }
    dragState.value.dragVelocity = { x: 0, y: 0 }
    
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }
  
  return {
    dragState: computed(() => dragState.value),
    updateDragPosition,
    startDrag,
    endDrag
  }
}

/**
 * Memory usage monitoring for performance optimization
 */
export function useMemoryMonitor() {
  const memoryUsage = ref(0)
  const isSupported = ref(false)
  
  onMounted(() => {
    // Check if performance.memory is available (Chrome/Edge)
    isSupported.value = 'memory' in performance
  })
  
  const updateMemoryUsage = () => {
    if (isSupported.value && 'memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
    }
  }
  
  return {
    memoryUsage: computed(() => memoryUsage.value),
    isSupported: computed(() => isSupported.value),
    updateMemoryUsage
  }
}

/**
 * Debounced and throttled execution utilities
 */
export function usePerformanceUtils() {
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }
  
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  
  const requestIdleCallback = (callback: () => void): void => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback)
    } else {
      setTimeout(callback, 1)
    }
  }
  
  return {
    debounce,
    throttle,
    requestIdleCallback
  }
}

/**
 * Comprehensive performance monitoring for Kanban operations
 */
export function useKanbanPerformanceMonitor() {
  const { fps, startMonitoring: startFpsMonitoring, stopMonitoring: stopFpsMonitoring } = useFrameRateMonitor()
  const { memoryUsage, updateMemoryUsage, isSupported: memorySupported } = useMemoryMonitor()
  const { debounce, throttle, requestIdleCallback } = usePerformanceUtils()
  
  const metrics = ref<PerformanceMetrics>({
    fps: 60,
    dragLatency: 0,
    memoryUsage: 0,
    renderTime: 0,
    mutationLatency: 0
  })
  
  const performanceWarnings = ref<string[]>([])
  const isMonitoring = ref(false)
  
  // Throttled memory usage update
  const throttledMemoryUpdate = throttle(updateMemoryUsage, 1000)
  
  // Debounced performance warning check
  const debouncedWarningCheck = debounce(() => {
    const warnings: string[] = []
    
    if (metrics.value.fps < 30) {
      warnings.push('Low frame rate detected')
    }
    
    if (metrics.value.dragLatency > 100) {
      warnings.push('High drag latency')
    }
    
    if (metrics.value.memoryUsage > 100) {
      warnings.push('High memory usage')
    }
    
    if (metrics.value.mutationLatency > 500) {
      warnings.push('Slow mutation response')
    }
    
    performanceWarnings.value = warnings
  }, 1000)
  
  const startMonitoring = () => {
    if (isMonitoring.value) return
    
    isMonitoring.value = true
    startFpsMonitoring()
    
    // Update metrics periodically
    const updateInterval = setInterval(() => {
      if (!isMonitoring.value) {
        clearInterval(updateInterval)
        return
      }
      
      metrics.value.fps = fps.value
      
      if (memorySupported.value) {
        throttledMemoryUpdate()
        metrics.value.memoryUsage = memoryUsage.value
      }
      
      debouncedWarningCheck()
    }, 1000)
  }
  
  const stopMonitoring = () => {
    isMonitoring.value = false
    stopFpsMonitoring()
    performanceWarnings.value = []
  }
  
  const recordDragLatency = (latency: number) => {
    metrics.value.dragLatency = latency
  }
  
  const recordMutationLatency = (latency: number) => {
    metrics.value.mutationLatency = latency
  }
  
  const recordRenderTime = (renderTime: number) => {
    metrics.value.renderTime = renderTime
  }
  
  // Optimized drag event handlers
  const optimizedDragStart = (callback: () => void) => {
    return () => {
      const startTime = performance.now()
      
      requestAnimationFrame(() => {
        callback()
        recordDragLatency(performance.now() - startTime)
      })
    }
  }
  
  const optimizedDragMove = (callback: (event: MouseEvent | TouchEvent) => void) => {
    return throttle((event: MouseEvent | TouchEvent) => {
      const startTime = performance.now()
      
      requestAnimationFrame(() => {
        callback(event)
        recordDragLatency(performance.now() - startTime)
      })
    }, 16) // ~60fps
  }
  
  const optimizedDragEnd = (callback: () => void) => {
    return () => {
      const startTime = performance.now()
      
      requestAnimationFrame(() => {
        callback()
        recordDragLatency(performance.now() - startTime)
        
        // Cleanup after drag end
        requestIdleCallback(() => {
          if (typeof window !== 'undefined' && 'gc' in window) {
            // Suggest garbage collection if available (dev tools)
            ;(window as any).gc()
          }
        })
      })
    }
  }
  
  const isPerformanceGood = computed(() => 
    metrics.value.fps >= 30 && 
    metrics.value.dragLatency < 50 && 
    metrics.value.mutationLatency < 300
  )
  
  const performanceScore = computed(() => {
    let score = 100
    
    if (metrics.value.fps < 60) score -= (60 - metrics.value.fps) * 2
    if (metrics.value.dragLatency > 16) score -= metrics.value.dragLatency - 16
    if (metrics.value.mutationLatency > 200) score -= (metrics.value.mutationLatency - 200) / 10
    if (metrics.value.memoryUsage > 50) score -= (metrics.value.memoryUsage - 50) / 2
    
    return Math.max(0, Math.min(100, Math.round(score)))
  })
  
  onUnmounted(() => {
    stopMonitoring()
  })
  
  return {
    metrics: computed(() => metrics.value),
    performanceWarnings: computed(() => performanceWarnings.value),
    isMonitoring: computed(() => isMonitoring.value),
    isPerformanceGood,
    performanceScore,
    
    // Control methods
    startMonitoring,
    stopMonitoring,
    
    // Recording methods
    recordDragLatency,
    recordMutationLatency,
    recordRenderTime,
    
    // Optimized event handlers
    optimizedDragStart,
    optimizedDragMove,
    optimizedDragEnd,
    
    // Utilities
    debounce,
    throttle,
    requestIdleCallback
  }
}