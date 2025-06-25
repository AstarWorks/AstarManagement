# Task: T05_S08 - Optimistic Drag Drop Updates

## Task Details
- **ID**: T05_S08
- **Title**: Optimistic Drag Drop Updates
- **Description**: Implement optimistic updates for drag-and-drop operations using TanStack Query mutations with instant UI feedback
- **Status**: ready
- **Assignee**: unassigned
- **Created Date**: 2025-06-25
- **Priority**: high
- **Complexity**: medium
- **Estimated Time**: 16 hours
- **Tags**: [tanstack-query, optimistic-updates, drag-drop, vue-draggable, performance]
- **Dependencies**: ["T04_S08"]

## Acceptance Criteria
- [ ] Replace current optimistic update implementation with TanStack Query mutations
- [ ] Maintain instant UI feedback during drag operations (no visual lag)
- [ ] Implement proper rollback mechanisms on server failure
- [ ] Support both matter status changes and reordering within columns
- [ ] Preserve touch gesture support for mobile devices
- [ ] Maintain performance optimization patterns (60fps during drag)
- [ ] Handle concurrent drag operations gracefully
- [ ] Implement proper error boundaries for failed mutations

## Technical Guidance

### Current Implementation Analysis
The codebase currently implements optimistic updates through:

1. **useKanbanDragDrop Composable**
   - Manages drag state and validation logic
   - Provides event handlers for vuedraggable
   - Integrates with accessibility announcements
   - Validates status transitions based on MATTER_STATUS_TRANSITIONS

2. **Matter Store Optimistic Pattern**
   - `performOptimisticUpdate` wrapper function
   - Immediate UI updates with rollback capability
   - Tracks pending operations with Set<string>
   - Maintains optimisticUpdates Map for temporary state

3. **Drag-Drop Integration**
   - VueDraggable component in KanbanColumn.vue
   - Touch gesture support via useTouchGestures
   - Performance optimization with useMobilePerformance
   - Real-time status validation during drag

### TanStack Query Integration Points

1. **Mutation Configuration**
   - Configure mutations with optimistic updates
   - Set up proper mutation keys for cache invalidation
   - Implement onMutate, onError, and onSettled callbacks
   - Handle mutation context for rollback data

2. **Cache Management**
   - Update query cache optimistically during drag
   - Implement proper cache invalidation strategies
   - Handle partial updates for performance
   - Manage stale data during concurrent operations

3. **Error Recovery**
   - Implement comprehensive rollback mechanisms
   - Show error notifications without disrupting UX
   - Retry failed mutations with exponential backoff
   - Handle network disconnection scenarios

### Performance Considerations

1. **Drag Performance**
   - Maintain 60fps during drag operations
   - Use RAF (requestAnimationFrame) for smooth updates
   - Debounce/throttle non-critical updates
   - Minimize re-renders during drag

2. **Mobile Optimization**
   - Preserve touch gesture responsiveness
   - Optimize for low-powered devices
   - Handle momentum scrolling during drag
   - Reduce memory usage on mobile

## Implementation Notes

### Strategy
1. **Phase 1**: Create TanStack Query mutations for matter operations
   - Define mutation functions for status updates and reordering
   - Set up optimistic update configuration
   - Implement proper error handling

2. **Phase 2**: Integrate mutations with drag-drop events
   - Replace performOptimisticUpdate calls with mutations
   - Update event handlers to use mutation.mutate()
   - Maintain visual feedback during operations

3. **Phase 3**: Enhance error recovery and edge cases
   - Implement retry logic for failed mutations
   - Handle concurrent drag operations
   - Add offline support with queue management

4. **Phase 4**: Performance optimization and testing
   - Profile drag performance on various devices
   - Optimize render cycles during drag
   - Add comprehensive test coverage

### Key Files to Modify
- `composables/useKanbanDragDrop.ts` - Integrate TanStack Query mutations
- `stores/kanban/matters.ts` - Replace optimistic update pattern
- `components/kanban/KanbanColumn.vue` - Update drag event handlers
- `composables/useOptimisticUpdates.ts` - Potentially deprecate or adapt
- Create new `composables/useKanbanMutations.ts` for centralized mutations

## Subtasks
- [ ] Create TanStack Query mutations for matter status updates
- [ ] Create mutations for matter reordering within columns
- [ ] Integrate mutations with useKanbanDragDrop composable
- [ ] Update KanbanColumn component to use new mutations
- [ ] Implement comprehensive rollback mechanisms
- [ ] Add error boundaries and user notifications
- [ ] Optimize performance for smooth drag operations
- [ ] Test concurrent drag operations and edge cases
- [ ] Update matter store to work with TanStack Query cache
- [ ] Add integration tests for optimistic updates
- [ ] Document new mutation patterns and usage

## Related Files
- `/src/composables/useKanbanDragDrop.ts`
- `/src/stores/kanban/matters.ts`
- `/src/components/kanban/KanbanColumn.vue`
- `/src/composables/useOptimisticUpdates.ts`
- `/src/composables/useMobilePerformance.ts`
- `/src/composables/useTouchGestures.ts`

## Notes
- Ensure backward compatibility during migration
- Consider feature flag for gradual rollout
- Monitor performance metrics during implementation
- Coordinate with real-time updates implementation (T06_S08)