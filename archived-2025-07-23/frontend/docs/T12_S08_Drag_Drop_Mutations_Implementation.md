# T12_S08 - Drag & Drop Mutations Implementation Guide

## Overview

This document provides a comprehensive guide to the enhanced drag-drop mutations system implemented for the Kanban board, featuring TanStack Query integration, batch operations, real-time synchronization, and advanced performance optimizations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Implementation Details](#implementation-details)
4. [API Integration](#api-integration)
5. [Performance Optimizations](#performance-optimizations)
6. [Real-time Synchronization](#real-time-synchronization)
7. [Testing Strategy](#testing-strategy)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)
10. [Migration Guide](#migration-guide)

## Architecture Overview

The drag-drop mutations system is built on several key architectural principles:

### 1. Optimistic Updates First
- Immediate UI feedback during drag operations
- Automatic rollback on server errors
- Seamless user experience with <50ms perceived latency

### 2. TanStack Query Integration
- Comprehensive cache management
- Automatic query invalidation
- Consistent state synchronization
- Built-in error recovery

### 3. Batch Operations Support
- Atomic multi-matter operations
- Transaction-like semantics
- Performance optimization for bulk changes
- Progress tracking and partial failure handling

### 4. Real-time Collaboration
- WebSocket-based synchronization
- Conflict resolution strategies
- Collaborative editing indicators
- Presence awareness

### 5. Performance Optimization
- Position management algorithms
- Virtual scrolling for large datasets
- Debounced and throttled operations
- Memory usage optimization

## Core Components

### 1. `useKanbanDragDropMutations`

The primary composable that orchestrates all drag-drop operations:

```typescript
// Enhanced drag-drop mutations with TanStack Query
const {
  moveMatterMutation,
  batchMoveMutation,
  selectedMatters,
  isMultiSelectMode,
  performanceMetrics,
  onDragStart,
  onDragEnd
} = useKanbanDragDropMutations()
```

**Key Features:**
- Single and batch matter mutations
- Multi-select functionality
- Performance tracking
- Position calculation
- Real-time sync integration

### 2. `positionManager` Utility

Advanced position management with conflict resolution:

```typescript
import {
  calculateInsertPosition,
  normalizeColumnPositions,
  detectPositionConflicts,
  resolvePositionConflicts
} from '~/utils/positionManager'
```

**Capabilities:**
- Optimal position calculation
- Conflict detection and resolution
- Position normalization algorithms
- Statistics and monitoring

### 3. `useKanbanRealTimeSync`

Real-time synchronization and collaboration:

```typescript
const {
  syncState,
  hasConflicts,
  collaborators,
  updatePresence
} = useKanbanRealTimeSync({
  conflictResolution: 'server_wins',
  enablePresence: true
})
```

**Features:**
- WebSocket event handling
- Conflict resolution strategies
- Collaborator presence tracking
- Operation queuing for offline support

### 4. `useKanbanPerformanceOptimizer`

Performance monitoring and optimization:

```typescript
const {
  metrics,
  debouncedDragHandler,
  optimizeVirtualScrolling,
  getRecommendations
} = useKanbanPerformanceOptimizer({
  enableBatching: true,
  enableVirtualScrolling: true
})
```

**Optimizations:**
- Automatic performance tuning
- Resource usage monitoring
- Virtual scrolling for large lists
- Memory management

## Implementation Details

### Mutation Flow

1. **Drag Start**
   ```typescript
   onDragStart(event, matter) {
     // Track performance metrics
     // Update presence for real-time collaboration
     // Prepare optimistic update context
   }
   ```

2. **Position Calculation**
   ```typescript
   const position = calculateInsertPosition(
     targetIndex,
     existingMatters,
     draggedMatter.id
   )
   ```

3. **Optimistic Update**
   ```typescript
   queryClient.setQueryData(queryKeys.lists(), (old) => {
     return updateOptimistically(old, matter, newStatus, position)
   })
   ```

4. **Server Mutation**
   ```typescript
   await moveMatterMutation.mutateAsync({
     matterId: matter.id,
     newStatus: targetStatus,
     newPosition: position
   })
   ```

5. **Real-time Broadcast**
   ```typescript
   publishEvent('matter_moved', {
     matterId,
     fromStatus,
     toStatus,
     position,
     userId,
     timestamp
   })
   ```

### Batch Operations

For multi-select operations:

```typescript
// Batch move implementation
const operations = selectedMatters.map((matter, index) => ({
  matterId: matter.id,
  fromStatus: matter.status,
  toStatus: targetStatus,
  fromIndex: matter.position,
  toIndex: targetIndex + index,
  matter
}))

await batchMoveMutation.mutateAsync({
  operations,
  userId: currentUser.id,
  timestamp: new Date().toISOString()
})
```

### Position Management Algorithm

```typescript
function calculateInsertPosition(
  targetIndex: number,
  existingMatters: MatterCard[],
  excludeMatterId?: string
): PositionCalculation {
  // 1. Filter and sort existing matters
  const sortedMatters = filterAndSort(existingMatters, excludeMatterId)
  
  // 2. Handle edge cases (empty, beginning, end)
  if (isEdgeCase(targetIndex, sortedMatters)) {
    return handleEdgeCase(targetIndex, sortedMatters)
  }
  
  // 3. Calculate position between two matters
  const prevMatter = sortedMatters[targetIndex - 1]
  const nextMatter = sortedMatters[targetIndex]
  const gap = nextMatter.position - prevMatter.position
  
  // 4. Check if normalization is needed
  if (gap < POSITION_CONFIG.MIN_GAP) {
    return {
      position: Math.floor((prevMatter.position + nextMatter.position) / 2),
      needsNormalization: true,
      conflictResolved: false
    }
  }
  
  return {
    position: Math.floor((prevMatter.position + nextMatter.position) / 2),
    needsNormalization: false,
    conflictResolved: true
  }
}
```

## API Integration

### Server Endpoints

#### 1. Single Matter Move
```http
PATCH /api/matters/{id}/move
Content-Type: application/json

{
  "status": "ACTIVE",
  "position": 2000,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "matter-1",
    "status": "ACTIVE",
    "position": 2000,
    "updatedAt": "2024-01-01T12:00:01Z",
    "version": 2
  },
  "metadata": {
    "originalPosition": 2000,
    "finalPosition": 2000,
    "positionAdjusted": false
  }
}
```

#### 2. Batch Move Operations
```http
PATCH /api/matters/batch-move
Content-Type: application/json

{
  "operations": [
    {
      "matterId": "matter-1",
      "fromStatus": "DRAFT",
      "toStatus": "ACTIVE",
      "fromIndex": 0,
      "toIndex": 0,
      "matter": { ... }
    }
  ],
  "userId": "user-123",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "matter-1", ... }
  ],
  "processedCount": 1,
  "metadata": {
    "operationId": "batch-1640995200000",
    "executionTime": 150
  }
}
```

### Error Handling

The system handles various error scenarios:

1. **Validation Errors (400)**
   - Invalid status transitions
   - Malformed request data
   - Missing required fields

2. **Conflict Errors (409)**
   - Concurrent modifications
   - Position conflicts
   - Version mismatches

3. **Server Errors (500)**
   - Database failures
   - Network timeouts
   - Service unavailability

Example error response:
```json
{
  "error": "Conflict detected: Matter was modified by another user",
  "code": "CONCURRENT_MODIFICATION",
  "statusCode": 409,
  "retryable": true,
  "metadata": {
    "currentVersion": 3,
    "requestVersion": 2
  }
}
```

## Performance Optimizations

### 1. Debouncing and Throttling

```typescript
// Drag operations debounced to 16ms (~60fps)
const debouncedDragHandler = debounce(handleDrag, 16)

// Render updates throttled
const throttledRenderUpdate = throttle(updateRender, 16)

// Network requests debounced
const debouncedMutation = debounce(executeMutation, 100)
```

### 2. Virtual Scrolling

For columns with >100 items:

```typescript
const { visibleItems, startIndex, endIndex } = optimizeVirtualScrolling(
  allMatters,
  containerHeight
)
```

### 3. Memory Management

```typescript
// Automatic cache cleanup
const optimizeMemory = () => {
  const caches = queryClient.getQueryCache().getAll()
  if (caches.length > maxCacheSize) {
    removeOldestCaches(caches, maxCacheSize)
  }
}
```

### 4. Position Normalization

```typescript
// Automatic position optimization
if (needsNormalization(matters)) {
  const optimized = normalizeColumnPositions(matters)
  updateMattersOptimistically(optimized)
}
```

## Real-time Synchronization

### Event Types

1. **matter_moved** - Single matter position change
2. **matter_batch_moved** - Batch operation completion
3. **position_normalized** - Position optimization event
4. **conflict_detected** - Concurrent modification detected
5. **presence_update** - User presence change

### Conflict Resolution

The system supports multiple conflict resolution strategies:

1. **Server Wins** (default)
   ```typescript
   // Apply server changes, notify user
   queryClient.setQueryData(queryKey, serverData)
   toast.warning('Updated by another user')
   ```

2. **Client Wins**
   ```typescript
   // Republish local changes
   publishEvent('matter_moved', localChanges)
   ```

3. **Merge Strategy**
   ```typescript
   // Intelligent merging for compatible changes
   const merged = mergeChanges(localChanges, serverChanges)
   queryClient.setQueryData(queryKey, merged)
   ```

### Presence Tracking

```typescript
// Update user presence during drag operations
updatePresence(currentColumn, draggedMatterId)

// Display collaborator indicators
<CollaboratorPresence collaborators={activeCollaborators} />
```

## Testing Strategy

### Unit Tests

```typescript
// Test mutation operations
describe('useKanbanDragDropMutations', () => {
  it('should handle single matter moves', async () => {
    const { result } = renderComposable(() => useKanbanDragDropMutations())
    
    await result.moveMatterMutation.mutateAsync({
      matterId: 'matter-1',
      newStatus: 'ACTIVE',
      newPosition: 2000
    })
    
    expect(mockQueryClient.setQueryData).toHaveBeenCalled()
  })
  
  it('should handle batch operations', async () => {
    // Test batch mutation scenarios
  })
  
  it('should calculate positions correctly', () => {
    // Test position calculation algorithms
  })
})
```

### Integration Tests

```typescript
// Test full drag-drop workflow
describe('Kanban Board Integration', () => {
  it('should complete drag-drop operation end-to-end', async () => {
    render(<KanbanBoardEnhanced />)
    
    // Simulate drag operation
    const matterCard = screen.getByTestId('matter-card-1')
    const targetColumn = screen.getByTestId('column-active')
    
    fireEvent.dragStart(matterCard)
    fireEvent.dragOver(targetColumn)
    fireEvent.drop(targetColumn)
    
    // Verify state updates
    await waitFor(() => {
      expect(screen.getByText('Matter moved successfully')).toBeInTheDocument()
    })
  })
})
```

### Performance Tests

```typescript
// Test performance under load
describe('Performance Tests', () => {
  it('should handle large datasets efficiently', () => {
    const largeDataset = generateMatters(1000)
    const { result } = renderComposable(() => 
      useKanbanPerformanceOptimizer()
    )
    
    const startTime = performance.now()
    result.optimizeVirtualScrolling(largeDataset, 600)
    const duration = performance.now() - startTime
    
    expect(duration).toBeLessThan(100) // Should complete in <100ms
  })
})
```

## Usage Examples

### Basic Drag-Drop Setup

```vue
<template>
  <KanbanBoardEnhanced
    :columns="kanbanColumns"
    :enable-multi-select="true"
    :enable-real-time-sync="true"
    :show-performance-metrics="isDevelopment"
    @matter-moved="handleMatterMoved"
    @batch-operation="handleBatchOperation"
  />
</template>

<script setup>
import { useKanbanDragDropMutations } from '~/composables/useKanbanDragDropMutations'

const {
  selectedMatters,
  isMultiSelectMode,
  performanceMetrics,
  clearSelection
} = useKanbanDragDropMutations()

const handleMatterMoved = (matter, fromStatus, toStatus) => {
  console.log(`Matter ${matter.id} moved from ${fromStatus} to ${toStatus}`)
}

const handleBatchOperation = (operations) => {
  console.log(`Batch operation completed: ${operations.length} matters`)
}
</script>
```

### Custom Performance Configuration

```typescript
// Configure performance optimizer
const performanceOptimizer = useKanbanPerformanceOptimizer({
  enableBatching: true,
  batchSize: 20,
  batchDelayMs: 300,
  enableVirtualScrolling: true,
  virtualScrollThreshold: 50,
  enableAutoOptimization: true,
  optimizationThresholds: {
    latency: 150,
    memoryUsage: 30 * 1024 * 1024, // 30MB
    operationCount: 200
  }
})
```

### Real-time Collaboration Setup

```typescript
// Configure real-time sync
const realTimeSync = useKanbanRealTimeSync({
  conflictResolution: 'prompt_user', // Show conflict dialog
  enablePresence: true,
  enableLocking: false // Don't lock matters during editing
})

// Handle conflicts manually
const handleConflictResolution = (conflictId, strategy) => {
  realTimeSync.resolveConflict(conflictId, strategy)
}
```

## Troubleshooting

### Common Issues

1. **Slow Drag Performance**
   ```typescript
   // Check performance metrics
   const { metrics } = useKanbanPerformanceOptimizer()
   console.log('Average latency:', metrics.value.averageLatency)
   
   // Enable optimizations
   performanceOptimizer.updateConfig({
     dragDebounceMs: 32, // Reduce to 30fps
     enableBatching: true
   })
   ```

2. **Position Conflicts**
   ```typescript
   // Check for conflicts
   const conflicts = detectPositionConflicts(matters)
   if (conflicts.length > 0) {
     const resolved = resolvePositionConflicts(matters, conflicts)
     // Update with resolved positions
   }
   ```

3. **Memory Leaks**
   ```typescript
   // Monitor memory usage
   const { resourceMonitor } = useKanbanPerformanceOptimizer()
   watch(resourceMonitor, (resources) => {
     if (resources.memory > 50 * 1024 * 1024) { // 50MB
       performanceOptimizer.optimizeMemory()
     }
   })
   ```

4. **Real-time Sync Issues**
   ```typescript
   // Check connection status
   const { isConnected, queuedOperations } = useKanbanRealTimeSync()
   
   if (!isConnected.value && queuedOperations.value > 0) {
     // Handle offline operations
     console.log(`${queuedOperations.value} operations queued`)
   }
   ```

### Debug Mode

Enable comprehensive debugging:

```typescript
// Enable debug logging
const debugConfig = {
  enableMonitoring: true,
  monitoringIntervalMs: 1000, // More frequent updates
  enableAutoOptimization: false, // Manual control
}

const optimizer = useKanbanPerformanceOptimizer(debugConfig)

// Log performance events
watch(optimizer.metrics, (metrics) => {
  console.log('Performance update:', metrics.optimizationEvents)
}, { deep: true })
```

## Migration Guide

### From Basic Drag-Drop to Enhanced System

1. **Update Imports**
   ```typescript
   // Before
   import { useKanbanDragDrop } from '~/composables/useKanbanDragDrop'
   
   // After
   import { useKanbanDragDropMutations } from '~/composables/useKanbanDragDropMutations'
   ```

2. **Update Component Usage**
   ```vue
   <!-- Before -->
   <KanbanBoard @matter-moved="handleMove" />
   
   <!-- After -->
   <KanbanBoardEnhanced 
     :enable-multi-select="true"
     :enable-real-time-sync="true"
     @matter-moved="handleMove"
     @batch-operation="handleBatch"
   />
   ```

3. **Update Event Handlers**
   ```typescript
   // Before
   const handleMove = (matter, status) => {
     // Simple status update
   }
   
   // After
   const handleMove = (matter, fromStatus, toStatus, position) => {
     // Enhanced with position tracking
   }
   ```

### Performance Considerations

- **Batch Size**: Start with default (10), adjust based on server capacity
- **Debounce Timing**: 16ms for 60fps, increase if performance issues
- **Virtual Scrolling**: Enable for >100 items per column
- **Cache Management**: Monitor memory usage, adjust `maxCacheSize`

### Breaking Changes

1. **Position Property**: All matters now require a `position` number field
2. **Mutation API**: Enhanced with transaction support and batch operations
3. **Event Structure**: Real-time events include additional metadata
4. **Error Handling**: More specific error codes and retry strategies

## Conclusion

The enhanced drag-drop mutations system provides a robust, performant, and collaborative solution for Kanban board interactions. With comprehensive testing, real-time synchronization, and automatic performance optimization, it delivers a superior user experience while maintaining data consistency and system reliability.

For additional support or questions, refer to the component documentation or contact the development team.