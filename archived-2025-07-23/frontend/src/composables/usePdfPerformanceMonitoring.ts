import { ref, readonly, computed, onMounted, onUnmounted } from 'vue'

export interface PerformanceMetrics {
  initialLoadTime: number
  pageRenderTimes: Record<number, number>
  memoryUsage: number
  frameRate: number
  networkLatency: number
  cacheHitRate: number
  errorCount: number
  userInteractionDelay: number
}

export interface RealTimeMetrics {
  currentMemory: number
  currentFrameRate: number
  activePage: number
  visiblePages: number[]
  lastInteractionTime: number
  scrollPerformance: number
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: number
}

export interface PerformanceThresholds {
  maxInitialLoadTime: number
  maxPageRenderTime: number
  maxMemoryUsage: number
  minFrameRate: number
  maxNetworkLatency: number
  minCacheHitRate: number
  maxUserInteractionDelay: number
}

export interface PerformanceSample {
  timestamp: number
  metric: string
  value: number
  context?: Record<string, any>
}

/**
 * PDF Performance Monitoring Composable
 * 
 * Provides comprehensive performance monitoring and alerting for PDF viewer
 * with real-time metrics collection, regression detection, and optimization insights.
 * 
 * Features:
 * - Real-time performance metrics collection
 * - Automated performance regression detection
 * - Memory leak detection and alerting
 * - User experience analytics and reporting
 * - Performance debugging and diagnostics
 */
export function usePdfPerformanceMonitoring() {
  // Core metrics state
  const performanceMetrics = ref<PerformanceMetrics>({
    initialLoadTime: 0,
    pageRenderTimes: {},
    memoryUsage: 0,
    frameRate: 60,
    networkLatency: 0,
    cacheHitRate: 1.0,
    errorCount: 0,
    userInteractionDelay: 0
  })

  // Real-time tracking
  const realTimeMetrics = ref<RealTimeMetrics>({
    currentMemory: 0,
    currentFrameRate: 60,
    activePage: 1,
    visiblePages: [],
    lastInteractionTime: 0,
    scrollPerformance: 100
  })

  // Performance thresholds
  const performanceThresholds = ref<PerformanceThresholds>({
    maxInitialLoadTime: 1000, // 1 second
    maxPageRenderTime: 500, // 500ms
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    minFrameRate: 30, // 30fps minimum
    maxNetworkLatency: 1000, // 1 second
    minCacheHitRate: 0.8, // 80% cache hit rate
    maxUserInteractionDelay: 100 // 100ms
  })

  // Alerts and monitoring
  const performanceAlerts = ref<PerformanceAlert[]>([])
  const isMonitoring = ref(false)
  const monitoringInterval = ref<number | null>(null)

  // Historical data
  const performanceSamples = ref<PerformanceSample[]>([])
  const maxSampleHistory = 1000

  // Frame rate monitoring
  let frameCount = 0
  let lastFrameTime = performance.now()
  let frameRateInterval: number | null = null

  /**
   * Start performance monitoring
   */
  const startMonitoring = () => {
    if (isMonitoring.value) return

    isMonitoring.value = true
    
    // Start frame rate monitoring
    startFrameRateMonitoring()
    
    // Start periodic metrics collection
    monitoringInterval.value = window.setInterval(() => {
      collectMetrics()
      checkPerformanceThresholds()
      updateRealTimeMetrics()
    }, 1000) // Collect metrics every second

    console.debug('PDF performance monitoring started')
  }

  /**
   * Stop performance monitoring
   */
  const stopMonitoring = () => {
    if (!isMonitoring.value) return

    isMonitoring.value = false
    
    if (monitoringInterval.value) {
      clearInterval(monitoringInterval.value)
      monitoringInterval.value = null
    }

    if (frameRateInterval) {
      clearInterval(frameRateInterval)
      frameRateInterval = null
    }

    console.debug('PDF performance monitoring stopped')
  }

  /**
   * Start frame rate monitoring using RAF
   */
  const startFrameRateMonitoring = () => {
    frameCount = 0
    lastFrameTime = performance.now()

    const measureFrameRate = () => {
      frameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - lastFrameTime

      if (elapsed >= 1000) {
        const fps = (frameCount * 1000) / elapsed
        realTimeMetrics.value.currentFrameRate = fps
        performanceMetrics.value.frameRate = fps
        
        addPerformanceSample('frameRate', fps)
        
        frameCount = 0
        lastFrameTime = currentTime
      }

      if (isMonitoring.value) {
        requestAnimationFrame(measureFrameRate)
      }
    }

    requestAnimationFrame(measureFrameRate)
  }

  /**
   * Collect current performance metrics
   */
  const collectMetrics = () => {
    // Memory usage
    const memoryInfo = (performance as any).memory
    if (memoryInfo) {
      const currentMemory = memoryInfo.usedJSHeapSize
      realTimeMetrics.value.currentMemory = currentMemory
      performanceMetrics.value.memoryUsage = currentMemory
      addPerformanceSample('memoryUsage', currentMemory)
    }

    // Network timing (if available)
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const networkLatency = navigation.responseStart - navigation.requestStart
      performanceMetrics.value.networkLatency = networkLatency
      addPerformanceSample('networkLatency', networkLatency)
    }

    // User interaction delay
    const interactionDelay = performance.now() - realTimeMetrics.value.lastInteractionTime
    if (realTimeMetrics.value.lastInteractionTime > 0 && interactionDelay < 5000) {
      performanceMetrics.value.userInteractionDelay = interactionDelay
      addPerformanceSample('userInteractionDelay', interactionDelay)
    }
  }

  /**
   * Add a performance sample to history
   */
  const addPerformanceSample = (metric: string, value: number, context?: Record<string, any>) => {
    const sample: PerformanceSample = {
      timestamp: Date.now(),
      metric,
      value,
      context
    }

    performanceSamples.value.push(sample)

    // Keep only recent samples
    if (performanceSamples.value.length > maxSampleHistory) {
      performanceSamples.value = performanceSamples.value.slice(-maxSampleHistory)
    }
  }

  /**
   * Check performance against thresholds and create alerts
   */
  const checkPerformanceThresholds = () => {
    const metrics = performanceMetrics.value
    const thresholds = performanceThresholds.value

    // Check initial load time
    if (metrics.initialLoadTime > thresholds.maxInitialLoadTime) {
      addPerformanceAlert('warning', 'Initial load time exceeds threshold', 'initialLoadTime', 
        metrics.initialLoadTime, thresholds.maxInitialLoadTime)
    }

    // Check memory usage
    if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
      addPerformanceAlert('error', 'Memory usage exceeds threshold', 'memoryUsage', 
        metrics.memoryUsage, thresholds.maxMemoryUsage)
    }

    // Check frame rate
    if (metrics.frameRate < thresholds.minFrameRate) {
      addPerformanceAlert('warning', 'Frame rate below threshold', 'frameRate', 
        metrics.frameRate, thresholds.minFrameRate)
    }

    // Check network latency
    if (metrics.networkLatency > thresholds.maxNetworkLatency) {
      addPerformanceAlert('warning', 'Network latency exceeds threshold', 'networkLatency', 
        metrics.networkLatency, thresholds.maxNetworkLatency)
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < thresholds.minCacheHitRate) {
      addPerformanceAlert('info', 'Cache hit rate below optimal', 'cacheHitRate', 
        metrics.cacheHitRate, thresholds.minCacheHitRate)
    }

    // Check user interaction delay
    if (metrics.userInteractionDelay > thresholds.maxUserInteractionDelay) {
      addPerformanceAlert('warning', 'User interaction delay exceeds threshold', 'userInteractionDelay', 
        metrics.userInteractionDelay, thresholds.maxUserInteractionDelay)
    }
  }

  /**
   * Add a performance alert
   */
  const addPerformanceAlert = (
    type: PerformanceAlert['type'], 
    message: string, 
    metric: string, 
    value: number, 
    threshold: number
  ) => {
    const alert: PerformanceAlert = {
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now()
    }

    performanceAlerts.value.push(alert)

    // Keep only recent alerts (last 100)
    if (performanceAlerts.value.length > 100) {
      performanceAlerts.value = performanceAlerts.value.slice(-100)
    }

    console.warn(`Performance Alert [${type}]:`, message, { metric, value, threshold })
  }

  /**
   * Update real-time metrics
   */
  const updateRealTimeMetrics = () => {
    realTimeMetrics.value = {
      ...realTimeMetrics.value,
      currentMemory: performanceMetrics.value.memoryUsage,
      currentFrameRate: performanceMetrics.value.frameRate
    }
  }

  /**
   * Measure performance of an operation
   */
  const measurePerformance = async <T>(
    operation: string, 
    fn: () => Promise<T> | T,
    context?: Record<string, any>
  ): Promise<T> => {
    const startTime = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0

    try {
      const result = await fn()
      const endTime = performance.now()
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Record metrics
      const duration = endTime - startTime
      const memoryDelta = endMemory - startMemory

      addPerformanceSample(`${operation}_duration`, duration, context)
      addPerformanceSample(`${operation}_memory`, memoryDelta, context)

      // Update specific metrics
      if (operation === 'pageRender') {
        const pageNumber = context?.pageNumber || 0
        performanceMetrics.value.pageRenderTimes[pageNumber] = duration
      } else if (operation === 'initialLoad') {
        performanceMetrics.value.initialLoadTime = duration
      }

      return result
    } catch (error) {
      performanceMetrics.value.errorCount++
      addPerformanceSample(`${operation}_error`, 1, { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Record user interaction
   */
  const recordUserInteraction = (interactionType: string, details?: Record<string, any>) => {
    const timestamp = performance.now()
    realTimeMetrics.value.lastInteractionTime = timestamp
    
    addPerformanceSample('userInteraction', timestamp, { 
      type: interactionType, 
      ...details 
    })
  }

  /**
   * Update active page and visible pages
   */
  const updatePageMetrics = (activePage: number, visiblePages: number[]) => {
    realTimeMetrics.value.activePage = activePage
    realTimeMetrics.value.visiblePages = [...visiblePages]
    
    addPerformanceSample('activePage', activePage)
    addPerformanceSample('visiblePageCount', visiblePages.length)
  }

  /**
   * Calculate cache hit rate
   */
  const updateCacheHitRate = (hits: number, total: number) => {
    const hitRate = total > 0 ? hits / total : 1.0
    performanceMetrics.value.cacheHitRate = hitRate
    addPerformanceSample('cacheHitRate', hitRate)
  }

  /**
   * Get performance summary
   */
  const getPerformanceSummary = () => {
    const metrics = performanceMetrics.value
    const samples = performanceSamples.value

    const recentSamples = samples.filter(s => s.timestamp > Date.now() - 60000) // Last minute

    return {
      current: metrics,
      realTime: realTimeMetrics.value,
      alerts: performanceAlerts.value.filter(a => a.timestamp > Date.now() - 300000), // Last 5 minutes
      trends: {
        memoryTrend: calculateTrend(recentSamples.filter(s => s.metric === 'memoryUsage')),
        frameRateTrend: calculateTrend(recentSamples.filter(s => s.metric === 'frameRate')),
        networkTrend: calculateTrend(recentSamples.filter(s => s.metric === 'networkLatency'))
      }
    }
  }

  /**
   * Calculate trend for a metric
   */
  const calculateTrend = (samples: PerformanceSample[]): 'improving' | 'degrading' | 'stable' => {
    if (samples.length < 2) return 'stable'

    const recent = samples.slice(-5) // Last 5 samples
    const older = samples.slice(-10, -5) // Previous 5 samples

    if (recent.length === 0 || older.length === 0) return 'stable'

    const recentAvg = recent.reduce((sum, s) => sum + s.value, 0) / recent.length
    const olderAvg = older.reduce((sum, s) => sum + s.value, 0) / older.length

    const change = (recentAvg - olderAvg) / olderAvg

    if (Math.abs(change) < 0.05) return 'stable' // Less than 5% change
    
    // For metrics where lower is better (memory, latency)
    return change < 0 ? 'improving' : 'degrading'
  }

  /**
   * Reset all performance data
   */
  const resetPerformanceData = () => {
    performanceMetrics.value = {
      initialLoadTime: 0,
      pageRenderTimes: {},
      memoryUsage: 0,
      frameRate: 60,
      networkLatency: 0,
      cacheHitRate: 1.0,
      errorCount: 0,
      userInteractionDelay: 0
    }

    realTimeMetrics.value = {
      currentMemory: 0,
      currentFrameRate: 60,
      activePage: 1,
      visiblePages: [],
      lastInteractionTime: 0,
      scrollPerformance: 100
    }

    performanceAlerts.value = []
    performanceSamples.value = []
  }

  /**
   * Update performance thresholds
   */
  const updatePerformanceThresholds = (newThresholds: Partial<PerformanceThresholds>) => {
    performanceThresholds.value = { ...performanceThresholds.value, ...newThresholds }
  }

  // Computed properties
  const hasPerformanceIssues = computed(() => {
    return performanceAlerts.value.some(alert => 
      alert.type === 'error' && alert.timestamp > Date.now() - 60000 // Errors in last minute
    )
  })

  const overallPerformanceScore = computed(() => {
    const metrics = performanceMetrics.value
    const thresholds = performanceThresholds.value

    let score = 100

    // Deduct points for each metric that exceeds thresholds
    if (metrics.initialLoadTime > thresholds.maxInitialLoadTime) {
      score -= 10
    }
    if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
      score -= 20
    }
    if (metrics.frameRate < thresholds.minFrameRate) {
      score -= 15
    }
    if (metrics.networkLatency > thresholds.maxNetworkLatency) {
      score -= 10
    }
    if (metrics.cacheHitRate < thresholds.minCacheHitRate) {
      score -= 5
    }

    return Math.max(0, score)
  })

  const isPerformanceOptimal = computed(() => overallPerformanceScore.value >= 90)

  // Initialize monitoring on mount
  onMounted(() => {
    startMonitoring()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // Monitoring control
    isMonitoring: readonly(isMonitoring),
    startMonitoring,
    stopMonitoring,

    // Metrics
    performanceMetrics: readonly(performanceMetrics),
    realTimeMetrics: readonly(realTimeMetrics),
    performanceAlerts: readonly(performanceAlerts),

    // Configuration
    performanceThresholds: readonly(performanceThresholds),
    updatePerformanceThresholds,

    // Measurement
    measurePerformance,
    recordUserInteraction,
    updatePageMetrics,
    updateCacheHitRate,

    // Analysis
    getPerformanceSummary,
    resetPerformanceData,
    hasPerformanceIssues,
    overallPerformanceScore,
    isPerformanceOptimal
  }
}