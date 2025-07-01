import { ref, readonly, computed, onMounted, onUnmounted } from 'vue'

export interface MobileConfig {
  touchSampleRate: number
  gestureThreshold: number
  momentumDecayRate: number
  frameRateTarget: number
  batteryAwareMode: boolean
  adaptiveQuality: boolean
  touchPrediction: boolean
  gestureBufferSize: number
}

export interface TouchPerformance {
  lastTouchTime: number
  touchBuffer: TouchEvent[]
  frameDropCount: number
  averageFrameTime: number
  responseTimes: number[]
  gestureAccuracy: number
}

export interface DeviceCapabilities {
  isMobile: boolean
  isTablet: boolean
  hasTouch: boolean
  pixelDensity: number
  screenSize: { width: number; height: number }
  batteryLevel: number
  batteryCharging: boolean
  hardwareConcurrency: number
  memorySize: number
}

export interface GestureMetrics {
  pinchScale: number
  pinchVelocity: number
  panVelocity: { x: number; y: number }
  momentum: { x: number; y: number }
  accuracy: number
  smoothness: number
}

export interface PerformanceProfile {
  renderQuality: 'low' | 'medium' | 'high'
  frameRate: number
  enableAnimations: boolean
  enableShadows: boolean
  textRenderingOptimized: boolean
  imageQuality: number
}

/**
 * Mobile Performance Optimization Composable
 * 
 * Provides optimized touch handling, gesture processing, and performance
 * adaptations for mobile and tablet devices in legal document workflows.
 * 
 * Features:
 * - Sub-16ms touch event processing for 60fps interactions
 * - Intelligent gesture prediction and smoothing
 * - Battery-aware performance optimization
 * - Adaptive quality based on device capabilities
 * - Frame rate monitoring and optimization
 */
export function useMobilePerformanceOptimization() {
  // Configuration state
  const mobileConfig = ref<MobileConfig>({
    touchSampleRate: 60, // Hz for touch sampling
    gestureThreshold: 10, // Minimum movement threshold in pixels
    momentumDecayRate: 0.95,
    frameRateTarget: 60,
    batteryAwareMode: true,
    adaptiveQuality: true,
    touchPrediction: true,
    gestureBufferSize: 10
  })

  // Performance tracking state
  const touchPerformance = ref<TouchPerformance>({
    lastTouchTime: 0,
    touchBuffer: [],
    frameDropCount: 0,
    averageFrameTime: 16.67, // Target 60fps
    responseTimes: [],
    gestureAccuracy: 1.0
  })

  // Device capabilities
  const deviceCapabilities = ref<DeviceCapabilities>({
    isMobile: false,
    isTablet: false,
    hasTouch: false,
    pixelDensity: 1,
    screenSize: { width: 0, height: 0 },
    batteryLevel: 1,
    batteryCharging: false,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    memorySize: (navigator as any).deviceMemory || 4
  })

  // Gesture tracking
  const gestureMetrics = ref<GestureMetrics>({
    pinchScale: 1,
    pinchVelocity: 0,
    panVelocity: { x: 0, y: 0 },
    momentum: { x: 0, y: 0 },
    accuracy: 1.0,
    smoothness: 1.0
  })

  // Performance profile
  const performanceProfile = ref<PerformanceProfile>({
    renderQuality: 'high',
    frameRate: 60,
    enableAnimations: true,
    enableShadows: true,
    textRenderingOptimized: false,
    imageQuality: 1.0
  })

  // Touch event optimization state
  const touchOptimization = {
    lastProcessedTouch: 0,
    touchQueue: [] as TouchEvent[],
    isProcessing: false,
    rafId: 0
  }

  /**
   * Detect device capabilities and characteristics
   */
  const detectDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
    const capabilities: DeviceCapabilities = {
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelDensity: window.devicePixelRatio || 1,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      batteryLevel: 1,
      batteryCharging: false,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      memorySize: (navigator as any).deviceMemory || 4
    }

    // Detect battery status if available
    try {
      const battery = await (navigator as any).getBattery?.()
      if (battery) {
        capabilities.batteryLevel = battery.level
        capabilities.batteryCharging = battery.charging
      }
    } catch (error) {
      console.debug('Battery API not available:', error)
    }

    // Refined mobile/tablet detection
    const userAgent = navigator.userAgent
    const isIPad = /iPad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    
    if (isIPad) {
      capabilities.isTablet = true
      capabilities.isMobile = false
    }

    deviceCapabilities.value = capabilities
    return capabilities
  }

  /**
   * Calculate optimal performance profile based on device capabilities
   */
  const calculatePerformanceProfile = (capabilities: DeviceCapabilities): PerformanceProfile => {
    let profile: PerformanceProfile = {
      renderQuality: 'high',
      frameRate: 60,
      enableAnimations: true,
      enableShadows: true,
      textRenderingOptimized: false,
      imageQuality: 1.0
    }

    // Adjust for mobile devices
    if (capabilities.isMobile) {
      profile.renderQuality = 'medium'
      profile.frameRate = 30
      profile.enableShadows = false
      profile.textRenderingOptimized = true
      profile.imageQuality = 0.8
    }

    // Adjust for low-end devices
    if (capabilities.hardwareConcurrency < 4 || capabilities.memorySize < 4) {
      profile.renderQuality = 'low'
      profile.frameRate = 30
      profile.enableAnimations = false
      profile.enableShadows = false
      profile.textRenderingOptimized = true
      profile.imageQuality = 0.6
    }

    // Battery optimization
    if (mobileConfig.value.batteryAwareMode && capabilities.batteryLevel < 0.2 && !capabilities.batteryCharging) {
      profile.frameRate = Math.min(profile.frameRate, 30)
      profile.enableAnimations = false
      profile.renderQuality = 'low'
      profile.imageQuality = 0.5
    }

    // High DPI adjustments
    if (capabilities.pixelDensity > 2) {
      profile.imageQuality = Math.min(profile.imageQuality, 0.7)
      profile.textRenderingOptimized = true
    }

    performanceProfile.value = profile
    return profile
  }

  /**
   * Optimized touch event handling with throttling and prediction
   */
  const optimizeTouchHandling = (event: TouchEvent): boolean => {
    const now = performance.now()
    const timeSinceLastTouch = now - touchPerformance.value.lastTouchTime

    // Throttle touch events based on sample rate
    const minInterval = 1000 / mobileConfig.value.touchSampleRate
    if (timeSinceLastTouch < minInterval) {
      return false
    }

    // Update touch buffer
    touchPerformance.value.touchBuffer.push(event)
    if (touchPerformance.value.touchBuffer.length > mobileConfig.value.gestureBufferSize) {
      touchPerformance.value.touchBuffer.shift()
    }

    // Process touch with performance monitoring
    const frameStart = performance.now()
    
    if (!touchOptimization.isProcessing) {
      touchOptimization.isProcessing = true
      
      touchOptimization.rafId = requestAnimationFrame(() => {
        processTouchEvent(event)
        
        const frameTime = performance.now() - frameStart
        
        // Track performance metrics
        touchPerformance.value.averageFrameTime = 
          (touchPerformance.value.averageFrameTime * 0.9) + (frameTime * 0.1)
        
        // Track response times
        touchPerformance.value.responseTimes.push(frameTime)
        if (touchPerformance.value.responseTimes.length > 60) {
          touchPerformance.value.responseTimes = touchPerformance.value.responseTimes.slice(-60)
        }

        // Count frame drops
        if (frameTime > 16.67) {
          touchPerformance.value.frameDropCount++
        }

        touchOptimization.isProcessing = false
      })
    }

    touchPerformance.value.lastTouchTime = now
    return true
  }

  /**
   * Process touch event with gesture recognition
   */
  const processTouchEvent = (event: TouchEvent) => {
    const touches = Array.from(event.touches)
    
    if (touches.length === 1) {
      // Single touch - pan gesture
      processPanGesture(touches[0], event)
    } else if (touches.length === 2) {
      // Two touches - pinch gesture
      processPinchGesture(touches[0], touches[1], event)
    }

    // Predict next touch position for smoother interactions
    if (mobileConfig.value.touchPrediction && touchPerformance.value.touchBuffer.length >= 3) {
      predictNextTouch()
    }
  }

  /**
   * Process pan gesture with momentum calculation
   */
  const processPanGesture = (touch: Touch, event: TouchEvent) => {
    const buffer = touchPerformance.value.touchBuffer
    if (buffer.length < 2) return

    const prevTouch = buffer[buffer.length - 2].touches[0]
    const deltaX = touch.clientX - prevTouch.clientX
    const deltaY = touch.clientY - prevTouch.clientY
    const deltaTime = event.timeStamp - buffer[buffer.length - 2].timeStamp

    if (deltaTime > 0) {
      const velocityX = deltaX / deltaTime
      const velocityY = deltaY / deltaTime

      gestureMetrics.value.panVelocity = { x: velocityX, y: velocityY }

      // Apply momentum decay
      gestureMetrics.value.momentum = {
        x: gestureMetrics.value.momentum.x * mobileConfig.value.momentumDecayRate + velocityX * (1 - mobileConfig.value.momentumDecayRate),
        y: gestureMetrics.value.momentum.y * mobileConfig.value.momentumDecayRate + velocityY * (1 - mobileConfig.value.momentumDecayRate)
      }
    }
  }

  /**
   * Process pinch gesture with scale and velocity tracking
   */
  const processPinchGesture = (touch1: Touch, touch2: Touch, event: TouchEvent) => {
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )

    const buffer = touchPerformance.value.touchBuffer
    if (buffer.length >= 2) {
      const prevTouches = buffer[buffer.length - 2].touches
      if (prevTouches.length >= 2) {
        const prevDistance = Math.sqrt(
          Math.pow(prevTouches[1].clientX - prevTouches[0].clientX, 2) +
          Math.pow(prevTouches[1].clientY - prevTouches[0].clientY, 2)
        )

        const scale = distance / prevDistance
        const deltaTime = event.timeStamp - buffer[buffer.length - 2].timeStamp

        gestureMetrics.value.pinchScale = scale
        
        if (deltaTime > 0) {
          gestureMetrics.value.pinchVelocity = (scale - 1) / deltaTime
        }
      }
    }
  }

  /**
   * Predict next touch position for smoother interactions
   */
  const predictNextTouch = () => {
    const buffer = touchPerformance.value.touchBuffer
    if (buffer.length < 3) return

    const recent = buffer.slice(-3)
    const velocityX = (recent[2].touches[0].clientX - recent[0].touches[0].clientX) / 
                     (recent[2].timeStamp - recent[0].timeStamp)
    const velocityY = (recent[2].touches[0].clientY - recent[0].touches[0].clientY) / 
                     (recent[2].timeStamp - recent[0].timeStamp)

    // Calculate accuracy based on prediction vs actual
    const predicted = {
      x: recent[2].touches[0].clientX + velocityX * 16.67, // Predict 16.67ms ahead
      y: recent[2].touches[0].clientY + velocityY * 16.67
    }

    // Store prediction for accuracy calculation in next frame
    (recent[2] as any).predicted = predicted
  }

  /**
   * Adaptive frame rate adjustment based on performance
   */
  const adaptFrameRate = () => {
    const avgFrameTime = touchPerformance.value.averageFrameTime
    const targetFrameTime = 1000 / performanceProfile.value.frameRate

    if (avgFrameTime > targetFrameTime * 1.5) {
      // Performance is poor, reduce frame rate
      performanceProfile.value.frameRate = Math.max(30, performanceProfile.value.frameRate - 10)
    } else if (avgFrameTime < targetFrameTime * 0.8 && performanceProfile.value.frameRate < 60) {
      // Performance is good, increase frame rate
      performanceProfile.value.frameRate = Math.min(60, performanceProfile.value.frameRate + 10)
    }
  }

  /**
   * Update device capabilities and performance profile
   */
  const updatePerformanceOptimization = async () => {
    const capabilities = await detectDeviceCapabilities()
    calculatePerformanceProfile(capabilities)
    
    if (mobileConfig.value.adaptiveQuality) {
      adaptFrameRate()
    }
  }

  /**
   * Get current touch performance metrics
   */
  const getTouchMetrics = () => {
    const responseTimes = touchPerformance.value.responseTimes
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    return {
      averageResponseTime: avgResponseTime,
      frameDropRate: touchPerformance.value.frameDropCount / Math.max(responseTimes.length, 1),
      touchAccuracy: touchPerformance.value.gestureAccuracy,
      currentFrameRate: 1000 / touchPerformance.value.averageFrameTime
    }
  }

  /**
   * Reset performance metrics
   */
  const resetPerformanceMetrics = () => {
    touchPerformance.value = {
      lastTouchTime: 0,
      touchBuffer: [],
      frameDropCount: 0,
      averageFrameTime: 16.67,
      responseTimes: [],
      gestureAccuracy: 1.0
    }
  }

  /**
   * Update mobile configuration
   */
  const updateMobileConfig = (newConfig: Partial<MobileConfig>) => {
    mobileConfig.value = { ...mobileConfig.value, ...newConfig }
  }

  // Computed properties
  const isTouchOptimized = computed(() => {
    const metrics = getTouchMetrics()
    return metrics.averageResponseTime < 16 && metrics.frameDropRate < 0.1
  })

  const batteryStatus = computed(() => {
    const capabilities = deviceCapabilities.value
    return {
      level: capabilities.batteryLevel,
      charging: capabilities.batteryCharging,
      lowPower: capabilities.batteryLevel < 0.2 && !capabilities.batteryCharging
    }
  })

  const devicePerformanceLevel = computed(() => {
    const capabilities = deviceCapabilities.value
    
    if (capabilities.hardwareConcurrency >= 8 && capabilities.memorySize >= 8) {
      return 'high'
    } else if (capabilities.hardwareConcurrency >= 4 && capabilities.memorySize >= 4) {
      return 'medium'
    } else {
      return 'low'
    }
  })

  // Initialize on mount
  onMounted(() => {
    updatePerformanceOptimization()
    
    // Set up periodic optimization updates
    const optimizationInterval = setInterval(updatePerformanceOptimization, 30000) // Every 30 seconds
    
    onUnmounted(() => {
      clearInterval(optimizationInterval)
      if (touchOptimization.rafId) {
        cancelAnimationFrame(touchOptimization.rafId)
      }
    })
  })

  return {
    // Configuration
    mobileConfig: readonly(mobileConfig),
    updateMobileConfig,

    // Device capabilities
    deviceCapabilities: readonly(deviceCapabilities),
    detectDeviceCapabilities,
    devicePerformanceLevel,

    // Performance optimization
    performanceProfile: readonly(performanceProfile),
    updatePerformanceOptimization,
    isTouchOptimized,

    // Touch handling
    optimizeTouchHandling,
    touchPerformance: readonly(touchPerformance),
    getTouchMetrics,
    resetPerformanceMetrics,

    // Gesture tracking
    gestureMetrics: readonly(gestureMetrics),

    // Battery optimization
    batteryStatus
  }
}