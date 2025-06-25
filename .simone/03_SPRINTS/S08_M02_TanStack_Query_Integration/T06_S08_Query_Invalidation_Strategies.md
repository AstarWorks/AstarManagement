# Task: Query Invalidation Strategies

## Task Details
- **Task ID**: T06_S08
- **Title**: Query Invalidation Strategies
- **Description**: Set up intelligent query invalidation for real-time sync, ensuring data consistency across components and users
- **Status**: ready
- **Assignee**: unassigned
- **Created_date**: 2025-06-25
- **Priority**: medium
- **Complexity**: medium
- **Dependencies**: ["T03_S08_Core_Queries_Setup", "T04_S08"]

## Technical Guidance

### Current Real-Time Update Patterns
The codebase currently implements three distinct real-time synchronization patterns:

1. **Polling-based Updates (useRealTimeUpdates)**
   - Default interval: 30 seconds (configurable)
   - Automatic fetch on mount with manual refresh capability
   - Error handling with callback support
   - Loading states and last update timestamps

2. **WebSocket Architecture (useWebSocketConnection)**
   - Automatic reconnection with exponential backoff
   - Heartbeat mechanism for connection keepalive
   - Event-based message handling with JSON parsing
   - Connection state management and monitoring

3. **Kanban-specific Real-Time (useKanbanRealTime)**
   - 5-second polling interval for high-frequency updates
   - Card movement, creation, update, and deletion tracking
   - User notification integration via toast messages
   - Direct store updates for immediate UI reflection

### WebSocket Readiness Architecture
The application has a comprehensive WebSocket infrastructure ready for activation:

- **Connection Management**: Auto-reconnect, heartbeat, and state tracking
- **Event System**: Type-based routing for different update categories
- **Conflict Resolution**: Server/local/merge strategies for concurrent edits
- **User Presence**: Active user tracking and join/leave notifications
- **Performance Optimization**: Batch updates, event limiting, and debouncing

### Polling Intervals and Optimization
Current polling configuration from realtime.ts:
- Standard polling: 5 seconds (Kanban board)
- Default composable: 30 seconds (general data)
- Backoff strategy: 2x multiplier with 30-second max delay
- Performance features: Debounce (100ms), batch updates, virtual scrolling

### Cache Consistency Requirements
The real-time store (kanban/real-time.ts) implements:
- Sync status tracking with retry mechanisms
- Conflict detection based on timestamps
- Network quality monitoring for adaptive sync
- Event history maintenance (last 100 events)
- Offline queue management for resilience

### Component Update Patterns
Components integrate real-time updates through:
- ConnectionStatus.vue: Visual sync state indicators
- Store-based reactivity: Direct Pinia store updates
- Optimistic updates: Immediate UI updates with server confirmation
- Conflict resolution: User-driven or automatic strategies

## Implementation Notes

### Invalidation Strategy Requirements
The TanStack Query invalidation system must:

1. **Integrate with Existing Real-Time Infrastructure**
   - Hook into WebSocket message handlers for targeted invalidation
   - Utilize polling callbacks to trigger query refreshes
   - Respect network status for intelligent sync decisions

2. **Implement Smart Invalidation Patterns**
   - Invalidate only affected queries based on update type
   - Use partial invalidation for large datasets
   - Implement cascade invalidation for related data

3. **Support Multi-User Collaboration**
   - Differentiate between self-initiated and external updates
   - Prevent invalidation loops in bidirectional sync
   - Handle race conditions with optimistic updates

4. **Optimize Performance**
   - Batch invalidations within the same tick
   - Implement debouncing for rapid updates
   - Use query key hierarchies for targeted invalidation

5. **Maintain Data Consistency**
   - Ensure cache coherence across all active queries
   - Handle stale-while-revalidate patterns
   - Implement proper error recovery mechanisms

## Subtasks

- [ ] Create query invalidation utility for WebSocket events
- [ ] Implement polling-to-query synchronization bridge
- [ ] Design query key structure for efficient invalidation
- [ ] Build invalidation rules engine for update types
- [ ] Add optimistic update reconciliation with TanStack Query
- [ ] Create conflict resolution UI components
- [ ] Implement cascade invalidation for related entities
- [ ] Add performance monitoring for invalidation operations
- [ ] Write comprehensive tests for invalidation scenarios
- [ ] Document invalidation patterns and best practices

## Additional Resources
- TanStack Query invalidation documentation
- WebSocket event handling patterns
- Real-time sync architectural decisions
- Performance optimization guidelines