/**
 * Web Vitals Integration for Performance Monitoring
 * 
 * @description Tracks Core Web Vitals metrics (LCP, FID, CLS, FCP, TTFB)
 * and integrates them with TanStack Query performance monitoring to provide
 * a comprehensive view of application performance.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Metric } from 'web-vitals'

/**
 * Web Vitals metrics interface
 */
interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  
  // Other vitals
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte
  inp: number | null // Interaction to Next Paint
}

/**
 * Performance thresholds based on Google's recommendations
 */
const THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 }, // milliseconds
  fid: { good: 100, needsImprovement: 300 }, // milliseconds
  cls: { good: 0.1, needsImprovement: 0.25 }, // score
  fcp: { good: 1800, needsImprovement: 3000 }, // milliseconds
  ttfb: { good: 800, needsImprovement: 1800 }, // milliseconds
  inp: { good: 200, needsImprovement: 500 } // milliseconds
} as const

/**
 * Web Vitals composable for tracking Core Web Vitals
 */
export function useWebVitals() {
  const metrics = ref<WebVitalsMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  })
  
  const vitalsHistory = ref<Array<{
    metric: string
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    timestamp: number
  }>>([])
  
  const isSupported = ref(false)
  
  /**
   * Get rating for a metric value
   */
  const getRating = (metricName: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = THRESHOLDS[metricName]
    if (value <= threshold.good) return 'good'
    if (value <= threshold.needsImprovement) return 'needs-improvement'
    return 'poor'
  }
  
  /**
   * Record a web vital metric
   */
  const recordMetric = (metric: Metric) => {
    const metricName = metric.name.toLowerCase() as keyof WebVitalsMetrics
    metrics.value[metricName] = metric.value
    
    // Add to history
    const rating = getRating(metricName as keyof typeof THRESHOLDS, metric.value)
    vitalsHistory.value.push({
      metric: metric.name,
      value: metric.value,
      rating,
      timestamp: Date.now()
    })
    
    // Keep only last 100 entries
    if (vitalsHistory.value.length > 100) {
      vitalsHistory.value = vitalsHistory.value.slice(-100)
    }
    
    // Log poor performance
    if (rating === 'poor') {
      console.warn(`Poor ${metric.name} performance:`, metric.value)
    }
  }
  
  /**
   * Initialize Web Vitals tracking
   */
  const initializeWebVitals = async () => {
    if (typeof window === 'undefined') return
    
    try {
      // Dynamic import to avoid SSR issues
      const { onLCP, onFID, onCLS, onFCP, onTTFB, onINP } = await import('web-vitals')
      
      isSupported.value = true
      
      // Track Core Web Vitals
      onLCP(recordMetric)
      onFID(recordMetric)
      onCLS(recordMetric)
      
      // Track other vitals
      onFCP(recordMetric)
      onTTFB(recordMetric)
      onINP(recordMetric)
      
      console.log('📊 Web Vitals tracking initialized')
    } catch (error) {
      console.warn('Failed to initialize Web Vitals:', error)
      isSupported.value = false
    }
  }
  
  /**
   * Get current performance score (0-100)
   */
  const performanceScore = computed(() => {
    let score = 100
    let metricsCount = 0
    
    // Calculate score based on Core Web Vitals
    if (metrics.value.lcp !== null) {
      metricsCount++
      const rating = getRating('lcp', metrics.value.lcp)
      if (rating === 'needs-improvement') score -= 10
      else if (rating === 'poor') score -= 25
    }
    
    if (metrics.value.fid !== null) {
      metricsCount++
      const rating = getRating('fid', metrics.value.fid)
      if (rating === 'needs-improvement') score -= 10
      else if (rating === 'poor') score -= 25
    }
    
    if (metrics.value.cls !== null) {
      metricsCount++
      const rating = getRating('cls', metrics.value.cls)
      if (rating === 'needs-improvement') score -= 10
      else if (rating === 'poor') score -= 25
    }
    
    // Adjust score based on other vitals
    if (metrics.value.fcp !== null) {
      const rating = getRating('fcp', metrics.value.fcp)
      if (rating === 'poor') score -= 5
    }
    
    if (metrics.value.ttfb !== null) {
      const rating = getRating('ttfb', metrics.value.ttfb)
      if (rating === 'poor') score -= 5
    }
    
    return Math.max(0, Math.min(100, score))
  })
  
  /**
   * Get performance summary
   */
  const performanceSummary = computed(() => {
    const summary: Record<string, { value: number | null, rating: string }> = {}
    
    Object.entries(metrics.value).forEach(([key, value]) => {
      if (value !== null) {
        summary[key] = {
          value,
          rating: getRating(key as keyof typeof THRESHOLDS, value)
        }
      }
    })
    
    return summary
  })
  
  /**
   * Export Web Vitals data
   */
  const exportWebVitals = () => {
    return {
      metrics: metrics.value,
      history: vitalsHistory.value,
      score: performanceScore.value,
      timestamp: Date.now()
    }
  }
  
  onMounted(() => {
    initializeWebVitals()
  })
  
  return {
    metrics: computed(() => metrics.value),
    vitalsHistory: computed(() => vitalsHistory.value),
    performanceScore,
    performanceSummary,
    isSupported: computed(() => isSupported.value),
    getRating,
    exportWebVitals
  }
}

/**
 * Integration with TanStack Query Performance Monitor
 */
export function useWebVitalsWithQueryMetrics() {
  const webVitals = useWebVitals()
  const { getGlobalQueryPerformanceMonitor } = await import('~/composables/useQueryPerformanceMonitor')
  const queryMonitor = getGlobalQueryPerformanceMonitor()
  const queryMetrics = queryMonitor.getMetrics()
  
  /**
   * Combined performance score including both Web Vitals and Query metrics
   */
  const combinedPerformanceScore = computed(() => {
    const webVitalsScore = webVitals.performanceScore.value
    const queryScore = queryMetrics.performanceScore.value
    
    // Weight: 60% Web Vitals, 40% Query Performance
    return Math.round(webVitalsScore * 0.6 + queryScore * 0.4)
  })
  
  /**
   * Identify performance bottlenecks
   */
  const performanceBottlenecks = computed(() => {
    const bottlenecks: Array<{
      category: string
      metric: string
      value: number | string
      severity: 'low' | 'medium' | 'high'
      recommendation: string
    }> = []
    
    // Check Web Vitals
    if (webVitals.metrics.value.lcp && webVitals.getRating('lcp', webVitals.metrics.value.lcp) === 'poor') {
      bottlenecks.push({
        category: 'Web Vitals',
        metric: 'LCP',
        value: `${webVitals.metrics.value.lcp}ms`,
        severity: 'high',
        recommendation: 'Optimize largest content element loading'
      })
    }
    
    if (webVitals.metrics.value.cls && webVitals.getRating('cls', webVitals.metrics.value.cls) === 'poor') {
      bottlenecks.push({
        category: 'Web Vitals',
        metric: 'CLS',
        value: webVitals.metrics.value.cls.toFixed(3),
        severity: 'high',
        recommendation: 'Reduce layout shifts by reserving space for dynamic content'
      })
    }
    
    // Check Query Performance
    if (queryMetrics.performanceSummary.value.averageQueryTime > 200) {
      bottlenecks.push({
        category: 'Query Performance',
        metric: 'Average Query Time',
        value: `${queryMetrics.performanceSummary.value.averageQueryTime.toFixed(0)}ms`,
        severity: queryMetrics.performanceSummary.value.averageQueryTime > 500 ? 'high' : 'medium',
        recommendation: 'Optimize API endpoints or implement better caching'
      })
    }
    
    if (queryMetrics.performanceSummary.value.cacheHitRate < 50) {
      bottlenecks.push({
        category: 'Query Performance',
        metric: 'Cache Hit Rate',
        value: `${queryMetrics.performanceSummary.value.cacheHitRate.toFixed(0)}%`,
        severity: 'medium',
        recommendation: 'Review cache configuration and stale times'
      })
    }
    
    return bottlenecks
  })
  
  /**
   * Performance recommendations based on current metrics
   */
  const performanceRecommendations = computed(() => {
    const recommendations: string[] = []
    
    // Web Vitals recommendations
    if (webVitals.metrics.value.lcp && webVitals.metrics.value.lcp > 2500) {
      recommendations.push('Consider lazy loading images and optimizing critical rendering path')
    }
    
    if (webVitals.metrics.value.fid && webVitals.metrics.value.fid > 100) {
      recommendations.push('Reduce JavaScript execution time and break up long tasks')
    }
    
    // Query recommendations
    if (queryMetrics.performanceSummary.value.p95QueryTime > 500) {
      recommendations.push('Implement request batching or GraphQL for complex data fetching')
    }
    
    if (queryMetrics.activeQueries.value > 10) {
      recommendations.push('Consider implementing query cancellation for navigation')
    }
    
    return recommendations
  })
  
  /**
   * Export combined performance report
   */
  const exportPerformanceReport = () => {
    return {
      webVitals: webVitals.exportWebVitals(),
      queryMetrics: queryMetrics.exportMetrics(),
      combinedScore: combinedPerformanceScore.value,
      bottlenecks: performanceBottlenecks.value,
      recommendations: performanceRecommendations.value,
      timestamp: Date.now()
    }
  }
  
  return {
    webVitals,
    queryMetrics,
    combinedPerformanceScore,
    performanceBottlenecks,
    performanceRecommendations,
    exportPerformanceReport
  }
}