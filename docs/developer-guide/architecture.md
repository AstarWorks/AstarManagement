# Frontend Architecture - Aster Management

This document outlines the frontend architecture for the Aster Management Nuxt.js application, including design principles, patterns, and technical decisions.

## Architecture Overview

The Aster Management frontend is built as a modern single-page application (SPA) with server-side rendering (SSR) capabilities using Nuxt.js 3. The architecture emphasizes modularity, type safety, performance, and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Nuxt.js Application                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   Pages     │  │ Components  │  │  Layouts    │    │ │
│  │  │ (Routes)    │  │   (UI)      │  │ (Structure) │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ Composables │  │   Stores    │  │ Middleware  │    │ │
│  │  │ (Logic)     │  │  (State)    │  │ (Guards)    │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────┴───────────────────────────────────────┐
│                 Backend APIs (Spring Boot)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   REST API  │  │  WebSocket  │  │   GraphQL   │        │
│  │             │  │  (Real-time)│  │ (Optional)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Core Design Principles

#### 1. Agent-Native Architecture
The frontend is designed to support both human users and AI agents as first-class citizens:

- **Programmatic Interface**: Every UI operation has a corresponding API endpoint
- **State Observability**: All application state is accessible and auditable
- **Command Pattern**: Actions are structured as discrete, traceable commands
- **Documentation-Driven**: Self-documenting interfaces for AI consumption

#### 2. Composition Over Inheritance
Following Vue 3's Composition API philosophy:

- **Composables**: Reusable business logic encapsulated in composable functions
- **Component Composition**: Complex components built from simpler, focused components
- **Functional Programming**: Pure functions and immutable data patterns where possible

#### 3. Type-First Development
Comprehensive TypeScript coverage ensures reliability:

- **Strict TypeScript**: All code must pass strict type checking
- **Runtime Validation**: Zod schemas for API contracts and form validation
- **Type Inference**: Leverage TypeScript's inference capabilities
- **Generic Patterns**: Reusable type-safe patterns for common operations

#### 4. Performance by Design
Architecture optimized for speed and efficiency:

- **Lazy Loading**: Components and routes loaded on demand
- **Code Splitting**: Automatic bundle optimization
- **Caching Strategy**: Multi-layer caching (browser, CDN, application)
- **Minimal Re-renders**: Optimized reactivity patterns

## Technology Stack

### Core Framework
- **Nuxt.js 3.17.5**: Full-stack Vue framework with SSR/SSG capabilities
- **Vue 3**: Modern reactive framework with Composition API
- **TypeScript 5**: Static type checking and enhanced developer experience

### State Management
- **Pinia 2.0**: Vue-native state management with TypeScript support
- **TanStack Query**: Server state management with caching and synchronization
- **VueUse**: Collection of essential Vue composition utilities

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn-vue**: High-quality accessible components
- **Radix Vue**: Unstyled, accessible component primitives
- **Lucide Vue**: Consistent icon system

### Development Tools
- **Bun 1.2.16**: Fast package manager and build tool
- **Vite**: Lightning-fast build tool and dev server
- **Vitest**: Fast unit testing framework
- **Playwright**: Reliable end-to-end testing
- **Storybook**: Component development and documentation

## Application Structure

### Directory Architecture

```
frontend-nuxt-poc/
├── components/              # Vue components
│   ├── ui/                 # shadcn-vue base components
│   ├── forms/              # Form-specific components
│   ├── layout/             # Layout components
│   ├── charts/             # Data visualization
│   └── legal/              # Domain-specific components
├── composables/            # Reusable composition functions
│   ├── api/               # API interaction composables
│   ├── auth/              # Authentication logic
│   ├── forms/             # Form handling
│   └── utils/             # Utility composables
├── layouts/               # Nuxt layout components
├── middleware/            # Route middleware
├── pages/                 # File-based routing
│   ├── auth/             # Authentication pages
│   ├── cases/            # Case management
│   ├── documents/        # Document management
│   └── dashboard/        # Dashboard pages
├── plugins/              # Nuxt plugins
├── server/               # Server-side API routes
├── stores/               # Pinia stores
│   ├── auth.ts          # Authentication state
│   ├── cases.ts         # Case management state
│   └── ui.ts            # UI state (sidebar, modals, etc.)
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── assets/               # Static assets
    ├── css/             # Global styles
    └── images/          # Image assets
```

### Component Architecture

Components are organized in a hierarchical structure following atomic design principles:

#### 1. Base Components (`components/ui/`)
Foundational, reusable components based on shadcn-vue:

```typescript
// components/ui/Button.vue
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
}
```

#### 2. Form Components (`components/forms/`)
Specialized form components with validation:

```typescript
// components/forms/CaseForm.vue
export interface CaseFormProps {
  case?: Partial<Case>
  readonly?: boolean
  onSubmit: (case: Case) => void
}
```

#### 3. Feature Components (`components/legal/`)
Domain-specific components for legal workflows:

```typescript
// components/legal/KanbanBoard.vue
export interface KanbanBoardProps {
  cases: Case[]
  columns: KanbanColumn[]
  onCaseMove: (caseId: string, newStatus: string) => void
}
```

### State Management Architecture

#### Pinia Stores
Domain-specific stores for application state:

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  const isAuthenticated = computed(() => !!token.value)
  
  const login = async (credentials: LoginCredentials) => {
    // Authentication logic
  }
  
  return { user, token, isAuthenticated, login }
})
```

#### TanStack Query Integration
Server state management with caching:

```typescript
// composables/api/useCases.ts
export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: () => $fetch('/api/cases'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCase(id: string) {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: () => $fetch(`/api/cases/${id}`),
    enabled: !!id,
  })
}
```

## Data Flow Patterns

### Request/Response Flow

```
User Action → Component → Composable → API → Backend
    ↓
UI Update ← Store Update ← Response ← Processing ← Database
```

### State Synchronization

1. **Optimistic Updates**: UI updates immediately, reverts on error
2. **Cache Invalidation**: Smart invalidation based on data relationships
3. **Real-time Sync**: WebSocket updates for collaborative features
4. **Offline Support**: Queue actions when offline, sync when online

### Example: Case Creation Flow

```typescript
// pages/cases/new.vue
<script setup lang="ts">
const { mutate: createCase, isPending } = useCreateCase()

const handleSubmit = async (caseData: CreateCaseRequest) => {
  try {
    await createCase(caseData)
    await navigateTo('/cases')
  } catch (error) {
    // Error handling
  }
}
</script>

// composables/api/useCases.ts
export function useCreateCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCaseRequest) => 
      $fetch('/api/cases', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    }
  })
}
```

## Security Architecture

### Authentication Flow

```
Client → Auth Guard → Token Validation → API Access
  ↓
Login → JWT Token → Store in HttpOnly Cookie → Auto-refresh
```

### Security Measures

1. **JWT Tokens**: Secure token-based authentication
2. **CSRF Protection**: Anti-forgery tokens for state-changing operations
3. **XSS Prevention**: Content Security Policy and input sanitization
4. **Route Guards**: Middleware for authenticated routes
5. **API Validation**: Request/response validation with Zod schemas

### Implementation Example

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return navigateTo('/auth/login')
  }
})

// composables/auth/useAuth.ts
export function useAuth() {
  const refreshToken = async () => {
    const { data } = await $fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
    return data
  }
  
  return { refreshToken }
}
```

## Performance Architecture

### Loading Strategies

1. **Route-based Code Splitting**: Automatic splitting by pages
2. **Component Lazy Loading**: Dynamic imports for heavy components
3. **Image Optimization**: Next-gen formats with fallbacks
4. **Bundle Analysis**: Regular analysis of bundle size

### Caching Strategy

```
Browser Cache → CDN → Application Cache → API Cache → Database
     ↓              ↓           ↓            ↓          ↓
  Static Assets  Images    Component State  Queries   Data
```

### Performance Monitoring

```typescript
// plugins/performance.client.ts
export default defineNuxtPlugin(() => {
  // Core Web Vitals monitoring
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    })
  }
})
```

## Error Handling Architecture

### Error Boundaries

```typescript
// composables/useErrorHandler.ts
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    // Log error
    console.error('Error in', context, error)
    
    // Show user-friendly message
    const toast = useToast()
    toast.error('Something went wrong. Please try again.')
    
    // Report to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }
  }
  
  return { handleError }
}
```

### API Error Handling

```typescript
// plugins/api.ts
export default defineNuxtPlugin(() => {
  $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) {
        // Redirect to login
        navigateTo('/auth/login')
      } else if (response.status >= 500) {
        // Show generic error
        useToast().error('Server error. Please try again later.')
      }
    }
  })
})
```

## Testing Architecture

### Testing Strategy

1. **Unit Tests**: Composables and utility functions
2. **Component Tests**: Vue components with Vue Test Utils
3. **Integration Tests**: API integration and state management
4. **E2E Tests**: Critical user flows with Playwright

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── composables/      # Composable tests
│   └── utils/            # Utility function tests
├── components/           # Component tests
├── integration/          # Integration tests
└── e2e/                 # End-to-end tests
```

## Accessibility Architecture

### WCAG 2.1 AA Compliance

1. **Semantic HTML**: Proper use of HTML elements
2. **ARIA Labels**: Screen reader support
3. **Keyboard Navigation**: Full keyboard accessibility
4. **Color Contrast**: Minimum 4.5:1 contrast ratio
5. **Focus Management**: Logical focus order

### Implementation

```vue
<template>
  <div class="kanban-board" role="application" aria-label="Case management board">
    <div
      v-for="column in columns"
      :key="column.id"
      class="kanban-column"
      role="region"
      :aria-label="column.title"
    >
      <h2 :id="`column-${column.id}`">{{ column.title }}</h2>
      <ul
        role="list"
        :aria-labelledby="`column-${column.id}`"
        @keydown="handleColumnKeydown"
      >
        <li
          v-for="case in column.cases"
          :key="case.id"
          role="listitem"
          tabindex="0"
          @keydown="handleCaseKeydown"
        >
          <CaseCard :case="case" />
        </li>
      </ul>
    </div>
  </div>
</template>
```

## Internationalization Architecture

### i18n Strategy

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'ja', iso: 'ja-JP', name: '日本語' }
    ],
    defaultLocale: 'ja',
    strategy: 'prefix_except_default'
  }
})

// locales/en.json
{
  "cases": {
    "title": "Legal Cases",
    "status": {
      "draft": "Draft",
      "active": "Active",
      "completed": "Completed"
    }
  }
}
```

## Deployment Architecture

### Build Process

```
Source Code → TypeScript Compilation → Bundle Generation → Optimization → Deployment
     ↓              ↓                      ↓                ↓              ↓
  Type Check    Tree Shaking         Code Splitting    Minification    CDN Upload
```

### Environment Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (only available on server-side)
    jwtSecret: process.env.JWT_SECRET,
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      wsUrl: process.env.NUXT_PUBLIC_WS_URL
    }
  }
})
```

## Monitoring and Observability

### Application Monitoring

1. **Performance Monitoring**: Core Web Vitals tracking
2. **Error Tracking**: Automatic error reporting
3. **User Analytics**: Usage patterns and behavior
4. **Business Metrics**: Feature adoption and success rates

### Implementation

```typescript
// plugins/monitoring.client.ts
export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'production') {
    // Initialize monitoring services
    // Sentry, Google Analytics, etc.
  }
})
```

## Future Architecture Considerations

### Planned Enhancements

1. **Micro-frontends**: Module federation for large teams
2. **Progressive Web App**: Offline capabilities and native feel
3. **Service Workers**: Advanced caching and background sync
4. **WebAssembly**: Performance-critical computations
5. **Edge Computing**: CDN-based server-side rendering

### Scalability Patterns

1. **Horizontal Scaling**: Load balancing across multiple instances
2. **CDN Distribution**: Global content delivery
3. **Database Optimization**: Query optimization and caching
4. **API Rate Limiting**: Prevent abuse and ensure stability

---

This architecture provides a solid foundation for building scalable, maintainable, and performant legal case management software while ensuring excellent developer experience and user satisfaction.