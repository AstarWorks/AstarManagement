# TanStack Query Usage Guide - Core Matter Queries

## Overview

This guide covers the core TanStack Query implementation for matter management in Aster Management. The implementation provides type-safe, optimized data fetching with proper cache management and error handling.

## Core Composables

### Query Hooks

#### `useMattersQuery(filters?, options?)`

Fetches a paginated list of matters with optional filtering.

```typescript
import { useMattersQuery } from '~/composables/useMattersQuery'

// Basic usage
const { data: matters, isPending, error } = useMattersQuery()

// With filters
const filters = ref({
  status: ['active', 'review'],
  priority: ['high'],
  search: 'contract dispute'
})
const { data: filteredMatters } = useMattersQuery(filters)

// With custom options
const { data: matters } = useMattersQuery(undefined, {
  refetchInterval: 30000, // Refresh every 30 seconds
  enabled: computed(() => user.value.role === 'lawyer')
})
```

**Response Structure:**
```typescript
{
  data: Matter[],           // Array of matter objects
  page: number,            // Current page number
  limit: number,           // Items per page
  total: number,           // Total count
  hasNext: boolean,        // Has next page
  hasPrev: boolean         // Has previous page
}
```

#### `useMatterQuery(id, options?)`

Fetches a single matter by ID.

```typescript
import { useMatterQuery } from '~/composables/useMattersQuery'

const matterId = ref('matter-123')
const { data: matter, isPending, error } = useMatterQuery(matterId)

// Conditional enabling
const { data: matter } = useMatterQuery(matterId, {
  enabled: computed(() => !!matterId.value && hasPermission.value)
})
```

#### `useMatterSearchQuery(searchQuery, options?)`

Performs full-text search on matters.

```typescript
import { useMatterSearchQuery } from '~/composables/useMattersQuery'

const searchQuery = ref('')
const { data: searchResults, isPending } = useMatterSearchQuery(searchQuery)

// Search is automatically enabled when query length >= 2
// Results are cached for 2 minutes (configurable)
```

#### `useStatusCountsQuery(options?)`

Fetches real-time status counts for Kanban columns.

```typescript
import { useStatusCountsQuery } from '~/composables/useMattersQuery'

const { data: statusCounts, isPending } = useStatusCountsQuery()

// Returns: { draft: 5, active: 12, review: 3, completed: 8 }
// Auto-refreshes every minute
```

### Mutation Hooks

#### `useCreateMatterMutation(options?)`

Creates a new matter with optimistic updates.

```typescript
import { useCreateMatterMutation } from '~/composables/useMattersQuery'

const createMatter = useCreateMatterMutation({
  onSuccess: (newMatter) => {
    console.log('Matter created:', newMatter.id)
    navigateTo(`/matters/${newMatter.id}`)
  },
  onError: (error) => {
    console.error('Failed to create matter:', error)
  }
})

// Usage
const handleSubmit = async (formData) => {
  await createMatter.mutateAsync({
    title: formData.title,
    priority: formData.priority,
    status: 'draft',
    assignedLawyer: formData.lawyerId
  })
}
```

#### `useUpdateMatterMutation(options?)`

Updates an existing matter with optimistic updates.

```typescript
import { useUpdateMatterMutation } from '~/composables/useMattersQuery'

const updateMatter = useUpdateMatterMutation()

// Usage
const handleUpdate = async (matterId, updates) => {
  await updateMatter.mutateAsync({
    id: matterId,
    data: {
      title: 'Updated Title',
      priority: 'high'
    }
  })
}
```

#### `useMoveMatterMutation(options?)`

Moves a matter to different status (optimized for drag-and-drop).

```typescript
import { useMoveMatterMutation } from '~/composables/useMattersQuery'

const moveMatter = useMoveMatterMutation()

// Drag and drop handler
const handleDrop = async (matterId, newStatus, newPosition) => {
  await moveMatter.mutateAsync({
    matterId,
    newStatus,
    newPosition
  })
}
```

#### `useDeleteMatterMutation(options?)`

Deletes a matter with optimistic updates.

```typescript
import { useDeleteMatterMutation } from '~/composables/useMattersQuery'

const deleteMatter = useDeleteMatterMutation({
  onSuccess: () => {
    navigateTo('/matters')
  }
})

// Usage
const handleDelete = async (matterId) => {
  if (confirm('Are you sure?')) {
    await deleteMatter.mutateAsync(matterId)
  }
}
```

## Integration with Existing Stores

### Pinia Store Integration

Use the integration layer for backward compatibility:

```typescript
import { useMatterQueryIntegration } from '~/composables/useMatterQueryIntegration'

// Drop-in replacement for existing Pinia stores
const {
  matters,         // Unified matter data
  isLoading,       // Unified loading state
  error,           // Unified error state
  createMatter,    // TanStack Query powered actions
  updateMatter,
  moveMatter,
  deleteMatter,
  refreshMatters
} = useMatterQueryIntegration()
```

### Legacy Component Migration

For existing components using Pinia stores:

```vue
<script setup lang="ts">
// Before (Pinia only)
// const kanbanStore = useKanbanStore()
// const { matters, loading } = storeToRefs(kanbanStore)

// After (TanStack Query integration)
const { matters, isLoading: loading } = useMatterQueryIntegration()
</script>
```

## Advanced Usage

### Prefetching

Improve perceived performance by prefetching likely-to-be-accessed data:

```typescript
import { usePrefetchMatter } from '~/composables/useMattersQuery'

const prefetchMatter = usePrefetchMatter()

// Prefetch on hover
const handleMatterHover = (matterId) => {
  prefetchMatter(matterId)
}
```

### Cache Invalidation

Force refresh of specific data:

```typescript
import { useInvalidateAllMatters } from '~/composables/useMattersQuery'

const invalidateMatters = useInvalidateAllMatters()

// Refresh all matter data
const handleRefresh = () => {
  invalidateMatters()
}
```

### Custom Query Options

Override default behavior:

```typescript
const { data: matters } = useMattersQuery(filters, {
  staleTime: 10 * 60 * 1000,    // 10 minutes
  refetchOnWindowFocus: true,    // Refetch when window gains focus
  retry: false,                  // Disable retries
  enabled: computed(() => isAuthenticated.value)
})
```

## Error Handling

TanStack Query integrates with the existing error handling system:

```typescript
const { data, error, isPending } = useMattersQuery()

// Errors are automatically:
// 1. Transformed using transformApiError()
// 2. Displayed via toast notifications
// 3. Retried with exponential backoff (configurable)

// Manual error handling
watch(error, (newError) => {
  if (newError) {
    console.error('Query failed:', newError)
    // Custom error handling
  }
})
```

## Performance Considerations

### Cache Configuration

- **Matters**: 5 minutes stale time, optimized for frequent updates
- **Static data**: 30 minutes stale time, for reference data
- **Search results**: 2 minutes stale time, for repeated searches
- **Real-time data**: 1 minute stale time, with auto-refresh

### Memory Management

- Automatic cleanup of inactive queries
- Maximum 500 queries in cache
- Garbage collection runs every 5 minutes

### Optimistic Updates

All mutations use optimistic updates:
- Immediate UI feedback
- Automatic rollback on errors
- Background sync with server

## Best Practices

### 1. Query Key Management

Use the provided query key factory for consistent caching:

```typescript
import { queryKeys } from '~/types/query'

// Good: Uses query key factory
const { data } = useQuery({
  queryKey: queryKeys.detail(matterId),
  queryFn: () => fetchMatter(matterId)
})

// Bad: Manual query key
const { data } = useQuery({
  queryKey: ['matter', matterId],
  queryFn: () => fetchMatter(matterId)
})
```

### 2. Conditional Queries

Use `enabled` option for conditional queries:

```typescript
const { data: matter } = useMatterQuery(matterId, {
  enabled: computed(() => !!matterId.value && hasPermission.value)
})
```

### 3. Mutation Success Handling

Handle success in mutation options rather than awaiting:

```typescript
// Good: Uses onSuccess option
const createMatter = useCreateMatterMutation({
  onSuccess: (newMatter) => {
    navigateTo(`/matters/${newMatter.id}`)
  }
})

// Acceptable: Awaiting mutation
const handleCreate = async () => {
  const newMatter = await createMatter.mutateAsync(data)
  navigateTo(`/matters/${newMatter.id}`)
}
```

### 4. Loading State Management

Combine multiple loading states when needed:

```typescript
const isLoading = computed(() => 
  mattersQuery.isPending.value ||
  createMutation.isPending.value ||
  updateMutation.isPending.value
)
```

## Troubleshooting

### Common Issues

1. **Stale Data**: Check `staleTime` configuration
2. **Missing Updates**: Verify cache invalidation patterns
3. **Memory Leaks**: Ensure queries are properly enabled/disabled
4. **Performance**: Check if too many queries are running simultaneously

### Debugging

Use browser DevTools for TanStack Query:

```typescript
// Development only
if (process.dev) {
  console.log('Query cache:', queryClient.getQueryCache())
}
```

### Configuration Override

For specific use cases, override default configurations:

```typescript
const { data } = useMattersQuery(filters, {
  // Override defaults from QUERY_CONFIGS.matters
  staleTime: 0,  // Always fresh
  retry: 5,      // More retries
  refetchInterval: 5000  // Every 5 seconds
})
```