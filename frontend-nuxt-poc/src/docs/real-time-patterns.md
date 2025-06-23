# Real-Time Update Patterns for Kanban Dashboard

## Overview

This document describes the real-time update patterns implemented for the Aster Management Kanban dashboard. The system uses a hybrid approach with polling as the primary mechanism and WebSocket support for future enhancement.

## Architecture

### 1. Polling-Based Updates

The system uses polling as the primary real-time mechanism for stability and simplicity:

```typescript
// Basic usage
const { data, loading, error, lastUpdated } = useRealTimeUpdates({
  endpoint: '/api/kanban/boards/{boardId}/updates',
  interval: 5000, // Poll every 5 seconds
  onUpdate: (updates) => processUpdates(updates),
  onError: (error) => handleError(error)
})
```

### 2. Optimistic Updates

All user actions are applied immediately to the UI while syncing with the server:

```typescript
const { addOptimisticUpdate, confirmUpdate, revertUpdate } = useOptimisticUpdates<Matter>()

// Apply optimistic update
const update = {
  id: 'temp-123',
  operation: 'move',
  optimisticData: updatedMatter,
  timestamp: new Date(),
  status: 'pending'
}
addOptimisticUpdate(update)

// Later, confirm or revert based on server response
if (serverResponse.success) {
  confirmUpdate('temp-123', serverResponse.data)
} else {
  revertUpdate('temp-123')
}
```

### 3. Conflict Resolution

The system detects and resolves conflicts when multiple users edit the same data:

```typescript
// Automatic conflict detection in real-time store
const conflicts = detectConflicts(localMatters, lastSyncTime)

// User-prompted resolution
<ConflictResolver 
  :conflicts="conflicts"
  :open="hasConflicts"
  @resolve="(id, resolution) => resolveConflict(id, resolution)"
/>
```

## Component Integration

### KanbanBoard Component

The main board component integrates real-time updates:

```vue
<script setup>
import { useKanbanRealTime } from '~/composables/useKanbanRealTime'
import { useRealTimeStore } from '~/stores/kanban/real-time'

const realTimeStore = useRealTimeStore()
const { loading, lastUpdated, start, stop } = useKanbanRealTime()

onMounted(() => {
  if (realTimeStore.isOnline) {
    start()
  }
})

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div class="kanban-board">
    <header>
      <ConnectionStatus />
    </header>
    
    <UpdateIndicator 
      v-for="column in columns"
      :is-updating="loading"
      :last-update="lastUpdated"
    >
      <KanbanColumn :column="column" />
    </UpdateIndicator>
  </div>
</template>
```

### Visual Feedback

The system provides clear visual feedback for real-time updates:

1. **Connection Status Badge**
   - Green: Connected and syncing
   - Yellow: Connecting or syncing
   - Red: Connection error
   - Gray: Offline

2. **Update Indicators**
   - Pulse animation when receiving updates
   - Ping animation for new changes
   - Loading states during sync

3. **Conflict Resolution Dialog**
   - Side-by-side comparison of conflicting values
   - Option to keep local, remote, or merge changes

## Store Architecture

### Real-Time Store (stores/kanban/real-time.ts)

The real-time store manages:
- Connection status and network detection
- Sync operations with exponential backoff
- Conflict detection and resolution
- WebSocket connection (when enabled)
- Performance metrics

### Matter Store Integration

The matter store provides card operations for real-time updates:
- `addCard`: Add or update a card
- `updateCard`: Update card properties
- `removeCard`: Remove a card from the board
- `moveCard`: Move card between columns

## Performance Optimizations

1. **Debounced Updates**: Rapid updates are debounced to prevent UI thrashing
2. **Batch Processing**: Multiple updates in the same tick are processed together
3. **Virtual Scrolling**: Large update histories use virtual scrolling
4. **Update Deduplication**: Duplicate updates are filtered out
5. **Client-Side Caching**: Reduces unnecessary API calls

## Security Considerations

1. **Schema Validation**: All incoming updates are validated against TypeScript schemas
2. **Rate Limiting**: Maximum 60 updates per minute per client
3. **Content Sanitization**: User-generated content is sanitized
4. **Authentication Required**: All real-time connections require valid JWT tokens

## WebSocket Future Enhancement

The system is designed to easily switch to WebSocket when needed:

```typescript
// Future WebSocket usage
const { isConnected, send, on, off } = useWebSocketConnection({
  url: 'wss://api.aster-management.com/ws',
  reconnect: true,
  heartbeatInterval: 30000
})

on('matter_updated', (data) => {
  handleMatterUpdate(data)
})
```

## Testing Strategy

1. **Unit Tests**: Test composables in isolation with mocked timers
2. **Integration Tests**: Test full update flow with store integration
3. **Performance Tests**: Verify handling of rapid updates
4. **Load Tests**: Test with 100+ concurrent updates

## Best Practices

1. **Always use optimistic updates** for immediate user feedback
2. **Handle offline scenarios** gracefully with queuing
3. **Provide clear visual feedback** for all states
4. **Test with simulated network delays** and failures
5. **Monitor real-time performance** in production

## Configuration

```typescript
// config/realtime.ts
export const realtimeConfig = {
  mode: 'polling', // or 'websocket'
  polling: {
    interval: 5000,
    maxRetries: 3,
    backoffMultiplier: 2
  },
  performance: {
    debounceUpdates: 100,
    batchUpdates: true,
    maxUpdateHistory: 100
  }
}
```