# TanStack Query Enhanced Mutation Patterns

## Overview

This document outlines the enhanced mutation patterns implemented for the Aster Management legal case management system using TanStack Query with Vue 3 and Nuxt.js.

## Architecture

### Enhanced Mutation Features

The mutation system provides several advanced features beyond basic CRUD operations:

1. **Comprehensive Validation**: Client-side validation with Zod schemas
2. **Offline Support**: Mutation queueing for offline scenarios
3. **Conflict Detection**: Server-side conflict resolution for concurrent updates
4. **Soft Delete**: Reversible deletion with undo functionality
5. **Optimistic Updates**: Immediate UI feedback with rollback on failure
6. **Analytics Tracking**: Performance and usage metrics
7. **Enhanced Error Handling**: User-friendly error messages and recovery

## Core Mutation Patterns

### 1. Enhanced Create Matter

```typescript
import { useEnhancedCreateMatter } from '~/composables/useMatterMutations'

const {
  mutateAsync,
  validationErrors,
  isValidating,
  validateInput
} = useEnhancedCreateMatter()

// Validate before submitting
const isValid = validateInput(formData)
if (!isValid) {
  console.error('Validation errors:', validationErrors.value)
  return
}

// Submit with enhanced error handling
try {
  const newMatter = await mutateAsync(formData)
  console.log('Matter created:', newMatter)
} catch (error) {
  // Error handling is automatic via toast notifications
}
```

#### Features:
- **Zod Schema Validation**: Comprehensive input validation
- **Offline Queueing**: Stores mutations when offline
- **Toast Notifications**: Success/error feedback
- **Optimistic Updates**: Immediate UI feedback

### 2. Enhanced Update Matter

```typescript
import { useEnhancedUpdateMatter } from '~/composables/useMatterMutations'

const {
  mutateAsync,
  conflicts,
  resolveConflict
} = useEnhancedUpdateMatter()

// Update with conflict detection
try {
  const updatedMatter = await mutateAsync({
    id: matterId,
    data: updateData
  })
} catch (error) {
  if (error.message === 'CONFLICT_DETECTED') {
    // Handle conflict resolution
    const conflict = conflicts.value[matterId]
    // Show conflict resolution UI
    resolveConflict(matterId, 'keep_local') // or 'keep_server'
  }
}
```

#### Features:
- **Conflict Detection**: Compares server state before updating
- **Field-Level Conflicts**: Detailed conflict information
- **Resolution Strategies**: Choose local or server version
- **Validation**: Input validation with Zod schemas

### 3. Enhanced Delete Matter

```typescript
import { useEnhancedDeleteMatter } from '~/composables/useMatterMutations'

const {
  mutateAsync,
  softDelete,
  undoDelete,
  canUndo,
  pendingDeletes
} = useEnhancedDeleteMatter()

// Soft delete with undo capability
const matter = await $fetch(`/api/matters/${matterId}`)
const result = await softDelete(matter)

if (result.canUndo) {
  // Show undo option for 30 seconds
  setTimeout(() => {
    if (canUndo(matterId)) {
      undoDelete(matterId)
    }
  }, 5000) // User clicked undo within 5 seconds
}

// Permanent delete
await softDelete(matter, true) // permanent = true
```

#### Features:
- **Soft Delete**: 30-second undo window
- **Confirmation Dialogs**: User confirmation before deletion
- **Undo Functionality**: Restore deleted items
- **Cascade Handling**: Handle related document cleanup

### 4. Enhanced Move Matter (Drag & Drop)

```typescript
import { useEnhancedMoveMatter } from '~/composables/useMatterMutations'

const {
  mutateAsync,
  startDrag,
  cancelDrag,
  isDragging
} = useEnhancedMoveMatter()

// Start drag operation
const handleDragStart = (matterId: string, currentStatus: string) => {
  startDrag(matterId, currentStatus)
}

// Complete drag operation
const handleDrop = async (matterId: string, newStatus: string, newPosition: number) => {
  try {
    const result = await mutateAsync({
      matterId,
      newStatus,
      newPosition
    })
    console.log('Matter moved:', result)
  } catch (error) {
    // Automatic rollback and error notification
    cancelDrag(matterId)
  }
}
```

#### Features:
- **Drag Tracking**: Monitor drag operation duration
- **Performance Metrics**: Track drag completion times
- **Status Change Notifications**: Only show for significant changes
- **Validation**: Ensure valid status transitions

## Offline Support

### Mutation Queue System

```typescript
import { useOfflineMutationQueue } from '~/composables/useMatterMutations'

const {
  queueSize,
  processQueue,
  clearQueue,
  isOnline
} = useOfflineMutationQueue()

// Monitor queue status
watch(queueSize, (size) => {
  if (size > 0) {
    console.log(`${size} mutations queued for sync`)
  }
})

// Process queue when online
watch(isOnline, (online) => {
  if (online && queueSize.value > 0) {
    processQueue()
  }
})
```

#### Features:
- **Automatic Queuing**: Mutations stored when offline
- **Retry Logic**: Failed mutations retried up to 3 times
- **Batch Processing**: Efficient batch synchronization
- **Progress Feedback**: Toast notifications for sync status

## Analytics and Monitoring

### Mutation Analytics

```typescript
import { useMutationAnalytics } from '~/composables/useMatterMutations'

const {
  analytics,
  trackMutation,
  resetAnalytics
} = useMutationAnalytics()

// Analytics data structure
interface MutationAnalytics {
  totalMutations: number
  successfulMutations: number
  failedMutations: number
  averageLatency: number
  mutationTypes: {
    create: number
    update: number
    delete: number
    move: number
  }
}

// View current analytics
console.log('Success rate:', 
  analytics.value.successfulMutations / analytics.value.totalMutations * 100
)
console.log('Average response time:', analytics.value.averageLatency, 'ms')
```

## Error Handling Strategies

### Validation Errors

```typescript
// Client-side validation with Zod
const createMatterSchema = z.object({
  title: z.string().min(3).max(200),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  // ... other fields
})

// Validation error handling
try {
  createMatterSchema.parse(formData)
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      console.error(`${err.path.join('.')}: ${err.message}`)
    })
  }
}
```

### Network Errors

```typescript
// Automatic error categorization
const handleMutationError = (error: Error) => {
  if (error.message.includes('network')) {
    // Network error - queue for retry
    toast.warning('Connection issue', 'Will retry when online')
  } else if (error.message.includes('validation')) {
    // Validation error - user action required
    toast.error('Invalid data', 'Please check your input')
  } else if (error.message.includes('conflict')) {
    // Conflict error - show resolution options
    toast.error('Conflict detected', 'Matter was modified by another user')
  } else {
    // Generic error
    toast.error('Operation failed', error.message)
  }
}
```

### Recovery Strategies

1. **Optimistic Rollback**: Automatic UI revert on failure
2. **Retry with Exponential Backoff**: Smart retry timing
3. **Offline Queueing**: Store for later synchronization
4. **Conflict Resolution**: User-guided conflict resolution
5. **Graceful Degradation**: Maintain functionality during errors

## Best Practices

### 1. Mutation Composition

```typescript
// Compose mutations for complex operations
const useMatterWorkflow = () => {
  const createMutation = useEnhancedCreateMatter()
  const updateMutation = useEnhancedUpdateMatter()
  const deleteMutation = useEnhancedDeleteMatter()

  const createAndAssign = async (matterData: CreateMatterInput, lawyerId: string) => {
    const matter = await createMutation.mutateAsync(matterData)
    return await updateMutation.mutateAsync({
      id: matter.id,
      data: { assignedLawyer: lawyerId }
    })
  }

  return { createAndAssign }
}
```

### 2. Form Integration

```typescript
// Integration with VeeValidate forms
const { handleSubmit, defineField } = useForm({
  validationSchema: toTypedSchema(createMatterSchema)
})

const { mutateAsync, isLoading } = useEnhancedCreateMatter()

const onSubmit = handleSubmit(async (values) => {
  await mutateAsync(values)
})
```

### 3. Component Usage

```vue
<script setup lang="ts">
const { mutateAsync: createMatter, isLoading: creating } = useEnhancedCreateMatter()
const { mutateAsync: updateMatter } = useEnhancedUpdateMatter()
const { softDelete, canUndo } = useEnhancedDeleteMatter()

const handleCreate = async (data: CreateMatterInput) => {
  const matter = await createMatter(data)
  await navigateTo(`/matters/${matter.id}`)
}

const handleStatusChange = async (matterId: string, status: MatterStatus) => {
  await updateMatter({ id: matterId, data: { status } })
}
</script>

<template>
  <div>
    <Button @click="handleCreate(formData)" :disabled="creating">
      {{ creating ? 'Creating...' : 'Create Matter' }}
    </Button>
    
    <Button 
      v-if="canUndo(matterId)" 
      @click="undoDelete(matterId)"
      variant="outline"
    >
      Undo Delete
    </Button>
  </div>
</template>
```

## Performance Considerations

### 1. Optimistic Updates
- **Immediate Feedback**: UI updates instantly
- **Smart Rollback**: Only affected data is reverted
- **Memory Efficiency**: Cleanup after confirmation

### 2. Batch Operations
- **Queue Batching**: Multiple offline mutations batched
- **Debounced Updates**: Rapid updates are debounced
- **Selective Invalidation**: Only relevant queries invalidated

### 3. Memory Management
- **Automatic Cleanup**: Expired mutations removed
- **Weak References**: Prevent memory leaks
- **Garbage Collection**: Periodic cleanup of stale data

## Testing Strategies

### Unit Tests
- **Schema Validation**: Test all validation scenarios
- **Error Handling**: Verify error categorization
- **State Management**: Test optimistic updates
- **Analytics**: Verify metrics tracking

### Integration Tests
- **API Contract**: Test with mock server responses
- **Error Scenarios**: Network failures, conflicts, timeouts
- **Workflow Testing**: End-to-end mutation sequences
- **Recovery Testing**: Offline/online transitions

## Security Considerations

### 1. Input Validation
- **Client & Server**: Validation on both sides
- **Sanitization**: Input sanitization for XSS prevention
- **Type Safety**: TypeScript for compile-time safety

### 2. Conflict Resolution
- **Timestamp Validation**: Prevent stale updates
- **User Authorization**: Verify update permissions
- **Audit Trail**: Track all mutations for compliance

### 3. Error Information
- **Sensitive Data**: Don't expose sensitive info in errors
- **User Feedback**: Provide helpful but safe error messages
- **Logging**: Comprehensive server-side logging

## Conclusion

The enhanced mutation system provides a robust, user-friendly, and performant foundation for managing legal matter data in the Aster Management system. The combination of optimistic updates, offline support, conflict detection, and comprehensive error handling ensures a smooth user experience even in challenging network conditions or concurrent usage scenarios.