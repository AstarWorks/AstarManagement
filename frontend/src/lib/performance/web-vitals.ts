/**
 * Web Vitals Performance Monitoring for Aster Management
 * Tracks Core Web Vitals and custom performance metrics
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

interface VitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  timestamp: number
}

interface CustomMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

interface PerformanceReport {
  vitals: VitalMetric[]
  custom: CustomMetric[]
  url: string
  userAgent: string
  timestamp: number
  sessionId: string
}

class WebVitalsMonitor {
  private static instance: WebVitalsMonitor | null = null
  
  private vitals: VitalMetric[] = []
  private customMetrics: CustomMetric[] = []
  private sessionId: string = this.generateSessionId()
  private isEnabled: boolean = true
  private callbacks: Set<(report: PerformanceReport) => void> = new Set()

  private constructor() {
    this.initializeVitalsTracking()
    this.setupCustomMetrics()
  }

  static getInstance(): WebVitalsMonitor {
    if (!WebVitalsMonitor.instance) {
      WebVitalsMonitor.instance = new WebVitalsMonitor()
    }
    return WebVitalsMonitor.instance
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  private initializeVitalsTracking(): void {
    if (!this.isEnabled) return

    // Track Cumulative Layout Shift
    onCLS((metric) => {
      this.recordVital({
        name: 'CLS',
        value: metric.value,
        rating: this.getCLSRating(metric.value),
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now()
      })
    })

    // Track First Input Delay
    onFID((metric) => {
      this.recordVital({
        name: 'FID',
        value: metric.value,
        rating: this.getFIDRating(metric.value),
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now()
      })
    })

    // Track First Contentful Paint
    onFCP((metric) => {
      this.recordVital({
        name: 'FCP',
        value: metric.value,
        rating: this.getFCPRating(metric.value),
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now()
      })
    })

    // Track Largest Contentful Paint
    onLCP((metric) => {
      this.recordVital({
        name: 'LCP',
        value: metric.value,
        rating: this.getLCPRating(metric.value),
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now()
      })
    })

    // Track Time to First Byte
    onTTFB((metric) => {
      this.recordVital({
        name: 'TTFB',
        value: metric.value,
        rating: this.getTTFBRating(metric.value),
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now()
      })
    })

    console.log('📊 Web Vitals monitoring initialized')
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics(): void {
    // Monitor long tasks (> 50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordCustomMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name
            })
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })

        // Monitor resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resource = entry as PerformanceResourceTiming
              this.recordCustomMetric('resource-load', resource.duration, {
                name: resource.name,
                transferSize: resource.transferSize,
                type: this.getResourceType(resource.name)
              })
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })

        // Monitor navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const nav = entry as PerformanceNavigationTiming
              this.recordCustomMetric('dom-content-loaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart)
              this.recordCustomMetric('dom-complete', nav.domComplete - nav.navigationStart)
              this.recordCustomMetric('page-load', nav.loadEventEnd - nav.navigationStart)
            }
          })
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })

      } catch (error) {
        console.warn('Some performance observers not supported:', error)
      }
    }

    // Monitor React component render times
    this.setupReactMetrics()
  }

  /**
   * Setup React-specific performance metrics
   */
  private setupReactMetrics(): void {
    // Track React component mount times
    let reactMountStart: number | null = null

    const originalConsoleTime = console.time
    const originalConsoleTimeEnd = console.timeEnd

    console.time = (label?: string) => {
      if (label?.includes('React')) {
        reactMountStart = performance.now()
      }
      return originalConsoleTime.call(console, label)
    }

    console.timeEnd = (label?: string) => {
      if (label?.includes('React') && reactMountStart) {
        const duration = performance.now() - reactMountStart
        this.recordCustomMetric('react-component-mount', duration, { component: label })
        reactMountStart = null
      }
      return originalConsoleTimeEnd.call(console, label)
    }
  }

  /**
   * Record a Web Vital metric
   */
  private recordVital(vital: VitalMetric): void {
    this.vitals.push(vital)
    
    console.log(`📊 ${vital.name}: ${vital.value.toFixed(2)}${this.getUnitForVital(vital.name)} (${vital.rating})`)
    
    // Send to analytics if configured
    this.sendToAnalytics('vital', vital)
    
    // Notify subscribers
    this.notifySubscribers()
  }

  /**
   * Record a custom performance metric
   */
  recordCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    }
    
    this.customMetrics.push(metric)
    
    // Log significant metrics
    if (value > 100 || name.includes('error')) {
      console.log(`⚡ Custom metric ${name}: ${value.toFixed(2)}ms`, metadata)
    }
    
    // Send to analytics if configured
    this.sendToAnalytics('custom', metric)
  }

  /**
   * Get performance ratings based on Core Web Vitals thresholds
   */
  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  private getFCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good'
    if (value <= 3000) return 'needs-improvement'
    return 'poor'
  }

  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good'
    if (value <= 1800) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Get unit for vital metric display
   */
  private getUnitForVital(name: string): string {
    switch (name) {
      case 'CLS': return ''
      case 'FID':
      case 'FCP':
      case 'LCP':
      case 'TTFB': return 'ms'
      default: return ''
    }
  }

  /**
   * Determine resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('_next/static/chunks/')) return 'javascript'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font'
    return 'other'
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(type: 'vital' | 'custom', metric: VitalMetric | CustomMetric): void {
    // This would integrate with your analytics service
    // For now, we'll just store in sessionStorage for debugging
    
    try {
      const existing = JSON.parse(sessionStorage.getItem('aster-performance') || '[]')
      existing.push({ type, metric, sessionId: this.sessionId })
      
      // Keep only last 100 metrics
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100)
      }
      
      sessionStorage.setItem('aster-performance', JSON.stringify(existing))
    } catch (error) {
      console.warn('Failed to store performance metric:', error)
    }
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(callback: (report: PerformanceReport) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Notify subscribers of updates
   */
  private notifySubscribers(): void {
    const report = this.generateReport()
    this.callbacks.forEach(callback => callback(report))
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    return {
      vitals: [...this.vitals],
      custom: [...this.customMetrics],
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    vitalsScore: number
    criticalMetrics: (VitalMetric | CustomMetric)[]
    recommendations: string[]
  } {
    const vitals = this.vitals
    const custom = this.customMetrics

    // Calculate overall vitals score (0-100)
    const vitalsScore = this.calculateVitalsScore(vitals)

    // Identify critical metrics
    const criticalMetrics = [
      ...vitals.filter(v => v.rating === 'poor'),
      ...custom.filter(c => c.value > 100 && c.name.includes('render'))
    ]

    // Generate recommendations
    const recommendations = this.generateRecommendations(vitals, custom)

    return {
      vitalsScore,
      criticalMetrics,
      recommendations
    }
  }

  /**
   * Calculate overall vitals score
   */
  private calculateVitalsScore(vitals: VitalMetric[]): number {
    if (vitals.length === 0) return 0

    const scores = vitals.map(vital => {
      switch (vital.rating) {
        case 'good': return 100
        case 'needs-improvement': return 75
        case 'poor': return 25
        default: return 0
      }
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(vitals: VitalMetric[], custom: CustomMetric[]): string[] {
    const recommendations: string[] = []

    // Check each vital
    vitals.forEach(vital => {
      if (vital.rating === 'poor') {
        switch (vital.name) {
          case 'LCP':
            recommendations.push('Optimize image loading and implement lazy loading for above-the-fold content')
            break
          case 'FID':
            recommendations.push('Reduce JavaScript bundle size and implement code splitting')
            break
          case 'CLS':
            recommendations.push('Add size attributes to images and reserve space for dynamic content')
            break
          case 'FCP':
            recommendations.push('Minimize render-blocking resources and optimize critical CSS')
            break
          case 'TTFB':
            recommendations.push('Optimize server response time and enable caching')
            break
        }
      }
    })

    // Check custom metrics
    const longTasks = custom.filter(m => m.name === 'long-task' && m.value > 50)
    if (longTasks.length > 0) {
      recommendations.push('Break up long JavaScript tasks using requestIdleCallback')
    }

    const slowResources = custom.filter(m => m.name === 'resource-load' && m.value > 1000)
    if (slowResources.length > 0) {
      recommendations.push('Optimize slow-loading resources or implement better caching')
    }

    return recommendations
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`📊 Web Vitals monitoring ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Clear all collected metrics
   */
  clear(): void {
    this.vitals = []
    this.customMetrics = []
    this.sessionId = this.generateSessionId()
    sessionStorage.removeItem('aster-performance')
    console.log('📊 Performance metrics cleared')
  }
}

// React hook for using Web Vitals monitoring
export function useWebVitals() {
  const [report, setReport] = React.useState<PerformanceReport | null>(null)
  const [summary, setSummary] = React.useState<ReturnType<WebVitalsMonitor['getSummary']> | null>(null)

  React.useEffect(() => {
    const monitor = WebVitalsMonitor.getInstance()
    
    const unsubscribe = monitor.subscribe((newReport) => {
      setReport(newReport)
      setSummary(monitor.getSummary())
    })

    // Initial data
    setReport(monitor.generateReport())
    setSummary(monitor.getSummary())

    return unsubscribe
  }, [])

  const recordMetric = React.useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    WebVitalsMonitor.getInstance().recordCustomMetric(name, value, metadata)
  }, [])

  const clear = React.useCallback(() => {
    WebVitalsMonitor.getInstance().clear()
  }, [])

  return {
    report,
    summary,
    recordMetric,
    clear
  }
}

// Utility functions for manual performance measurement
export const performanceUtils = {
  /**
   * Measure function execution time
   */
  measureFunction<T extends (...args: any[]) => any>(
    fn: T, 
    name?: string
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>) => {
      const start = performance.now()
      const result = fn(...args)
      const duration = performance.now() - start
      
      WebVitalsMonitor.getInstance().recordCustomMetric(
        name || fn.name || 'function-call',
        duration,
        { args: args.length }
      )
      
      return result
    }
  },

  /**
   * Measure async function execution time
   */
  measureAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name?: string
  ): (...args: Parameters<T>) => ReturnType<T> {
    return async (...args: Parameters<T>) => {
      const start = performance.now()
      const result = await fn(...args)
      const duration = performance.now() - start
      
      WebVitalsMonitor.getInstance().recordCustomMetric(
        name || fn.name || 'async-function-call',
        duration,
        { args: args.length }
      )
      
      return result
    }
  },

  /**
   * Mark start of custom measurement
   */
  mark(name: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      WebVitalsMonitor.getInstance().recordCustomMetric(name, duration)
    }
  }
}

// Initialize monitoring on import
if (typeof window !== 'undefined') {
  WebVitalsMonitor.getInstance()
}

// Import React for hooks
import React from 'react'

export default WebVitalsMonitor