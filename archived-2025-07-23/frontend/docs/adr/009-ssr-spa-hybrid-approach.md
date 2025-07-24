# ADR-009: SSR/SPA Hybrid Approach for Optimal Performance

## Status
Accepted

## Context
The Aster Management system needs to balance several competing requirements:
- Fast initial page loads for better user experience
- SEO is less critical (internal tool) but performance matters
- Rich interactivity for features like Kanban boards
- Real-time updates via WebSocket
- Offline capability for court visits
- Authentication state management
- Large document viewing and manipulation

Nuxt 3 supports multiple rendering modes: Universal (SSR), SPA, Static Generation (SSG), and hybrid approaches. We need to choose the optimal strategy.

## Decision
We will use a hybrid SSR/SPA approach with intelligent rendering mode selection:
- **SSR (Server-Side Rendering)**: Authentication pages, landing pages, matter lists
- **SPA (Single-Page Application)**: Interactive features like Kanban, document editor, real-time features
- **CSR (Client-Side Rendering)**: Admin panels, heavy interactive components
- **ISR (Incremental Static Regeneration)**: Documentation, help pages

Implementation via Nuxt's `routeRules` configuration for fine-grained control.

## Consequences

### Positive
- Optimal performance for each page type
- Faster initial loads for critical paths
- Better perceived performance
- Reduced server load for interactive features
- Flexibility to optimize per-route
- Progressive enhancement approach
- Better error boundaries
- Improved Core Web Vitals

### Negative
- More complex mental model
- Need to carefully consider each route
- Potential hydration mismatches
- Different debugging approaches per mode
- State management complexity

### Neutral
- Need to document rendering strategy per feature
- Testing needs to cover both SSR and SPA modes
- Build process handles multiple outputs

## Alternatives Considered

### Alternative 1: Full SSR (Universal Rendering)
- **Pros**: Consistent approach, good SEO, fast initial loads
- **Cons**: Complex for highly interactive features, WebSocket complications
- **Reason for rejection**: Kanban and real-time features work better as SPA

### Alternative 2: Full SPA
- **Pros**: Simple mental model, rich interactivity, familiar to React devs
- **Cons**: Slower initial loads, larger bundle, poor performance metrics
- **Reason for rejection**: Loses Nuxt's SSR benefits

### Alternative 3: Static Site Generation (SSG)
- **Pros**: Excellent performance, simple hosting
- **Cons**: Not suitable for dynamic content, auth complexity
- **Reason for rejection**: Legal cases are highly dynamic

### Alternative 4: Edge-Side Rendering (ESR)
- **Pros**: Cutting-edge performance, global distribution
- **Cons**: Complex setup, limited provider support, immature
- **Reason for rejection**: Over-engineering for internal tool

## Implementation Notes

### Route Rules Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/help', '/documentation']
    }
  },
  
  routeRules: {
    // SSR - Fast initial load
    '/': { prerender: true },
    '/login': { ssr: true },
    '/matters': { ssr: true },
    '/matters/*/': { ssr: true, headers: { 'cache-control': 's-maxage=60' } },
    
    // SPA - Interactive features
    '/matters/*/kanban': { ssr: false },
    '/documents/*/edit': { ssr: false },
    '/communications/chat': { ssr: false },
    
    // Prerendered - Static content
    '/help/**': { prerender: true },
    '/documentation/**': { prerender: true },
    
    // API routes
    '/api/**': { cors: true, headers: { 'cache-control': 'no-cache' } }
  }
})
```

### Component-Level Control
```vue
<!-- components/MatterKanban.vue -->
<script setup>
// Ensure this component only renders on client
const nuxtApp = useNuxtApp()
if (process.server) {
  // Return placeholder for SSR
  nuxtApp.payload.kanbanData = null
}

// Client-only imports
onMounted(async () => {
  const { $dragula } = await import('dragula')
  // Initialize drag and drop
})
</script>

<template>
  <ClientOnly>
    <MatterKanbanBoard />
    <template #fallback>
      <MatterKanbanSkeleton />
    </template>
  </ClientOnly>
</template>
```

### Data Fetching Strategy
```typescript
// SSR pages - Use useFetch
export default defineNuxtPlugin(() => {
  const { data } = await useFetch('/api/matters', {
    transform: (matters) => matters.slice(0, 20) // Limit SSR payload
  })
})

// SPA sections - Use TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['matters-full'],
  queryFn: fetchAllMatters,
  enabled: process.client // Only run on client
})
```

### Performance Optimizations
```typescript
// Lazy load heavy components
const DocumentEditor = defineAsyncComponent(() =>
  import('~/components/DocumentEditor.vue')
)

// Preload critical routes
useRouter().preloadRoute('/matters')

// Progressive hydration
<LazyHydrate when-visible>
  <MatterCard v-for="matter in matters" :key="matter.id" />
</LazyHydrate>
```

### Error Handling
```vue
<!-- error.vue -->
<script setup>
const props = defineProps<{
  error: Error
}>()

// Different error handling for SSR vs SPA
const isSSRError = process.server || !process.client

if (isSSRError) {
  // Log to server monitoring
  console.error('SSR Error:', props.error)
} else {
  // Send to client error tracking
  trackError(props.error)
}
</script>
```

## References
- [Nuxt 3 Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering)
- [Route Rules Documentation](https://nuxt.com/docs/guide/concepts/routing#route-rules)
- [Hybrid Rendering Patterns](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering)
- Web Vitals best practices
- ADR-001: Frontend Framework Migration

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted for hybrid rendering approach