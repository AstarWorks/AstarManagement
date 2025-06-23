# T08_S07 - SSR Optimization for Kanban Dashboard

## Task Overview
Implement comprehensive server-side rendering optimizations for the kanban dashboard to improve initial load performance, SEO, and user experience while maintaining real-time functionality.

## Current Status: 🔴 Not Started

## Objectives
- [ ] Implement Nuxt 3 SSR patterns for kanban dashboard
- [ ] Ensure hydration safety for complex interactive components
- [ ] Design and implement cache strategies for kanban data
- [ ] Optimize performance for large datasets
- [ ] Maintain real-time updates with SSR

## Technical Requirements

### 1. SSR Architecture for Kanban
```typescript
// server/api/kanban/board.get.ts
export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const { projectId } = query
  
  // Fetch kanban data with optimized query
  const [columns, matters, users] = await Promise.all([
    fetchKanbanColumns(projectId),
    fetchKanbanMatters(projectId),
    fetchAssignedUsers(projectId)
  ])
  
  return {
    columns,
    matters,
    users,
    timestamp: Date.now()
  }
}, {
  maxAge: 60, // Cache for 1 minute
  name: 'kanban-board',
  getKey: (event) => {
    const query = getQuery(event)
    return `kanban:${query.projectId}`
  }
})
```

### 2. Hydration-Safe Components
```vue
<!-- components/kanban/KanbanBoard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { KanbanColumn, Matter } from '~/types/kanban'

const props = defineProps<{
  initialData?: {
    columns: KanbanColumn[]
    matters: Matter[]
  }
}>()

// Use SSR data if available, otherwise fetch client-side
const { data: kanbanData, pending, refresh } = await useFetch('/api/kanban/board', {
  query: { projectId: route.params.projectId },
  server: true,
  lazy: true,
  default: () => props.initialData
})

// Hydration-safe drag state
const isDragging = ref(false)
const draggedMatter = ref<Matter | null>(null)

// Only initialize drag handlers after hydration
onMounted(() => {
  if (process.client) {
    initializeDragAndDrop()
  }
})

// Optimistic updates with rollback
const moveMatter = async (matterId: string, targetColumnId: string) => {
  const originalData = { ...kanbanData.value }
  
  // Optimistic update
  updateLocalState(matterId, targetColumnId)
  
  try {
    await $fetch('/api/kanban/move', {
      method: 'POST',
      body: { matterId, targetColumnId }
    })
  } catch (error) {
    // Rollback on error
    kanbanData.value = originalData
    throw error
  }
}
</script>

<template>
  <div class="kanban-board" :class="{ 'is-dragging': isDragging }">
    <!-- Loading skeleton for SSR -->
    <template v-if="pending">
      <div class="kanban-skeleton">
        <div v-for="i in 4" :key="i" class="column-skeleton">
          <div class="column-header-skeleton" />
          <div v-for="j in 3" :key="j" class="card-skeleton" />
        </div>
      </div>
    </template>
    
    <!-- Kanban columns -->
    <template v-else>
      <ClientOnly>
        <template #fallback>
          <!-- Static version for SSR -->
          <div class="kanban-static">
            <div v-for="column in kanbanData.columns" :key="column.id" class="kanban-column">
              <h3>{{ column.title }}</h3>
              <div class="matters-list">
                <div v-for="matter in getMattersForColumn(column.id)" :key="matter.id" class="matter-card">
                  {{ matter.title }}
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Interactive version for client -->
        <KanbanInteractive
          :columns="kanbanData.columns"
          :matters="kanbanData.matters"
          @move="moveMatter"
        />
      </ClientOnly>
    </template>
  </div>
</template>
```

### 3. State Management with SSR
```typescript
// stores/kanban.ts
export const useKanbanStore = defineStore('kanban', () => {
  const nuxtApp = useNuxtApp()
  
  // SSR-safe state initialization
  const kanbanState = useState<KanbanState>('kanban.state', () => ({
    columns: [],
    matters: [],
    filters: {},
    view: 'board'
  }))
  
  // Hydrate from SSR payload
  if (process.server && nuxtApp.ssrContext?.payload?.kanban) {
    kanbanState.value = nuxtApp.ssrContext.payload.kanban
  }
  
  // Real-time updates (client-only)
  if (process.client) {
    const { $pusher } = useNuxtApp()
    
    onMounted(() => {
      const channel = $pusher.subscribe(`kanban-${projectId}`)
      channel.bind('matter-moved', handleMatterMoved)
      channel.bind('matter-updated', handleMatterUpdated)
    })
  }
  
  return {
    ...kanbanState.value,
    moveMatter,
    updateMatter
  }
})
```

### 4. Cache Strategies
```typescript
// server/api/kanban/matters.get.ts
export default defineEventHandler(async (event) => {
  const storage = useStorage('redis')
  const query = getQuery(event)
  const cacheKey = `kanban:matters:${query.projectId}`
  
  // Try cache first
  const cached = await storage.getItem(cacheKey)
  if (cached && !query.force) {
    setHeader(event, 'x-cache', 'hit')
    return cached
  }
  
  // Fetch from database
  const matters = await fetchMattersWithRelations(query.projectId)
  
  // Cache with TTL
  await storage.setItem(cacheKey, matters, {
    ttl: 300 // 5 minutes
  })
  
  setHeader(event, 'x-cache', 'miss')
  return matters
})

// Invalidation on updates
export const invalidateKanbanCache = async (projectId: string) => {
  const storage = useStorage('redis')
  const keys = await storage.getKeys(`kanban:*:${projectId}`)
  await Promise.all(keys.map(key => storage.removeItem(key)))
}
```

### 5. Performance Optimizations

#### Virtual Scrolling for Large Boards
```vue
<!-- components/kanban/VirtualKanbanColumn.vue -->
<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

const props = defineProps<{
  matters: Matter[]
  columnId: string
}>()

const containerRef = ref<HTMLElement>()
const itemHeight = 120 // Fixed height for matter cards

const { list, containerProps, wrapperProps } = useVirtualList(
  props.matters,
  {
    itemHeight,
    overscan: 3
  }
)
</script>

<template>
  <div ref="containerRef" class="kanban-column" v-bind="containerProps">
    <div v-bind="wrapperProps">
      <div
        v-for="{ data, index } in list"
        :key="data.id"
        :style="{ height: `${itemHeight}px` }"
      >
        <MatterCard :matter="data" :column-id="columnId" />
      </div>
    </div>
  </div>
</template>
```

#### Progressive Enhancement
```typescript
// composables/useProgressiveKanban.ts
export const useProgressiveKanban = () => {
  const isHighPerformance = ref(true)
  
  onMounted(() => {
    // Detect device capabilities
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      isHighPerformance.value = 
        connection.effectiveType === '4g' &&
        !connection.saveData
    }
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    
    if (prefersReducedMotion) {
      isHighPerformance.value = false
    }
  })
  
  return {
    enableAnimations: computed(() => isHighPerformance.value),
    enableRealtime: computed(() => isHighPerformance.value),
    virtualScrollThreshold: computed(() => 
      isHighPerformance.value ? 100 : 50
    )
  }
}
```

### 6. SSR Data Fetching Patterns

#### Parallel Data Loading
```typescript
// pages/kanban/[projectId].vue
<script setup lang="ts">
const route = useRoute()
const projectId = route.params.projectId as string

// Parallel data fetching with proper error handling
const [
  { data: kanbanData, error: kanbanError },
  { data: projectData, error: projectError },
  { data: userData, error: userError }
] = await Promise.all([
  useFetch(`/api/kanban/board?projectId=${projectId}`),
  useFetch(`/api/projects/${projectId}`),
  useFetch('/api/users/current')
])

// Handle errors gracefully
if (kanbanError.value || projectError.value) {
  throw createError({
    statusCode: kanbanError.value?.statusCode || 500,
    statusMessage: 'Failed to load kanban board'
  })
}

// Provide data to child components
provide('kanbanData', kanbanData)
provide('projectData', projectData)
</script>
```

#### Streaming SSR for Large Datasets
```typescript
// server/api/kanban/stream.get.ts
export default defineEventHandler(async (event) => {
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      controller.enqueue(JSON.stringify({
        type: 'columns',
        data: await fetchKanbanColumns()
      }) + '\n')
      
      // Stream matters in batches
      const matters = await fetchMattersInBatches()
      for (const batch of matters) {
        controller.enqueue(JSON.stringify({
          type: 'matters',
          data: batch
        }) + '\n')
      }
      
      controller.close()
    }
  })
  
  return sendStream(event, stream)
})
```

### 7. Hydration Mismatch Prevention

```vue
<!-- components/kanban/HydrationSafeDraggable.vue -->
<script setup lang="ts">
const isHydrated = ref(false)

onMounted(() => {
  nextTick(() => {
    isHydrated.value = true
  })
})

// Use teleport for drag preview to avoid hydration issues
const dragPreview = ref<HTMLElement>()
</script>

<template>
  <div class="draggable-container">
    <!-- Static content for SSR -->
    <div v-if="!isHydrated" class="static-card">
      <slot />
    </div>
    
    <!-- Interactive content after hydration -->
    <div
      v-else
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      class="draggable-card"
    >
      <slot />
    </div>
    
    <!-- Teleport drag preview to body -->
    <Teleport to="body">
      <div
        v-if="isDragging"
        ref="dragPreview"
        class="drag-preview"
        :style="previewStyle"
      >
        <slot name="preview" />
      </div>
    </Teleport>
  </div>
</template>
```

## Testing Requirements

### 1. SSR Testing
```typescript
// tests/ssr/kanban.test.ts
import { setup, $fetch } from '@nuxt/test-utils'

describe('Kanban SSR', () => {
  setup({
    server: true,
    browser: false
  })
  
  test('renders kanban board on server', async () => {
    const html = await $fetch('/kanban/test-project')
    
    expect(html).toContain('kanban-board')
    expect(html).toContain('data-server-rendered="true"')
    expect(html).not.toContain('kanban-skeleton')
  })
  
  test('includes necessary data in payload', async () => {
    const html = await $fetch('/kanban/test-project')
    const payload = extractPayload(html)
    
    expect(payload.kanban).toBeDefined()
    expect(payload.kanban.columns).toHaveLength(4)
    expect(payload.kanban.matters).toBeDefined()
  })
})
```

### 2. Hydration Testing
```typescript
// tests/e2e/kanban-hydration.test.ts
import { test, expect } from '@playwright/test'

test('kanban hydrates without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  await page.goto('/kanban/test-project')
  await page.waitForLoadState('networkidle')
  
  // Check for hydration errors
  expect(errors).toHaveLength(0)
  
  // Verify interactive features work
  const card = page.locator('.matter-card').first()
  await card.dragTo(page.locator('.kanban-column').nth(1))
  
  // Verify optimistic update
  await expect(card).toBeVisible()
})
```

## Performance Targets

- **Initial Load**: < 1.5s for SSR page
- **Time to Interactive**: < 3s on 3G
- **Hydration Time**: < 500ms
- **Cache Hit Rate**: > 80%
- **Real-time Latency**: < 100ms

## Implementation Checklist

- [ ] Set up SSR data fetching for kanban
- [ ] Implement hydration-safe components
- [ ] Configure Redis caching layer
- [ ] Add virtual scrolling for large boards
- [ ] Implement progressive enhancement
- [ ] Set up streaming SSR for large datasets
- [ ] Add comprehensive error boundaries
- [ ] Configure cache invalidation strategies
- [ ] Implement performance monitoring
- [ ] Add SSR and hydration tests

## Best Practices

### 1. SSR Optimization
- Use `useFetch` with `server: true` for SSR data
- Implement proper loading states
- Cache API responses aggressively
- Stream large datasets when possible

### 2. Hydration Safety
- Avoid browser-only APIs during SSR
- Use `ClientOnly` for interactive components
- Ensure consistent rendered output
- Handle async state properly

### 3. Performance
- Implement virtual scrolling for large lists
- Use progressive enhancement
- Optimize bundle size with code splitting
- Leverage HTTP caching headers

### 4. Real-time Updates
- Gracefully degrade when offline
- Implement optimistic updates
- Use WebSockets/SSE for real-time data
- Batch updates to prevent flickering

## Dependencies

- Nuxt 3 SSR capabilities
- Redis for caching
- @vueuse/core for virtual scrolling
- WebSocket/Pusher for real-time updates

## References

- [Nuxt 3 SSR Documentation](https://nuxt.com/docs/guide/concepts/rendering)
- [Vue 3 SSR Guide](https://vuejs.org/guide/scaling-up/ssr.html)
- [Hydration Mismatch Prevention](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)
- [Nuxt Caching Strategies](https://nuxt.com/docs/guide/going-further/experimental-features#cachedefineeventhandler)