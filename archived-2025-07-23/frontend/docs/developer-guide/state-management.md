# State Management Guide

This guide covers state management patterns in Aster Management using Pinia for client state and TanStack Query for server state.

## State Management Philosophy

### Separation of Concerns

We distinguish between two types of state:

1. **Client State** (Pinia)
   - UI state (modals, sidebars, themes)
   - User preferences
   - Temporary form data
   - Local application state

2. **Server State** (TanStack Query)
   - API data
   - Cached responses
   - Background synchronization
   - Optimistic updates

## Pinia Store Patterns

### Basic Store Structure

```typescript
// stores/matter.ts
import { defineStore } from 'pinia'
import type { Matter } from '~/types/matter'

export const useMatterStore = defineStore('matter', () => {
  // State
  const matters = ref<Matter[]>([])
  const selectedMatterId = ref<string | null>(null)
  const filters = ref({
    status: 'all',
    priority: 'all',
    assignee: null
  })
  
  // Getters
  const selectedMatter = computed(() => 
    matters.value.find(m => m.id === selectedMatterId.value)
  )
  
  const filteredMatters = computed(() => {
    return matters.value.filter(matter => {
      if (filters.value.status !== 'all' && matter.status !== filters.value.status) {
        return false
      }
      if (filters.value.priority !== 'all' && matter.priority !== filters.value.priority) {
        return false
      }
      if (filters.value.assignee && matter.assigneeId !== filters.value.assignee) {
        return false
      }
      return true
    })
  })
  
  // Actions
  const selectMatter = (id: string | null) => {
    selectedMatterId.value = id
  }
  
  const updateFilter = (key: string, value: any) => {
    filters.value[key] = value
  }
  
  const resetFilters = () => {
    filters.value = {
      status: 'all',
      priority: 'all',
      assignee: null
    }
  }
  
  return {
    // State
    matters,
    selectedMatterId,
    filters,
    
    // Getters
    selectedMatter,
    filteredMatters,
    
    // Actions
    selectMatter,
    updateFilter,
    resetFilters
  }
})
```

### Store Composition

```typescript
// stores/ui.ts
export const useUIStore = defineStore('ui', () => {
  const theme = ref<'light' | 'dark'>('light')
  const sidebarOpen = ref(true)
  const activeModal = ref<string | null>(null)
  
  // Persist theme preference
  const savedTheme = useLocalStorage('theme', 'light')
  theme.value = savedTheme.value
  
  // Watch for system theme changes
  const prefersDark = usePreferredDark()
  watch(prefersDark, (isDark) => {
    if (savedTheme.value === 'system') {
      theme.value = isDark ? 'dark' : 'light'
    }
  })
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    savedTheme.value = theme.value
  }
  
  const openModal = (modalId: string) => {
    activeModal.value = modalId
  }
  
  const closeModal = () => {
    activeModal.value = null
  }
  
  return {
    theme: readonly(theme),
    sidebarOpen,
    activeModal: readonly(activeModal),
    toggleTheme,
    openModal,
    closeModal
  }
})
```

### Modular Store Organization

```typescript
// stores/kanban/board.ts
export const useKanbanBoardStore = defineStore('kanban-board', () => {
  const columns = ref<KanbanColumn[]>([
    { id: 'draft', title: 'Draft', matters: [] },
    { id: 'in-progress', title: 'In Progress', matters: [] },
    { id: 'review', title: 'Review', matters: [] },
    { id: 'completed', title: 'Completed', matters: [] }
  ])
  
  const draggedMatter = ref<Matter | null>(null)
  const dropTargetColumn = ref<string | null>(null)
  
  // Drag and drop actions
  const startDrag = (matter: Matter) => {
    draggedMatter.value = matter
  }
  
  const endDrag = () => {
    draggedMatter.value = null
    dropTargetColumn.value = null
  }
  
  const moveMatter = (matterId: string, toColumnId: string) => {
    const fromColumn = columns.value.find(col => 
      col.matters.some(m => m.id === matterId)
    )
    
    if (!fromColumn) return
    
    const matter = fromColumn.matters.find(m => m.id === matterId)
    if (!matter) return
    
    // Remove from source
    fromColumn.matters = fromColumn.matters.filter(m => m.id !== matterId)
    
    // Add to target
    const toColumn = columns.value.find(col => col.id === toColumnId)
    if (toColumn) {
      toColumn.matters.push(matter)
    }
  }
  
  return {
    columns,
    draggedMatter: readonly(draggedMatter),
    dropTargetColumn,
    startDrag,
    endDrag,
    moveMatter
  }
})
```

## TanStack Query Patterns

### Query Configuration

```typescript
// utils/query-client.ts
import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error)
        useToast().error('An error occurred. Please try again.')
      }
    }
  }
})
```

### Query Hooks

```typescript
// composables/useMattersQuery.ts
export const useMattersQuery = (filters?: MatterFilters) => {
  const queryKey = computed(() => ['matters', filters])
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.assignee) params.append('assignee', filters.assignee)
      
      return await $fetch(`/api/matters?${params}`)
    },
    select: (data) => {
      // Transform API response
      return data.map(matter => ({
        ...matter,
        createdAt: new Date(matter.createdAt),
        updatedAt: new Date(matter.updatedAt)
      }))
    }
  })
}

// composables/useMatterQuery.ts
export const useMatterQuery = (id: string) => {
  return useQuery({
    queryKey: ['matter', id],
    queryFn: () => $fetch(`/api/matters/${id}`),
    enabled: !!id // Only run if ID is provided
  })
}
```

### Mutation Hooks

```typescript
// composables/useMatterMutations.ts
export const useMatterMutations = () => {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  const createMatter = useMutation({
    mutationFn: (data: CreateMatterDTO) => 
      $fetch('/api/matters', {
        method: 'POST',
        body: data
      }),
    onSuccess: (newMatter) => {
      // Invalidate and refetch matters list
      queryClient.invalidateQueries({ queryKey: ['matters'] })
      
      // Show success message
      toast.success('Matter created successfully')
      
      // Navigate to new matter
      navigateTo(`/matters/${newMatter.id}`)
    },
    onError: (error) => {
      toast.error('Failed to create matter')
    }
  })
  
  const updateMatter = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Matter> }) => 
      $fetch(`/api/matters/${id}`, {
        method: 'PATCH',
        body: data
      }),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matter', id] })
      
      // Snapshot previous value
      const previousMatter = queryClient.getQueryData(['matter', id])
      
      // Optimistically update
      queryClient.setQueryData(['matter', id], old => ({
        ...old,
        ...data
      }))
      
      return { previousMatter }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMatter) {
        queryClient.setQueryData(
          ['matter', variables.id],
          context.previousMatter
        )
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['matter', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  const deleteMatter = useMutation({
    mutationFn: (id: string) => 
      $fetch(`/api/matters/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['matter', id] })
      queryClient.invalidateQueries({ queryKey: ['matters'] })
      
      toast.success('Matter deleted')
      navigateTo('/matters')
    }
  })
  
  return {
    createMatter,
    updateMatter,
    deleteMatter
  }
}
```

### Optimistic Updates

```typescript
// composables/useOptimisticMatterUpdate.ts
export const useOptimisticMatterUpdate = () => {
  const queryClient = useQueryClient()
  
  const updateMatterStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MatterStatus }) =>
      $fetch(`/api/matters/${id}/status`, {
        method: 'PUT',
        body: { status }
      }),
    
    // Optimistic update for immediate UI feedback
    onMutate: async ({ id, status }) => {
      // Cancel queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['matters'] })
      await queryClient.cancelQueries({ queryKey: ['matter', id] })
      
      // Snapshot current data
      const previousMatters = queryClient.getQueryData(['matters'])
      const previousMatter = queryClient.getQueryData(['matter', id])
      
      // Update cache optimistically
      queryClient.setQueryData(['matters'], (old: Matter[]) => 
        old.map(matter => 
          matter.id === id ? { ...matter, status } : matter
        )
      )
      
      queryClient.setQueryData(['matter', id], (old: Matter) => ({
        ...old,
        status
      }))
      
      return { previousMatters, previousMatter }
    },
    
    // Rollback on error
    onError: (err, { id }, context) => {
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters)
      }
      if (context?.previousMatter) {
        queryClient.setQueryData(['matter', id], context.previousMatter)
      }
      
      useToast().error('Failed to update status')
    },
    
    // Refetch to ensure consistency
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
      queryClient.invalidateQueries({ queryKey: ['matter', id] })
    }
  })
  
  return { updateMatterStatus }
}
```

## Advanced Patterns

### Infinite Queries

```typescript
// composables/useInfiniteMatters.ts
export const useInfiniteMatters = (pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: ['matters', 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      $fetch('/api/matters', {
        params: {
          offset: pageParam,
          limit: pageSize
        }
      }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < pageSize) return undefined
      return pages.length * pageSize
    },
    initialPageParam: 0
  })
}

// Usage in component
const { 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage 
} = useInfiniteMatters()

const allMatters = computed(() => 
  data.value?.pages.flatMap(page => page) ?? []
)
```

### Query Invalidation Patterns

```typescript
// utils/query-invalidation.ts
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient()
  
  // Invalidate specific queries
  const invalidateMatter = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['matter', id] })
  }
  
  // Invalidate all matter-related queries
  const invalidateAllMatters = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['matters'],
      exact: false // Invalidate all queries starting with 'matters'
    })
  }
  
  // Smart invalidation based on update type
  const smartInvalidate = (updateType: string, payload: any) => {
    switch (updateType) {
      case 'MATTER_CREATED':
        queryClient.invalidateQueries({ queryKey: ['matters'] })
        break
      case 'MATTER_UPDATED':
        queryClient.invalidateQueries({ queryKey: ['matter', payload.id] })
        queryClient.invalidateQueries({ queryKey: ['matters'] })
        break
      case 'MATTER_DELETED':
        queryClient.removeQueries({ queryKey: ['matter', payload.id] })
        queryClient.invalidateQueries({ queryKey: ['matters'] })
        break
    }
  }
  
  return {
    invalidateMatter,
    invalidateAllMatters,
    smartInvalidate
  }
}
```

### Background Refetching

```typescript
// plugins/background-sync.client.ts
export default defineNuxtPlugin(() => {
  const queryClient = useQueryClient()
  
  // Refetch on window focus
  useEventListener(window, 'focus', () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        // Only refetch queries older than 1 minute
        const lastFetch = query.state.dataUpdatedAt
        return Date.now() - lastFetch > 60000
      }
    })
  })
  
  // Periodic background sync
  const { pause, resume } = useIntervalFn(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        // Refetch stale queries
        return query.isStale()
      }
    })
  }, 5 * 60 * 1000) // Every 5 minutes
  
  // Pause when tab is hidden
  useDocumentVisibility().value === 'hidden' ? pause() : resume()
})
```

### Store Persistence

```typescript
// stores/preferences.ts
export const usePreferencesStore = defineStore('preferences', () => {
  // Persist to localStorage
  const {
    state: preferences,
    isReady
  } = useLocalStorage('user-preferences', {
    theme: 'system',
    language: 'en',
    notifications: true,
    compactView: false
  })
  
  // Wait for hydration
  const ready = ref(false)
  onMounted(() => {
    ready.value = isReady.value
  })
  
  const updatePreference = <K extends keyof typeof preferences.value>(
    key: K,
    value: typeof preferences.value[K]
  ) => {
    preferences.value[key] = value
  }
  
  return {
    preferences: readonly(preferences),
    ready: readonly(ready),
    updatePreference
  }
})
```

## State Management Best Practices

### 1. Keep Stores Focused

```typescript
// ✅ Good: Single responsibility
export const useAuthStore = defineStore('auth', () => {
  // Only auth-related state
})

export const useUIStore = defineStore('ui', () => {
  // Only UI-related state
})

// ❌ Bad: Mixed concerns
export const useAppStore = defineStore('app', () => {
  // Everything in one store
})
```

### 2. Use Computed for Derived State

```typescript
// ✅ Good: Computed properties
const totalActiveMatters = computed(() => 
  matters.value.filter(m => m.status === 'ACTIVE').length
)

// ❌ Bad: Manual calculation
const calculateTotal = () => {
  return matters.value.filter(m => m.status === 'ACTIVE').length
}
```

### 3. Actions Should Be Pure

```typescript
// ✅ Good: Pure action
const addMatter = (matter: Matter) => {
  matters.value.push(matter)
}

// ❌ Bad: Side effects in actions
const addMatter = async (matter: Matter) => {
  matters.value.push(matter)
  await $fetch('/api/matters', { method: 'POST', body: matter })
  navigateTo('/matters') // Side effect!
}
```

### 4. Avoid Direct State Mutation

```typescript
// ✅ Good: Controlled updates
const updateMatter = (id: string, updates: Partial<Matter>) => {
  const index = matters.value.findIndex(m => m.id === id)
  if (index !== -1) {
    matters.value[index] = {
      ...matters.value[index],
      ...updates
    }
  }
}

// ❌ Bad: Direct mutation from components
// In component:
matterStore.matters[0].title = 'New Title' // Don't do this!
```

### 5. Use TypeScript Strictly

```typescript
// ✅ Good: Full type safety
interface StoreState {
  matters: Matter[]
  filters: MatterFilters
}

const state = ref<StoreState>({
  matters: [],
  filters: { status: 'all' }
})

// ❌ Bad: Any types
const state = ref<any>({})
```

## Testing State Management

### Testing Pinia Stores

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useMatterStore } from '~/stores/matter'

describe('MatterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('filters matters by status', () => {
    const store = useMatterStore()
    
    // Add test data
    store.matters = [
      { id: '1', status: 'ACTIVE' },
      { id: '2', status: 'COMPLETED' }
    ]
    
    // Test filter
    store.updateFilter('status', 'ACTIVE')
    expect(store.filteredMatters).toHaveLength(1)
    expect(store.filteredMatters[0].id).toBe('1')
  })
})
```

### Testing Query Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/vue'
import { useMattersQuery } from '~/composables/useMattersQuery'

describe('useMattersQuery', () => {
  it('fetches matters successfully', async () => {
    const { result } = renderHook(() => useMattersQuery())
    
    // Wait for query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toBeInstanceOf(Array)
    expect(result.current.data[0]).toHaveProperty('id')
  })
})
```

## Common Patterns

### Loading States

```vue
<template>
  <div>
    <LoadingSpinner v-if="isLoading" />
    <ErrorMessage v-else-if="error" :error="error" />
    <MatterList v-else :matters="data" />
  </div>
</template>

<script setup>
const { data, isLoading, error } = useMattersQuery()
</script>
```

### Combining Stores

```typescript
// Using multiple stores together
const matterStore = useMatterStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const canEditMatter = computed(() => {
  const matter = matterStore.selectedMatter
  const user = authStore.currentUser
  
  return matter && (
    user?.role === 'ADMIN' || 
    matter.assigneeId === user?.id
  )
})
```