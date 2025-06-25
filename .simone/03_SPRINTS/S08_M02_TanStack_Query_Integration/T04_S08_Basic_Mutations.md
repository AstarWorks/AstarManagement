# T04_S08 - Basic Matter Mutations

## Task Details
- **ID**: T04_S08
- **Title**: Basic Matter Mutations
- **Description**: Implement core CRUD mutations (create, update, delete) with optimistic updates and error handling
- **Status**: ready
- **Assignee**: unassigned
- **Created_date**: 2025-06-25
- **Priority**: high
- **Complexity**: medium
- **Dependencies**: ["T03_S08_Core_Queries_Setup"]

## Technical Requirements

### Mutation Operations to Implement
1. **Create Matter** - Add new matters with optimistic rendering
2. **Update Matter** - Modify matter properties with optimistic updates
3. **Delete Matter** - Remove matters with rollback capability

### Integration Points
- TanStack Query mutations with Vue Composition API
- Optimistic updates with automatic rollback on failure
- Pinia store synchronization
- Toast notifications for success/error states
- Error boundary integration

## Technical Guidance

### Current Mutation Patterns in Kanban Store
The Pinia kanban store (`frontend-nuxt-poc/src/stores/kanban/matters.ts`) implements a performOptimisticUpdate pattern:
- Applies optimistic changes immediately for responsive UI
- Tracks pending operations with IDs
- Handles rollback on failure
- Maintains optimisticUpdates Map for state tracking

### API Contract for Mutations
Server endpoints follow RESTful conventions:
- POST `/api/matters` - Create new matter
- PATCH `/api/matters/[id]` - Update matter fields
- DELETE `/api/matters/[id]` - Remove matter

The PATCH endpoint (`frontend-nuxt-poc/src/server/api/matters/[id].patch.ts`) includes:
- Request validation
- Status transition validation
- Optimistic update headers (ETag, Cache-Control)
- Error simulation for testing (5% failure rate)

### Optimistic Update Strategies
The `useOptimisticUpdates` composable provides:
- Pending updates tracking with status (pending/confirmed/failed)
- Operation types: create, update, delete
- Automatic cleanup on confirmation
- Revert functionality for failed operations

### Error Handling Patterns
The `useErrorHandler` composable offers:
- Standardized error creation with severity levels
- API error transformation (network, HTTP status, validation)
- Retry with exponential backoff
- Form-specific error handling
- Error history tracking

### Notification System Integration
Toast plugin (`frontend-nuxt-poc/src/plugins/toast.client.ts`) provides:
- Success/error/warning/info toast types
- Auto-dismiss with configurable duration
- Action buttons for undo operations
- Global state management via reactive store

## Implementation Notes

### Mutation Strategy
1. **Optimistic First**: Apply UI changes immediately for responsiveness
2. **Background Sync**: Execute server mutations asynchronously
3. **Smart Rollback**: Revert only affected data on failure
4. **Offline Queue**: Store mutations when offline, sync when reconnected

### Key Considerations
- Preserve real-time updates during optimistic operations
- Handle race conditions between local mutations and server updates
- Implement proper cleanup for cancelled operations
- Ensure accessibility announcements for mutation results

## Subtasks

### 1. Create Base Mutation Composable
- [ ] Setup `useMatterMutations` composable with TanStack Query
- [ ] Configure mutation defaults (retry, staleTime, cacheTime)
- [ ] Implement mutation context for optimistic updates
- [ ] Add TypeScript types for mutation parameters and responses

### 2. Implement Create Matter Mutation
- [ ] Create `useCreateMatter` mutation hook
- [ ] Add optimistic matter with temporary ID
- [ ] Handle server response with ID replacement
- [ ] Integrate form validation with Zod schemas
- [ ] Add success/error toast notifications

### 3. Implement Update Matter Mutation
- [ ] Create `useUpdateMatter` mutation hook
- [ ] Apply optimistic field updates
- [ ] Handle partial updates (PATCH semantics)
- [ ] Validate status transitions
- [ ] Implement conflict detection

### 4. Implement Delete Matter Mutation
- [ ] Create `useDeleteMatter` mutation hook
- [ ] Add confirmation dialog integration
- [ ] Implement soft delete with undo capability
- [ ] Handle cascade effects (related documents)
- [ ] Add deletion animation

### 5. Error Handling and Recovery
- [ ] Implement retry strategies per mutation type
- [ ] Add offline detection and queueing
- [ ] Create error recovery UI components
- [ ] Handle network timeout scenarios
- [ ] Add telemetry for failure tracking

### 6. Testing and Documentation
- [ ] Write unit tests for each mutation
- [ ] Add integration tests with mock server
- [ ] Test optimistic update scenarios
- [ ] Document mutation patterns
- [ ] Create Storybook examples

## Success Criteria
- All CRUD operations work with optimistic updates
- Proper error handling with user-friendly messages
- No data loss on network failures
- Seamless integration with existing Pinia stores
- Performance: <100ms perceived latency for all operations

## Notes
- Leverage existing patterns from `performOptimisticUpdate` in Pinia store
- Ensure mutations work with SSR/hydration
- Consider implementing mutation batching for performance
- Add telemetry for mutation success/failure rates