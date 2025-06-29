/**
 * Centralized lazy loading configuration for all heavy components
 * Implements route-based and component-based code splitting
 */

import React, { lazy } from 'react'
import { 
  PDFViewerSkeleton, 
  AnalyticsSkeleton, 
  FormSkeleton, 
  BoardSkeleton,
  withLazyLoading 
} from './LazyComponentLoader'

// Performance monitoring for lazy loads
const trackLazyLoad = (componentName: string) => {
  const startTime = performance.now()
  
  return () => {
    const loadTime = performance.now() - startTime
    console.log(`🚀 Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`)
    
    // Track performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`lazy-${componentName}-loaded`)
    }
  }
}

// Route-based lazy loading (pages)
export const LazyMattersPage = lazy(() => 
  import('../../../app/matters/page').then(module => {
    trackLazyLoad('MattersPage')()
    return { default: module.default }
  }).catch(error => {
    console.error('Failed to load MattersPage:', error)
    throw error
  })
)

export const LazyAuditPage = lazy(() => 
  import('../../../app/audit/page').then(module => {
    trackLazyLoad('AuditPage')()
    return { default: module.default }
  }).catch(error => {
    console.error('Failed to load AuditPage:', error)
    throw error
  })
)

export const LazyKanbanDemoPage = lazy(() => 
  import('../../../app/demo/kanban/page').then(module => {
    trackLazyLoad('KanbanDemoPage')()
    return { default: module.default }
  }).catch(error => {
    console.error('Failed to load KanbanDemoPage:', error)
    throw error
  })
)

// Component-based lazy loading (heavy components)

// PDF Viewer - typically 50-100KB
export const LazyPDFViewer = withLazyLoading(
  lazy(() => 
    import('@react-pdf/renderer').then(module => {
      trackLazyLoad('PDFViewer')()
      return { default: module.PDFViewer }
    }).catch(() => {
      // Fallback to a simple PDF viewer placeholder
      return { 
        default: () => React.createElement(
          'div',
          { className: "flex items-center justify-center h-64 border rounded-lg" },
          React.createElement('p', { className: "text-muted-foreground" }, 'PDF Viewer not available')
        )
      }
    })
  ),
  { 
    fallback: PDFViewerSkeleton,
    onLoad: () => trackLazyLoad('PDFViewer')(),
    delay: 100
  }
)

// Analytics/Charts - typically 30-50KB  
export const LazyAnalyticsDashboard = withLazyLoading(
  lazy(() => 
    import('../analytics/AnalyticsDashboard').then(module => {
      trackLazyLoad('AnalyticsDashboard')()
      return module
    }).catch(() => {
      // Fallback component
      return {
        default: () => React.createElement(
          'div',
          { className: "p-6" },
          React.createElement('h2', { className: "text-xl font-semibold mb-4" }, 'Analytics Dashboard'),
          React.createElement('p', { className: "text-muted-foreground" }, 'Analytics features will be available soon.')
        )
      }
    })
  ),
  {
    fallback: AnalyticsSkeleton,
    onLoad: () => trackLazyLoad('AnalyticsDashboard')(),
    delay: 150
  }
)

// Chart components - load on demand
export const LazyChartComponents = {
  BarChart: withLazyLoading(
    lazy(() => 
      import('recharts').then(module => {
        trackLazyLoad('BarChart')()
        return { default: module.BarChart }
      })
    ),
    { delay: 0 }
  ),
  
  LineChart: withLazyLoading(
    lazy(() => 
      import('recharts').then(module => {
        trackLazyLoad('LineChart')()
        return { default: module.LineChart }
      })
    ),
    { delay: 0 }
  ),
  
  PieChart: withLazyLoading(
    lazy(() => 
      import('recharts').then(module => {
        trackLazyLoad('PieChart')()
        return { default: module.PieChart }
      })
    ),
    { delay: 0 }
  )
}

// Forms - load based on user interaction
export const LazyFormComponents = {
  CreateMatterForm: withLazyLoading(
    lazy(() => 
      import('../forms/matter/CreateMatterForm').then(module => {
        trackLazyLoad('CreateMatterForm')()
        return module
      })
    ),
    {
      fallback: FormSkeleton,
      delay: 50
    }
  ),
  
  EditMatterForm: withLazyLoading(
    lazy(() => 
      import('../forms/matter/EditMatterForm').then(module => {
        trackLazyLoad('EditMatterForm')()
        return module
      })
    ),
    {
      fallback: FormSkeleton,
      delay: 50
    }
  )
}

// Advanced features - load on demand
export const LazyAdvancedComponents = {
  VirtualizedBoard: withLazyLoading(
    lazy(() => 
      import('../kanban/VirtualizedBoard').then(module => {
        trackLazyLoad('VirtualizedBoard')()
        return module
      })
    ),
    {
      fallback: BoardSkeleton,
      delay: 100
    }
  ),
  
  AuditTimeline: withLazyLoading(
    lazy(() => 
      import('../audit/AuditTimeline').then(module => {
        trackLazyLoad('AuditTimeline')()
        return module
      })
    ),
    {
      delay: 100
    }
  )
}

// Development tools - only load in development
export const LazyDevComponents = {
  Storybook: lazy(() => 
    import('@storybook/react').then(module => {
      trackLazyLoad('Storybook')()
      return { default: module.default }
    })
  ),
  
  ReactQueryDevtools: lazy(() => 
    import('@tanstack/react-query-devtools').then(module => {
      trackLazyLoad('ReactQueryDevtools')()
      return { default: module.ReactQueryDevtools }
    })
  )
}

// Preloading functions for critical components
export const preloadCriticalComponents = async () => {
  console.log('🚀 Preloading critical components...')
  
  const criticalImports = [
    import('../kanban/KanbanBoard'),
    import('../kanban/MatterCard'),
    import('../forms/matter/CreateMatterForm')
  ]
  
  try {
    await Promise.all(criticalImports)
    console.log('✅ Critical components preloaded successfully')
  } catch (error) {
    console.error('❌ Failed to preload some critical components:', error)
  }
}

// Route-based preloading
export const preloadRoute = async (routeName: string) => {
  const routeMap: Record<string, () => Promise<any>> = {
    'matters': () => import('../../../app/matters/page'),
    'audit': () => import('../../../app/audit/page'),
    'kanban-demo': () => import('../../../app/demo/kanban/page')
  }
  
  const routeImporter = routeMap[routeName]
  if (routeImporter) {
    try {
      await routeImporter()
      console.log(`✅ Route '${routeName}' preloaded successfully`)
    } catch (error) {
      console.error(`❌ Failed to preload route '${routeName}':`, error)
    }
  } else {
    console.warn(`⚠️ Route '${routeName}' not found for preloading`)
  }
}

// Bundle analysis helper
export const getLazyComponentStats = () => {
  if (typeof window === 'undefined') return {}
  
  const marks = performance.getEntriesByType('mark')
  const lazyMarks = marks.filter(mark => mark.name.startsWith('lazy-'))
  
  return {
    totalLazyComponents: lazyMarks.length,
    loadedComponents: lazyMarks.map(mark => ({
      name: mark.name.replace('lazy-', '').replace('-loaded', ''),
      loadTime: mark.startTime
    }))
  }
}

export default {
  // Pages
  LazyMattersPage,
  LazyAuditPage,
  LazyKanbanDemoPage,
  
  // Components
  LazyPDFViewer,
  LazyAnalyticsDashboard,
  
  // Groups
  LazyChartComponents,
  LazyFormComponents,
  LazyAdvancedComponents,
  LazyDevComponents,
  
  // Utilities
  preloadCriticalComponents,
  preloadRoute,
  getLazyComponentStats
}