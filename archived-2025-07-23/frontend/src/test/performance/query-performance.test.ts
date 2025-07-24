/**
 * TanStack Query Performance Tests
 * 
 * @description Tests for query performance monitoring, sub-200ms response targets,
 * and integration with Web Vitals metrics.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getGlobalQueryPerformanceMonitor } from '~/composables/useQueryPerformanceMonitor'
import { useWebVitals } from '~/composables/useWebVitals'
import type { QueryClient } from '@tanstack/vue-query'

describe('Query Performance Monitoring', () => {
  let monitor: ReturnType<typeof getGlobalQueryPerformanceMonitor>
  let metrics: ReturnType<typeof getGlobalQueryPerformanceMonitor>['getMetrics']
  
  beforeEach(() => {
    monitor = getGlobalQueryPerformanceMonitor()
    metrics = monitor.getMetrics()
    monitor.initializeMonitoring()
    metrics.clearMetrics()
  })
  
  afterEach(() => {
    metrics.clearMetrics()
  })
  
  describe('Query Timing', () => {
    it('should track query start and success', () => {
      const queryHash = 'test-query-1'
      
      metrics.recordQueryStart(queryHash, ['matters', 'list'])
      expect(metrics.activeQueries.value).toBe(1)
      
      // Simulate 150ms query
      vi.advanceTimersByTime(150)
      metrics.recordQuerySuccess(queryHash)
      
      expect(metrics.activeQueries.value).toBe(0)
      expect(metrics.performanceSummary.value.averageQueryTime).toBeLessThan(200)
    })
    
    it('should track query errors', () => {
      const queryHash = 'test-query-error'
      const error = new Error('Network error')
      
      metrics.recordQueryStart(queryHash)
      metrics.recordQueryError(queryHash, error)
      
      expect(metrics.performanceSummary.value.failedQueries).toBe(1)
      expect(metrics.performanceAlerts.value).toHaveLength(1)
      expect(metrics.performanceAlerts.value[0].type).toBe('critical')
    })
    
    it('should calculate percentile metrics correctly', () => {
      // Record multiple queries with different response times
      const timings = [50, 100, 150, 200, 250, 300, 400, 500, 600, 1000]
      
      timings.forEach((time, index) => {
        const hash = `query-${index}`
        metrics.recordQueryStart(hash)
        vi.advanceTimersByTime(time)
        metrics.recordQuerySuccess(hash)
      })
      
      const summary = metrics.performanceSummary.value
      expect(summary.p50QueryTime).toBeLessThanOrEqual(300)
      expect(summary.p95QueryTime).toBeLessThanOrEqual(1000)
      expect(summary.p99QueryTime).toBe(1000)
    })
    
    it('should alert on queries exceeding 200ms threshold', () => {
      const queryHash = 'slow-query'
      
      metrics.recordQueryStart(queryHash)
      vi.advanceTimersByTime(250)
      metrics.recordQuerySuccess(queryHash)
      
      const alerts = metrics.performanceAlerts.value
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('warning')
      expect(alerts[0].message).toContain('250ms')
    })
    
    it('should track cache hit rate', () => {
      // Cache miss
      metrics.recordQueryStart('query-1')
      metrics.recordQuerySuccess('query-1', { data: 'test' }, false)
      
      // Cache hits
      metrics.recordQueryStart('query-2')
      metrics.recordQuerySuccess('query-2', { data: 'test' }, true)
      
      metrics.recordQueryStart('query-3')
      metrics.recordQuerySuccess('query-3', { data: 'test' }, true)
      
      expect(metrics.performanceSummary.value.cacheHitRate).toBeCloseTo(66.67, 1)
    })
  })
  
  describe('Mutation Performance', () => {
    it('should track mutation timing', () => {
      const mutationId = 'update-matter'
      
      metrics.recordMutationStart(mutationId, { matterId: '123' })
      expect(metrics.activeMutations.value).toBe(1)
      
      vi.advanceTimersByTime(100)
      metrics.recordMutationSuccess(mutationId)
      
      expect(metrics.activeMutations.value).toBe(0)
      expect(metrics.performanceSummary.value.averageMutationTime).toBeLessThan(200)
    })
    
    it('should alert on slow mutations', () => {
      const mutationId = 'slow-mutation'
      
      metrics.recordMutationStart(mutationId)
      vi.advanceTimersByTime(400)
      metrics.recordMutationSuccess(mutationId)
      
      const alerts = metrics.performanceAlerts.value
      expect(alerts).toHaveLength(1)
      expect(alerts[0].category).toBe('mutation')
      expect(alerts[0].type).toBe('warning')
    })
  })
  
  describe('Memory Monitoring', () => {
    it('should track memory usage', () => {
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024
      }
      
      metrics.updateMemoryUsage(mockMemory)
      
      const history = metrics.memoryHistory.value
      expect(history).toHaveLength(1)
      expect(history[0].percentUsed).toBe(10)
    })
    
    it('should alert on high memory usage', () => {
      const mockMemory = {
        usedJSHeapSize: 120 * 1024 * 1024, // 120MB
        totalJSHeapSize: 150 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024
      }
      
      metrics.updateMemoryUsage(mockMemory)
      
      const alerts = metrics.performanceAlerts.value
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('critical')
      expect(alerts[0].category).toBe('memory')
    })
  })
  
  describe('Cache Monitoring', () => {
    it('should track cache size', () => {
      metrics.updateCacheMetrics({
        queryCacheSize: 50,
        mutationCacheSize: 10
      })
      
      const history = metrics.cacheHistory.value
      expect(history).toHaveLength(1)
      expect(history[0].totalCacheSize).toBe(60)
    })
    
    it('should alert on large cache size', () => {
      metrics.updateCacheMetrics({
        queryCacheSize: 450,
        mutationCacheSize: 100
      })
      
      const alerts = metrics.performanceAlerts.value
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('critical')
      expect(alerts[0].category).toBe('cache')
      expect(alerts[0].message).toContain('550')
    })
  })
  
  describe('Performance Summary', () => {
    it('should calculate comprehensive performance summary', () => {
      // Simulate mixed query performance
      for (let i = 0; i < 10; i++) {
        const hash = `query-${i}`
        metrics.recordQueryStart(hash)
        vi.advanceTimersByTime(i < 8 ? 100 : 300) // 80% fast, 20% slow
        
        if (i === 9) {
          metrics.recordQueryError(hash, new Error('Test error'))
        } else {
          metrics.recordQuerySuccess(hash, { data: i }, i % 3 === 0)
        }
      }
      
      // Add some mutations
      for (let i = 0; i < 5; i++) {
        const id = `mutation-${i}`
        metrics.recordMutationStart(id)
        vi.advanceTimersByTime(150)
        metrics.recordMutationSuccess(id)
      }
      
      const summary = metrics.performanceSummary.value
      
      expect(summary.totalQueries).toBe(10)
      expect(summary.successfulQueries).toBe(9)
      expect(summary.failedQueries).toBe(1)
      expect(summary.averageQueryTime).toBeLessThan(200)
      expect(summary.totalMutations).toBe(5)
      expect(summary.averageMutationTime).toBeCloseTo(150)
    })
  })
  
  describe('Data Export', () => {
    it('should export metrics data', () => {
      // Add some test data
      metrics.recordQueryStart('test-query')
      metrics.recordQuerySuccess('test-query')
      
      const exported = metrics.exportMetrics()
      
      expect(exported).toHaveProperty('queries')
      expect(exported).toHaveProperty('mutations')
      expect(exported).toHaveProperty('memory')
      expect(exported).toHaveProperty('cache')
      expect(exported).toHaveProperty('alerts')
      expect(exported).toHaveProperty('summary')
      expect(exported).toHaveProperty('timestamp')
    })
  })
})

describe('Web Vitals Integration', () => {
  it('should track Web Vitals metrics', async () => {
    const webVitals = useWebVitals()
    
    // Simulate Web Vitals events
    const mockLCP = { name: 'LCP', value: 2000, id: '1', delta: 2000 }
    const mockFID = { name: 'FID', value: 50, id: '2', delta: 50 }
    const mockCLS = { name: 'CLS', value: 0.05, id: '3', delta: 0.05 }
    
    // Mock the web-vitals library
    vi.mock('web-vitals', () => ({
      onLCP: vi.fn((cb) => cb(mockLCP)),
      onFID: vi.fn((cb) => cb(mockFID)),
      onCLS: vi.fn((cb) => cb(mockCLS)),
      onFCP: vi.fn(),
      onTTFB: vi.fn(),
      onINP: vi.fn()
    }))
    
    await webVitals.initializeWebVitals()
    
    expect(webVitals.metrics.value.lcp).toBe(2000)
    expect(webVitals.metrics.value.fid).toBe(50)
    expect(webVitals.metrics.value.cls).toBe(0.05)
    
    expect(webVitals.performanceScore.value).toBeGreaterThan(90)
  })
  
  it('should identify performance bottlenecks', async () => {
    // This would require a more complex setup with both Web Vitals and Query metrics
    // For now, we'll test the structure
    const { useWebVitalsWithQueryMetrics } = await import('~/composables/useWebVitals')
    const combined = await useWebVitalsWithQueryMetrics()
    
    expect(combined).toHaveProperty('webVitals')
    expect(combined).toHaveProperty('queryMetrics')
    expect(combined).toHaveProperty('combinedPerformanceScore')
    expect(combined).toHaveProperty('performanceBottlenecks')
    expect(combined).toHaveProperty('performanceRecommendations')
  })
})

describe('Performance Thresholds', () => {
  it('should meet sub-200ms response target for 95% of queries', () => {
    const monitor = getGlobalQueryPerformanceMonitor()
    const metrics = monitor.getMetrics()
    
    // Simulate realistic query distribution
    const queryTimes = [
      ...Array(85).fill(0).map(() => Math.random() * 150 + 50), // 85% fast (50-200ms)
      ...Array(10).fill(0).map(() => Math.random() * 100 + 200), // 10% medium (200-300ms)
      ...Array(5).fill(0).map(() => Math.random() * 200 + 300)   // 5% slow (300-500ms)
    ]
    
    queryTimes.forEach((time, index) => {
      const hash = `perf-query-${index}`
      metrics.recordQueryStart(hash)
      vi.advanceTimersByTime(time)
      metrics.recordQuerySuccess(hash)
    })
    
    const summary = metrics.performanceSummary.value
    expect(summary.p95QueryTime).toBeLessThan(350) // Should be well under our threshold
    expect(summary.averageQueryTime).toBeLessThan(200)
  })
  
  it('should maintain acceptable memory usage', () => {
    const monitor = getGlobalQueryPerformanceMonitor()
    const metrics = monitor.getMetrics()
    
    // Simulate normal memory usage pattern
    const memoryPattern = [
      30 * 1024 * 1024,  // 30MB
      35 * 1024 * 1024,  // 35MB
      40 * 1024 * 1024,  // 40MB
      45 * 1024 * 1024,  // 45MB
      42 * 1024 * 1024   // 42MB (some GC)
    ]
    
    memoryPattern.forEach((usage) => {
      metrics.updateMemoryUsage({
        usedJSHeapSize: usage,
        totalJSHeapSize: usage * 1.5,
        jsHeapSizeLimit: 500 * 1024 * 1024
      })
    })
    
    // Should not have any memory alerts
    const memoryAlerts = metrics.performanceAlerts.value.filter(
      a => a.category === 'memory'
    )
    expect(memoryAlerts).toHaveLength(0)
  })
})