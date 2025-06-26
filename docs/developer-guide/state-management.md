# State Management Guide - Aster Management

This guide covers state management patterns using Pinia and TanStack Query in the Aster Management Nuxt.js application.

## Table of Contents

1. [State Management Architecture](#state-management-architecture)
2. [Pinia Store Patterns](#pinia-store-patterns)
3. [TanStack Query Integration](#tanstack-query-integration)
4. [State Synchronization](#state-synchronization)
5. [Offline Support](#offline-support)
6. [Real-time Updates](#real-time-updates)
7. [Performance Optimization](#performance-optimization)

## State Management Architecture

### Overview

Our state management strategy uses a hybrid approach:

- **Pinia**: Client-side application state (UI state, user preferences, local data)
- **TanStack Query**: Server state management (API data, caching, synchronization)
- **localStorage/sessionStorage**: Persistence for user preferences and form drafts

```
┌─────────────────────────────────────────────────────────────┐
│                    State Management                         │
├─────────────────────────────────────────────────────────────┤
│  Client State (Pinia)          │  Server State (TanStack)   │
│  ├── UI State                  │  ├── API Data             │
│  ├── User Preferences          │  ├── Cache Management     │
│  ├── Form State                │  ├── Background Sync      │
│  └── Navigation State          │  └── Error Handling       │
├─────────────────────────────────────────────────────────────┤
│                    Persistence Layer                        │
│  ├── localStorage (preferences)                            │
│  ├── sessionStorage (temp data)                           │
│  └── IndexedDB (offline cache)                            │
└─────────────────────────────────────────────────────────────┘
```

### State Categories

#### 1. Client State (Pinia)
- UI state (sidebar open/closed, modals, themes)
- User preferences and settings
- Form state and validation
- Navigation state and breadcrumbs
- Local application logic

#### 2. Server State (TanStack Query)
- API responses and caching
- Background data synchronization
- Optimistic updates
- Error handling and retry logic
- Loading states

## Pinia Store Patterns

### Store Structure

Create focused stores for different domains:

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const permissions = ref<string[]>([])
  const isLoading = ref(false)
  
  // Getters (computed)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => permissions.value.includes('admin'))
  const userInitials = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName[0]}${user.value.lastName[0]}`
  })
  
  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      user.value = response.user
      token.value = response.token
      permissions.value = response.permissions
      
      // Persist token
      const authCookie = useCookie('auth-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      authCookie.value = response.token
      
    } catch (error) {
      throw new Error('Login failed')
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      token.value = null
      permissions.value = []
      
      // Clear cookie
      const authCookie = useCookie('auth-token')
      authCookie.value = null
      
      // Redirect to login
      await navigateTo('/auth/login')
    }
  }
  
  const refreshToken = async () => {
    try {
      const response = await $fetch('/api/auth/refresh', {
        method: 'POST'
      })
      token.value = response.token
    } catch (error) {
      await logout()
    }
  }
  
  // Hydration
  const hydrate = () => {
    const authCookie = useCookie('auth-token')
    if (authCookie.value) {
      token.value = authCookie.value
      // Fetch user data
      fetchUser()
    }
  }
  
  const fetchUser = async () => {
    if (!token.value) return
    
    try {
      const userData = await $fetch('/api/auth/me')
      user.value = userData.user
      permissions.value = userData.permissions
    } catch (error) {
      await logout()
    }
  }
  
  return {
    // State (readonly)
    user: readonly(user),
    token: readonly(token),
    permissions: readonly(permissions),
    isLoading: readonly(isLoading),
    
    // Getters
    isAuthenticated,
    isAdmin,
    userInitials,
    
    // Actions
    login,
    logout,
    refreshToken,
    hydrate,
    fetchUser
  }
})
```

### UI State Store

Manage global UI state:

```typescript
// stores/ui.ts
export const useUIStore = defineStore('ui', () => {
  // State
  const sidebarOpen = ref(true)
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const activeModal = ref<string | null>(null)
  const toasts = ref<Toast[]>([])
  const loading = ref<Record<string, boolean>>({})
  
  // Computed
  const effectiveTheme = computed(() => {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
    }
    return theme.value
  })
  
  // Actions
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    theme.value = newTheme
    // Persist preference
    localStorage.setItem('theme', newTheme)
    // Apply theme
    applyTheme()
  }
  
  const applyTheme = () => {
    const root = document.documentElement
    if (effectiveTheme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
  
  const openModal = (modalId: string) => {
    activeModal.value = modalId
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
  }
  
  const closeModal = () => {
    activeModal.value = null
    document.body.style.overflow = ''
  }
  
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2)
    const newToast = { ...toast, id }
    toasts.value.push(newToast)
    
    // Auto-remove after timeout
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }
  
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const setLoading = (key: string, isLoading: boolean) => {
    loading.value[key] = isLoading
  }
  
  // Initialize
  const initialize = () => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system'
    if (savedTheme) {
      theme.value = savedTheme
    }
    applyTheme()
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
  }
  
  return {
    // State
    sidebarOpen: readonly(sidebarOpen),
    theme: readonly(theme),
    activeModal: readonly(activeModal),
    toasts: readonly(toasts),
    loading: readonly(loading),
    
    // Computed
    effectiveTheme,
    
    // Actions
    toggleSidebar,
    setTheme,
    openModal,
    closeModal,
    addToast,
    removeToast,
    setLoading,
    initialize
  }
})
```

### Domain-Specific Stores

Create stores for specific business domains:

```typescript
// stores/cases.ts
export const useCasesStore = defineStore('cases', () => {
  // State
  const selectedCase = ref<Case | null>(null)
  const filters = ref<CaseFilters>({
    status: [],
    priority: [],
    assignee: [],
    dateRange: null
  })
  const sortBy = ref<CaseSortField>('updatedAt')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const viewMode = ref<'grid' | 'list' | 'kanban'>('kanban')
  
  // Actions
  const selectCase = (case: Case) => {
    selectedCase.value = case
  }
  
  const clearSelection = () => {
    selectedCase.value = null
  }
  
  const updateFilters = (newFilters: Partial<CaseFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  const resetFilters = () => {
    filters.value = {
      status: [],
      priority: [],
      assignee: [],
      dateRange: null
    }
  }
  
  const setSorting = (field: CaseSortField, order: 'asc' | 'desc') => {
    sortBy.value = field
    sortOrder.value = order
  }
  
  const setViewMode = (mode: 'grid' | 'list' | 'kanban') => {
    viewMode.value = mode
    // Persist preference
    localStorage.setItem('cases-view-mode', mode)
  }
  
  // Computed
  const hasActiveFilters = computed(() => {
    return filters.value.status.length > 0 ||
           filters.value.priority.length > 0 ||
           filters.value.assignee.length > 0 ||
           filters.value.dateRange !== null
  })
  
  // Initialize
  const initialize = () => {
    const savedViewMode = localStorage.getItem('cases-view-mode') as 'grid' | 'list' | 'kanban'
    if (savedViewMode) {
      viewMode.value = savedViewMode
    }
  }
  
  return {
    // State
    selectedCase: readonly(selectedCase),
    filters: readonly(filters),
    sortBy: readonly(sortBy),
    sortOrder: readonly(sortOrder),
    viewMode: readonly(viewMode),
    
    // Computed
    hasActiveFilters,
    
    // Actions
    selectCase,
    clearSelection,
    updateFilters,
    resetFilters,
    setSorting,
    setViewMode,
    initialize
  }
})
```

## TanStack Query Integration

### Query Setup

Configure TanStack Query for server state:

```typescript
// plugins/vue-query.client.ts
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on 401/403
          if (error?.status === 401 || error?.status === 403) {
            return false
          }
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          const ui = useUIStore()
          ui.addToast({
            type: 'error',
            title: 'Operation Failed',
            message: error.message || 'Something went wrong'
          })
        }
      }
    }
  })
  
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
```

### Query Composables

Create composables for data fetching:

```typescript
// composables/api/useCases.ts
export function useCases(filters?: MaybeRef<CaseFilters>) {
  const queryKey = computed(() => ['cases', unref(filters)])
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      const filterValues = unref(filters)
      
      if (filterValues?.status?.length) {
        params.append('status', filterValues.status.join(','))
      }
      if (filterValues?.priority?.length) {
        params.append('priority', filterValues.priority.join(','))
      }
      
      const response = await $fetch(`/api/cases?${params}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useCase(id: MaybeRef<string>) {
  const caseId = computed(() => unref(id))
  
  return useQuery({
    queryKey: computed(() => ['cases', caseId.value]),
    queryFn: () => $fetch(`/api/cases/${caseId.value}`),
    enabled: computed(() => !!caseId.value),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useCreateCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCaseRequest) => 
      $fetch('/api/cases', { method: 'POST', body: data }),
    onSuccess: (newCase) => {
      // Update cases list cache
      queryClient.setQueryData(['cases'], (old: Case[] = []) => [newCase, ...old])
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      
      // Show success message
      const ui = useUIStore()
      ui.addToast({
        type: 'success',
        title: 'Case Created',
        message: `Case "${newCase.title}" has been created successfully`
      })
    }
  })
}

export function useUpdateCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCaseRequest }) =>
      $fetch(`/api/cases/${id}`, { method: 'PUT', body: data }),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cases', id] })
      
      // Snapshot previous value
      const previousCase = queryClient.getQueryData(['cases', id])
      
      // Optimistically update
      queryClient.setQueryData(['cases', id], (old: Case) => ({
        ...old,
        ...data
      }))
      
      return { previousCase }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCase) {
        queryClient.setQueryData(['cases', variables.id], context.previousCase)
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['cases', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    }
  })
}
```

### Infinite Queries

Handle paginated data:

```typescript
// composables/api/useCasesPaginated.ts
export function useCasesPaginated(filters?: MaybeRef<CaseFilters>) {
  return useInfiniteQuery({
    queryKey: computed(() => ['cases', 'paginated', unref(filters)]),
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      params.append('page', pageParam.toString())
      params.append('limit', '20')
      
      const filterValues = unref(filters)
      if (filterValues?.status?.length) {
        params.append('status', filterValues.status.join(','))
      }
      
      return $fetch(`/api/cases?${params}`)
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
    initialPageParam: 1
  })
}

// Usage in component
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  error
} = useCasesPaginated(filters)

const allCases = computed(() => 
  data.value?.pages.flatMap(page => page.data) ?? []
)
```

## State Synchronization

### Real-time Updates

Integrate WebSocket updates with query cache:

```typescript
// composables/useWebSocket.ts
export function useWebSocket() {
  const queryClient = useQueryClient()
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  
  const connect = () => {
    const wsUrl = useRuntimeConfig().public.wsUrl
    socket.value = new WebSocket(wsUrl)
    
    socket.value.onopen = () => {
      isConnected.value = true
      console.log('WebSocket connected')
    }
    
    socket.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }
    
    socket.value.onclose = () => {
      isConnected.value = false
      console.log('WebSocket disconnected')
      // Reconnect after delay
      setTimeout(connect, 5000)
    }
    
    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }
  
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'CASE_UPDATED':
        // Update specific case cache
        queryClient.setQueryData(['cases', message.data.id], message.data)
        // Invalidate cases list
        queryClient.invalidateQueries({ queryKey: ['cases'] })
        break
        
      case 'CASE_CREATED':
        // Add to cases list
        queryClient.setQueryData(['cases'], (old: Case[] = []) => 
          [message.data, ...old]
        )
        break
        
      case 'CASE_DELETED':
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['cases', message.data.id] })
        queryClient.setQueryData(['cases'], (old: Case[] = []) =>
          old.filter(c => c.id !== message.data.id)
        )
        break
    }
  }
  
  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
      isConnected.value = false
    }
  }
  
  // Auto-connect on mount
  onMounted(connect)
  onUnmounted(disconnect)
  
  return {
    isConnected: readonly(isConnected),
    connect,
    disconnect
  }
}
```

### Optimistic Updates

Implement optimistic updates for better UX:

```typescript
// composables/api/useCaseStatus.ts
export function useCaseStatusUpdate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ caseId, status }: { caseId: string; status: CaseStatus }) =>
      $fetch(`/api/cases/${caseId}/status`, {
        method: 'PATCH',
        body: { status }
      }),
    onMutate: async ({ caseId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cases'] })
      await queryClient.cancelQueries({ queryKey: ['cases', caseId] })
      
      // Snapshot previous values
      const previousCases = queryClient.getQueryData(['cases'])
      const previousCase = queryClient.getQueryData(['cases', caseId])
      
      // Optimistically update cases list
      queryClient.setQueryData(['cases'], (old: Case[] = []) =>
        old.map(c => c.id === caseId ? { ...c, status } : c)
      )
      
      // Optimistically update individual case
      queryClient.setQueryData(['cases', caseId], (old: Case) =>
        old ? { ...old, status } : old
      )
      
      return { previousCases, previousCase }
    },
    onError: (err, { caseId }, context) => {
      // Rollback optimistic updates
      if (context?.previousCases) {
        queryClient.setQueryData(['cases'], context.previousCases)
      }
      if (context?.previousCase) {
        queryClient.setQueryData(['cases', caseId], context.previousCase)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    }
  })
}
```

## Offline Support

### Cache Persistence

Implement offline-first patterns:

```typescript
// plugins/query-persistence.client.ts
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { experimental_createPersister } from '@tanstack/query-persist-client-core'

export default defineNuxtPlugin(async () => {
  const queryClient = useQueryClient()
  
  if (typeof window !== 'undefined') {
    const persister = experimental_createPersister({
      storage: window.localStorage,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      prefix: 'aster-management-cache'
    })
    
    await persistQueryClient({
      queryClient,
      persister
    })
  }
})
```

### Offline Detection

Handle offline states:

```typescript
// composables/useOffline.ts
export function useOffline() {
  const isOnline = ref(navigator.onLine)
  const queuedActions = ref<OfflineAction[]>([])
  
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
    
    if (isOnline.value) {
      // Process queued actions when back online
      processQueuedActions()
    }
  }
  
  const queueAction = (action: OfflineAction) => {
    queuedActions.value.push(action)
    localStorage.setItem('offline-queue', JSON.stringify(queuedActions.value))
  }
  
  const processQueuedActions = async () => {
    const actions = [...queuedActions.value]
    queuedActions.value = []
    localStorage.removeItem('offline-queue')
    
    for (const action of actions) {
      try {
        await executeAction(action)
      } catch (error) {
        // Re-queue failed actions
        queueAction(action)
      }
    }
  }
  
  // Initialize
  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Load queued actions from storage
    const saved = localStorage.getItem('offline-queue')
    if (saved) {
      queuedActions.value = JSON.parse(saved)
    }
  })
  
  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })
  
  return {
    isOnline: readonly(isOnline),
    queueAction,
    queuedActions: readonly(queuedActions)
  }
}
```

## Performance Optimization

### Query Optimization

Optimize query performance:

```typescript
// composables/api/useOptimizedQueries.ts
export function useOptimizedCases() {
  const filters = ref<CaseFilters>({})
  const debouncedFilters = refDebounced(filters, 300)
  
  // Use debounced filters for queries
  const { data: cases, isLoading } = useCases(debouncedFilters)
  
  // Prefetch related data
  const prefetchCaseDetails = (caseId: string) => {
    const queryClient = useQueryClient()
    queryClient.prefetchQuery({
      queryKey: ['cases', caseId],
      queryFn: () => $fetch(`/api/cases/${caseId}`),
      staleTime: 10 * 60 * 1000
    })
  }
  
  return {
    cases,
    isLoading,
    filters,
    prefetchCaseDetails
  }
}
```

### Memory Management

Implement proper cleanup:

```typescript
// composables/useMemoryManagement.ts
export function useMemoryManagement() {
  const queryClient = useQueryClient()
  
  const clearOldQueries = () => {
    // Remove queries older than 1 hour
    queryClient.getQueryCache().findAll().forEach(query => {
      if (query.state.dataUpdatedAt < Date.now() - 60 * 60 * 1000) {
        queryClient.removeQueries({ queryKey: query.queryKey })
      }
    })
  }
  
  // Clean up periodically
  const cleanupInterval = setInterval(clearOldQueries, 30 * 60 * 1000) // 30 minutes
  
  onUnmounted(() => {
    clearInterval(cleanupInterval)
  })
  
  return {
    clearOldQueries
  }
}
```

This comprehensive state management guide provides the foundation for building scalable, performant, and reliable state management in the Aster Management application using Pinia and TanStack Query.