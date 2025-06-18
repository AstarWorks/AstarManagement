/**
 * Memory profiler and leak detection utilities
 * Monitors memory usage and detects potential memory leaks
 */

import React from 'react'

interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

interface MemorySnapshot {
  baseline: MemoryMetrics
  current: MemoryMetrics
  delta: number
  trend: 'increasing' | 'stable' | 'decreasing'
}

class MemoryProfiler {
  private snapshots: MemoryMetrics[] = []
  private baselineSnapshot: MemoryMetrics | null = null
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private warningThresholds = {
    memoryIncrease: 50 * 1024 * 1024, // 50MB increase
    memoryLimit: 200 * 1024 * 1024, // 200MB total limit
    snapshotHistory: 20 // Keep last 20 snapshots
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): MemoryMetrics | null {
    if (!(performance as any).memory) {
      console.warn('Memory API not available in this browser')
      return null
    }

    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    }
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot | null {
    const current = this.getCurrentMemoryUsage()
    if (!current) return null

    // Set baseline if not set
    if (!this.baselineSnapshot) {
      this.baselineSnapshot = current
    }

    // Add to snapshots history
    this.snapshots.push(current)
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.warningThresholds.snapshotHistory) {
      this.snapshots = this.snapshots.slice(-this.warningThresholds.snapshotHistory)
    }

    const delta = current.usedJSHeapSize - this.baselineSnapshot.usedJSHeapSize
    const trend = this.calculateTrend()

    return {
      baseline: this.baselineSnapshot,
      current,
      delta,
      trend
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateTrend(): 'increasing' | 'stable' | 'decreasing' {
    if (this.snapshots.length < 3) return 'stable'

    const recent = this.snapshots.slice(-3)
    const first = recent[0].usedJSHeapSize
    const last = recent[recent.length - 1].usedJSHeapSize
    const difference = last - first

    if (difference > 10 * 1024 * 1024) return 'increasing' // 10MB increase
    if (difference < -10 * 1024 * 1024) return 'decreasing' // 10MB decrease
    return 'stable'
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs = 10000) {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🔍 Memory monitoring started')

    // Take initial baseline
    this.takeSnapshot()

    this.monitoringInterval = setInterval(() => {
      const snapshot = this.takeSnapshot()
      if (snapshot) {
        this.checkForLeaks(snapshot)
      }
    }, intervalMs)
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    console.log('🔍 Memory monitoring stopped')
  }

  /**
   * Check for potential memory leaks
   */
  private checkForLeaks(snapshot: MemorySnapshot) {
    const { current, delta, trend } = snapshot

    // Check if memory usage exceeds limits
    if (current.usedJSHeapSize > this.warningThresholds.memoryLimit) {
      console.warn(
        `🚨 Memory usage high: ${this.formatBytes(current.usedJSHeapSize)} (limit: ${this.formatBytes(this.warningThresholds.memoryLimit)})`
      )
    }

    // Check if memory increased significantly from baseline
    if (delta > this.warningThresholds.memoryIncrease) {
      console.warn(
        `🚨 Memory increased by ${this.formatBytes(delta)} from baseline`
      )
    }

    // Check for consistent increasing trend
    if (trend === 'increasing' && this.snapshots.length >= 5) {
      const recentIncreases = this.snapshots.slice(-5).every((snapshot, index, arr) => {
        if (index === 0) return true
        return snapshot.usedJSHeapSize > arr[index - 1].usedJSHeapSize
      })

      if (recentIncreases) {
        console.warn('🚨 Potential memory leak detected - consistent memory growth')
        this.suggestMemoryOptimizations()
      }
    }

    // Log current status
    console.log(
      `📊 Memory: ${this.formatBytes(current.usedJSHeapSize)} | Trend: ${trend} | Delta: ${this.formatBytes(delta)}`
    )
  }

  /**
   * Suggest memory optimizations
   */
  private suggestMemoryOptimizations() {
    console.group('💡 Memory Optimization Suggestions:')
    console.log('• Check for unclosed event listeners')
    console.log('• Review component cleanup in useEffect')
    console.log('• Clear interval/timeout references')
    console.log('• Cleanup WebSocket connections')
    console.log('• Clear large data structures when not needed')
    console.log('• Review store state for unnecessary data retention')
    console.groupEnd()
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection() {
    if ((window as any).gc) {
      (window as any).gc()
      console.log('🗑️ Forced garbage collection')
    } else {
      console.log('⚠️ Garbage collection not available (run with --expose-gc flag)')
    }
  }

  /**
   * Generate memory report
   */
  generateReport(): string {
    const current = this.getCurrentMemoryUsage()
    if (!current || !this.baselineSnapshot) return 'Memory monitoring not active'

    const delta = current.usedJSHeapSize - this.baselineSnapshot.usedJSHeapSize
    const trend = this.calculateTrend()

    return `
Memory Report:
=============
Current Usage: ${this.formatBytes(current.usedJSHeapSize)}
Baseline: ${this.formatBytes(this.baselineSnapshot.usedJSHeapSize)}
Change: ${delta >= 0 ? '+' : ''}${this.formatBytes(delta)}
Trend: ${trend}
Heap Limit: ${this.formatBytes(current.jsHeapSizeLimit)}
Total Heap: ${this.formatBytes(current.totalJSHeapSize)}
Snapshots Taken: ${this.snapshots.length}
    `.trim()
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${Math.round(bytes / 1024 / 1024)} MB`
  }

  /**
   * Reset monitoring data
   */
  reset() {
    this.snapshots = []
    this.baselineSnapshot = null
    console.log('🔄 Memory profiler reset')
  }
}

// Global instance
const memoryProfiler = new MemoryProfiler()

/**
 * React hook for memory monitoring
 */
export function useMemoryMonitoring(
  options: {
    autoStart?: boolean
    intervalMs?: number
    componentName?: string
  } = {}
) {
  const { autoStart = true, intervalMs = 10000, componentName } = options
  const [memorySnapshot, setMemorySnapshot] = React.useState<MemorySnapshot | null>(null)

  React.useEffect(() => {
    if (autoStart) {
      memoryProfiler.startMonitoring(intervalMs)
    }

    const interval = setInterval(() => {
      const snapshot = memoryProfiler.takeSnapshot()
      setMemorySnapshot(snapshot)
    }, intervalMs)

    return () => {
      clearInterval(interval)
      if (autoStart) {
        memoryProfiler.stopMonitoring()
      }
    }
  }, [autoStart, intervalMs])

  React.useEffect(() => {
    if (componentName) {
      console.log(`📊 ${componentName} mounted - taking memory snapshot`)
      const snapshot = memoryProfiler.takeSnapshot()
      setMemorySnapshot(snapshot)

      return () => {
        console.log(`📊 ${componentName} unmounted - checking for leaks`)
        // Take snapshot after component unmounts to check for leaks
        setTimeout(() => {
          memoryProfiler.takeSnapshot()
        }, 1000)
      }
    }
  }, [componentName])

  return {
    snapshot: memorySnapshot,
    takeSnapshot: () => memoryProfiler.takeSnapshot(),
    generateReport: () => memoryProfiler.generateReport(),
    forceGC: () => memoryProfiler.forceGarbageCollection()
  }
}

/**
 * Hook to detect and prevent memory leaks in components
 */
export function useMemoryLeakDetection(componentName: string) {
  const mountTimeRef = React.useRef(Date.now())
  const cleanupFunctionsRef = React.useRef<Array<() => void>>([])

  React.useEffect(() => {
    console.log(`🔍 ${componentName} leak detection started`)

    return () => {
      const lifetime = Date.now() - mountTimeRef.current
      console.log(`🔍 ${componentName} unmounted after ${lifetime}ms`)
      
      // Run all cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.warn(`⚠️ Cleanup error in ${componentName}:`, error)
        }
      })
      
      // Clear cleanup functions
      cleanupFunctionsRef.current = []
    }
  }, [componentName])

  const addCleanupFunction = React.useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup)
  }, [])

  return { addCleanupFunction }
}

/**
 * Hook for detecting DOM node leaks
 */
export function useDOMLeakDetection(componentName: string) {
  const nodeCountRef = React.useRef(0)

  React.useEffect(() => {
    nodeCountRef.current = document.querySelectorAll('*').length
    console.log(`📊 ${componentName} DOM nodes at mount: ${nodeCountRef.current}`)

    return () => {
      setTimeout(() => {
        const currentNodeCount = document.querySelectorAll('*').length
        const difference = currentNodeCount - nodeCountRef.current
        
        if (difference > 0) {
          console.warn(`🚨 ${componentName} may have leaked ${difference} DOM nodes`)
        } else {
          console.log(`✅ ${componentName} DOM cleanup successful`)
        }
      }, 100) // Small delay to allow for cleanup
    }
  }, [componentName])
}

/**
 * Export the profiler instance
 */
export default memoryProfiler

// Export utilities
export { MemoryProfiler, type MemoryMetrics, type MemorySnapshot }