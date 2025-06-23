---
task_id: T08_S07
sprint_sequence_id: S07
status: ready
complexity: High
last_updated: 2025-06-22T12:00:00Z
---

# Task: Nuxt 3 SSR Optimization for Kanban Dashboard

## Description
Implement comprehensive Server-Side Rendering (SSR) optimization for the Vue 3 Kanban dashboard, focusing on performance, hydration safety, caching strategies, and Core Web Vitals. This task ensures the Kanban board delivers optimal user experience through strategic SSR implementation, efficient data prefetching, and progressive enhancement patterns while maintaining Nuxt 3 best practices for legal case management workflows.

## Goal / Objectives
- Optimize Nuxt 3 SSR performance for Kanban dashboard with sub-200ms TTFB (Time to First Byte)
- Implement hydration-safe patterns preventing layout shifts and content mismatches
- Deploy comprehensive caching strategies using Nuxt 3's built-in capabilities and Redis
- Achieve Core Web Vitals targets: LCP <2.5s, FID <100ms, CLS <0.1
- Establish progressive enhancement for complex interactive features
- Optimize SEO and accessibility for legal case management dashboards
- Implement efficient data prefetching with error handling and fallbacks

## Acceptance Criteria
- [ ] Kanban dashboard achieves TTFB <200ms for initial page load
- [ ] Zero hydration mismatches detected in browser dev tools
- [ ] Core Web Vitals scores meet Google's "Good" thresholds consistently
- [ ] Server-rendered content displays immediately with progressive enhancement
- [ ] Efficient caching strategy reduces database queries by >70%
- [ ] Error boundaries prevent SSR failures from affecting user experience
- [ ] SEO meta tags properly generated for matter status pages
- [ ] Accessibility scores maintain >95% compliance during SSR
- [ ] Performance budget maintained: <100KB initial JS bundle
- [ ] Lighthouse performance score >90 for Kanban dashboard pages

## Subtasks
- [ ] Implement Nuxt 3 SSR-first architecture with strategic client-side hydration
- [ ] Create hydration-safe component patterns for dynamic Kanban data
- [ ] Set up multi-layer caching: Nuxt Cache, Redis, and CDN strategies
- [ ] Optimize critical rendering path with resource hints and preloading
- [ ] Implement progressive enhancement for drag-and-drop and real-time features
- [ ] Add comprehensive error handling for SSR failures and API timeouts
- [ ] Create performance monitoring and Core Web Vitals tracking
- [ ] Optimize bundle splitting and code loading strategies
- [ ] Implement efficient data prefetching with proper error boundaries
- [ ] Add SEO optimization with dynamic meta tags for legal matter status

## Technical Guidance

### Nuxt 3 SSR Architecture Patterns

**SSR-First Component Architecture:**
```vue
<!-- components/kanban/KanbanBoardSSR.vue -->
<script setup lang="ts">
// 1. Server-side data fetching with error handling
const { data: matters, error, pending } = await useFetch('/api/matters', {
  key: 'kanban-matters',
  server: true,
  default: () => [],
  transform: (data: any[]) => data.map(matter => ({
    ...matter,
    // Transform data for client-side compatibility
    createdAt: new Date(matter.createdAt),
    updatedAt: new Date(matter.updatedAt)
  })),
  onRequestError({ request, options, error }) {
    // Handle server-side fetch errors
    console.error('Server fetch error:', error)
  },
  onResponseError({ request, response, options }) {
    // Handle API response errors
    console.error('API response error:', response.status)
  }
})

// 2. Hydration-safe reactive state
const isClient = process.client
const isHydrated = ref(false)

// 3. Progressive enhancement state
const isDragEnabled = ref(false)
const isRealTimeEnabled = ref(false)

// 4. SEO and meta configuration
const route = useRoute()
const title = computed(() => {
  const statusParam = route.query.status as string
  return statusParam 
    ? `${statusParam} Cases - Aster Legal Management`
    : 'Case Management Dashboard - Aster Legal'
})

useSeoMeta({
  title: title.value,
  description: 'Legal case management dashboard with Kanban board visualization',
  ogTitle: title.value,
  ogDescription: 'Manage legal cases efficiently with visual Kanban board',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// 5. Hydration safety measures
onMounted(() => {
  // Mark as hydrated to prevent layout shifts
  isHydrated.value = true
  
  // Progressive enhancement after hydration
  nextTick(() => {
    isDragEnabled.value = true
    isRealTimeEnabled.value = true
  })
})

// 6. Error handling for SSR
const handleSSRError = (error: Error) => {
  console.error('SSR Error:', error)
  // Graceful degradation
  navigateTo('/error?message=dashboard-load-failed')
}

// 7. Performance monitoring
const performanceMetrics = ref({
  ttfb: 0,
  fcp: 0,
  lcp: 0,
  cls: 0
})

onMounted(() => {
  // Track Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS((metric) => { performanceMetrics.value.cls = metric.value })
    getFID((metric) => { /* Track FID */ })
    getFCP((metric) => { performanceMetrics.value.fcp = metric.value })
    getLCP((metric) => { performanceMetrics.value.lcp = metric.value })
    getTTFB((metric) => { performanceMetrics.value.ttfb = metric.value })
  })
})
</script>

<template>
  <div class="kanban-dashboard">
    <!-- Critical above-the-fold content rendered server-side -->
    <header class="dashboard-header">
      <h1>{{ title }}</h1>
      <div class="header-meta">
        <span v-if="matters.length">{{ matters.length }} active cases</span>
        <span v-if="pending" class="loading-indicator" aria-live="polite">
          Loading cases...
        </span>
      </div>
    </header>

    <!-- Error boundary for SSR failures -->
    <ErrorBoundary v-if="error" :error="error" />
    
    <!-- Main dashboard content with progressive enhancement -->
    <main class="dashboard-content">
      <!-- Server-rendered static content -->
      <div class="kanban-board-container">
        <!-- Always render the board structure server-side -->
        <KanbanBoardStatic 
          :matters="matters"
          :columns="columns"
          :show-japanese="showJapanese"
        />
        
        <!-- Progressive enhancement for interactive features -->
        <ClientOnly>
          <KanbanBoardInteractive
            v-if="isHydrated"
            :matters="matters"
            :drag-enabled="isDragEnabled"
            :real-time-enabled="isRealTimeEnabled"
            @matter-move="handleMatterMove"
            @real-time-update="handleRealTimeUpdate"
          />
          
          <!-- Fallback for non-JS environments -->
          <template #fallback>
            <div class="no-js-message">
              <p>Interactive features require JavaScript</p>
              <noscript>
                <p>Please enable JavaScript for full functionality</p>
              </noscript>
            </div>
          </template>
        </ClientOnly>
      </div>
    </main>

    <!-- Performance monitoring (development only) -->
    <div v-if="$dev" class="performance-monitor">
      <details>
        <summary>Performance Metrics</summary>
        <pre>{{ performanceMetrics }}</pre>
      </details>
    </div>
  </div>
</template>

<style scoped>
/* Critical CSS for above-the-fold content */
.kanban-dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.dashboard-content {
  flex: 1;
  overflow: hidden;
}

.kanban-board-container {
  height: 100%;
  position: relative;
}

/* Loading states */
.loading-indicator {
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
}

/* No-JS fallback */
.no-js-message {
  padding: 2rem;
  text-align: center;
  color: hsl(var(--muted-foreground));
}

/* Performance monitor (dev only) */
.performance-monitor {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 0.5rem;
  font-size: 0.75rem;
  z-index: 1000;
}
</style>
```

### Hydration Safety Patterns

**Preventing Hydration Mismatches:**
```vue
<!-- components/kanban/KanbanBoardStatic.vue -->
<script setup lang="ts">
interface Props {
  matters: Matter[]
  columns: KanbanColumn[]
  showJapanese?: boolean
}

const props = defineProps<Props>()

// Server-safe computed properties
const mattersByColumn = computed(() => {
  const groups: Record<string, Matter[]> = {}
  
  props.columns.forEach(column => {
    groups[column.id] = props.matters.filter(matter => 
      column.status.includes(matter.status)
    )
  })
  
  return groups
})

// Hydration-safe date formatting
const formatDate = (date: Date | string) => {
  // Ensure consistent formatting between server and client
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Prevent layout shift during hydration
const isSSR = process.server
</script>

<template>
  <div class="kanban-board-static" :class="{ 'ssr-mode': isSSR }">
    <!-- Static board structure - always server-rendered -->
    <div class="board-columns">
      <div
        v-for="column in columns"
        :key="column.id"
        class="kanban-column"
        :data-column-id="column.id"
      >
        <!-- Column header - server-rendered -->
        <header class="column-header">
          <h3 class="column-title">
            {{ showJapanese ? column.titleJa : column.title }}
          </h3>
          <span class="matter-count">
            {{ mattersByColumn[column.id]?.length || 0 }}
          </span>
        </header>

        <!-- Matter cards - server-rendered for SEO -->
        <div class="matter-list">
          <article
            v-for="matter in mattersByColumn[column.id]"
            :key="matter.id"
            class="matter-card"
            :data-matter-id="matter.id"
          >
            <h4 class="matter-title">{{ matter.title }}</h4>
            <p class="matter-description">{{ matter.description }}</p>
            <div class="matter-meta">
              <time :datetime="matter.updatedAt">
                {{ formatDate(matter.updatedAt) }}
              </time>
              <span class="matter-status">{{ matter.status }}</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles that prevent layout shifts during hydration */
.kanban-board-static {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.board-columns {
  display: flex;
  height: 100%;
  min-width: fit-content;
  gap: 1rem;
  padding: 1rem;
}

.kanban-column {
  flex: 0 0 320px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.column-header {
  padding: 1rem;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.matter-count {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.matter-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.matter-card {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.matter-card:hover {
  box-shadow: 0 2px 8px hsl(var(--border));
}

.matter-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: hsl(var(--foreground));
}

.matter-description {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.matter-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.matter-status {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius);
  font-weight: 500;
}

/* SSR-specific styles to prevent flashing */
.ssr-mode .matter-card {
  /* Disable hover effects during SSR */
  transition: none;
}
</style>
```

### Multi-Layer Caching Strategy

**Nuxt 3 Caching Configuration:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Server-side caching
  nitro: {
    storage: {
      redis: {
        driver: 'redis',
        // Redis configuration for caching
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: 0
      }
    },
    routeRules: {
      // Static pages - cache for 1 hour
      '/': { prerender: true },
      '/about': { prerender: true },
      
      // Dashboard pages - ISR with 5-minute revalidation
      '/dashboard/**': { 
        isr: 300,
        headers: { 'Cache-Control': 's-maxage=300' }
      },
      
      // API routes - cache for 1 minute
      '/api/matters': { 
        cors: true,
        headers: { 'Cache-Control': 'max-age=60' }
      },
      
      // Real-time routes - no cache
      '/api/realtime/**': { 
        cors: true,
        headers: { 'Cache-Control': 'no-cache' }
      }
    }
  },
  
  // Client-side caching
  experimental: {
    payloadExtraction: false, // Reduce payload size
    inlineSSRStyles: false    // Prevent style duplication
  }
})
```

**API Route Caching Implementation:**
```typescript
// server/api/matters/index.get.ts
export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = getUserId(event) // Authentication check
  
  // Cache key includes user context for security
  const cacheKey = `matters:${userId}:${hashQuery(query)}`
  
  try {
    // Check Redis cache first
    const cached = await useStorage('redis').getItem(cacheKey)
    if (cached) {
      setHeader(event, 'X-Cache', 'HIT')
      return cached
    }

    // Fetch from database
    const matters = await db.matter.findMany({
      where: {
        userId: userId,
        ...buildWhereClause(query)
      },
      include: {
        client: true,
        tags: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Transform for client
    const response = {
      matters: matters.map(matter => ({
        id: matter.id,
        title: matter.title,
        description: matter.description,
        status: matter.status,
        clientName: matter.client.name,
        updatedAt: matter.updatedAt.toISOString(),
        tags: matter.tags.map(tag => tag.name)
      })),
      total: matters.length,
      lastUpdated: new Date().toISOString()
    }

    // Cache for 5 minutes
    await useStorage('redis').setItem(cacheKey, response, {
      ttl: 300 // 5 minutes
    })

    setHeader(event, 'X-Cache', 'MISS')
    return response
    
  } catch (error) {
    console.error('API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch matters'
    })
  }
}, {
  // Nuxt built-in caching options
  maxAge: 60, // 1 minute browser cache
  swr: true   // Stale-while-revalidate
})

// Helper functions
function hashQuery(query: Record<string, any>): string {
  return createHash('md5')
    .update(JSON.stringify(query))
    .digest('hex')
}

function buildWhereClause(query: Record<string, any>) {
  const where: any = {}
  
  if (query.status) {
    where.status = query.status
  }
  
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ]
  }
  
  return where
}
```

**Client-Side Caching with useFetch:**
```typescript
// composables/useMatters.ts
export function useMatters(options: {
  status?: string
  search?: string
  autoRefresh?: boolean
} = {}) {
  const { status, search, autoRefresh = false } = options
  
  // Build cache key
  const cacheKey = computed(() => 
    `matters:${status || 'all'}:${search || ''}:${autoRefresh}`
  )

  // Reactive query parameters
  const query = computed(() => ({
    ...(status && { status }),
    ...(search && { search })
  }))

  // Fetch with caching and error handling
  const { data, error, pending, refresh } = useFetch('/api/matters', {
    key: cacheKey.value,
    query: query.value,
    server: true,
    default: () => ({ matters: [], total: 0, lastUpdated: null }),
    
    // Cache configuration
    getCachedData(key) {
      // Custom cache logic for client-side
      return nuxtApp.payload.data[key] || nuxtApp.ssrContext?.payload.data[key]
    },
    
    // Transform response
    transform: (response: any) => ({
      matters: response.matters.map((matter: any) => ({
        ...matter,
        updatedAt: new Date(matter.updatedAt)
      })),
      total: response.total,
      lastUpdated: response.lastUpdated ? new Date(response.lastUpdated) : null
    }),
    
    // Error handling
    onRequestError({ error }) {
      console.error('Request failed:', error)
    },
    
    onResponseError({ response }) {
      console.error('Response error:', response.status, response.statusText)
    }
  })

  // Auto-refresh functionality
  let refreshInterval: NodeJS.Timeout
  
  watchEffect(() => {
    if (autoRefresh && process.client) {
      refreshInterval = setInterval(() => {
        refresh()
      }, 30000) // Refresh every 30 seconds
    }
  })

  onBeforeUnmount(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })

  // Optimistic updates
  const updateMatterOptimistically = (matterId: string, updates: Partial<Matter>) => {
    if (data.value?.matters) {
      const index = data.value.matters.findIndex(m => m.id === matterId)
      if (index !== -1) {
        data.value.matters[index] = { ...data.value.matters[index], ...updates }
      }
    }
  }

  return {
    matters: computed(() => data.value?.matters || []),
    total: computed(() => data.value?.total || 0),
    lastUpdated: computed(() => data.value?.lastUpdated),
    error: readonly(error),
    pending: readonly(pending),
    refresh,
    updateMatterOptimistically
  }
}
```

### Progressive Enhancement Implementation

**Drag-and-Drop Progressive Enhancement:**
```vue
<!-- components/kanban/KanbanBoardInteractive.vue -->
<script setup lang="ts">
interface Props {
  matters: Matter[]
  dragEnabled?: boolean
  realTimeEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dragEnabled: false,
  realTimeEnabled: false
})

const emit = defineEmits<{
  matterMove: [matterId: string, newStatus: string, newPosition: number]
  realTimeUpdate: [update: RealTimeUpdate]
}>()

// Progressive enhancement state
const isDragReady = ref(false)
const isRealTimeReady = ref(false)

// Enhanced features loaded lazily
const dragAndDropModule = ref<any>(null)
const realTimeModule = ref<any>(null)

// Load drag-and-drop functionality
const enableDragAndDrop = async () => {
  if (props.dragEnabled && !dragAndDropModule.value) {
    try {
      // Lazy load drag-and-drop library
      const { default: VueDraggable } = await import('vuedraggable')
      dragAndDropModule.value = VueDraggable
      isDragReady.value = true
    } catch (error) {
      console.error('Failed to load drag-and-drop:', error)
      // Graceful degradation - drag-and-drop remains disabled
    }
  }
}

// Load real-time functionality
const enableRealTime = async () => {
  if (props.realTimeEnabled && !realTimeModule.value) {
    try {
      // Lazy load WebSocket/SSE functionality
      const realTimeService = await import('~/services/realtime')
      realTimeModule.value = realTimeService.default
      isRealTimeReady.value = true
      
      // Initialize real-time connection
      realTimeService.default.connect({
        onUpdate: (update) => emit('realTimeUpdate', update),
        onError: (error) => console.error('Real-time error:', error)
      })
    } catch (error) {
      console.error('Failed to load real-time:', error)
      // Graceful degradation - real-time remains disabled
    }
  }
}

// Progressive enhancement loading
watch(() => props.dragEnabled, (enabled) => {
  if (enabled) enableDragAndDrop()
})

watch(() => props.realTimeEnabled, (enabled) => {
  if (enabled) enableRealTime()
})

onMounted(() => {
  // Load enhancements after component is mounted
  nextTick(() => {
    if (props.dragEnabled) enableDragAndDrop()
    if (props.realTimeEnabled) enableRealTime()
  })
})

onBeforeUnmount(() => {
  // Cleanup real-time connections
  if (realTimeModule.value) {
    realTimeModule.value.disconnect()
  }
})

// Drag-and-drop handlers
const handleDragEnd = (event: any) => {
  const { newIndex, oldIndex, to, from } = event
  const matterId = event.item.dataset.matterId
  const newColumnId = to.dataset.columnId
  
  if (matterId && newColumnId) {
    emit('matterMove', matterId, newColumnId, newIndex)
  }
}

// Keyboard navigation for accessibility
const handleKeyboardNavigation = (event: KeyboardEvent, matter: Matter) => {
  // Implement keyboard-based matter moving for accessibility
  const { key, ctrlKey, shiftKey } = event
  
  if (key === 'ArrowRight' && ctrlKey) {
    // Move matter to next column
    event.preventDefault()
    // Implementation for keyboard navigation
  }
}
</script>

<template>
  <div class="kanban-interactive-overlay">
    <!-- Enhanced drag-and-drop columns -->
    <div class="enhanced-board">
      <div
        v-for="column in columns"
        :key="column.id"
        class="enhanced-column"
        :data-column-id="column.id"
      >
        <!-- Draggable matter list -->
        <component
          :is="isDragReady ? dragAndDropModule : 'div'"
          v-if="isDragReady"
          v-model="columnMatters[column.id]"
          :animation="200"
          :disabled="!props.dragEnabled"
          ghost-class="matter-ghost"
          chosen-class="matter-chosen"
          drag-class="matter-drag"
          @end="handleDragEnd"
          class="draggable-list"
        >
          <div
            v-for="matter in columnMatters[column.id]"
            :key="matter.id"
            :data-matter-id="matter.id"
            class="draggable-matter"
            tabindex="0"
            @keydown="handleKeyboardNavigation($event, matter)"
          >
            <slot name="matter-card" :matter="matter">
              <!-- Enhanced matter card -->
              <MatterCardEnhanced
                :matter="matter"
                :draggable="isDragReady"
                :real-time="isRealTimeReady"
              />
            </slot>
          </div>
        </component>

        <!-- Fallback for non-enhanced mode -->
        <div v-else class="static-list">
          <div
            v-for="matter in columnMatters[column.id]"
            :key="matter.id"
            class="static-matter"
          >
            <MatterCard :matter="matter" />
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time indicators -->
    <div v-if="isRealTimeReady" class="real-time-indicators">
      <div class="connection-status">
        <span class="status-dot" :class="connectionStatus"></span>
        Real-time updates {{ connectionStatus === 'connected' ? 'active' : 'inactive' }}
      </div>
    </div>

    <!-- Loading states for progressive enhancement -->
    <Transition name="fade">
      <div v-if="props.dragEnabled && !isDragReady" class="enhancement-loading">
        <div class="loading-spinner"></div>
        <span>Loading interactive features...</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Enhanced styles for interactive features */
.kanban-interactive-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.enhanced-board {
  height: 100%;
  pointer-events: auto;
}

.enhanced-column {
  height: 100%;
}

.draggable-list {
  min-height: 100px;
  padding: 0.5rem;
}

.draggable-matter {
  margin-bottom: 0.75rem;
  cursor: grab;
  transition: transform 0.2s;
}

.draggable-matter:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.draggable-matter:active {
  cursor: grabbing;
}

/* Drag states */
.matter-ghost {
  opacity: 0.5;
  background: hsl(var(--muted));
  transform: rotate(2deg);
}

.matter-chosen {
  box-shadow: 0 4px 16px hsl(var(--border));
}

.matter-drag {
  transform: rotate(2deg);
  z-index: 1000;
}

/* Real-time indicators */
.real-time-indicators {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  pointer-events: auto;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: hsl(var(--muted));
}

.status-dot.connected {
  background: hsl(var(--success));
  box-shadow: 0 0 4px hsl(var(--success));
}

.status-dot.connecting {
  background: hsl(var(--warning));
  animation: pulse 1s infinite;
}

.status-dot.disconnected {
  background: hsl(var(--destructive));
}

/* Loading states */
.enhancement-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 2rem;
  pointer-events: auto;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

### Core Web Vitals Optimization

**Performance Monitoring Component:**
```vue
<!-- components/performance/WebVitalsMonitor.vue -->
<script setup lang="ts">
interface WebVitalsMetrics {
  CLS: number
  FID: number
  FCP: number
  LCP: number
  TTFB: number
  INP?: number
}

const metrics = ref<Partial<WebVitalsMetrics>>({})
const isMonitoring = ref(false)

// Core Web Vitals thresholds
const THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 }
}

// Rating function
const getRating = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

// Initialize monitoring
const initializeMonitoring = async () => {
  if (process.server) return
  
  try {
    isMonitoring.value = true
    
    // Dynamic import to avoid SSR issues
    const webVitals = await import('web-vitals')
    
    // Track all Core Web Vitals
    webVitals.getCLS((metric) => {
      metrics.value.CLS = metric.value
      reportMetric('CLS', metric.value, metric.rating)
    })
    
    webVitals.getFID((metric) => {
      metrics.value.FID = metric.value
      reportMetric('FID', metric.value, metric.rating)
    })
    
    webVitals.getFCP((metric) => {
      metrics.value.FCP = metric.value
      reportMetric('FCP', metric.value, metric.rating)
    })
    
    webVitals.getLCP((metric) => {
      metrics.value.LCP = metric.value
      reportMetric('LCP', metric.value, metric.rating)
    })
    
    webVitals.getTTFB((metric) => {
      metrics.value.TTFB = metric.value
      reportMetric('TTFB', metric.value, metric.rating)
    })
    
    // New INP metric (replacing FID)
    if (webVitals.getINP) {
      webVitals.getINP((metric) => {
        metrics.value.INP = metric.value
        reportMetric('INP', metric.value, metric.rating)
      })
    }
    
  } catch (error) {
    console.error('Failed to initialize Web Vitals monitoring:', error)
    isMonitoring.value = false
  }
}

// Report metric to analytics
const reportMetric = (name: string, value: number, rating: string) => {
  // Report to analytics service
  if (window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(value),
      custom_map: { metric_rating: rating }
    })
  }
  
  // Development logging
  if (process.dev) {
    console.log(`${name}: ${value} (${rating})`)
  }
}

// Performance budget alerts
const checkPerformanceBudget = () => {
  const issues: string[] = []
  
  Object.entries(metrics.value).forEach(([metric, value]) => {
    if (value !== undefined) {
      const rating = getRating(metric, value)
      if (rating === 'poor') {
        issues.push(`${metric}: ${value} (threshold exceeded)`)
      }
    }
  })
  
  if (issues.length > 0) {
    console.warn('Performance budget exceeded:', issues)
    
    // Optional: Show user notification in development
    if (process.dev) {
      // Could show a toast or notification
    }
  }
}

// Watch for metric changes
watch(metrics, checkPerformanceBudget, { deep: true })

onMounted(() => {
  initializeMonitoring()
})

// Computed properties for display
const metricsDisplay = computed(() => {
  return Object.entries(metrics.value).map(([name, value]) => ({
    name,
    value: value ? Math.round(value) : 0,
    rating: value ? getRating(name, value) : 'good',
    unit: ['CLS'].includes(name) ? '' : 'ms'
  }))
})
</script>

<template>
  <div v-if="$dev && isMonitoring" class="web-vitals-monitor">
    <details class="vitals-details">
      <summary class="vitals-summary">
        📊 Performance Metrics
        <span v-if="metricsDisplay.some(m => m.rating === 'poor')" class="warning-badge">
          Issues detected
        </span>
      </summary>
      
      <div class="vitals-grid">
        <div
          v-for="metric in metricsDisplay"
          :key="metric.name"
          class="metric-card"
          :class="`rating-${metric.rating}`"
        >
          <div class="metric-name">{{ metric.name }}</div>
          <div class="metric-value">
            {{ metric.value }}{{ metric.unit }}
          </div>
          <div class="metric-rating">{{ metric.rating }}</div>
        </div>
      </div>
      
      <div class="vitals-actions">
        <button @click="initializeMonitoring" class="refresh-btn">
          Refresh Metrics
        </button>
      </div>
    </details>
  </div>
</template>

<style scoped>
.web-vitals-monitor {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  font-family: monospace;
  font-size: 0.75rem;
  z-index: 9999;
  max-width: 300px;
}

.vitals-details {
  padding: 0.5rem;
}

.vitals-summary {
  cursor: pointer;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem;
}

.warning-badge {
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.metric-card {
  padding: 0.5rem;
  border-radius: var(--radius);
  text-align: center;
  border: 1px solid;
}

.metric-card.rating-good {
  border-color: #10b981;
  background: #10b98110;
}

.metric-card.rating-needs-improvement {
  border-color: #f59e0b;
  background: #f59e0b10;
}

.metric-card.rating-poor {
  border-color: #ef4444;
  background: #ef444410;
}

.metric-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1rem;
  font-weight: bold;
}

.metric-rating {
  font-size: 0.625rem;
  text-transform: capitalize;
  margin-top: 0.25rem;
  opacity: 0.8;
}

.vitals-actions {
  margin-top: 0.5rem;
  text-align: center;
}

.refresh-btn {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.75rem;
  cursor: pointer;
}

.refresh-btn:hover {
  opacity: 0.9;
}
</style>
```

### Error Boundaries and Fallbacks

**SSR Error Boundary Component:**
```vue
<!-- components/error/ErrorBoundary.vue -->
<script setup lang="ts">
interface Props {
  error?: Error | null
  fallback?: boolean
  retry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fallback: true,
  retry: true
})

const emit = defineEmits<{
  retry: []
  report: [error: Error]
}>()

// Error state management
const hasError = computed(() => !!props.error)
const errorDetails = computed(() => {
  if (!props.error) return null
  
  return {
    message: props.error.message,
    stack: props.error.stack,
    name: props.error.name,
    timestamp: new Date().toISOString()
  }
})

// Error reporting
const reportError = () => {
  if (props.error) {
    // Report to error tracking service
    console.error('Error reported:', errorDetails.value)
    
    // Analytics tracking
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: props.error.message,
        fatal: false
      })
    }
    
    emit('report', props.error)
  }
}

// Retry functionality
const handleRetry = () => {
  emit('retry')
}

// Auto-report errors
watch(() => props.error, (error) => {
  if (error) {
    reportError()
  }
})
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div v-if="fallback" class="error-fallback">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Something went wrong</h3>
      <p class="error-message">
        {{ errorDetails?.message || 'An unexpected error occurred' }}
      </p>
      
      <div class="error-actions">
        <button v-if="retry" @click="handleRetry" class="retry-btn">
          Try Again
        </button>
        <button @click="navigateTo('/')" class="home-btn">
          Go to Dashboard
        </button>
      </div>
      
      <details v-if="$dev" class="error-details">
        <summary>Error Details (Development)</summary>
        <pre class="error-stack">{{ errorDetails?.stack }}</pre>
      </details>
    </div>
    
    <!-- Slot for custom error display -->
    <slot name="error" :error="props.error" :details="errorDetails">
      <!-- Default error display -->
    </slot>
  </div>
  
  <!-- Normal content when no error -->
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-fallback {
  text-align: center;
  padding: 2rem;
  max-width: 500px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: hsl(var(--foreground));
}

.error-message {
  color: hsl(var(--muted-foreground));
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.retry-btn, .home-btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.retry-btn {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
}

.home-btn {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  border: 1px solid hsl(var(--border));
}

.retry-btn:hover, .home-btn:hover {
  opacity: 0.9;
}

.error-details {
  margin-top: 1rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.error-stack {
  background: hsl(var(--muted));
  padding: 1rem;
  border-radius: var(--radius);
  font-family: monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
}
</style>
```

### SEO and Meta Tag Optimization

**Dynamic SEO Component:**
```vue
<!-- components/seo/KanbanSEO.vue -->
<script setup lang="ts">
interface Props {
  status?: string
  search?: string
  matterCount?: number
  lastUpdated?: Date
}

const props = defineProps<Props>()

const route = useRoute()
const { locale } = useI18n()

// Dynamic title generation
const pageTitle = computed(() => {
  const baseTitle = 'Aster Legal Management'
  
  if (props.status) {
    const statusName = STATUS_LABELS[props.status]?.[locale.value] || props.status
    return `${statusName} Cases - ${baseTitle}`
  }
  
  if (props.search) {
    return `Search: "${props.search}" - ${baseTitle}`
  }
  
  return `Case Management Dashboard - ${baseTitle}`
})

// Dynamic description
const pageDescription = computed(() => {
  const base = 'Professional legal case management with visual Kanban board'
  
  if (props.status) {
    return `View and manage ${props.status.toLowerCase()} legal cases. ${base}.`
  }
  
  if (props.search) {
    return `Search results for "${props.search}" in legal case management system.`
  }
  
  if (props.matterCount) {
    return `Manage ${props.matterCount} active legal cases with visual Kanban board. ${base}.`
  }
  
  return base
})

// Structured data for search engines
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Aster Legal Management',
  description: pageDescription.value,
  applicationCategory: 'Legal Case Management',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  featureList: [
    'Visual Kanban Board',
    'Legal Case Tracking',
    'Document Management',
    'Client Communication',
    'Bilingual Support (Japanese/English)'
  ]
}))

// Canonical URL
const canonicalUrl = computed(() => {
  const baseUrl = 'https://aster-legal.com'
  return `${baseUrl}${route.path}`
})

// Open Graph image
const ogImage = computed(() => {
  return '/images/kanban-dashboard-og.jpg'
})

// Set meta tags
useSeoMeta({
  title: pageTitle.value,
  description: pageDescription.value,
  keywords: 'legal case management, kanban board, law firm software, legal workflow, case tracking',
  
  // Open Graph
  ogTitle: pageTitle.value,
  ogDescription: pageDescription.value,
  ogImage: ogImage.value,
  ogImageAlt: 'Aster Legal Management Kanban Dashboard',
  ogType: 'website',
  ogUrl: canonicalUrl.value,
  
  // Twitter Card
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle.value,
  twitterDescription: pageDescription.value,
  twitterImage: ogImage.value,
  
  // Additional meta tags
  robots: 'index, follow',
  author: 'Aster Legal Technologies',
  viewport: 'width=device-width, initial-scale=1'
})

// Structured data injection
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(structuredData.value)
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl.value
    }
  ]
})

// Performance hints
useHead({
  link: [
    // Preconnect to external resources
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    
    // DNS prefetch for API endpoints
    { rel: 'dns-prefetch', href: 'https://api.aster-legal.com' },
    
    // Preload critical resources
    { rel: 'preload', href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }
  ]
})

// Status label mapping
const STATUS_LABELS = {
  'initial-consultation': {
    en: 'Initial Consultation',
    ja: '初回相談'
  },
  'document-preparation': {
    en: 'Document Preparation',
    ja: '書類作成中'
  },
  'filed': {
    en: 'Filed',
    ja: '提出済み'
  },
  'in-progress': {
    en: 'In Progress',
    ja: '進行中'
  },
  'in-court': {
    en: 'In Court',
    ja: '法廷'
  },
  'settlement': {
    en: 'Settlement',
    ja: '和解協議中'
  },
  'closed': {
    en: 'Closed',
    ja: '完了'
  }
}
</script>

<template>
  <!-- This component only handles SEO meta tags -->
  <!-- No visual content to render -->
</template>
```

## Implementation Steps

**Step-by-step implementation approach:**

1. **SSR Architecture Setup**
   - Configure Nuxt 3 SSR settings and route rules
   - Implement server-side data fetching patterns
   - Set up hydration-safe component patterns
   - Create error boundaries for SSR failures

2. **Caching Layer Implementation**
   - Configure Redis caching for API routes
   - Implement client-side caching with useFetch
   - Set up CDN and browser caching headers
   - Create cache invalidation strategies

3. **Progressive Enhancement**
   - Build static server-rendered foundation
   - Implement lazy loading for interactive features
   - Create fallbacks for JavaScript-disabled environments
   - Add loading states and error handling

4. **Performance Optimization**
   - Implement Core Web Vitals monitoring
   - Optimize critical rendering path
   - Add resource hints and preloading
   - Configure bundle splitting and lazy loading

5. **SEO and Accessibility**
   - Create dynamic meta tag generation
   - Implement structured data markup
   - Add proper ARIA labels and semantic HTML
   - Test with screen readers and SEO tools

6. **Monitoring and Analytics**
   - Set up performance monitoring
   - Implement error tracking
   - Add user experience metrics
   - Create performance budget alerts

7. **Testing and Validation**
   - Test SSR hydration across different scenarios
   - Validate Core Web Vitals scores
   - Check accessibility compliance
   - Verify SEO optimization

8. **Production Deployment**
   - Configure production caching strategies
   - Set up CDN and edge caching
   - Implement monitoring and alerting
   - Create rollback procedures

## Key Architectural Decisions

**SSR Strategy:**
- SSR-first approach with progressive enhancement
- Static content server-rendered, interactive features client-side
- Hydration safety as primary concern
- Error boundaries prevent SSR failures

**Caching Approach:**
- Multi-layer caching: Redis, Nuxt Cache, CDN
- 5-minute API cache with stale-while-revalidate
- Efficient cache invalidation on data updates
- User-specific cache keys for security

**Performance Philosophy:**
- Core Web Vitals as primary metrics
- <100KB initial bundle size budget
- Progressive loading of non-critical features
- Aggressive resource optimization

## Scope Boundaries

**IN SCOPE (T08_S07):**
- Complete SSR optimization for Kanban dashboard
- Hydration safety and error handling
- Multi-layer caching implementation
- Core Web Vitals optimization
- Progressive enhancement patterns
- SEO and accessibility optimization

**OUT OF SCOPE (Future Considerations):**
- Advanced service worker implementation
- Offline functionality
- Advanced PWA features
- Real-time collaboration optimization
- Advanced analytics integration
- A/B testing framework

## Success Criteria

- [ ] TTFB consistently <200ms for dashboard pages
- [ ] Core Web Vitals scores in "Good" range (LCP <2.5s, FID <100ms, CLS <0.1)
- [ ] Zero hydration mismatches in production
- [ ] Cache hit ratio >70% for API endpoints
- [ ] Lighthouse performance score >90
- [ ] Accessibility score >95%
- [ ] SEO meta tags properly generated
- [ ] Error boundaries prevent user-facing crashes
- [ ] Performance budget maintained
- [ ] Progressive enhancement works without JavaScript

## Output Log
*(This section will be populated as work progresses on the task)*

[2025-06-22 12:00]: Task created - Nuxt 3 SSR optimization for Kanban dashboard performance
[2025-06-22 12:00]: Comprehensive SSR strategy established with hydration safety focus
[2025-06-22 12:00]: Multi-layer caching architecture defined with Redis and CDN integration
[2025-06-22 12:00]: Core Web Vitals monitoring and progressive enhancement patterns documented