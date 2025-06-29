<script setup lang="ts">
// 1. Import components and utilities
import KanbanBoard from "~/components/kanban/KanbanBoard.vue";
import KanbanBoardSSR from "~/components/kanban/KanbanBoardSSR.vue";
import KanbanBoardInteractive from "~/components/kanban/KanbanBoardInteractive.vue";
import { useKanbanMattersQuery, usePrefetchKanbanData } from '~/composables/useKanbanQuery';
import { useQueryClient } from '@tanstack/vue-query';
import type { MatterFilters } from '~/types/query';

// 2. Setup query client and filters
const queryClient = useQueryClient();
const route = useRoute();

// Build filters from query params
const filters = computed<MatterFilters>(() => ({
  status: route.query.status ? [route.query.status as string] : undefined,
  priority: route.query.priority ? [route.query.priority as string] : undefined,
  search: route.query.search as string || undefined
}));

// 3. Use TanStack Query for data fetching
const {
  matterCards: matters,
  isLoading: pending,
  isError,
  error,
  refetch: refresh
} = useKanbanMattersQuery(filters);

// 4. Prefetch data on mount for better performance
const { prefetchAll } = usePrefetchKanbanData();
onMounted(() => {
  prefetchAll();
});

// 2. Hydration-safe reactive state
const isClient = process.client
const isDev = process.dev || false
const isHydrated = ref(false)

// 3. Progressive enhancement state
const isDragEnabled = ref(false)
const isRealTimeEnabled = ref(false)

// 4. SEO and meta configuration
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
      if (webVitals.onINP) {
        webVitals.onINP((metric: any) => { /* Track INP (replaces FID) */ })
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

// 9. Event handlers
const handleMatterMove = async (matterId: string, newStatus: string, oldStatus: string) => {
  // The TanStack Query mutations handle optimistic updates automatically
  // Just invalidate queries to refresh data
  await queryClient.invalidateQueries({ queryKey: ['matters'] })
  await queryClient.invalidateQueries({ queryKey: ['kanban'] })
}

const handleRealTimeUpdate = (updates: any[]) => {
  // Invalidate relevant queries when real-time updates arrive
  // TanStack Query will handle the actual data updates
  queryClient.invalidateQueries({ queryKey: ['matters'] })
  queryClient.invalidateQueries({ queryKey: ['kanban'] })
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
    <div v-if="isError" class="error-boundary" role="alert">
      <h2>Dashboard Loading Error</h2>
      <p>{{ error?.message || 'Failed to load dashboard data' }}</p>
      <button @click="refresh()" class="retry-button">
        Retry Loading
      </button>
    </div>
    
    <!-- Main dashboard content with progressive enhancement -->
    <main v-else class="dashboard-content">
      <!-- Server-rendered static content -->
      <div class="kanban-board-container">
        <!-- TanStack Query-powered Kanban Board -->
        <KanbanBoard
          :filters="filters"
          :show-japanese="showJapanese"
          class="h-full"
        />
        
        <!-- SSR fallback for initial render -->
        <ClientOnly>
          <template #fallback>
            <KanbanBoardSSR
              :filters="filters"
              :show-japanese="showJapanese"
              :ssr-matters="matters || []"
            />
          </template>
        </ClientOnly>
      </div>
    </main>

    <!-- Performance monitoring (development only) -->
    <div v-if="isDev && isClient" class="performance-monitor">
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