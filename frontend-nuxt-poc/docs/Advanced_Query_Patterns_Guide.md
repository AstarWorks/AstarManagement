# Advanced TanStack Query Patterns Guide

## Overview

This guide covers the advanced TanStack Query patterns implemented for the Aster Management legal case management system. These patterns provide sophisticated data fetching, caching, and synchronization capabilities tailored for legal workflows.

## Table of Contents

1. [Infinite Queries](#infinite-queries)
2. [Search and Suggestions](#search-and-suggestions)
3. [Filter State Management](#filter-state-management)
4. [SSR Prefetch Utilities](#ssr-prefetch-utilities)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Query Persistence](#query-persistence)
7. [Cache Management](#cache-management)
8. [Performance Optimization](#performance-optimization)
9. [Best Practices](#best-practices)

## Infinite Queries

### Basic Infinite Query Usage

```vue
<script setup lang="ts">
import { useInfiniteMattersQuery } from '~/composables/useAdvancedMattersQuery'

const filters = ref<MatterFilters>({ status: 'active' })

const {
  data,
  isPending,
  error,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage
} = useInfiniteMattersQuery(filters)

// All pages data
const allMatters = computed(() => 
  data.value?.pages.flatMap(page => page.items) ?? []
)
</script>

<template>
  <div class="matter-list">
    <!-- Loading state -->
    <div v-if="isPending" class="loading">
      Loading matters...
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>
    
    <!-- Success state -->
    <div v-else>
      <!-- Load previous button -->
      <button 
        v-if="hasPreviousPage"
        @click="fetchPreviousPage()"
        :disabled="isFetchingPreviousPage"
        class="load-previous"
      >
        {{ isFetchingPreviousPage ? 'Loading...' : 'Load Previous' }}
      </button>
      
      <!-- Matter cards -->
      <div v-for="matter in allMatters" :key="matter.id" class="matter-card">
        <h3>{{ matter.title }}</h3>
        <p>{{ matter.description }}</p>
        <span class="status">{{ matter.status }}</span>
      </div>
      
      <!-- Load more button -->
      <button 
        v-if="hasNextPage"
        @click="fetchNextPage()"
        :disabled="isFetchingNextPage"
        class="load-more"
      >
        {{ isFetchingNextPage ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
</template>
```

### Bidirectional Infinite Scrolling

```typescript
// Bidirectional scrolling with intersection observer
export function useInfiniteScrolling(
  infiniteQuery: ReturnType<typeof useInfiniteMattersQuery>
) {
  const topTrigger = ref<HTMLElement>()
  const bottomTrigger = ref<HTMLElement>()
  
  // Load more when bottom trigger is visible
  useIntersectionObserver(bottomTrigger, ([{ isIntersecting }]) => {
    if (isIntersecting && infiniteQuery.hasNextPage.value && !infiniteQuery.isFetchingNextPage.value) {
      infiniteQuery.fetchNextPage()
    }
  })
  
  // Load previous when top trigger is visible
  useIntersectionObserver(topTrigger, ([{ isIntersecting }]) => {
    if (isIntersecting && infiniteQuery.hasPreviousPage.value && !infiniteQuery.isFetchingPreviousPage.value) {
      infiniteQuery.fetchPreviousPage()
    }
  })
  
  return {
    topTrigger,
    bottomTrigger
  }
}
```

## Search and Suggestions

### Real-time Search with Debouncing

```vue
<script setup lang="ts">
import { useMatterSearchQuery, useSearchSuggestionsQuery } from '~/composables/useAdvancedMattersQuery'
import { useDebouncedRef } from '@vueuse/core'

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput, 300)

// Search results
const { 
  data: searchResults, 
  isPending: isSearching,
  error: searchError 
} = useMatterSearchQuery(debouncedSearch)

// Search suggestions
const { 
  data: suggestions, 
  isPending: isLoadingSuggestions 
} = useSearchSuggestionsQuery(searchInput)

const showSuggestions = computed(() => 
  searchInput.value.length > 0 && 
  !isSearching.value && 
  suggestions.value && 
  suggestions.value.length > 0
)
</script>

<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <input
        v-model="searchInput"
        type="search"
        placeholder="Search matters..."
        class="search-input"
        autocomplete="off"
      />
      
      <!-- Loading indicator -->
      <div v-if="isSearching" class="search-loading">
        <SpinnerIcon class="animate-spin" />
      </div>
    </div>
    
    <!-- Search suggestions dropdown -->
    <div v-if="showSuggestions" class="suggestions-dropdown">
      <div 
        v-for="suggestion in suggestions" 
        :key="suggestion.id"
        @click="searchInput = suggestion.text"
        class="suggestion-item"
      >
        <span class="suggestion-text">{{ suggestion.text }}</span>
        <span class="suggestion-type">{{ suggestion.type }}</span>
        <span v-if="suggestion.count" class="suggestion-count">
          {{ suggestion.count }}
        </span>
      </div>
    </div>
    
    <!-- Search results -->
    <div v-if="searchResults" class="search-results">
      <div v-if="searchResults.items.length === 0" class="no-results">
        No matters found for "{{ debouncedSearch }}"
      </div>
      
      <div v-else class="results-list">
        <div 
          v-for="matter in searchResults.items" 
          :key="matter.id"
          class="result-item"
        >
          <h3>{{ matter.title }}</h3>
          <p>{{ matter.description }}</p>
          <div class="result-meta">
            <span class="status">{{ matter.status }}</span>
            <span class="priority">{{ matter.priority }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

### Infinite Search Results

```vue
<script setup lang="ts">
import { useInfiniteSearchQuery } from '~/composables/useAdvancedMattersQuery'

const searchQuery = ref('')
const filters = ref<MatterFilters>({})

const {
  data,
  isPending,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteSearchQuery(searchQuery, filters)

const allSearchResults = computed(() =>
  data.value?.pages.flatMap(page => page.items) ?? []
)
</script>

<template>
  <div class="infinite-search">
    <input v-model="searchQuery" placeholder="Search..." />
    
    <div v-if="isPending" class="loading">Searching...</div>
    
    <div v-else-if="allSearchResults.length > 0" class="results">
      <div v-for="matter in allSearchResults" :key="matter.id">
        {{ matter.title }}
      </div>
      
      <button 
        v-if="hasNextPage"
        @click="fetchNextPage()"
        :disabled="isFetchingNextPage"
      >
        {{ isFetchingNextPage ? 'Loading...' : 'Load More Results' }}
      </button>
    </div>
    
    <div v-else-if="searchQuery.length >= 2" class="no-results">
      No results found
    </div>
  </div>
</template>
```

## Filter State Management

### Advanced Filter Component

```vue
<script setup lang="ts">
import { useFilterState } from '~/composables/useAdvancedMattersQuery'

const {
  filters,
  hasActiveFilters,
  filterCount,
  updateFilter,
  resetFilters,
  addTag,
  removeTag
} = useFilterState()

// Predefined filter options
const statusOptions = ['draft', 'active', 'completed', 'archived']
const priorityOptions = ['low', 'medium', 'high']

// Date range handling
const dateRange = computed({
  get: () => ({
    from: filters.value.dateFrom ? new Date(filters.value.dateFrom) : null,
    to: filters.value.dateTo ? new Date(filters.value.dateTo) : null
  }),
  set: (range) => {
    updateFilter('dateFrom', range.from?.toISOString().split('T')[0] || '')
    updateFilter('dateTo', range.to?.toISOString().split('T')[0] || '')
  }
})
</script>

<template>
  <div class="filter-panel">
    <div class="filter-header">
      <h3>Filters</h3>
      <div class="filter-actions">
        <span v-if="filterCount > 0" class="filter-count">
          {{ filterCount }} active
        </span>
        <button 
          v-if="hasActiveFilters"
          @click="resetFilters()"
          class="reset-button"
        >
          Clear All
        </button>
      </div>
    </div>
    
    <!-- Search filter -->
    <div class="filter-group">
      <label>Search</label>
      <input
        :value="filters.search"
        @input="updateFilter('search', $event.target.value)"
        placeholder="Search matters..."
      />
    </div>
    
    <!-- Status filter -->
    <div class="filter-group">
      <label>Status</label>
      <select
        :value="filters.status"
        @change="updateFilter('status', $event.target.value)"
      >
        <option value="">All Statuses</option>
        <option v-for="status in statusOptions" :key="status" :value="status">
          {{ status }}
        </option>
      </select>
    </div>
    
    <!-- Priority filter -->
    <div class="filter-group">
      <label>Priority</label>
      <select
        :value="filters.priority"
        @change="updateFilter('priority', $event.target.value)"
      >
        <option value="">All Priorities</option>
        <option v-for="priority in priorityOptions" :key="priority" :value="priority">
          {{ priority }}
        </option>
      </select>
    </div>
    
    <!-- Date range filter -->
    <div class="filter-group">
      <label>Date Range</label>
      <DateRangePicker v-model="dateRange" />
    </div>
    
    <!-- Tags filter -->
    <div class="filter-group">
      <label>Tags</label>
      <div class="tag-input">
        <input
          @keyup.enter="addTag($event.target.value); $event.target.value = ''"
          placeholder="Add tag..."
        />
      </div>
      <div v-if="filters.tags && filters.tags.length > 0" class="active-tags">
        <span 
          v-for="tag in filters.tags" 
          :key="tag"
          class="tag"
        >
          {{ tag }}
          <button @click="removeTag(tag)" class="tag-remove">×</button>
        </span>
      </div>
    </div>
  </div>
</template>
```

### URL-Synchronized Filters

The filter state automatically synchronizes with the URL query parameters:

```typescript
// URL: /matters?status=active&priority=high&search=contract

const { filters } = useFilterState()

// filters.value will be:
// {
//   status: 'active',
//   priority: 'high', 
//   search: 'contract',
//   // ... other filters with default values
// }

// Updating filters automatically updates the URL
updateFilter('status', 'completed')
// URL becomes: /matters?status=completed&priority=high&search=contract
```

## SSR Prefetch Utilities

### Page-Level Prefetching

```vue
<!-- pages/matters.vue -->
<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { matterPrefetchUtils } from '~/composables/useAdvancedMattersQuery'

const queryClient = useQueryClient()
const route = useRoute()

// Extract filters from URL query parameters
const initialFilters: MatterFilters = {
  status: route.query.status as string,
  priority: route.query.priority as string,
  search: route.query.search as string
}

// Prefetch data during SSR
await matterPrefetchUtils.prefetchMatters(queryClient, initialFilters)
await matterPrefetchUtils.prefetchStatistics(queryClient, initialFilters)

// Set up reactive queries that will use prefetched data
const { filters } = useFilterState(initialFilters)
const { data: matters } = useMattersQuery(filters)
const { data: statistics } = useMatterStatisticsQuery(filters)
</script>

<template>
  <div class="matters-page">
    <MatterFilters />
    <MatterList :matters="matters" />
    <MatterStatistics :stats="statistics" />
  </div>
</template>
```

### Advanced Prefetch Strategies

```typescript
// Custom prefetch composable for dashboard
export function useDashboardPrefetch() {
  const queryClient = useQueryClient()
  
  const prefetchDashboardData = async () => {
    // Prefetch multiple data sources in parallel
    await Promise.all([
      matterPrefetchUtils.prefetchMatters(queryClient, { status: 'active' }),
      matterPrefetchUtils.prefetchStatistics(queryClient),
      matterPrefetchUtils.prefetchInfiniteMatters(queryClient, { 
        limit: 20,
        sort: 'updatedAt',
        order: 'desc'
      })
    ])
  }
  
  // Prefetch on route navigation
  const router = useRouter()
  router.beforeEach(async (to) => {
    if (to.path === '/dashboard') {
      await prefetchDashboardData()
    }
  })
  
  return {
    prefetchDashboardData
  }
}
```

## Real-time Subscriptions

### Component-Level Subscriptions

```vue
<script setup lang="ts">
import { useMatterSubscription, useMatterDetailSubscription } from '~/composables/useQuerySubscriptions'

const props = defineProps<{
  matterId?: string
}>()

// General matter updates subscription
const {
  isConnected,
  connectionError,
  connect,
  disconnect
} = useMatterSubscription()

// Specific matter subscription
if (props.matterId) {
  const matterId = ref(props.matterId)
  useMatterDetailSubscription(matterId)
}

// Connection status indicator
const connectionStatus = computed(() => {
  if (connectionError.value) return 'error'
  return isConnected.value ? 'connected' : 'disconnected'
})
</script>

<template>
  <div class="matter-view">
    <!-- Connection status -->
    <div class="connection-status" :class="connectionStatus">
      <span v-if="connectionStatus === 'connected'">🟢 Live</span>
      <span v-else-if="connectionStatus === 'error'">🔴 Connection Error</span>
      <span v-else>🟡 Connecting...</span>
    </div>
    
    <!-- Matter content -->
    <MatterDetails :matter-id="matterId" />
  </div>
</template>
```

### Polling Fallback

```vue
<script setup lang="ts">
import { usePollingFallback } from '~/composables/useQuerySubscriptions'

// Enable polling when WebSocket is not available
const pollingEnabled = ref(true)
const { pollingInterval, setPollingInterval } = usePollingFallback(pollingEnabled)

// Adjust polling frequency based on user activity
const { idle } = useIdle(60000) // 1 minute idle detection

watch(idle, (isIdle) => {
  if (isIdle) {
    setPollingInterval(60000) // Poll every minute when idle
  } else {
    setPollingInterval(30000) // Poll every 30 seconds when active
  }
})
</script>
```

## Query Persistence

### Auto-Persistence Setup

```vue
<!-- layouts/default.vue -->
<script setup lang="ts">
import { useQueryPersistenceInit } from '~/composables/useQueryPersistence'

// Initialize persistence on app startup
const {
  isSupported,
  isInitialized,
  cacheStats,
  cacheSize
} = useQueryPersistenceInit()
</script>

<template>
  <div class="app-layout">
    <!-- Cache info in dev mode -->
    <div v-if="$dev && isInitialized" class="cache-info">
      <small>
        Cache: {{ cacheStats.totalEntries }} entries ({{ cacheSize }})
      </small>
    </div>
    
    <slot />
  </div>
</template>
```

### Manual Persistence Control

```vue
<script setup lang="ts">
import { useQueryPersistence } from '~/composables/useQueryPersistence'

const {
  persistQuery,
  restoreQuery,
  clearCache,
  cacheStats
} = useQueryPersistence({
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  compression: true
})

// Manual persistence for important queries
const saveImportantData = async () => {
  const importantMatters = await fetchImportantMatters()
  await persistQuery('important-matters', importantMatters)
}

// Restore on app startup
onMounted(async () => {
  const cachedMatters = await restoreQuery('important-matters')
  if (cachedMatters) {
    // Use cached data while fresh data loads
    console.log('Restored cached matters:', cachedMatters)
  }
})
</script>
```

### Filter Preferences Persistence

```vue
<script setup lang="ts">
import { useFilterPersistence } from '~/composables/useQueryPersistence'

const { user } = useAuth()
const { saveFilters, loadFilters } = useFilterPersistence(user.id)

// Save current filters as default
const saveAsDefault = async () => {
  await saveFilters(filters.value)
  toast.success('Filter preferences saved')
}

// Save named filter preset
const saveFilterPreset = async (name: string) => {
  await saveFilters(filters.value, name)
  toast.success(`Filter preset "${name}" saved`)
}

// Load saved filters on page load
onMounted(async () => {
  const savedFilters = await loadFilters()
  if (savedFilters) {
    Object.assign(filters.value, savedFilters)
  }
})
</script>
```

## Cache Management

### Intelligent Cache Invalidation

```typescript
// Automatic invalidation based on mutations
export function useSmartCacheInvalidation() {
  const queryClient = useQueryClient()
  
  // Invalidate related queries when a matter is updated
  const invalidateOnMatterUpdate = (matterId: string, changes: Partial<Matter>) => {
    // Always invalidate the specific matter
    queryClient.invalidateQueries({
      queryKey: queryKeys.detail(matterId)
    })
    
    // Invalidate lists if status changed
    if (changes.status) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists()
      })
      
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics()
      })
    }
    
    // Invalidate assignee queries if assignee changed
    if (changes.assigneeId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignedMatters(changes.assigneeId)
      })
    }
  }
  
  return {
    invalidateOnMatterUpdate
  }
}
```

### Selective Cache Updates

```typescript
// Update cache without full refetch
export function useOptimisticCacheUpdates() {
  const queryClient = useQueryClient()
  
  const updateMatterInCache = (matterId: string, updates: Partial<Matter>) => {
    // Update detail cache
    queryClient.setQueryData(
      queryKeys.detail(matterId),
      (oldData: Matter | undefined) => {
        if (!oldData) return oldData
        return { ...oldData, ...updates }
      }
    )
    
    // Update in list caches
    queryClient.setQueriesData(
      { queryKey: queryKeys.lists() },
      (oldData: PaginatedResponse<Matter> | undefined) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          items: oldData.items.map(matter =>
            matter.id === matterId ? { ...matter, ...updates } : matter
          )
        }
      }
    )
  }
  
  return {
    updateMatterInCache
  }
}
```

## Performance Optimization

### Query Deduplication

```typescript
// Automatic deduplication for rapid successive calls
const { data } = useMattersQuery(filters, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false
})
```

### Background Refetching

```typescript
// Keep data fresh with background updates
const { data } = useMattersQuery(filters, {
  refetchInterval: 30000, // 30 seconds
  refetchIntervalInBackground: true,
  staleTime: 0 // Always consider stale for background refetch
})
```

### Memory Management

```typescript
// Limit cache size and cleanup old queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  }
})

// Periodic cleanup
setInterval(() => {
  queryClient.clear() // Remove unused queries
}, 10 * 60 * 1000) // Every 10 minutes
```

## Best Practices

### 1. Query Key Consistency

Always use the centralized query key factory:

```typescript
// ✅ Good
const { data } = useQuery({
  queryKey: queryKeys.list(filters),
  queryFn: () => fetchMatters(filters)
})

// ❌ Bad
const { data } = useQuery({
  queryKey: ['matters', 'list', filters],
  queryFn: () => fetchMatters(filters)
})
```

### 2. Error Boundaries

Implement proper error handling:

```vue
<script setup lang="ts">
const { data, error, isError } = useMattersQuery()

const errorMessage = computed(() => {
  if (!isError.value) return null
  
  if (error.value?.code === 'NETWORK_ERROR') {
    return 'Please check your internet connection'
  }
  
  if (error.value?.status === 403) {
    return 'You do not have permission to view these matters'
  }
  
  return 'An unexpected error occurred'
})
</script>

<template>
  <div>
    <ErrorAlert v-if="errorMessage" :message="errorMessage" />
    <MatterList v-else :matters="data" />
  </div>
</template>
```

### 3. Loading States

Provide meaningful loading indicators:

```vue
<script setup lang="ts">
const { data, isPending, isFetching, isPlaceholderData } = useMattersQuery()

const loadingState = computed(() => {
  if (isPending) return 'initial'
  if (isFetching && !isPlaceholderData.value) return 'refetching'
  if (isPlaceholderData.value) return 'placeholder'
  return 'loaded'
})
</script>

<template>
  <div class="matter-list">
    <div v-if="loadingState === 'initial'" class="loading-skeleton">
      <MatterCardSkeleton v-for="i in 5" :key="i" />
    </div>
    
    <div v-else class="matter-grid" :class="{ 'updating': loadingState === 'refetching' }">
      <MatterCard v-for="matter in data?.items" :key="matter.id" :matter="matter" />
    </div>
  </div>
</template>
```

### 4. Type Safety

Ensure full TypeScript coverage:

```typescript
// Define strict types for all query functions
export function useTypedMattersQuery(
  filters: MaybeRef<MatterFilters>,
  options?: Partial<UseQueryOptions<PaginatedResponse<Matter>, QueryError>>
): UseQueryResult<PaginatedResponse<Matter>, QueryError> {
  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Matter>> => {
      // Implementation with proper typing
    },
    ...options
  })
}
```

### 5. Accessibility

Include proper ARIA attributes and screen reader support:

```vue
<template>
  <div class="search-results" role="region" aria-label="Search Results">
    <div 
      v-if="isPending" 
      aria-live="polite" 
      aria-busy="true"
      class="loading"
    >
      Searching for matters...
    </div>
    
    <div 
      v-else-if="data?.items.length === 0"
      role="status"
      aria-live="polite"
    >
      No matters found matching your criteria
    </div>
    
    <div v-else>
      <div 
        role="status" 
        aria-live="polite"
        class="sr-only"
      >
        Found {{ data.total }} matters
      </div>
      
      <div role="list">
        <article 
          v-for="matter in data.items" 
          :key="matter.id"
          role="listitem"
          :aria-labelledby="`matter-title-${matter.id}`"
        >
          <h3 :id="`matter-title-${matter.id}`">{{ matter.title }}</h3>
          <!-- Matter content -->
        </article>
      </div>
    </div>
  </div>
</template>
```

This guide provides a comprehensive overview of the advanced TanStack Query patterns implemented for the Aster Management system. These patterns enable sophisticated data management while maintaining excellent performance and user experience.