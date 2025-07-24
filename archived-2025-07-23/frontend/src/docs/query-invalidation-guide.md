# Query Invalidation Strategies Guide

## Overview

This guide covers the comprehensive query invalidation system implemented for TanStack Query integration with real-time updates. The system provides intelligent invalidation strategies that ensure data consistency while optimizing performance.

## Architecture Components

### 1. Core Invalidation System (`useQueryInvalidation`)

The foundation of the invalidation system that provides:

- **Rule-based invalidation** with customizable patterns
- **Debouncing and rate limiting** for performance optimization
- **Cascade invalidation** for related queries
- **Metrics tracking** for monitoring and debugging

```typescript
import { useQueryInvalidation } from '~/composables/useQueryInvalidation'

const invalidation = useQueryInvalidation()

// Add custom rule
invalidation.addRule({
  id: 'custom-rule',
  eventTypes: ['custom_event'],
  queryKeys: [['custom', 'query']],
  debounceMs: 500,
  rateLimit: 10
})
```

### 2. Real-Time Integration (`useRealTimeQuerySync`)

Bridges the existing real-time infrastructure with TanStack Query:

- **WebSocket message processing** with smart filtering
- **Polling integration** for fallback synchronization
- **Batch processing** for efficient event handling
- **Conflict resolution** for concurrent updates

```typescript
import { useRealTimeQuerySync } from '~/composables/useRealTimeQuerySync'

const sync = useRealTimeQuerySync({
  enableWebSocket: true,
  enablePolling: true,
  batchSize: 10,
  autoResolveConflicts: true
})

sync.start()
```

### 3. Kanban Specialization (`useKanbanQueryInvalidation`)

Optimized invalidation for Kanban board operations:

- **Drag-and-drop optimization** with minimal invalidation
- **Status change tracking** with smart debouncing
- **Performance monitoring** for smooth interactions
- **Bulk operation handling** for efficient batch updates

```typescript
import { useKanbanQueryInvalidation } from '~/composables/useKanbanQueryInvalidation'

const kanban = useKanbanQueryInvalidation()

// Track visible columns for smart invalidation
kanban.setActiveColumns(['draft', 'active', 'completed'])

// Track drag operations
kanban.startDragOperation('matter-1', 'draft')
await kanban.completeDragOperation('matter-1', 'active')
```

## Invalidation Patterns

### 1. Event-Based Invalidation

The system responds to real-time events with appropriate invalidation strategies:

#### Matter Updates
```typescript
// Event: matter_updated
// Invalidates:
// - ['matters', 'detail', matterId] (exact)
// - ['matters', 'list'] (prefix)
// - ['matters', 'search'] (prefix, if search enabled)
```

#### Status Changes
```typescript
// Event: matter_status_changed
// Invalidates:
// - ['matters', 'status-counts'] (exact, immediate)
// - ['matters', 'list'] (prefix, debounced)
// - ['matters', 'assigned', lawyerId] (if assignment changed)
```

#### Bulk Operations
```typescript
// Event: matters_bulk_updated
// Invalidates:
// - ['matters'] (prefix, comprehensive)
// Strategy: Invalidate everything for safety
```

### 2. Smart Invalidation

The system includes intelligence to minimize unnecessary invalidations:

#### Column-Based Filtering
```typescript
// Only invalidate if the change affects visible columns
const rule = {
  condition: (event) => {
    const status = event.data?.status
    return !activeColumns.has(status) // Skip if column not visible
  }
}
```

#### Self-Update Filtering
```typescript
// Skip invalidation for self-initiated changes
const context = {
  isSelfInitiated: event.userId === getCurrentUserId()
}
```

### 3. Performance Optimization

#### Debouncing
```typescript
// Group rapid changes to prevent excessive invalidations
const rule = {
  debounceMs: 500, // Wait 500ms for additional changes
  rateLimit: 10    // Maximum 10 invalidations per second
}
```

#### Cascade Control
```typescript
// Enable cascade for important changes only
const rule = {
  cascade: true,  // Enable related query invalidation
  condition: (event) => event.data?.priority === 'high'
}
```

## Configuration

### Environment-Based Settings

The system adapts to different environments:

```typescript
// Development: Fast feedback, more logging
development: {
  debounceMs: { statusChange: 100 },
  rateLimits: { statusChange: 20 },
  sync: { debugMode: true }
}

// Production: Optimized performance
production: {
  debounceMs: { statusChange: 300 },
  rateLimits: { statusChange: 10 },
  sync: { debugMode: false }
}

// Test: Predictable behavior
test: {
  debounceMs: { statusChange: 0 },
  enableWebSocket: false
}
```

### Custom Configuration

```typescript
import { getInvalidationConfig } from '~/config/invalidation'

const config = getInvalidationConfig()
const sync = useRealTimeQuerySync(config.sync)
```

## Query Key Hierarchy

### Structured Key Design

The system uses hierarchical query keys for efficient invalidation:

```typescript
// Hierarchy example:
['matters']                          // Root level
├── ['matters', 'list']              // Lists with filters
│   └── ['matters', 'list', filters] // Specific filter combinations
├── ['matters', 'detail']            // Individual matters
│   └── ['matters', 'detail', id]   // Specific matter
├── ['matters', 'search']            // Search results
└── ['matters', 'statistics']       // Aggregated data
```

### Invalidation Targeting

```typescript
// Invalidate all matter lists
invalidateQueries({ queryKey: ['matters', 'list'], type: 'prefix' })

// Invalidate specific matter
invalidateQueries({ queryKey: ['matters', 'detail', '123'], type: 'exact' })

// Invalidate with predicate
invalidateQueries({
  predicate: (query) => {
    return query.queryKey[0] === 'matters' &&
           query.queryKey[1] === 'list' &&
           query.queryKey[2]?.status?.includes('active')
  }
})
```

## Best Practices

### 1. Rule Design

#### Specific Event Types
```typescript
// Good: Specific event types
eventTypes: ['matter_status_changed', 'kanban_move']

// Avoid: Generic event types that trigger too often
eventTypes: ['data_changed', 'update']
```

#### Appropriate Debouncing
```typescript
// High-frequency events: Longer debounce
{ eventTypes: ['matter_reordered'], debounceMs: 1000 }

// Important events: Shorter debounce
{ eventTypes: ['matter_created'], debounceMs: 200 }

// Critical events: No debounce
{ eventTypes: ['matter_deleted'], debounceMs: 0 }
```

### 2. Performance Considerations

#### Minimize Cascade Invalidations
```typescript
// Good: Cascade only when necessary
{
  cascade: true,
  condition: (event) => event.data?.affectsMultipleQueries
}

// Avoid: Always cascading
{ cascade: true }
```

#### Use Smart Filtering
```typescript
// Good: Filter based on context
condition: (event) => {
  const affectedStatuses = [event.data.oldStatus, event.data.newStatus]
  return activeColumns.some(status => affectedStatuses.includes(status))
}
```

### 3. Error Handling

#### Graceful Degradation
```typescript
try {
  await invalidateQueries(queryKeys)
} catch (error) {
  console.warn('Invalidation failed, falling back to full refresh')
  await forceSync()
}
```

#### Retry Logic
```typescript
const rule = {
  retries: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
}
```

## Monitoring and Debugging

### Metrics Tracking

```typescript
const { metrics } = useQueryInvalidation()

// Monitor performance
console.log(`Average invalidation time: ${metrics.value.averageInvalidationTime}ms`)
console.log(`Rate limited: ${metrics.value.rateLimitedInvalidations}`)
console.log(`Total invalidations: ${metrics.value.totalInvalidations}`)
```

### Debug Mode

```typescript
// Enable detailed logging in development
const sync = useRealTimeQuerySync({ debugMode: true })

// Logs will show:
// - Event processing details
// - Invalidation decisions
// - Performance metrics
// - Batch processing info
```

### Health Monitoring

```typescript
const { syncHealth, invalidationHealth } = useRealTimeQuerySync()

// Monitor system health
watch(syncHealth, (health) => {
  if (health === 'critical') {
    console.error('Sync system critical - check network and server')
  }
})
```

## Troubleshooting

### Common Issues

#### 1. Excessive Invalidations
**Symptoms:** UI lag, network overload
**Solutions:**
- Increase debounce times
- Add rate limiting
- Use more specific event filtering

#### 2. Stale Data
**Symptoms:** UI not updating
**Solutions:**
- Check invalidation rules
- Verify event types match
- Enable debug mode to trace events

#### 3. Memory Issues
**Symptoms:** Growing memory usage
**Solutions:**
- Check for memory leaks in timers
- Verify proper cleanup on unmount
- Monitor metrics for unusual patterns

### Debug Commands

```typescript
// Check invalidation status
const status = getInvalidationStatus()
console.log('Active rules:', status.rules.length)
console.log('Pending invalidations:', status.pending)

// Force sync for debugging
await forceSync()

// Clear state for fresh start
clearInvalidationState()
```

## Integration Examples

### Component Integration

```vue
<script setup lang="ts">
import { useKanbanSync } from '~/composables/useKanbanQueryInvalidation'

const { setActiveColumns, startDrag, completeDrag } = useKanbanSync()

// Set visible columns when component mounts
onMounted(() => {
  setActiveColumns(['draft', 'active', 'completed'])
})

// Handle drag operations
const onDragStart = (matterId: string, status: MatterStatus) => {
  startDrag(matterId, status)
}

const onDragEnd = async (matterId: string, newStatus: MatterStatus) => {
  await completeDrag(matterId, newStatus)
}
</script>
```

### Store Integration

```typescript
// In Pinia store
export const useMatterStore = defineStore('matters', () => {
  const sync = useRealTimeQuerySync()
  
  // Connect store actions to invalidation
  const updateMatter = async (id: string, data: any) => {
    const result = await api.updateMatter(id, data)
    
    // Trigger invalidation
    sync.webSocketInvalidation.handleRealtimeEvent({
      type: 'matter_updated',
      data: { id, ...data },
      userId: getCurrentUserId()
    }, { source: 'mutation', isSelfInitiated: true })
    
    return result
  }
  
  return { updateMatter }
})
```

## Migration Guide

### From Basic Invalidation

```typescript
// Before: Manual invalidation
queryClient.invalidateQueries(['matters'])

// After: Rule-based invalidation
const invalidation = useQueryInvalidation()
invalidation.handleRealtimeEvent({
  type: 'matter_updated',
  data: { id: 'matter-1' }
})
```

### From Polling Only

```typescript
// Before: Polling only
setInterval(() => {
  queryClient.invalidateQueries(['matters'])
}, 30000)

// After: Smart real-time sync
const sync = useRealTimeQuerySync({
  enableWebSocket: true,
  enablePolling: true // Fallback
})
```

This guide provides a comprehensive overview of the query invalidation system. For specific implementation details, refer to the individual composable files and configuration options.