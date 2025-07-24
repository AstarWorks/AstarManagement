# Task: T02_S08 - Query Client Configuration for Kanban

## Task Details
- **Task ID**: T02_S08
- **Title**: Query Client Configuration for Kanban
- **Description**: Configure query client with optimal settings for Kanban board operations, including cache times, retry logic, and mutation defaults
- **Status**: completed
- **Assignee**: Claude
- **Started**: 2025-06-25 15:56
- **Completed**: 2025-06-25 16:01
- **Created_date**: 2025-06-25
- **Priority**: high
- **Complexity**: low
- **Dependencies**: ["T01_S08"]

## Requirements

### Functional Requirements
1. Configure query client with performance-optimized settings for Kanban operations
2. Set up appropriate cache times for different query types (matters, columns, filters)
3. Configure retry logic with exponential backoff for failed requests
4. Set up mutation defaults with optimistic updates support
5. Integrate with existing toast notification system for mutation feedback
6. Configure error handling that aligns with existing error patterns
7. Enable query devtools for development environment
8. Set up proper garbage collection and cache size limits

### Non-Functional Requirements
1. **Performance**: Queries must meet p95 < 200ms target from architecture
2. **Reliability**: Implement smart retry logic for transient failures
3. **UX**: Provide immediate feedback through optimistic updates
4. **Developer Experience**: Clear configuration with comprehensive comments
5. **Memory Management**: Prevent memory leaks with proper cache limits

## Technical Guidance

### Performance Targets (from Architecture)
- API Response: p95 < 200ms
- Search Results: < 500ms
- System must support real-time updates via WebSocket
- Offline capability required for court visits

### Existing Error Handling Patterns
The codebase uses a sophisticated error handling system through `useErrorHandler`:
- Standardized AppError interface with severity levels
- Automatic retry with exponential backoff
- API error transformation to consistent format
- Integration with toast notifications for user feedback

### Notification System Integration
The application uses a global toast system via `$toast` plugin:
- Success/error/warning/info toast types
- Auto-dismiss with configurable duration
- Action buttons support for undo operations
- Global state management for toast queue

### Loading State Management
Current patterns use:
- Local `loading` refs in composables
- Pinia store for global loading states
- Optimistic updates for immediate UI feedback
- Accessibility announcements for state changes

### Plugin Configuration Pattern
Existing plugins follow a consistent pattern:
- Client-only plugins in `plugins/*.client.ts`
- Use `defineNuxtPlugin` for proper Nuxt integration
- Provide global utilities via `provide` API
- Type declarations for auto-imports support

## Implementation Notes

### Configuration Strategy
1. **Query Defaults**:
   - Set stale time based on data volatility (matters: 5min, static data: 30min)
   - Configure cache time relative to stale time (2x stale time)
   - Enable refetch on window focus for real-time accuracy
   - Set up network mode for offline support

2. **Mutation Defaults**:
   - Enable retry for idempotent operations only
   - Configure onMutate for optimistic updates
   - Set up onError for automatic rollback
   - Integrate onSuccess/onError with toast notifications

3. **Error Handling**:
   - Transform errors using existing `transformApiError` utility
   - Leverage `useApiErrorHandler` patterns
   - Configure retry delay using exponential backoff
   - Set maximum retry attempts based on error type

4. **Development Tools**:
   - Enable React Query devtools in development only
   - Configure devtools position to not interfere with Kanban UI
   - Set up logging for debugging query/mutation lifecycle

## Subtasks
- [x] Create query client configuration file at `config/tanstack-query.ts`
- [x] Define query defaults with appropriate cache/stale times
- [x] Configure mutation defaults with optimistic update support
- [x] Set up error handling integration with existing patterns
- [x] Implement retry logic with exponential backoff
- [x] Configure development tools and debugging options
- [x] Add type declarations for global query client access
- [x] Create configuration constants file for easy tuning
- [x] Set up query garbage collection and memory limits
- [x] Document configuration decisions and rationale

## Acceptance Criteria
- [x] Query client is globally available in all components
- [x] Queries respect configured cache and stale times
- [x] Failed requests retry with exponential backoff
- [x] Mutations show optimistic updates immediately
- [x] Errors display via existing toast notification system
- [x] Configuration is environment-aware (dev vs prod)
- [x] Memory usage remains stable under heavy load
- [x] Developer tools available in development mode
- [x] All configuration values are easily tunable
- [x] Integration maintains existing error handling patterns

## Related Files
- `src/plugins/toast.client.ts` - Toast notification system
- `src/composables/useErrorHandler.ts` - Error handling patterns
- `src/composables/useApi.ts` - API client configuration
- `src/composables/useOptimisticUpdates.ts` - Optimistic update patterns
- `src/plugins/pinia.client.ts` - Plugin configuration example
- `src/stores/kanban/` - Kanban store modules
- `.simone/01_PROJECT_DOCS/ARCHITECTURE.md` - Performance targets

## Notes
- Query client must support both REST and future GraphQL endpoints
- Configuration should allow for easy migration to WebSocket subscriptions
- Consider memory constraints for mobile devices
- Ensure compatibility with SSR/hydration requirements
- Plan for future offline-first capabilities

## Output Log
[2025-06-25 15:56]: Started T02_S08 implementation - Query Client Configuration for Kanban
[2025-06-25 15:57]: Created comprehensive query configuration file at `/src/config/tanstack-query.ts`
[2025-06-25 15:58]: Implemented optimal cache timing constants for different data volatility levels
[2025-06-25 15:59]: Added exponential backoff retry logic with intelligent error type detection
[2025-06-25 16:00]: Configured memory management with automatic cleanup for long-running sessions
[2025-06-25 16:01]: Created enhanced TanStack Query plugin at `/src/plugins/tanstack-query.client.ts`
[2025-06-25 16:02]: Integrated error handling with existing `useErrorHandler` system
[2025-06-25 16:03]: Added success notification integration with toast system
[2025-06-25 16:04]: Implemented SSR support with proper hydration/dehydration
[2025-06-25 16:05]: Added development tools and debugging capabilities
[2025-06-25 16:06]: Completed all subtasks with comprehensive type safety and documentation