/**
 * Shared Performance Types for Aster Management
 * 
 * Consolidated performance metrics interfaces to avoid duplicates
 */

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  jankCount: number
  isPerformant: boolean
}

export interface AnimationPerformanceMetrics extends PerformanceMetrics {
  animationFrameTime: number
  animationJankCount: number
  lastAnimationDuration: number
}

export interface KanbanPerformanceMetrics extends PerformanceMetrics {
  dragLatency: number
  mutationLatency: number
  renderLatency: number
  optimizationLevel: 'low' | 'medium' | 'high'
}

export interface PdfPerformanceMetrics extends PerformanceMetrics {
  renderTime: number
  loadTime: number
  memoryUsage: number
  pageCount: number
  networkLatency: number
}

export interface SyncPerformanceMetrics extends PerformanceMetrics {
  syncLatency: number
  dataFreshness: number
  cacheHitRate: number
  networkLatency: number
}

export interface PerformanceConfig {
  // Debouncing
  dragDebounceMs: number
  mutationDebounceMs: number
  
  // Throttling  
  renderThrottleMs: number
  networkThrottleMs: number
  
  // Batching
  batchSize: number
  batchTimeoutMs: number
  enableBatching: boolean
  
  // Thresholds
  performanceThreshold: number
  memoryThreshold: number
  jankThreshold: number
  
  // Auto-optimization
  enableAutoOptimization: boolean
  optimizationThresholds: {
    cpu: number
    memory: number
    fps: number
    latency: number
    memoryUsage: number
    operationCount: number
  }
  
  // Monitoring
  enableMonitoring: boolean
  monitoringIntervalMs: number
  cacheCleanupIntervalMs: number
  
  // Cache settings
  maxCacheSize: number
  
  // Virtual scrolling
  enableVirtualScrolling: boolean
  virtualScrollThreshold: number
  virtualScrollBuffer: number
  
  // Additional timing
  batchDelayMs: number
}

export interface PerformanceOptimizer {
  optimize(): void
  getMetrics(): PerformanceMetrics
  isOptimized(): boolean
  reset(): void
}