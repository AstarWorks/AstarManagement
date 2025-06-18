"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCacheStats } from '@/lib/api/cache'

interface PerformanceMetrics {
  loadTime: number
  bundleSize: number
  apiResponseTime: number
  renderTime: number
  memoryUsage: number
  cacheHitRate: number
  connectionType: string
  isOnline: boolean
}

/**
 * Performance monitoring component that tracks and displays performance metrics
 * Helps identify performance bottlenecks and monitors SLA compliance
 */
export const PerformanceMonitor = React.memo(function PerformanceMonitor({
  showInDevelopment = true,
  position = 'bottom-right'
}: {
  showInDevelopment?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    bundleSize: 0,
    apiResponseTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    connectionType: 'unknown',
    isOnline: navigator.onLine
  })
  
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate performance metrics
  const calculateMetrics = React.useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const cacheStats = getCacheStats()
    
    // Calculate cache hit rate
    const totalCacheRequests = Object.values(cacheStats).reduce((sum, cache) => sum + cache.size, 0)
    const totalCacheHits = Object.values(cacheStats).reduce((sum, cache) => sum + (cache.hitRate * cache.size), 0)
    const cacheHitRate = totalCacheRequests > 0 ? (totalCacheHits / totalCacheRequests) * 100 : 0

    // Get memory usage (if available)
    const memoryInfo = (performance as any).memory
    const memoryUsage = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0

    // Get connection info
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const connectionType = connection ? connection.effectiveType || connection.type : 'unknown'

    const newMetrics: PerformanceMetrics = {
      loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      bundleSize: Math.round(navigation.transferSize / 1024), // Convert to KB
      apiResponseTime: 0, // This would be calculated from API calls
      renderTime: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
      memoryUsage,
      cacheHitRate: Math.round(cacheHitRate),
      connectionType,
      isOnline: navigator.onLine
    }

    setMetrics(newMetrics)
  }, [])

  // Monitor visibility
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    setIsVisible(isDevelopment && showInDevelopment)
  }, [showInDevelopment])

  // Update metrics periodically
  useEffect(() => {
    if (!isVisible) return

    calculateMetrics()
    
    const interval = setInterval(calculateMetrics, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [isVisible, calculateMetrics])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Performance mark tracking
  useEffect(() => {
    if (!isVisible) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`📊 Performance measure: ${entry.name} - ${entry.duration.toFixed(2)}ms`)
        }
      })
    })

    observer.observe({ entryTypes: ['measure', 'mark'] })

    return () => observer.disconnect()
  }, [isVisible])

  if (!isVisible) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const getMetricStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'loadTime':
        if (value <= 2000) return 'success' // <= 2s
        if (value <= 3000) return 'warning' // <= 3s
        return 'destructive' // > 3s
      
      case 'apiResponseTime':
        if (value <= 200) return 'success' // <= 200ms
        if (value <= 500) return 'warning' // <= 500ms
        return 'destructive' // > 500ms
      
      case 'memoryUsage':
        if (value <= 100) return 'success' // <= 100MB
        if (value <= 200) return 'warning' // <= 200MB
        return 'destructive' // > 200MB
      
      case 'cacheHitRate':
        if (value >= 80) return 'success' // >= 80%
        if (value >= 60) return 'warning' // >= 60%
        return 'destructive' // < 60%
      
      default:
        return 'secondary'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
    return `${Math.round(bytes / 1024 / 1024)}MB`
  }

  return (
    <Card 
      className={`fixed ${positionClasses[position]} z-50 transition-all duration-200 ${
        isExpanded ? 'w-80' : 'w-16'
      } shadow-lg border-2`}
    >
      <CardHeader 
        className="p-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${metrics.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {isExpanded && (
              <CardTitle className="text-sm font-medium">
                Performance
              </CardTitle>
            )}
          </div>
          {isExpanded && (
            <div className="text-xs text-muted-foreground">
              {metrics.connectionType}
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-2 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Load Time:</span>
                <Badge variant={getMetricStatus('loadTime', metrics.loadTime) as any}>
                  {metrics.loadTime}ms
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Bundle Size:</span>
                <Badge variant="secondary">
                  {formatBytes(metrics.bundleSize * 1024)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Render:</span>
                <Badge variant="secondary">
                  {metrics.renderTime}ms
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Memory:</span>
                <Badge variant={getMetricStatus('memoryUsage', metrics.memoryUsage) as any}>
                  {metrics.memoryUsage}MB
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Cache Hit:</span>
                <Badge variant={getMetricStatus('cacheHitRate', metrics.cacheHitRate) as any}>
                  {metrics.cacheHitRate}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>API:</span>
                <Badge variant={getMetricStatus('apiResponseTime', metrics.apiResponseTime) as any}>
                  {metrics.apiResponseTime}ms
                </Badge>
              </div>
            </div>
          </div>

          {/* Performance targets */}
          <div className="text-xs text-muted-foreground border-t pt-2">
            <div className="font-medium mb-1">Targets:</div>
            <div>Load: &lt;2s | API: &lt;200ms | Memory: &lt;100MB</div>
          </div>
        </CardContent>
      )}
    </Card>
  )
})

/**
 * Hook to track API performance
 */
export function useApiPerformanceTracking() {
  const trackApiCall = React.useCallback((endpoint: string, startTime: number) => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Mark the performance
    performance.mark(`api-call-end-${endpoint}`)
    performance.measure(
      `API Call: ${endpoint}`,
      `api-call-start-${endpoint}`,
      `api-call-end-${endpoint}`
    )
    
    console.log(`📊 API Call: ${endpoint} - ${duration.toFixed(2)}ms`)
    
    return duration
  }, [])

  const startApiCall = React.useCallback((endpoint: string) => {
    const startTime = performance.now()
    performance.mark(`api-call-start-${endpoint}`)
    
    return () => trackApiCall(endpoint, startTime)
  }, [trackApiCall])

  return { startApiCall, trackApiCall }
}

/**
 * Hook to track component render performance
 */
export function useRenderPerformanceTracking(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now()
    performance.mark(`${componentName}-render-start`)
    
    return () => {
      const endTime = performance.now()
      performance.mark(`${componentName}-render-end`)
      performance.measure(
        `Component Render: ${componentName}`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      )
      
      const duration = endTime - startTime
      if (duration > 16) { // 60fps threshold
        console.warn(`⚠️ ${componentName} render took ${duration.toFixed(2)}ms (target: <16ms)`)
      }
    }
  })
}

export default PerformanceMonitor