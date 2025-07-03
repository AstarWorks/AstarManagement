/**
 * TanStack Query DevTools Plugin with Enhanced Performance Monitoring
 * 
 * @description Conditionally loads Vue Query DevTools in development environment
 * with custom performance monitoring panels, query metrics visualization, and
 * advanced debugging capabilities optimized for Aster Management's legal workflow.
 * 
 * Features:
 * - Custom performance metrics panel
 * - Query timing visualization
 * - Memory usage tracking
 * - Network request monitoring
 * - Legal domain-specific error categorization
 * - Optimized bundle splitting with lazy loading
 * 
 * @author Claude
 * @created 2025-06-26
 */

import type { QueryClient } from '@tanstack/vue-query'
import { defineAsyncComponent } from 'vue'

export default defineNuxtPlugin(async (nuxtApp: ReturnType<typeof useNuxtApp>) => {
  // Only load in development
  if (process.env.NODE_ENV !== 'production') {
    // Lazy load devtools to reduce initial bundle size
    const [{ VueQueryDevtools }, { getGlobalQueryPerformanceMonitor }] = await Promise.all([
      import('@tanstack/vue-query-devtools'),
      import('~/composables/useQueryPerformanceMonitor')
    ])
    
    // Initialize performance monitoring
    const monitor = getGlobalQueryPerformanceMonitor()
    const metrics = monitor.getMetrics()
    monitor.initializeMonitoring()
    
    nuxtApp.vueApp.use(VueQueryDevtools, {
      // DevTools configuration
      buttonPosition: 'bottom-right',
      position: 'bottom',
      initialIsOpen: false,
      
      // Custom styles to match the app theme
      style: {
        zIndex: 99999,
        // Ensure DevTools are visible in dark mode
        '--tsqd-background': 'hsl(var(--background))',
        '--tsqd-text': 'hsl(var(--foreground))',
        '--tsqd-border': 'hsl(var(--border))',
        '--tsqd-accent': 'hsl(var(--primary))'
      },
      
      // Custom panels for performance monitoring
      customPanels: [
        {
          id: 'performance',
          name: 'Performance',
          icon: '⚡',
          component: defineAsyncComponent(() => import('~/components/devtools/QueryPerformancePanel.vue'))
        },
        {
          id: 'network',
          name: 'Network',
          icon: '🌐',
          component: defineAsyncComponent(() => import('~/components/devtools/NetworkMonitorPanel.vue'))
        },
        {
          id: 'legal-errors',
          name: 'Legal Errors',
          icon: '⚖️',
          component: defineAsyncComponent(() => import('~/components/devtools/LegalErrorsPanel.vue'))
        }
      ],
      
      // Enhanced error tracking with legal domain categorization
      errorTypes: [
        {
          name: 'Legal Validation',
          initializer: (query: { state: { error?: { code?: string } } }) => query.state.error?.code?.startsWith('LEGAL_VALIDATION')
        },
        {
          name: 'Matter Access',
          initializer: (query: { state: { error?: { code?: string } } }) => query.state.error?.code?.startsWith('MATTER_ACCESS')
        },
        {
          name: 'Document Processing',
          initializer: (query: { state: { error?: { code?: string } } }) => query.state.error?.code?.startsWith('DOC_')
        },
        {
          name: 'Permission Denied',
          initializer: (query: { state: { error?: { status?: number } } }) => query.state.error?.status === 403
        },
        {
          name: 'Network Error',
          initializer: (query: { state: { error?: { code?: string } } }) => query.state.error?.code === 'NETWORK_ERROR'
        }
      ],
      
      // Custom query grouping for better organization
      queryGroups: [
        {
          name: 'Matters',
          matcher: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === 'matters'
        },
        {
          name: 'Documents',
          matcher: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === 'documents'
        },
        {
          name: 'Search',
          matcher: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === 'search'
        },
        {
          name: 'User Settings',
          matcher: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === 'userSettings'
        }
      ],
      
      // Performance monitoring integration
      onQueryStart: (query: { queryHash: string }) => {
        metrics.recordQueryStart(query.queryHash)
      },
      
      onQuerySuccess: (query: { queryHash: string }) => {
        metrics.recordQuerySuccess(query.queryHash)
      },
      
      onQueryError: (query: { queryHash: string; state: { error: unknown } }) => {
        metrics.recordQueryError(query.queryHash, query.state.error)
      },
      
      onMutationStart: (mutation: { mutationId: string }) => {
        metrics.recordMutationStart(mutation.mutationId)
      },
      
      onMutationSuccess: (mutation: { mutationId: string }) => {
        metrics.recordMutationSuccess(mutation.mutationId)
      },
      
      onMutationError: (mutation: { mutationId: string; state: { error: unknown } }) => {
        metrics.recordMutationError(mutation.mutationId, mutation.state.error)
      }
    })
    
    // Add performance monitoring to the query client
    const queryClient = nuxtApp.$queryClient as QueryClient
    
    // Monitor cache size and memory usage
    if ('performance' in window && 'memory' in performance) {
      setInterval(() => {
        const performance = window.performance as any
        const memory = performance.memory as {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }
        
        metrics.updateMemoryUsage({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        })
        
        // Monitor cache size
        const cacheSize = queryClient.getQueryCache().getAll().length
        const mutationCacheSize = queryClient.getMutationCache().getAll().length
        
        metrics.updateCacheMetrics({
          queryCacheSize: cacheSize,
          mutationCacheSize: mutationCacheSize
        })
      }, 5000) // Update every 5 seconds
    }
    
    console.log('🔍 TanStack Query DevTools enabled with performance monitoring')
    console.log('📊 Performance metrics available at:', metrics)
  }
})