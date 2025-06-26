# Performance Optimization Guide

This guide covers performance optimization strategies for the Aster Management Nuxt.js application.

## Core Web Vitals

### Understanding Core Web Vitals

1. **Largest Contentful Paint (LCP)** - Loading performance
   - Target: < 2.5 seconds
   - Measures largest content element render time

2. **First Input Delay (FID)** - Interactivity
   - Target: < 100 milliseconds
   - Time from first user interaction to browser response

3. **Cumulative Layout Shift (CLS)** - Visual stability
   - Target: < 0.1
   - Measures unexpected layout shifts

4. **Interaction to Next Paint (INP)** - Responsiveness
   - Target: < 200 milliseconds
   - Overall page responsiveness to user interactions

### Monitoring Core Web Vitals

```typescript
// composables/useWebVitals.ts
export const useWebVitals = () => {
  const vitals = ref({
    lcp: 0,
    fid: 0,
    cls: 0,
    inp: 0
  })

  const reportVital = (metric: any) => {
    vitals.value[metric.name.toLowerCase()] = metric.value
    
    // Send to analytics
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true
    })
  }

  onMounted(() => {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportVital)
      onFID(reportVital)
      onLCP(reportVital)
      onINP(reportVital)
    })
  })

  return { vitals }
}
```

## Bundle Optimization

### Code Splitting

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    payloadExtraction: false // Reduce initial bundle size
  },
  
  nitro: {
    rollupConfig: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack')) return 'tanstack'
            if (id.includes('vue')) return 'vue'
            if (id.includes('radix-vue')) return 'radix'
            return 'vendor'
          }
          
          // Feature chunks
          if (id.includes('/components/kanban/')) return 'kanban'
          if (id.includes('/components/forms/')) return 'forms'
          if (id.includes('/components/charts/')) return 'charts'
        }
      }
    }
  }
})
```

### Lazy Loading Components

```vue
<script setup>
// Lazy load heavy components
const KanbanBoard = defineAsyncComponent({
  loader: () => import('~/components/kanban/KanbanBoard.vue'),
  loadingComponent: () => h('div', 'Loading kanban board...'),
  errorComponent: () => h('div', 'Failed to load kanban board'),
  delay: 200,
  timeout: 10000
})

// Conditional lazy loading
const showAnalytics = ref(false)
const AnalyticsChart = computed(() => {
  return showAnalytics.value 
    ? defineAsyncComponent(() => import('~/components/charts/AnalyticsChart.vue'))
    : null
})
</script>

<template>
  <div>
    <Suspense>
      <KanbanBoard />
      <template #fallback>
        <KanbanSkeleton />
      </template>
    </Suspense>
    
    <button @click="showAnalytics = true">Show Analytics</button>
    <component :is="AnalyticsChart" v-if="AnalyticsChart" />
  </div>
</template>
```

### Bundle Analysis

```bash
# Analyze bundle size
bun run build --analyze

# Generate bundle report
bun run nuxi analyze

# Webpack bundle analyzer
npx webpack-bundle-analyzer .nuxt/dist/client
```

## Image Optimization

### Nuxt Image Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],
  
  image: {
    // Optimize images
    quality: 80,
    format: ['webp', 'avif'],
    
    // Responsive images
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    
    // CDN configuration
    cloudinary: {
      baseURL: 'https://res.cloudinary.com/your-cloud/image/fetch'
    }
  }
})
```

### Optimized Image Component

```vue
<script setup>
interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
}

const props = defineProps<Props>()

// Generate responsive sizes
const sizes = computed(() => {
  return 'xs:100vw sm:50vw md:33vw lg:25vw'
})
</script>

<template>
  <NuxtImg
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="sizes"
    :loading="priority ? 'eager' : 'lazy'"
    :preload="priority"
    format="webp"
    quality="80"
    placeholder="/placeholder.svg"
    class="object-cover"
  />
</template>
```

## Caching Strategies

### HTTP Caching

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Homepage pre-rendered at build time
    '/': { prerender: true },
    
    // Static pages cached for 1 hour
    '/about': { headers: { 'cache-control': 's-maxage=3600' } },
    
    // Dynamic pages cached for 5 minutes
    '/matters/**': { headers: { 'cache-control': 's-maxage=300' } },
    
    // API routes with proper caching
    '/api/**': { cors: true, headers: { 'cache-control': 's-maxage=60' } }
  }
})
```

### Browser Caching

```typescript
// composables/useCache.ts
export const useCache = <T>(key: string, fetcher: () => Promise<T>, ttl = 5 * 60 * 1000) => {
  const cache = new Map<string, { data: T; timestamp: number }>()
  
  const get = async (): Promise<T> => {
    const cached = cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data
    }
    
    const data = await fetcher()
    cache.set(key, { data, timestamp: Date.now() })
    
    return data
  }
  
  const invalidate = () => {
    cache.delete(key)
  }
  
  const clear = () => {
    cache.clear()
  }
  
  return { get, invalidate, clear }
}
```

### Service Worker Caching

```typescript
// public/sw.js
const CACHE_NAME = 'aster-v1'
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/_nuxt/entry.js',
  '/_nuxt/styles.css'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
  )
})

self.addEventListener('fetch', (event) => {
  // Cache first for static assets
  if (event.request.url.includes('/_nuxt/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    )
    return
  }
  
  // Network first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
  }
})
```

## Runtime Performance

### Vue Performance Optimization

```vue
<script setup>
// Use v-memo for expensive list items
const matters = ref([])
const searchQuery = ref('')

// Memoize expensive computations
const filteredMatters = computed(() => {
  return useMemo(() => {
    return matters.value
      .filter(matter => 
        matter.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [matters.value, searchQuery.value])
})

// Virtual scrolling for large lists
const { list, containerProps, wrapperProps } = useVirtualList(
  filteredMatters,
  {
    itemHeight: 120,
    overscan: 10
  }
)
</script>

<template>
  <div>
    <!-- Virtual scrolling container -->
    <div v-bind="containerProps" class="h-96 overflow-auto">
      <div v-bind="wrapperProps">
        <div
          v-for="{ data, index } in list"
          :key="data.id"
          v-memo="[data.id, data.updatedAt, data.status]"
          class="matter-item"
        >
          <MatterCard :matter="data" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>
```

### Memory Management

```typescript
// composables/useMemoryOptimization.ts
export const useMemoryOptimization = () => {
  const observers = new Set<IntersectionObserver | ResizeObserver>()
  const timers = new Set<number>()
  const subscriptions = new Set<() => void>()
  
  const addObserver = (observer: IntersectionObserver | ResizeObserver) => {
    observers.add(observer)
  }
  
  const addTimer = (timer: number) => {
    timers.add(timer)
  }
  
  const addSubscription = (unsubscribe: () => void) => {
    subscriptions.add(unsubscribe)
  }
  
  const cleanup = () => {
    // Clear observers
    observers.forEach(observer => observer.disconnect())
    observers.clear()
    
    // Clear timers
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
    
    // Clear subscriptions
    subscriptions.forEach(unsubscribe => unsubscribe())
    subscriptions.clear()
  }
  
  onUnmounted(cleanup)
  
  return {
    addObserver,
    addTimer,
    addSubscription,
    cleanup
  }
}
```

## Database Performance

### Query Optimization

```typescript
// composables/useOptimizedQueries.ts
export const useOptimizedQueries = () => {
  // Batch queries to reduce round trips
  const batchQueries = async (queries: Array<() => Promise<any>>) => {
    return Promise.all(queries.map(query => query()))
  }
  
  // Pagination with cursor-based approach
  const usePaginatedQuery = (endpoint: string, pageSize = 20) => {
    return useInfiniteQuery({
      queryKey: [endpoint],
      queryFn: ({ pageParam }) => 
        $fetch(endpoint, {
          query: {
            cursor: pageParam,
            limit: pageSize
          }
        }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined
    })
  }
  
  // Debounced search to reduce API calls
  const useDebouncedSearch = (searchFn: (query: string) => Promise<any>) => {
    const searchQuery = ref('')
    const debouncedQuery = refDebounced(searchQuery, 300)
    
    return useQuery({
      queryKey: ['search', debouncedQuery],
      queryFn: () => searchFn(debouncedQuery.value),
      enabled: computed(() => debouncedQuery.value.length >= 2)
    })
  }
  
  return {
    batchQueries,
    usePaginatedQuery,
    useDebouncedSearch
  }
}
```

## Performance Monitoring

### Real User Monitoring (RUM)

```typescript
// plugins/performance-monitoring.client.ts
export default defineNuxtPlugin(() => {
  if (process.client) {
    // Monitor long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('Long task detected:', entry.duration, 'ms')
          
          // Report to analytics
          gtag('event', 'performance_issue', {
            event_category: 'Performance',
            event_label: 'Long Task',
            value: entry.duration
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['longtask'] })
    
    // Monitor memory usage
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = performance.memory
        const usage = memory.usedJSHeapSize / memory.totalJSHeapSize
        
        if (usage > 0.9) {
          console.warn('High memory usage:', usage * 100, '%')
        }
      }
    }
    
    setInterval(checkMemoryUsage, 30000)
  }
})
```

### Performance Budgets

```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Resource hints
        'uses-rel-preload': 'warn',
        'uses-rel-preconnect': 'warn',
        
        // Bundle size
        'total-byte-weight': ['warn', { maxNumericValue: 1600000 }],
        'unused-javascript': ['warn', { maxNumericValue: 40000 }]
      }
    }
  }
}
```

## Performance Testing

### Load Testing with k6

```javascript
// k6/performance-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

export const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.02'],
    errors: ['rate<0.1']
  }
}

export default function () {
  // Test critical user journeys
  const scenarios = [
    () => testMattersList(),
    () => testMatterCreation(),
    () => testKanbanBoard(),
    () => testSearch()
  ]
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  scenario()
  
  sleep(1)
}

function testMattersList() {
  const response = http.get('https://aster.example.com/api/matters')
  
  check(response, {
    'matters list status is 200': (r) => r.status === 200,
    'matters list response time < 500ms': (r) => r.timings.duration < 500,
    'matters list has data': (r) => JSON.parse(r.body).length > 0
  })
  
  errorRate.add(response.status !== 200)
}
```

## Performance Best Practices

### 1. Optimize Critical Rendering Path

```vue
<!-- Prioritize above-the-fold content -->
<template>
  <div>
    <!-- Critical content loaded immediately -->
    <header class="header">
      <Navigation />
    </header>
    
    <!-- Hero section with optimized images -->
    <section class="hero">
      <NuxtImg
        src="/hero-image.jpg"
        alt="Hero image"
        width="1920"
        height="1080"
        priority
        format="webp"
      />
    </section>
    
    <!-- Non-critical content lazy loaded -->
    <LazyFooter />
  </div>
</template>
```

### 2. Reduce JavaScript Bundle Size

```typescript
// Use tree shaking
import { debounce } from 'lodash-es' // ✅ Tree-shakeable
// import _ from 'lodash' // ❌ Imports entire library

// Dynamic imports for large dependencies
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js')
  return Chart
}
```

### 3. Optimize Fonts

```vue
<template>
  <Head>
    <!-- Preload critical fonts -->
    <link
      rel="preload"
      href="/fonts/inter-var.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
    
    <!-- Font display swap for better FCP -->
    <style>
      @font-face {
        font-family: 'Inter';
        src: url('/fonts/inter-var.woff2') format('woff2');
        font-display: swap;
      }
    </style>
  </Head>
</template>
```

### 4. Implement Proper Loading States

```vue
<script setup>
const { data, pending, error } = await useLazyFetch('/api/matters')
</script>

<template>
  <div>
    <!-- Skeleton loader instead of spinner -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      Failed to load matters
    </div>
    
    <!-- Content -->
    <div v-else>
      <MatterList :matters="data" />
    </div>
  </div>
</template>
```

### 5. Monitor and Iterate

- Use Lighthouse CI in your deployment pipeline
- Monitor Core Web Vitals in production
- Set up performance budgets
- Regular performance audits
- A/B test performance improvements