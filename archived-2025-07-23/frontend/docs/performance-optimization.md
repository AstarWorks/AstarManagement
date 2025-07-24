# Performance Optimization Guide

Comprehensive guide for optimizing the Aster Management Nuxt.js application performance.

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **INP (Interaction to Next Paint)**: < 200ms

### Application-Specific Metrics
- **Kanban Board Load**: < 1s
- **Drag-Drop Latency**: < 50ms
- **Form Validation**: < 100ms
- **Search Results**: < 500ms

## Optimization Strategies

### 1. Bundle Size Optimization

#### Code Splitting
```typescript
// Route-based splitting (automatic in Nuxt)
// pages/matters/[id].vue - only loaded when needed

// Component-based splitting
const HeavyComponent = defineAsyncComponent(() => 
  import('~/components/reports/DetailedReport.vue')
)
```

#### Tree Shaking
```typescript
// ❌ Bad - imports entire library
import * as utils from 'lodash-es'

// ✅ Good - imports only what's needed
import { debounce, throttle } from 'lodash-es'
```

#### Dynamic Imports
```vue
<script setup>
// Lazy load heavy components
const showChart = ref(false)
const ChartComponent = defineAsyncComponent(() =>
  import('~/components/analytics/PerformanceChart.vue')
)
</script>

<template>
  <button @click="showChart = true">Show Analytics</button>
  <ChartComponent v-if="showChart" />
</template>
```

### 2. Rendering Optimization

#### Virtual Scrolling for Large Lists
```vue
<script setup>
import { VirtualList } from '@tanstack/vue-virtual'

const matters = ref<Matter[]>([]) // 1000+ items
const rowVirtualizer = useVirtualizer({
  count: matters.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 100,
  overscan: 5
})
</script>

<template>
  <div ref="parentRef" class="h-[600px] overflow-auto">
    <div :style="{ height: `${rowVirtualizer.getTotalSize()}px` }">
      <div
        v-for="virtualRow in rowVirtualizer.getVirtualItems()"
        :key="virtualRow.index"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`
        }"
      >
        <MatterCard :matter="matters[virtualRow.index]" />
      </div>
    </div>
  </div>
</template>
```

#### Optimize Re-renders
```vue
<script setup>
// Use shallowRef for large objects that don't need deep reactivity
const largeDataSet = shallowRef<Matter[]>([])

// Use computed for derived state
const filteredMatters = computed(() => 
  largeDataSet.value.filter(m => m.status === 'active')
)

// Memoize expensive calculations
const expensiveStats = computed(() => {
  return useMemo(() => calculateComplexStats(matters.value))
})
</script>
```

### 3. Network Optimization

#### API Response Caching
```typescript
// composables/useMattersQuery.ts
export const useMattersQuery = () => {
  return useQuery({
    queryKey: ['matters'],
    queryFn: fetchMatters,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })
}
```

#### Prefetching Critical Data
```vue
<script setup>
// Prefetch data for likely navigation
const queryClient = useQueryClient()

const prefetchMatterDetails = (matterId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['matter', matterId],
    queryFn: () => fetchMatter(matterId),
    staleTime: 5 * 60 * 1000
  })
}
</script>

<template>
  <MatterCard 
    v-for="matter in matters"
    :key="matter.id"
    :matter="matter"
    @mouseenter="prefetchMatterDetails(matter.id)"
  />
</template>
```

#### Request Batching
```typescript
// utils/batchRequests.ts
const batchedFetch = useBatchFn(
  async (ids: string[]) => {
    const response = await $fetch('/api/matters/batch', {
      method: 'POST',
      body: { ids }
    })
    return response
  },
  {
    wait: 10, // Wait 10ms to batch requests
    maxWait: 50 // Maximum 50ms wait
  }
)
```

### 4. Image Optimization

#### Lazy Loading
```vue
<template>
  <NuxtImg
    src="/images/matter-hero.jpg"
    alt="Matter details"
    loading="lazy"
    :width="800"
    :height="400"
    sizes="(max-width: 768px) 100vw, 800px"
    format="webp"
  />
</template>
```

#### Responsive Images
```vue
<template>
  <picture>
    <source
      media="(max-width: 768px)"
      srcset="/images/hero-mobile.webp"
      type="image/webp"
    >
    <source
      media="(min-width: 769px)"
      srcset="/images/hero-desktop.webp"
      type="image/webp"
    >
    <img
      src="/images/hero-fallback.jpg"
      alt="Legal case management"
      loading="lazy"
    >
  </picture>
</template>
```

### 5. JavaScript Optimization

#### Debouncing and Throttling
```typescript
// composables/useSearch.ts
export const useSearch = () => {
  const searchQuery = ref('')
  const results = ref<Matter[]>([])
  
  // Debounce search input
  const debouncedSearch = useDebounceFn(async (query: string) => {
    if (query.length < 2) return
    
    const data = await $fetch('/api/matters/search', {
      query: { q: query }
    })
    results.value = data
  }, 300)
  
  // Throttle scroll events
  const handleScroll = useThrottleFn(() => {
    // Handle scroll logic
  }, 100)
  
  return {
    searchQuery,
    results,
    search: debouncedSearch,
    handleScroll
  }
}
```

#### Web Workers for Heavy Computation
```typescript
// workers/dataProcessor.ts
self.addEventListener('message', (event) => {
  const { data, type } = event.data
  
  switch (type) {
    case 'PROCESS_MATTERS':
      const processed = processLargeDataSet(data)
      self.postMessage({ type: 'PROCESSED', data: processed })
      break
  }
})

// composables/useDataProcessor.ts
export const useDataProcessor = () => {
  const worker = new Worker('/workers/dataProcessor.js')
  
  const processInBackground = (data: Matter[]) => {
    return new Promise((resolve) => {
      worker.postMessage({ type: 'PROCESS_MATTERS', data })
      worker.onmessage = (e) => {
        if (e.data.type === 'PROCESSED') {
          resolve(e.data.data)
        }
      }
    })
  }
  
  return { processInBackground }
}
```

### 6. CSS Optimization

#### Critical CSS Inlining
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    inlineSSRStyles: true
  },
  
  hooks: {
    'build:manifest': (manifest) => {
      // Extract critical CSS for above-the-fold content
      manifest.css = manifest.css.filter(file => 
        file.includes('critical') || file.includes('above-fold')
      )
    }
  }
})
```

#### Reduce CSS Specificity
```css
/* ❌ Bad - high specificity */
.kanban-board .column .card .header .title {
  color: #333;
}

/* ✅ Good - low specificity with utility classes */
.card-title {
  @apply text-gray-700;
}
```

### 7. Memory Management

#### Component Cleanup
```vue
<script setup>
const abortController = new AbortController()
const intervalId = ref<number>()

// Setup
onMounted(() => {
  // Add event listeners with cleanup
  window.addEventListener('resize', handleResize, { 
    signal: abortController.signal 
  })
  
  // Setup intervals
  intervalId.value = setInterval(updateData, 5000)
})

// Cleanup
onUnmounted(() => {
  // Abort all listeners
  abortController.abort()
  
  // Clear intervals
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
  
  // Clear any pending requests
  queryClient.cancelQueries(['matters'])
})
</script>
```

#### Prevent Memory Leaks
```typescript
// stores/kanban.ts
export const useKanbanStore = defineStore('kanban', () => {
  const matters = ref<Matter[]>([])
  const maxCacheSize = 1000
  
  // Limit store size
  const addMatter = (matter: Matter) => {
    matters.value.push(matter)
    
    // Prevent unbounded growth
    if (matters.value.length > maxCacheSize) {
      matters.value = matters.value.slice(-maxCacheSize)
    }
  }
  
  // Clear old data periodically
  const clearOldData = () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    matters.value = matters.value.filter(m => 
      m.lastUpdated > oneHourAgo
    )
  }
  
  return { matters, addMatter, clearOldData }
})
```

### 8. Server-Side Optimization

#### SSR Caching
```typescript
// server/api/matters.get.ts
export default defineCachedEventHandler(async (event) => {
  const matters = await fetchMattersFromDB()
  
  return matters
}, {
  maxAge: 60 * 5, // Cache for 5 minutes
  name: 'matters-list',
  getKey: (event) => `matters:${event.node.req.url}`
})
```

#### Edge Caching with Headers
```typescript
// nitro.config.ts
export default defineNitroConfig({
  routeRules: {
    '/api/matters/**': {
      headers: {
        'cache-control': 'public, max-age=300, stale-while-revalidate=600',
        'cdn-cache-control': 'public, max-age=3600'
      }
    }
  }
})
```

### 9. Monitoring and Profiling

#### Performance Marks
```typescript
// utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  performance.mark(`${name}-start`)
  
  try {
    fn()
  } finally {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name)[0]
    console.log(`${name} took ${measure.duration}ms`)
  }
}

// Usage
measurePerformance('kanban-render', () => {
  renderKanbanBoard()
})
```

#### Real User Monitoring
```typescript
// plugins/rum.client.ts
export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'production') {
    // Send metrics to analytics
    onCLS((metric) => sendToAnalytics('CLS', metric))
    onFID((metric) => sendToAnalytics('FID', metric))
    onLCP((metric) => sendToAnalytics('LCP', metric))
    onINP((metric) => sendToAnalytics('INP', metric))
    onTTFB((metric) => sendToAnalytics('TTFB', metric))
  }
})
```

## Performance Checklist

### Before Deploy
- [ ] Run Lighthouse CI tests
- [ ] Check bundle size < 500KB
- [ ] Verify Core Web Vitals pass
- [ ] Test on slow 3G network
- [ ] Profile memory usage
- [ ] Run load tests

### Optimization Priorities
1. **Critical Path**: Optimize what users see first
2. **Interactivity**: Make UI responsive quickly
3. **Perceived Performance**: Show progress indicators
4. **Progressive Enhancement**: Basic functionality first

### Common Pitfalls
- Over-fetching data
- Unnecessary re-renders
- Memory leaks from event listeners
- Blocking main thread
- Large bundle sizes
- Unoptimized images

## Tools and Resources

### Development Tools
- Chrome DevTools Performance tab
- Vue DevTools Profiler
- Lighthouse DevTools
- WebPageTest.org
- Bundle Analyzer

### Monitoring Services
- Google PageSpeed Insights
- GTmetrix
- Calibre
- SpeedCurve

### Further Reading
- [Nuxt Performance Guide](https://nuxt.com/docs/guide/concepts/rendering#performance)
- [Vue.js Performance Tips](https://vuejs.org/guide/best-practices/performance.html)
- [Web Performance Working Group](https://www.w3.org/webperf/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)