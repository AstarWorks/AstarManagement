/**
 * Performance Optimization Suite - Entry Point
 * Centralizes all performance enhancements for Aster Management Frontend
 */

// Export all performance utilities
export { default as WebVitalsMonitor, useWebVitals, performanceUtils } from './web-vitals'
export { default as ProgressiveLoader, useProgressiveLoader, loadingPatterns } from './progressive-loader'

// Export lazy loading components
export * from '../components/lazy'

// Export optimized selectors
export * from '../../stores/performance-optimized-selectors'

// Export service worker utilities
export { 
  initServiceWorker, 
  getServiceWorkerManager, 
  isServiceWorkerSupported, 
  useServiceWorker 
} from '../service-worker'

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Bundle size targets (in KB)
  TARGET_BUNDLE_SIZE: 500,
  TARGET_CHUNK_SIZE: 250,
  
  // Loading time targets (in ms)
  TARGET_FCP: 1500,
  TARGET_LCP: 2500,
  TARGET_FID: 100,
  TARGET_CLS: 0.1,
  TARGET_TTFB: 800,
  
  // Virtualization settings
  VIRTUAL_LIST_ITEM_HEIGHT: 120,
  VIRTUAL_LIST_OVERSCAN: 5,
  VIRTUAL_LIST_PAGE_SIZE: 20,
  
  // Lazy loading delays (in ms)
  LAZY_LOAD_DELAYS: {
    immediate: 0,
    high: 100,
    normal: 200,
    low: 500,
    idle: 1000
  },
  
  // Cache settings
  CACHE_DURATION: {
    static: 31536000, // 1 year
    api: 300,         // 5 minutes
    images: 2592000   // 30 days
  }
} as const

// Performance initialization
export async function initializePerformanceOptimizations() {
  console.log('🚀 Initializing performance optimizations...')
  
  try {
    // Initialize Web Vitals monitoring
    const webVitalsMonitor = (await import('./web-vitals')).default.getInstance()
    
    // Initialize service worker
    await initServiceWorker({
      onInstalled: () => console.log('✅ Service worker installed'),
      onUpdated: () => console.log('🔄 Service worker updated'),
      onError: (error) => console.error('❌ Service worker error:', error)
    })
    
    // Initialize progressive loader
    const progressiveLoader = (await import('./progressive-loader')).default.getInstance()
    
    // Preload critical resources
    const { preloadCriticalComponents } = await import('../components/lazy')
    await preloadCriticalComponents()
    
    console.log('✅ Performance optimizations initialized successfully')
    
    return {
      webVitalsMonitor,
      progressiveLoader
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize performance optimizations:', error)
    throw error
  }
}

// Performance monitoring utilities
export const performanceMonitoring = {
  /**
   * Start performance monitoring for a specific route
   */
  startRouteMonitoring(routeName: string) {
    const startTime = performance.now()
    
    return {
      finish: () => {
        const duration = performance.now() - startTime
        WebVitalsMonitor.getInstance().recordCustomMetric(`route-load-${routeName}`, duration)
        console.log(`📊 Route ${routeName} loaded in ${duration.toFixed(2)}ms`)
      }
    }
  },
  
  /**
   * Monitor component render performance
   */
  monitorComponentRender(componentName: string) {
    const startTime = performance.now()
    
    return {
      finish: () => {
        const duration = performance.now() - startTime
        WebVitalsMonitor.getInstance().recordCustomMetric(`component-render-${componentName}`, duration)
        
        if (duration > 16) { // 60fps threshold
          console.warn(`⚠️ Component ${componentName} took ${duration.toFixed(2)}ms to render (target: <16ms)`)
        }
      }
    }
  },
  
  /**
   * Monitor API call performance
   */
  monitorApiCall(endpoint: string) {
    const startTime = performance.now()
    
    return {
      finish: (success: boolean = true) => {
        const duration = performance.now() - startTime
        WebVitalsMonitor.getInstance().recordCustomMetric(
          `api-call-${endpoint.replace('/', '-')}`, 
          duration,
          { success }
        )
        
        if (duration > 1000) {
          console.warn(`⚠️ API call to ${endpoint} took ${duration.toFixed(2)}ms`)
        }
      }
    }
  }
}

// React hook for comprehensive performance monitoring
export function usePerformanceMonitoring(componentName?: string) {
  const webVitals = useWebVitals()
  const progressiveLoader = useProgressiveLoader()
  const serviceWorker = useServiceWorker()
  
  React.useEffect(() => {
    if (componentName) {
      const monitor = performanceMonitoring.monitorComponentRender(componentName)
      return monitor.finish
    }
  }, [componentName])
  
  return {
    // Web Vitals data
    vitalsReport: webVitals.report,
    vitalsScore: webVitals.summary?.vitalsScore || 0,
    recommendations: webVitals.summary?.recommendations || [],
    
    // Progressive loading state
    loadingProgress: progressiveLoader.loadingProgress,
    loadedResources: progressiveLoader.loadedResources.size,
    totalResources: progressiveLoader.totalResources,
    
    // Service worker state
    isOnline: serviceWorker.isOnline,
    hasUpdate: serviceWorker.hasUpdate,
    queueCount: serviceWorker.queueCount,
    
    // Monitoring utilities
    recordMetric: webVitals.recordMetric,
    addResource: progressiveLoader.addResource,
    cacheMatters: serviceWorker.cacheMatters,
    
    // Performance helpers
    monitoring: performanceMonitoring
  }
}

// Performance debugging utilities (development only)
export const performanceDebug = {
  /**
   * Get detailed performance stats
   */
  getDetailedStats() {
    if (process.env.NODE_ENV !== 'development') return null
    
    const webVitals = WebVitalsMonitor.getInstance().generateReport()
    const progressiveLoader = ProgressiveLoader.getInstance().getState()
    
    return {
      webVitals,
      progressiveLoader,
      memory: {
        used: (performance as any).memory?.usedJSHeapSize || 0,
        total: (performance as any).memory?.totalJSHeapSize || 0,
        limit: (performance as any).memory?.jsHeapSizeLimit || 0
      },
      timing: performance.timing,
      navigation: performance.navigation
    }
  },
  
  /**
   * Export performance data for analysis
   */
  exportPerformanceData() {
    const stats = this.getDetailedStats()
    if (!stats) return
    
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `aster-performance-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
  
  /**
   * Log performance summary to console
   */
  logSummary() {
    const stats = this.getDetailedStats()
    if (!stats) return
    
    console.group('🚀 Aster Management Performance Summary')
    console.log('📊 Web Vitals:', stats.webVitals.vitals)
    console.log('📦 Progressive Loading:', stats.progressiveLoader)
    console.log('💾 Memory Usage:', stats.memory)
    console.groupEnd()
  }
}

// Global performance event listeners (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Listen for long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`)
          }
        })
      })
      observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      console.warn('Long task observer not supported')
    }
  }
  
  // Add keyboard shortcut for performance debugging
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      performanceDebug.logSummary()
    }
  })
}

// Import React for hooks
import React from 'react'

export default {
  initializePerformanceOptimizations,
  performanceMonitoring,
  usePerformanceMonitoring,
  performanceDebug,
  PERFORMANCE_CONFIG
}