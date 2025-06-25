# T12_S08 - Drag & Drop Mutations

## Task Details
- **ID**: T12_S08
- **Title**: Drag & Drop Mutations
- **Description**: Implement drag-drop specific mutations and batch operations with real-time sync integration
- **Status**: ready
- **Assignee**: unassigned
- **Created_date**: 2025-06-25
- **Priority**: high
- **Complexity**: medium
- **Dependencies**: ["T04_S08_Basic_Mutations"]

## Technical Requirements

### Mutation Operations to Implement
1. **Move Matter** - Update status through drag-drop with validation
2. **Batch Updates** - Bulk operations with transaction support
3. **Real-time Sync** - Coordinate optimistic updates with WebSocket events

### Integration Points
- TanStack Query mutations with drag-drop handlers
- Batch operation support with progress tracking
- Real-time WebSocket updates coordination
- Conflict resolution for concurrent edits
- Accessibility announcements for drag operations

## Technical Guidance

### Current Drag-Drop Implementation
The `useKanbanDragDrop` composable handles:
- Drag state management with type safety
- Drop zone validation and visual feedback
- Touch support for mobile devices
- Accessibility with ARIA live regions
- Auto-scroll during drag operations

### API Contract for Batch Operations
Server endpoints for batch operations:
- PATCH `/api/matters/batch` - Bulk updates with transaction support

### Optimistic Update Strategies for Drag-Drop
Special considerations for drag-drop mutations:
- Immediate visual feedback during drag
- Position/index updates within columns
- Status transition validation
- Rollback animations on failure

### Conflict Resolution Patterns
Handle concurrent updates:
- Server-wins strategy for conflicts
- Client-wins option for local priority
- Merge strategies for non-conflicting changes
- Operation deduplication

## Implementation Notes

### Drag-Drop Mutation Strategy
1. **Visual First**: Update UI immediately on drop
2. **Validate Transitions**: Check allowed status changes
3. **Batch Position Updates**: Optimize multiple moves
4. **Smart Conflict Resolution**: Handle concurrent edits gracefully
5. **Accessibility Feedback**: Announce all operations to screen readers

### Key Considerations
- Maintain drag-drop functionality during mutations
- Handle race conditions between drag operations and server updates
- Implement proper position recalculation
- Ensure smooth animations during rollback
- Support multi-select drag operations

## Subtasks

### 1. Implement Move Matter Mutation
- [ ] Create `useMoveMatter` mutation for drag-drop
- [ ] Validate allowed status transitions
- [ ] Update position/index within columns
- [ ] Integrate with `useKanbanDragDrop` composable
- [ ] Add accessibility announcements

### 2. Implement Batch Mutations
- [ ] Create `useBatchUpdateMatters` mutation
- [ ] Handle transaction semantics
- [ ] Implement progress tracking
- [ ] Add bulk operation UI feedback
- [ ] Handle partial failures

### 3. Position Management System
- [ ] Implement position calculation for dropped items
- [ ] Handle position conflicts and recalculation
- [ ] Create position normalization utility
- [ ] Add position-based sorting optimization
- [ ] Test with large datasets

### 4. Real-time Sync Integration
- [ ] Coordinate optimistic updates with WebSocket events
- [ ] Handle conflict resolution for concurrent edits
- [ ] Implement operation deduplication
- [ ] Add real-time status indicators
- [ ] Test with multiple client sessions

### 5. Drag-Drop Enhancements
- [ ] Add multi-select drag support
- [ ] Implement drag preview customization
- [ ] Add drop zone validation feedback
- [ ] Create undo/redo for drag operations
- [ ] Enhance mobile touch interactions

### 6. Performance Optimizations
- [ ] Implement virtual scrolling for large boards
- [ ] Add debouncing for position updates
- [ ] Create efficient diff algorithms
- [ ] Optimize re-render patterns
- [ ] Add performance monitoring

### 7. Testing and Documentation
- [ ] Write tests for drag-drop mutations
- [ ] Test concurrent drag operations
- [ ] Document batch operation patterns
- [ ] Create interactive demos
- [ ] Add performance benchmarks

## Success Criteria
- Drag-drop remains responsive during mutations
- Batch operations complete atomically
- Real-time updates don't conflict with local changes
- Smooth animations and visual feedback
- Full accessibility support for all operations
- Performance: <50ms response time for drag operations

## Notes
- Build on top of basic mutations from T04_S08
- Ensure compatibility with existing kanban board
- Consider implementing operation queuing for offline support
- Add analytics for drag-drop usage patterns