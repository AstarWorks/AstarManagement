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

export default defineNuxtPlugin(async (nuxtApp) => {
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
          initializer: (query: any) => query.state.error?.code?.startsWith('LEGAL_VALIDATION')
        },
        {
          name: 'Matter Access',
          initializer: (query: any) => query.state.error?.code?.startsWith('MATTER_ACCESS')
        },
        {
          name: 'Document Processing',
          initializer: (query: any) => query.state.error?.code?.startsWith('DOC_')
        },
        {
          name: 'Permission Denied',
          initializer: (query: any) => query.state.error?.status === 403
        },
        {
          name: 'Network Error',
          initializer: (query: any) => query.state.error?.code === 'NETWORK_ERROR'
        }
      ],
      
      // Custom query grouping for better organization
      queryGroups: [
        {
          name: 'Matters',
          matcher: (query: any) => query.queryKey[0] === 'matters'
        },
        {
          name: 'Documents',
          matcher: (query: any) => query.queryKey[0] === 'documents'
        },
        {
          name: 'Search',
          matcher: (query: any) => query.queryKey[0] === 'search'
        },
        {
          name: 'User Settings',
          matcher: (query: any) => query.queryKey[0] === 'userSettings'
        }
      ],
      
      // Performance monitoring integration
      onQueryStart: (query: any) => {
        metrics.recordQueryStart(query.queryHash)
      },
      
      onQuerySuccess: (query: any) => {
        metrics.recordQuerySuccess(query.queryHash)
      },
      
      onQueryError: (query: any) => {
        metrics.recordQueryError(query.queryHash, query.state.error)
      },
      
      onMutationStart: (mutation: any) => {
        metrics.recordMutationStart(mutation.mutationId)
      },
      
      onMutationSuccess: (mutation: any) => {
        metrics.recordMutationSuccess(mutation.mutationId)
      },
      
      onMutationError: (mutation: any) => {
        metrics.recordMutationError(mutation.mutationId, mutation.state.error)
      }
    })
    
    // Add performance monitoring to the query client
    const queryClient = nuxtApp.$queryClient as QueryClient
    
    // Monitor cache size and memory usage
    if ('performance' in window && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        
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