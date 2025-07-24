# TanStack Query Integration Guide

## Overview

This document describes the integration patterns for using TanStack Query alongside existing Pinia stores in the Aster Management Nuxt.js application.

## Architecture Decision

TanStack Query and Pinia serve different purposes in our architecture:

- **TanStack Query**: Manages server state (data fetching, caching, synchronization)
- **Pinia**: Manages client state (UI state, user preferences, local interactions)

## Integration Patterns

### 1. Server State with TanStack Query

All data fetching from the API should use TanStack Query:

```typescript
// ✅ Good: Using TanStack Query for server data
const { data: matters, isPending } = useMattersQuery()

// ❌ Bad: Fetching in Pinia store
const store = useMatterStore()
await store.fetchMatters() // Avoid this pattern
```

### 2. Client State with Pinia

UI state and user preferences remain in Pinia:

```typescript
// ✅ Good: UI state in Pinia
const uiStore = useKanbanUIPreferencesStore()
uiStore.setViewMode('compact')

// ✅ Good: Combining TanStack Query data with Pinia UI state
const { data: matters } = useMattersQuery()
const { viewMode, filters } = storeToRefs(uiStore)

const displayedMatters = computed(() => 
  filterMatters(matters.value, filters.value)
)
```

### 3. Optimistic Updates Pattern

For drag-and-drop and other optimistic updates:

```typescript
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: updateMatterStatus,
  
  // Optimistically update the cache
  onMutate: async ({ matterId, newStatus }) => {
    await queryClient.cancelQueries({ queryKey: ['matters'] })
    
    const previousMatters = queryClient.getQueryData(['matters'])
    
    queryClient.setQueryData(['matters'], (old) => 
      updateMatterInList(old, matterId, { status: newStatus })
    )
    
    return { previousMatters }
  },
  
  // Rollback on error
  onError: (err, variables, context) => {
    queryClient.setQueryData(['matters'], context.previousMatters)
  },
  
  // Always refetch after mutation
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['matters'] })
  }
})
```

### 4. Real-time Updates Integration

Combine TanStack Query with WebSocket updates:

```typescript
// In your real-time composable
const handleRealtimeUpdate = (update: MatterUpdate) => {
  // Invalidate specific queries based on update type
  queryClient.invalidateQueries({ 
    queryKey: ['matters', update.matterId] 
  })
  
  // Or update cache directly for immediate UI update
  queryClient.setQueryData(
    ['matters', update.matterId], 
    update.data
  )
}
```

### 5. Search and Filters

Keep filter state in Pinia, use it with TanStack Query:

```typescript
// In Pinia store
export const useSearchStore = defineStore('search', () => {
  const filters = ref<MatterFilters>({
    status: [],
    priority: [],
    search: ''
  })
  
  return { filters }
})

// In component
const { filters } = storeToRefs(useSearchStore())
const { data: matters } = useMattersQuery(filters)
```

### 6. Offline Support

Combine TanStack Query's persistence with existing offline queue:

```typescript
const { data: matters } = useMattersQuery({
  // Keep data in cache for offline access
  gcTime: 24 * 60 * 60 * 1000, // 24 hours
  networkMode: 'offlineFirst'
})

// Use existing offline queue for mutations
const offlineQueue = useOfflineQueue()
const mutation = useMutation({
  mutationFn: async (data) => {
    if (!navigator.onLine) {
      return offlineQueue.add('updateMatter', data)
    }
    return updateMatter(data)
  }
})
```

## Migration Strategy

### Phase 1: Query Implementation
1. Replace `useFetch` calls with TanStack Query
2. Keep existing Pinia stores for UI state
3. Remove data fetching logic from Pinia stores

### Phase 2: Mutation Implementation
1. Implement mutations with optimistic updates
2. Integrate with existing error handling
3. Update components to use mutations

### Phase 3: Advanced Features
1. Add background refetching
2. Implement query invalidation strategies
3. Set up persistence for offline support

## Best Practices

### 1. Query Key Consistency
Always use the query key factory:
```typescript
import { queryKeys } from '~/types/query'

// ✅ Good
useQuery({ queryKey: queryKeys.detail(matterId) })

// ❌ Bad
useQuery({ queryKey: ['matter', matterId] })
```

### 2. Error Handling
Integrate with existing error handler:
```typescript
const { handleApiError } = useApiErrorHandler()

const query = useQuery({
  queryKey: queryKeys.lists(),
  queryFn: fetchMatters,
  onError: handleApiError
})
```

### 3. Loading States
Use TanStack Query's loading states instead of Pinia:
```typescript
// ✅ Good
const { isPending, isFetching } = useMattersQuery()

// ❌ Bad
const store = useMatterStore()
const loading = store.loading
```

### 4. SSR Considerations
Ensure queries work with SSR:
```typescript
// Use Nuxt's $fetch for SSR compatibility
const { $fetch } = useNuxtApp()

const query = useQuery({
  queryKey: ['matters'],
  queryFn: () => $fetch('/api/matters')
})
```

## Common Patterns

### Dependent Queries
```typescript
const { data: user } = useUserQuery()

const { data: matters } = useMattersQuery({
  enabled: computed(() => !!user.value?.id)
})
```

### Pagination
```typescript
const page = ref(1)
const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
  queryKey: ['matters', 'infinite'],
  queryFn: ({ pageParam = 1 }) => fetchMatters({ page: pageParam }),
  getNextPageParam: (lastPage) => 
    lastPage.hasNext ? lastPage.page + 1 : undefined
})
```

### Polling
```typescript
const { data } = useMattersQuery({
  refetchInterval: 30000, // 30 seconds
  refetchIntervalInBackground: true
})
```

## Testing

### Unit Tests
```typescript
import { QueryClient } from '@tanstack/vue-query'
import { renderWithClient } from '~/test/utils'

test('displays matters', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  
  const { getByText } = renderWithClient(
    MyComponent, 
    { queryClient }
  )
  
  await waitFor(() => {
    expect(getByText('Test Matter')).toBeInTheDocument()
  })
})
```

### Mock API Responses
```typescript
// In tests
server.use(
  rest.get('/api/matters', (req, res, ctx) => {
    return res(ctx.json(mockMatters))
  })
)
```

## Troubleshooting

### Hydration Mismatches
Ensure queries have consistent behavior between server and client:
```typescript
// Use computed for dynamic values
const enabled = computed(() => process.client ? condition : false)
```

### Stale Closures
Use refs for reactive values in query functions:
```typescript
const filters = ref({})

// ✅ Good
queryFn: () => fetchMatters(filters.value)

// ❌ Bad - creates stale closure
queryFn: () => fetchMatters(filters)
```