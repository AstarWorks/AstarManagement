# Background Sync Configuration Guide

## Overview

The Aster Management system implements intelligent background synchronization strategies that balance real-time data freshness with performance and battery efficiency. This guide covers the configuration and usage of background sync features.

## Core Features

### 1. **Adaptive Sync Modes**

The system provides five sync modes tailored for different use cases:

- **Real-time (Aggressive)**: Continuous updates with WebSocket support
- **Balanced**: Regular updates with good performance
- **Battery Saver (Conservative)**: Less frequent updates to save resources
- **Offline**: No automatic updates, manual sync only
- **Manual**: Updates only when explicitly requested

### 2. **Tab Visibility Handling**

Sync behavior adapts based on tab visibility:

```typescript
// Tab states and their effects
- Active: Full sync rate
- Hidden: Immediate pause/reduction
- Background: Reduced sync rate (20% of normal)
```

### 3. **Network Quality Detection**

Automatic network quality assessment affects sync behavior:

```typescript
// Network quality levels
- Excellent: RTT < 50ms, Downlink > 10 Mbps
- Good: RTT < 100ms, Downlink > 5 Mbps
- Fair: RTT < 200ms, Downlink > 1 Mbps
- Poor: RTT < 400ms, Downlink > 0.5 Mbps
- Offline: No connection
```

### 4. **WebSocket Integration**

Real-time updates via WebSocket for aggressive and balanced modes:

- Automatic reconnection with exponential backoff
- Message queuing for offline scenarios
- Heartbeat mechanism for connection health
- Latency monitoring

## Usage

### Basic Setup

```vue
<script setup lang="ts">
import { useBackgroundSync } from '~/composables/useBackgroundSync'

// Initialize background sync
const { 
  syncMode, 
  syncStatus, 
  networkQuality,
  setSyncMode,
  syncAllData 
} = useBackgroundSync()

// Change sync mode
setSyncMode('balanced')

// Manual sync
await syncAllData()
</script>
```

### WebSocket Real-time Updates

```typescript
import { useRealtimeSync } from '~/composables/useRealtimeSync'

const { 
  isConnected, 
  latency,
  send,
  connect,
  disconnect 
} = useRealtimeSync()

// Connect to WebSocket
connect()

// Send a message
send({
  type: 'matter:update',
  payload: { matterId: '123', status: 'in_progress' }
})
```

### Query Integration

```typescript
// Use sync configuration with queries
import { createSyncQueryOptions } from '~/config/background-sync'

const mattersQuery = useQuery({
  queryKey: queryKeys.matters.all,
  queryFn: fetchMatters,
  ...createSyncQueryOptions('matters', 'balanced')
})
```

## Configuration

### Sync Mode Configuration

Each data type can have different sync settings:

```typescript
// config/background-sync.ts
export const SYNC_CONFIGS = {
  matters: {
    aggressive: {
      baseInterval: 5000,        // 5 seconds
      refetchOnWindowFocus: true,
      refetchInBackground: true,
      staleTime: 30000,         // 30 seconds
      minNetworkQuality: 'fair',
      enableWebSocket: true,
      priority: 10
    },
    // ... other modes
  }
}
```

### Performance Optimization

The system automatically adapts based on:

1. **Battery Level**: Reduces sync when battery < 20%
2. **Memory Usage**: Pauses sync when memory > 90%
3. **Network Conditions**: Adjusts based on connection quality
4. **Tab Visibility**: Reduces background sync to save resources

### WebSocket Configuration

```typescript
export const WEBSOCKET_CONFIG = {
  endpoint: 'ws://localhost:8080/ws',
  reconnection: {
    enabled: true,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
    maxAttempts: 10
  },
  heartbeat: {
    enabled: true,
    interval: 30000,
    timeout: 10000
  }
}
```

## UI Components

### Sync Status Indicator

Display current sync status to users:

```vue
<template>
  <SyncStatusIndicator />
</template>

<script setup>
import SyncStatusIndicator from '~/components/realtime/SyncStatusIndicator.vue'
</script>
```

The indicator shows:
- Current connection status
- Network quality
- Last sync time
- Active sync mode
- WebSocket connection state

## Best Practices

### 1. **Choose Appropriate Sync Modes**

- Use **Real-time** for critical collaborative features (Kanban board)
- Use **Balanced** for general case management
- Use **Conservative** for mobile devices or metered connections
- Use **Manual** for large data sets or infrequent access

### 2. **Handle Offline Scenarios**

```typescript
const { isOnline, syncStatus } = useBackgroundSync()

if (!isOnline.value) {
  // Show offline UI
  // Queue operations for later sync
}
```

### 3. **Monitor Performance**

```typescript
const { batteryLevel, memoryUsage, getSyncStats } = useBackgroundSync()

// Log sync statistics
console.log('Sync stats:', getSyncStats())
```

### 4. **Optimize for Mobile**

```typescript
// Detect mobile and adjust sync
const isMobile = useIsMobile()
if (isMobile.value) {
  setSyncMode('conservative')
}
```

## Testing

Run the comprehensive test suite:

```bash
# Unit tests for sync logic
npm test useBackgroundSync.test.ts
npm test useRealtimeSync.test.ts

# Integration tests
npm test background-sync.integration.test.ts
```

## Troubleshooting

### Common Issues

1. **WebSocket won't connect**
   - Check WebSocket endpoint configuration
   - Verify authentication token
   - Check firewall/proxy settings

2. **High battery/memory usage**
   - Switch to conservative mode
   - Reduce sync intervals
   - Check for memory leaks in queries

3. **Data not syncing**
   - Check network status
   - Verify sync mode isn't "manual" or "offline"
   - Check browser console for errors

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('debug-sync', 'true')
```

## Migration from Polling

If migrating from simple polling to background sync:

1. Replace interval-based fetching with sync composable
2. Configure appropriate sync modes for each data type
3. Add WebSocket support for real-time features
4. Update UI to show sync status

## Future Enhancements

- Service Worker integration for true background sync
- Push notifications for important updates
- Differential sync for large data sets
- Conflict resolution for collaborative editing