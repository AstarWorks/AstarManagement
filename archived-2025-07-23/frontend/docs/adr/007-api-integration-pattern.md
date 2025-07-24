# ADR-007: API Integration Pattern - TanStack Query with Nuxt

## Status
Accepted

## Context
The Aster Management frontend needs a robust API integration pattern that provides:
- Efficient data fetching and caching
- Optimistic updates for better UX (especially for Kanban board)
- Background refetching to keep data fresh
- Request deduplication
- Error handling and retry logic
- TypeScript support
- SSR compatibility with Nuxt 3
- Integration with our Spring Boot backend

Nuxt 3 provides `useFetch` and `$fetch`, but for complex applications, we need more advanced features like cache invalidation, optimistic updates, and request coordination.

## Decision
We will use TanStack Query (formerly React Query) Vue edition for API state management, complementing Nuxt's built-in fetch utilities.

Implementation approach:
- TanStack Query for complex client-side data management
- Nuxt's `useFetch` for simple SSR data fetching
- Custom API client with interceptors
- Type-safe API calls using generated types
- Optimistic updates for Kanban operations

## Consequences

### Positive
- Powerful caching and synchronization capabilities
- Optimistic updates improve perceived performance
- Automatic background refetching
- Built-in loading and error states
- Request deduplication prevents redundant API calls
- Excellent DevTools for debugging
- Migration path from React Query is straightforward
- Works well with TypeScript

### Negative
- Additional dependency to maintain
- Learning curve for team unfamiliar with TanStack Query
- Need to coordinate with Nuxt's SSR hydration
- Adds complexity compared to simple fetch

### Neutral
- Need to decide when to use TanStack Query vs Nuxt's utilities
- Cache invalidation strategies need to be defined
- Bundle size increase (~25kb)

## Alternatives Considered

### Alternative 1: Nuxt Built-in Fetch Only
- **Pros**: No additional dependencies, SSR-optimized, simple
- **Cons**: Limited caching, no optimistic updates, basic features
- **Reason for rejection**: Insufficient for complex Kanban interactions

### Alternative 2: Pinia + Custom Solution
- **Pros**: Already using Pinia, full control
- **Cons**: Need to build caching, refetching, and optimization ourselves
- **Reason for rejection**: Reinventing well-solved problems

### Alternative 3: Apollo Client (GraphQL)
- **Pros**: Powerful features, excellent caching, subscriptions
- **Cons**: Requires GraphQL backend, larger bundle, complexity
- **Reason for rejection**: Backend uses REST, not GraphQL

### Alternative 4: SWR Vue
- **Pros**: Lightweight, simple API, React SWR port
- **Cons**: Less mature in Vue ecosystem, fewer features
- **Reason for rejection**: TanStack Query more feature-complete

## Implementation Notes

### Setup and Configuration
```typescript
// plugins/tanstack-query.ts
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        refetchOnWindowFocus: true,
      },
    },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
```

### API Client Setup
```typescript
// utils/api-client.ts
export const apiClient = $fetch.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  onRequest({ options }) {
    const token = useAuthStore().token
    if (token) {
      options.headers.Authorization = `Bearer ${token}`
    }
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      navigateTo('/login')
    }
  },
})
```

### Usage Pattern
```typescript
// composables/useMatters.ts
export const useMatters = () => {
  return useQuery({
    queryKey: ['matters'],
    queryFn: () => apiClient<Matter[]>('/matters'),
  })
}

export const useMatterUpdate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (matter: Matter) => 
      apiClient(`/matters/${matter.id}`, {
        method: 'PUT',
        body: matter,
      }),
    onMutate: async (updatedMatter) => {
      // Optimistic update
      await queryClient.cancelQueries(['matters'])
      const previousMatters = queryClient.getQueryData(['matters'])
      
      queryClient.setQueryData(['matters'], (old: Matter[]) =>
        old.map(m => m.id === updatedMatter.id ? updatedMatter : m)
      )
      
      return { previousMatters }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['matters'], context.previousMatters)
    },
    onSettled: () => {
      queryClient.invalidateQueries(['matters'])
    },
  })
}
```

### SSR Considerations
```typescript
// pages/matters/index.vue
<script setup>
// Use Nuxt's useFetch for SSR
const { data: initialMatters } = await useFetch('/api/matters')

// Use TanStack Query for client-side updates
const { data: matters, refetch } = useMatters()

// Hydrate TanStack Query with SSR data
onMounted(() => {
  queryClient.setQueryData(['matters'], initialMatters.value)
})
</script>
```

## References
- [TanStack Query Vue Documentation](https://tanstack.com/query/latest/docs/vue/overview)
- [Nuxt 3 Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)
- [API State Management Patterns](https://tkdodo.eu/blog/practical-react-query)
- ADR-002: State Management Solution (Pinia)
- ADR-006: TypeScript Configuration Strategy

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted for advanced API state management