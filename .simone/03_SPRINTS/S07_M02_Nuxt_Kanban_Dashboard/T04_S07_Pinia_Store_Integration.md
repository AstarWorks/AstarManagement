---
task_id: T04_S07
sprint_id: S07
milestone_id: M02
name: Pinia Store Integration for Kanban State Management
description: Migrate Zustand kanban store to Pinia with composition API patterns, implement optimistic updates, conflict resolution, and view preferences persistence
type: development
priority: high
estimated_effort: 6 hours
status: completed
dependencies:
  - T01_S07_Kanban_Layout_Foundation
  - T02_S07_Matter_Card_Component
  - S06_TX04B_Form_Input_Components
tags:
  - pinia
  - state-management
  - vue3
  - typescript
  - optimistic-updates
  - persistence
last_updated: 2025-06-23 05:56
---

# T04_S07: Pinia Store Integration for Kanban State Management

## Overview

This task focuses on migrating the complex Zustand kanban store architecture to Pinia using Vue 3 Composition API patterns. The goal is to create a robust state management solution that supports optimistic updates, conflict resolution, and persistent view preferences while maintaining the modular architecture of the React implementation.

## Context & Background

The React kanban implementation uses a sophisticated Zustand store architecture with:

1. **Modular Store Structure**: Separate stores for board state, matter data, search, UI preferences, and real-time updates
2. **Optimistic Updates**: Immediate UI feedback with rollback capabilities
3. **Conflict Resolution**: Handling concurrent updates and server state conflicts
4. **Persistence**: Local storage for view preferences and draft state
5. **SSR Compatibility**: Server-side rendering support with proper hydration

The Vue 3 implementation must maintain feature parity while leveraging Pinia's advantages:
- Vue 3 reactivity system integration
- TypeScript support with automatic type inference
- Composition API compatibility
- Built-in persistence plugins
- DevTools integration

## Technical Requirements

### 1. Modular Store Architecture

Create separate Pinia stores matching the React structure:

```typescript
// stores/kanban/board.ts - Board layout and drag/drop state
// stores/kanban/matters.ts - Matter CRUD operations and data
// stores/kanban/search.ts - Search functionality and history
// stores/kanban/ui-preferences.ts - View preferences and settings
// stores/kanban/real-time.ts - Polling and sync status
```

### 2. Optimistic Updates Pattern

Implement optimistic updates with rollback capabilities:

```typescript
// Example pattern for matter status updates
const updateMatterStatus = async (matterId: string, newStatus: MatterStatus) => {
  // 1. Optimistic update - immediate UI feedback
  const originalMatter = matters.value.find(m => m.id === matterId)
  const optimisticMatter = { ...originalMatter, status: newStatus }
  
  // Update local state immediately
  const index = matters.value.findIndex(m => m.id === matterId)
  matters.value[index] = optimisticMatter
  
  try {
    // 2. Server update
    const updatedMatter = await api.updateMatter(matterId, { status: newStatus })
    
    // 3. Confirm update with server response
    matters.value[index] = updatedMatter
  } catch (error) {
    // 4. Rollback on failure
    matters.value[index] = originalMatter
    throw error
  }
}
```

### 3. Conflict Resolution Strategy

Handle concurrent updates and server state conflicts:

```typescript
// Conflict resolution for drag-and-drop operations
const handleConflictResolution = (
  localState: Matter[],
  serverState: Matter[],
  lastSyncTime: Date
) => {
  const conflicts = detectConflicts(localState, serverState, lastSyncTime)
  
  if (conflicts.length > 0) {
    // Apply conflict resolution strategy
    return resolveConflicts(conflicts, {
      strategy: 'server-wins', // or 'client-wins', 'merge', 'user-prompt'
      preserveLocalChanges: true
    })
  }
  
  return serverState
}
```

### 4. View Preferences Persistence

Implement persistent view preferences with localStorage:

```typescript
// UI preferences store with persistence
export const useUIPreferencesStore = defineStore('ui-preferences', () => {
  const preferences = ref<ViewPreferences>({
    cardSize: 'normal',
    showAvatars: true,
    showDueDates: true,
    showPriority: true,
    showTags: true,
    groupBy: 'status',
    sortBy: 'priority',
    sortOrder: 'desc'
  })
  
  // Auto-persist preferences
  watch(
    preferences,
    (newPrefs) => {
      localStorage.setItem('kanban-preferences', JSON.stringify(newPrefs))
    },
    { deep: true }
  )
  
  // Load preferences from localStorage
  const loadPreferences = () => {
    const saved = localStorage.getItem('kanban-preferences')
    if (saved) {
      preferences.value = { ...preferences.value, ...JSON.parse(saved) }
    }
  }
  
  return {
    preferences: readonly(preferences),
    loadPreferences,
    updatePreferences: (updates: Partial<ViewPreferences>) => {
      preferences.value = { ...preferences.value, ...updates }
    }
  }
})
```

## Implementation Tasks

### Task 1: Create Modular Store Structure

Create the five core stores with proper TypeScript interfaces:

```bash
# Create store directory structure
mkdir -p stores/kanban
touch stores/kanban/board.ts
touch stores/kanban/matters.ts
touch stores/kanban/search.ts
touch stores/kanban/ui-preferences.ts
touch stores/kanban/real-time.ts
touch stores/kanban/index.ts  # Main export file
```

### Task 2: Implement Board Store

Create the board store for layout and drag-drop state:

```typescript
// stores/kanban/board.ts
export const useBoardStore = defineStore('kanban-board', () => {
  const board = ref<KanbanBoard | null>(null)
  const columns = ref<KanbanColumn[]>(DEFAULT_COLUMNS)
  
  const dragContext = ref<DragContext>({
    activeId: null,
    overId: null,
    isDragging: false,
    draggedItem: null
  })
  
  const initializeBoard = (boardData?: Partial<KanbanBoard>) => {
    board.value = {
      id: 'main-board',
      title: 'Aster Management - Legal Matters',
      columns: columns.value,
      ...boardData,
      lastUpdated: new Date().toISOString()
    }
  }
  
  const updateDragContext = (updates: Partial<DragContext>) => {
    dragContext.value = { ...dragContext.value, ...updates }
  }
  
  return {
    // State
    board: readonly(board),
    columns: readonly(columns),
    dragContext: readonly(dragContext),
    
    // Actions
    initializeBoard,
    updateDragContext,
    
    // Getters
    boardId: computed(() => board.value?.id),
    isDragging: computed(() => dragContext.value.isDragging)
  }
})
```

### Task 3: Implement Matter Data Store

Create the matter data store with CRUD operations:

```typescript
// stores/kanban/matters.ts
export const useMatterStore = defineStore('kanban-matters', () => {
  const matters = ref<Matter[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  
  // Optimistic update helper
  const performOptimisticUpdate = async <T>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    rollback: () => void
  ): Promise<T> => {
    optimisticUpdate()
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      rollback()
      throw err
    }
  }
  
  const updateMatter = async (id: string, updates: Partial<Matter>) => {
    const index = matters.value.findIndex(m => m.id === id)
    if (index === -1) return
    
    const originalMatter = { ...matters.value[index] }
    const optimisticMatter = { ...originalMatter, ...updates }
    
    return performOptimisticUpdate(
      () => api.updateMatter(id, updates),
      () => { matters.value[index] = optimisticMatter },
      () => { matters.value[index] = originalMatter }
    )
  }
  
  const moveMatter = async (matterId: string, newStatus: MatterStatus) => {
    return updateMatter(matterId, { 
      status: newStatus,
      statusUpdatedAt: new Date().toISOString()
    })
  }
  
  return {
    // State
    matters: readonly(matters),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),
    
    // Actions
    updateMatter,
    moveMatter,
    loadMatters: async () => {
      isLoading.value = true
      try {
        const response = await api.getMatters()
        matters.value = response.data
        lastUpdated.value = new Date()
      } catch (err) {
        error.value = err.message
      } finally {
        isLoading.value = false
      }
    },
    
    // Getters
    mattersByStatus: computed(() => {
      const grouped: Record<MatterStatus, Matter[]> = {}
      matters.value.forEach(matter => {
        if (!grouped[matter.status]) {
          grouped[matter.status] = []
        }
        grouped[matter.status].push(matter)
      })
      return grouped
    })
  }
})
```

### Task 4: Implement Search Store

Create the search store with query management:

```typescript
// stores/kanban/search.ts
export const useSearchStore = defineStore('kanban-search', () => {
  const searchQuery = ref('')
  const searchResults = ref<Matter[]>([])
  const searchHistory = ref<string[]>([])
  const isSearching = ref(false)
  const searchSuggestions = ref<string[]>([])
  
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      return
    }
    
    isSearching.value = true
    try {
      const results = await api.searchMatters(query)
      searchResults.value = results.data
      
      // Add to search history
      if (!searchHistory.value.includes(query)) {
        searchHistory.value.unshift(query)
        if (searchHistory.value.length > 10) {
          searchHistory.value = searchHistory.value.slice(0, 10)
        }
      }
    } finally {
      isSearching.value = false
    }
  }, 300)
  
  const performSearch = (query: string) => {
    searchQuery.value = query
    debouncedSearch(query)
  }
  
  return {
    // State
    searchQuery: readonly(searchQuery),
    searchResults: readonly(searchResults),
    searchHistory: readonly(searchHistory),
    isSearching: readonly(isSearching),
    searchSuggestions: readonly(searchSuggestions),
    
    // Actions
    performSearch,
    clearSearch: () => {
      searchQuery.value = ''
      searchResults.value = []
    },
    
    // Getters
    hasActiveSearch: computed(() => searchQuery.value.length > 0),
    hasResults: computed(() => searchResults.value.length > 0)
  }
})
```

### Task 5: Implement UI Preferences Store

Create the UI preferences store with persistence:

```typescript
// stores/kanban/ui-preferences.ts
export const useUIPreferencesStore = defineStore('kanban-ui-preferences', () => {
  const preferences = ref<ViewPreferences>({
    cardSize: 'normal',
    showAvatars: true,
    showDueDates: true,
    showPriority: true,
    showTags: true,
    groupBy: 'status',
    sortBy: 'priority',
    sortOrder: 'desc',
    theme: 'light',
    compactMode: false
  })
  
  const filters = ref<FilterState>({
    searchQuery: '',
    selectedLawyers: [],
    selectedPriorities: [],
    selectedStatuses: [],
    showClosed: true,
    dateRange: null
  })
  
  // Persistence
  const STORAGE_KEY = 'kanban-ui-preferences'
  const FILTERS_KEY = 'kanban-filters'
  
  const savePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value))
  }
  
  const loadPreferences = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      preferences.value = { ...preferences.value, ...JSON.parse(saved) }
    }
  }
  
  const saveFilters = () => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters.value))
  }
  
  const loadFilters = () => {
    const saved = localStorage.getItem(FILTERS_KEY)
    if (saved) {
      filters.value = { ...filters.value, ...JSON.parse(saved) }
    }
  }
  
  // Auto-save watchers
  watch(preferences, savePreferences, { deep: true })
  watch(filters, saveFilters, { deep: true })
  
  return {
    // State
    preferences: readonly(preferences),
    filters: readonly(filters),
    
    // Actions
    updatePreferences: (updates: Partial<ViewPreferences>) => {
      preferences.value = { ...preferences.value, ...updates }
    },
    updateFilters: (updates: Partial<FilterState>) => {
      filters.value = { ...filters.value, ...updates }
    },
    loadPreferences,
    loadFilters,
    resetPreferences: () => {
      preferences.value = {
        cardSize: 'normal',
        showAvatars: true,
        showDueDates: true,
        showPriority: true,
        showTags: true,
        groupBy: 'status',
        sortBy: 'priority',
        sortOrder: 'desc',
        theme: 'light',
        compactMode: false
      }
    }
  }
})
```

### Task 6: Implement Real-time Store

Create the real-time store for polling and sync:

```typescript
// stores/kanban/real-time.ts
export const useRealTimeStore = defineStore('kanban-real-time', () => {
  const isOnline = ref(navigator.onLine)
  const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')
  const lastSyncTime = ref<Date | null>(null)
  const pollingInterval = ref<NodeJS.Timeout | null>(null)
  const conflictQueue = ref<ConflictEvent[]>([])
  
  const startPolling = (intervalMs: number = 30000) => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
    }
    
    pollingInterval.value = setInterval(async () => {
      if (isOnline.value && syncStatus.value !== 'syncing') {
        await syncWithServer()
      }
    }, intervalMs)
  }
  
  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }
  
  const syncWithServer = async () => {
    syncStatus.value = 'syncing'
    
    try {
      const matterStore = useMatterStore()
      const serverMatters = await api.getMatters()
      
      // Detect conflicts
      const conflicts = detectConflicts(
        matterStore.matters,
        serverMatters.data,
        lastSyncTime.value
      )
      
      if (conflicts.length > 0) {
        conflictQueue.value.push(...conflicts)
        // Handle conflicts based on strategy
        await resolveConflicts(conflicts)
      }
      
      lastSyncTime.value = new Date()
      syncStatus.value = 'idle'
    } catch (error) {
      syncStatus.value = 'error'
      console.error('Sync failed:', error)
    }
  }
  
  // Online/offline detection
  const handleOnline = () => {
    isOnline.value = true
    syncWithServer()
  }
  
  const handleOffline = () => {
    isOnline.value = false
    stopPolling()
  }
  
  // Setup event listeners
  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })
  
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    stopPolling()
  })
  
  return {
    // State
    isOnline: readonly(isOnline),
    syncStatus: readonly(syncStatus),
    lastSyncTime: readonly(lastSyncTime),
    conflictQueue: readonly(conflictQueue),
    
    // Actions
    startPolling,
    stopPolling,
    syncWithServer,
    
    // Getters
    isSyncing: computed(() => syncStatus.value === 'syncing'),
    hasConflicts: computed(() => conflictQueue.value.length > 0)
  }
})
```

### Task 7: Create Unified Store Composable

Create a main composable that combines all stores:

```typescript
// stores/kanban/index.ts
export const useKanbanStore = () => {
  const boardStore = useBoardStore()
  const matterStore = useMatterStore()
  const searchStore = useSearchStore()
  const uiStore = useUIPreferencesStore()
  const realTimeStore = useRealTimeStore()
  
  return {
    // Board state
    board: boardStore.board,
    columns: boardStore.columns,
    dragContext: boardStore.dragContext,
    
    // Matter data
    matters: matterStore.matters,
    mattersByStatus: matterStore.mattersByStatus,
    
    // Search
    searchQuery: searchStore.searchQuery,
    searchResults: searchStore.searchResults,
    
    // UI preferences
    preferences: uiStore.preferences,
    filters: uiStore.filters,
    
    // Real-time status
    isOnline: realTimeStore.isOnline,
    syncStatus: realTimeStore.syncStatus,
    
    // Combined actions
    actions: {
      // Board actions
      initializeBoard: boardStore.initializeBoard,
      updateDragContext: boardStore.updateDragContext,
      
      // Matter actions
      updateMatter: matterStore.updateMatter,
      moveMatter: matterStore.moveMatter,
      loadMatters: matterStore.loadMatters,
      
      // Search actions
      performSearch: searchStore.performSearch,
      clearSearch: searchStore.clearSearch,
      
      // UI actions
      updatePreferences: uiStore.updatePreferences,
      updateFilters: uiStore.updateFilters,
      
      // Real-time actions
      startPolling: realTimeStore.startPolling,
      stopPolling: realTimeStore.stopPolling,
      syncWithServer: realTimeStore.syncWithServer
    }
  }
}
```

## Pinia Composition API Best Practices

### 1. Store Definition Pattern

```typescript
// Use composition API pattern for better TypeScript support
export const useMyStore = defineStore('my-store', () => {
  // State as refs
  const count = ref(0)
  const user = ref<User | null>(null)
  
  // Getters as computed
  const doubleCount = computed(() => count.value * 2)
  const isLoggedIn = computed(() => user.value !== null)
  
  // Actions as functions
  const increment = () => {
    count.value++
  }
  
  const setUser = (newUser: User) => {
    user.value = newUser
  }
  
  return {
    // State
    count,
    user,
    
    // Getters
    doubleCount,
    isLoggedIn,
    
    // Actions
    increment,
    setUser
  }
})
```

### 2. Reactive State Management

```typescript
// Use reactive() for complex objects
const state = reactive({
  matters: [] as Matter[],
  filters: {
    searchQuery: '',
    selectedStatuses: []
  } as FilterState,
  ui: {
    sidebarOpen: false,
    theme: 'light'
  } as UIState
})

// Use ref() for primitives
const isLoading = ref(false)
const error = ref<string | null>(null)

// Use computed() for derived state
const filteredMatters = computed(() => {
  return state.matters.filter(matter => {
    // Apply filters
    return true
  })
})
```

### 3. Async Actions with Error Handling

```typescript
const loadData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await api.getData()
    state.matters = response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    throw err
  } finally {
    isLoading.value = false
  }
}
```

### 4. Store Composition

```typescript
// Compose stores for related functionality
export const useKanbanComposition = () => {
  const matterStore = useMatterStore()
  const uiStore = useUIPreferencesStore()
  
  // Derived state across stores
  const visibleMatters = computed(() => {
    const { matters } = matterStore
    const { filters } = uiStore
    
    return matters.filter(matter => {
      // Apply filters from UI store
      return applyFilters(matter, filters)
    })
  })
  
  // Combined actions
  const filterAndSort = (filters: FilterState) => {
    uiStore.updateFilters(filters)
    // Additional logic
  }
  
  return {
    visibleMatters,
    filterAndSort
  }
}
```

## Testing Strategy

### 1. Unit Tests for Stores

```typescript
// tests/stores/matter.test.ts
import { createPinia, setActivePinia } from 'pinia'
import { useMatterStore } from '@/stores/kanban/matters'

describe('Matter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should update matter optimistically', async () => {
    const store = useMatterStore()
    
    // Mock API
    const mockApi = vi.fn().mockResolvedValue({ data: { id: '1', status: 'completed' } })
    
    // Test optimistic update
    store.matters = [{ id: '1', status: 'in_progress' }]
    await store.updateMatter('1', { status: 'completed' })
    
    expect(store.matters[0].status).toBe('completed')
    expect(mockApi).toHaveBeenCalledWith('1', { status: 'completed' })
  })
  
  it('should rollback on error', async () => {
    const store = useMatterStore()
    
    // Mock API error
    const mockApi = vi.fn().mockRejectedValue(new Error('Network error'))
    
    // Test rollback
    store.matters = [{ id: '1', status: 'in_progress' }]
    
    await expect(store.updateMatter('1', { status: 'completed' })).rejects.toThrow()
    expect(store.matters[0].status).toBe('in_progress') // Rolled back
  })
})
```

### 2. Integration Tests

```typescript
// tests/integration/kanban-workflow.test.ts
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import KanbanBoard from '@/components/KanbanBoard.vue'

describe('Kanban Workflow Integration', () => {
  it('should handle complete drag and drop workflow', async () => {
    const wrapper = mount(KanbanBoard, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    // Test drag and drop
    const matterCard = wrapper.find('[data-testid="matter-1"]')
    const targetColumn = wrapper.find('[data-testid="column-completed"]')
    
    await matterCard.trigger('dragstart')
    await targetColumn.trigger('drop')
    
    // Verify state update
    const store = useKanbanStore()
    expect(store.matters.find(m => m.id === '1')?.status).toBe('completed')
  })
})
```

## Performance Considerations

### 1. Optimize Reactivity

```typescript
// Use shallowRef for large arrays
const matters = shallowRef<Matter[]>([])

// Use markRaw for non-reactive objects
const apiClient = markRaw(new ApiClient())

// Use readonly for read-only state
const readonlyMatters = readonly(matters)
```

### 2. Minimize Watchers

```typescript
// Use watchEffect for automatic dependency tracking
watchEffect(() => {
  // Automatically tracks dependencies
  console.log('Matters count:', matters.value.length)
})

// Use watch with specific dependencies
watch(
  () => [filters.value.searchQuery, filters.value.selectedStatuses],
  ([newQuery, newStatuses]) => {
    // Only runs when these specific values change
    performSearch(newQuery, newStatuses)
  }
)
```

### 3. Debounce Expensive Operations

```typescript
import { debounce } from 'lodash-es'

const debouncedSearch = debounce((query: string) => {
  performSearch(query)
}, 300)

const searchQuery = ref('')
watch(searchQuery, debouncedSearch)
```

## SSR Considerations

### 1. Hydration Safety

```typescript
// Use onMounted for client-only code
onMounted(() => {
  // Load preferences from localStorage
  loadPreferences()
  
  // Start real-time polling
  startPolling()
})

// Use process.client for conditional logic
if (process.client) {
  // Client-only code
  window.addEventListener('beforeunload', saveState)
}
```

### 2. Server State Initialization

```typescript
// Server-side data fetching
export const useServerKanbanData = async () => {
  const { data } = await $fetch('/api/kanban/matters')
  
  // Initialize store with server data
  const store = useMatterStore()
  store.matters = data
  
  return { matters: data }
}
```

## Migration Checklist

### Phase 1: Basic Store Structure
- [ ] Create modular store files
- [ ] Define TypeScript interfaces
- [ ] Implement basic CRUD operations
- [ ] Add error handling

### Phase 2: Advanced Features
- [ ] Implement optimistic updates
- [ ] Add conflict resolution
- [ ] Create persistence layer
- [ ] Add real-time sync

### Phase 3: Performance & Testing
- [ ] Optimize reactivity
- [ ] Add comprehensive tests
- [ ] Implement SSR support
- [ ] Add performance monitoring

### Phase 4: Integration
- [ ] Connect to Vue components
- [ ] Add Storybook stories
- [ ] Update documentation
- [ ] Performance testing

## Success Metrics

1. **Functionality**: All kanban operations work correctly
2. **Performance**: Store operations complete in <50ms
3. **Reliability**: Optimistic updates have <1% rollback rate
4. **User Experience**: Smooth interactions with immediate feedback
5. **Code Quality**: 100% TypeScript coverage, 90% test coverage

## Resources

### Pinia Documentation
- [Pinia Store Setup](https://pinia.vuejs.org/core-concepts/)
- [Composition API](https://pinia.vuejs.org/core-concepts/composables.html)
- [TypeScript Support](https://pinia.vuejs.org/core-concepts/typescript.html)
- [Persistence Plugin](https://github.com/prazdevs/pinia-plugin-persistedstate)

### Vue 3 Reactivity
- [Reactivity API](https://vuejs.org/api/reactivity-core.html)
- [Composition API](https://vuejs.org/api/composition-api-setup.html)
- [Performance Optimization](https://vuejs.org/guide/best-practices/performance.html)

### Best Practices
- [Vue 3 State Management](https://vuejs.org/guide/scaling-up/state-management.html)
- [Pinia Best Practices](https://pinia.vuejs.org/core-concepts/best-practices.html)
- [TypeScript with Vue](https://vuejs.org/guide/typescript/overview.html)

## Notes

This implementation provides a robust foundation for kanban state management in Vue 3/Nuxt.js while maintaining the sophisticated features of the React implementation. The modular architecture allows for easy testing, maintenance, and future enhancements while leveraging Pinia's strengths in Vue 3 ecosystem integration.