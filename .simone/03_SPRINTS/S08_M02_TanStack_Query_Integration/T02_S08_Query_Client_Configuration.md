# Task: T02_S08 - Query Client Configuration for Kanban

## Task Details
- **Task ID**: T02_S08
- **Title**: Query Client Configuration for Kanban
- **Description**: Configure query client with optimal settings for Kanban board operations, including cache times, retry logic, and mutation defaults
- **Status**: ready
- **Assignee**: unassigned
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
- [ ] Create query client configuration file at `plugins/tanstack-query.client.ts`
- [ ] Define query defaults with appropriate cache/stale times
- [ ] Configure mutation defaults with optimistic update support
- [ ] Set up error handling integration with existing patterns
- [ ] Implement retry logic with exponential backoff
- [ ] Configure development tools and debugging options
- [ ] Add type declarations for global query client access
- [ ] Create configuration constants file for easy tuning
- [ ] Set up query garbage collection and memory limits
- [ ] Document configuration decisions and rationale

## Acceptance Criteria
- [ ] Query client is globally available in all components
- [ ] Queries respect configured cache and stale times
- [ ] Failed requests retry with exponential backoff
- [ ] Mutations show optimistic updates immediately
- [ ] Errors display via existing toast notification system
- [ ] Configuration is environment-aware (dev vs prod)
- [ ] Memory usage remains stable under heavy load
- [ ] Developer tools available in development mode
- [ ] All configuration values are easily tunable
- [ ] Integration maintains existing error handling patterns

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