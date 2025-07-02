# T06_S07: Real-Time Updates Implementation

## 📋 Task Overview
Implement real-time update mechanisms for the AsterManagement application using Vue 3 composables, with a focus on polling patterns, WebSocket readiness, conflict resolution, and robust error handling.

## 🎯 Objectives
1. Create polling composables with Vue 3 lifecycle management
2. Design WebSocket-ready architecture for future migration
3. Implement optimistic updates with conflict resolution
4. Build robust error handling and recovery mechanisms
5. Integrate real-time features with Pinia stores

## 📊 Requirements

### Functional Requirements
- [ ] Polling-based real-time updates for Kanban board
- [ ] Automatic reconnection and error recovery
- [ ] Conflict detection and resolution UI
- [ ] Background sync indicators
- [ ] Network status monitoring
- [ ] Rate limiting and backoff strategies

### Technical Requirements
- [ ] Vue 3 composables for real-time features
- [ ] Proper lifecycle cleanup (onUnmounted)
- [ ] TypeScript interfaces for real-time events
- [ ] Integration with existing Pinia stores
- [ ] WebSocket upgrade path documentation

## 🏗️ Technical Implementation

### 1. Core Real-Time Composable
```typescript
// composables/useRealTimeUpdates.ts
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useIntervalFn, useOnline, useEventListener } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

interface RealTimeOptions {
  interval?: number
  immediate?: boolean
  retryAttempts?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onReconnect?: () => void
}

export function useRealTimeUpdates<T>(
  fetcher: () => Promise<T>,
  options: RealTimeOptions = {}
) {
  const {
    interval = 5000,
    immediate = true,
    retryAttempts = 3,
    retryDelay = 1000,
    onError,
    onReconnect
  } = options

  const data = ref<T>()
  const error = ref<Error | null>(null)
  const loading = ref(false)
  const lastSync = ref<Date | null>(null)
  const retryCount = ref(0)
  const isOnline = useOnline()

  // Exponential backoff calculation
  const currentInterval = computed(() => {
    if (retryCount.value === 0) return interval
    return Math.min(interval * Math.pow(2, retryCount.value), 60000)
  })

  // Fetch with retry logic
  const fetchData = async () => {
    if (!isOnline.value || loading.value) return

    loading.value = true
    error.value = null

    try {
      data.value = await fetcher()
      lastSync.value = new Date()
      retryCount.value = 0 // Reset on success
    } catch (err) {
      error.value = err as Error
      retryCount.value++

      if (retryCount.value <= retryAttempts) {
        console.warn(`Retry attempt ${retryCount.value}/${retryAttempts}`)
      } else {
        onError?.(err as Error)
      }
    } finally {
      loading.value = false
    }
  }

  // Polling interval with dynamic timing
  const { pause, resume, isActive } = useIntervalFn(
    fetchData,
    currentInterval,
    { immediate }
  )

  // Handle online/offline transitions
  watch(isOnline, (online) => {
    if (online) {
      retryCount.value = 0
      onReconnect?.()
      resume()
    } else {
      pause()
    }
  })

  // Handle visibility changes
  useEventListener(document, 'visibilitychange', () => {
    if (document.hidden) {
      pause()
    } else {
      resume()
      fetchData() // Immediate sync on return
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    pause()
  })

  return {
    data: computed(() => data.value),
    error: computed(() => error.value),
    loading: computed(() => loading.value),
    lastSync: computed(() => lastSync.value),
    isActive: computed(() => isActive.value),
    isOnline,
    refresh: fetchData,
    pause,
    resume
  }
}
```

### 2. Kanban-Specific Real-Time Updates
```typescript
// composables/useKanbanRealTime.ts
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useKanbanStore } from '~/stores/kanban'
import { useNotification } from '~/composables/useNotification'
import type { Matter, KanbanColumn } from '~/types/kanban'

interface ConflictResolution {
  type: 'local' | 'remote' | 'merge'
  resolvedData?: Matter
}

export function useKanbanRealTime() {
  const kanbanStore = useKanbanStore()
  const { notify } = useNotification()
  const { matters, columns, version } = storeToRefs(kanbanStore)
  
  const conflicts = ref<Map<string, Matter>>(new Map())
  const pendingUpdates = ref<Set<string>>(new Set())

  // Fetch updates with conflict detection
  const fetchKanbanUpdates = async () => {
    try {
      const response = await $fetch('/api/kanban/updates', {
        query: {
          version: version.value,
          includeDeleted: true
        }
      })

      if (response.version === version.value) {
        return // No updates
      }

      // Detect conflicts
      const localChanges = kanbanStore.getLocalChanges()
      const conflictingIds = response.matters
        .filter(m => localChanges.has(m.id))
        .map(m => m.id)

      if (conflictingIds.length > 0) {
        handleConflicts(conflictingIds, response.matters)
      } else {
        // Apply updates directly
        kanbanStore.applyRemoteUpdates(response)
      }
    } catch (error) {
      console.error('Failed to fetch kanban updates:', error)
      throw error
    }
  }

  // Conflict resolution UI
  const handleConflicts = (ids: string[], remoteMatters: Matter[]) => {
    ids.forEach(id => {
      const remoteMatter = remoteMatters.find(m => m.id === id)
      if (remoteMatter) {
        conflicts.value.set(id, remoteMatter)
        notify({
          title: 'Update Conflict',
          description: `Matter "${remoteMatter.title}" has been modified`,
          action: {
            label: 'Resolve',
            onClick: () => showConflictDialog(id)
          }
        })
      }
    })
  }

  // Real-time updates with error handling
  const { data, error, loading, lastSync, refresh, pause, resume } = 
    useRealTimeUpdates(fetchKanbanUpdates, {
      interval: 5000,
      immediate: true,
      onError: (err) => {
        notify({
          title: 'Sync Error',
          description: 'Failed to sync kanban updates',
          variant: 'destructive'
        })
      },
      onReconnect: () => {
        notify({
          title: 'Reconnected',
          description: 'Syncing latest updates...',
          variant: 'success'
        })
      }
    })

  // Optimistic updates
  const moveMatter = async (
    matterId: string, 
    targetColumn: string,
    position: number
  ) => {
    pendingUpdates.value.add(matterId)
    
    // Optimistic update
    kanbanStore.moveMatter(matterId, targetColumn, position)

    try {
      await $fetch(`/api/matters/${matterId}/move`, {
        method: 'POST',
        body: { column: targetColumn, position }
      })
      
      // Refresh to ensure consistency
      await refresh()
    } catch (error) {
      // Rollback on failure
      kanbanStore.rollbackMatter(matterId)
      notify({
        title: 'Move Failed',
        description: 'Unable to move matter. Please try again.',
        variant: 'destructive'
      })
    } finally {
      pendingUpdates.value.delete(matterId)
    }
  }

  // Resolve conflict
  const resolveConflict = async (
    matterId: string, 
    resolution: ConflictResolution
  ) => {
    switch (resolution.type) {
      case 'local':
        // Keep local changes
        await kanbanStore.pushLocalChanges(matterId)
        break
      case 'remote':
        // Accept remote changes
        const remoteMatter = conflicts.value.get(matterId)
        if (remoteMatter) {
          kanbanStore.applyRemoteMatter(remoteMatter)
        }
        break
      case 'merge':
        // Apply merged data
        if (resolution.resolvedData) {
          await kanbanStore.updateMatter(resolution.resolvedData)
        }
        break
    }
    
    conflicts.value.delete(matterId)
    await refresh()
  }

  return {
    // State
    matters,
    columns,
    conflicts: computed(() => Array.from(conflicts.value.values())),
    pendingUpdates: computed(() => Array.from(pendingUpdates.value)),
    lastSync,
    loading,
    error,
    
    // Actions
    moveMatter,
    resolveConflict,
    refresh,
    pause,
    resume
  }
}
```

### 3. WebSocket-Ready Architecture
```typescript
// composables/useWebSocketReady.ts
import { ref, onUnmounted } from 'vue'
import type { EventEmitter } from 'eventemitter3'

export interface RealTimeTransport {
  connect(): Promise<void>
  disconnect(): void
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  emit(event: string, data: any): void
  isConnected(): boolean
}

// Polling transport (current implementation)
export class PollingTransport implements RealTimeTransport {
  private intervals = new Map<string, ReturnType<typeof setInterval>>()
  private handlers = new Map<string, Set<Function>>()
  private connected = false

  async connect() {
    this.connected = true
  }

  disconnect() {
    this.connected = false
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
  }

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    // Start polling for this event type
    if (!this.intervals.has(event)) {
      const interval = setInterval(() => {
        this.pollEvent(event)
      }, 5000)
      this.intervals.set(event, interval)
    }
  }

  off(event: string, handler: Function) {
    this.handlers.get(event)?.delete(handler)
    
    // Stop polling if no handlers left
    if (this.handlers.get(event)?.size === 0) {
      const interval = this.intervals.get(event)
      if (interval) {
        clearInterval(interval)
        this.intervals.delete(event)
      }
    }
  }

  emit(event: string, data: any) {
    // For polling, this would make an API call
    $fetch('/api/events', {
      method: 'POST',
      body: { event, data }
    })
  }

  isConnected() {
    return this.connected
  }

  private async pollEvent(event: string) {
    try {
      const data = await $fetch(`/api/events/${event}`)
      const handlers = this.handlers.get(event)
      handlers?.forEach(handler => handler(data))
    } catch (error) {
      console.error(`Failed to poll event ${event}:`, error)
    }
  }
}

// WebSocket transport (future implementation)
export class WebSocketTransport implements RealTimeTransport {
  private ws: WebSocket | null = null
  private eventEmitter: EventEmitter
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(private url: string) {
    this.eventEmitter = new EventEmitter()
  }

  async connect() {
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onerror = (error) => {
        reject(error)
      }

      this.ws.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data)
        this.eventEmitter.emit(type, data)
      }

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
        }
      }
    })
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }

  on(event: string, handler: Function) {
    this.eventEmitter.on(event, handler)
  }

  off(event: string, handler: Function) {
    this.eventEmitter.off(event, handler)
  }

  emit(event: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, data }))
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Transport-agnostic composable
export function useRealTimeTransport(
  transport: RealTimeTransport = new PollingTransport()
) {
  const connected = ref(false)
  const connecting = ref(false)
  const error = ref<Error | null>(null)

  const connect = async () => {
    if (connecting.value || connected.value) return

    connecting.value = true
    error.value = null

    try {
      await transport.connect()
      connected.value = true
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      connecting.value = false
    }
  }

  const disconnect = () => {
    transport.disconnect()
    connected.value = false
  }

  const subscribe = (event: string, handler: Function) => {
    transport.on(event, handler)
    
    // Return unsubscribe function
    return () => transport.off(event, handler)
  }

  const emit = (event: string, data: any) => {
    if (!connected.value) {
      throw new Error('Transport not connected')
    }
    transport.emit(event, data)
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected: computed(() => connected.value),
    connecting: computed(() => connecting.value),
    error: computed(() => error.value),
    connect,
    disconnect,
    subscribe,
    emit
  }
}
```

### 4. Network Status Monitoring
```typescript
// composables/useNetworkStatus.ts
import { ref, computed, watch } from 'vue'
import { useOnline, useIntervalFn } from '@vueuse/core'
import { useNotification } from '~/composables/useNotification'

interface NetworkQuality {
  rtt: number // Round-trip time in ms
  downlink: number // Downlink speed in Mbps
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
}

export function useNetworkStatus() {
  const isOnline = useOnline()
  const { notify } = useNotification()
  
  const networkQuality = ref<NetworkQuality | null>(null)
  const connectionType = ref<string>('unknown')
  const isSlowConnection = computed(() => {
    if (!networkQuality.value) return false
    return networkQuality.value.effectiveType === '2g' || 
           networkQuality.value.effectiveType === 'slow-2g' ||
           networkQuality.value.rtt > 300
  })

  // Monitor network quality
  const updateNetworkQuality = () => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      networkQuality.value = {
        rtt: conn.rtt || 0,
        downlink: conn.downlink || 0,
        effectiveType: conn.effectiveType || '4g'
      }
      connectionType.value = conn.type || 'unknown'
    }
  }

  // Check connection speed
  const checkConnectionSpeed = async () => {
    const startTime = Date.now()
    try {
      await $fetch('/api/ping', { 
        timeout: 5000,
        retry: 0 
      })
      const rtt = Date.now() - startTime
      
      if (networkQuality.value) {
        networkQuality.value.rtt = rtt
      }
    } catch (error) {
      console.warn('Connection check failed:', error)
    }
  }

  // Network status notifications
  watch(isOnline, (online) => {
    if (online) {
      notify({
        title: 'Back Online',
        description: 'Connection restored',
        variant: 'success',
        duration: 3000
      })
    } else {
      notify({
        title: 'Connection Lost',
        description: 'Working offline',
        variant: 'warning',
        duration: 0 // Persistent
      })
    }
  })

  // Slow connection warnings
  watch(isSlowConnection, (slow) => {
    if (slow) {
      notify({
        title: 'Slow Connection',
        description: 'Updates may be delayed',
        variant: 'warning',
        duration: 5000
      })
    }
  })

  // Initialize monitoring
  onMounted(() => {
    updateNetworkQuality()
    
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      conn.addEventListener('change', updateNetworkQuality)
    }
  })

  // Periodic speed check
  useIntervalFn(checkConnectionSpeed, 30000)

  return {
    isOnline,
    isSlowConnection,
    networkQuality: computed(() => networkQuality.value),
    connectionType: computed(() => connectionType.value),
    checkSpeed: checkConnectionSpeed
  }
}
```

### 5. Pinia Store Integration
```typescript
// stores/realtime.ts
import { defineStore } from 'pinia'
import { useRealTimeTransport, PollingTransport } from '~/composables/useWebSocketReady'

export const useRealTimeStore = defineStore('realtime', () => {
  const transport = new PollingTransport()
  const { connected, connecting, error, connect, disconnect, subscribe, emit } = 
    useRealTimeTransport(transport)

  const subscriptions = new Map<string, () => void>()

  // Subscribe to events with store management
  const subscribeToEvent = (event: string, handler: Function) => {
    const unsubscribe = subscribe(event, handler)
    subscriptions.set(event, unsubscribe)
    return unsubscribe
  }

  // Unsubscribe from specific event
  const unsubscribeFromEvent = (event: string) => {
    const unsubscribe = subscriptions.get(event)
    if (unsubscribe) {
      unsubscribe()
      subscriptions.delete(event)
    }
  }

  // Clean up all subscriptions
  const cleanup = () => {
    subscriptions.forEach(unsubscribe => unsubscribe())
    subscriptions.clear()
    disconnect()
  }

  return {
    // State
    connected,
    connecting,
    error,
    
    // Actions
    connect,
    disconnect,
    subscribeToEvent,
    unsubscribeFromEvent,
    emit,
    cleanup
  }
})
```

## 🎯 Implementation Strategy

### Phase 1: Basic Polling (Week 1)
1. Implement core `useRealTimeUpdates` composable
2. Add Kanban board polling with 5-second intervals
3. Implement basic error handling and retry logic
4. Add network status monitoring

### Phase 2: Optimistic Updates (Week 2)
1. Implement optimistic update patterns
2. Add conflict detection mechanisms
3. Create conflict resolution UI components
4. Implement rollback functionality

### Phase 3: Advanced Features (Week 3)
1. Add intelligent polling intervals (activity-based)
2. Implement background sync indicators
3. Add offline queue for actions
4. Create comprehensive error recovery

### Phase 4: WebSocket Preparation (Week 4)
1. Create transport abstraction layer
2. Document WebSocket migration path
3. Add feature flags for transport switching
4. Performance testing and optimization

## 📊 Testing Strategy

### Unit Tests
```typescript
// composables/__tests__/useRealTimeUpdates.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { useRealTimeUpdates } from '../useRealTimeUpdates'

describe('useRealTimeUpdates', () => {
  it('should poll at specified intervals', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: 'test' })
    const { data } = useRealTimeUpdates(fetcher, { interval: 100 })
    
    await sleep(250)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('should handle errors with retry', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ data: 'success' })
    
    const { data, error } = useRealTimeUpdates(fetcher, { 
      retryAttempts: 1,
      retryDelay: 50 
    })
    
    await sleep(150)
    expect(data.value).toEqual({ data: 'success' })
    expect(error.value).toBeNull()
  })
})
```

### Integration Tests
```typescript
// e2e/realtime-kanban.spec.ts
import { test, expect } from '@playwright/test'

test('kanban updates in real-time', async ({ page, context }) => {
  // Open kanban in two tabs
  const page2 = await context.newPage()
  
  await page.goto('/kanban')
  await page2.goto('/kanban')
  
  // Move card in first tab
  await page.dragAndDrop('[data-matter-id="123"]', '[data-column="in-progress"]')
  
  // Verify update appears in second tab within 10 seconds
  await expect(page2.locator('[data-matter-id="123"]'))
    .toBeVisible({ timeout: 10000 })
    .toHaveAttribute('data-column', 'in-progress')
})
```

## 🚦 Error Handling Patterns

### Graceful Degradation
```typescript
// Show stale data with indicators
const StaleDataIndicator = defineComponent({
  setup() {
    const { lastSync, error } = useKanbanRealTime()
    
    const isStale = computed(() => {
      if (!lastSync.value) return false
      const minutesAgo = (Date.now() - lastSync.value.getTime()) / 60000
      return minutesAgo > 5
    })
    
    return () => isStale.value ? (
      <div class="stale-data-warning">
        <Icon name="alert-triangle" />
        <span>Data may be outdated. Last sync: {formatTime(lastSync.value)}</span>
        <Button size="sm" onClick={refresh}>Refresh</Button>
      </div>
    ) : null
  }
})
```

## 📈 Performance Considerations

### Intelligent Polling
- Reduce frequency when tab is inactive
- Pause when network is offline
- Increase interval during low activity
- Batch multiple subscriptions into single poll

### Memory Management
- Cleanup intervals on component unmount
- Limit stored update history
- Use WeakMap for temporary data
- Implement data pruning strategies

## 🔄 Migration Path to WebSockets

### Feature Flag Implementation
```typescript
// config/features.ts
export const features = {
  useWebSockets: import.meta.env.VITE_USE_WEBSOCKETS === 'true'
}

// Usage
const transport = features.useWebSockets 
  ? new WebSocketTransport(wsUrl)
  : new PollingTransport()
```

### Gradual Migration Strategy
1. **Phase 1**: Polling only (current)
2. **Phase 2**: WebSocket for high-priority updates
3. **Phase 3**: Hybrid approach based on connection quality
4. **Phase 4**: Full WebSocket with polling fallback

## ✅ Acceptance Criteria
- [ ] Kanban board updates within 5 seconds of changes
- [ ] Graceful handling of network disconnections
- [ ] Conflict resolution UI for concurrent edits
- [ ] No memory leaks during extended sessions
- [ ] Performance: < 1% CPU usage during idle polling
- [ ] WebSocket migration path documented
- [ ] 95% test coverage for real-time composables

## 📚 Resources
- [Vue 3 Reactivity API](https://vuejs.org/api/reactivity-core.html)
- [VueUse Composables](https://vueuse.org/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Conflict-free Replicated Data Types](https://crdt.tech/)

## 💡 Improvement Suggestions

**Time saved**: ~4-6 hours of implementation time
**Implementation**: Copy the provided composables and adapt to specific use cases
**Benefits**: 
- Production-ready real-time updates with minimal setup
- WebSocket-ready architecture for future scaling
- Robust error handling and conflict resolution
- Optimized for Vue 3 reactivity system