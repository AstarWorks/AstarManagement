# Offline Support Guide

## Overview

The Aster Management application provides comprehensive offline support to ensure lawyers can continue working even in environments with poor or no internet connectivity (such as courtrooms). This guide covers the implementation and usage of offline features.

## Architecture

### Core Components

1. **IndexedDB Persistence**
   - Stores TanStack Query cache locally
   - Implements compression for large datasets
   - Automatic cleanup to manage storage limits

2. **Service Worker**
   - Intercepts network requests
   - Implements strategic caching
   - Background sync for failed mutations

3. **Offline Mutation Queue**
   - Queues mutations when offline
   - Automatic sync when connection restored
   - Retry logic with exponential backoff

4. **UI Components**
   - Offline status indicator
   - Data freshness badges
   - Sync progress display

## Usage

### Basic Offline Query

```vue
<script setup lang="ts">
import { useOfflineQuery } from '~/composables/useOfflineQuery'

const { 
  data, 
  isOffline, 
  dataFreshness,
  syncNow 
} = useOfflineQuery(
  ['matters', matterId],
  () => fetchMatter(matterId),
  {
    enablePersistence: true,
    showFreshness: true,
    offlineFallback: { title: 'Loading...', status: 'unknown' }
  }
)
</script>

<template>
  <div>
    <DataFreshnessIndicator 
      :freshness="dataFreshness"
      :is-from-cache="isFromCache"
    />
    
    <MatterCard 
      v-if="data"
      :matter="data"
      :is-offline="isOffline"
    />
    
    <Button 
      v-if="isOffline"
      @click="syncNow"
      :disabled="!isOnline"
    >
      Sync Now
    </Button>
  </div>
</template>
```

### Offline Mutations

```typescript
// Create a mutation that queues when offline
const { createQueuedMutation } = useGlobalOfflineMutationQueue()

const updateMatter = createQueuedMutation(
  ['updateMatter'],
  (variables: UpdateMatterInput) => api.updateMatter(variables),
  {
    onSuccess: () => {
      toast.success('Matter updated')
    },
    onError: (error) => {
      toast.error('Update failed: ' + error.message)
    }
  }
)

// Use the mutation
async function handleUpdate(data: UpdateMatterInput) {
  try {
    await updateMatter.mutateAsync(data)
  } catch (error) {
    if (error.message.includes('queued')) {
      toast.info('Update queued for sync')
    }
  }
}
```

### Prefetching for Offline

```typescript
// Prefetch critical data when app loads
onMounted(async () => {
  await prefetchForOffline([
    {
      queryKey: ['matters'],
      queryFn: fetchAllMatters,
      staleTime: 5 * 60 * 1000 // 5 minutes
    },
    {
      queryKey: ['users'],
      queryFn: fetchUsers,
      staleTime: 60 * 60 * 1000 // 1 hour
    },
    {
      queryKey: ['settings'],
      queryFn: fetchSettings,
      staleTime: 24 * 60 * 60 * 1000 // 24 hours
    }
  ])
})
```

### Global Offline Status

```vue
<template>
  <div id="app">
    <!-- Always visible offline status bar -->
    <OfflineStatus 
      :always-show="false"
      :dismissible="true"
      :expandable="true"
      @sync-complete="handleSyncComplete"
      @sync-error="handleSyncError"
    />
    
    <!-- Main app content -->
    <NuxtPage />
  </div>
</template>

<script setup>
function handleSyncComplete(results) {
  const successful = results.filter(r => r.success).length
  toast.success(`Synced ${successful} operations`)
}

function handleSyncError(error) {
  toast.error('Sync failed: ' + error.message)
}
</script>
```

## Configuration

### Offline Settings

```typescript
// config/offline.ts
export const offlineConfig = {
  persistence: {
    enabled: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    compressionThreshold: 1024 // 1KB
  },
  
  mutationQueue: {
    maxRetries: 3,
    retryDelay: 1000,
    autoSync: true
  },
  
  freshness: {
    fresh: 5 * 60 * 1000,      // 5 minutes
    stale: 30 * 60 * 1000,     // 30 minutes
    expired: 24 * 60 * 60 * 1000 // 24 hours
  }
}
```

### Service Worker Registration

```typescript
// plugins/service-worker.client.ts
export default defineNuxtPlugin(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered')
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error)
      })
  }
})
```

## Data Freshness

### Understanding Freshness States

1. **Fresh** (green indicator)
   - Data updated within last 5 minutes
   - Safe to use without checking for updates

2. **Stale** (yellow indicator)
   - Data updated 5-30 minutes ago
   - Should check for updates when possible

3. **Expired** (red indicator)
   - Data older than 30 minutes
   - Requires update before critical operations

### Freshness in Components

```vue
<template>
  <Card :class="freshnessClass">
    <CardHeader>
      <h3>{{ matter.title }}</h3>
      <DataFreshnessIndicator 
        :freshness="dataFreshness"
        :last-sync-time="lastSyncTime"
      />
    </CardHeader>
    
    <CardContent>
      <Alert v-if="dataFreshness === 'expired'" variant="warning">
        This data may be outdated. Please sync when online.
      </Alert>
      
      <!-- Matter content -->
    </CardContent>
  </Card>
</template>

<script setup>
const freshnessClass = computed(() => ({
  'border-yellow-500': dataFreshness.value === 'stale',
  'border-red-500': dataFreshness.value === 'expired'
}))
</script>
```

## Testing Offline Features

### Manual Testing

1. **Chrome DevTools**
   - Network tab → Offline checkbox
   - Application tab → Service Workers
   - Application tab → IndexedDB

2. **Test Scenarios**
   - Load app online, go offline, navigate
   - Create/update data while offline
   - Queue multiple operations offline
   - Test sync when coming back online

### Automated Testing

```typescript
// Test offline query
describe('Offline functionality', () => {
  it('should use cached data when offline', async () => {
    // Mock offline state
    mockIsOnline.value = false
    
    const { data, isFromCache } = useOfflineQuery(
      ['test'],
      fetchData,
      { offlineFallback: mockData }
    )
    
    await waitFor(() => {
      expect(isFromCache.value).toBe(true)
      expect(data.value).toEqual(mockData)
    })
  })
})
```

## Best Practices

### 1. Critical Data First
Always prefetch critical data that users need offline:
- Active matters
- User settings
- Reference data (statuses, priorities)

### 2. Clear Offline Indicators
- Always show when data is from cache
- Display last sync time
- Warn before critical operations with stale data

### 3. Graceful Degradation
- Provide read-only access when offline
- Queue non-critical mutations
- Block critical operations requiring fresh data

### 4. Storage Management
- Monitor IndexedDB usage
- Implement cleanup strategies
- Respect browser storage limits

### 5. User Communication
- Clear offline status indicators
- Progress bars for sync operations
- Success/failure notifications

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check HTTPS requirement (localhost is OK)
   - Verify sw.js is in public directory
   - Check browser compatibility

2. **Data Not Persisting**
   - Verify IndexedDB is available
   - Check storage quota limits
   - Look for compression errors

3. **Mutations Not Syncing**
   - Check network detection
   - Verify mutation queue state
   - Look for API errors in console

### Debug Tools

```typescript
// Get cache statistics
const stats = await getOfflineCacheStats()
console.log('Cache stats:', stats)

// Check mutation queue
const { queue, syncErrors } = useGlobalOfflineMutationQueue()
console.log('Queued mutations:', queue.value)
console.log('Sync errors:', syncErrors.value)

// Force clear all cache
await clearAllOfflineCache()
```

## Performance Considerations

### 1. Compression
- Automatically compresses data > 1KB
- Uses native CompressionStream when available
- Falls back to lightweight LZ compression

### 2. Cache Limits
- Maximum 50MB cache by default
- Automatic cleanup of old entries
- Prioritizes recently used data

### 3. Background Sync
- Batches mutations for efficiency
- Implements exponential backoff
- Respects rate limits

## Future Enhancements

1. **Selective Sync**
   - Choose which data to cache offline
   - Priority-based sync queues
   - Bandwidth-aware sync strategies

2. **Conflict Resolution**
   - Three-way merge for concurrent edits
   - Visual diff for conflicts
   - Automatic resolution policies

3. **Advanced Caching**
   - Predictive prefetching
   - Delta sync for large datasets
   - Encrypted local storage