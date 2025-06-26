# Performance Optimization Guide - TanStack Query & Web Vitals

## Overview

This guide documents the comprehensive performance optimization system implemented for Aster Management's legal case management platform. The system combines TanStack Query DevTools, custom performance monitoring, and Web Vitals tracking to achieve sub-200ms response targets.

## Architecture

### 1. TanStack Query DevTools Integration

Enhanced DevTools with custom panels for legal domain-specific monitoring:

```typescript
// Automatic initialization in development
// src/plugins/vue-query-devtools.client.ts
```

**Custom Panels:**
- **Performance Panel**: Real-time query metrics, timing distribution, memory usage
- **Network Monitor**: Request tracking, response times, error rates
- **Legal Errors Panel**: Domain-specific error categorization and resolution guidance

### 2. Performance Monitoring System

#### Core Metrics Tracked

```typescript
interface PerformanceMetrics {
  // Query Performance
  averageQueryTime: number      // Target: <200ms
  p50QueryTime: number          // Median response time
  p95QueryTime: number          // 95th percentile
  p99QueryTime: number          // 99th percentile
  cacheHitRate: number          // Target: >70%
  
  // System Health
  activeQueries: number         // Concurrent queries
  activeMutations: number       // Concurrent mutations
  memoryUsage: number           // JavaScript heap size (MB)
  
  // Error Tracking
  failedQueries: number         // Failed query count
  failedMutations: number       // Failed mutation count
}
```

#### Usage Example

```vue
<script setup lang="ts">
import { getGlobalQueryPerformanceMonitor } from '~/composables/useQueryPerformanceMonitor'

const monitor = getGlobalQueryPerformanceMonitor()
const metrics = monitor.getMetrics()

// Access real-time metrics
const avgResponseTime = computed(() => metrics.performanceSummary.value.averageQueryTime)
const cacheHitRate = computed(() => metrics.performanceSummary.value.cacheHitRate)
</script>
```

### 3. Web Vitals Integration

Tracks Core Web Vitals alongside query performance:

```typescript
// Automatic tracking in production
// src/plugins/web-vitals.client.ts

interface WebVitalsMetrics {
  lcp: number   // Largest Contentful Paint (Target: <2.5s)
  fid: number   // First Input Delay (Target: <100ms)
  cls: number   // Cumulative Layout Shift (Target: <0.1)
  fcp: number   // First Contentful Paint
  ttfb: number  // Time to First Byte
  inp: number   // Interaction to Next Paint
}
```

## Performance Optimization Strategies

### 1. Query Optimization

#### Stale Time Configuration
```typescript
// src/config/tanstack-query.ts
export const CACHE_TIMES = {
  STATIC: 30 * 60 * 1000,      // 30 minutes for reference data
  MATTERS: 5 * 60 * 1000,      // 5 minutes for case data
  REALTIME: 1 * 60 * 1000,     // 1 minute for notifications
  SEARCH: 2 * 60 * 1000        // 2 minutes for search results
}
```

#### Query Prefetching
```typescript
// Prefetch matter details on hover
const prefetchMatter = (matterId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['matters', matterId],
    queryFn: () => fetchMatterDetails(matterId),
    staleTime: CACHE_TIMES.MATTERS
  })
}
```

#### Optimistic Updates
```typescript
// Instant UI updates for drag-and-drop
const updateMatterStatus = useMutation({
  mutationFn: updateStatus,
  onMutate: async (variables) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(['matters'])
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['matters'])
    
    // Optimistically update
    queryClient.setQueryData(['matters'], (old) => {
      // Update logic
    })
    
    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['matters'], context.previous)
  }
})
```

### 2. Bundle Optimization

#### Code Splitting
```typescript
// DevTools lazy loading
const [{ VueQueryDevtools }, { getGlobalQueryPerformanceMonitor }] = await Promise.all([
  import('@tanstack/vue-query-devtools'),
  import('~/composables/useQueryPerformanceMonitor')
])
```

#### Component Lazy Loading
```typescript
// Custom DevTools panels
customPanels: [
  {
    id: 'performance',
    component: defineAsyncComponent(() => import('~/components/devtools/QueryPerformancePanel.vue'))
  }
]
```

### 3. Memory Management

#### Query Garbage Collection
```typescript
export const GC_TIMES = {
  STATIC: CACHE_TIMES.STATIC * 2,     // Keep static data longer
  MATTERS: CACHE_TIMES.MATTERS * 2,   // Standard GC for dynamic data
  REALTIME: CACHE_TIMES.REALTIME * 2  // Quick cleanup for real-time data
}
```

#### Memory Monitoring
```typescript
// Automatic memory tracking and alerts
if ('performance' in window && 'memory' in performance) {
  setInterval(() => {
    const memory = performance.memory
    metrics.updateMemoryUsage({
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    })
  }, 5000)
}
```

## Performance Dashboard

### Embedded Dashboard Component

Add the performance dashboard to your layout:

```vue
<template>
  <div>
    <!-- Your app content -->
    
    <!-- Performance Dashboard (dev/staging only) -->
    <PerformanceMetricsDashboard 
      v-if="isDevelopment"
      @show-details="showDetailedMetrics" 
    />
  </div>
</template>

<script setup>
import PerformanceMetricsDashboard from '~/components/PerformanceMetricsDashboard.vue'

const isDevelopment = process.env.NODE_ENV === 'development'
</script>
```

### Dashboard Features
- Real-time performance score (0-100)
- Query rate visualization
- Latency trend tracking
- Memory usage monitoring
- Performance alerts
- One-click metrics export

## Performance Targets & Thresholds

### Query Performance
- **Average Response Time**: <200ms ✅
- **P95 Response Time**: <500ms ⚠️
- **P99 Response Time**: <1000ms 🚨
- **Cache Hit Rate**: >70% ✅

### Web Vitals
- **LCP (Largest Contentful Paint)**: <2.5s (Good), <4s (Needs Improvement)
- **FID (First Input Delay)**: <100ms (Good), <300ms (Needs Improvement)
- **CLS (Cumulative Layout Shift)**: <0.1 (Good), <0.25 (Needs Improvement)

### System Resources
- **Memory Usage**: <50MB (Good), <100MB (Warning), >100MB (Critical)
- **Cache Size**: <100 entries (Good), <500 entries (Warning), >500 entries (Critical)
- **Active Queries**: <10 concurrent

## Testing Performance

### Unit Tests
```bash
# Run performance tests
bun test src/test/performance/query-performance.test.ts
```

### E2E Performance Tests
```typescript
// playwright.config.ts
use: {
  // Enable performance tracking
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
  // Capture performance metrics
  launchOptions: {
    args: ['--enable-precise-memory-info']
  }
}
```

### Manual Testing
1. Open DevTools (development mode)
2. Navigate to TanStack Query DevTools
3. Check custom panels:
   - Performance tab for query metrics
   - Network tab for request tracking
   - Legal Errors tab for domain errors

## Troubleshooting

### High Response Times
1. Check Network Monitor panel for slow endpoints
2. Review query configuration (stale times, cache settings)
3. Implement query prefetching for predictable navigation
4. Consider request batching for related queries

### High Memory Usage
1. Review cache size in Performance panel
2. Adjust garbage collection times
3. Implement query invalidation for stale data
4. Use virtual scrolling for large lists

### Low Cache Hit Rate
1. Review stale time configuration
2. Implement proper query key factories
3. Use query prefetching strategically
4. Consider longer cache times for static data

## Best Practices

### 1. Query Key Management
```typescript
// Consistent query key factory
export const queryKeys = {
  matters: {
    all: ['matters'] as const,
    lists: () => [...queryKeys.matters.all, 'list'] as const,
    list: (filters: MatterFilters) => [...queryKeys.matters.lists(), filters] as const,
    details: () => [...queryKeys.matters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.matters.details(), id] as const
  }
}
```

### 2. Error Handling
```typescript
// Categorize errors for better debugging
const errorCategories = {
  'LEGAL_VALIDATION': 'Validation Error',
  'MATTER_ACCESS': 'Access Control',
  'DOC_': 'Document Processing',
  'NETWORK_ERROR': 'Network Issue'
}
```

### 3. Performance Monitoring
```typescript
// Track custom metrics
const trackCustomMetric = (name: string, value: number) => {
  performance.measure(name, {
    start: 0,
    duration: value
  })
}
```

## Production Considerations

### 1. Disable DevTools in Production
DevTools are automatically disabled in production builds to reduce bundle size.

### 2. Analytics Integration
```typescript
// Send metrics to analytics service
if (process.env.NUXT_PUBLIC_ANALYTICS_ENDPOINT) {
  navigator.sendBeacon(endpoint, JSON.stringify({
    type: 'performance',
    metrics: exportedMetrics
  }))
}
```

### 3. Performance Budgets
Set up CI/CD checks for:
- Bundle size limits
- Lighthouse score thresholds
- Response time benchmarks

## Future Enhancements

1. **AI-Powered Optimization**
   - Predictive prefetching based on user patterns
   - Automatic cache invalidation strategies
   - Smart query batching

2. **Advanced Monitoring**
   - Real User Monitoring (RUM) integration
   - Custom performance marks for legal workflows
   - Correlation with business metrics

3. **Performance Automation**
   - Automatic performance regression detection
   - Self-healing cache strategies
   - Dynamic optimization based on device capabilities