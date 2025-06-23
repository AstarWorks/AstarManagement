<script setup lang="ts">
// 1. Server-side data fetching with error handling and caching
const { data: matters, error, pending, refresh } = await useFetch('/api/matters', {
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
  // Track Core Web Vitals only in client
  if (process.client) {
    import('web-vitals').then((webVitals) => {
      if (webVitals.onCLS) {
        webVitals.onCLS((metric: any) => { performanceMetrics.value.cls = metric.value })
      }
      if (webVitals.onFID) {
        webVitals.onFID((metric: any) => { /* Track FID */ })
      }
      if (webVitals.onFCP) {
        webVitals.onFCP((metric: any) => { performanceMetrics.value.fcp = metric.value })
      }
      if (webVitals.onLCP) {
        webVitals.onLCP((metric: any) => { performanceMetrics.value.lcp = metric.value })
      }
      if (webVitals.onTTFB) {
        webVitals.onTTFB((metric: any) => { performanceMetrics.value.ttfb = metric.value })
      }
    }).catch(() => {
      // Gracefully handle import failure
      console.warn('Web Vitals library not available')
    })
  }
})

// 8. Kanban configuration
const showJapanese = ref(true)
const columns = ref<{ id: string; label: string; labelEn: string }[]>([
  { id: 'intake', label: '受付', labelEn: 'Intake' },
  { id: 'investigation', label: '調査', labelEn: 'Investigation' },
  { id: 'negotiation', label: '交渉', labelEn: 'Negotiation' },
  { id: 'litigation', label: '訴訟', labelEn: 'Litigation' },
  { id: 'settlement', label: '和解', labelEn: 'Settlement' },
  { id: 'collection', label: '回収', labelEn: 'Collection' },
  { id: 'closed', label: '完了', labelEn: 'Closed' }
])

// 9. Event handlers
const handleMatterMove = async (matterId: string, newStatus: string) => {
  // Optimistic update
  const matterIndex = matters.value.findIndex(m => m.id === matterId)
  if (matterIndex !== -1) {
    matters.value[matterIndex].status = newStatus
  }
  
  try {
    await $fetch(`/api/matters/${matterId}`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
  } catch (error) {
    // Revert optimistic update on error
    await refresh()
  }
}

const handleRealTimeUpdate = (updates: any[]) => {
  // Handle real-time updates
  updates.forEach(update => {
    const matterIndex = matters.value.findIndex(m => m.id === update.id)
    if (matterIndex !== -1) {
      matters.value[matterIndex] = { ...matters.value[matterIndex], ...update }
    }
  })
}

// Define page meta for SEO and routing
definePageMeta({
  title: 'Kanban Dashboard',
  layout: 'app',
  // Prerender this page for better SSR performance
  prerender: true
})
</script>

<template>
  <div class="kanban-dashboard">
    <!-- Critical above-the-fold content rendered server-side -->
    <header class="dashboard-header">
      <h1>{{ title }}</h1>
      <div class="header-meta">
        <span v-if="matters && matters.length">{{ matters.length }} active cases</span>
        <span v-if="pending" class="loading-indicator" aria-live="polite">
          Loading cases...
        </span>
      </div>
    </header>

    <!-- Error boundary for SSR failures -->
    <div v-if="error" class="error-boundary" role="alert">
      <h2>Dashboard Loading Error</h2>
      <p>{{ error.message || 'Failed to load dashboard data' }}</p>
      <button @click="refresh()" class="retry-button">
        Retry Loading
      </button>
    </div>
    
    <!-- Main dashboard content with progressive enhancement -->
    <main v-else class="dashboard-content">
      <!-- Server-rendered static content -->
      <div class="kanban-board-container">
        <!-- Always render the board structure server-side -->
        <KanbanBoardSSR
          :matters="matters || []"
          :columns="columns"
          :show-japanese="showJapanese"
          :loading="pending"
        />
        
        <!-- Progressive enhancement for interactive features -->
        <ClientOnly>
          <KanbanBoardInteractive
            v-if="isHydrated && matters"
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
    <div v-if="$dev && isClient" class="performance-monitor">
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

.dashboard-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.header-meta {
  margin-top: 0.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
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

/* Error boundary */
.error-boundary {
  padding: 2rem;
  text-align: center;
  color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.2);
  margin: 1rem;
  border-radius: var(--radius);
}

.error-boundary h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.retry-button {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  cursor: pointer;
  margin-top: 1rem;
}

.retry-button:hover {
  background: hsl(var(--primary) / 0.9);
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
  z-index: 100;
}

.performance-monitor details {
  margin: 0;
}

.performance-monitor summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.performance-monitor pre {
  margin: 0;
  font-size: 0.625rem;
  white-space: pre-wrap;
}

/* Ensure critical path rendering is optimized */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 0.75rem 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.25rem;
  }
  
  .header-meta {
    font-size: 0.875rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .dashboard-header {
    border-bottom-width: 2px;
  }
  
  .error-boundary {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .kanban-dashboard * {
    transition: none !important;
    animation: none !important;
  }
}

/* Print styles */
@media print {
  .performance-monitor,
  .no-js-message {
    display: none;
  }
  
  .dashboard-header {
    position: static;
    border-bottom: 1px solid #000;
  }
}
</style>