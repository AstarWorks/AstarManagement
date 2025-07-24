/**
 * Animation Composable for Aster Management
 * 
 * Provides utilities for animations, motion preferences, and performance monitoring
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { useMediaQuery, useRafFn, useThrottleFn } from '@vueuse/core'
import { 
  ANIMATION_DURATION, 
  ANIMATION_EASING, 
  MOTION_QUERIES,
  PERFORMANCE_THRESHOLDS,
  type AnimationPreset,
  ANIMATION_PRESETS
} from '~/constants/animations'

export interface AnimationOptions {
  duration?: number
  easing?: string
  delay?: number
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

import type { AnimationPerformanceMetrics } from '~/types/performance'

/**
 * Main animation composable
 */
export function useAnimations() {
  // Motion preferences
  const prefersReducedMotion = useMediaQuery(MOTION_QUERIES.prefersReducedMotion)
  const prefersReducedTransparency = useMediaQuery(MOTION_QUERIES.prefersReducedTransparency)
  const prefersHighContrast = useMediaQuery(MOTION_QUERIES.prefersContrast)
  
  // Performance monitoring
  const performanceMetrics = ref<AnimationPerformanceMetrics>({
    fps: 60,
    frameTime: 16,
    jankCount: 0,
    isPerformant: true,
    animationFrameTime: 16,
    animationJankCount: 0,
    lastAnimationDuration: 0
  })
  
  // Animation state
  const animationsEnabled = computed(() => !prefersReducedMotion.value)
  const isAnimating = ref(false)
  
  /**
   * Get animation duration based on motion preferences
   */
  const getAnimationDuration = (duration: number = ANIMATION_DURATION.normal): number => {
    if (!animationsEnabled.value) return 0
    return duration
  }
  
  /**
   * Get animation easing based on motion preferences
   */
  const getAnimationEasing = (easing: string = ANIMATION_EASING.standard): string => {
    if (!animationsEnabled.value) return 'linear'
    return easing
  }
  
  /**
   * Create animation options with motion preferences
   */
  const createAnimationOptions = (options: AnimationOptions = {}): AnimationOptions => {
    return {
      duration: getAnimationDuration(options.duration),
      easing: getAnimationEasing(options.easing),
      delay: options.delay || 0,
      fill: options.fill || 'both'
    }
  }
  
  /**
   * Get preset animation configuration
   */
  const getAnimationPreset = (preset: AnimationPreset) => {
    const config = ANIMATION_PRESETS[preset]
    return createAnimationOptions({
      duration: config.duration,
      easing: config.easing,
      delay: (config as any).delay || 0
    })
  }
  
  return {
    // Motion preferences
    prefersReducedMotion,
    prefersReducedTransparency,
    prefersHighContrast,
    animationsEnabled,
    
    // Animation state
    isAnimating,
    
    // Performance metrics
    performanceMetrics,
    
    // Utilities
    getAnimationDuration,
    getAnimationEasing,
    createAnimationOptions,
    getAnimationPreset
  }
}

/**
 * FLIP Animation Composable
 * For animating layout changes smoothly
 */
export function useFLIPAnimation() {
  const positions = new WeakMap<HTMLElement, DOMRect>()
  
  /**
   * Record initial positions (First)
   */
  const recordPositions = (elements: HTMLElement[]) => {
    elements.forEach(el => {
      positions.set(el, el.getBoundingClientRect())
    })
  }
  
  /**
   * Animate to new positions (Last, Invert, Play)
   */
  const animateChanges = async (
    elements: HTMLElement[], 
    options: AnimationOptions = {}
  ) => {
    const animations: Animation[] = []
    
    elements.forEach(el => {
      const firstPos = positions.get(el)
      if (!firstPos) return
      
      const lastPos = el.getBoundingClientRect()
      
      const deltaX = firstPos.left - lastPos.left
      const deltaY = firstPos.top - lastPos.top
      const deltaW = firstPos.width / lastPos.width
      const deltaH = firstPos.height / lastPos.height
      
      if (deltaX || deltaY || deltaW !== 1 || deltaH !== 1) {
        el.style.transformOrigin = 'top left'
        el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`
        
        const animation = el.animate([
          { transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})` },
          { transform: 'none' }
        ], {
          duration: options.duration || ANIMATION_DURATION.normal,
          easing: options.easing || ANIMATION_EASING.standard,
          fill: 'both'
        })
        
        animations.push(animation)
      }
    })
    
    await Promise.all(animations.map(a => a.finished))
  }
  
  /**
   * Perform FLIP animation
   */
  const flip = async (
    elements: HTMLElement[] | NodeListOf<HTMLElement>,
    callback: () => void | Promise<void>,
    options: AnimationOptions = {}
  ) => {
    const els = Array.from(elements)
    
    // First: record initial positions
    recordPositions(els)
    
    // Make DOM changes
    await callback()
    
    // Last, Invert, Play: animate to new positions
    await animateChanges(els, options)
  }
  
  return {
    recordPositions,
    animateChanges,
    flip
  }
}

/**
 * Drag Animation Composable
 * For smooth drag and drop animations
 */
export function useDragAnimation(element: Ref<HTMLElement | null>) {
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })
  
  const startDrag = (e: DragEvent) => {
    if (!element.value) return
    
    isDragging.value = true
    
    // Apply drag styles
    element.value.style.transition = 'none'
    element.value.style.cursor = 'grabbing'
    element.value.style.opacity = '0.8'
    element.value.style.transform = 'scale(1.05) rotate(2deg)'
    element.value.style.zIndex = '1000'
    
    // Record offset
    const rect = element.value.getBoundingClientRect()
    dragOffset.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }
  
  const endDrag = async () => {
    if (!element.value || !isDragging.value) return
    
    isDragging.value = false
    
    // Animate back to normal
    element.value.style.transition = `all ${ANIMATION_DURATION.dragEnd}ms ${ANIMATION_EASING.decelerate}`
    element.value.style.cursor = ''
    element.value.style.opacity = ''
    element.value.style.transform = ''
    element.value.style.zIndex = ''
    
    // Reset after animation
    setTimeout(() => {
      if (element.value) {
        element.value.style.transition = ''
      }
    }, ANIMATION_DURATION.dragEnd)
  }
  
  return {
    isDragging,
    dragOffset,
    startDrag,
    endDrag
  }
}

/**
 * Performance Monitoring Composable
 * For tracking animation performance
 */
export function useAnimationPerformance() {
  const frameCount = ref(0)
  const lastFrameTime = ref(performance.now())
  const fps = ref(60)
  const jankFrames = ref(0)
  
  let rafId: number | null = null
  let monitoring = false
  
  const measure = () => {
    const now = performance.now()
    const delta = now - lastFrameTime.value
    
    frameCount.value++
    
    // Calculate FPS every second
    if (frameCount.value % 60 === 0) {
      fps.value = Math.round(1000 / delta)
      frameCount.value = 0
    }
    
    // Detect jank (frame took > 100ms)
    if (delta > PERFORMANCE_THRESHOLDS.jankThreshold) {
      jankFrames.value++
    }
    
    lastFrameTime.value = now
    
    if (monitoring) {
      rafId = requestAnimationFrame(measure)
    }
  }
  
  const startMonitoring = () => {
    if (monitoring) return
    monitoring = true
    frameCount.value = 0
    jankFrames.value = 0
    rafId = requestAnimationFrame(measure)
  }
  
  const stopMonitoring = () => {
    monitoring = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }
  
  const resetMetrics = () => {
    frameCount.value = 0
    jankFrames.value = 0
    fps.value = 60
  }
  
  onUnmounted(() => {
    stopMonitoring()
  })
  
  return {
    fps: computed(() => fps.value),
    jankFrames: computed(() => jankFrames.value),
    isPerformant: computed(() => fps.value >= 55 && jankFrames.value < 5),
    startMonitoring,
    stopMonitoring,
    resetMetrics
  }
}

/**
 * Skeleton Animation Composable
 * For loading states
 */
export function useSkeletonAnimation() {
  const isLoading = ref(true)
  const shimmerPosition = ref(0)
  
  const { pause, resume } = useRafFn(() => {
    shimmerPosition.value = (shimmerPosition.value + 2) % 200
  })
  
  const startShimmer = () => {
    isLoading.value = true
    resume()
  }
  
  const stopShimmer = () => {
    isLoading.value = false
    pause()
    shimmerPosition.value = 0
  }
  
  return {
    isLoading,
    shimmerPosition,
    startShimmer,
    stopShimmer
  }
}

/**
 * Gesture Animation Composable
 * For touch and gesture-based animations
 */
export function useGestureAnimation(element: Ref<HTMLElement | null>) {
  const velocity = ref({ x: 0, y: 0 })
  const position = ref({ x: 0, y: 0 })
  const isDragging = ref(false)
  
  let lastPosition = { x: 0, y: 0 }
  let lastTime = 0
  
  const updateVelocity = (x: number, y: number) => {
    const now = performance.now()
    const dt = now - lastTime
    
    if (dt > 0) {
      velocity.value = {
        x: (x - lastPosition.x) / dt * 1000,
        y: (y - lastPosition.y) / dt * 1000
      }
    }
    
    lastPosition = { x, y }
    lastTime = now
  }
  
  const animateToPosition = (x: number, y: number, options: AnimationOptions = {}) => {
    if (!element.value) return
    
    element.value.animate([
      { transform: `translate(${position.value.x}px, ${position.value.y}px)` },
      { transform: `translate(${x}px, ${y}px)` }
    ], {
      duration: options.duration || ANIMATION_DURATION.normal,
      easing: options.easing || ANIMATION_EASING.standard,
      fill: 'forwards'
    })
    
    position.value = { x, y }
  }
  
  const fling = (direction: { x: number, y: number }) => {
    const distance = 100 // pixels
    const targetX = position.value.x + direction.x * distance
    const targetY = position.value.y + direction.y * distance
    
    animateToPosition(targetX, targetY, {
      duration: ANIMATION_DURATION.moderate,
      easing: ANIMATION_EASING.decelerate
    })
  }
  
  return {
    velocity,
    position,
    isDragging,
    updateVelocity,
    animateToPosition,
    fling
  }
}