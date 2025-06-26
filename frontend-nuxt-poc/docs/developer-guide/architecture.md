# Architecture Overview

This document provides a comprehensive overview of the Aster Management frontend architecture, design principles, and technical decisions.

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                 Nuxt.js Application                  │     │
│  │  ┌───────────┐  ┌──────────┐  ┌────────────────┐  │     │
│  │  │   Pages   │  │Components│  │  Composables   │  │     │
│  │  └───────────┘  └──────────┘  └────────────────┘  │     │
│  │  ┌───────────┐  ┌──────────┐  ┌────────────────┐  │     │
│  │  │  Stores   │  │ Plugins  │  │  Middleware    │  │     │
│  │  │  (Pinia)  │  │(VueQuery)│  │  (Auth/RBAC)   │  │     │
│  │  └───────────┘  └──────────┘  └────────────────┘  │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/WebSocket
┌─────────────────────────────┴───────────────────────────────┐
│                    API Gateway (nginx)                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                 Spring Boot Backend                           │
│  ┌───────────┐  ┌──────────┐  ┌────────────────┐           │
│  │   REST    │  │WebSocket │  │   Services      │           │
│  │   APIs    │  │   Hub    │  │   (Business)    │           │
│  └───────────┘  └──────────┘  └────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Core Design Principles

### 1. Component-Based Architecture

Every UI element is a self-contained component with:
- Clear responsibilities
- Defined props interface
- Isolated styling
- Comprehensive tests

```vue
<!-- Example: Well-architected component -->
<script setup lang="ts">
interface Props {
  matter: Matter
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [matter: Matter]
  delete: [id: string]
}>()

// Component logic here
</script>

<template>
  <div class="matter-card">
    <!-- Template here -->
  </div>
</template>

<style scoped>
/* Scoped styles */
</style>
```

### 2. Composition Over Inheritance

We use Vue 3's Composition API for:
- Reusable logic extraction
- Better TypeScript support
- Cleaner code organization
- Easier testing

```typescript
// composables/useMatter.ts
export const useMatter = (matterId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['matter', matterId],
    queryFn: () => fetchMatter(matterId)
  })

  const updateMatter = useMutation({
    mutationFn: (updates: Partial<Matter>) => 
      updateMatterAPI(matterId, updates)
  })

  return {
    matter: data,
    isLoading,
    error,
    updateMatter
  }
}
```

### 3. Type Safety First

Full TypeScript coverage ensures:
- Compile-time error detection
- Better IDE support
- Self-documenting code
- Easier refactoring

```typescript
// types/matter.ts
export interface Matter {
  id: string
  title: string
  status: MatterStatus
  priority: MatterPriority
  assignee?: User
  createdAt: Date
  updatedAt: Date
}

export type MatterStatus = 
  | 'DRAFT' 
  | 'IN_PROGRESS' 
  | 'REVIEW' 
  | 'COMPLETED'
```

### 4. Performance by Default

Performance optimizations are built-in:
- Code splitting per route
- Lazy loading components
- Image optimization
- Bundle size monitoring

## Frontend Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │ ← Pages, Components
├─────────────────────────────────────┤
│         Business Logic Layer        │ ← Composables, Utils
├─────────────────────────────────────┤
│         State Management Layer      │ ← Pinia, TanStack Query
├─────────────────────────────────────┤
│         API Integration Layer       │ ← API clients, WebSocket
└─────────────────────────────────────┘
```

### 2. Data Flow Architecture

```
User Action → Component → Composable → Store/Query → API
     ↑                                                ↓
     └──────── Re-render ← State Update ← Response ←┘
```

### 3. Component Hierarchy

```
App.vue
├── Layouts/
│   ├── default.vue
│   └── mobile.vue
├── Pages/
│   ├── index.vue
│   ├── kanban.vue
│   └── matters/
│       ├── index.vue
│       └── [id].vue
└── Components/
    ├── kanban/
    │   ├── KanbanBoard.vue
    │   ├── KanbanColumn.vue
    │   └── MatterCard.vue
    └── forms/
        ├── MatterForm.vue
        └── FormInput.vue
```

## State Management Architecture

### Client State vs Server State

We separate concerns between:

**Client State (Pinia)**
- UI state (modals, sidebars)
- User preferences
- Temporary form data
- Local settings

**Server State (TanStack Query)**
- API data
- Cached responses
- Background refetching
- Optimistic updates

### State Management Patterns

```typescript
// stores/ui.ts - Client state
export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const activeModal = ref<string | null>(null)
  
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  return { sidebarOpen, activeModal, toggleSidebar }
})

// composables/useMatters.ts - Server state
export const useMatters = () => {
  return useQuery({
    queryKey: ['matters'],
    queryFn: fetchMatters,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}
```

## Rendering Modes

### Server-Side Rendering (SSR)

Default for most pages:
- Better SEO
- Faster initial load
- Progressive enhancement

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,
  nitro: {
    prerender: {
      routes: ['/'] // Pre-render static pages
    }
  }
})
```

### Client-Side Rendering (CSR)

Used for interactive features:
- Kanban board
- Real-time updates
- Complex forms

```vue
<!-- pages/kanban.vue -->
<template>
  <ClientOnly>
    <KanbanBoard />
    <template #fallback>
      <KanbanSkeleton />
    </template>
  </ClientOnly>
</template>
```

## Security Architecture

### Authentication Flow

```
Login → JWT Token → Store in Cookie → Auto-attach to Requests
                ↓
          Refresh Token → Rotate on Expiry
```

### Authorization Model

Role-based access control (RBAC):
- **Lawyer**: Full access
- **Clerk**: Limited write access
- **Client**: Read-only access

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { user, hasPermission } = useAuth()
  
  if (!user.value) {
    return navigateTo('/login')
  }
  
  if (!hasPermission(to.meta.permission)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions'
    })
  }
})
```

## API Integration Architecture

### REST API Pattern

```typescript
// utils/api.ts
export const api = $fetch.create({
  baseURL: '/api',
  onRequest({ options }) {
    const { token } = useAuth()
    if (token.value) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token.value}`
      }
    }
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      return navigateTo('/login')
    }
  }
})
```

### WebSocket Integration

```typescript
// plugins/websocket.client.ts
export default defineNuxtPlugin(() => {
  const ws = new WebSocket(config.wsUrl)
  
  ws.onmessage = (event) => {
    const { type, payload } = JSON.parse(event.data)
    
    switch (type) {
      case 'MATTER_UPDATED':
        queryClient.invalidateQueries(['matter', payload.id])
        break
      case 'NEW_NOTIFICATION':
        useNotificationStore().add(payload)
        break
    }
  }
  
  return { provide: { ws } }
})
```

## Performance Architecture

### Code Splitting Strategy

```typescript
// Automatic route-based splitting
pages/
  index.vue        → /
  kanban.vue       → /kanban (separate chunk)
  matters/
    index.vue      → /matters (separate chunk)
    [id].vue       → /matters/:id (separate chunk)
```

### Lazy Loading Components

```vue
<script setup>
// Heavy component loaded on demand
const HeavyChart = defineAsyncComponent(() => 
  import('~/components/analytics/HeavyChart.vue')
)

const showChart = ref(false)
</script>

<template>
  <button @click="showChart = true">Show Analytics</button>
  <HeavyChart v-if="showChart" />
</template>
```

### Caching Strategy

1. **Browser Cache**: Static assets with long cache headers
2. **CDN Cache**: Edge caching for global performance
3. **API Cache**: TanStack Query for intelligent caching
4. **Service Worker**: Offline support and background sync

## Error Handling Architecture

### Global Error Handling

```vue
<!-- error.vue -->
<script setup>
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage: string
  }
}>()

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>
```

### Component Error Boundaries

```vue
<script setup>
import { onErrorCaptured } from 'vue'

onErrorCaptured((error) => {
  console.error('Component error:', error)
  // Log to error tracking service
  return false // Prevent propagation
})
</script>
```

## Testing Architecture

### Testing Pyramid

```
        /\
       /  \   E2E Tests (Playwright)
      /────\
     /      \  Integration Tests (Vitest)
    /────────\
   /          \  Unit Tests (Vitest + Vue Test Utils)
  /────────────\
```

### Test Organization

```
tests/
├── unit/           # Component and utility tests
├── integration/    # Store and API integration tests
├── e2e/           # End-to-end user journey tests
└── performance/   # Performance and load tests
```

## Deployment Architecture

### Build Pipeline

```
Code Push → GitHub Actions → Build → Test → Deploy
                                ↓
                            Docker Image → Registry
                                           ↓
                                    Kubernetes Cluster
```

### Environment Strategy

- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: Optimized build with monitoring

## Monitoring Architecture

### Observability Stack

1. **Application Monitoring**: Sentry for error tracking
2. **Performance Monitoring**: Web Vitals tracking
3. **User Analytics**: Privacy-focused analytics
4. **Logging**: Structured logging to ELK stack

## Scalability Considerations

### Horizontal Scaling

- Stateless application design
- Session storage in Redis
- Load balancing with nginx
- CDN for static assets

### Vertical Scaling

- Optimized bundle sizes
- Efficient rendering
- Memory leak prevention
- Database query optimization

## Future Architecture Considerations

### Potential Enhancements

1. **Micro-frontends**: Split by domain
2. **PWA Features**: Offline-first capabilities
3. **GraphQL Integration**: More efficient data fetching
4. **Edge Computing**: Deploy closer to users

### Technology Radar

- **Adopt**: Vue 3, Nuxt 3, TypeScript, Tailwind CSS
- **Trial**: Web Components, Module Federation
- **Assess**: Qwik, Solid.js, Astro
- **Hold**: Class components, Options API